const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { LearningStore } = load('src/state/LearningStore.ts');
const { mistakeCatalogue, mistakeKey, recordMistakeAnswer, mergeMistakes, buildMistakeModel, parseMistakes } = load('src/knowledge/mistakes.ts');
const { questionToken } = load('src/quiz/engine.ts');
const { mergeSyncDocuments, emptySyncDocument } = load('src/utils/syncDocument.ts');
const { collectMistakeHistory } = load('src/knowledge/mistakeHistory.ts');
const { emptyDailyDocument } = load('src/utils/dailySyncDocument.ts');
const { quizFingerprint } = load('src/utils/learningActivity.ts');
const plain = x => JSON.parse(JSON.stringify(x));
const at = Date.now() - 10000;
const choices = mistakeCatalogue.filter(i => i.question.type === 'multiple-choice').slice(0, 7).map(i => i.question);
const q = choices[0], wrong = (q.content.correctIndex + 1) % q.content.answers.length;
let a = recordMistakeAnswer({}, q, wrong, at);
let b = recordMistakeAnswer({}, q, q.content.correctIndex, at + 1);
assert.equal(buildMistakeModel(a).pending.length, 1);
assert.equal(buildMistakeModel(mergeMistakes(a, b)).revised, 1, 'one correct answer on the same day clears a mistake');
assert.deepEqual(plain(mergeMistakes(a,b)), plain(mergeMistakes(b,a)), 'commutative');
assert.deepEqual(plain(mergeMistakes(a,a)), plain(a), 'idempotent');
assert.equal(buildMistakeModel(recordMistakeAnswer(mergeMistakes(a,b),q,wrong,at+2)).pending.length,1,'later wrong reopens');
assert.equal(buildMistakeModel(mergeMistakes(a,b)).total,1,'duplicate attempts do not inflate counts');
const old = {...q,version:'old-scored-version'};
const archived = buildMistakeModel(recordMistakeAnswer({},old,wrong,at));
assert.equal(archived.unavailable,1); assert.equal(archived.pending.length,0,'obsolete revisions never enter a review');
for(const bad of [null,[],{'bad':{}},JSON.parse('{"__proto__":{}}')]) assert.throws(()=>parseMistakes(bad));
assert.throws(()=>parseMistakes({[mistakeKey(q)]:{questionId:q.id,version:q.version,wrong:{at:1,value:'x'.repeat(4097)},correctAt:0}}));
function correct(q) {
 switch(q.type) {
  case 'multiple-choice':return q.content.correctIndex;
  case 'multiple-select':return [...q.content.correctIndices];
  case 'ordering':return [...q.content.correctOrder];
  case 'matching':return Object.fromEntries(q.content.pairs.map(p=>[p.leftId,p.rightId]));
  case 'spot-the-mistake':return q.content.incorrectOptionId;
  case 'fill-in-the-blank':return q.content.correctOptionId;
 }
}
function incorrect(q) {
 switch(q.type) {
  case 'multiple-choice':return (q.content.correctIndex+1)%q.content.answers.length;
  case 'multiple-select':return [q.content.answers.findIndex((_,i)=>!q.content.correctIndices.includes(i))];
  case 'ordering':return [...q.content.correctOrder].reverse();
  case 'matching':{const v=correct(q),p=q.content.pairs;[v[p[0].leftId],v[p[1].leftId]]=[v[p[1].leftId],v[p[0].leftId]];return v;}
  case 'spot-the-mistake':return q.content.options.find(o=>o.id!==q.content.incorrectOptionId).id;
  case 'fill-in-the-blank':return q.content.options.find(o=>o.id!==q.content.correctOptionId).id;
 }
}
(async()=>{
 const disk=new Map(),storage={getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{disk.set(k,v);}};
 let store=new LearningStore(null,storage);await store.start();
 assert.equal(store.startMistakeReview(),false);
 for(const q of choices)store.recordQuestionAnswer(q,incorrect(q),at);
 assert.equal(store.startMistakeReview(),true);
 let saved=store.getSnapshot().mistakeSession, id=saved.quiz.id;
 assert.equal(saved.quiz.questions.length,5);assert.equal(new Set(saved.quiz.questions.map(q=>q.id)).size,5);
 assert.equal(store.advanceMistakeReview(id,questionToken(saved.quiz)),false,'cannot skip');
 const first=saved.quiz.questions[0],token=questionToken(saved.quiz);
 assert.equal(store.answerMistakeReview(id,token,99),false);
 assert.equal(store.answerMistakeReview(id,token,correct(first)),true);
 assert.equal(store.answerMistakeReview(id,token,correct(first)),false,'duplicate tap');
 assert.equal(buildMistakeModel(store.getSnapshot().mistakes).revised,1,'correction saved before Next or round completion');
 await store.flushLocal();store.stop();assert.equal(store.advanceMistakeReview(id,token),false,'account boundary');
 store=new LearningStore(null,storage);await store.start();assert.equal(store.getSnapshot().mistakeSession.quiz.id,id,'restart resumes');
 assert.equal(store.advanceMistakeReview(id,token),true);assert.equal(store.advanceMistakeReview(id,token),false,'stale Next');
 while(!store.getSnapshot().mistakeSession.quiz.completed){saved=store.getSnapshot().mistakeSession;const q=saved.quiz.questions[saved.quiz.currentIndex],t=questionToken(saved.quiz);store.answerMistakeReview(id,t,correct(q));store.advanceMistakeReview(id,t);}
 assert.equal(store.getSnapshot().mistakeSession.earnedXP,10);
 assert.equal(store.advanceMistakeReview(id,token),false,'completion cannot pay twice');
 store.closeMistakeReview();store.startMistakeReview();saved=store.getSnapshot().mistakeSession;id=saved.quiz.id;
 while(!store.getSnapshot().mistakeSession.quiz.completed){saved=store.getSnapshot().mistakeSession;const q=saved.quiz.questions[saved.quiz.currentIndex],t=questionToken(saved.quiz);store.answerMistakeReview(id,t,incorrect(q));store.advanceMistakeReview(id,t);}
 assert.equal(store.getSnapshot().mistakeSession.earnedXP,0,'wrong-only batch gives no bonus');
 store.closeMistakeReview();
 for(const type of ['multiple-select','ordering','matching','spot-the-mistake','fill-in-the-blank']){
  const q=mistakeCatalogue.find(i=>i.question.type===type)?.question;if(!q)continue;
  store.recordQuestionAnswer(q,incorrect(q),at);store.recordQuestionAnswer(q,correct(q));
  assert.equal(buildMistakeModel(store.getSnapshot().mistakes).rows.find(r=>r.questionId===q.id).revised,true,type+' correction');
 }
 const quick=mistakeCatalogue.find(i=>i.title==='Γρήγορο κουίζ').question;
 const shuffled={...quick,content:{answers:[...quick.content.answers].reverse(),correctIndex:quick.content.answers.length-1-quick.content.correctIndex}};
 store.recordQuestionAnswer(shuffled,(shuffled.content.correctIndex+1)%4,at);
 const row=store.getSnapshot().mistakes[mistakeKey(quick)];
 assert.equal(quick.content.answers[row.wrong.value],shuffled.content.answers[(shuffled.content.correctIndex+1)%4],'shuffled choice normalized');
 store.recordQuestionAnswer(shuffled,shuffled.content.correctIndex);
 assert.equal(buildMistakeModel(store.getSnapshot().mistakes).rows.find(r=>r.questionId===quick.id).revised,true);
 const source=mistakeCatalogue.find(i=>i.lesson&&i.question.type==='multiple-choice'),lesson=source.lesson;
 const event={lessonId:lesson.id,at,wasCompleted:false,correctCount:0,questionCount:1,quizKey:quizFingerprint(lesson.questions),missedQuestionIndices:[0]};
 const backup={schemaVersion:1,completedIds:[],savedIds:[],attempts:{}};
 const history=collectMistakeHistory(backup,{e:event},{},emptyDailyDocument());
 assert.equal(Object.values(history)[0].wrong.value,null,'legacy missing choice stays unknown');
 assert.equal(Object.keys(collectMistakeHistory(backup,{e:{...event,at:Date.now()}},{},emptyDailyDocument(),store.getSnapshot().mistakes)).length,0,'completion cannot overwrite actual answer time or reopen revised facts');
 const da={...emptySyncDocument(),mistakes:a},db={...emptySyncDocument(),mistakes:b};
 assert.deepEqual(plain(mergeSyncDocuments(da,db)),plain(mergeSyncDocuments(db,da)));
 assert.equal(buildMistakeModel(mergeSyncDocuments(da,db).mistakes).revised,1,'offline union retains correction');
 const account=new LearningStore('other',storage);await account.start();assert.equal(Object.keys(account.getSnapshot().mistakes).length,0);
 await account.importGuest(backup,{}, {}, {}, {},store.getSnapshot().mistakes);assert.ok(Object.keys(account.getSnapshot().mistakes).length);
 assert.equal(account.getSnapshot().mistakeSession,null,'guest import never transfers an active session');
 await store.resetGuestProgress();assert.equal(Object.keys(store.getSnapshot().mistakes).length,0);assert.equal(store.getSnapshot().mistakeSession,null);
 store.stop();account.stop();console.log('Unified mistakes passed: deduplication, one-answer correction, reopening, typed formats, shuffled choices, bounded facts, restart, stale taps, immediate persistence, daily XP, historical migration, offline union, account isolation and guest import.');
})().catch(e=>{console.error(e);process.exitCode=1;});
