/* Lesson 10 structural and backward-compatible placement; Node only, no device/network verification. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const progress=require(root+'/src/utils/lessonProgress.ts');
const paths=require(root+'/src/utils/lessonPath.ts');
const {inlineArticleMedia}=require(root+'/src/data/articleMedia.ts');
const lesson=lessons.find(l=>l.id==='palace-collapse');
assert.equal(lessons.filter(l=>l.id===lesson?.id).length,1);
assert.ok(lesson.requireCurrentAttemptQuiz);
assert.equal(lesson.compatibleQuizKeys,undefined);
const paragraphs=lesson.sections.flatMap(s=>s.paragraphs);
assert.equal(paragraphs.length,27);
assert.equal(new Set(paragraphs.map(p=>p.id)).size,27);
assert.equal(lesson.questions.length,5);
assert.deepEqual(lesson.questions.map(q=>q.correctIndex),[1,3,2,0,3]);
assert.deepEqual(lesson.checkpoints.map(c=>c.questionId),lesson.questions.map(q=>q.id));
assert.deepEqual(progress.getQuestionPlacements(lesson).map(x=>x.afterParagraphNumber),[4,9,14,21,27]);
assert.ok(lesson.questions.every(q=>q.id&&q.version==='1'&&q.answers.length===4&&new Set(q.answers).size===4&&q.explanation.length>35));
assert.deepEqual(inlineArticleMedia[lesson.id].map(f=>f.afterParagraphId),['mycenae-after']);
const answers=lesson.questions.map(q=>q.correctIndex);
for(let i=0;i<=answers.length;i++){
const answered=Object.fromEntries(answers.slice(0,i).map((a,j)=>[j,a]));
assert.equal(progress.getVisibleParagraphLimit(lesson,answered),[4,9,14,21,27,27][i]);
}
assert.equal(progress.getResumeParagraphNumber(lesson,{0:answers[0],1:answers[1]}),10);
const ordered=paths.getSubcategoryPath(lessons,'ancient-greece');
assert.equal(ordered.findIndex(l=>l.id===lesson.id),9);
assert.equal(ordered[8].id,'linear-b-decipherment');
assert.equal(paths.getLessonAccess(lesson,lessons,[]).unlocked,false);
assert.equal(paths.getLessonAccess(lesson,lessons,['linear-b-decipherment']).unlocked,true);
assert.equal(paths.getLessonAccess(lesson,lessons,[lesson.id]).unlocked,true);
assert.equal(paths.getLessonAccess(lesson,lessons,[],[lesson.id]).unlocked,true);
for(const id of ['ancient-athens','mycenaean-palaces','linear-b-decipherment'])assert.equal(lessons.filter(l=>l.id===id).length,1);
console.log('Palace collapse: structural, checkpoints, media, order and access tests passed (Node only).');
