/* Node-only contract tests for new question types. No React Native/device mocks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(js, {
    module, exports: module.exports,
    require: id => { throw Error('unexpected runtime import: ' + id); },
  });
  return module.exports;
}
const engine = load('src/quiz/engine.ts');
const copy = value => JSON.parse(JSON.stringify(value));
const make = (id, type, content) => ({
  id, type, version: engine.contentVersion('Ερώτηση ' + id, content),
  categoryId: 'history', subcategoryId: 'ancient-greece',
  conceptIds: [id], difficulty: 'medium', difficultyOrigin: 'editorial',
  prompt: 'Ερώτηση ' + id, explanation: 'Επεξήγηση ' + id,
  sources: [{ title: 'Test fixture', url: 'https://example.org/source' }],
  content,
});

const multi = make('multi', 'multiple-select', {
  answers: ['Κλήρωση', 'Καθολική συμμετοχή', 'Εκκλησία του Δήμου'],
  correctIndices: [0, 2],
});
const order = make('order', 'ordering', {
  items: [{ id: 'classical', label: 'Κλασική' }, { id: 'mycenaean', label: 'Μυκηναϊκή' }, { id: 'geometric', label: 'Γεωμετρική' }],
  correctOrder: ['mycenaean', 'geometric', 'classical'],
});
const matching = make('matching', 'matching', {
  pairs: [
    { leftId: 'assembly', leftLabel: 'Εκκλησία', rightId: 'citizens', rightLabel: 'Συμμετοχή πολιτών' },
    { leftId: 'council', leftLabel: 'Βουλή', rightId: 'preparation', rightLabel: 'Προετοιμασία εργασιών' },
  ],
});
const legacy = make('legacy', 'multiple-choice', { answers: ['Μυκήνες', 'Αθήνα'], correctIndex: 1 });

for (const [question, correct, wrong, invalid] of [
  [multi, [2, 0], [0], [[0, 0], [0, 3], [], [0, '2'], '0', null]],
  [order, ['mycenaean', 'geometric', 'classical'], ['classical', 'geometric', 'mycenaean'], [['mycenaean'], ['mycenaean', 'mycenaean', 'classical'], ['mycenaean', 'geometric', 'other'], 0]],
  [matching, { assembly: 'citizens', council: 'preparation' }, { assembly: 'preparation', council: 'citizens' }, [{ assembly: 'citizens' }, { assembly: 'citizens', council: 'citizens' }, { assembly: 'citizens', council: 'unknown' }, { assembly: 'citizens', council: 'preparation', extra: 'citizens' }, []]],
  [legacy, 1, 0, [null, 1.5, '1', [], 99]],
]) {
  assert.deepEqual(copy(engine.evaluateAnswer(question, correct)), { valid: true, correct: true }, question.id);
  assert.deepEqual(copy(engine.evaluateAnswer(question, wrong)), { valid: true, correct: false }, question.id);
  for (const value of invalid) {
    assert.deepEqual(copy(engine.evaluateAnswer(question, value)), { valid: false, correct: false }, question.id + ': invalid ' + JSON.stringify(value));
  }
  const original = engine.createQuizSession('audit:' + question.id, 'review', [question]);
  assert.deepEqual(copy(engine.restoreQuizSession(engine.serializeQuizSession(original))), copy(original));
}
const badContents = [
  [multi, { answers: ['a', 'b'], correctIndices: [0, 0] }],
  [multi, { answers: ['a', 'b'], correctIndices: [2] }],
  [multi, { answers: ['a', 'b'], correctIndices: [] }],
  [order, { items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }], correctOrder: ['a', 'a'] }],
  [order, { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOrder: ['a', 'a'] }],
  [matching, { pairs: [{ leftId: 'a', leftLabel: 'A', rightId: 'x', rightLabel: 'X' }, { leftId: 'b', leftLabel: 'B', rightId: 'x', rightLabel: 'Y' }] }],
];
for (const [question, content] of badContents) {
  assert.throws(() => engine.createQuizSession('bad-content', 'daily', [{ ...question, content }]), /invalid_quiz_session/);
}

const bank = [multi, order, matching, legacy];
let session = engine.createQuizSession('mixed', 'daily', bank);
const originalBytes = engine.serializeQuizSession(session);
const submitted = [
  [0, 2],                                      // correct, regardless of tap order
  ['classical', 'geometric', 'mycenaean'],        // valid but incorrect
  { council: 'preparation', assembly: 'citizens' }, // correct, regardless of key order
  1,                                           // unchanged legacy answer
];
for (let i = 0; i < bank.length; i++) {
  const token = engine.questionToken(session);
  assert.equal(engine.advanceQuizSession(session, token).reason, 'answer-required');
  assert.equal(engine.submitQuizAnswer(session, { ...token, version: 'stale' }, submitted[i]).reason, 'stale-question');
  assert.equal(engine.submitQuizAnswer(session, token, null).reason, 'invalid-answer');
  const accepted = engine.submitQuizAnswer(session, token, submitted[i]);
  assert.equal(accepted.reason, 'accepted');
  assert.equal(engine.submitQuizAnswer(accepted.session, token, submitted[i]).reason, 'duplicate');
  const resumed = engine.restoreQuizSession(engine.serializeQuizSession(accepted.session));
  assert.deepEqual(copy(resumed), copy(accepted.session));
  session = engine.advanceQuizSession(resumed, token).session;
}
assert.equal(engine.serializeQuizSession(engine.createQuizSession('mixed', 'daily', bank)), originalBytes);
assert.equal(session.completed, true);
const results = engine.calculateQuizResults(session, 100);
assert.equal(results.correctCount, 3);
assert.equal(results.answeredCount, 4);
assert.equal(results.points, 300);
assert.deepEqual(copy(results.incorrectQuestionIds), ['order']);
assert.equal(engine.submitQuizAnswer(session, engine.questionToken(session), 1).reason, 'completed');
for (const tamper of [
  raw => raw.answers.multi.value = [0, 0],
  raw => raw.answers.order.value = ['mycenaean'],
  raw => raw.answers.matching.value = { assembly: 'citizens', council: 'citizens' },
  raw => raw.answers.matching.questionVersion = 'edited',
]) {
  const raw = copy(session);
  tamper(raw);
  assert.throws(() => engine.parseQuizSession(raw), /invalid_quiz_session/);
}
assert.throws(() => engine.createQuizSession('unsupported', 'review', [make('unknown', 'future-format', {})]), /invalid_quiz_session/);
assert.equal(engine.evaluateAnswer(multi, [0, 2]).correct, true, 'multi-select is order-insensitive');
assert.notEqual(engine.contentVersion(multi.prompt, { ...multi.content, correctIndices: [1] }), multi.version, 'scored content edits require a new revision');
console.log('Quiz question types passed: multiple-select, ordering, matching, legacy choices, wrong/invalid answers, serialization, mixed results, tamper detection and stale/duplicate transitions.');
