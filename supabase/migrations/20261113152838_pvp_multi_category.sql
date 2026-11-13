-- One or more selected categories per room; legacy scalar APIs remain callable.
begin;
create or replace function public.pvp_normalize_categories(p_categories text[])
returns text[] language plpgsql immutable set search_path='' as $$
declare allowed text[] := array['culture','everyday','geography','history','nature','science','sports','technology'];
begin
  if p_categories is null or coalesce(array_ndims(p_categories),0)<>1
    or cardinality(p_categories)>8 or cardinality(p_categories)<1
    or exists(select 1 from unnest(p_categories) c where c is null or not(c=any(allowed))) then
    raise exception 'pvp_invalid_settings';
  end if;
  return array(select distinct c from unnest(p_categories) c order by c);
end;
$$;
revoke all on function public.pvp_normalize_categories(text[]) from public,anon,authenticated;

alter table public.pvp_rooms add column if not exists category_ids text[];
update public.pvp_rooms set category_ids=public.pvp_normalize_categories(
  case when category='all' then array['culture','everyday','geography','history','nature','science','sports','technology'] else array[category] end)
  where category_ids is null;
alter table public.pvp_rooms alter column category_ids set not null;
alter table public.pvp_rooms alter column category_ids set default array['culture','everyday','geography','history','nature','science','sports','technology'];
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.pvp_rooms'::regclass and conname='pvp_rooms_category_ids_valid') then
    alter table public.pvp_rooms add constraint pvp_rooms_category_ids_valid check (
      category_ids=public.pvp_normalize_categories(category_ids)
      and category=case when cardinality(category_ids)=1 then category_ids[1] else 'all' end);
  end if;
end $$;

create or replace function public.pvp_has_category_capacity(p_categories text[],p_count integer)
returns boolean language sql stable set search_path='' as $$
  select p_count in (5,10) and not exists (
    select 1 from (values ('easy',2),('medium',2),('hard',1)) required(level,n)
    where (select count(*) from public.pvp_questions q where q.question->>'categoryId'=any(p_categories)
      and q.question->>'difficulty'=required.level)<required.n*(p_count/5));
$$;
revoke all on function public.pvp_has_category_capacity(text[],integer) from public,anon,authenticated;

create or replace function public.pvp_get_room(p_room uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user(); r public.pvp_rooms; q jsonb; shown jsonb; roster jsonb; t timestamptz;
begin
  perform 1 from public.pvp_rooms where id=p_room for update;
  if not exists (select 1 from public.pvp_players where room_id=p_room and user_id=uid and left_at is null) then
    raise exception 'pvp_not_member';
  end if;
  update public.pvp_players set ready=false where room_id=p_room and user_id=uid
    and last_seen<clock_timestamp()-interval '15 seconds'
    and exists(select 1 from public.pvp_rooms where id=p_room and status='lobby');
  update public.pvp_players set last_seen=clock_timestamp() where room_id=p_room and user_id=uid;
  perform public.pvp_tick(p_room);
  select * into r from public.pvp_rooms where id=p_room;
  t := clock_timestamp();
  q := r.questions->r.question_index;
  if r.status in ('question','reveal','finished') and q is not null then
    shown := jsonb_build_object('id',q->'id','version',q->'version','prompt',q->'prompt',
      'categoryId',q->'categoryId','answers',q->'content'->'answers');
    if r.status in ('reveal','finished') then
      shown := shown || jsonb_build_object('correctIndex',q->'content'->'correctIndex','explanation',q->'explanation','sources',q->'sources');
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.user_id,'name',p.name,'ready',p.ready,'left',p.left_at is not null,
    'reconnectUntil',p.last_seen+interval '90 seconds',
    'connected',p.left_at is null and p.last_seen>=t-interval '15 seconds',
    'score',(select count(*) from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.user_id=p.user_id and a.correct and a.confirmed
      and (a.question_index<r.question_index or r.status in ('reveal','finished'))),
    'answered',exists(select 1 from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id and a.confirmed),
    'answer',(select a.answer from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id
      and a.confirmed and (p.user_id=uid or r.status in ('reveal','finished'))),
    'selection',(select a.answer from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id and p.user_id=uid and not a.confirmed)
  ) order by p.joined_at,p.user_id),'[]'::jsonb) into roster
  from public.pvp_players p where p.room_id=p_room and (p.left_at is null or r.status not in ('lobby','closed'));
  return jsonb_build_object('id',r.id,'code',r.code,'matchId',r.match_id,'hostId',r.host_id,'status',r.status,
    'settingsVersion',r.settings_version,'category',r.category,'categories',r.category_ids,'count',r.question_count,'seconds',r.seconds,'index',r.question_index,
    'serverNow',t,'startsAt',r.starts_at,'deadline',r.deadline,'revealUntil',r.reveal_until,
    'endedEarly',r.ended_early,'question',shown,'players',roster);
end;
$$;

create or replace function public.pvp_create_room_categories(p_name text,p_categories text[],p_count integer default 5,p_seconds integer default 30)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := public.pvp_require_user(); clean_name text := public.pvp_check_name(p_name);
  rid uuid; old_room jsonb; room_code text; cats text[]; legacy_category text;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  old_room := public.pvp_resume_room();
  if old_room is not null then return old_room; end if;
  cats := public.pvp_normalize_categories(p_categories);
  if p_count is null or p_seconds is null or p_seconds not in (15,30)
    or not public.pvp_has_category_capacity(cats,p_count) then raise exception 'pvp_invalid_settings'; end if;
  if (select count(*) from public.pvp_rooms where creator_id=uid and created_at>clock_timestamp()-interval '1 minute')>=3 then raise exception 'pvp_rate_limit'; end if;
  legacy_category := case when cardinality(cats)=1 then cats[1] else 'all' end;
  loop
    room_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    insert into public.pvp_rooms(code,creator_id,host_id,category,category_ids,question_count,seconds)
      values(room_code,uid,uid,legacy_category,cats,p_count,p_seconds)
      on conflict(code) do nothing returning id into rid;
    exit when rid is not null;
  end loop;
  insert into public.pvp_players(room_id,user_id,name,ready) values(rid,uid,clean_name,true);
  return public.pvp_get_room(rid);
end;
$$;

create or replace function public.pvp_configure_room_categories(p_room uuid,p_match uuid,p_version integer,p_categories text[],p_count integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms; cats text[]; legacy_category text;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  if r.status<>'lobby' then raise exception 'pvp_already_started'; end if;
  if p_match is distinct from r.match_id or p_version is distinct from r.settings_version then raise exception 'pvp_stale_settings'; end if;
  cats := public.pvp_normalize_categories(p_categories);
  if p_count is null or p_seconds is null or p_seconds not in (15,30)
    or not public.pvp_has_category_capacity(cats,p_count) then raise exception 'pvp_invalid_settings'; end if;
  if (r.category_ids,r.question_count,r.seconds) is distinct from (cats,p_count,p_seconds) then
    legacy_category := case when cardinality(cats)=1 then cats[1] else 'all' end;
    update public.pvp_rooms set category=legacy_category,category_ids=cats,question_count=p_count,
      seconds=p_seconds,settings_version=settings_version+1 where id=p_room;
    update public.pvp_players set ready=false where room_id=p_room;
  end if;
  return public.pvp_get_room(p_room);
end;
$$;

-- Preserve signatures used by installed clients. A scalar 'all' timer/count edit
-- must not silently replace a newer room's selected subset with all categories.
create or replace function public.pvp_create_room(p_name text,p_category text default 'all',p_count integer default 5,p_seconds integer default 30)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  return public.pvp_create_room_categories(p_name,
    case when p_category='all' then array['culture','everyday','geography','history','nature','science','sports','technology'] else array[p_category] end,
    p_count,p_seconds);
end;
$$;
create or replace function public.pvp_configure_room(p_room uuid,p_match uuid,p_version integer,p_category text,p_count integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); cats text[];
begin
  if p_category='all' and snapshot->>'category'='all' then
    select category_ids into cats from public.pvp_rooms where id=p_room;
  else
    cats := case when p_category='all' then array['culture','everyday','geography','history','nature','science','sports','technology'] else array[p_category] end;
  end if;
  return public.pvp_configure_room_categories(p_room,p_match,p_version,cats,p_count,p_seconds);
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
  if not public.pvp_has_category_capacity(r.category_ids,r.question_count) then raise exception 'pvp_invalid_settings'; end if;
  delete from public.pvp_players where room_id=p_room and left_at is not null;
  levels := case when r.question_count=5 then array['easy','easy','medium','medium','hard']
    else array['easy','easy','easy','easy','medium','medium','medium','medium','hard','hard'] end;
  foreach level in array levels loop
    select q.id,q.question into picked_id,picked from public.pvp_questions q
      where q.question->>'categoryId'=any(r.category_ids)
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

revoke all on function public.pvp_create_room_categories(text,text[],integer,integer),
  public.pvp_configure_room_categories(uuid,uuid,integer,text[],integer,integer),
  public.pvp_create_room(text,text,integer,integer),public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),
  public.pvp_start_room(uuid,uuid),public.pvp_get_room(uuid) from public,anon,authenticated;
grant execute on function public.pvp_create_room_categories(text,text[],integer,integer),
  public.pvp_configure_room_categories(uuid,uuid,integer,text[],integer,integer),
  public.pvp_create_room(text,text,integer,integer),public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),
  public.pvp_start_room(uuid,uuid),public.pvp_get_room(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
