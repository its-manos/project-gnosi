-- Run after 006. Preserve and validate weekly review answers alongside lesson results.
-- Old clients may omit weeklyReviews; server history is retained.
begin;
create or replace function public.save_learning_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  existing_payload jsonb;
  existing_revision bigint;
  previous_events jsonb;
  incoming_events jsonb;
  merged_events jsonb;
  next_payload jsonb;
  entry record;
  missed jsonb;
  missed_index integer;
  previous_index integer;
  affected integer;
  previous_reviews jsonb;
  incoming_reviews jsonb;
  merged_reviews jsonb;
  source_event jsonb;
  old_answer jsonb;
  answer_week date;
begin
  if owner_id is null or owner_id is distinct from p_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 or jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Invalid revision or payload' using errcode = '22023';
  end if;
  select b.payload, b.revision into existing_payload, existing_revision
    from public.learning_sync b where b.user_id = owner_id for update;
  if (existing_revision is null and p_expected_revision <> 0)
    or (existing_revision is not null and existing_revision <> p_expected_revision) then
    raise exception 'Sync document changed; retry.' using errcode = '40001';
  end if;
  previous_events := coalesce(existing_payload->'activity', '{}'::jsonb);
  incoming_events := coalesce(p_payload->'activity', '{}'::jsonb);
  if jsonb_typeof(incoming_events) is distinct from 'object' or jsonb_typeof(previous_events) is distinct from 'object' then
    raise exception 'Invalid activity' using errcode = '22023';
  end if;
  for entry in select * from jsonb_each(incoming_events) loop
    if previous_events ? entry.key then
      if ((previous_events->entry.key) - 'missedQuestionIndices') is distinct from (entry.value - 'missedQuestionIndices')
        or ((previous_events->entry.key) ? 'missedQuestionIndices' and entry.value ? 'missedQuestionIndices'
          and (previous_events->entry.key)->'missedQuestionIndices' is distinct from entry.value->'missedQuestionIndices') then
        raise exception 'Completion event is immutable' using errcode = '22023';
      end if;
      incoming_events := jsonb_set(incoming_events, array[entry.key], (previous_events->entry.key) || entry.value, true);
    end if;
  end loop;
  merged_events := previous_events || incoming_events;
  for entry in select * from jsonb_each(merged_events) loop
    if entry.key !~ '^[a-zA-Z0-9_-]{1,220}$' or jsonb_typeof(entry.value) is distinct from 'object' then
      raise exception 'Invalid activity event' using errcode = '22023';
    end if;
    if not (entry.value ?& array['lessonId','at','wasCompleted','correctCount','questionCount','quizKey'])
      or (select count(*) from jsonb_object_keys(entry.value)) <> (case when entry.value ? 'missedQuestionIndices' then 7 else 6 end)
      or jsonb_typeof(entry.value->'lessonId') is distinct from 'string'
      or (entry.value->>'lessonId') !~ '^[a-zA-Z0-9_-]{1,100}$'
      or jsonb_typeof(entry.value->'at') is distinct from 'number'
      or (entry.value->>'at') !~ '^[0-9]{12,13}$'
      or jsonb_typeof(entry.value->'wasCompleted') is distinct from 'boolean'
      or jsonb_typeof(entry.value->'correctCount') is distinct from 'number'
      or (entry.value->>'correctCount') !~ '^[0-9]{1,3}$'
      or jsonb_typeof(entry.value->'questionCount') is distinct from 'number'
      or (entry.value->>'questionCount') !~ '^[0-9]{1,3}$'
      or jsonb_typeof(entry.value->'quizKey') is distinct from 'string'
      or (entry.value->>'quizKey') !~ '^[a-zA-Z0-9_-]{1,100}$' then
      raise exception 'Invalid activity fields' using errcode = '22023';
    end if;
    if (entry.value->>'at')::numeric < 946684800000 or (entry.value->>'at')::numeric > 4102444800000
      or (entry.value->>'questionCount')::integer < 1 or (entry.value->>'questionCount')::integer > 100
      or (entry.value->>'correctCount')::integer > (entry.value->>'questionCount')::integer then
      raise exception 'Invalid activity range' using errcode = '22023';
    end if;
    if entry.value ? 'missedQuestionIndices' then
      if jsonb_typeof(entry.value->'missedQuestionIndices') is distinct from 'array' then
        raise exception 'Invalid missed questions' using errcode = '22023';
      end if;
      if jsonb_array_length(entry.value->'missedQuestionIndices') <> (entry.value->>'questionCount')::integer - (entry.value->>'correctCount')::integer then
        raise exception 'Missed questions do not match score' using errcode = '22023';
      end if;
      previous_index := -1;
      for missed in select value from jsonb_array_elements(entry.value->'missedQuestionIndices') loop
        if jsonb_typeof(missed) is distinct from 'number' or (missed#>>'{}') !~ '^[0-9]{1,2}$' then
          raise exception 'Invalid missed question index' using errcode = '22023';
        end if;
        missed_index := (missed#>>'{}')::integer;
        if missed_index <= previous_index or missed_index >= (entry.value->>'questionCount')::integer then
          raise exception 'Invalid missed question order or range' using errcode = '22023';
        end if;
        previous_index := missed_index;
      end loop;
    end if;
  end loop;
  previous_reviews := coalesce(existing_payload->'weeklyReviews', '{}'::jsonb);
  incoming_reviews := coalesce(p_payload->'weeklyReviews', '{}'::jsonb);
  if jsonb_typeof(previous_reviews) is distinct from 'object' or jsonb_typeof(incoming_reviews) is distinct from 'object' then
    raise exception 'Invalid weekly reviews' using errcode = '22023';
  end if;
  -- Resolve offline conflicts using the earliest answer, never the highest score.
  merged_reviews := previous_reviews;
  for entry in select * from jsonb_each(incoming_reviews) loop
    if jsonb_typeof(entry.value) is distinct from 'object' then
      raise exception 'Invalid weekly answer' using errcode = '22023';
    end if;
    if not (entry.value ?& array['sourceId','questionIndex','week','answerIndex','at'])
      or (select count(*) from jsonb_object_keys(entry.value)) <> 5
      or jsonb_typeof(entry.value->'sourceId') is distinct from 'string'
      or (entry.value->>'sourceId') !~ '^[a-zA-Z0-9_-]{1,220}$'
      or jsonb_typeof(entry.value->'questionIndex') is distinct from 'number'
      or (entry.value->>'questionIndex') !~ '^[0-9]{1,2}$'
      or jsonb_typeof(entry.value->'answerIndex') is distinct from 'number'
      or (entry.value->>'answerIndex') !~ '^[0-9]{1,2}$'
      or jsonb_typeof(entry.value->'week') is distinct from 'string'
      or (entry.value->>'week') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or jsonb_typeof(entry.value->'at') is distinct from 'number'
      or (entry.value->>'at') !~ '^[0-9]{12,13}$' then
      raise exception 'Invalid weekly answer fields' using errcode = '22023';
    end if;
    if (entry.value->>'at')::numeric < 946684800000 or (entry.value->>'at')::numeric > 4102444800000 then
      raise exception 'Invalid weekly answer date' using errcode = '22023';
    end if;
    source_event := merged_events->(entry.value->>'sourceId');
    if source_event is null or not coalesce((source_event->'missedQuestionIndices') @> jsonb_build_array((entry.value->>'questionIndex')::integer), false) then
      raise exception 'Weekly answer must reference a saved mistake' using errcode = '22023';
    end if;
    answer_week := date_trunc('week', to_timestamp((entry.value->>'at')::numeric / 1000) at time zone 'Europe/Athens')::date;
    if answer_week::text <> entry.value->>'week'
      or (to_timestamp((source_event->>'at')::numeric / 1000) at time zone 'Europe/Athens')::date >= answer_week
      or entry.key <> (entry.value->>'week') || '_' || (source_event->>'lessonId') || '_' || (source_event->>'quizKey') || '_' || (entry.value->>'questionIndex') then
      raise exception 'Invalid weekly identity or eligibility' using errcode = '22023';
    end if;
    old_answer := previous_reviews->entry.key;
    if old_answer is null
      or (entry.value->>'at')::numeric < (old_answer->>'at')::numeric
      or ((entry.value->>'at')::numeric = (old_answer->>'at')::numeric and
        ((entry.value->>'sourceId') collate "C", (entry.value->>'answerIndex')::integer) < ((old_answer->>'sourceId') collate "C", (old_answer->>'answerIndex')::integer)) then
      merged_reviews := jsonb_set(merged_reviews, array[entry.key], entry.value, true);
    end if;
  end loop;
  next_payload := jsonb_set(jsonb_set(p_payload, '{activity}', merged_events, true), '{weeklyReviews}', merged_reviews, true);
  if p_expected_revision = 0 then
    return query insert into public.learning_sync (user_id, payload)
      values (owner_id, next_payload) on conflict (user_id) do nothing
      returning learning_sync.revision, learning_sync.updated_at;
  else
    return query update public.learning_sync b set payload = next_payload,
      revision = b.revision + 1, updated_at = now()
      where b.user_id = owner_id and b.revision = p_expected_revision
      returning b.revision, b.updated_at;
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Sync document changed; retry.' using errcode = '40001'; end if;
end;
$$;
revoke all on function public.save_learning_sync(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_learning_sync(jsonb,bigint,uuid) to authenticated;
commit;
