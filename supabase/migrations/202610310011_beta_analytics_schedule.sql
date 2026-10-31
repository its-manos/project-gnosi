-- Enable pg_cron in Supabase Dashboard -> Integrations -> Cron first.
begin;
do $$
begin
 if not exists(select 1 from pg_extension where extname='pg_cron') then
   raise exception 'Enable pg_cron in Supabase Integrations -> Cron, then rerun this file.';
 end if;
 if to_regprocedure('public.maintain_beta_analytics()') is null then
   raise exception 'Run 202610310010_beta_analytics_retention.sql first.';
 end if;
end;
$$;
-- The same job name updates the existing schedule rather than adding duplicates.
-- Supabase's default cron timezone is GMT/UTC: daily at 02:15 UTC.
select cron.schedule('gnosi-beta-analytics-retention','15 2 * * *', $job$
 select public.maintain_beta_analytics();
 -- Prune only THIS job's completed run history; leave other jobs untouched.
 delete from cron.job_run_details r
 where r.end_time < now()-interval '7 days'
 and r.jobid in (select j.jobid from cron.job j where j.jobname='gnosi-beta-analytics-retention' and j.username=current_user);
$job$);
commit;
