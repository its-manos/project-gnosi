/* Chapter I question pilot: frozen v3 evidence, typed v4 and immutable history.
 * Node contract tests; physical Android/iPhone QA remains separate.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename,
);
const root = path.resolve(__dirname, '..');
const { lessons } = require(root + '/src/data/lessons.ts');
const { lessonPaths, getSubcategoryPath } = require(root + '/src/utils/lessonPath.ts');
const { getQuestionPlacements, getReadingQuestionPlacements } = require(root + '/src/utils/lessonProgress.ts');
const { quizFingerprint, lessonQuizMatches, mergeCompletionEvents } = require(root + '/src/utils/learningActivity.ts');
const { lessonReview } = require(root + '/src/utils/lessonReview.ts');
const { parseLearningBackup } = require(root + '/src/utils/learningBackup.ts');
const { quizRewardSummary } = require(root + '/src/gamification/rewards.ts');
const { adaptLessonQuestion, adaptInteractiveLessonQuestion, projectInteractiveLessonAnswer, restoreInteractiveLessonAnswer } = require(root + '/src/quiz/adapters.ts');
const { createQuizSession, evaluateChoice, evaluateAnswer, questionToken, submitQuizAnswer } = require(root + '/src/quiz/engine.ts');
const frozen = require('./fixtures/ancient-greece-chapter1-pre-pilot-20261103.json');

const expected = {
  'ancient-athens': 'athens-agora-evidence',
  'greek-world-not-a-country': 'greek-world-herodotus-context',
  'greek-history-through-evidence': 'greek-evidence-speeches',
  'greek-chronology': 'greek-time-overlap',
  'greek-geography-seas': 'aegean-geography-not-destiny',
};
const plain = value => JSON.parse(JSON.stringify(value));
const pathLessons = getSubcategoryPath(lessons, 'ancient-greece');
assert.equal(pathLessons.length, 30);
assert.equal(pathLessons.reduce((sum, lesson) => sum + lesson.questions.length, 0), 164);
assert.deepEqual(pathLessons.slice(0, 5).map(lesson => lesson.id), Object.keys(expected));
assert.deepEqual(lessonPaths['ancient-greece'].slice(0, 5), Object.keys(expected));
assert.equal(
  pathLessons.slice(0, 5).flatMap(lesson => lesson.questions).filter(question => question.presentation?.type === 'multiple-select').length,
  2, 'Chapter I remains at two genuine multi-select cards',
);

for (const [id, editedId] of Object.entries(expected)) {
  const lesson = lessons.find(item => item.id === id);
  const original = frozen.lessons[id];
  assert.ok(lesson && original, id + ' must have a frozen baseline');
  assert.equal(original.fingerprint, quizFingerprint(original.questions), id + ' frozen key must be reproducible');
  assert.equal(lesson.requireCurrentAttemptQuiz, true);
  assert.equal(lesson.questionPlacement, 'section-end');
  assert.deepEqual(plain(lesson.checkpoints), original.checkpoints, id + ' authored checkpoint anchors are immutable');
  assert.deepEqual(getQuestionPlacements(lesson).map(item => item.questionId), original.questions.map(item => item.id));
  assert.deepEqual(getReadingQuestionPlacements(lesson).map(item => item.questionId), original.questions.map(item => item.id));
  assert.deepEqual(lesson.questions.map(q => q.id), original.questions.map(q => q.id), id + ' stable question IDs');
  assert.equal(lesson.questions.length, original.questions.length, id + ' question count unchanged');

  const editedIndex = lesson.questions.findIndex(q => q.id === editedId);
  assert.ok(editedIndex >= 0);
  const changedIndices = lesson.questions.flatMap((q, index) =>
    JSON.stringify(q) === JSON.stringify(original.questions[index]) ? [] : [index]);
  assert.deepEqual(changedIndices, [editedIndex], id + ' exactly one scored question is changed');
  const edited = lesson.questions[editedIndex];
  assert.equal(original.questions[editedIndex].version, '3');
  assert.equal(edited.version, '4', id + ' scored revision must have new version');
  const oldKey = original.fingerprint;
  const newKey = quizFingerprint(lesson.questions);
  assert.notEqual(newKey, oldKey, id + ' changed scored content must have new fingerprint');
  assert.equal(lessonQuizMatches(lesson, oldKey), false, 'obsolete key must never be aliased');
  assert.equal(lessonQuizMatches(lesson, newKey), true);
  assert.ok(!lesson.compatibleQuizKeys?.includes(oldKey));

  const oldHistory = {
    ['before-' + id]: {
      lessonId: id, at: Date.parse('2026-11-02T12:00:00Z'), wasCompleted: false,
      correctCount: 1, questionCount: lesson.questions.length, quizKey: oldKey,
      missedQuestionIndices: Array.from({ length: lesson.questions.length - 1 }, (_, i) => i + 1),
    },
  };
  assert.deepEqual(plain(mergeCompletionEvents(oldHistory, {})), oldHistory, id + ' sync retains immutable historical activity');
  assert.equal(lessonReview(lesson, oldHistory).status, 'changed', 'old wrong-answer indices may not be regraded');
  const olderAttempt = {
    checkpointAnswers: { 0: original.questions[0].correctIndex },
    quizKey: oldKey, score: 1, updatedAt: Date.parse('2026-11-02T12:00:00Z'), replayOfCompletedLesson: false,
  };
  const oldBackup = parseLearningBackup({
    schemaVersion: 1, completedIds: [id], savedIds: [id], attempts: { [id]: olderAttempt },
  });
  assert.ok(oldBackup.completedIds.includes(id) && oldBackup.savedIds.includes(id), 'historic completion/save must survive');
  assert.equal(oldBackup.attempts[id], undefined, 'incompatible partial answer is not silently applied');

  const numeric = {};
  const typed = {};
  for (let index = 0; index < lesson.questions.length; index++) {
    const q = lesson.questions[index];
    numeric[index] = q.correctIndex;
    const legacy = adaptLessonQuestion(lesson, index);
    assert.ok(evaluateChoice(legacy.content, q.correctIndex).correct, 'legacy numeric XP projection remains valid');
    const interactive = adaptInteractiveLessonQuestion(lesson, index);
    if (!interactive) continue;
    let answer;
    if (interactive.type === 'ordering') answer = [...interactive.content.correctOrder];
    else if (interactive.type === 'matching') answer = Object.fromEntries(interactive.content.pairs.map(pair => [pair.leftId, pair.rightId]));
    else if (interactive.type === 'multiple-select') answer = [...interactive.content.correctIndices];
    else if (interactive.type === 'spot-the-mistake') answer = interactive.content.incorrectOptionId;
    else if (interactive.type === 'fill-in-the-blank') answer = interactive.content.correctOptionId;
    else throw new Error('Unhandled interactive type ' + interactive.type);
    assert.ok(evaluateAnswer(interactive, answer).correct, id + '/' + q.id + ' correct typed result');
    assert.equal(projectInteractiveLessonAnswer(lesson, index, answer), q.correctIndex, 'correct typed answer projects correctly');
    if (['multiple-select', 'ordering', 'matching'].includes(interactive.type))
      typed[index] = { questionVersion: interactive.version, value: answer };

    if (interactive.type === 'multiple-select') {
      assert.equal(q.version, '4');
      assert.equal(q.correctIndex, interactive.content.correctIndices[0], 'canonical shadow index must be genuinely correct');
      assert.ok(interactive.content.correctIndices.length >= 2, 'not an ordinary single-select choice');
      assert.ok(interactive.content.correctIndices.length < q.answers.length);
      const partial = answer.slice(0, 1);
      assert.ok(evaluateAnswer(interactive, partial).valid && !evaluateAnswer(interactive, partial).correct, 'partial answer is wrong');
      assert.notEqual(projectInteractiveLessonAnswer(lesson, index, partial), q.correctIndex, 'partial answer cannot get correct numeric XP');
      assert.equal(evaluateAnswer(interactive, [...answer, answer[0]]).valid, false, 'duplicate selected index invalid');
      const session = createQuizSession('pilot:' + q.id, 'lesson', [interactive]);
      const token = questionToken(session);
      const accepted = submitQuizAnswer(session, token, answer);
      assert.equal(accepted.reason, 'accepted');
      assert.equal(submitQuizAnswer(accepted.session, token, answer).reason, 'duplicate', 'double-submit guard');
    }
  }
  const latestBackup = parseLearningBackup({
    schemaVersion: 1, completedIds: [], savedIds: [id], attempts: {
      [id]: {
        checkpointAnswers: numeric, typedCheckpointAnswers: typed, quizKey: newKey,
        score: lesson.questions.length, updatedAt: Date.parse('2026-11-03T12:00:00Z'),
        replayOfCompletedLesson: false,
      },
    },
  });
  assert.ok(latestBackup.attempts[id], 'new attempt should restore');
  assert.deepEqual(plain(latestBackup.attempts[id].checkpointAnswers), numeric);
  for (const [index, record] of Object.entries(typed)) {
    assert.deepEqual(plain(latestBackup.attempts[id].typedCheckpointAnswers[index]), record);
    assert.deepEqual(plain(restoreInteractiveLessonAnswer(lesson, Number(index), numeric[index], record)), record.value);
    assert.equal(restoreInteractiveLessonAnswer(lesson, Number(index), numeric[index], undefined), undefined,
      'rich answers must not be reconstructed from a numeric slot');
  }
  const rewarded = quizRewardSummary(lesson.questions.map((_, i) => adaptLessonQuestion(lesson, i)), numeric, 'lesson');
  assert.equal(rewarded.rows.length, lesson.questions.length);
  assert.ok(rewarded.rows.every(row => row.correct), 'numeric XP shadow must grade all canonical answers');
}
console.log('Ancient Greece Chapter I pilot passed: 5 isolated v4 revisions, 2 genuine multi-select cards, 164 stable checkpoints, original keys/history/XP preserved, typed answers and stale/duplicate safety.');
