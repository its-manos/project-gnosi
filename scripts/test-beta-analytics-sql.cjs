const {PGlite}=require(process.env.GNOSI_PGLITE_MODULE || '@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs');
const app=require('node:path').resolve(__dirname,'..');
(async()=>{
 const db=new PGlite();await db.exec('create role anon; create role authenticated;');
 const migration=fs.readFileSync(app+'/supabase/migrations/202610310009_beta_analytics.sql','utf8');
 await db.exec(migration);await db.exec(migration);
 let n=0;const uuid=()=>`00000000-0000-4000-8000-${String(++n).padStart(12,'0')}`;
 const install=uuid(),session=uuid();const event=(overrides={})=>({event_id:uuid(),install_id:install,session_id:session,event_name:'screen_viewed',occurred_at:new Date().toISOString(),environment:'beta',platform:'android',revision:'beta-analytics-1',properties:{screen:'home'},...overrides});
 const e=event();
 for(const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  await db.query('select public.ingest_beta_events($1::jsonb)',[JSON.stringify([e,e])]);
  await assert.rejects(db.query('select * from public.beta_analytics_events'));
  await assert.rejects(db.query('delete from public.beta_analytics_events'));
  await assert.rejects(db.query('update public.beta_analytics_events set platform=\'web\''));
  for(const invalid of [event({properties:{email:'private@example.test'}}),event({properties:{answered_count:-1}}),event({properties:{screen:'password'}}),event({event_name:'arbitrary'}),event({environment:'production'}),event({properties:{onboarding_step:0}}),event({properties:{replay:'false'}}),event({extra:'leak'}),event({occurred_at:'infinity'})]) {
    await assert.rejects(db.query('select public.ingest_beta_events($1::jsonb)',[JSON.stringify([invalid])]));
  }
  await db.exec('reset role');
 }
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_events')).rows[0].n,1);
 // Atomic batch rollback: no partial ingestion if a later item is invalid.
 const good=event(),bad=event({properties:{query:'private'}});
 await assert.rejects(db.query('select public.ingest_beta_events($1::jsonb)',[JSON.stringify([good,bad])]));
 assert.equal((await db.query('select count(*)::int as n from public.beta_analytics_events')).rows[0].n,1);
 // Actual SQL reports: a mature installation returns on days 1 and 7, another
 // mature installation never returns, and development traffic is excluded.
 await db.exec('truncate public.beta_analytics_events');
 const today=(await db.query("select (now() at time zone 'Europe/Athens')::date::text as d")).rows[0].d;
 function date(days){const d=new Date(today+'T10:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString();}
 async function insert(device,name,days,properties={}) {
 const x=event({install_id:device,event_name:name,occurred_at:date(days),properties});
 await db.query('insert into public.beta_analytics_events(event_id,install_id,session_id,event_name,occurred_at,environment,platform,revision,properties) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[x.event_id,x.install_id,x.session_id,x.event_name,x.occurred_at,x.environment,x.platform,x.revision,x.properties]);
 }
 const a=uuid(),b=uuid();
 await insert(a,'session_started',-10);await insert(a,'screen_viewed',-9,{screen:'home'});await insert(a,'screen_viewed',-3,{screen:'home'});await insert(b,'session_started',-10);
 for(let step=1;step<=4;step++)await insert(a,'onboarding_step_viewed',-10,{screen:'welcome',onboarding_step:step,replay:false});await insert(a,'onboarding_completed',-10,{screen:'welcome',onboarding_step:4,replay:false});
 await insert(b,'onboarding_step_viewed',-10,{screen:'welcome',onboarding_step:1,replay:false});await insert(b,'onboarding_skipped',-10,{screen:'welcome',onboarding_step:1,replay:false});
 const attempt=uuid();await insert(a,'lesson_started',-9,{screen:'lesson',lesson_id:'intro',attempt_id:attempt,answered_count:0});await insert(a,'lesson_completed',-9,{screen:'lesson',lesson_id:'intro',attempt_id:attempt,answered_count:4});
 await db.exec(fs.readFileSync(app+'/supabase/migrations/202610310010_beta_analytics_retention.sql','utf8'));
 const results=await db.exec(fs.readFileSync(app+'/supabase/reports/beta_analytics.sql','utf8'));
 const funnel=results.find(r=>r.fields.some(f=>f.name==='observed_starters')).rows[0];assert.equal(Number(funnel.observed_starters),2);assert.equal(Number(funnel.completed),1);assert.equal(Number(funnel.skipped_without_completion),1);
 const visits=results.find(r=>r.fields.some(f=>f.name==='visits_started')).rows[0];assert.equal(Number(visits.visits_started),1);assert.equal(Number(visits.visits_completed),1);
 const retention=results.find(r=>r.fields.some(f=>f.name==='d7_percent')).rows[0];assert.equal(Number(retention.d1_eligible),2);assert.equal(Number(retention.d1_returned),1);assert.equal(Number(retention.d7_returned),1);assert.equal(Number(retention.d7_percent),50);
 await db.close();console.log('PostgreSQL tests passed: idempotent migration, guest/auth insert-only access, payload rejection, atomic batches, duplicate retries, real funnel/completion/D1/D7 queries.');
})().catch(e=>{console.error(e);process.exitCode=1;});
