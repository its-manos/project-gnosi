/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file);
const root = path.resolve(__dirname, '..');
const { lessons, subcategories } = require(root + '/src/data/lessons.ts');
const { worldHistoryLessons } = require(root + '/src/data/worldHistoryLessons.ts');
const { worldHistoryArticleMedia } = require(root + '/src/data/worldHistoryMedia.ts');
const { getSubcategoryPath, getLessonAccess, getNextPathLesson } = require(root + '/src/utils/lessonPath.ts');
const { getParagraphCount, getInlineQuestionCount, getResumeParagraphNumber } = require(root + '/src/utils/lessonProgress.ts');
const { quizFingerprint } = require(root + '/src/utils/learningActivity.ts');
const { lessonReview } = require(root + '/src/utils/lessonReview.ts');
const { lessonScores, weeklyPlan } = require(root + '/src/utils/weeklyReview.ts');
const { LearningStore } = require(root + '/src/state/LearningStore.ts');
const { emptySyncDocument } = require(root + '/src/utils/syncDocument.ts');
const before = require('./fixtures/catalogue-before-world-history-20261031.json');
const newIds = new Set(worldHistoryLessons.map(l => l.id));
assert.equal(worldHistoryLessons.length, 20);
assert.equal(newIds.size, 20);
assert.equal(lessons.length, before.length + 20);
assert.deepEqual(lessons.filter(l => !newIds.has(l.id)), before, 'all 61 old lesson objects and quiz answer slots remain exact, in original catalogue order');
assert.ok(subcategories.some(s => s.id === 'world-history' && s.categoryId === 'history'));
const sequence = getSubcategoryPath([...lessons].reverse(), 'world-history');
assert.equal(sequence.length, 22);
assert.equal(sequence[0].id, 'world-introduction');
assert.equal(sequence.at(-1).id, 'world-connected-present');
assert.equal(sequence.reduce((sum, l) => sum + l.questions.length, 0), 88);
assert.equal(sequence[sequence.findIndex(l => l.id === 'world-empires') + 1].id, 'pompeii-everyday-life');
assert.equal(sequence[sequence.findIndex(l => l.id === 'world-beliefs') + 1].id, 'silk-roads-ideas');
const positions = [0, 0, 0, 0];
const imageMap = fs.readFileSync(root + '/src/data/bundledLessonImages.ts', 'utf8');
for (const l of worldHistoryLessons) {
  assert.equal(l.categoryId, 'history'); assert.equal(l.subcategoryId, 'world-history');
  assert.equal(getParagraphCount(l), 8); assert.equal(getInlineQuestionCount(l), 4);
  assert.ok(l.sources.length >= 2);
  for (const q of l.questions) {
    assert.equal(new Set(q.answers).size, 4);
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
    assert.ok(q.explanation.length > 60); positions[q.correctIndex]++;
  }
  const [figure] = worldHistoryArticleMedia[l.id];
  assert.equal(figure.afterParagraphCount, 8); assert.equal(figure.resizeMode, 'contain');
  assert.ok(figure.caption.includes('Πρωτότυπο'));
  assert.ok(imageMap.includes(JSON.stringify(figure.url)), 'diagram lookup registered');
  const file = root + '/assets/lesson-images/' + l.id + '-diagram.png';
  assert.ok(imageMap.includes(l.id + '-diagram.png'));
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 1080);
}
assert.deepEqual(positions, [20, 20, 20, 20], 'correct answer positions are evenly distributed');
const stores = [];
(async () => {
  const pompeii = lessons.find(l => l.id === 'pompeii-everyday-life');
  const silk = lessons.find(l => l.id === 'silk-roads-ideas');
  const event = { lessonId: pompeii.id, at: Date.parse('2026-10-20T12:00:00Z'), wasCompleted: false,
    correctCount: 3, questionCount: 4, quizKey: quizFingerprint(pompeii.questions), missedQuestionIndices: [3] };
  const doc = { ...emptySyncDocument(), clock: 1, progress: {
    [pompeii.id]: { stamp: [1, 'oldphone'], value: { completed: true, attempt: null } },
    [silk.id]: { stamp: [1, 'oldphone'], value: { completed: false, attempt: {
      checkpointAnswers: { 0: silk.questions[0].correctIndex }, score: 1, updatedAt: event.at, replayOfCompletedLesson: false,
    } } },
  }, activity: { oldRun: event } };
  const disk = new Map([['@gnosi/sync-device-id', 'oldphone'], ['@gnosi/learning-v2/guest', JSON.stringify({ format: 1, userId: null, dirty: false, doc })]]);
  const storage = { getItem: async k => disk.get(k) ?? null, setItem: async (k, v) => { disk.set(k, v); } };
  const old = new LearningStore(null, storage); stores.push(old); await old.start();
  const snapshot = old.getSnapshot();
  assert.ok(getLessonAccess(pompeii, lessons, snapshot.backup.completedIds).unlocked, 'old completion remains accessible');
  assert.ok(getLessonAccess(silk, lessons, snapshot.backup.completedIds, Object.keys(snapshot.backup.attempts)).unlocked, 'old unfinished lesson remains accessible despite new prerequisites');
  assert.equal(getResumeParagraphNumber(silk, snapshot.backup.attempts[silk.id].checkpointAnswers), 3);
  assert.deepEqual(lessonReview(pompeii, snapshot.activity).indices, [3]);
  assert.equal(lessonScores(pompeii, snapshot.activity, {}).best, 3);
  assert.ok(weeklyPlan(snapshot.activity, {}, '2026-10-31').some(q => q.lesson.id === pompeii.id && q.questionIndex === 3));

  const memory = new Map([['@gnosi/sync-device-id', 'new-history-reader']]);
  const freshStorage = { getItem: async k => memory.get(k) ?? null, setItem: async (k, v) => { memory.set(k, v); } };
  const fresh = new LearningStore(null, freshStorage); stores.push(fresh); await fresh.start();
  for (let i = 0; i < sequence.length; i++) {
    const l = sequence[i], snap = fresh.getSnapshot();
    assert.ok(getLessonAccess(l, lessons, snap.backup.completedIds).unlocked);
    for (const later of sequence.slice(i + 1)) assert.equal(getLessonAccess(later, lessons, snap.backup.completedIds).unlocked, false);
    const answers = Object.fromEntries(l.questions.map((q, j) => [j, i === 0 || j === 3 ? (q.correctIndex + 1) % 4 : q.correctIndex]));
    const incomplete = { ...answers }; delete incomplete[3];
    assert.throws(() => fresh.complete(l.id, { id: 'unfinished-' + i, answers: incomplete }), /incomplete_quiz/);
    fresh.complete(l.id, { id: 'history-run-' + i, answers });
    const after = fresh.getSnapshot();
    assert.deepEqual(lessonReview(l, after.activity).indices, i === 0 ? [0, 1, 2, 3] : [3]);
    assert.equal(lessonScores(l, after.activity, {}).best, i === 0 ? 0 : 3);
    assert.equal(getNextPathLesson(l, lessons, after.backup.completedIds)?.id ?? null, sequence[i + 1]?.id ?? null);
  }
  await fresh.flushLocal();
  const reopened = new LearningStore(null, freshStorage); stores.push(reopened); await reopened.start();
  assert.ok(sequence.every(l => reopened.getSnapshot().backup.completedIds.includes(l.id)), 'offline restart retains all completions');
  assert.deepEqual(lessonReview(sequence.at(-1), reopened.getSnapshot().activity).indices, [3]);
  console.log('World history passed: 22 ordered steps, 80 new / 88 total questions, 20 registered offline diagrams, 61 exact old lesson snapshots, old resume/results/review, sequential and zero-score unlocks, completion guards and offline restart.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => stores.forEach(store => store.stop()));
