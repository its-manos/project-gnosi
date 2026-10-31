const {PGlite}=require(process.env.GNOSI_PGLITE_MODULE || '@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const db=new PGlite();await db.exec('create role anon; create role authenticated;');
 const migration=n=>fs.readFileSync(path.join(root,'supabase/migrations',n),'utf8');
 await db.exec(migration('202610310009_beta_analytics.sql'));
 const retention=migration('202610310010_beta_analytics_retention.sql');await db.exec(retention);await db.exec(retention);
 // All fixtures below share PostgreSQL now(), for exact retention boundaries.
 await db.exec('begin');let n=0;const uuid=()=>`00000000-0000-4000-8000-${String(++n).padStart(12,'0')}`;
 const today=(await db.query("select (now() at time zone 'Europe/Athens')::date::text as d")).rows[0].d;
 function day(ago){const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-ago);return d.toISOString().slice(0,10);}
 const a=uuid(),b=uuid(),session=uuid();
 async function event(device,ago,name,props={},environment='beta',receivedAgo=ago) {
  const id=uuid();await db.query(`insert into public.beta_analytics_events(event_id,install_id,session_id,event_name,occurred_at,received_at,environment,platform,revision,properties)
  values($1,$2,$3,$4,($5::date+time '12:00') at time zone 'Europe/Athens',now()-($6::text||' days')::interval,$7,'android','beta-analytics-1',$8)`,[id,device,session,name,day(ago),String(receivedAgo),environment,props]);return id;
 }
 for(const device of [a,b])await event(device,40,'session_started');
 await event(a,39,'screen_viewed',{screen:'home'});await event(a,33,'screen_viewed',{screen:'home'});
 const attempt=uuid();await event(a,40,'lesson_started',{lesson_id:'intro',attempt_id:attempt});await event(a,40,'lesson_completed',{lesson_id:'intro',attempt_id:attempt});
 await event(a,40,'onboarding_completed',{screen:'welcome',replay:false});await event(a,40,'onboarding_completed',{screen:'welcome',replay:true});
 const oldDev=await event(uuid(),8,'screen_viewed',{screen:'home'},'development');
 const recentDev=await event(uuid(),6,'screen_viewed',{screen:'home'},'development');
 const betaBoundary=await event(uuid(),30,'session_started');
 const devBoundary=await event(uuid(),7,'session_started',{},'development');
 const recent=await event(a,29,'screen_viewed',{screen:'progress'});
 const edgeDay=await event(uuid(),8,'session_started',{},'beta',0);
 await event(uuid(),9,'session_started',{},'beta',0);
 const ancient=uuid();await event(ancient,400,'session_started');
 await db.exec('select public.maintain_beta_analytics()');
 let rows=(await db.query('select event_id from public.beta_analytics_events')).rows.map(r=>r.event_id);
 assert.ok(!rows.includes(oldDev));assert.ok(rows.includes(recentDev));assert.ok(rows.includes(recent));assert.ok(rows.includes(betaBoundary),'Exactly 30 days is retained');assert.ok(rows.includes(devBoundary),'Exactly 7 days is retained');
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_events where install_id=$1 and occurred_at::date<$2::date',[a,day(30)])).rows[0].n,0);
 let d=(await db.query('select * from public.beta_analytics_daily where day=$1',[day(40)])).rows[0];assert.equal(Number(d.active_installations),2);assert.equal(Number(d.lesson_starts),1);assert.equal(Number(d.lesson_completions),1);assert.equal(Number(d.onboarding_completed),1,'Exclude replay and dedupe consenting devices per day');assert.deepEqual(d.lessons,{intro:{starts:1,completions:1}});
 let cohort=(await db.query('select * from public.beta_analytics_retention_daily where cohort_day=$1',[day(40)])).rows[0];assert.equal(Number(cohort.installations),2);assert.equal(Number(cohort.d1_returned),1);assert.equal(Number(cohort.d7_returned),1);
 assert.equal((await db.query('select first_day::text as d from public.beta_analytics_cohorts where install_id=$1',[a])).rows[0].d,day(40));
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_daily where day=$1',[day(8)])).rows[0].n,0,'Do not finalize open offline-upload window');
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_daily where day=$1',[day(9)])).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_cohorts where install_id=$1',[ancient])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_daily where day=$1',[day(400)])).rows[0].n,0);
 // Re-running after deletion must not recompute a zero/partial historical total.
 await db.exec('select public.maintain_beta_analytics()');
 const after=(await db.query('select * from public.beta_analytics_daily where day=$1',[day(40)])).rows[0];assert.deepEqual(after,d);
 const afterCohort=(await db.query('select * from public.beta_analytics_retention_daily where cohort_day=$1',[day(40)])).rows[0];assert.deepEqual(afterCohort,cohort);
 // Long-established device still active today must NOT become a new cohort.
 await event(a,0,'screen_viewed',{screen:'home'});await db.exec('select public.maintain_beta_analytics()');
 assert.equal((await db.query('select first_day::text as d from public.beta_analytics_cohorts where install_id=$1',[a])).rows[0].d,day(40));
 // Offline backfill moves a young cohort earlier and recalculates return flags.
 const late=uuid();await event(late,4,'session_started',{},'beta',0);await event(late,3,'screen_viewed',{screen:'home'},'beta',0);await db.exec('select public.maintain_beta_analytics()');
 assert.equal((await db.query('select returned_d1 from public.beta_analytics_cohorts where install_id=$1',[late])).rows[0].returned_d1,true);
 await event(late,6,'session_started',{},'beta',0);await db.exec('select public.maintain_beta_analytics()');
 let lateRow=(await db.query('select first_day::text as d,returned_d1,returned_d7 from public.beta_analytics_cohorts where install_id=$1',[late])).rows[0];assert.equal(lateRow.d,day(6));assert.equal(lateRow.returned_d1,false);assert.equal(lateRow.returned_d7,false);
 await event(late,5,'screen_viewed',{screen:'home'},'beta',0);await db.exec('select public.maintain_beta_analytics()');assert.equal((await db.query('select returned_d1 from public.beta_analytics_cohorts where install_id=$1',[late])).rows[0].returned_d1,true);
 // App roles cannot invoke destructive maintenance or read bookkeeping/totals.
 for(const role of ['anon','authenticated']){
  await db.exec('savepoint privileges');await db.exec(`set local role ${role}`);
  await assert.rejects(db.exec('select public.maintain_beta_analytics()'));await db.exec('rollback to savepoint privileges');
  for(const table of ['beta_analytics_daily','beta_analytics_cohorts','beta_analytics_retention_daily','beta_analytics_maintenance']){
   await db.exec(`set local role ${role}`);await assert.rejects(db.query(`select * from public.${table}`));await db.exec('rollback to savepoint privileges');
  }
 }
 const reports=await db.exec(fs.readFileSync(path.join(root,'supabase/reports/beta_analytics.sql'),'utf8'));
 const retentionReport=reports.find(r=>r.fields.some(f=>f.name==='d7_percent')).rows.find(r=>new Date(r.cohort_day).toISOString().slice(0,10)===day(40));assert.equal(Number(retentionReport.d7_percent),50);
 const immature=reports.find(r=>r.fields.some(f=>f.name==='d7_percent')).rows.find(r=>new Date(r.cohort_day).toISOString().slice(0,10)===day(6));assert.equal(immature.d7_percent,null);
 await db.exec(fs.readFileSync(path.join(root,'supabase/reports/beta_analytics_trends.sql'),'utf8'));
 await db.exec('rollback');
 // Scheduler plumbing with an explicit pg_cron API fixture. PGlite does NOT
 // execute real scheduled jobs; the production extension-presence guard is
 // asserted first, then adapted only for this isolated fixture.
 const schedule=fs.readFileSync(path.join(root,'supabase/migrations/202610310011_beta_analytics_schedule.sql'),'utf8');
 await assert.rejects(db.exec(schedule),/Enable pg_cron/);await db.exec('rollback');
 await db.exec(`create schema cron;
 create table cron.job(jobid bigint generated always as identity primary key,jobname text,username text,schedule text,command text,unique(jobname,username));
 create table cron.job_run_details(jobid bigint,end_time timestamptz);
 create function cron.schedule(text,text,text) returns bigint language plpgsql as $$ declare result bigint; begin
 insert into cron.job(jobname,username,schedule,command) values($1,current_user,$2,$3)
 on conflict(jobname,username) do update set schedule=excluded.schedule,command=excluded.command returning jobid into result;
 return result; end; $$;`);
 const fixtureSchedule=schedule.replace("exists(select 1 from pg_extension where extname='pg_cron')", "exists(select 1 from pg_namespace where nspname='cron')");
 await db.exec(fixtureSchedule);await db.exec(fixtureSchedule);
 const jobs=(await db.query('select * from cron.job')).rows;assert.equal(jobs.length,1);assert.equal(jobs[0].schedule,'15 2 * * *');
 await db.exec(`insert into cron.job(jobname,username,schedule,command) values('unrelated-job',current_user,'0 0 * * *','select 1');
 insert into cron.job_run_details select jobid,now()-interval '10 days' from cron.job;
 insert into cron.job_run_details select jobid,now() from cron.job;`);
 await db.exec(jobs[0].command);
 assert.equal((await db.query("select count(*)::int as n from cron.job_run_details r join cron.job j using(jobid) where j.jobname='gnosi-beta-analytics-retention'")).rows[0].n,1);
 assert.equal((await db.query("select count(*)::int as n from cron.job_run_details r join cron.job j using(jobid) where j.jobname='unrelated-job'")).rows[0].n,2,'Do not prune another job history');
 await db.close();
 console.log('Analytics retention passed: 30/7-day boundaries, pre-delete rollups, replay/DEV exclusion, repeat-run stability, 365-day expiry, stable cohorts, offline backfill, private maintenance and reports after raw deletion.');
})().catch(e=>{console.error(e);process.exitCode=1;});
