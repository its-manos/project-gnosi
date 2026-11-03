/* Chapter V question pilot: frozen v2/v3 evidence, typed v3/v4 and immutable history.
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
const frozen = require('./fixtures/ancient-greece-chapter5-pre-pilot-20261103.json');

const expected = {
  'hellenistic-kingdoms-cities': ['hellenistic-succession', 'hellenistic-source-triangle'],
  'greek-stage-tragedy': ['stage-festival-frame', 'stage-audience-unknown'],
  'greek-images-sculpture': ['images-peplos-traces', 'images-pigment-method-limit'],
  'greek-philosophy-in-context': ['phil-paid-teaching', 'phil-academy-place'],
  'greek-science-knowledge': ['science-sacred-disease', 'science-eratosthenes-uncertainty'],
  'antikythera-gears': ['antikythera-saros-visibility', 'antikythera-workshop-claims'],
};
const estimatedMinutes = {
  'peloponnesian-war': 16,
  'greek-crises-fourth-century': 15,
  'macedon-philip': 15,
  'alexander-conquests-context': 19,
  'hellenistic-kingdoms-cities': 13,
  'greek-stage-tragedy': 13,
  'greek-images-sculpture': 11,
  'greek-philosophy-in-context': 13,
  'greek-science-knowledge': 11,
  'antikythera-gears': 12,
};
const plain = value => JSON.parse(JSON.stringify(value));
const pathLessons = getSubcategoryPath(lessons, 'ancient-greece');
assert.equal(pathLessons.length, 30);
assert.equal(pathLessons.reduce((sum, lesson) => sum + lesson.questions.length, 0), 164);
assert.deepEqual(pathLessons.slice(24, 30).map(lesson => lesson.id), Object.keys(expected));
assert.deepEqual(lessonPaths['ancient-greece'].slice(24, 30), Object.keys(expected));
assert.equal(pathLessons.slice(24, 30).reduce((sum,lesson)=>sum+lesson.questions.length,0),38,'Chapter V question count');
assert.equal(
  pathLessons.slice(24, 30).flatMap(lesson => lesson.questions).filter(question => question.presentation?.type === 'multiple-select').length,
  5, 'Chapter V introduces five genuine multi-select cards',
);
assert.equal(
  pathLessons.flatMap(lesson => lesson.questions).filter(question => question.presentation?.type === 'multiple-select').length,
  21, 'Chapters I (2), II (4), III (5), IV (5), V (5)',
);

for (const [id, minutes] of Object.entries(estimatedMinutes)) {
  assert.equal(lessons.find(lesson => lesson.id === id)?.readingMinutes, minutes, id + ' provisional complete-lesson duration');
}

for (const [id, editedIds] of Object.entries(expected)) {
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

  const editedIndices = editedIds.map(editedId => lesson.questions.findIndex(q => q.id === editedId));
  assert.ok(editedIndices.every(index => index >= 0));
  const changedIndices = lesson.questions.flatMap((q, index) =>
    JSON.stringify(q) === JSON.stringify(original.questions[index]) ? [] : [index]);
  assert.deepEqual(changedIndices, editedIndices, id + ' only specified scored questions may change');
  for (const editedIndex of editedIndices) {
    const edited = lesson.questions[editedIndex];
    assert.equal(original.questions[editedIndex].version, id === 'antikythera-gears' ? '3' : '2', id + ' historical version');
    assert.equal(edited.version, id === 'antikythera-gears' ? '4' : '3', id + ' scored revision must have a new version');
    assert.equal(edited.correctIndex, original.questions[editedIndex].correctIndex, 'numeric score shadow unchanged');
  }
  const oldKey = original.fingerprint;
  const newKey = quizFingerprint(lesson.questions);
  assert.notEqual(newKey, oldKey, id + ' changed scored content must have new fingerprint');
  assert.equal(lessonQuizMatches(lesson, oldKey), false, 'obsolete key must never be aliased');
  assert.equal(lessonQuizMatches(lesson, newKey), true);
  assert.ok(!lesson.compatibleQuizKeys?.includes(oldKey));
  for (const key of ['q_470dac57', 'q_22487292', 'q_7ffb549e']) {
    assert.equal(lessonQuizMatches(lesson, key), false, 'older citizenship/Antikythera quiz keys cannot alias Chapter V questions');
  }

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
      assert.equal(q.version, id === 'antikythera-gears' ? '4' : '3');
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
console.log('Ancient Greece Chapter V pilot passed: 12 isolated v3/v4 revisions across 38 questions, 5 new multi-select cards, 164 stable checkpoints, 10 provisional duration estimates, original quiz keys/history/XP preserved, typed answers and stale/duplicate safety.');
