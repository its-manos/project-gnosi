-- Run each SELECT separately in Supabase SQL Editor as project owner/admin.
-- Installation IDs are pseudonymous devices, not unique people. DEV excluded.
-- 1. Daily observed activity (Europe/Athens).
select (occurred_at at time zone 'Europe/Athens')::date as day,
 count(distinct install_id) as active_installations,
 count(distinct session_id) filter (where event_name = 'session_started') as sessions_started
from public.beta_analytics_events
where environment = 'beta' and occurred_at >= now() - interval '14 days'
 and event_name in ('session_started','screen_viewed')
group by 1 order by 1 desc;

-- 2. First-run onboarding funnel among consenting installations that were
-- actually observed at step 1. Tour replays and existing users opting in later
-- are excluded. A 24-hour wait avoids labelling current tours as drop-offs.
with entered as (
 select install_id, min(occurred_at) as entered_at
 from public.beta_analytics_events
 where environment='beta' and event_name='onboarding_step_viewed'
 and properties->>'onboarding_step'='1' and properties->>'replay'='false'
 group by 1
), observed as (
 select i.install_id, i.entered_at,
 bool_or(e.event_name='onboarding_step_viewed' and e.properties->>'onboarding_step'='2') as step_2,
 bool_or(e.event_name='onboarding_step_viewed' and e.properties->>'onboarding_step'='3') as step_3,
 bool_or(e.event_name='onboarding_step_viewed' and e.properties->>'onboarding_step'='4') as step_4,
 bool_or(e.event_name='onboarding_completed') as completed,
 bool_or(e.event_name='onboarding_skipped') as skipped
 from entered i left join public.beta_analytics_events e on e.install_id=i.install_id
 and e.environment='beta' and e.properties->>'replay'='false' and e.occurred_at>=i.entered_at
 group by 1,2
)
select count(*) as observed_starters,
 count(*) filter(where step_2) as saw_modes,
 count(*) filter(where step_3) as saw_interests,
 count(*) filter(where step_4) as saw_sendoff,
 count(*) filter(where completed) as completed,
 round(100.0*count(*) filter(where completed)/nullif(count(*),0),1) as completion_percent,
 count(*) filter(where skipped and not completed) as skipped_without_completion,
 count(*) filter(where not completed and not skipped and entered_at < now()-interval '24 hours') as no_outcome_observed_after_24h
from observed;

-- 3. Lesson visits. Starts count openings of the reader, including resumes and
-- replays, never merely opening previously saved results. Recent unfinished
-- visits stay 'open_or_unknown'; backgrounding alone is not abandonment.
with visits as (
 select properties->>'attempt_id' as attempt_id,
 max(properties->>'lesson_id') as lesson_id,
 bool_or(event_name='lesson_started') as started,
 bool_or(event_name='lesson_completed') as completed,
 bool_or(event_name='lesson_left') as navigated_away,
 bool_or(event_name='lesson_interrupted') as interrupted,
 max((properties->>'answered_count')::integer) as last_answered,
 max((properties->>'last_paragraph')::integer) as last_paragraph
 from public.beta_analytics_events
 where environment='beta' and properties ? 'attempt_id'
 group by 1
)
select lesson_id, count(*) filter(where started) as visits_started,
 count(*) filter(where started and completed) as visits_completed,
 count(*) filter(where started and not completed and navigated_away) as left_without_finishing,
 count(*) filter(where started and not completed and not navigated_away and interrupted) as interrupted,
 count(*) filter(where started and not completed and not navigated_away and not interrupted) as open_or_unknown,
 round(100.0*count(*) filter(where started and completed)/nullif(count(*) filter(where started),0),1) as visit_completion_percent
from visits group by 1 order by visits_started desc;

-- 4. Explicit exits / recoverable interruptions: last checkpoint + last paragraph
-- whose top entered the viewport (not proof that the paragraph was read).
with exits as (
 select distinct on (properties->>'attempt_id') properties, occurred_at, event_name
 from public.beta_analytics_events
 where environment='beta' and event_name in ('lesson_left','lesson_interrupted')
 order by properties->>'attempt_id', occurred_at desc
)
select properties->>'lesson_id' as lesson_id, properties->>'reason' as reason,
 coalesce((properties->>'answered_count')::integer,0) as answered_checkpoints,
 (properties->>'last_paragraph')::integer as last_visible_paragraph,
 count(*) as visits
from exits group by 1,2,3,4 order by visits desc;

-- 5. Last observed screen in sessions with no activity for >=30 minutes.
-- This is a last-observation report, not crash detection or confirmed app exits.
with last_seen as (
 select distinct on (session_id) session_id, occurred_at, properties
 from public.beta_analytics_events
 where environment='beta' and properties ? 'screen'
 and event_name in ('screen_viewed','session_backgrounded','session_started')
 order by session_id, occurred_at desc, received_at desc
)
select properties->>'screen' as last_observed_screen, count(*) as inactive_sessions
from last_seen where occurred_at < now()-interval '30 minutes'
group by 1 order by 2 desc;

-- 6. D1/D7 exact-calendar-day return: use maintained cohort identity, never
-- redefine a device's first day from the most recent 30-day raw window.
-- Run maintenance for the freshest report; normal refresh is nightly.
with live as (
 select c.first_day as cohort_day, count(*) as installations,
 count(*) filter(where c.returned_d1) as d1_returned,
 count(*) filter(where c.returned_d7) as d7_returned
 from public.beta_analytics_cohorts c
 where not exists(select 1 from public.beta_analytics_retention_daily d where d.cohort_day=c.first_day)
 and c.first_day >= (now() at time zone 'Europe/Athens')::date-365
 group by 1
), combined as (
 select cohort_day, installations, d1_returned, d7_returned
 from public.beta_analytics_retention_daily
 union all select * from live
), today as (select (now() at time zone 'Europe/Athens')::date as day)
select cohort_day,installations,
 case when cohort_day+1 < today.day then installations else 0 end as d1_eligible,
 case when cohort_day+1 < today.day then d1_returned else 0 end as d1_returned,
 case when cohort_day+1 < today.day then round(100.0*d1_returned/nullif(installations,0),1) end as d1_percent,
 case when cohort_day+7 < today.day then installations else 0 end as d7_eligible,
 case when cohort_day+7 < today.day then d7_returned else 0 end as d7_returned,
 case when cohort_day+7 < today.day then round(100.0*d7_returned/nullif(installations,0),1) end as d7_percent
from combined cross join today order by cohort_day desc;

-- Raw reports 1–5 cover retained detailed events (normally 30 days since
-- receipt). Use beta_analytics_trends.sql for durable finalized daily totals.
-- Do not manually delete raw rows before maintenance has summarized them.
