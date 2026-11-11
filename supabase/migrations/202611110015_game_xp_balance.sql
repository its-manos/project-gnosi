-- Apply before releasing the XP balance and mini-game client.
-- Per-word/question receipts merge by maximum; clients clamp each game/date
-- bucket to 30/20 XP after union, including concurrent offline activity.
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
      elsif p_domain='learning' and entry.key ~ '^game:(hangman|quick):[0-9]{4}-[0-9]{2}-[0-9]{2}:[a-zA-Z0-9_:-]{1,100}$' then
        cap := case when split_part(entry.key,':',2)='hangman' then 10 else 2 end;
        date_key := split_part(entry.key,':',3);
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

commit;
