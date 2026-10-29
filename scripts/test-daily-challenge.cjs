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

const questionData = loadTypeScript('src/data/questions.ts');
const dailyUtils = loadTypeScript('src/utils/dailyChallenge.ts', (id) => {
  if (id === '../data/questions') return questionData;
  throw new Error(`Unexpected import: ${id}`);
});

const { DAILY_CHALLENGE_SIZE, questions } = questionData;
const { emptyDailyChallengeRecord, getAthensDateKey, parseDailyChallengeRecord, selectDailyQuestions } = dailyUtils;
const dateKey = '2026-10-29';

assert.ok(questions.length >= DAILY_CHALLENGE_SIZE, 'question bank needs at least seven questions');
assert.equal(new Set(questions.map((q) => q.id)).size, questions.length, 'question IDs must be unique');
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
assert.deepEqual(selectedA.map((q) => q.id), selectedB.map((q) => q.id), 'selection must be deterministic for a date');
assert.notDeepEqual(selectedA.map((q) => q.id), selectDailyQuestions('2026-10-30').map((q) => q.id), 'the selected set should rotate between dates');
assert.equal(new Set(selectedA.map((q) => q.id)).size, DAILY_CHALLENGE_SIZE, 'daily selection must not repeat a question');
assert.deepEqual(selectDailyQuestions(dateKey, questions.slice(0, DAILY_CHALLENGE_SIZE - 1)), [], 'selection must not silently return a short quiz');

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

console.log(`Daily challenge checks passed (${questions.length} questions; seven-question selection, Athens date handling, and saved-session validation).`);
