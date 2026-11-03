/* Ancient Greece 29/30: Node-only compatibility contract; not device or historical sign-off. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}
}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const {inlineArticleMedia}=require(root+'/src/data/articleMedia.ts');
const progress=require(root+'/src/utils/lessonProgress.ts'),paths=require(root+'/src/utils/lessonPath.ts');
const {quizFingerprint,lessonQuizMatches}=require(root+'/src/utils/learningActivity.ts');
const {parseLearningBackup,mergeLearningBackups}=require(root+'/src/utils/learningBackup.ts');
const id='hellenistic-kingdoms-cities',l=lessons.find(x=>x.id===id);
assert.ok(l,'Lesson 25 registered');assert.equal(lessons.filter(x=>x.id===id).length,1);
assert.equal(l.categoryId,'history');assert.equal(l.subcategoryId,'ancient-greece');
assert.equal(l.title,'Μετά τον Αλέξανδρο: ποιος όριζε τη ζωή μιας πόλης;');
assert.equal(l.requireCurrentAttemptQuiz,true);assert.equal(l.compatibleQuizKeys,undefined);
const ps=l.sections.flatMap(s=>s.paragraphs);
assert.equal(l.sections.length,6);assert.equal(ps.length,29);
assert.deepEqual(ps.map(p=>p.id),Array.from({length:29},(_,i)=>'hellenistic-'+String(i+1).padStart(2,'0')));
assert.ok(ps.every(p=>p.text.length>=140&&p.text.trim()));
const words=[l.intro,...ps.map(p=>p.text)].join(' ').trim().split(/\s+/u).length;
assert.equal(words,1713);assert.equal(l.readingMinutes,Math.ceil(words/190));
assert.equal(l.questions.length,6);assert.equal(new Set(l.questions.map(q=>q.id)).size,6);
assert.deepEqual(l.questions.map(q=>q.correctIndex),[1,0,2,3,0,1]);
assert.ok(l.questions.every(q=>q.id.startsWith('hellenistic-')&&q.version==='2'&&q.difficulty==='hard'&&
 q.conceptIds.length===2&&q.answers.length===4&&new Set(q.answers).size===4&&
 Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<4&&q.explanation.length>=95));
assert.deepEqual(l.checkpoints.map(c=>c.questionId),l.questions.map(q=>q.id));
assert.deepEqual(l.checkpoints.map(c=>c.afterParagraphId),['hellenistic-05','hellenistic-10','hellenistic-15','hellenistic-20','hellenistic-25','hellenistic-29']);
assert.deepEqual(progress.getQuestionPlacements(l).map(q=>q.afterParagraphNumber),[5,10,15,20,25,29]);
assert.equal(progress.getVisibleParagraphLimit(l,{}),5);
assert.equal(progress.getResumeParagraphNumber(l,{0:l.questions[0].correctIndex}),6);
assert.equal(progress.getVisibleParagraphLimit(l,Object.fromEntries(l.questions.map((q,i)=>[i,q.correctIndex]))),29);
assert.ok(l.sources.length>=12&&l.sources.every(s=>s.url.startsWith('https://')));
assert.ok(l.imageUrl.includes('commons.wikimedia.org/wiki/Special:FilePath/')&&l.imageCreditUrl.includes('commons.wikimedia.org/wiki/File:')&&l.imageCredit.includes('CC BY 2.0'));
assert.equal(l.imageResizeMode,'contain');
assert.equal(inlineArticleMedia[id].length,2);
assert.deepEqual(inlineArticleMedia[id].map(x=>x.afterParagraphId),['hellenistic-13','hellenistic-19']);
assert.ok(inlineArticleMedia[id].every(x=>x.resizeMode==='contain'&&
 x.url.includes('commons.wikimedia.org/wiki/Special:FilePath/')&&
 x.creditUrl.includes('commons.wikimedia.org/wiki/File:')&&x.caption.length>=110));
const seq=paths.getSubcategoryPath(lessons,'ancient-greece');
assert.equal(seq.length,30);
assert.deepEqual(seq.slice(24).map(x=>x.id),['hellenistic-kingdoms-cities', 'greek-stage-tragedy', 'greek-images-sculpture', 'greek-philosophy-in-context', 'greek-science-knowledge', 'antikythera-gears']);
assert.equal(paths.getNextPathLesson(lessons.find(x=>x.id==='alexander-conquests-context'),lessons,['alexander-conquests-context'])?.id,id);
assert.equal(paths.getNextPathLesson(l,lessons,[id])?.id,'greek-stage-tragedy');
assert.ok(paths.getLessonAccess(l,lessons,['alexander-conquests-context']).unlocked);
assert.ok(!paths.getLessonAccess(l,lessons,['greek-science-knowledge']).unlocked);
assert.ok(paths.getLessonAccess(l,lessons,[id]).unlocked);
const key=quizFingerprint(l.questions);
assert.match(key,/^q_[a-f0-9]+$/);
for(const old of ['q_470dac57','q_22487292',...['athens-who-voted','greek-stage-tragedy',
 'greek-philosophy-in-context','greek-science-knowledge','greek-images-sculpture','antikythera-gears']
 .map(other=>quizFingerprint(lessons.find(x=>x.id===other).questions))]){
 assert.equal(lessonQuizMatches(l,old),false,'new quiz is isolated from historic fingerprints');
}
const attempt={checkpointAnswers:{0:l.questions[0].correctIndex},quizKey:key,score:1,updatedAt:Date.now(),replayOfCompletedLesson:false};
const initial=parseLearningBackup({schemaVersion:1,completedIds:['greek-images-sculpture','athens-who-voted'],
 savedIds:[id,'antikythera-gears'],attempts:{[id]:attempt}});
assert.equal(initial.attempts[id].quizKey,key);
assert.ok(initial.completedIds.includes('athens-who-voted')&&initial.savedIds.includes(id));
const stale=parseLearningBackup({schemaVersion:1,completedIds:['greek-images-sculpture'],
 savedIds:[id],attempts:{[id]:{...attempt,quizKey:'q_obsolete'}}});
assert.ok(!stale.attempts[id]&&stale.savedIds.includes(id),'stale attempts not attached to newly-authored quiz');
const merged=mergeLearningBackups(initial,parseLearningBackup({schemaVersion:1,completedIds:['antikythera-gears'],savedIds:[],attempts:{}}));
assert.ok(merged.completedIds.includes('athens-who-voted')&&merged.completedIds.includes('antikythera-gears'));
assert.ok(merged.savedIds.includes(id)&&merged.attempts[id].quizKey===key);
console.log('Lesson 25 Node-only contract passed: catalogue, 29 anchors, questions, sources/media, path, resume, fingerprints, saved progress and backup merge.');
