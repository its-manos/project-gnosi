/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const root = path.resolve(__dirname, '..');
const { lessons, subcategories } = require(root + '/src/data/lessons.ts');
const { architectureLessons } = require(root + '/src/data/architectureLessons.ts');
const { getSubcategoryPath, getLessonAccess, getNextPathLesson } = require(root + '/src/utils/lessonPath.ts');
const { getInlineQuestionCount, getParagraphCount } = require(root + '/src/utils/lessonProgress.ts');
const { lessonReview } = require(root + '/src/utils/lessonReview.ts');
const { lessonScores, weeklyPlan } = require(root + '/src/utils/weeklyReview.ts');
const { LearningStore } = require(root + '/src/state/LearningStore.ts');
const expected = ['architecture-introduction', 'architecture-reading-drawings', 'architecture-space-light', 'architecture-structure', 'architecture-materials', 'architecture-climate', 'architecture-city', 'architecture-reuse'];
const sequence = getSubcategoryPath([...lessons].reverse(), 'architecture');
assert.deepEqual(sequence.map(l => l.id), expected);
assert.equal(sequence[0].title, 'Εισαγωγή στην αρχιτεκτονική');
assert.equal(subcategories.find(s => s.id === 'architecture').categoryId, 'culture');
assert.deepEqual(architectureLessons.map(l => l.id), expected);
assert.equal(sequence.reduce((sum, l) => sum + l.questions.length, 0), 36);
assert.deepEqual(sequence.map(l => l.questions.length), [4, 4, 4, 5, 4, 5, 4, 6]);
for (const l of sequence) {
  assert.equal(l.categoryId, 'culture');
  assert.equal(getParagraphCount(l), l.questions.length * 2, 'every taught pair has a checkpoint and every question is visible');
  assert.equal(getInlineQuestionCount(l), l.questions.length);
  assert.ok(l.sources.length >= 2);
  for (const q of l.questions) { assert.equal(new Set(q.answers).size, 4); assert.ok(q.explanation.length > 60); }
}
const memory = new Map([['@gnosi/sync-device-id', 'architecturetest']]);
const storage = { getItem: async k => memory.get(k) ?? null, setItem: async (k, v) => { memory.set(k, v); } };
const stores = [];
(async () => {
  const store = new LearningStore(null, storage); stores.push(store); await store.start();
  for (let i = 0; i < sequence.length; i++) {
    const l = sequence[i], before = store.getSnapshot();
    assert.ok(getLessonAccess(l, lessons, before.backup.completedIds).unlocked);
    for (const later of sequence.slice(i + 1)) assert.equal(getLessonAccess(later, lessons, before.backup.completedIds).unlocked, false);
    const answers = Object.fromEntries(l.questions.map((q, index) => [index, index === l.questions.length - 1 ? (q.correctIndex + 1) % 4 : q.correctIndex]));
    const incomplete = { ...answers }; delete incomplete[l.questions.length - 1];
    assert.throws(() => store.complete(l.id, { id: 'unfinished' + i, answers: incomplete }), /incomplete_quiz/);
    store.complete(l.id, { id: 'run' + i, answers });
    const after = store.getSnapshot(), event = Object.values(after.activity).find(e => e.lessonId === l.id);
    assert.equal(event.questionCount, l.questions.length);
    assert.equal(event.correctCount, l.questions.length - 1);
    assert.deepEqual(lessonReview(l, after.activity).indices, [l.questions.length - 1]);
    assert.equal(lessonScores(l, after.activity, {}).total, l.questions.length);
    assert.equal(getNextPathLesson(l, lessons, after.backup.completedIds)?.id ?? null, sequence[i + 1]?.id ?? null);
  }
  await store.flushLocal();
  const reopened = new LearningStore(null, storage); stores.push(reopened); await reopened.start();
  assert.ok(expected.every(id => reopened.getSnapshot().backup.completedIds.includes(id)), 'all eight completions survive offline restart');
  const final = sequence.at(-1), result = Object.entries(reopened.getSnapshot().activity).find(([, e]) => e.lessonId === final.id);
  assert.equal(result[1].questionCount, 6); assert.deepEqual(result[1].missedQuestionIndices, [5]);
  const old = { [result[0]]: { ...result[1], at: Date.parse('2026-10-20T12:00:00Z') } };
  assert.ok(weeklyPlan(old, {}, '2026-10-30').some(q => q.lesson.id === final.id && q.questionIndex === 5), 'weekly review handles a sixth checkpoint');
  console.log('Architecture path passed: eight ordered lessons, 36 visible checkpoints, 4/5/6-question completion gates, sequential unlocks, exact scores/mistakes, offline restart and sixth-question weekly review.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => stores.forEach(s => s.stop()));
