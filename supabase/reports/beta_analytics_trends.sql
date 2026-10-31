-- OWNER SQL Editor only. 1. Confirm nightly maintenance and actual table size.
select last_run_at, now()-last_run_at as time_since_last_run,
 beta_events_deleted,development_events_deleted
from public.beta_analytics_maintenance;

select relname as table_name, pg_size_pretty(pg_total_relation_size(oid)) as size_including_indexes
from pg_class where relnamespace='public'::regnamespace and relname like 'beta_analytics_%'
 and relkind='r' order by pg_total_relation_size(oid) desc;

-- 2. Finalized daily totals, up to a year. Eight-day buffer accommodates delayed
-- offline events; use raw report 1 for recent activity. These are counts, not IDs.
select day,active_installations,sessions_started,event_count,
 onboarding_completed,onboarding_skipped,lesson_starts,lesson_completions
from public.beta_analytics_daily order by day desc;

-- 3. Per-lesson event totals per finalized day. Completion may occur on a
-- different day from a start; do NOT treat their ratio as a cohort finish rate.
select d.day,x.key as lesson_id,(x.value->>'starts')::bigint as starts,
 (x.value->>'completions')::bigint as completions
from public.beta_analytics_daily d cross join lateral jsonb_each(d.lessons) x
order by d.day desc,starts desc;

-- 4. Screen-view counts per finalized day. These are views, NOT distinct users
-- or last-screen exits; detailed exit analysis stays in the raw 30-day window.
select d.day,x.key as screen,x.value::text::bigint as views
from public.beta_analytics_daily d cross join lateral jsonb_each(d.screens) x
order by d.day desc,views desc;

-- 5. Owner can refresh summaries without waiting for tonight's job.
-- select public.maintain_beta_analytics();

-- 6. Cron status (requires pg_cron enabled). Run separately after setup.
-- select jobid,jobname,schedule,active from cron.job
-- where jobname='gnosi-beta-analytics-retention' and username=current_user;
-- select r.status,r.start_time,r.end_time,r.return_message from cron.job_run_details r
-- join cron.job j using(jobid) where j.jobname='gnosi-beta-analytics-retention'
-- and j.username=current_user order by r.start_time desc limit 10;
