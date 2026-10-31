/* global __dirname */
// Historical fixture: real quizzes shipped before this editorial revision.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons,categories,subcategories}=require(root+'/src/data/lessons.ts');
const activity=require(root+'/src/utils/learningActivity.ts');
const {lessonReview}=require(root+'/src/utils/lessonReview.ts');
const weekly=require(root+'/src/utils/weeklyReview.ts');
const sync=require(root+'/src/utils/syncDocument.ts');
const progress=require(root+'/src/utils/lessonProgress.ts');
const {LearningStore}=require(root+'/src/state/LearningStore.ts');
const before=require('./fixtures/quiz-before-editorial-20261030.json');
const stores=[];
const at=Date.parse('2026-10-15T12:00:00Z'),answeredAt=Date.parse('2026-10-20T12:00:00Z');
const event=(l,key,missed,time=at)=>({lessonId:l.id,at:time,wasCompleted:false,questionCount:4,correctCount:4-missed.length,quizKey:key,missedQuestionIndices:missed});
(async()=>{
 assert.ok(lessons.length >= before.length);assert.equal(categories.length,7);assert.ok(subcategories.length >= 21);
 assert.deepEqual(lessons.filter(l=>before.some(old=>old.id===l.id)).map(l=>l.id),before.map(l=>l.id),'all existing catalogue IDs and their relative ordering survive additions');
 let changed=0;
 for(const old of before){
  const lesson=lessons.find(l=>l.id===old.id),oldKey=activity.quizFingerprint(old.questions);
  assert.equal(lesson.categoryId,old.categoryId);assert.equal(lesson.subcategoryId,old.subcategoryId);
  if(old.id==='ancient-athens'){
   // The research-first rewrite has three different questions. The earlier
   // four-question event is immutable but its mistake indices cannot migrate.
   assert.equal(old.questions.length,4);assert.equal(lesson.questions.length,3);
   assert.equal(progress.getInlineQuestionCount(lesson),3);
   assert.deepEqual(progress.getQuestionPlacements(lesson).map(p=>p.afterParagraphNumber),[3,9,13]);
   assert.equal(progress.getResumeParagraphNumber(lesson,{0:lesson.questions[0].correctIndex}),4);
   assert.ok(lesson.requireCurrentAttemptQuiz);
   assert.notEqual(oldKey,activity.quizFingerprint(lesson.questions));
   assert.equal(activity.lessonQuizMatches(lesson,oldKey),false);
   const legacy={old:event(lesson,oldKey,[1,3])};
   assert.equal(lessonReview(lesson,legacy).status,'changed');
   assert.equal(weekly.lessonScores(lesson,legacy).best,null);
   assert.equal(weekly.weeklyPlan(legacy,{},'2026-10-20').length,0);
   assert.deepEqual(sync.mergeSyncDocuments({...sync.emptySyncDocument(),activity:legacy},sync.emptySyncDocument()).activity,legacy);
   continue;
  }
  assert.equal(lesson.questions.length,old.questions.length);
  lesson.questions.forEach((q,i)=>{
   assert.equal(q.correctIndex,old.questions[i].correctIndex,'saved answer slots must keep meaning');
   assert.equal(q.answers[q.correctIndex],old.questions[i].answers[q.correctIndex],'correct-answer meaning preserved');
   assert.equal(q.question,old.questions[i].question,'canonical objective/order preserved');
  });
  if(oldKey!==activity.quizFingerprint(lesson.questions))changed++;
  assert.ok(activity.lessonQuizMatches(lesson,oldKey));
  assert.ok(!activity.lessonQuizMatches({...lesson,compatibleQuizKeys:[]},'q_unrelated'));
  const events={old:event(lesson,oldKey,[1,3])};
  assert.equal(lessonReview(lesson,events).status,'available');
  assert.deepEqual(lessonReview(lesson,events).indices,[1,3]);
  assert.deepEqual(weekly.lessonScores(lesson,events),{best:2,mastered:2,total:4,hasDetails:true});
  const plan=weekly.weeklyPlan(events,{},'2026-10-20');
  assert.deepEqual(plan.map(q=>q.questionIndex).sort(),[1,3]);
  assert.ok(plan.every(q=>q.id===weekly.weeklyId('2026-10-19',lesson.id,oldKey,q.questionIndex)),'old weekly IDs remain stable');
  const item=plan[0],answers={[item.id]:{sourceId:'old',questionIndex:item.questionIndex,week:item.week,answerIndex:lesson.questions[item.questionIndex].correctIndex,at:answeredAt}};
  assert.deepEqual(weekly.parseWeeklyAnswers(answers,events),answers);
  assert.equal(weekly.lessonScores(lesson,events,answers).mastered,3);
  assert.equal(weekly.lessonScores(lesson,events,answers).best,2,'weekly recovery does not rewrite attempt');
  assert.ok(weekly.weeklyPlan(events,answers,'2026-10-20').some(q=>q.id===item.id),'answered item remains this week');
  assert.equal(weekly.weeklyPlan(events,answers,'2026-10-27').length,1,'recovered mistake stays recovered');
  const mixed={...events,new:event(lesson,activity.quizFingerprint(lesson.questions),[1,3],at+1000)};
  assert.equal(weekly.weeklyPlan(mixed,{},'2026-10-20').length,2,'aliases cannot duplicate questions in a batch');
  assert.equal(weekly.lessonScores(lesson,{...mixed,perfect:event(lesson,oldKey,[])}).best,4,'old best remains eligible');
  const unrelated={old:event(lesson,'q_unrelated',[1,3])};
  assert.equal(lessonReview(lesson,unrelated).status,'changed');
  assert.equal(weekly.lessonScores(lesson,unrelated).best,null);
  assert.equal(weekly.weeklyPlan(unrelated,{},'2026-10-20').length,0);
  assert.deepEqual(sync.mergeSyncDocuments({...sync.emptySyncDocument(),activity:events,weeklyReviews:answers},sync.emptySyncDocument()).activity,events,'immutable historical event retained');
  assert.ok(lesson.sections.slice(0,4).every(s=>s.paragraphs.length===2));
  assert.equal(progress.getInlineQuestionCount(lesson),4);
  assert.equal(progress.getResumeParagraphNumber(lesson,{0:old.questions[0].correctIndex}),3);
 }
 assert.equal(changed,36,'the other 44 legacy lessons retain 36 changed textual quiz fingerprints; rewritten Athens has a separate incompatible version');
 // Load real old-format persisted progress through the current store.
 const old=before.find(row=>row.id!=='ancient-athens'),lesson=lessons.find(row=>row.id===old.id),key=activity.quizFingerprint(old.questions);
 const doc={...sync.emptySyncDocument(),clock:1,progress:{[lesson.id]:{stamp:[1,'oldphone'],value:{completed:true,attempt:null}}},activity:{old:event(lesson,key,[1,3])}};
 const disk=new Map([['@gnosi/sync-device-id','editorialtest'],['@gnosi/learning-v2/guest',JSON.stringify({format:1,userId:null,dirty:false,doc})]]);
 const storage={getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{disk.set(k,v);}};
 const store=new LearningStore(null,storage);stores.push(store);await store.start();
 assert.equal(store.getSnapshot().ready,true);assert.ok(store.getSnapshot().backup.completedIds.includes(lesson.id));
 assert.equal(lessonReview(lesson,store.getSnapshot().activity).status,'available');
 await store.flushLocal();
 const reopened=new LearningStore(null,storage);stores.push(reopened);await reopened.start();
 assert.deepEqual(reopened.getSnapshot().activity,doc.activity,'restart preserves original quiz fingerprint');
 // An old Athens completion remains completed even though its old question slots
 // must not be replayed against the new lesson's checkpoint order.
 const athensOld=before.find(row=>row.id==='ancient-athens'),athens=lessons.find(row=>row.id==='ancient-athens');
 const legacyKey=activity.quizFingerprint(athensOld.questions),legacyEvent=event(athens,legacyKey,[1,3]);
 const docAthens={...sync.emptySyncDocument(),clock:1,progress:{[athens.id]:{stamp:[1,'oldphone'],value:{completed:true,attempt:null}}},activity:{old:legacyEvent}};
 const athensDisk=new Map([['@gnosi/sync-device-id','athenscompat'],['@gnosi/learning-v2/guest',JSON.stringify({format:1,userId:null,dirty:false,doc:docAthens})]]);
 const athensStorage={getItem:async k=>athensDisk.get(k)??null,setItem:async(k,v)=>{athensDisk.set(k,v);}};
 const athensStore=new LearningStore(null,athensStorage);stores.push(athensStore);await athensStore.start();
 assert.ok(athensStore.getSnapshot().backup.completedIds.includes(athens.id),'old Athens completion must survive revised questions');
 assert.deepEqual(athensStore.getSnapshot().activity.old,legacyEvent,'old Athens scoring event must be immutable');
 assert.equal(lessonReview(athens,athensStore.getSnapshot().activity).status,'changed','old mistake slots cannot map to revised quiz');
 console.log('Editorial checks passed: 44 unchanged old lessons preserve answer slots, quiz aliases and weekly reviews; rewritten Athens retains historical completion/events without treating obsolete mistake indices as current.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
