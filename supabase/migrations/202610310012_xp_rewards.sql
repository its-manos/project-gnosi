-- Apply before publishing Phase 2. No new tables; keep XP when old clients sync.
begin;
create or replace function public.merge_xp_rewards(p_old jsonb, p_new jsonb, p_domain text)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := '{}'::jsonb; payload jsonb; entry record; cap integer; date_key text;
begin
  if p_domain not in ('learning','daily') then raise exception 'Invalid reward domain' using errcode='22023'; end if;
  foreach payload in array array[coalesce(p_old,'{}'::jsonb),coalesce(p_new,'{}'::jsonb)] loop
    if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 1048576 then raise exception 'Invalid rewards' using errcode='22023'; end if;
    for entry in select * from jsonb_each(payload) loop
      cap := -1; date_key := null;
      if entry.key ~ '^seen:[a-zA-Z0-9_:./-]{1,240}$' then cap := 0;
      elsif p_domain='learning' and entry.key ~ '^lesson:[a-zA-Z0-9_-]{1,100}$' then cap := 3030;
      elsif p_domain='learning' and entry.key ~ '^category:[a-zA-Z0-9_-]{1,100}$' then cap := 25;
      elsif p_domain='learning' and entry.key ~ '^recall:[a-zA-Z0-9_-]{1,100}:[0-9]{1,2}$' then cap := 30;
      elsif p_domain='learning' and entry.key ~ '^review:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then cap := 10; date_key := substring(entry.key from 8);
      elsif p_domain='daily' and entry.key ~ '^day:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then cap := 250; date_key := substring(entry.key from 5);
      end if;
      if date_key is not null and (date_key::date)::text <> date_key then raise exception 'Invalid reward date' using errcode='22023'; end if;
      if cap < 0 or jsonb_typeof(entry.value) is distinct from 'number' or (entry.value#>>'{}') !~ '^[0-9]{1,4}$' or (entry.value#>>'{}')::numeric > cap then raise exception 'Invalid reward entry' using errcode='22023'; end if;
      result := jsonb_set(result, array[entry.key], to_jsonb(greatest(coalesce((result->>entry.key)::integer,0),(entry.value#>>'{}')::integer)), true);
    end loop;
  end loop;
  return result;
end;
$$;
revoke all on function public.merge_xp_rewards(jsonb,jsonb,text) from public, anon, authenticated;

-- Preserve the established validators and revision/RLS behavior underneath.
do $$ begin
  if to_regprocedure('public.save_learning_sync_before_xp(jsonb,bigint,uuid)') is null then
    alter function public.save_learning_sync(jsonb,bigint,uuid) rename to save_learning_sync_before_xp;
  end if;
  if to_regprocedure('public.save_daily_sync_before_xp(jsonb,bigint,uuid)') is null then
    alter function public.save_daily_sync(jsonb,bigint,uuid) rename to save_daily_sync_before_xp;
  end if;
end $$;
revoke all on function public.save_learning_sync_before_xp(jsonb,bigint,uuid) from public, anon, authenticated;
revoke all on function public.save_daily_sync_before_xp(jsonb,bigint,uuid) from public, anon, authenticated;
create or replace function public.save_learning_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare previous jsonb; merged jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
  select payload into previous from public.learning_sync where user_id = auth.uid() for update;
  merged := public.merge_xp_rewards(previous->'rewards',p_payload->'rewards','learning');
  return query select * from public.save_learning_sync_before_xp(jsonb_set(p_payload,'{rewards}',merged,true),p_expected_revision,p_user_id);
end;
$$;
create or replace function public.save_daily_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare previous jsonb; merged jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
  select payload into previous from public.daily_sync where user_id = auth.uid() for update;
  merged := public.merge_xp_rewards(previous->'rewards',p_payload->'rewards','daily');
  return query select * from public.save_daily_sync_before_xp(jsonb_set(p_payload,'{rewards}',merged,true),p_expected_revision,p_user_id);
end;
$$;
revoke all on function public.save_learning_sync(jsonb,bigint,uuid) from public, anon, authenticated;
revoke all on function public.save_daily_sync(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_learning_sync(jsonb,bigint,uuid) to authenticated;
grant execute on function public.save_daily_sync(jsonb,bigint,uuid) to authenticated;
commit;
