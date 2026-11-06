/* Frozen, reviewable curriculum contract captured on 2026-11-02.
 * Historical 2026-10-30/31 fixtures remain untouched; compatibility of their
 * shipped quizzes is independently covered by test-editorial-compatibility.
 * The original fixture is kept for historical comparison. The companion
 * fixture records reviewed changes without relaxing any of the hash checks. */
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const baseline=require('../fixtures/premerge-curriculum-20261102.json');
const { lessons: reviewedUpdates }=require('../fixtures/premerge-curriculum-reviewed-updates-20261106.json');
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mediaFields=new Set(['imageUrl','imageCaption','imageCredit','imageCreditUrl','imageResizeMode','coverKind']);
function assertPremergeCurriculum(lessons, figures) {
  const existing=new Set(baseline.lessons.map(l=>l.id));
  assert.equal(baseline.lessons.length,116,'baseline explicitly covers the 116-lesson premerge catalogue');
  assert.ok(Object.keys(reviewedUpdates).every(id=>existing.has(id)),'reviewed updates must refer to the frozen catalogue');
  assert.deepEqual(lessons.filter(l=>existing.has(l.id)).map(l=>l.id),baseline.lessons.map(l=>l.id),
    'all premerge lesson IDs and their ordering remain stable');
  for(const old of baseline.lessons){
    const expected={...old,...reviewedUpdates[old.id]};
    const current=lessons.find(l=>l.id===old.id);
    assert.ok(current,'premerge lesson removed: '+old.id);
    assert.equal(sha(current),expected.sha256,old.id+': frozen current full lesson content');
    const learning=Object.fromEntries(Object.entries(current).filter(([name])=>!mediaFields.has(name)));
    assert.equal(sha(learning),expected.learningSha256,old.id+': teaching/quiz/source fields');
    if(figures)assert.equal(sha(figures[current.id]??[]),expected.figuresSha256,old.id+': frozen figure placement and licensing');
  }
}
module.exports={assertPremergeCurriculum};
