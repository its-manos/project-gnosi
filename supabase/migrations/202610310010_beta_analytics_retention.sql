begin;
-- Owner-only summaries; no app payload or native changes.
create index if not exists beta_analytics_env_day on public.beta_analytics_events
 (environment, ((occurred_at at time zone 'Europe/Athens')::date));
create table if not exists public.beta_analytics_daily (
  day date primary key,
  active_installations bigint not null,
  sessions_started bigint not null,
  event_count bigint not null,
  onboarding_completed bigint not null,
  onboarding_skipped bigint not null,
  lesson_starts bigint not null,
  lesson_completions bigint not null,
  lessons jsonb not null default '{}'::jsonb,
  screens jsonb not null default '{}'::jsonb,
  summarized_at timestamptz not null default now()
);
-- Compact pseudonymous cohort bookkeeping: one row/device, no event journey.
-- Retained for up to 365 days after last observation to avoid treating an
-- established returning device as new when its raw history expires.
create table if not exists public.beta_analytics_cohorts (
  install_id uuid primary key,
  first_day date not null,
  last_day date not null,
  returned_d1 boolean not null default false,
  returned_d7 boolean not null default false
);
create index if not exists beta_analytics_cohorts_first_day on public.beta_analytics_cohorts(first_day);
create index if not exists beta_analytics_cohorts_last_day on public.beta_analytics_cohorts(last_day);
-- Frozen mature cohort counts survive individual bookkeeping cleanup.
create table if not exists public.beta_analytics_retention_daily (
  cohort_day date primary key,
  installations bigint not null,
  d1_returned bigint not null,
  d7_returned bigint not null,
  summarized_at timestamptz not null default now()
);
create table if not exists public.beta_analytics_maintenance (
  singleton boolean primary key default true check (singleton),
  last_run_at timestamptz not null,
  beta_events_deleted bigint not null,
  development_events_deleted bigint not null
);
alter table public.beta_analytics_daily enable row level security;
alter table public.beta_analytics_cohorts enable row level security;
alter table public.beta_analytics_retention_daily enable row level security;
alter table public.beta_analytics_maintenance enable row level security;
revoke all on public.beta_analytics_daily, public.beta_analytics_cohorts,
 public.beta_analytics_retention_daily, public.beta_analytics_maintenance from public, anon, authenticated;

create or replace function public.maintain_beta_analytics()
returns void language plpgsql security invoker set search_path = '' as $$
declare
 today date := (now() at time zone 'Europe/Athens')::date;
 beta_deleted bigint;
 dev_deleted bigint;
begin
 -- One maintenance transaction at a time. Raw ingestion remains independent.
 if not pg_try_advisory_xact_lock(6649202610310010::bigint) then return; end if;

 -- First update first-seen identities from ALL remaining activity, including
 -- newly arrived offline uploads. If first_day moves earlier, recalculate D1/D7
 -- against the still-retained raw window; otherwise preserve observed returns.
 with activity as (
   select install_id, min((occurred_at at time zone 'Europe/Athens')::date) as first_day,
     max((occurred_at at time zone 'Europe/Athens')::date) as last_day
   from public.beta_analytics_events where environment='beta'
     and event_name in ('session_started','screen_viewed') group by 1
 ), resolved as (
   select a.install_id, least(a.first_day, c.first_day) as first_day,
     greatest(a.last_day, c.last_day) as last_day,
     case when c.first_day is not null and c.first_day <= a.first_day then c.returned_d1 else false end as old_d1,
     case when c.first_day is not null and c.first_day <= a.first_day then c.returned_d7 else false end as old_d7
   from activity a left join public.beta_analytics_cohorts c using(install_id)
 )
 insert into public.beta_analytics_cohorts(install_id,first_day,last_day,returned_d1,returned_d7)
 select r.install_id,r.first_day,r.last_day,
   r.old_d1 or exists(select 1 from public.beta_analytics_events e where e.install_id=r.install_id and e.environment='beta' and e.event_name in ('session_started','screen_viewed') and (e.occurred_at at time zone 'Europe/Athens')::date=r.first_day+1),
   r.old_d7 or exists(select 1 from public.beta_analytics_events e where e.install_id=r.install_id and e.environment='beta' and e.event_name in ('session_started','screen_viewed') and (e.occurred_at at time zone 'Europe/Athens')::date=r.first_day+7)
 from resolved r
 on conflict(install_id) do update set first_day=excluded.first_day,last_day=excluded.last_day,
   returned_d1=excluded.returned_d1,returned_d7=excluded.returned_d7;

 -- Ingestion accepts at most 8-day-old timestamps. Finalize only full days
 -- older than that window; retries cannot add late events to a finalized day.
 -- Existing daily totals are immutable: never recompute from a truncated tail.
 insert into public.beta_analytics_daily(day,active_installations,sessions_started,event_count,
   onboarding_completed,onboarding_skipped,lesson_starts,lesson_completions,lessons,screens)
 select d.day,
   count(distinct e.install_id) filter(where e.event_name in ('session_started','screen_viewed')),
   count(distinct e.session_id) filter(where e.event_name='session_started'),count(*),
   count(distinct e.install_id) filter(where e.event_name='onboarding_completed' and e.properties->>'replay'='false'),
   count(distinct e.install_id) filter(where e.event_name='onboarding_skipped' and e.properties->>'replay'='false'),
   count(*) filter(where e.event_name='lesson_started'),count(*) filter(where e.event_name='lesson_completed'),
   coalesce((select jsonb_object_agg(x.lesson_id,jsonb_build_object('starts',x.starts,'completions',x.completions)) from (
      select z.properties->>'lesson_id' as lesson_id,
        count(*) filter(where z.event_name='lesson_started') as starts,
        count(*) filter(where z.event_name='lesson_completed') as completions
      from public.beta_analytics_events z where z.environment='beta' and (z.occurred_at at time zone 'Europe/Athens')::date=d.day
        and z.event_name in ('lesson_started','lesson_completed') and z.properties ? 'lesson_id' group by 1
   ) x),'{}'::jsonb),
   coalesce((select jsonb_object_agg(x.screen,x.views) from (
      select z.properties->>'screen' as screen,count(*) as views
      from public.beta_analytics_events z where z.environment='beta' and z.event_name='screen_viewed'
        and (z.occurred_at at time zone 'Europe/Athens')::date=d.day and z.properties ? 'screen' group by 1
   ) x),'{}'::jsonb)
 from (select distinct (occurred_at at time zone 'Europe/Athens')::date as day from public.beta_analytics_events
       where environment='beta' and (occurred_at at time zone 'Europe/Athens')::date < today-8) d
 join public.beta_analytics_events e on e.environment='beta' and (e.occurred_at at time zone 'Europe/Athens')::date=d.day
 where not exists(select 1 from public.beta_analytics_daily old where old.day=d.day)
 group by d.day
 on conflict(day) do nothing;

 -- D7 must fully elapse, then allow 8 further days for offline uploads. Freeze
 -- at day 17; all client-valid cohort/D1/D7 events have had time to arrive.
 insert into public.beta_analytics_retention_daily(cohort_day,installations,d1_returned,d7_returned)
 select first_day,count(*),count(*) filter(where returned_d1),count(*) filter(where returned_d7)
 from public.beta_analytics_cohorts where first_day < today-16 group by first_day
 on conflict(cohort_day) do nothing;

 -- Rollup and deletion are atomic. Delete raw beta data only after that date
 -- has a summary, so an aggregation error never silently destroys history.
 delete from public.beta_analytics_events e
 where e.environment='beta' and e.received_at < now()-interval '30 days'
   and exists(select 1 from public.beta_analytics_daily d where d.day=(e.occurred_at at time zone 'Europe/Athens')::date);
 get diagnostics beta_deleted = row_count;
 delete from public.beta_analytics_events where environment='development' and received_at < now()-interval '7 days';
 get diagnostics dev_deleted = row_count;

 delete from public.beta_analytics_daily where day < today-365;
 delete from public.beta_analytics_retention_daily where cohort_day < today-365;
 delete from public.beta_analytics_cohorts where last_day < today-365;
 insert into public.beta_analytics_maintenance(singleton,last_run_at,beta_events_deleted,development_events_deleted)
 values(true,now(),beta_deleted,dev_deleted)
 on conflict(singleton) do update set last_run_at=excluded.last_run_at,
   beta_events_deleted=excluded.beta_events_deleted,development_events_deleted=excluded.development_events_deleted;
end;
$$;
revoke all on function public.maintain_beta_analytics() from public, anon, authenticated;
-- Owner performs initial rollup/cleanup now; scheduled execution is installed by
-- 202610310011_beta_analytics_schedule.sql after enabling pg_cron.
select public.maintain_beta_analytics();
commit;
