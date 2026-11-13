-- Capacity checks include the per-difficulty quota, not just the total count.
create or replace function public.pvp_has_question_capacity(p_category text,p_count integer)
returns boolean language sql stable set search_path='' as $$
  select p_category in ('all','history','science','nature','technology','culture','geography','sports','everyday')
    and p_count in (5,10) and not exists (
      select 1 from (values ('easy',2),('medium',2),('hard',1)) required(level,n)
      where (select count(*) from public.pvp_questions q
        where (p_category='all' or q.question->>'categoryId'=p_category)
          and q.question->>'difficulty'=required.level) < required.n*(p_count/5)
    );
$$;
revoke all on function public.pvp_has_question_capacity(text,integer) from public,anon,authenticated;

create or replace function public.pvp_create_room(p_name text,p_category text default 'all',p_count integer default 5,p_seconds integer default 30)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := public.pvp_require_user(); clean_name text := public.pvp_check_name(p_name); rid uuid; old_room jsonb; room_code text;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  old_room := public.pvp_resume_room();
  if old_room is not null then return old_room; end if;
  if p_category is null or p_count is null or p_seconds is null or p_seconds not in (15,30)
    or not public.pvp_has_question_capacity(p_category,p_count) then raise exception 'pvp_invalid_settings'; end if;
  if (select count(*) from public.pvp_rooms where creator_id=uid and created_at>clock_timestamp()-interval '1 minute')>=3 then raise exception 'pvp_rate_limit'; end if;
  loop
    room_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    insert into public.pvp_rooms(code,creator_id,host_id,category,question_count,seconds)
      values(room_code,uid,uid,p_category,p_count,p_seconds) on conflict(code) do nothing returning id into rid;
    exit when rid is not null;
  end loop;
  insert into public.pvp_players(room_id,user_id,name,ready) values(rid,uid,clean_name,true);
  return public.pvp_get_room(rid);
end;
$$;

create or replace function public.pvp_configure_room(p_room uuid,p_match uuid,p_version integer,p_category text,p_count integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  if r.status<>'lobby' then raise exception 'pvp_already_started'; end if;
  if p_match is distinct from r.match_id or p_version is distinct from r.settings_version then raise exception 'pvp_stale_settings'; end if;
  if p_category is null or p_count is null or p_seconds is null or p_seconds not in (15,30)
    or not public.pvp_has_question_capacity(p_category,p_count) then raise exception 'pvp_invalid_settings'; end if;
  if (r.category,r.question_count,r.seconds) is distinct from (p_category,p_count,p_seconds) then
    update public.pvp_rooms set category=p_category,question_count=p_count,seconds=p_seconds,settings_version=settings_version+1 where id=p_room;
    update public.pvp_players set ready=false where room_id=p_room;
  end if;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_start_room(p_room uuid,p_match uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms; deck jsonb := '[]'::jsonb;
  picked jsonb; picked_id text; used_ids text[] := '{}'; used_categories text[] := '{}';
  levels text[]; level text; t timestamptz;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  if p_match is distinct from r.match_id then raise exception 'pvp_stale_round'; end if;
  if r.status<>'lobby' then return snapshot; end if;
  if (select count(*) from public.pvp_players where room_id=p_room and left_at is null)<2
    or exists(select 1 from public.pvp_players where room_id=p_room and left_at is null and not ready) then raise exception 'pvp_not_ready'; end if;
  if not public.pvp_has_question_capacity(r.category,r.question_count) then raise exception 'pvp_invalid_settings'; end if;
  delete from public.pvp_players where room_id=p_room and left_at is not null;
  levels := case when r.question_count=5 then array['easy','easy','medium','medium','hard']
    else array['easy','easy','easy','easy','medium','medium','medium','medium','hard','hard'] end;
  foreach level in array levels loop
    select q.id,q.question into picked_id,picked from public.pvp_questions q
      where (r.category='all' or q.question->>'categoryId'=r.category)
        and q.question->>'difficulty'=level and not(q.id=any(used_ids))
      order by (q.id=any(r.question_history)),
        (select count(*) from unnest(used_categories) c where c=q.question->>'categoryId'),
        coalesce(array_position(r.question_history,q.id),0),random() limit 1;
    if picked is null then raise exception 'pvp_invalid_settings'; end if;
    deck := deck || jsonb_build_array(picked);
    used_ids := array_append(used_ids,picked_id);
    used_categories := array_append(used_categories,picked->>'categoryId');
  end loop;
  t := clock_timestamp();
  update public.pvp_rooms set status='question',
    question_history=array(select h from unnest(r.question_history) with ordinality x(h,n)
      where not(h=any(used_ids)) order by n) || used_ids,
    questions=deck,question_index=0,starts_at=t+interval '3 seconds',deadline=t+make_interval(secs=>r.seconds+3),
    reveal_until=null,ended_early=false where id=p_room;
  return public.pvp_get_room(p_room);
end;
$$;
-- Preserve membership/host checks and private answer snapshots from prior releases.
revoke all on function public.pvp_create_room(text,text,integer,integer),
  public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),public.pvp_start_room(uuid,uuid) from public,anon,authenticated;
grant execute on function public.pvp_create_room(text,text,integer,integer),
  public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),public.pvp_start_room(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
