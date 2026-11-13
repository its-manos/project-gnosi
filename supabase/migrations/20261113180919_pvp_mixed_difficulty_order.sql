-- Preserve category selection, quotas and in-progress snapshots.
begin;

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
  -- Deal once on the server: all players share the saved order on every poll.
  -- Keep an easy opener and shuffle only the remaining selected questions.
  select jsonb_build_array(deck->0) || jsonb_agg(q.value order by random()) into deck
    from jsonb_array_elements(deck) with ordinality q(value,n) where n>1;
  used_ids := array(select q->>'id' from jsonb_array_elements(deck) q);
  t := clock_timestamp();
  update public.pvp_rooms set status='question',
    question_history=array(select h from unnest(r.question_history) with ordinality x(h,n)
      where not(h=any(used_ids)) order by n) || used_ids,
    questions=deck,question_index=0,starts_at=t+interval '3 seconds',deadline=t+make_interval(secs=>r.seconds+3),
    reveal_until=null,ended_early=false where id=p_room;
  return public.pvp_get_room(p_room);
end;
$$;

revoke all on function public.pvp_start_room(uuid,uuid) from public,anon,authenticated;
grant execute on function public.pvp_start_room(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
