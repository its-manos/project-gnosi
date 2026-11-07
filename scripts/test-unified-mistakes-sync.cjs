const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { LearningStore } = load('src/state/LearningStore.ts');
const { emptySyncDocument, parseSyncDocument } = load('src/utils/syncDocument.ts');
const { mistakeCatalogue, buildMistakeModel, mistakeKey } = load('src/knowledge/mistakes.ts');
const { questionToken } = load('src/quiz/engine.ts');
const { getAthensDateKey } = load('src/utils/dailyChallenge.ts');
const { weeklyPlan } = load('src/utils/weeklyReview.ts');
const { quizFingerprint } = load('src/utils/learningActivity.ts');
const copy = x => JSON.parse(JSON.stringify(x));
const disk = name => {
 const data = new Map([['@gnosi/sync-device-id', name]]); let writes = 0;
 return {data,get writes(){return writes;},getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{writes++;data.set(k,v);}};
};
let remote = null, revision = 0;
function connection() {
 const c={online:false};
 c.transport={
  pull:async()=>{if(!c.online)throw TypeError('offline');return remote?{doc:parseSyncDocument(copy(remote)),revision}:null;},
  seed:async()=>null,
  push:async(doc,expected)=>{if(!c.online)throw TypeError('offline');if(expected!==revision)throw {code:'40001'};remote=copy(doc);revision++;},
 };
 return c;
}
(async()=>{
 const ca=connection(),cb=connection(),da=disk('android'),db=disk('iphone');
 const a=new LearningStore('same-account',da,ca.transport),b=new LearningStore('same-account',db,cb.transport);
 await a.start();await b.start();await a.sync();await b.sync();
 const [q,r]=mistakeCatalogue.filter(i=>i.question.type==='multiple-choice').slice(0,2).map(i=>i.question);
 const wrong=q=>(q.content.correctIndex+1)%q.content.answers.length;
 const now=Date.now()-1000;
 a.recordQuestionAnswer(q,wrong(q),now);b.recordQuestionAnswer(r,wrong(r),now);
 ca.online=cb.online=true;await a.sync();await b.sync();await a.sync();
 assert.equal(buildMistakeModel(a.getSnapshot().mistakes).pending.length,2);
 assert.deepEqual(copy(a.getSnapshot().mistakes),copy(b.getSnapshot().mistakes),'offline edits converge');
 const stable=a.getDataSnapshot(),facts=a.getSnapshot().mistakes;
 await a.sync();assert.equal(a.getDataSnapshot(),stable,'no-data sync does not invalidate data subscribers');
 a.setBookmark(mistakeCatalogue.find(i=>i.lesson).lesson.id,true);
 assert.equal(a.getSnapshot().mistakes,facts,'bookmark changes retain the mistake model inputs');
 const beforeReview=a.getSnapshot().backup;
 a.startMistakeReview();assert.equal(a.getSnapshot().backup,beforeReview,'starting review preserves reading selectors');
 let saved=a.getSnapshot().mistakeSession;
 while(!saved.quiz.completed){const item=saved.quiz.questions[saved.quiz.currentIndex],token=questionToken(saved.quiz);a.answerMistakeReview(saved.quiz.id,token,item.content.correctIndex);a.advanceMistakeReview(saved.quiz.id,token);saved=a.getSnapshot().mistakeSession;}
 assert.equal(saved.earnedXP,10);
 await a.sync();await b.sync();
 assert.equal(buildMistakeModel(b.getSnapshot().mistakes).revised,2,'one correct answer propagates to the other device');
 await b.sync();await a.sync();assert.equal(buildMistakeModel(a.getSnapshot().mistakes).pending.length,0,'stale facts cannot reopen corrections');
 // A genuinely later failure reopens exactly one existing row across devices.
 b.recordQuestionAnswer(q,wrong(q));await b.sync();await a.sync();
 assert.equal(buildMistakeModel(a.getSnapshot().mistakes).pending.length,1);
 assert.equal(buildMistakeModel(a.getSnapshot().mistakes).total,2);
 a.closeMistakeReview();a.startMistakeReview();saved=a.getSnapshot().mistakeSession;
 let token=questionToken(saved.quiz);a.answerMistakeReview(saved.quiz.id,token,q.content.correctIndex);a.advanceMistakeReview(saved.quiz.id,token);
 assert.equal(a.getSnapshot().mistakeSession.earnedXP,0,'same question cannot repay bonus');
 // A different, newly corrected question also cannot exceed the daily cap.
 const next=mistakeCatalogue.filter(i=>i.question.type==='multiple-choice').map(i=>i.question).find(i=>i.id!==q.id&&i.id!==r.id);
 a.recordQuestionAnswer(next,wrong(next));a.closeMistakeReview();a.startMistakeReview();saved=a.getSnapshot().mistakeSession;token=questionToken(saved.quiz);a.answerMistakeReview(saved.quiz.id,token,next.content.correctIndex);a.advanceMistakeReview(saved.quiz.id,token);
 assert.equal(a.getSnapshot().mistakeSession.earnedXP,0);
 assert.equal(a.getSnapshot().rewards[`review:${getAthensDateKey()}`],10);
 await a.sync();await b.sync();assert.deepEqual(copy(a.getSnapshot().mistakes),copy(b.getSnapshot().mistakes));
 await a.flushLocal();a.stop();b.stop();
 // A legacy weekly answer, its reward and its correction persist together.
 const source=mistakeCatalogue.find(i=>i.lesson&&i.index===0),lesson=source.lesson;
 const weeklyDisk=disk('weekly');
 const event={lessonId:lesson.id,at:Date.now()-8*86400000,wasCompleted:false,correctCount:0,questionCount:1,quizKey:quizFingerprint(lesson.questions),missedQuestionIndices:[0]};
 weeklyDisk.data.set('@gnosi/learning-v2/guest',JSON.stringify({format:1,userId:null,dirty:false,doc:{...emptySyncDocument(),activity:{old:event}}}));
 const weekly=new LearningStore(null,weeklyDisk);await weekly.start();
 const item=weeklyPlan(weekly.getSnapshot().activity,{},getAthensDateKey())[0];assert.ok(item);
 const count=weeklyDisk.writes;
 assert.equal(weekly.answerWeekly(item.id,lesson.questions[item.questionIndex].correctIndex),true);
 await weekly.flushLocal();assert.equal(weeklyDisk.writes-count,1,'weekly answer/reward/mistake facts use one storage write');
 const stored=JSON.parse(weeklyDisk.data.get(weekly.key)).doc;
 assert.ok(stored.weeklyReviews[item.id]);assert.ok(Object.values(stored.mistakes).some(row=>row.correctAt>0));weekly.stop();
 console.log('Two-device mistake sync passed: offline union, correction convergence, stale snapshots, later reopening, XP cap and stable data selectors. Transport is simulated, not hosted Supabase.');
})().catch(e=>{console.error(e);process.exitCode=1;});
