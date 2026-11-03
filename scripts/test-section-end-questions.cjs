/* global __dirname */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(
  fs.readFileSync(filename,'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}},
).outputText,filename);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const {lessonPaths}=require(root+'/src/utils/lessonPath.ts');
const {
  getParagraphCount,getParagraphId,getQuestionPlacements,getReadingQuestionPlacements,
  getVisibleParagraphLimit,getReadingVisibleParagraphLimit,getReadingResumeParagraphNumber,
}=require(root+'/src/utils/lessonProgress.ts');
const {quizFingerprint}=require(root+'/src/utils/learningActivity.ts');
const {inlineArticleMedia}=require(root+'/src/data/articleMedia.ts');

const ancient=lessons.filter(lesson=>lesson.subcategoryId==='ancient-greece');
assert.equal(ancient.length,30,'all 30 Ancient Greece lessons are included');
assert.deepEqual(new Set(ancient.map(l=>l.id)),new Set(lessonPaths['ancient-greece']));
let moved=0,unchanged=0,collisions=0,questions=0,figures=0;
for(const lesson of lessons) {
  const original=getQuestionPlacements(lesson);
  const display=getReadingQuestionPlacements(lesson);
  assert.equal(display.length,original.length,lesson.id);
  assert.deepEqual(display.map(p=>p.questionIndex),original.map(p=>p.questionIndex),lesson.id);
  assert.deepEqual(display.map(p=>p.questionId),original.map(p=>p.questionId),lesson.id);
  assert.equal(quizFingerprint(lesson.questions),quizFingerprint({...lesson,questionPlacement:undefined}.questions));
  if(lesson.subcategoryId!=='ancient-greece') {
    assert.deepEqual(display,original,lesson.id+' must retain legacy placement');
    assert.equal(lesson.questionPlacement,undefined,lesson.id);
    continue;
  }
  assert.equal(lesson.questionPlacement,'section-end',lesson.id);
  const paragraphs=lesson.sections.flatMap(s=>s.paragraphs);
  const endByParagraph=[];
  let last=0;
  for(const section of lesson.sections) {
    const end=last+section.paragraphs.length;
    for(let n=last+1;n<=end;n++)endByParagraph[n]=end;
    last=end;
  }
  assert.equal(last,getParagraphCount(lesson));
  questions+=display.length;
  collisions+=display.length-new Set(display.map(p=>p.afterParagraphNumber)).size;
  for(let i=0;i<display.length;i++){
    const before=original[i],after=display[i],end=endByParagraph[before.afterParagraphNumber];
    assert.ok(end>0,lesson.id+' authored checkpoint must map to a section');
    assert.equal(after.afterParagraphNumber,end,lesson.id+' question '+i);
    assert.equal(after.afterParagraphId,getParagraphId(paragraphs[end-1],end),lesson.id+' section end anchor');
    if(before.afterParagraphNumber===end){
      unchanged++;
      assert.deepEqual(after,before,lesson.id+' existing end checkpoint must stay put');
    } else {
      moved++;
      assert.ok(after.afterParagraphNumber>before.afterParagraphNumber,lesson.id+' forward-only move');
    }
    assert.ok(!i || after.afterParagraphNumber>=display[i-1].afterParagraphNumber,lesson.id+' order preserved');
    const answers=Object.fromEntries(lesson.questions.slice(0,i).map((q,index)=>[index,q.correctIndex]));
    assert.equal(getReadingVisibleParagraphLimit(lesson,answers),after.afterParagraphNumber,
      lesson.id+' gated reading at current section ending');
  }
  const full=Object.fromEntries(lesson.questions.map((q,index)=>[index,q.correctIndex]));
  assert.equal(getReadingVisibleParagraphLimit(lesson,full),getParagraphCount(lesson));
  const media=inlineArticleMedia[lesson.id]??[];
  figures+=media.length;
  for(const figure of media){
    if(figure.afterParagraphId)assert.ok(paragraphs.some((p,i)=>getParagraphId(p,i+1)===figure.afterParagraphId),
      lesson.id+' original figure paragraph anchor survives');
    else assert.ok(figure.afterParagraphCount>=1&&figure.afterParagraphCount<=paragraphs.length,
      lesson.id+' original figure position survives');
  }
  // Legacy placement calculations remain available to compatibility tests
  // and give the same pre-change gates for the authored checkpoints.
  assert.deepEqual(getQuestionPlacements(lesson),original);
  assert.equal(getVisibleParagraphLimit(lesson,{}),original[0]?.afterParagraphNumber??paragraphs.length);
}
assert.ok(moved>0,'some mid-section questions must actually move');
assert.ok(unchanged>0,'existing section-end questions must remain intact');
assert.ok(collisions>0,'same-section question grouping must be exercised');
const science=ancient.find(l=>l.id==='greek-science-knowledge');
const placements=getReadingQuestionPlacements(science);
assert.equal(placements[0].afterParagraphNumber,placements[1].afterParagraphNumber);
const one={0:science.questions[0].correctIndex};
assert.equal(getReadingVisibleParagraphLimit(science,one),placements[1].afterParagraphNumber,
 'one answer must not unlock a shared section ending');
assert.equal(getReadingResumeParagraphNumber(science,one),placements[1].afterParagraphNumber,
 'resume at the pending question, not behind the locked gate');
const two={...one,1:science.questions[1].correctIndex};
assert.equal(getReadingResumeParagraphNumber(science,two),placements[1].afterParagraphNumber+1);
console.log('Ancient Greece section endings passed:',ancient.length,'lessons,',questions,
 'questions,',moved,'moved,',unchanged,'already at endings,',collisions,
 'shared-boundary positions,',figures,'inline figures retained.');
