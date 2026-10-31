/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const root = path.resolve(__dirname, '..');
const { lessons } = require(root + '/src/data/lessons.ts');
const { astronomyLessons, astronomyRevisions } = require(root + '/src/data/astronomyLessons.ts');
const { getSubcategoryPath, getLessonAccess, getNextPathLesson } = require(root + '/src/utils/lessonPath.ts');
const { getInlineQuestionCount, getParagraphCount, getResumeParagraphNumber } = require(root + '/src/utils/lessonProgress.ts');
const { lessonReview } = require(root + '/src/utils/lessonReview.ts');
const { lessonScores, weeklyPlan } = require(root + '/src/utils/weeklyReview.ts');
const { quizFingerprint } = require(root + '/src/utils/learningActivity.ts');
const { LearningStore } = require(root + '/src/state/LearningStore.ts');
const { emptySyncDocument } = require(root + '/src/utils/syncDocument.ts');
const before = require('./fixtures/catalogue-before-astronomy-20261030.json');
const expected = ['astronomy-introduction', 'astronomy-sky-motion', 'moon-phases-not-shadow', 'astronomy-solar-system', 'why-mars-is-red', 'orbit-continuous-fall', 'astronomy-light', 'astronomy-stars', 'astronomy-galaxies', 'astronomy-expanding-universe', 'astronomy-exoplanet-evidence'];
const sequence = getSubcategoryPath([...lessons].reverse(), 'space');
assert.deepEqual(sequence.map(l => l.id), expected);
assert.equal(sequence[0].title, 'Εισαγωγή στην αστρονομία');
assert.equal(astronomyLessons.length, 8);
assert.equal(sequence.reduce((sum, l) => sum + l.questions.length, 0), 49);
assert.deepEqual(sequence.map(l => l.questions.length), [4, 4, 4, 4, 4, 4, 5, 5, 4, 5, 6]);
assert.deepEqual(lessons.filter(l => before.some(old => old.id === l.id)).map(l => l.id), before.map(l => l.id), 'old catalogue order remains stable');
for (const old of before) {
  const l = lessons.find(l => l.id === old.id);
  const actual = crypto.createHash('sha256').update(JSON.stringify(old.kind === 'questions' ? l.questions : l)).digest('hex');
  assert.equal(actual, old.sha256, old.id + ': published astronomy quizzes and every other old lesson remain exact');
}
for (const update of Object.values(astronomyRevisions)) assert.ok(Object.keys(update).every(k => ['intro', 'summary', 'sections', 'readingMinutes', 'editorialReviewedAt'].includes(k)));
for (const l of sequence) {
  assert.equal(l.categoryId, 'science');
  assert.equal(getParagraphCount(l), l.questions.length * 2);
  assert.equal(getInlineQuestionCount(l), l.questions.length, 'all questions are reachable in the reader');
  for (const q of l.questions) { assert.equal(new Set(q.answers).size, 4); assert.ok(q.explanation.length > 60); }
}
const stores = [];
(async () => {
  // An actual persisted document from the old three-lesson path: preserve results,
  // a partial answer and weekly mistake eligibility after the introductory lessons arrive.
  const moon = lessons.find(l => l.id === 'moon-phases-not-shadow'), mars = lessons.find(l => l.id === 'why-mars-is-red');
  const oldEvent = { lessonId: moon.id, at: Date.parse('2026-10-20T12:00:00Z'), wasCompleted: false, correctCount: 3, questionCount: 4, quizKey: quizFingerprint(moon.questions), missedQuestionIndices: [3] };
  const oldDoc = { ...emptySyncDocument(), clock: 1, progress: {
    [moon.id]: { stamp: [1, 'oldphone'], value: { completed: true, attempt: null } },
    [mars.id]: { stamp: [1, 'oldphone'], value: { completed: false, attempt: { checkpointAnswers: { 0: mars.questions[0].correctIndex }, score: 1, updatedAt: oldEvent.at, replayOfCompletedLesson: false } } },
  }, activity: { original: oldEvent } };
  const oldDisk = new Map([['@gnosi/sync-device-id', 'oldphone'], ['@gnosi/learning-v2/guest', JSON.stringify({ format: 1, userId: null, dirty: false, doc: oldDoc })]]);
  const oldStore = new LearningStore(null, { getItem: async k => oldDisk.get(k) ?? null, setItem: async (k, v) => { oldDisk.set(k, v); } }); stores.push(oldStore); await oldStore.start();
  const snap = oldStore.getSnapshot();
  assert.ok(snap.ready);
  assert.ok(getLessonAccess(moon, lessons, snap.backup.completedIds).unlocked);
  assert.ok(getLessonAccess(mars, lessons, snap.backup.completedIds, Object.keys(snap.backup.attempts)).unlocked);
  assert.equal(getResumeParagraphNumber(mars, snap.backup.attempts[mars.id].checkpointAnswers), 3);
  assert.deepEqual(lessonReview(moon, snap.activity).indices, [3]);
  assert.equal(lessonScores(moon, snap.activity, {}).best, 3);
  assert.ok(weeklyPlan(snap.activity, {}, '2026-10-30').some(q => q.lesson.id === moon.id && q.questionIndex === 3));

  const memory = new Map([['@gnosi/sync-device-id', 'astronomytest']]);
  const storage = { getItem: async k => memory.get(k) ?? null, setItem: async (k, v) => { memory.set(k, v); } };
  const store = new LearningStore(null, storage); stores.push(store); await store.start();
  for (let i = 0; i < sequence.length; i++) {
    const l = sequence[i], before = store.getSnapshot();
    assert.ok(getLessonAccess(l, lessons, before.backup.completedIds).unlocked);
    for (const later of sequence.slice(i + 1)) assert.equal(getLessonAccess(later, lessons, before.backup.completedIds).unlocked, false);
    // A zero-score first completion must also unlock the next lesson.
    const answers = Object.fromEntries(l.questions.map((q, index) => [index, i === 0 || index === l.questions.length - 1 ? (q.correctIndex + 1) % 4 : q.correctIndex]));
    const incomplete = { ...answers }; delete incomplete[l.questions.length - 1];
    assert.throws(() => store.complete(l.id, { id: 'unfinished' + i, answers: incomplete }), /incomplete_quiz/);
    store.complete(l.id, { id: 'run' + i, answers });
    const after = store.getSnapshot(), event = Object.values(after.activity).find(e => e.lessonId === l.id);
    assert.equal(event.questionCount, l.questions.length);
    assert.equal(event.correctCount, i === 0 ? 0 : l.questions.length - 1);
    assert.deepEqual(lessonReview(l, after.activity).indices, i === 0 ? [0, 1, 2, 3] : [l.questions.length - 1]);
    assert.equal(lessonScores(l, after.activity, {}).total, l.questions.length);
    assert.equal(getNextPathLesson(l, lessons, after.backup.completedIds)?.id ?? null, sequence[i + 1]?.id ?? null);
  }
  await store.flushLocal();
  const reopened = new LearningStore(null, storage); stores.push(reopened); await reopened.start();
  assert.ok(expected.every(id => reopened.getSnapshot().backup.completedIds.includes(id)));
  const final = sequence.at(-1), result = Object.entries(reopened.getSnapshot().activity).find(([, e]) => e.lessonId === final.id);
  assert.equal(result[1].questionCount, 6); assert.deepEqual(result[1].missedQuestionIndices, [5]);
  const old = { [result[0]]: { ...result[1], at: oldEvent.at } };
  assert.ok(weeklyPlan(old, {}, '2026-10-30').some(q => q.lesson.id === final.id && q.questionIndex === 5));
  console.log('Astronomy passed: 11 ordered lessons, 49 checkpoints, 53 old lesson/quiz snapshots, old persisted results/resume/review, zero-score unlocks, 4/5/6-question gates, offline restart and sixth-question weekly review.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => stores.forEach(s => s.stop()));
