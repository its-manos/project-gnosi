/* Node-only Lesson 9 structural/progress regression. Not a native UI, network or audio test. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts'), progress=require(root+'/src/utils/lessonProgress.ts');
const paths=require(root+'/src/utils/lessonPath.ts'), {inlineArticleMedia}=require(root+'/src/data/articleMedia.ts');
const lesson=lessons.find(l=>l.id==='linear-b-decipherment');
assert.equal(lessons.filter(l=>l.id===lesson?.id).length,1,'do not duplicate the existing lesson ID');
assert.ok(lesson?.requireCurrentAttemptQuiz,'old unversioned answers must be rejected');
assert.equal(lesson.compatibleQuizKeys,undefined,'do not alias the historical quiz fingerprint');
const paragraphs=lesson.sections.flatMap(s=>s.paragraphs);
assert.equal(paragraphs.length,21);
assert.equal(new Set(paragraphs.map(p=>p.id)).size,21);
assert.deepEqual(progress.getQuestionPlacements(lesson).map(p=>p.afterParagraphNumber),[4,8,13,17,21]);
assert.deepEqual(lesson.checkpoints.map(c=>c.questionId),lesson.questions.map(q=>q.id));
assert.deepEqual(lesson.questions.map(q=>q.correctIndex),[1,0,2,3,0]);
assert.ok(lesson.questions.every(q=>q.id&&q.version==='1'&&q.answers.length===4&&new Set(q.answers).size===4&&q.explanation.length>30));
assert.deepEqual(inlineArticleMedia[lesson.id].map(m=>m.afterParagraphId),['pylos-test-1953']);
const a=lesson.questions.map(q=>q.correctIndex);
for(let i=0;i<=a.length;i++){
 const answered=Object.fromEntries(a.slice(0,i).map((answer,index)=>[index,answer]));
 assert.equal(progress.getVisibleParagraphLimit(lesson,answered),[4,8,13,17,21,21][i]);
}
assert.equal(progress.getResumeParagraphNumber(lesson,{0:a[0],1:a[1]}),9);
const ordered=paths.getSubcategoryPath(lessons,'ancient-greece');
assert.equal(ordered.filter(l=>l.id===lesson.id).length,1);
assert.equal(ordered.findIndex(l=>l.id===lesson.id),8,'must appear immediately after Mycenaean palaces');
assert.equal(paths.getLessonAccess(lesson,lessons,[]).unlocked,false);
assert.equal(paths.getLessonAccess(lesson,lessons,['mycenaean-palaces']).unlocked,true);
assert.equal(paths.getLessonAccess(lesson,lessons,[lesson.id]).unlocked,true);
assert.equal(paths.getLessonAccess(lesson,lessons,[],[lesson.id]).unlocked,true);
console.log('Linear B: paragraph/quiz/checkpoint/media/order/access structural assertions passed (Node only).');
