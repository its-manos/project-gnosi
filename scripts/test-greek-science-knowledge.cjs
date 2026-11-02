/* Ancient Greece / Lesson 27; Node-only contract, not device or editorial validation. */
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict'), ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const {inlineArticleMedia}=require(root+'/src/data/articleMedia.ts');
const progress=require(root+'/src/utils/lessonProgress.ts'), paths=require(root+'/src/utils/lessonPath.ts');
const {quizFingerprint,lessonQuizMatches}=require(root+'/src/utils/learningActivity.ts');
const {parseLearningBackup}=require(root+'/src/utils/learningBackup.ts');
const id='greek-science-knowledge', l=lessons.find(x=>x.id===id);
assert.ok(l,'Lesson 27 must be registered');
assert.equal(lessons.filter(x=>x.id===id).length,1);
assert.equal(l.categoryId,'history'); assert.equal(l.subcategoryId,'ancient-greece');
assert.equal(l.title,'Πώς ήξεραν ότι είχαν δίκιο;');
assert.equal(l.requireCurrentAttemptQuiz,true); assert.equal(l.compatibleQuizKeys,undefined);
const p=l.sections.flatMap(x=>x.paragraphs);
assert.equal(l.sections.length,4); assert.equal(p.length,24);
assert.deepEqual(p.map(x=>x.id),Array.from({length:24},(_,i)=>'science-'+String(i+1).padStart(2,'0')));
assert.ok(p.every(x=>x.text.length>=140));
assert.equal(l.questions.length,6);
assert.equal(new Set(l.questions.map(x=>x.id)).size,6);
assert.ok(l.questions.every(x=>x.id.startsWith('science-')&&x.version==='1'&&x.difficulty==='hard'
  &&x.conceptIds.length>=2&&x.answers.length===4&&new Set(x.answers).size===4
  &&x.correctIndex>=0&&x.correctIndex<4&&x.explanation.length>=120));
assert.deepEqual(l.checkpoints.map(x=>x.questionId),l.questions.map(x=>x.id));
assert.deepEqual(l.checkpoints.map(x=>x.afterParagraphId),['science-04','science-06','science-12','science-16','science-18','science-24']);
assert.deepEqual(progress.getQuestionPlacements(l).map(x=>x.afterParagraphNumber),[4,6,12,16,18,24]);
assert.equal(progress.getVisibleParagraphLimit(l,{}),4);
assert.equal(progress.getResumeParagraphNumber(l,{0:l.questions[0].correctIndex}),5);
assert.equal(progress.getVisibleParagraphLimit(l,Object.fromEntries(l.questions.map((q,i)=>[i,q.correctIndex]))),24);
assert.ok(l.sources.length>=12&&l.sources.every(x=>x.url.startsWith('https://')));
assert.ok(l.imageCreditUrl.includes('commons.wikimedia.org/wiki/File:'));
assert.equal(l.imageResizeMode,'contain');
assert.ok(inlineArticleMedia[id]&&inlineArticleMedia[id].length===2);
assert.deepEqual(inlineArticleMedia[id].map(x=>x.afterParagraphId),['science-09','science-14']);
assert.ok(inlineArticleMedia[id].every(x=>x.resizeMode==='contain'&&x.creditUrl.includes('/wiki/File:')&&x.caption.length>=120));
const seq=paths.getSubcategoryPath(lessons,'ancient-greece');
assert.equal(seq.length,28);
assert.deepEqual(seq.slice(24,28).map(x=>x.id),['greek-stage-tragedy','greek-philosophy-in-context',id,'antikythera-gears']);
assert.equal(paths.getNextPathLesson(lessons.find(x=>x.id==='greek-philosophy-in-context'),lessons,['greek-philosophy-in-context'])?.id,id);
assert.equal(paths.getNextPathLesson(l,lessons,[id])?.id,'antikythera-gears');
assert.ok(paths.getLessonAccess(l,lessons,['greek-philosophy-in-context']).unlocked);
assert.ok(!paths.getLessonAccess(l,lessons,['greek-stage-tragedy']).unlocked);
assert.ok(paths.getLessonAccess(l,lessons,[id]).unlocked);
const key=quizFingerprint(l.questions);
assert.ok(/^q_[a-f0-9]+$/.test(key));
for(const old of ['q_470dac57','q_22487292',...['greek-philosophy-in-context','greek-stage-tragedy','antikythera-gears','athens-who-voted'].map(x=>quizFingerprint(lessons.find(y=>y.id===x).questions))]){
  assert.equal(lessonQuizMatches(l,old),false);
}
const attempt={checkpointAnswers:{0:l.questions[0].correctIndex},quizKey:key,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false};
const backup=parseLearningBackup({schemaVersion:1,completedIds:['greek-philosophy-in-context','athens-who-voted'],savedIds:[id,'antikythera-gears'],attempts:{[id]:attempt}});
assert.equal(backup.attempts[id].quizKey,key);
assert.ok(backup.completedIds.includes('athens-who-voted')&&backup.savedIds.includes(id));
const stale=parseLearningBackup({schemaVersion:1,completedIds:['greek-philosophy-in-context'],savedIds:[id],attempts:{[id]:{...attempt,quizKey:'q_stale'}}});
assert.ok(!stale.attempts[id]&&stale.savedIds.includes(id));
console.log('Lesson 27 Node-only contract passed: identity, anchors, media, path, quiz isolation, progress and backups.');
