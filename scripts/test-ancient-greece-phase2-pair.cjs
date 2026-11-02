/* Phase 2, first two Ancient Greece lessons: historic version isolation and
 * selectable fill-in + false-statement contract. Node-only; device QA separate.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const {getQuestionPlacements}=require(root+'/src/utils/lessonProgress.ts');
const {adaptInteractiveLessonQuestion,interactiveLessonAnswerIndex,adaptLessonQuestion}=require(root+'/src/quiz/adapters.ts');
const {evaluateAnswer,evaluateChoice}=require(root+'/src/quiz/engine.ts');
const {quizFingerprint,lessonQuizMatches}=require(root+'/src/utils/learningActivity.ts');
const {parseLearningBackup}=require(root+'/src/utils/learningBackup.ts');
const {lessonReview}=require(root+'/src/utils/lessonReview.ts');
const {lessonPaths}=require(root+'/src/utils/lessonPath.ts');
const past=require('./fixtures/ancient-greece-pair-before-phase2-20261102.json');
// A presentation-only revision must never reuse a different interactive question's answer slots.
const frozenWithoutPresentation=[{question:'x',answers:['a','b'],correctIndex:0}];
assert.equal(quizFingerprint(frozenWithoutPresentation),quizFingerprint([{...frozenWithoutPresentation[0],presentation:undefined}]));
assert.notEqual(quizFingerprint(frozenWithoutPresentation),quizFingerprint([{...frozenWithoutPresentation[0],presentation:{type:'fill-in-the-blank',before:'x',after:''}}]));
const expected={
  'ancient-athens':{kinds:['fill-in-the-blank',null,'spot-the-mistake'],anchors:[3,9,13],correct:[0,3,2]},
  'greek-world-not-a-country':{kinds:['spot-the-mistake',null,'fill-in-the-blank'],anchors:[3,9,12],correct:[1,0,0]},
};
assert.deepEqual(Array.from(lessonPaths['ancient-greece'].slice(0,2)),Object.keys(expected));
for(const [id,check] of Object.entries(expected)){
 const l=lessons.find(row=>row.id===id);
 assert.ok(l,'lesson is present: '+id);
 const old=past.lessons[id];
 assert.ok(old&&old.questions.length===3);
 assert.equal(l.questions.length,3);
 assert.equal(l.requireCurrentAttemptQuiz,true);
 assert.deepEqual(l.questions.map(q=>q.id),old.questions.map(q=>q.id),'stable question identity');
 assert.deepEqual(getQuestionPlacements(l).map(p=>p.afterParagraphNumber),check.anchors,'unchanged checkpoint anchors');
 assert.deepEqual(l.questions.map(q=>q.correctIndex),check.correct,'revised independently-checked keys');
 assert.ok(l.questions.every(q=>q.version==='3'),'new assessment versions');
 const oldKey=quizFingerprint(old.questions),newKey=quizFingerprint(l.questions);
 assert.notEqual(oldKey,newKey,'incompatible prior quiz');
 assert.equal(lessonQuizMatches(l,oldKey),false);
 assert.equal(lessonQuizMatches(l,newKey),true);
 const stale=parseLearningBackup({schemaVersion:1,completedIds:[id],savedIds:[id],attempts:{
  [id]:{checkpointAnswers:{0:old.questions[0].correctIndex},quizKey:oldKey,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false}
 }});
 assert.ok(stale.completedIds.includes(id),'old completion preserved');
 assert.ok(stale.savedIds.includes(id),'saved lesson preserved');
 assert.equal(stale.attempts[id],undefined,'stale partially answered quiz not silently restored');
 assert.equal(lessonReview(l,{legacy:{lessonId:id,at:Date.parse('2026-10-20T12:00:00Z'),wasCompleted:false,questionCount:3,correctCount:2,quizKey:oldKey,missedQuestionIndices:[1]}}).status,'changed');
 for(let i=0;i<3;i++){
  const q=l.questions[i],kind=check.kinds[i],inter=adaptInteractiveLessonQuestion(l,i);
  const choice=adaptLessonQuestion(l,i);
  assert.equal(inter?.type??null,kind,'card format '+id+' slot '+i);
  assert.ok(evaluateChoice(choice.content,q.correctIndex).correct,'reward route uses canonical index');
  assert.ok(!evaluateChoice(choice.content,(q.correctIndex+1)%q.answers.length).correct);
  if(!kind){assert.equal(inter,null);continue;}
  assert.ok(inter&&inter.content.options.length===4,'four selectable choices');
  for(let option=0;option<4;option++){
   const selected='option-'+option;
   assert.equal(interactiveLessonAnswerIndex(q,selected),option,'no answer identity loss');
   const graded=evaluateAnswer(inter,selected);
   assert.ok(graded.valid);
   assert.equal(graded.correct,option===q.correctIndex,'engine and numeric answer agree');
  }
  assert.equal(interactiveLessonAnswerIndex(q,'option-999'),null,'reject invalid selection');
  assert.equal(interactiveLessonAnswerIndex(q,1),null,'no implicit number coercion');
 }
 const current=parseLearningBackup({schemaVersion:1,completedIds:[],savedIds:[],attempts:{
  [id]:{checkpointAnswers:{0:l.questions[0].correctIndex},quizKey:newKey,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false}
 }});
 assert.equal(current.attempts[id].checkpointAnswers[0],l.questions[0].correctIndex,'new attempt roundtrip');
}
assert.deepEqual(past.lessons['greek-world-not-a-country'].questions.map(q=>q.correctIndex),[1,2,0],
  'preserve exact erroneous v2 historical keys for compatibility audit');
console.log('Ancient Greece Phase 2 pair Node contract passed: v3 answers, legacy scores, typed cards, unchanged anchors and old history.');
