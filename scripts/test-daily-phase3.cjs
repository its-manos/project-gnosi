const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const shared=load('src/utils/sharedDailyChallenge.ts'),results=load('src/utils/dailyResults.ts'),doc=load('src/utils/dailySyncDocument.ts');
const {questions}=load('src/data/questions.ts'),{lessons}=load('src/data/lessons.ts'),{getLessonAccess}=load('src/utils/lessonPath.ts');
const history=load('src/utils/dailyChallengeHistory.ts'),legacy=load('src/utils/dailyChallenge.ts'),{DailyStore}=load('src/state/DailyStore.ts');
const plain=x=>JSON.parse(JSON.stringify(x)),date='2026-10-31';
const difficulty=['easy','easy','medium','medium','medium','hard','hard'];
const distinct=new Set();
for(let day=0;day<366;day++){
 const key=new Date(Date.UTC(2026,0,1+day,12)).toISOString().slice(0,10),set=shared.selectSharedDailyQuestions(key);
 assert.equal(set.length,7);assert.equal(new Set(set.map(q=>q.id)).size,7);
 assert.deepEqual(plain(set.map(q=>q.difficulty)),difficulty);assert.equal(new Set(set.map(q=>q.categoryId)).size,4);
 assert.ok(set.every(q=>set.filter(x=>x.categoryId===q.categoryId).length<=2));
 assert.deepEqual(plain(set.map(q=>q.id)),plain(shared.selectSharedDailyQuestions(key,[...questions].reverse()).map(q=>q.id)));
 distinct.add(set.map(q=>q.id).join('|'));
}
assert.ok(distinct.size>350,'dates rotate the deterministic challenge');
assert.equal(shared.selectSharedDailyQuestions('2026-02-30').length,0);
assert.equal(shared.selectSharedDailyQuestions(date,questions.slice(0,6)).length,0);
assert.deepEqual(plain(shared.selectSharedDailyQuestions(date,[...questions,{...questions[0],id:'future-new-question'}]).map(q=>q.id)),plain(shared.selectSharedDailyQuestions(date).map(q=>q.id)),'unpublished pool additions do not change shared-v1');
assert.equal(shared.selectSharedDailyQuestions(date,[{...questions[0],question:questions[0].question+'!'},...questions.slice(1)]).length,0,'published scored content cannot silently change under one version');
const record=shared.createSharedDailyRecord(date);assert.equal(record.selectionVersion,'shared-v1');assert.equal(record.questionVersions.length,7);
assert.deepEqual(plain(legacy.parseDailyChallengeRecord(JSON.stringify(record),date)),plain(record));
const complete={...record,completed:true,currentIndex:6,answers:Object.fromEntries(record.questionIds.map((id,i)=>{const q=questions.find(q=>q.id===id);return[i,i===2?(q.correctIndex+1)%4:q.correctIndex];}))};
const detail=results.createDailyResultDetails(complete,questions);
assert.equal(detail.correctMask.filter(Boolean).length,6);assert.equal(results.highestCorrectCombo(detail.correctMask),4);
const analysis=results.dailyResultAnalysis(complete,questions,6,detail);assert.equal(analysis.accuracyPercent,86);assert.equal(analysis.highestCombo,4);assert.equal(analysis.rows.length,7);assert.equal(analysis.practiceQuestions.length,1);
const changed=questions.map(q=>q.id===complete.questionIds[0]?{...q,correctIndex:(q.correctIndex+1)%4}:q);
assert.equal(shared.dailyQuestionsCompatible(record,changed),false);
const changedAnalysis=results.dailyResultAnalysis(complete,changed,6,detail);assert.equal(changedAnalysis.rows[0].question,null);assert.equal(changedAnalysis.rows[0].correct,true);assert.equal(changedAnalysis.highestCombo,4);assert.equal(changedAnalysis.accuracyPercent,86);
assert.throws(()=>results.createDailyResultDetails(complete,changed),/question_revision_changed/);
assert.throws(()=>results.parseDailyResultDetails({...detail,correctMask:[true]},6));
assert.throws(()=>results.parseDailyResultDetails({...detail,correctMask:Array(7).fill(false)},6));
const fallback=results.dailyResultAnalysis({...complete,questionVersions:undefined,selectionVersion:undefined},questions,6);assert.equal(fallback.highestCombo,null);assert.equal(fallback.strongest,null);assert.equal(fallback.legacy,true);
const winner={...detail,correctMask:[true,true,true,false,false,false,false],categoryIds:['history','history','science','science','culture','culture','geography']};
assert.equal(results.dailyResultAnalysis(complete,questions,3,winner).strongest.id,'history');
const tie={...winner,correctMask:[true,true,true,true,false,false,false]};assert.equal(results.dailyResultAnalysis(complete,questions,4,tie).strongest,null,'ties do not invent a strongest category');
const pref={topicIds:['history','science','culture'],difficulty:'easy'};
const recommended=results.recommendDailyLesson(analysis.rows,lessons,[],[],pref);assert.ok(recommended);assert.equal(getLessonAccess(recommended,lessons,[],[]).unlocked,true);
assert.equal(results.recommendDailyLesson(analysis.rows,lessons,lessons.map(l=>l.id),[],pref),null);
function document(rec,n=1,site='a',withDetails=true){return doc.parseDailyDocument({schemaVersion:1,clock:n,preferences:null,days:{[date]:{run:[1,'a'],edit:[n,site],record:rec,history:rec.completed?history.createCompletedHistoryEntry(rec):null,...(rec.completed&&withDetails?{details:results.createDailyResultDetails(rec,questions)}:{})}}});}
const full=document(complete,8),stripped=plain(full);delete stripped.days[date].record.questionVersions;delete stripped.days[date].record.selectionVersion;delete stripped.days[date].details;
const partial=document({...record,currentIndex:1,answers:{0:complete.answers[0]}},3);
const advanced=document({...record,currentIndex:2,answers:{0:complete.answers[0],1:complete.answers[1]}},4);
const alternate=plain(full);alternate.days[date].record.questionVersions[0]='prior:revision';alternate.days[date].details.questionVersions[0]='prior:revision';
const documents=[doc.emptyDailyDocument(),full,doc.parseDailyDocument(stripped),partial,advanced,doc.parseDailyDocument(alternate)];
for(const a of documents)for(const b of documents){
 assert.deepEqual(plain(doc.mergeDailyDocuments(a,b)),plain(doc.mergeDailyDocuments(b,a)),'merge commutes');
 assert.deepEqual(plain(doc.mergeDailyDocuments(a,a)),plain(a),'merge idempotent');
 for(const c of documents)assert.deepEqual(plain(doc.mergeDailyDocuments(doc.mergeDailyDocuments(a,b),c)),plain(doc.mergeDailyDocuments(a,doc.mergeDailyDocuments(b,c))),'merge associates');
}
assert.ok(doc.mergeDailyDocuments(full,doc.parseDailyDocument(stripped)).days[date].details,'same-attempt old-client omission keeps local result detail');
assert.deepEqual(plain(doc.mergeDailyDocuments(partial,advanced).days[date].record.questionVersions),plain(record.questionVersions));
const malformed=plain(full);malformed.days[date].details.correctMask[0]=false;assert.throws(()=>doc.parseDailyDocument(malformed));
const stores=[];function disk(){const map=new Map();return{map,getItem:async k=>map.get(k)??null,setItem:async(k,v)=>map.set(k,v)};}
(async()=>{
 const storage=disk(),a=new DailyStore('a',storage),b=new DailyStore('b',disk());stores.push(a,b);await a.start();await b.start();
 await a.savePreferences(pref);await b.savePreferences({topicIds:['sports','nature','geography'],difficulty:'hard'});
 const useHook=store=>load('src/hooks/useDailyChallenge.ts',{
  '../hooks/useAthensDate':{useAthensDate:()=>date},'./useAthensDate':{useAthensDate:()=>date},
  '../utils/dailyChallenge':{...legacy,getAthensDateKey:()=>date},
  '../state/LearningSession':{useDailySnapshot:()=>store.getSnapshot(),useLearningSession:()=>({dailyStore:store})}
 }).useDailyChallenge;
 await useHook(a)(pref,true).startChallenge();await useHook(b)({topicIds:['sports','nature','geography'],difficulty:'hard'},true).startChallenge();
 assert.deepEqual(plain(a.getSnapshot().doc.days[date].record.questionIds),plain(b.getSnapshot().doc.days[date].record.questionIds));
 const day=a.getSnapshot().doc.days[date];a.commitRecord({...day.record,answers:{0:complete.answers[0]}},day);await a.flushLocal();
 const resumed=new DailyStore('a',storage);stores.push(resumed);await resumed.start();assert.deepEqual(plain(resumed.getSnapshot().doc.days[date].record.questionVersions),plain(record.questionVersions));
 const previous=resumed.getSnapshot().doc.days[date];resumed.commitRecord(complete,previous);await resumed.flushLocal();assert.deepEqual(plain(resumed.getSnapshot().doc.days[date].details),plain(detail));
 const credited=resumed.getSnapshot().doc.rewards[`day:${date}`];assert.equal(resumed.commitRecord(complete,resumed.getSnapshot().doc.days[date]),false);assert.equal(resumed.getSnapshot().doc.rewards[`day:${date}`],credited);
 console.log('Phase 3 daily passed: 366 shared deterministic dates, 2/3/2 difficulty, four categories, frozen manifest/revisions, legacy/current results, strongest-category evidence, accessible lesson recommendations, metadata merge laws, account preference independence, resume and one reward/date.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
