/* Research-first typed lesson rollout contract: uses a temporary, in-memory
 * three-question pilot. Published content and stored data are untouched.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  module._compile(compiled, filename);
};
const { lessons } = require(path.join(root, 'src/data/lessons.ts'));
const { adaptInteractiveLessonQuestion, projectInteractiveLessonAnswer,
  restoreInteractiveLessonAnswer } = require(path.join(root, 'src/quiz/adapters.ts'));
const { evaluateAnswer, createQuizSession, submitQuizAnswer, questionToken } =
  require(path.join(root, 'src/quiz/engine.ts'));
const { parseLearningBackup } = require(path.join(root, 'src/utils/learningBackup.ts'));
const { emptySyncDocument, seedSyncBackup, syncBackup, parseSyncDocument, mergeSyncDocuments } =
  require(path.join(root, 'src/utils/syncDocument.ts'));
const { quizFingerprint } = require(path.join(root, 'src/utils/learningActivity.ts'));
const plain = value => JSON.parse(JSON.stringify(value));
const lesson = lessons.find(item => item.id === 'ancient-athens');
assert.ok(lesson && lesson.questions.length >= 3, 'the known Greek pilot has three checkpoints');
const original = lesson.questions.slice(0, 3).map(q => q.presentation);
const oldKey = quizFingerprint(lesson.questions);
// Only the in-memory fixture is changed; no published question/data modification.
lesson.questions[0].presentation = { type: 'multiple-select', correctIndices: [0, 2] };
lesson.questions[1].presentation = { type: 'ordering', items: [
  { id: 'myc', label: 'Μυκηναϊκή' }, { id: 'geo', label: 'Γεωμετρική' },
  { id: 'cla', label: 'Κλασική' },
], correctOrder: ['myc', 'geo', 'cla'] };
lesson.questions[2].presentation = { type: 'matching', pairs: [
  { leftId: 'assembly', leftLabel: 'Εκκλησία του Δήμου', rightId: 'citizens', rightLabel: 'Συνέλευση πολιτών' },
  { leftId: 'council', leftLabel: 'Βουλή', rightId: 'prepares', rightLabel: 'Προετοιμασία υποθέσεων' },
] };
try {
  const key = quizFingerprint(lesson.questions);
  assert.notEqual(key, oldKey, 'changed interactive objectives invalidate stale in-progress attempts');
  const values = [
    [0, 2],
    ['cla', 'geo', 'myc'], // intentionally wrong but complete ordering
    { council: 'prepares', assembly: 'citizens' },
  ];
  const expected = [true, false, true];
  const options = [], shadows = {}, typedCheckpointAnswers = {};
  for (let i = 0; i < values.length; i++) {
    const q = adaptInteractiveLessonQuestion(lesson, i);
    assert.ok(q);
    assert.equal(q.type, ['multiple-select', 'ordering', 'matching'][i]);
    assert.doesNotThrow(() => createQuizSession('typed-pilot-' + i, 'lesson', [q]));
    const evaluation = evaluateAnswer(q, values[i]);
    assert.equal(evaluation.valid, true);
    assert.equal(evaluation.correct, expected[i]);
    const shadow = projectInteractiveLessonAnswer(lesson, i, values[i]);
    assert.equal(typeof shadow, 'number');
    assert.equal(shadow === lesson.questions[i].correctIndex, expected[i],
      'legacy XP/score projection matches engine correctness');
    typedCheckpointAnswers[i] = { questionVersion: q.version, value: values[i] };
    shadows[i] = shadow;
    options.push(q);
    assert.deepEqual(plain(restoreInteractiveLessonAnswer(lesson, i, shadow, typedCheckpointAnswers[i])), values[i],
      'resuming restores exact typed draft, not a correctness-only substitute');
    assert.equal(projectInteractiveLessonAnswer(lesson, i, null), null, 'invalid answers cannot unlock reading');
    assert.equal(restoreInteractiveLessonAnswer(lesson, i, shadow, {
      questionVersion: 'stale-version', value: values[i] }), undefined,
      'stale typed versions cannot render as saved answers');
  }
  let session = createQuizSession('typed-pilot', 'lesson', options);
  for (let i = 0; i < values.length; i++) {
    const transition = submitQuizAnswer(session, questionToken(session), values[i]);
    assert.equal(transition.changed, true);
    session = transition.session;
    if (i < 2) session = require(path.join(root, 'src/quiz/engine.ts'))
      .advanceQuizSession(session, questionToken(session)).session;
  }
  assert.equal(Object.keys(session.answers).length, 3);
  const backup = { schemaVersion: 1, completedIds: [], savedIds: [lesson.id], attempts: {
    [lesson.id]: { checkpointAnswers: shadows, typedCheckpointAnswers, quizKey: key,
      score: 200, updatedAt: 1793700000000, replayOfCompletedLesson: false },
  } };
  const parsed = parseLearningBackup(backup);
  assert.deepEqual(plain(parsed.attempts[lesson.id].checkpointAnswers), plain(shadows));
  assert.deepEqual(plain(parsed.attempts[lesson.id].typedCheckpointAnswers), plain(typedCheckpointAnswers));
  assert.equal(parsed.attempts[lesson.id].score, 2);
  const doc = seedSyncBackup(parsed);
  const restored = parseSyncDocument(plain(doc));
  assert.deepEqual(plain(syncBackup(restored).attempts[lesson.id].typedCheckpointAnswers),
    plain(typedCheckpointAnswers), 'sync roundtrip retains structured responses');
  const merged = mergeSyncDocuments(emptySyncDocument(), restored);
  assert.deepEqual(plain(syncBackup(merged).attempts[lesson.id].typedCheckpointAnswers),
    plain(typedCheckpointAnswers), 'sync merge preserves the richer attempt');
  const wrongVersion = plain(backup);
  wrongVersion.attempts[lesson.id].typedCheckpointAnswers[1].questionVersion = 'bad-version';
  const safelyTruncated = parseLearningBackup(wrongVersion);
  assert.deepEqual(Object.keys(safelyTruncated.attempts[lesson.id].checkpointAnswers), ['0'],
    'a stale typed checkpoint cannot skip the reader gate');
  const numericOnly = plain(backup);
  delete numericOnly.attempts[lesson.id].typedCheckpointAnswers;
  assert.equal(parseLearningBackup(numericOnly).attempts[lesson.id], undefined,
    'no missing typed answer is fabricated from legacy numeric projection');
  const stale = plain(backup);
  stale.attempts[lesson.id].quizKey = oldKey;
  assert.equal(parseLearningBackup(stale).attempts[lesson.id], undefined,
    'old in-progress quizzes do not map to new answer objectives');
  assert.deepEqual(parseLearningBackup({ ...stale, completedIds: [lesson.id] }).completedIds, [lesson.id],
    'historical completion survives an incompatible editorial revision');
  console.log('Typed lesson integration passed: three formats, correct/wrong shadow scoring, versioned restore, sync merge, stale protection and historical completion.');
} finally {
  original.forEach((presentation, i) => {
    if (presentation === undefined) delete lesson.questions[i].presentation;
    else lesson.questions[i].presentation = presentation;
  });
}
