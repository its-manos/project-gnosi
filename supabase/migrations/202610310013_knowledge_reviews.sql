-- Phase 4: compact recall facts + one resumable session. Apply before the app update.
begin;
create or replace function public.merge_knowledge_reviews(p_old jsonb, p_new jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := '{}'::jsonb; payload jsonb; question record; day record; fact jsonb; prior jsonb; compact jsonb; question_result jsonb;
begin
  foreach payload in array array[coalesce(p_old,'{}'::jsonb),coalesce(p_new,'{}'::jsonb)] loop
    if jsonb_typeof(payload) is distinct from 'object' or (select count(*) from jsonb_object_keys(payload)) > 1000 then raise exception 'Invalid knowledge reviews' using errcode='22023'; end if;
    for question in select * from jsonb_each(payload) loop
      if question.key !~ '^[a-zA-Z0-9_:.-]{1,240}$' or question.key in ('__proto__','constructor','prototype') or jsonb_typeof(question.value) is distinct from 'object' or (select count(*) from jsonb_object_keys(question.value)) > 32 then raise exception 'Invalid knowledge question' using errcode='22023'; end if;
      question_result := coalesce(result->question.key,'{}'::jsonb);
      for day in select * from jsonb_each(question.value) loop
        fact := day.value;
        if day.key !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or (day.key::date)::text <> day.key or jsonb_typeof(fact) is distinct from 'object' or (select count(*) from jsonb_object_keys(fact)) <> 4
          or jsonb_typeof(fact->'version') is distinct from 'string' or (fact->>'version') !~ '^[a-zA-Z0-9_:.-]{1,240}$' or fact->>'version' in ('__proto__','constructor','prototype')
          or jsonb_typeof(fact->'answerIndex') is distinct from 'number' or (fact->>'answerIndex') !~ '^[0-9]{1,2}$'
          or jsonb_typeof(fact->'at') is distinct from 'number' or (fact->>'at') !~ '^[0-9]{12,13}$' or (fact->>'at')::bigint not between 946684800000 and 4102444800000
          or to_char(to_timestamp((fact->>'at')::double precision / 1000) at time zone 'Europe/Athens','YYYY-MM-DD') <> day.key
          or jsonb_typeof(fact->'mode') is distinct from 'string' or fact->>'mode' not in ('scheduled','practice') then raise exception 'Invalid knowledge fact' using errcode='22023'; end if;
        prior := question_result->day.key;
        if prior is null or (fact->>'at')::bigint < (prior->>'at')::bigint or ((fact->>'at')::bigint = (prior->>'at')::bigint and
          ((fact->>'version') collate "C",(fact->>'answerIndex') collate "C",(fact->>'mode') collate "C") < ((prior->>'version') collate "C",(prior->>'answerIndex') collate "C",(prior->>'mode') collate "C")) then
          question_result := jsonb_set(question_result,array[day.key],fact,true);
        end if;
      end loop;
      select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into compact from (select * from jsonb_each(question_result) order by key desc limit 32) tail;
      result := jsonb_set(result,array[question.key],compact,true);
    end loop;
  end loop;
  if (select count(*) from jsonb_object_keys(result)) > 1000 then raise exception 'Too many knowledge questions' using errcode='22023'; end if;
  return result;
end;
$$;

create or replace function public.validate_knowledge_session(p_entry jsonb, p_clock bigint)
returns void language plpgsql immutable set search_path = '' as $$
declare v jsonb; n integer; idx integer; i integer; entry record;
begin
  if jsonb_typeof(p_entry) is distinct from 'object' or jsonb_typeof(p_entry->'stamp') is distinct from 'array' or jsonb_array_length(p_entry->'stamp') <> 2
    or jsonb_typeof(p_entry#>'{stamp,0}') is distinct from 'number' or p_entry#>>'{stamp,0}' !~ '^[0-9]{1,16}$' or (p_entry#>>'{stamp,0}')::numeric > p_clock
    or jsonb_typeof(p_entry#>'{stamp,1}') is distinct from 'string' or p_entry#>>'{stamp,1}' !~ '^[a-zA-Z0-9_-]{1,100}$' or not p_entry ? 'value' then raise exception 'Invalid knowledge session stamp' using errcode='22023'; end if;
  v := p_entry->'value'; if v = 'null'::jsonb then return; end if;
  if jsonb_typeof(v) is distinct from 'object' or (select count(*) from jsonb_object_keys(v)) <> 11 or jsonb_typeof(v->'id') is distinct from 'string' or v->>'id' !~ '^[a-zA-Z0-9_:.-]{1,240}$' or v->>'id' in ('__proto__','constructor','prototype')
    or jsonb_typeof(v->'date') is distinct from 'string' or v->>'date' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or ((v->>'date')::date)::text <> v->>'date'
    or jsonb_typeof(v->'mode') is distinct from 'string' or v->>'mode' not in ('scheduled','practice')
    or jsonb_typeof(v->'questionIds') is distinct from 'array' or jsonb_typeof(v->'questionVersions') is distinct from 'array' or jsonb_typeof(v->'beforeStates') is distinct from 'array'
    or jsonb_typeof(v->'answers') is distinct from 'object' or jsonb_typeof(v->'qualifiedIndices') is distinct from 'array'
    or jsonb_typeof(v->'currentIndex') is distinct from 'number' or v->>'currentIndex' !~ '^[0-4]$' or jsonb_typeof(v->'completed') is distinct from 'boolean'
    or jsonb_typeof(v->'earnedXP') is distinct from 'number' or v->>'earnedXP' not in ('0','10') then raise exception 'Invalid knowledge session' using errcode='22023'; end if;
  n := jsonb_array_length(v->'questionIds'); idx := (v->>'currentIndex')::integer;
  if n not between 1 and 5 or idx >= n or jsonb_array_length(v->'questionVersions') <> n or jsonb_array_length(v->'beforeStates') <> n
    or (select count(distinct value) from jsonb_array_elements(v->'questionIds')) <> n
    or (select count(distinct value) from jsonb_array_elements(v->'qualifiedIndices')) <> jsonb_array_length(v->'qualifiedIndices')
    or (v->>'completed' = 'false' and v->>'earnedXP' <> '0') then raise exception 'Invalid knowledge session size' using errcode='22023'; end if;
  for i in 0..n-1 loop
    if jsonb_typeof(v->'questionIds'->i) <> 'string' or v->'questionIds'->>i !~ '^[a-zA-Z0-9_:.-]{1,240}$' or v->'questionIds'->>i in ('__proto__','constructor','prototype')
      or jsonb_typeof(v->'questionVersions'->i) <> 'string' or v->'questionVersions'->>i !~ '^[a-zA-Z0-9_:.-]{1,240}$' or v->'questionVersions'->>i in ('__proto__','constructor','prototype')
      or jsonb_typeof(v->'beforeStates'->i) <> 'string' or v->'beforeStates'->>i not in ('new','learning','familiar','mastered') then raise exception 'Invalid knowledge session question' using errcode='22023'; end if;
    if i < idx and not (v->'answers') ? i::text then raise exception 'Missing review answer' using errcode='22023'; end if;
  end loop;
  for entry in select * from jsonb_each(v->'answers') loop
    if entry.key !~ '^[0-4]$' or entry.key::integer > idx or jsonb_typeof(entry.value) <> 'number' or entry.value#>>'{}' !~ '^[0-9]{1,2}$' then raise exception 'Invalid review answer' using errcode='22023'; end if;
  end loop;
  for entry in select value from jsonb_array_elements(v->'qualifiedIndices') loop
    if jsonb_typeof(entry.value) <> 'number' or entry.value#>>'{}' !~ '^[0-4]$' or (entry.value#>>'{}')::integer > idx or not (v->'answers') ? (entry.value#>>'{}') then raise exception 'Invalid qualified review' using errcode='22023'; end if;
  end loop;
  if v->>'completed' = 'true' and (idx <> n-1 or (select count(*) from jsonb_object_keys(v->'answers')) <> n) then raise exception 'Incomplete review session' using errcode='22023'; end if;
end;
$$;
revoke all on function public.merge_knowledge_reviews(jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.validate_knowledge_session(jsonb,bigint) from public, anon, authenticated;
do $$ begin
  if to_regprocedure('public.save_learning_sync_before_knowledge(jsonb,bigint,uuid)') is null then
    alter function public.save_learning_sync(jsonb,bigint,uuid) rename to save_learning_sync_before_knowledge;
  end if;
end $$;
revoke all on function public.save_learning_sync_before_knowledge(jsonb,bigint,uuid) from public, anon, authenticated;
create or replace function public.save_learning_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare previous jsonb; next_payload jsonb; old_session jsonb; new_session jsonb; chosen jsonb; new_clock bigint;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Authentication required' using errcode='42501'; end if;
  if octet_length(p_payload::text) > 2097152 or jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'clock') is distinct from 'number' or p_payload->>'clock' !~ '^[0-9]{1,16}$' or (p_payload->>'clock')::numeric > 9007199254740991 then raise exception 'Invalid payload' using errcode='22023'; end if;
  select payload into previous from public.learning_sync where user_id = auth.uid() for update;
  next_payload := jsonb_set(p_payload,'{knowledgeReviews}',public.merge_knowledge_reviews(previous->'knowledgeReviews',p_payload->'knowledgeReviews'),true);
  old_session := previous->'knowledgeSession'; new_session := p_payload->'knowledgeSession'; new_clock := (p_payload->>'clock')::bigint;
  if new_session is not null then perform public.validate_knowledge_session(new_session,new_clock); end if;
  chosen := old_session;
  if old_session is null then chosen := new_session;
  elsif new_session is not null and ((new_session#>>'{stamp,0}')::bigint > (old_session#>>'{stamp,0}')::bigint or
    ((new_session#>>'{stamp,0}')::bigint = (old_session#>>'{stamp,0}')::bigint and (new_session#>>'{stamp,1}') collate "C" > (old_session#>>'{stamp,1}') collate "C") or
    (new_session->'stamp' = old_session->'stamp' and regexp_replace((new_session->'value')::text,'[[:space:]]','','g') collate "C" > regexp_replace((old_session->'value')::text,'[[:space:]]','','g') collate "C")) then chosen := new_session; end if;
  if chosen is not null then
    next_payload := jsonb_set(next_payload,'{knowledgeSession}',chosen,true);
    next_payload := jsonb_set(next_payload,'{clock}',to_jsonb(greatest(new_clock,(chosen#>>'{stamp,0}')::bigint)),true);
  end if;
  return query select * from public.save_learning_sync_before_knowledge(next_payload,p_expected_revision,p_user_id);
end;
$$;
revoke all on function public.save_learning_sync(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_learning_sync(jsonb,bigint,uuid) to authenticated;
commit;
