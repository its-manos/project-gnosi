-- Keep old clients compatible: their pvp_answer calls still confirm immediately.
-- Drafts stay private and unscored until confirmed or locked by the deadline.
begin;
alter table public.pvp_answers add column if not exists confirmed boolean not null default true;
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
    'score',(select count(*) from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.user_id=p.user_id and a.correct and a.confirmed
      and (a.question_index<r.question_index or r.status in ('reveal','finished'))),
    'answered',exists(select 1 from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id and a.confirmed),
    'answer',(select a.answer from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id
      and a.confirmed and (p.user_id=uid or r.status in ('reveal','finished'))),
    'selection',(select a.answer from public.pvp_answers a where a.room_id=p_room and a.match_id=r.match_id and a.question_index=r.question_index and a.user_id=p.user_id and p.user_id=uid and not a.confirmed)
  ) order by p.joined_at,p.user_id),'[]'::jsonb) into roster
  from public.pvp_players p where p.room_id=p_room and (p.left_at is null or r.status not in ('lobby','closed'));
  return jsonb_build_object('id',r.id,'code',r.code,'matchId',r.match_id,'hostId',r.host_id,'status',r.status,
    'category',r.category,'count',r.question_count,'seconds',r.seconds,'index',r.question_index,
    'serverNow',t,'startsAt',r.starts_at,'deadline',r.deadline,'revealUntil',r.reveal_until,
    'endedEarly',r.ended_early,'question',shown,'players',roster);
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
  insert into public.pvp_answers(room_id,match_id,question_index,user_id,answer,correct,confirmed)
    values(p_room,r.match_id,r.question_index,auth.uid(),p_answer,p_answer=(q->'content'->>'correctIndex')::integer,true)
    on conflict(room_id,match_id,question_index,user_id) do update
      set answer=excluded.answer,correct=excluded.correct,confirmed=true
      where not public.pvp_answers.confirmed;
  return public.pvp_get_room(p_room);
end;
$$;

create or replace function public.pvp_select_answer(p_room uuid, p_match uuid, p_index integer, p_answer integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare snapshot jsonb := public.pvp_get_room(p_room); r public.pvp_rooms; q jsonb;
begin
  select * into r from public.pvp_rooms where id=p_room;
  if p_match is distinct from r.match_id or p_index is distinct from r.question_index then raise exception 'pvp_stale_round'; end if;
  if r.status<>'question' or clock_timestamp()<r.starts_at or clock_timestamp()>=r.deadline then return snapshot; end if;
  q := r.questions->r.question_index;
  if p_answer is null or p_answer<0 or p_answer>=jsonb_array_length(q->'content'->'answers') then raise exception 'pvp_invalid_answer'; end if;
  insert into public.pvp_answers(room_id,match_id,question_index,user_id,answer,correct,confirmed)
    values(p_room,r.match_id,r.question_index,auth.uid(),p_answer,p_answer=(q->'content'->>'correctIndex')::integer,false)
    on conflict(room_id,match_id,question_index,user_id) do update
      set answer=excluded.answer,correct=excluded.correct
      where not public.pvp_answers.confirmed;
  return public.pvp_get_room(p_room);
end;
$$;
revoke all on function public.pvp_select_answer(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.pvp_select_answer(uuid,uuid,integer,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
