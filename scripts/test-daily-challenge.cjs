const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadTypeScript(relativePath, requireShim = () => {
  throw new Error(`Unexpected import while loading ${relativePath}`);
}) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: filePath,
    reportDiagnostics: true,
  });
  const errors = (output.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `TypeScript transpilation errors in ${relativePath}`);

  const module = { exports: {} };
  new Function('require', 'module', 'exports', output.outputText)(requireShim, module, module.exports);
  return module.exports;
}

const topicsModule = loadTypeScript('src/data/dailyChallengeTopics.ts');
const questionData = loadTypeScript('src/data/questions.ts');
const dailyUtils = loadTypeScript('src/utils/dailyChallenge.ts', (id) => {
  if (id === './sharedDailyChallenge') return require('./helpers/load-typescript.cjs').load('src/utils/sharedDailyChallenge.ts');
  if (id === '../data/questions') return questionData;
  if (id === '../data/dailyChallengeTopics') return topicsModule;
  throw new Error(`Unexpected import: ${id}`);
});

const { DAILY_CHALLENGE_SIZE, questions } = questionData;
const {
  DAILY_CHALLENGE_TOPICS,
  DEFAULT_DAILY_CHALLENGE_PREFERENCES,
  CHALLENGE_DIFFICULTIES,
  normalizeDailyChallengePreferences,
  parseDailyChallengePreferences,
} = topicsModule;
const { emptyDailyChallengeRecord, getAthensDateKey, parseDailyChallengeRecord, selectDailyQuestions } = dailyUtils;
const dateKey = '2026-10-29';

assert.ok(questions.length >= DAILY_CHALLENGE_SIZE, 'question bank needs at least seven questions');
assert.equal(questions.filter(Boolean).length, questions.length, 'question bank must not contain empty array slots');
assert.equal(new Set(questions.map((q) => q.id)).size, questions.length, 'question IDs must be unique');
assert.equal(DAILY_CHALLENGE_TOPICS.length, 8, 'all eight MVP topics should be configurable');
for (const topic of DAILY_CHALLENGE_TOPICS) {
  assert.ok(questions.filter((q) => q.categoryId === topic.id).length >= 4, `${topic.id} should have enough starter questions`);
}
for (const difficulty of ['easy', 'medium', 'hard']) {
  assert.ok(questions.filter((q) => q.difficulty === difficulty).length >= DAILY_CHALLENGE_SIZE,
    `${difficulty} needs at least seven questions to preserve difficulty preference`);
}

for (const question of questions) {
  assert.ok(question.question.trim().length > 0, `${question.id} needs a prompt`);
  assert.equal(question.answers.length, 4, `${question.id} must have four answer options`);
  assert.ok(question.correctIndex >= 0 && question.correctIndex < 4, `${question.id} has invalid correctIndex`);
  assert.ok(question.explanation.trim().length > 0, `${question.id} needs an explanation`);
  assert.ok(/^https:\/\//.test(question.sourceUrl), `${question.id} needs an HTTPS source URL`);
}

const selectedA = selectDailyQuestions(dateKey);
const selectedB = selectDailyQuestions(dateKey);
assert.equal(selectedA.length, DAILY_CHALLENGE_SIZE, 'daily selection must contain seven questions');
assert.deepEqual(selectedA.map((q) => q.id), selectedB.map((q) => q.id), 'selection must be deterministic for the same date and preferences');
assert.notDeepEqual(selectedA.map((q) => q.id), selectDailyQuestions('2026-10-30').map((q) => q.id), 'the selected set should rotate between dates');
assert.equal(new Set(selectedA.map((q) => q.id)).size, DAILY_CHALLENGE_SIZE, 'daily selection must not repeat a question');
assert.deepEqual(selectDailyQuestions(dateKey, questions.slice(0, DAILY_CHALLENGE_SIZE - 1)), [], 'selection must not silently return a short quiz');

const defaultPreferences = normalizeDailyChallengePreferences(DEFAULT_DAILY_CHALLENGE_PREFERENCES);
assert.equal(defaultPreferences.topicIds.length, 5, 'defaults should include five topics');
assert.equal(normalizeDailyChallengePreferences({ topicIds: ['history'], difficulty: 'hard' }).topicIds.length, 5,
  'invalid preference counts should safely fall back to defaults');
assert.equal(parseDailyChallengePreferences('{bad json').difficulty, 'medium', 'malformed preferences should fall back safely');
assert.deepEqual(parseDailyChallengePreferences(JSON.stringify({ topicIds: ['sports', 'technology', 'everyday'], difficulty: 'hard' })),
  { topicIds: ['sports', 'technology', 'everyday'], difficulty: 'hard' }, 'valid saved preferences should restore');

for (const difficulty of CHALLENGE_DIFFICULTIES.map((item) => item.id)) {
  const preferences = { topicIds: ['history', 'science', 'geography', 'nature', 'culture'], difficulty };
  const chosen = selectDailyQuestions(dateKey, questions, preferences);
  assert.equal(chosen.length, DAILY_CHALLENGE_SIZE, `${difficulty} preference should still produce seven questions`);
  assert.ok(chosen.every((q) => q.difficulty === difficulty), `${difficulty} should be kept when the bank has enough questions`);
  assert.deepEqual(chosen.map((q) => q.id), selectDailyQuestions(dateKey, questions, preferences).map((q) => q.id),
    `${difficulty} selection should be stable across a resumed session`);
}
const nichePreferences = { topicIds: ['technology', 'sports', 'everyday'], difficulty: 'hard' };
const nicheSelection = selectDailyQuestions(dateKey, questions, nichePreferences);
assert.equal(nicheSelection.length, DAILY_CHALLENGE_SIZE, 'a narrow topic set must always produce a full challenge');
assert.ok(nicheSelection.some((q) => nichePreferences.topicIds.includes(q.categoryId)), 'selection should include chosen topics where possible');
const nicheExactQuestions = questions.filter((q) => nichePreferences.topicIds.includes(q.categoryId) && q.difficulty === nichePreferences.difficulty);
if (nicheExactQuestions.length >= DAILY_CHALLENGE_SIZE) {
  assert.ok(nicheSelection.every((q) => nicheExactQuestions.some((exact) => exact.id === q.id)),
    'a full exact-match pool should not need fallback questions');
} else {
  for (const question of nicheExactQuestions) {
    assert.ok(nicheSelection.some((selected) => selected.id === question.id),
      `matching question ${question.id} should be prioritized before fallback questions`);
  }
}
// Keep fallback coverage even as the real catalogue grows beyond seven matches.
const scarceMatches = nicheExactQuestions.slice(0, 2);
const fallbackBank = [...scarceMatches, ...questions.filter((q) =>
  !nichePreferences.topicIds.includes(q.categoryId) && q.difficulty === 'hard')];
assert.ok(fallbackBank.length >= DAILY_CHALLENGE_SIZE);
const fallbackSelection = selectDailyQuestions(dateKey, fallbackBank, nichePreferences);
assert.equal(fallbackSelection.length, DAILY_CHALLENGE_SIZE);
assert.ok(scarceMatches.every((q) => fallbackSelection.some((selected) => selected.id === q.id)),
  'scarce exact matches must be selected before filling from other topics');
assert.ok(nicheSelection.every((q) => q.difficulty === 'hard'), 'the challenge should retain difficulty when the bank can fill it');
assert.deepEqual(
  selectDailyQuestions(dateKey, questions, nichePreferences).map((q) => q.id),
  selectDailyQuestions(dateKey, questions, nichePreferences).map((q) => q.id),
  'personalized selection should be deterministic',
);

assert.equal(getAthensDateKey(new Date('2026-10-29T20:30:00.000Z')), '2026-10-29', 'Athens date before local midnight');
assert.equal(getAthensDateKey(new Date('2026-10-29T22:30:00.000Z')), '2026-10-30', 'Athens date after local midnight');

const ids = selectedA.map((q) => q.id);
const validStarted = {
  ...emptyDailyChallengeRecord(dateKey),
  questionIds: ids,
  started: true,
};
assert.deepEqual(
  parseDailyChallengeRecord(JSON.stringify(validStarted), dateKey).questionIds,
  ids,
  'a valid fresh session should restore'
);

const validInProgress = {
  ...validStarted,
  currentIndex: 1,
  answers: { '0': selectedA[0].correctIndex },
};
assert.equal(parseDailyChallengeRecord(JSON.stringify(validInProgress), dateKey).currentIndex, 1, 'an in-progress session should restore');

const validCompleted = {
  ...validStarted,
  currentIndex: DAILY_CHALLENGE_SIZE - 1,
  answers: Object.fromEntries(selectedA.map((q, index) => [String(index), q.correctIndex])),
  completed: true,
};
assert.equal(parseDailyChallengeRecord(JSON.stringify(validCompleted), dateKey).completed, true, 'completed session should restore');
assert.equal(parseDailyChallengeRecord('{not json', dateKey), null, 'malformed JSON must be rejected');
assert.equal(parseDailyChallengeRecord(JSON.stringify(validStarted), '2026-10-30'), null, 'yesterday session must not restore as today');
assert.equal(parseDailyChallengeRecord(JSON.stringify({ ...validStarted, questionIds: ids.slice(1).concat(ids[0]) }), dateKey).questionIds.length, DAILY_CHALLENGE_SIZE, 'valid ordering of known questions should remain valid');
assert.equal(parseDailyChallengeRecord(JSON.stringify({ ...validStarted, questionIds: [ids[0], ids[0], ...ids.slice(2)] }), dateKey), null, 'duplicate question IDs must be rejected');
assert.equal(parseDailyChallengeRecord(JSON.stringify({ ...validStarted, questionIds: ['not-a-question', ...ids.slice(1)] }), dateKey), null, 'unknown question IDs must be rejected');
assert.equal(parseDailyChallengeRecord(JSON.stringify({ ...validStarted, currentIndex: 3, answers: { '0': 0 } }), dateKey), null, 'impossible skipped-question state must be rejected');
assert.equal(parseDailyChallengeRecord(JSON.stringify({ ...validCompleted, answers: { '0': 0 } }), dateKey), null, 'incomplete completed session must be rejected');

console.log(`Daily challenge checks passed (${questions.length} questions; topic/difficulty preferences, Athens date handling, stable seven-question selection, and saved-session validation).`);
