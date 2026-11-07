-- Unified mistakes: bounded facts per scored question revision, plus a resumable typed review.
-- Apply before distributing the app update. Older clients retain these fields on save.
begin;
-- Match the client's compact jsonb key ordering without stripping spaces inside strings.
create or replace function public.mistake_json_tie(p_value jsonb)
returns text language sql immutable set search_path = '' as $$
  select case jsonb_typeof(p_value)
    when 'object' then (select '{' || coalesce(string_agg(to_jsonb(key)::text || ':' || public.mistake_json_tie(value), ',' order by octet_length(key), key collate "C"),'') || '}' from jsonb_each(p_value))
    when 'array' then (select '[' || coalesce(string_agg(public.mistake_json_tie(value), ',' order by ordinality),'') || ']' from jsonb_array_elements(p_value) with ordinality)
    else p_value::text end;
$$;
revoke all on function public.mistake_json_tie(jsonb) from public, anon, authenticated;
create or replace function public.merge_mistakes(p_old jsonb, p_new jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := '{}'::jsonb; payload jsonb; entry record; row jsonb; prior jsonb; chosen jsonb; wrong jsonb;
begin
  foreach payload in array array[coalesce(p_old,'{}'::jsonb),coalesce(p_new,'{}'::jsonb)] loop
    if jsonb_typeof(payload) is distinct from 'object' or (select count(*) from jsonb_object_keys(payload)) > 5000 then raise exception 'Invalid mistakes' using errcode='22023'; end if;
    for entry in select * from jsonb_each(payload) loop
      row := entry.value;
      if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row)) <> 4
        or jsonb_typeof(row->'questionId') is distinct from 'string' or row->>'questionId' !~ '^[a-zA-Z0-9_:.-]{1,240}$' or row->>'questionId' in ('__proto__','constructor','prototype')
        or jsonb_typeof(row->'version') is distinct from 'string' or row->>'version' !~ '^[a-zA-Z0-9_:.-]{1,240}$' or row->>'version' in ('__proto__','constructor','prototype')
        or entry.key <> (row->>'questionId') || '::' || (row->>'version')
        or jsonb_typeof(row->'correctAt') is distinct from 'number' or row->>'correctAt' !~ '^[0-9]{1,13}$' or (row->>'correctAt')::bigint > 4102444800000
        or not row ? 'wrong' then raise exception 'Invalid mistake record' using errcode='22023'; end if;
      wrong := row->'wrong';
      if wrong <> 'null'::jsonb then
        if jsonb_typeof(wrong) is distinct from 'object' or (select count(*) from jsonb_object_keys(wrong)) <> 2 or not wrong ? 'value'
          or jsonb_typeof(wrong->'at') is distinct from 'number' or wrong->>'at' !~ '^[0-9]{1,13}$' or (wrong->>'at')::bigint not between 1 and 4102444800000
          or length(public.mistake_json_tie(wrong->'value')) > 4096 then raise exception 'Invalid wrong answer' using errcode='22023'; end if;
      end if;
      prior := result->entry.key;
      if prior is not null then
        chosen := prior->'wrong';
        if chosen = 'null'::jsonb then chosen := wrong;
        elsif wrong <> 'null'::jsonb and ((wrong->>'at')::bigint > (chosen->>'at')::bigint or
          ((wrong->>'at')::bigint = (chosen->>'at')::bigint and public.mistake_json_tie(wrong->'value') collate "C" > public.mistake_json_tie(chosen->'value') collate "C")) then chosen := wrong; end if;
        row := jsonb_set(row,'{wrong}',chosen);
        row := jsonb_set(row,'{correctAt}',to_jsonb(greatest((row->>'correctAt')::bigint,(prior->>'correctAt')::bigint)));
      end if;
      result := jsonb_set(result,array[entry.key],row,true);
    end loop;
  end loop;
  if (select count(*) from jsonb_object_keys(result)) > 5000 then raise exception 'Too many mistakes' using errcode='22023'; end if;
  return result;
end;
$$;
create or replace function public.validate_mistake_session(p_entry jsonb, p_clock bigint)
returns void language plpgsql immutable set search_path = '' as $$
declare v jsonb; quiz jsonb; n integer; idx integer; i integer; q jsonb; answer record;
begin
  if jsonb_typeof(p_entry) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_entry)) <> 2
    or jsonb_typeof(p_entry->'stamp') is distinct from 'array' or jsonb_array_length(p_entry->'stamp') <> 2
    or jsonb_typeof(p_entry#>'{stamp,0}') is distinct from 'number' or p_entry#>>'{stamp,0}' !~ '^[0-9]{1,16}$' or (p_entry#>>'{stamp,0}')::numeric > p_clock
    or jsonb_typeof(p_entry#>'{stamp,1}') is distinct from 'string' or p_entry#>>'{stamp,1}' !~ '^[a-zA-Z0-9_-]{1,100}$' or not p_entry ? 'value' then raise exception 'Invalid mistake session stamp' using errcode='22023'; end if;
  v := p_entry->'value'; if v = 'null'::jsonb then return; end if;
  if jsonb_typeof(v) is distinct from 'object' or (select count(*) from jsonb_object_keys(v)) <> 2
    or jsonb_typeof(v->'earnedXP') is distinct from 'number' or v->>'earnedXP' not in ('0','10') or jsonb_typeof(v->'quiz') is distinct from 'object' then raise exception 'Invalid mistake session' using errcode='22023'; end if;
  quiz := v->'quiz';
  if (select count(*) from jsonb_object_keys(quiz)) <> 7 or quiz->>'schemaVersion' is distinct from '1' or quiz->>'mode' is distinct from 'review'
    or jsonb_typeof(quiz->'id') is distinct from 'string' or quiz->>'id' !~ '^mr1:[a-zA-Z0-9_:.-]{1,236}$'
    or jsonb_typeof(quiz->'questions') is distinct from 'array' or jsonb_typeof(quiz->'answers') is distinct from 'object'
    or jsonb_typeof(quiz->'currentIndex') is distinct from 'number' or quiz->>'currentIndex' !~ '^[0-4]$' or jsonb_typeof(quiz->'completed') is distinct from 'boolean' then raise exception 'Invalid mistake quiz' using errcode='22023'; end if;
  n := jsonb_array_length(quiz->'questions'); idx := (quiz->>'currentIndex')::integer;
  if n not between 1 and 5 or idx >= n or (quiz->>'completed' = 'false' and v->>'earnedXP' <> '0')
    or (select count(distinct value->>'id') from jsonb_array_elements(quiz->'questions')) <> n then raise exception 'Invalid mistake quiz size' using errcode='22023'; end if;
  for i in 0..n-1 loop
    q := quiz->'questions'->i;
    if jsonb_typeof(q) is distinct from 'object' or jsonb_typeof(q->'id') is distinct from 'string' or q->>'id' !~ '^[a-zA-Z0-9_:.-]{1,240}$' or q->>'id' in ('__proto__','constructor','prototype')
      or jsonb_typeof(q->'version') is distinct from 'string' or q->>'version' !~ '^[a-zA-Z0-9_:.-]{1,240}$' or q->>'version' in ('__proto__','constructor','prototype')
      or jsonb_typeof(q->'type') is distinct from 'string' or q->>'type' not in ('multiple-choice','multiple-select','matching','ordering','spot-the-mistake','fill-in-the-blank') then raise exception 'Invalid review question' using errcode='22023'; end if;
    if i < idx and not (quiz->'answers') ? (q->>'id') then raise exception 'Missing review answer' using errcode='22023'; end if;
  end loop;
  for answer in select * from jsonb_each(quiz->'answers') loop
    select value into q from jsonb_array_elements(quiz->'questions') with ordinality where value->>'id' = answer.key and ordinality <= idx + 1;
    if q is null or jsonb_typeof(answer.value) is distinct from 'object' or (select count(*) from jsonb_object_keys(answer.value)) <> 2
      or answer.value->>'questionVersion' is distinct from q->>'version' or not answer.value ? 'value' then raise exception 'Invalid typed review answer' using errcode='22023'; end if;
  end loop;
  if quiz->>'completed' = 'true' and (idx <> n-1 or (select count(*) from jsonb_object_keys(quiz->'answers')) <> n) then raise exception 'Incomplete mistake review' using errcode='22023'; end if;
end;
$$;
revoke all on function public.merge_mistakes(jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.validate_mistake_session(jsonb,bigint) from public, anon, authenticated;
do $$ begin
  if to_regprocedure('public.save_learning_sync_before_mistakes(jsonb,bigint,uuid)') is null then
    alter function public.save_learning_sync(jsonb,bigint,uuid) rename to save_learning_sync_before_mistakes;
  end if;
end $$;
revoke all on function public.save_learning_sync_before_mistakes(jsonb,bigint,uuid) from public, anon, authenticated;
create or replace function public.save_learning_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare previous jsonb; next_payload jsonb; old_session jsonb; new_session jsonb; chosen jsonb; new_clock bigint;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Authentication required' using errcode='42501'; end if;
  if octet_length(p_payload::text) > 2097152 or jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'clock') is distinct from 'number' or p_payload->>'clock' !~ '^[0-9]{1,16}$' or (p_payload->>'clock')::numeric > 9007199254740991 then raise exception 'Invalid payload' using errcode='22023'; end if;
  select payload into previous from public.learning_sync where user_id = auth.uid() for update;
  next_payload := jsonb_set(p_payload,'{mistakes}',public.merge_mistakes(previous->'mistakes',p_payload->'mistakes'),true);
  old_session := previous->'mistakeSession'; new_session := p_payload->'mistakeSession'; new_clock := (p_payload->>'clock')::bigint;
  if new_session is not null then perform public.validate_mistake_session(new_session,new_clock); end if;
  chosen := old_session;
  if old_session is null then chosen := new_session;
  elsif new_session is not null and ((new_session#>>'{stamp,0}')::bigint > (old_session#>>'{stamp,0}')::bigint or
    ((new_session#>>'{stamp,0}')::bigint = (old_session#>>'{stamp,0}')::bigint and (new_session#>>'{stamp,1}') collate "C" > (old_session#>>'{stamp,1}') collate "C") or
    (new_session->'stamp' = old_session->'stamp' and public.mistake_json_tie(new_session->'value') collate "C" > public.mistake_json_tie(old_session->'value') collate "C")) then chosen := new_session; end if;
  if chosen is not null then
    next_payload := jsonb_set(next_payload,'{mistakeSession}',chosen,true);
    next_payload := jsonb_set(next_payload,'{clock}',to_jsonb(greatest(new_clock,(chosen#>>'{stamp,0}')::bigint)),true);
  end if;
  return query select * from public.save_learning_sync_before_mistakes(next_payload,p_expected_revision,p_user_id);
end;
$$;
revoke all on function public.save_learning_sync(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_learning_sync(jsonb,bigint,uuid) to authenticated;
commit;
