/* Four redesigned Ancient Greece openers: old quiz activity must not match new questions. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (mod, filename) => mod._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
const { lessons } = require(root + '/src/data/lessons.ts');
const { quizFingerprint, lessonQuizMatches } = require(root + '/src/utils/learningActivity.ts');
const { parseLearningBackup } = require(root + '/src/utils/learningBackup.ts');
const { getQuestionPlacements, getParagraphCount } = require(root + '/src/utils/lessonProgress.ts');
const snapshot = require('./fixtures/ancient-greece-intro-quizzes-before-redesign-20261102.json');
const expectations = {
  'greek-world-not-a-country': { paragraphs: 15, anchors: [3, 9, 12] },
  'greek-history-through-evidence': { paragraphs: 18, anchors: [5, 10, 16] },
  'greek-chronology': { paragraphs: 22, anchors: [5, 11, 17, 20] },
  'greek-geography-seas': { paragraphs: 18, anchors: [4, 9, 13, 17] },
};
for (const [id, expected] of Object.entries(expectations)) {
  const original = snapshot.lessons[id];
  const lesson = lessons.find(row => row.id === id);
  assert.ok(original && lesson, id + ' must exist in catalogue and snapshot');
  assert.equal(getParagraphCount(lesson), expected.paragraphs, id + ' preserved paragraphs');
  assert.deepEqual(getQuestionPlacements(lesson).map(p => p.afterParagraphNumber), expected.anchors, id + ' preserved checkpoint positions');
  assert.deepEqual(lesson.questions.map(q => q.id), original.questions.map(q => q.id), id + ' stable question IDs');
  assert.ok(lesson.questions.every(q => q.version === '2' && q.answers.length === 4 && q.explanation.length > 35), id + ' current question schema');
  assert.ok(lesson.requireCurrentAttemptQuiz, id + ' must guard unversioned attempts');
  const before = quizFingerprint(original.questions);
  const after = quizFingerprint(lesson.questions);
  assert.notEqual(before, after, id + ' redesigned quizzes must have new fingerprint');
  assert.equal(lessonQuizMatches(lesson, before), false, id + ' must not alias obsolete question answers');
  assert.equal(lessonQuizMatches(lesson, after), true, id + ' must recognize current questions');
  const attempt = (key) => ({
    checkpointAnswers: { 0: original.questions[0].correctIndex }, score: 1,
    updatedAt: Date.parse('2026-11-01T12:00:00Z'), replayOfCompletedLesson: false,
    ...(key === null ? {} : { quizKey: key }),
  });
  const backup = (key, completedIds = []) => ({
    schemaVersion: 1, completedIds, savedIds: [id],
    attempts: { [id]: attempt(key) },
  });
  const stale = parseLearningBackup(backup(before));
  assert.ok(!stale.attempts[id], id + ' old in-progress answers must not be reused');
  assert.deepEqual(stale.savedIds, [id], id + ' saved lesson remains bookmarked');
  const unversioned = parseLearningBackup(backup(null));
  assert.ok(!unversioned.attempts[id], id + ' unversioned attempts must not bypass migration');
  const completed = parseLearningBackup(backup(before, [id]));
  assert.ok(completed.completedIds.includes(id), id + ' historical completion survives');
  assert.ok(completed.savedIds.includes(id), id + ' historical bookmark survives');
  const current = parseLearningBackup({
    ...backup(after),
    attempts: { [id]: { ...attempt(after), checkpointAnswers: { 0: lesson.questions[0].correctIndex } } },
  });
  assert.equal(current.attempts[id].quizKey, after, id + ' fresh answers restore');
}
console.log('Ancient Greece 2–5 redesign passed: unchanged paragraph/checkpoint identities, versioned quizzes, old-attempt isolation, completed/saved preservation (Node only).');
