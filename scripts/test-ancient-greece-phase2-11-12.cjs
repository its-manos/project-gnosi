/* Ancient Greece Phase 2, batch 6: lessons 11/12, all formats use current
 * production adapter, real validator, real backup compatibility. Node-only.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {lessons}=require(root+'/src/data/lessons.ts');
const {getSubcategoryPath}=require(root+'/src/utils/lessonPath.ts');
const {getParagraphCount,getQuestionPlacements}=require(root+'/src/utils/lessonProgress.ts');
const {adaptLessonQuestion,adaptInteractiveLessonQuestion,projectInteractiveLessonAnswer,restoreInteractiveLessonAnswer}=require(root+'/src/quiz/adapters.ts');
const {createQuizSession,evaluateAnswer,evaluateChoice}=require(root+'/src/quiz/engine.ts');
const {quizFingerprint,lessonQuizMatches}=require(root+'/src/utils/learningActivity.ts');
const {parseLearningBackup}=require(root+'/src/utils/learningBackup.ts');
const {lessonReview}=require(root+'/src/utils/lessonReview.ts');
const {quizRewardSummary}=require(root+'/src/gamification/rewards.ts');
const old=require('./fixtures/ancient-greece-pair-11-12-before-phase2-20261103.json');
const plain=x=>JSON.parse(JSON.stringify(x));
const list=getSubcategoryPath(lessons,'ancient-greece');
const targets={
 'geometric-greece':{slot:10,paragraphs:13,anchors:[3,7,10,13],correct:[1,2,1,0],types:['ordering','matching','spot-the-mistake','fill-in-the-blank'],version:'2'},
 'rise-of-polis':{slot:11,paragraphs:23,anchors:[4,9,14,19,23],correct:[2,1,3,0,2],types:['spot-the-mistake','matching',null,'fill-in-the-blank',null],version:'2'}
};
function properAnswer(q){
 switch(q.type){
 case 'multiple-select':return [...q.content.correctIndices];
 case 'ordering':return [...q.content.correctOrder];
 case 'matching':return Object.fromEntries(q.content.pairs.map(p=>[p.leftId,p.rightId]));
 case 'spot-the-mistake':return q.content.incorrectOptionId;
 case 'fill-in-the-blank':return q.content.correctOptionId;
 default:throw Error('unsupported format '+q.type);
 }
}
function wrongAnswer(q,correct){
 switch(q.type){
 case 'ordering':return [...correct].reverse();
 case 'matching':{let pairs=q.content.pairs;return Object.fromEntries(pairs.map((p,i)=>[p.leftId,pairs[(i+1)%pairs.length].rightId]));}
 case 'spot-the-mistake':return q.content.options.find(p=>p.id!==q.content.incorrectOptionId).id;
 case 'fill-in-the-blank':return q.content.options.find(p=>p.id!==q.content.correctOptionId).id;
 default:throw Error('unsupported');
 }
}
for(const [id,expect] of Object.entries(targets)){
 const l=lessons.find(x=>x.id===id),former=old.lessons[id];
 assert.ok(l&&former&&list[expect.slot].id===id,'stable slot '+id);
 assert.equal(getParagraphCount(l),expect.paragraphs);
 assert.deepEqual(getQuestionPlacements(l).map(p=>p.afterParagraphNumber),expect.anchors,'stable anchors '+id);
 assert.deepEqual(l.questions.map(q=>q.id),former.questions.map(q=>q.id),'unchanged question IDs');
 assert.deepEqual(l.questions.map(q=>q.correctIndex),expect.correct);
 assert.ok(l.questions.every(q=>q.version===expect.version),'correct quiz version');
 assert.deepEqual(l.questions.map(q=>q.presentation?.type??null),expect.types);
 assert.equal(l.requireCurrentAttemptQuiz,true,'no unversioned stale resume');
 const oldKey=quizFingerprint(former.questions),newKey=quizFingerprint(l.questions);
 assert.notEqual(oldKey,newKey);assert.equal(lessonQuizMatches(l,oldKey),false);
 assert.equal(l.compatibleQuizKeys?.includes(oldKey)??false,false,'incompatible historical fingerprint cannot be an alias');
 const stale={schemaVersion:1,completedIds:[id],savedIds:[id],attempts:{
  [id]:{checkpointAnswers:{0:former.questions[0].correctIndex},quizKey:oldKey,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false}
 }};
 const legacy=parseLearningBackup(stale);
 assert.ok(legacy.completedIds.includes(id)&&legacy.savedIds.includes(id),'old completion/bookmark survive');
 assert.equal(legacy.attempts[id],undefined,'changed old answers cannot be misapplied');
 assert.equal(lessonReview(l,{old:{lessonId:id,at:Date.parse('2026-10-20T12:00:00Z'),wasCompleted:false,correctCount:2,questionCount:former.questions.length,quizKey:oldKey,missedQuestionIndices:[1]}}).status,'changed');
 const numerics={},typed={};
 for(let i=0;i<l.questions.length;i++){
  const q=l.questions[i],canonical=adaptLessonQuestion(l,i),interactive=adaptInteractiveLessonQuestion(l,i);
  assert.ok(evaluateChoice(canonical.content,q.correctIndex).correct,'correct weekly fallback');
  assert.ok(!evaluateChoice(canonical.content,(q.correctIndex+1)%q.answers.length).correct,'wrong weekly fallback');
  if(!interactive){numerics[i]=q.correctIndex;continue;}
  const answer=properAnswer(interactive);
  assert.doesNotThrow(()=>createQuizSession(id+':'+i,'lesson',[interactive]));
  assert.ok(evaluateAnswer(interactive,answer).correct,'correct typed solution');
  const wrong=wrongAnswer(interactive,answer);
  assert.ok(evaluateAnswer(interactive,wrong).valid&&!evaluateAnswer(interactive,wrong).correct,'valid wrong typed solution');
  assert.equal(projectInteractiveLessonAnswer(l,i,answer),q.correctIndex,'correct maps to numeric legacy fallback');
  assert.notEqual(projectInteractiveLessonAnswer(l,i,wrong),q.correctIndex,'wrong maps to incorrect numeric score');
  numerics[i]=q.correctIndex;
  if(['ordering','matching','multiple-select'].includes(interactive.type)){
   typed[i]={questionVersion:interactive.version,value:answer};
   assert.equal(restoreInteractiveLessonAnswer(l,i,numerics[i],undefined),undefined,'rich answer is never fabricated');
  }else{
   assert.equal(restoreInteractiveLessonAnswer(l,i,numerics[i],undefined),'option-'+q.correctIndex);
  }
 }
 const backup={schemaVersion:1,completedIds:[],savedIds:[id],attempts:{[id]:{
   checkpointAnswers:numerics,typedCheckpointAnswers:typed,quizKey:newKey,
   score:l.questions.length,updatedAt:Date.now(),replayOfCompletedLesson:false
 }}};
 const restored=parseLearningBackup(backup);
 assert.deepEqual(plain(restored.attempts[id].checkpointAnswers),numerics,'numeric XP shadows restored');
 for(const [index,item] of Object.entries(typed)){
  assert.deepEqual(plain(restored.attempts[id].typedCheckpointAnswers[index]),item,'typed answer persisted');
  assert.deepEqual(plain(restoreInteractiveLessonAnswer(l,Number(index),numerics[index],restored.attempts[id].typedCheckpointAnswers[index])),plain(item.value));
 }
 const rewards=quizRewardSummary(l.questions.map((_,i)=>adaptLessonQuestion(l,i)),numerics,'lesson');
 assert.equal(rewards.rows.length,l.questions.length,'XP fallback evaluates every question');
 assert.ok(rewards.rows.every(row=>row.correct),'XP fallback grades intended answers');
 assert.equal(rewards.highestCombo,l.questions.length,'a fully correct sequence preserves the combo');
}
console.log('Ancient Greece 11–12 Phase 2 Node contract passed: typed answer correctness, versioned questions, stable checkpoints, old history, safe restore and numeric XP fallback.');
