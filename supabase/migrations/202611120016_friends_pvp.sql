-- Private, account-based games. All reads/writes go through membership-checked RPCs.
-- No Realtime publication, cron, service-role client key or client-supplied scores.
begin;

create table if not exists public.pvp_questions (
  id text primary key,
  question jsonb not null
);
create table if not exists public.pvp_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator_id uuid not null references auth.users(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null default gen_random_uuid(),
  status text not null default 'lobby' check (status in ('lobby','question','reveal','finished','closed')),
  category text not null,
  question_count integer not null check (question_count in (5,10)),
  seconds integer not null check (seconds in (15,30)),
  question_index integer not null default 0,
  questions jsonb not null default '[]',
  starts_at timestamptz,
  deadline timestamptz,
  reveal_until timestamptz,
  ended_early boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '2 hours'
);
create index if not exists pvp_rooms_creator_idx on public.pvp_rooms(creator_id,created_at desc);
create index if not exists pvp_rooms_host_idx on public.pvp_rooms(host_id);
create table if not exists public.pvp_players (
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  ready boolean not null default false,
  joined_at timestamptz not null default clock_timestamp(),
  last_seen timestamptz not null default clock_timestamp(),
  left_at timestamptz,
  primary key (room_id,user_id)
);
create index if not exists pvp_players_user_idx on public.pvp_players(user_id,room_id);
create table if not exists public.pvp_answers (
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  match_id uuid not null,
  question_index integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer integer not null check (answer between 0 and 3),
  correct boolean not null,
  primary key (room_id,match_id,question_index,user_id)
);
create index if not exists pvp_answers_user_idx on public.pvp_answers(user_id);
create table if not exists public.pvp_join_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  attempts integer not null
);

alter table public.pvp_questions enable row level security;
alter table public.pvp_rooms enable row level security;
alter table public.pvp_players enable row level security;
alter table public.pvp_answers enable row level security;
alter table public.pvp_join_limits enable row level security;
revoke all on public.pvp_questions, public.pvp_rooms, public.pvp_players, public.pvp_answers, public.pvp_join_limits from public, anon, authenticated;

-- Internal functions have no caller grants. Every entry point obtains the same
-- room lock before counting seats, changing membership, advancing or answering.
create or replace function public.pvp_require_user()
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'pvp_auth_required'; end if;
  return auth.uid();
end;
$$;

create or replace function public.pvp_check_name(p_name text)
returns text language plpgsql immutable set search_path = '' as $$
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 or p_name ~ '[[:cntrl:]]' then
    raise exception 'pvp_invalid_name';
  end if;
  return btrim(p_name);
end;
$$;

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
    update public.pvp_rooms set status='finished', ended_early=true where id=p_room; return;
  end if;
  if r.status='question' and (t>=r.deadline or (t>=r.starts_at and not exists (
    select 1 from public.pvp_players p where p.room_id=p_room and p.left_at is null and not exists (
      select 1 from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id
    )
  ))) then
    update public.pvp_rooms set status='reveal', reveal_until=t+interval '7 seconds' where id=p_room;
  elsif r.status='reveal' and t>=r.reveal_until then
    if r.question_index+1>=r.question_count then
      update public.pvp_rooms set status='finished' where id=p_room;
    else
      -- Resume at a fresh full-duration question after an app/background gap.
      update public.pvp_rooms set status='question',question_index=question_index+1,
        starts_at=t+interval '2 seconds',deadline=t+make_interval(secs=>r.seconds+2),reveal_until=null where id=p_room;
    end if;
  end if;
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
    'connected',p.left_at is null and p.last_seen>=t-interval '15 seconds',
    'score',(select count(*) from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.user_id=p.user_id and a.correct
      and (a.question_index<r.question_index or r.status in ('reveal','finished'))),
    'answered',exists(select 1 from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id),
    'answer',(select a.answer from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id
      and (p.user_id=uid or r.status in ('reveal','finished')))
  ) order by p.joined_at,p.user_id),'[]'::jsonb) into roster
  from public.pvp_players p where p.room_id=p_room and (p.left_at is null or r.status not in ('lobby','closed'));
  return jsonb_build_object('id',r.id,'code',r.code,'matchId',r.match_id,'hostId',r.host_id,'status',r.status,
    'category',r.category,'count',r.question_count,'seconds',r.seconds,'index',r.question_index,
    'serverNow',t,'startsAt',r.starts_at,'deadline',r.deadline,'revealUntil',r.reveal_until,
    'endedEarly',r.ended_early,'question',shown,'players',roster);
end;
$$;

create or replace function public.pvp_resume_room()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user(); rid uuid;
begin
  select r.id into rid from public.pvp_rooms r join public.pvp_players p on p.room_id=r.id
    where p.user_id=uid and p.left_at is null and r.status<>'closed' and r.expires_at>clock_timestamp()
    order by r.created_at desc limit 1;
  if rid is null then return null; end if;
  return public.pvp_get_room(rid);
end;
$$;

create or replace function public.pvp_create_room(p_name text, p_category text default 'all', p_count integer default 5, p_seconds integer default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user(); clean_name text := public.pvp_check_name(p_name); rid uuid; old_room jsonb; room_code text;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  old_room := public.pvp_resume_room();
  if old_room is not null then return old_room; end if;
  if p_category is null or p_category not in ('all','history','science','nature','technology','culture','geography') or p_count is null or p_count not in (5,10) or p_seconds is null or p_seconds not in (15,30)
    or (select count(*) from public.pvp_questions where p_category='all' or question->>'categoryId'=p_category)<p_count then
    raise exception 'pvp_invalid_settings';
  end if;
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

create or replace function public.pvp_join_room(p_name text, p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user(); clean_name text := public.pvp_check_name(p_name); r public.pvp_rooms; attempts integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  -- Return a structured error rather than raising here: unsuccessful guesses
  -- must commit the rate-limit counter instead of rolling it back.
  insert into public.pvp_join_limits values(uid,clock_timestamp(),1)
    on conflict(user_id) do update set
      attempts=case when public.pvp_join_limits.window_start<clock_timestamp()-interval '1 minute' then 1 else public.pvp_join_limits.attempts+1 end,
      window_start=case when public.pvp_join_limits.window_start<clock_timestamp()-interval '1 minute' then clock_timestamp() else public.pvp_join_limits.window_start end
    returning pvp_join_limits.attempts into attempts;
  if attempts>20 then return jsonb_build_object('error','pvp_rate_limit'); end if;
  select * into r from public.pvp_rooms where code=upper(btrim(p_code)) for update;
  if not found or r.expires_at<=clock_timestamp() or r.status='closed' then return jsonb_build_object('error','pvp_not_found'); end if;
  if exists(select 1 from public.pvp_players where room_id=r.id and user_id=uid and left_at is null) then return public.pvp_get_room(r.id); end if;
  if exists(select 1 from public.pvp_players p join public.pvp_rooms other on other.id=p.room_id
    where p.user_id=uid and p.left_at is null and other.status<>'closed' and other.expires_at>clock_timestamp()) then return jsonb_build_object('error','pvp_already_in_room'); end if;
  perform public.pvp_tick(r.id);
  select * into r from public.pvp_rooms where id=r.id;
  if r.status='closed' then return jsonb_build_object('error','pvp_not_found'); end if;
  if r.status<>'lobby' then return jsonb_build_object('error','pvp_already_started'); end if;
  if (select count(*) from public.pvp_players where room_id=r.id and left_at is null)>=4 then return jsonb_build_object('error','pvp_room_full'); end if;
  insert into public.pvp_players(room_id,user_id,name) values(r.id,uid,clean_name)
    on conflict(room_id,user_id) do update set name=excluded.name,ready=false,left_at=null,last_seen=clock_timestamp(),joined_at=clock_timestamp();
  return public.pvp_get_room(r.id);
end;
$$;

create or replace function public.pvp_set_ready(p_room uuid, p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room);
begin
  if snapshot->>'status'='lobby' and p_ready is not null then
    update public.pvp_players set ready=p_ready where room_id=p_room and user_id=auth.uid();
  end if;
  return public.pvp_get_room(p_room);
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
    select question from public.pvp_questions where r.category='all' or question->>'categoryId'=r.category order by random() limit r.question_count
  ) picked;
  if jsonb_array_length(deck) is distinct from r.question_count then raise exception 'pvp_invalid_settings'; end if;
  t := clock_timestamp();
  update public.pvp_rooms set status='question',questions=deck,question_index=0,starts_at=t+interval '3 seconds',
    deadline=t+make_interval(secs=>r.seconds+3),reveal_until=null,ended_early=false where id=p_room;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_answer(p_room uuid, p_match uuid, p_index integer, p_answer integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms; q jsonb;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if p_match is distinct from r.match_id or p_index is distinct from r.question_index then raise exception 'pvp_stale_round'; end if;
  if r.status<>'question' or clock_timestamp()<r.starts_at or clock_timestamp()>=r.deadline then return snapshot; end if;
  q := r.questions->r.question_index;
  if p_answer is null or p_answer<0 or p_answer>=jsonb_array_length(q->'content'->'answers') then raise exception 'pvp_invalid_answer'; end if;
  insert into public.pvp_answers(room_id,match_id,question_index,user_id,answer,correct)
    values(p_room,r.match_id,r.question_index,auth.uid(),p_answer,p_answer=(q->'content'->>'correctIndex')::integer)
    on conflict do nothing;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_rematch(p_room uuid, p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if r.host_id<>auth.uid() then raise exception 'pvp_host_only'; end if;
  -- A repeated rematch from a lost response must not reset the new lobby.
  if p_match is distinct from r.match_id then return snapshot; end if;
  if r.status<>'finished' then return snapshot; end if;
  delete from public.pvp_players where room_id=p_room and left_at is not null;
  update public.pvp_rooms set status='lobby',match_id=gen_random_uuid(),question_index=0,questions='[]',starts_at=null,
    deadline=null,reveal_until=null,ended_early=false where id=p_room;
  update public.pvp_players set ready=(user_id=r.host_id) where room_id=p_room;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_leave_room(p_room uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pvp_require_user();
begin
  perform 1 from public.pvp_rooms where id=p_room for update;
  update public.pvp_players set left_at=clock_timestamp(),ready=false where room_id=p_room and user_id=uid and left_at is null;
  if found then perform public.pvp_tick(p_room); end if;
  return null;
end;
$$;

revoke all on function public.pvp_require_user(), public.pvp_check_name(text), public.pvp_tick(uuid),
  public.pvp_get_room(uuid), public.pvp_resume_room(), public.pvp_create_room(text,text,integer,integer),
  public.pvp_join_room(text,text), public.pvp_set_ready(uuid,boolean), public.pvp_start_room(uuid,uuid),
  public.pvp_answer(uuid,uuid,integer,integer), public.pvp_rematch(uuid,uuid), public.pvp_leave_room(uuid) from public, anon, authenticated;
grant execute on function public.pvp_get_room(uuid), public.pvp_resume_room(), public.pvp_create_room(text,text,integer,integer),
  public.pvp_join_room(text,text), public.pvp_set_ready(uuid,boolean), public.pvp_start_room(uuid,uuid),
  public.pvp_answer(uuid,uuid,integer,integer), public.pvp_rematch(uuid,uuid), public.pvp_leave_room(uuid) to authenticated;

commit;
