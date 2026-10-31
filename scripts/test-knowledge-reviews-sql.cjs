/* global __dirname */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{PGlite}=require(process.env.GNOSI_PGLITE_MODULE||'@electric-sql/pglite'),{load}=require('./helpers/load-typescript.cjs');
(async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 const files=['202610300003_learning_sync.sql','202610300004_daily_sync.sql','202610300005_learning_activity.sql','202610300006_lesson_mistakes.sql','202610300007_weekly_review.sql','202610310012_xp_rewards.sql','202610310013_knowledge_reviews.sql'];
 for(const file of files)await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',file),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',files.at(-1)),'utf8'));
 const user='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';await db.query('insert into auth.users values($1),($2)',[user,other]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
 const q=load('src/knowledge/concepts.ts').masteryConcepts[0].variants[0];
 const fact={version:q.version,answerIndex:0,at:Date.parse('2026-10-31T12:00:00Z'),mode:'scheduled'};
 const value={id:'kr2:test:1',date:'2026-10-31',mode:'scheduled',questionIds:[q.id],questionVersions:[q.version],answers:{0:0},currentIndex:0,completed:true,beforeStates:['learning'],qualifiedIndices:[0],earnedXP:10};
 const doc={schemaVersion:1,clock:5,progress:{},bookmarks:{},activity:{},weeklyReviews:{},rewards:{'review:2026-10-31':10},knowledgeReviews:{[q.id]:{'2026-10-31':fact}},knowledgeSession:{stamp:[5,'test'],value}};
 await db.exec('set role authenticated');
 const save=async(payload,revision,who=user)=>(await db.query('select * from public.save_learning_sync($1::jsonb,$2,$3::uuid)',[JSON.stringify(payload),revision,who])).rows[0];
 const read=async()=>(await db.query('select payload from public.learning_sync where user_id=$1',[user])).rows[0].payload;
 let rev=(await save(doc,0)).revision;assert.equal(rev,1);
 const old={...doc,clock:0};delete old.knowledgeReviews;delete old.knowledgeSession;delete old.rewards;rev=(await save(old,rev)).revision;
 let row=await read();assert.deepEqual(row.knowledgeReviews,doc.knowledgeReviews);assert.deepEqual(row.knowledgeSession,doc.knowledgeSession);assert.equal(row.clock,5);assert.equal(row.rewards['review:2026-10-31'],10);
 const newer={...doc,clock:6,knowledgeSession:{stamp:[6,'test'],value:null},knowledgeReviews:{[q.id]:{'2026-10-31':{...fact,answerIndex:2}}}};
 rev=(await save(newer,rev)).revision;row=await read();assert.equal(row.knowledgeSession.value,null);assert.equal(row.knowledgeReviews[q.id]['2026-10-31'].answerIndex,0,'same time tie uses fixed ordering, not best score');
 rev=(await save(doc,rev)).revision;assert.equal((await read()).knowledgeSession.value,null,'old session cannot resurrect over tombstone');await assert.rejects(save(doc,1));
 const {mergeKnowledgeReviews,knowledgeSessionTie}=load('src/knowledge/records.ts'),{shiftDateKey}=load('src/utils/learningActivity.ts');
 const dates={};for(let i=0;i<32;i++){let date=shiftDateKey('2026-09-01',i);dates[date]={...fact,at:Date.parse(date+'T12:00:00Z')};}
 const more={...doc,knowledgeReviews:{[q.id]:dates}};rev=(await save(more,rev)).revision;assert.deepEqual((await read()).knowledgeReviews,JSON.parse(JSON.stringify(mergeKnowledgeReviews(doc.knowledgeReviews,more.knowledgeReviews))));
 for(const knowledgeReviews of [{[q.id]:{'2026-10-31':{...fact,at:fact.at-86400000}}},{[q.id]:{'2026-10-31':{...fact,answerIndex:100}}},{[q.id]:{'2026-10-31':{...fact,mode:'cheat'}}},JSON.parse('{"__proto__":{}}')])await assert.rejects(save({...doc,knowledgeReviews},rev));
 for(const bad of [{...value,currentIndex:1},{...value,questionVersions:[]},{...value,completed:false,earnedXP:10},{...value,answers:{}},{...value,qualifiedIndices:[0,0]},{...value,id:'__proto__'}])await assert.rejects(save({...doc,knowledgeSession:{stamp:[5,'test'],value:bad}},rev));
 await assert.rejects(save({...doc,knowledgeSession:{stamp:[7,'test'],value}},rev));
 // JS and PostgreSQL tie ordering is identical despite jsonb object-key ordering.
 const tieA={...doc,clock:7,knowledgeSession:{stamp:[7,'test'],value}},tieB={...tieA,knowledgeSession:{stamp:[7,'test'],value:{...value,earnedXP:0}}};
 rev=(await save(tieA,rev)).revision;rev=(await save(tieB,rev)).revision;assert.equal(knowledgeSessionTie((await read()).knowledgeSession.value),[knowledgeSessionTie(value),knowledgeSessionTie(tieB.knowledgeSession.value)].sort().at(-1));
 for(const fn of ['save_learning_sync_before_knowledge','save_learning_sync_before_xp'])await assert.rejects(db.query(`select public.${fn}($1,$2,$3)`,[JSON.stringify(doc),rev,user]));
 await assert.rejects(db.query('select public.merge_knowledge_reviews($1,$2)',['{}','{}']));await assert.rejects(save(doc,rev,other));
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.equal((await db.query('select * from public.learning_sync')).rows.length,0);
 await db.exec('reset role;set role anon');await assert.rejects(save(doc,0));await db.close();
 console.log('Knowledge PostgreSQL passed: rerunnable migration, old-client preservation, first-answer merge/tail parity, session stamps/tombstones/ties, malformed bounds, CAS, RLS, no helper or legacy bypass, anonymous rejection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
