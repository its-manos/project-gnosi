begin;
-- Deliberately separate from learning/account records. App roles cannot read data.
create table if not exists public.beta_analytics_events (
  event_id uuid primary key,
  install_id uuid not null,
  session_id uuid not null,
  event_name text not null check (event_name in ('session_started','session_backgrounded','screen_viewed','onboarding_step_viewed','onboarding_completed','onboarding_skipped','lesson_started','lesson_progress','lesson_completed','lesson_left','lesson_interrupted')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  environment text not null check (environment in ('beta','development')),
  platform text not null check (platform in ('android','ios','web','other')),
  revision text not null check (revision = 'beta-analytics-1'),
  properties jsonb not null check (jsonb_typeof(properties) = 'object' and octet_length(properties::text) <= 2048)
);
alter table public.beta_analytics_events enable row level security;
revoke all on table public.beta_analytics_events from public, anon, authenticated;
create index if not exists beta_analytics_install_time on public.beta_analytics_events (install_id, occurred_at);
create index if not exists beta_analytics_name_time on public.beta_analytics_events (event_name, occurred_at);
create index if not exists beta_analytics_received on public.beta_analytics_events (received_at);

-- Insert-only capability for guests and signed-in testers. SECURITY DEFINER is
-- required because clients have no direct table privileges. No payload account ID.
create or replace function public.ingest_beta_events(events jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare e jsonb; p jsonb; k text; n text; t timestamptz; device uuid;
begin
  if jsonb_typeof(events) <> 'array' or jsonb_array_length(events) < 1 or jsonb_array_length(events) > 50 then
    raise exception 'Invalid analytics batch';
  end if;
  for e in select value from jsonb_array_elements(events) loop
    if jsonb_typeof(e) <> 'object' or e - array['event_id','install_id','session_id','event_name','occurred_at','environment','platform','revision','properties'] <> '{}'::jsonb then
      raise exception 'Invalid analytics envelope';
    end if;
    if not (e ?& array['event_id','install_id','session_id','event_name','occurred_at','environment','platform','revision','properties']) then raise exception 'Missing analytics fields'; end if;
    p := e->'properties'; n := e->>'event_name'; device := (e->>'install_id')::uuid;
    t := (e->>'occurred_at')::timestamptz;
    if t is null or t > now() + interval '1 day' or t < now() - interval '8 days' then raise exception 'Invalid event time'; end if;
    if jsonb_typeof(p) <> 'object' or octet_length(p::text) > 2048 then raise exception 'Invalid analytics properties'; end if;
    for k in select jsonb_object_keys(p) loop
      if k in ('lesson_id','category_id','subcategory_id') then
        if jsonb_typeof(p->k) <> 'string' or not (p->>k ~ '^[a-z0-9][a-z0-9-]{0,119}$') then raise exception 'Invalid content ID'; end if;
      elsif k = 'attempt_id' then
        if jsonb_typeof(p->k) <> 'string' or not (p->>k ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$') then raise exception 'Invalid attempt ID'; end if;
      elsif k = 'screen' then
        if jsonb_typeof(p->k) <> 'string' or p->>k not in ('home','progress','category','subcategory','lesson','quiz','results','review','weekly-review','account','saved','search','daily','daily-preferences','welcome') then raise exception 'Invalid screen'; end if;
      elsif k in ('answered_count','total_questions','last_paragraph','onboarding_step') then
        if jsonb_typeof(p->k) <> 'number' or not (p->>k ~ '^[0-9]{1,5}$') or (p->>k)::integer > 10000 then raise exception 'Invalid count'; end if;
        if k = 'onboarding_step' and (p->>k)::integer not between 1 and 4 then raise exception 'Invalid onboarding step'; end if;
      elsif k in ('replay','resumed') then
        if jsonb_typeof(p->k) <> 'boolean' then raise exception 'Invalid flag'; end if;
      elsif k = 'reason' then
        if jsonb_typeof(p->k) <> 'string' or p->>k not in ('navigation','background','cold_start','timeout','account_change') then raise exception 'Invalid reason'; end if;
      else raise exception 'Unapproved analytics property';
      end if;
    end loop;
    -- A private-beta abuse ceiling, not authentication or bot-proofing. A public
    -- endpoint can be spoofed; do not use these events for rewards or billing.
    perform pg_advisory_xact_lock(hashtextextended(device::text, 0));
    if (select count(*) from public.beta_analytics_events where install_id = device and received_at > now() - interval '1 day') >= 2000
       and not exists (select 1 from public.beta_analytics_events where event_id = (e->>'event_id')::uuid) then
      raise exception 'Analytics rate limit';
    end if;
    insert into public.beta_analytics_events(event_id,install_id,session_id,event_name,occurred_at,environment,platform,revision,properties)
      values ((e->>'event_id')::uuid, device, (e->>'session_id')::uuid, n, t, e->>'environment', e->>'platform', e->>'revision', p)
      on conflict (event_id) do nothing;
  end loop;
end;
$$;
revoke all on function public.ingest_beta_events(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_beta_events(jsonb) to anon, authenticated;
comment on table public.beta_analytics_events is 'Opt-in pseudonymous beta events. SQL-editor/admin access only; no authenticated/anon read policies.';
commit;
