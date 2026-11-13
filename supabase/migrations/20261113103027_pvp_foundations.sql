-- Private room history, revision-checked lobby rules and completed-match reviews.
begin;
alter table public.pvp_rooms add column if not exists question_history text[] not null default '{}';
alter table public.pvp_rooms add column if not exists settings_version integer not null default 0;
update public.pvp_rooms r set question_history=array(select q->>'id' from jsonb_array_elements(r.questions) q)
  where cardinality(question_history)=0 and jsonb_array_length(questions)>0;
create table if not exists public.pvp_matches(
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  match_id uuid not null, questions jsonb not null, participant_ids uuid[] not null,
  ended_early boolean not null, finished_at timestamptz not null default clock_timestamp(),
  primary key(room_id,match_id)
);
alter table public.pvp_matches enable row level security;
revoke all on public.pvp_matches from public,anon,authenticated;
create or replace function public.pvp_archive_match(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pvp_matches(room_id,match_id,questions,participant_ids,ended_early)
    select r.id,r.match_id,
      (select coalesce(jsonb_agg(q.value order by q.ordinality),'[]'::jsonb)
       from jsonb_array_elements(r.questions) with ordinality q where q.ordinality<=r.question_index+1),
      array(select p.user_id from public.pvp_players p where p.room_id=r.id),r.ended_early
    from public.pvp_rooms r where r.id=p_room and r.status='finished'
    on conflict(room_id,match_id) do nothing;
end;
$$;
revoke all on function public.pvp_archive_match(uuid) from public,anon,authenticated;
create or replace function public.pvp_tick(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.pvp_rooms; t timestamptz := clock_timestamp(); n integer; next_host uuid;
begin
  select * into r from public.pvp_rooms where id=p_room for update;
  if not found then raise exception 'pvp_not_found'; end if;
  if r.status='closed' then return; end if;
  if r.expires_at <= t then
    update public.pvp_rooms set status='closed' where id=p_room; return;
  end if;
  -- Lobby seats expire after 90s. During a match, retain disconnected players
  -- so they can resume; their unanswered questions simply time out.
  if r.status='lobby' then
    update public.pvp_players set ready=false where room_id=p_room and last_seen<t-interval '15 seconds';
    update public.pvp_players set left_at=t,ready=false
      where room_id=p_room and left_at is null and last_seen < t-interval '90 seconds';
  end if;
  select count(*) into n from public.pvp_players where room_id=p_room and left_at is null;
  if n=0 then update public.pvp_rooms set status='closed' where id=p_room; return; end if;
  if not exists (select 1 from public.pvp_players where room_id=p_room and user_id=r.host_id and left_at is null and last_seen >= t-interval '90 seconds') then
    select user_id into next_host from public.pvp_players where room_id=p_room and left_at is null
      order by (last_seen >= t-interval '90 seconds') desc, joined_at,user_id limit 1;
    update public.pvp_rooms set host_id=next_host where id=p_room;
  end if;
  if r.status in ('question','reveal') and n<2 then
    update public.pvp_rooms set status='finished', ended_early=true where id=p_room;
    perform public.pvp_archive_match(p_room); return;
  end if;
  -- A saved selection becomes final at the server deadline, without a client RPC.
  if r.status='question' and clock_timestamp()>=r.deadline then
    update public.pvp_answers a set confirmed=true
      where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and not a.confirmed
      and exists(select 1 from public.pvp_players p where p.room_id=p_room and p.user_id=a.user_id and p.left_at is null);
  end if;
  if r.status='question' and (clock_timestamp()>=r.deadline or (t>=r.starts_at and not exists (
    select 1 from public.pvp_players p where p.room_id=p_room and p.left_at is null and not exists (
      select 1 from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id and a.confirmed
    )
  ))) then
    update public.pvp_rooms set status='reveal', reveal_until=t+interval '3 seconds' where id=p_room;
  elsif r.status='reveal' and t>=r.reveal_until then
    if r.question_index+1>=r.question_count then
      update public.pvp_rooms set status='finished' where id=p_room;
    else
      -- Resume at a fresh full-duration question after an app/background gap.
      update public.pvp_rooms set status='question',question_index=question_index+1,
        starts_at=t+interval '2 seconds',deadline=t+make_interval(secs=>r.seconds+2),reveal_until=null where id=p_room;
    end if;
  end if;
  perform public.pvp_archive_match(p_room);
end;
$$;
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
    'settingsVersion',r.settings_version,'category',r.category,'count',r.question_count,'seconds',r.seconds,'index',r.question_index,
    'serverNow',t,'startsAt',r.starts_at,'deadline',r.deadline,'revealUntil',r.reveal_until,
    'endedEarly',r.ended_early,'question',shown,'players',roster);
end;
$$;
create or replace function public.pvp_start_room(p_room uuid, p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms; deck jsonb; t timestamptz;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  if p_match is distinct from r.match_id then raise exception 'pvp_stale_round'; end if;
  if r.status<>'lobby' then return snapshot; end if;
  if (select count(*) from public.pvp_players where room_id=p_room and left_at is null)<2 or
    exists(select 1 from public.pvp_players where room_id=p_room and left_at is null and not ready) then raise exception 'pvp_not_ready'; end if;
  -- Only the seats present at this start belong to the new match's standings.
  delete from public.pvp_players where room_id=p_room and left_at is not null;
  select jsonb_agg(question) into deck from (
    select question from public.pvp_questions where r.category='all' or question->>'categoryId'=r.category order by coalesce(array_position(r.question_history,id),0),random() limit r.question_count
  ) picked;
  if jsonb_array_length(deck) is distinct from r.question_count then raise exception 'pvp_invalid_settings'; end if;
  t := clock_timestamp();
  update public.pvp_rooms set status='question',
    question_history=array(select h from unnest(r.question_history) with ordinality x(h,n)
      where not exists(select 1 from jsonb_array_elements(deck) q where q->>'id'=h) order by n)
      ||array(select q->>'id' from jsonb_array_elements(deck) q),questions=deck,question_index=0,starts_at=t+interval '3 seconds',
    deadline=t+make_interval(secs=>r.seconds+3),reveal_until=null,ended_early=false where id=p_room;
  return public.pvp_get_room(p_room);
end;
$$;
create or replace function public.pvp_set_ready(p_room uuid, p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room);
begin
  if snapshot->>'status'='lobby' and p_ready is not null then
    if (snapshot->>'settingsVersion')::integer>0 and p_ready then raise exception 'pvp_stale_settings'; end if;
    update public.pvp_players set ready=p_ready where room_id=p_room and user_id=auth.uid();
  end if;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_configure_room(p_room uuid,p_match uuid,p_version integer,p_category text,p_count integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  if r.status<>'lobby' then raise exception 'pvp_already_started'; end if;
  if p_match is distinct from r.match_id or p_version is distinct from r.settings_version then raise exception 'pvp_stale_settings'; end if;
  if p_category is null or p_category not in ('all','history','science','nature','technology','culture','geography')
    or p_count is null or p_count not in (5,10) or p_seconds is null or p_seconds not in (15,30)
    or (select count(*) from public.pvp_questions where p_category='all' or question->>'categoryId'=p_category)<p_count then
    raise exception 'pvp_invalid_settings';
  end if;
  if (r.category,r.question_count,r.seconds) is distinct from (p_category,p_count,p_seconds) then
    update public.pvp_rooms set category=p_category,question_count=p_count,seconds=p_seconds,settings_version=settings_version+1 where id=p_room;
    update public.pvp_players set ready=false where room_id=p_room;
  end if;
  return public.pvp_get_room(p_room);
end;
$$;
create or replace function public.pvp_ready_for_settings(p_room uuid,p_match uuid,p_version integer,p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room);
begin
  if p_match is distinct from (snapshot->>'matchId')::uuid or p_version is distinct from (snapshot->>'settingsVersion')::integer then
    raise exception 'pvp_stale_settings';
  end if;
  if snapshot->>'status'='lobby' and p_ready is not null then
    update public.pvp_players set ready=p_ready where room_id=p_room and user_id=auth.uid();
  end if;
  return public.pvp_get_room(p_room);
end;
$$;
create or replace function public.pvp_get_review(p_room uuid,p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user(); m public.pvp_matches; items jsonb;
begin
  select * into m from public.pvp_matches where room_id=p_room and match_id=p_match;
  if not found or not (uid=any(m.participant_ids)) or not exists(
    select 1 from public.pvp_rooms where id=p_room and expires_at>clock_timestamp()) then raise exception 'pvp_review_unavailable'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('question',jsonb_build_object(
      'id',q.value->'id','version',q.value->'version','prompt',q.value->'prompt','categoryId',q.value->'categoryId',
      'answers',q.value->'content'->'answers','correctIndex',q.value->'content'->'correctIndex',
      'explanation',q.value->'explanation','sources',q.value->'sources'),
      'answer',a.answer,'correct',coalesce(a.correct,false)) order by q.ordinality),'[]'::jsonb) into items
    from jsonb_array_elements(m.questions) with ordinality q
    left join public.pvp_answers a on a.room_id=p_room and a.match_id=p_match and a.question_index=q.ordinality-1 and a.user_id=uid and a.confirmed;
  return jsonb_build_object('matchId',p_match,'endedEarly',m.ended_early,'finishedAt',m.finished_at,'items',items);
end;
$$;
revoke all on function public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),
  public.pvp_ready_for_settings(uuid,uuid,integer,boolean),public.pvp_get_review(uuid,uuid) from public,anon,authenticated;
grant execute on function public.pvp_configure_room(uuid,uuid,integer,text,integer,integer),
  public.pvp_ready_for_settings(uuid,uuid,integer,boolean),public.pvp_get_review(uuid,uuid) to authenticated;
select public.pvp_archive_match(id) from public.pvp_rooms where status='finished';
notify pgrst, 'reload schema';
commit;
