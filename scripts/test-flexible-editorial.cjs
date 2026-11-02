/* global __dirname */
/** Node-only regression checks for new anchor-based article format and safe quiz migration. */
const fs=require("node:fs"), path=require("node:path"), assert=require("node:assert/strict"),ts=require("typescript");
require.extensions[".ts"]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.join(__dirname,"..");
const {lessons}=require(root+"/src/data/lessons.ts");
const progress=require(root+"/src/utils/lessonProgress.ts");
const {parseLearningBackup}=require(root+"/src/utils/learningBackup.ts");
const {quizFingerprint,lessonQuizMatches}=require(root+"/src/utils/learningActivity.ts");
const {inlineArticleMedia}=require(root+"/src/data/articleMedia.ts");
const lesson=lessons.find(l=>l.id==="perception-eyes-not-cameras");
assert.ok(lesson);
assert.equal(progress.getParagraphCount(lesson),15);
assert.equal(progress.getInlineQuestionCount(lesson),3);
const placements=progress.getQuestionPlacements(lesson);
assert.deepEqual(placements.map(p=>p.afterParagraphNumber),[4,10,13]);
assert.deepEqual(placements.map(p=>p.questionId),["eyes-fovea","eyes-retina-computes","eyes-stabilized-vision"]);
const q=lesson.questions;
for(let i=0;i<q.length;i++){assert.ok(q[i].id);assert.equal(q[i].answers.length,4);assert.ok(q[i].explanation.length>35);}
const v=(answers)=>progress.getVisibleParagraphLimit(lesson,answers);
assert.equal(v({}),4);assert.equal(v({0:0}),10);assert.equal(v({0:0,1:1}),13);assert.equal(v({0:0,1:1,2:0}),15);
assert.equal(progress.getResumeParagraphNumber(lesson,{}),null);
assert.equal(progress.getResumeParagraphNumber(lesson,{0:0}),5);
assert.equal(progress.getResumeParagraphNumber(lesson,{0:0,1:1}),11);
assert.equal(progress.getResumeParagraphNumber(lesson,{0:0,1:1,2:0}),14);
assert.equal(inlineArticleMedia[lesson.id][0].afterParagraphId,"retina-fovea");
const history=lessons.find(l=>l.id==="ancient-athens");
assert.ok(history && history.checkpoints,"history opener should now use explicit anchored checkpoints");
assert.equal(progress.getParagraphCount(history),15);
assert.deepEqual(progress.getQuestionPlacements(history).map(p=>p.afterParagraphNumber),[3,9,13]);
assert.deepEqual(progress.getQuestionPlacements(history).map(p=>p.questionId),["athens-theta-phases","athens-agora-evidence","athens-social-evidence"]);
assert.equal(progress.getVisibleParagraphLimit(history,{}),3);
assert.equal(progress.getVisibleParagraphLimit(history,{0:history.questions[0].correctIndex}),9);
assert.equal(progress.getResumeParagraphNumber(history,{0:history.questions[0].correctIndex}),4);
assert.ok(history.requireCurrentAttemptQuiz,"reworked historical questions must not accept legacy unversioned attempts");
assert.ok(inlineArticleMedia[history.id].every(image=>image.afterParagraphId && image.creditUrl));
const make=(attempt)=>({schemaVersion:1,completedIds:[],savedIds:[lesson.id],attempts:{[lesson.id]:attempt}});
const attempt={checkpointAnswers:{0:q[0].correctIndex},score:1,updatedAt:Date.now(),replayOfCompletedLesson:false};
const legacy=parseLearningBackup(make(attempt));
assert.ok(!legacy.attempts[lesson.id],"Unversioned old answers must not be repurposed");assert.ok(legacy.savedIds.includes(lesson.id));
const current=quizFingerprint(q);
const valid=parseLearningBackup(make({...attempt,quizKey:current}));
assert.equal(valid.attempts[lesson.id].quizKey,current);
assert.equal(valid.attempts[lesson.id].score,1);
const stale=parseLearningBackup(make({...attempt,quizKey:"q_other"}));
assert.ok(!stale.attempts[lesson.id]);
const completed=parseLearningBackup({...make(attempt),completedIds:[lesson.id]});
assert.ok(completed.completedIds.includes(lesson.id));
assert.ok(!lessonQuizMatches(lesson,"q_other"),"Historical changed answers must not count for current mistake review");


/** These opening chapters were editorially reauthored after the original
 * numeric fixtures. Derive current positions from authored questions and
 * restore versioned typed submissions where required.
 */
const {adaptInteractiveLessonQuestion,projectInteractiveLessonAnswer}=require(root+"/src/quiz/adapters.ts");
const cases=[
 {id:"greek-world-not-a-country",paragraphs:15,anchors:[3,9,12],questions:["greek-world-belonging","greek-world-herodotus-context","greek-world-links"],media:["map-shores","sanctuaries"],version:"3"},
 {id:"greek-history-through-evidence",paragraphs:18,anchors:[5,10,16],questions:["greek-evidence-ostrakon-limits","greek-evidence-speeches","greek-evidence-missing-voices"],media:["ostrakon-limits","plangon-stele"],version:"3"},
 {id:"greek-chronology",paragraphs:22,anchors:[5,11,17,20],questions:["greek-time-overlap","greek-time-after-palaces","greek-time-iron-and-geometric","greek-time-beyond-classical"],media:["mycenaean-overlap"],version:"3"}
];
const correctRich=(p)=>p.type==="ordering"?[...p.correctOrder]:
 p.type==="matching"?Object.fromEntries(p.pairs.map(pair=>[pair.leftId,pair.rightId])):
 p.type==="multiple-select"?[...p.correctIndices]:undefined;
for(const test of cases){
 const l=lessons.find(item=>item.id===test.id);
 assert.ok(l&&l.requireCurrentAttemptQuiz,test.id);
 assert.equal(progress.getParagraphCount(l),test.paragraphs);
 assert.deepEqual(progress.getQuestionPlacements(l).map(p=>p.afterParagraphNumber),test.anchors);
 assert.deepEqual(progress.getQuestionPlacements(l).map(p=>p.questionId),test.questions);
 assert.deepEqual(inlineArticleMedia[l.id].map(f=>f.afterParagraphId),test.media);
 assert.ok(l.questions.every(q=>q.version===test.version&&q.answers.length===4&&q.explanation.length>35));
 assert.ok(!lessonQuizMatches(l,"q_unrelated"));
 assert.equal(progress.getVisibleParagraphLimit(l,{}),test.anchors[0]);
 const numeric=l.questions[0].correctIndex;
 const answer={0:numeric};
 assert.equal(progress.getVisibleParagraphLimit(l,answer),test.anchors[1]);
 assert.equal(progress.getResumeParagraphNumber(l,answer),test.anchors[0]+1);
 const old={checkpointAnswers:answer,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false};
 const env=(attempt)=>({schemaVersion:1,completedIds:[],savedIds:[l.id],attempts:{[l.id]:attempt}});
 const unversioned=parseLearningBackup(env(old));
 assert.equal(unversioned.attempts[l.id],undefined);
 assert.deepEqual(unversioned.savedIds,[l.id]);
 const typed=adaptInteractiveLessonQuestion(l,0),p=l.questions[0].presentation;
 const rich=p?correctRich(p):undefined;
 const currentAttempt={...old,quizKey:quizFingerprint(l.questions),
  ...(rich===undefined?{}:{typedCheckpointAnswers:{0:{questionVersion:typed.version,value:rich}}})};
 if(rich!==undefined)assert.equal(projectInteractiveLessonAnswer(l,0,rich),numeric);
 const restored=parseLearningBackup(env(currentAttempt));
 assert.equal(restored.attempts[l.id].score,1);
 assert.equal(restored.attempts[l.id].quizKey,currentAttempt.quizKey);
 if(rich!==undefined)assert.deepEqual(restored.attempts[l.id].typedCheckpointAnswers[0].value,rich);
}
console.log("Flexible editorial placement and backward-compatible progress regression checks passed.");
