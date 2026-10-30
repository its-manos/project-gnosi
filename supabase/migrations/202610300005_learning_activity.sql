-- Run after 001–004. Preserve dated activity even when an older app writes
-- a progress document without the new optional field. No tables are dropped.
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
  affected integer;
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
    if previous_events ? entry.key and previous_events->entry.key is distinct from entry.value then
      raise exception 'Completion event is immutable' using errcode = '22023';
    end if;
  end loop;
  merged_events := previous_events || incoming_events;
  for entry in select * from jsonb_each(merged_events) loop
    if entry.key !~ '^[a-zA-Z0-9_-]{1,220}$' or jsonb_typeof(entry.value) is distinct from 'object' then
      raise exception 'Invalid activity event' using errcode = '22023';
    end if;
    if not (entry.value ?& array['lessonId','at','wasCompleted','correctCount','questionCount','quizKey'])
      or (select count(*) from jsonb_object_keys(entry.value)) <> 6
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
  end loop;
  next_payload := jsonb_set(p_payload, '{activity}', merged_events, true);
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
