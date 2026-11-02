/* Word-bank blank and mistake-spotting engine contracts, including saved session safety. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/quiz/engine.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const engineModule = { exports: {} };
vm.runInNewContext(js, { module: engineModule, exports: engineModule.exports });
const e = engineModule.exports;
function make(id, type, content) {
  const prompt = id + ' question?';
  return { id, type, version: e.contentVersion(prompt, content), prompt, content,
    categoryId: 'history', subcategoryId: 'athens', conceptIds: [id],
    difficulty: 'medium', difficultyOrigin: 'editorial', explanation: 'Επεξήγηση',
    sources: [{ title: 'Britannica', url: 'https://www.britannica.com/place/ancient-Greece' }] };
}
const mistake = { options: [
  { id: 'a', text: 'Η Βουλή αποτελούνταν από πεντακόσιους πολίτες.' },
  { id: 'b', text: 'Η Βουλή των Πεντακοσίων είχε ισόβια θητεία.' },
  { id: 'c', text: 'Η Βουλή προετοίμαζε την ημερήσια διάταξη της συνέλευσης.' },
  { id: 'd', text: 'Τα μέλη της Βουλής επιλέγονταν κυρίως με κλήρωση.' },
], incorrectOptionId: 'b', correction: 'Τα μέλη υπηρετούσαν για ένα έτος.' };
const spot = make('spot-demo', 'spot-the-mistake', mistake);
assert.equal(e.evaluateAnswer(spot, 'b').correct, true);
assert.deepEqual(JSON.parse(JSON.stringify(e.evaluateAnswer(spot, 'a'))), { valid: true, correct: false });
assert.equal(e.evaluateAnswer(spot, 'not-in-question').valid, false);
assert.equal(e.evaluateAnswer(spot, 1).valid, false);
assert.equal(e.evaluateAnswer(spot, 'd').valid, true, 'true statements are allowed selections');
assert.equal(e.evaluateAnswer(spot, 'd').correct, false, 'true statements are incorrect answers');

const blank = { before: 'Η συνέλευση ονομαζόταν', after: '.',
  options: [
    { id: 'council', text: 'Βουλή των Πεντακοσίων' },
    { id: 'assembly', text: 'Εκκλησία του Δήμου' },
    { id: 'areopagus', text: 'Άρειος Πάγος' },
    { id: 'court', text: 'Ηλιαία' },
  ], correctOptionId: 'assembly' };
const fill = make('fill-demo', 'fill-in-the-blank', blank);
assert.deepEqual(JSON.parse(JSON.stringify(e.evaluateAnswer(fill, 'assembly'))), { valid: true, correct: true });
for (const option of blank.options.filter(o => o.id !== blank.correctOptionId)) {
  assert.deepEqual(JSON.parse(JSON.stringify(e.evaluateAnswer(fill, option.id))), { valid: true, correct: false });
}
for (const answer of ['', ' ', 'Εκκλησία του Δήμου', 'ASSEMBLY', 'unknown-id', 1, null, [], {}]) {
  assert.equal(e.evaluateAnswer(fill, answer).valid, false, 'only exact authored option IDs are accepted: ' + String(answer));
}
const badBlank = [
  { ...blank, correctOptionId: 'missing' },
  { ...blank, options: [] },
  { ...blank, options: [blank.options[0]] },
  { ...blank, options: [...blank.options, blank.options[0]] },
  { ...blank, options: [{ id: 'x', text: 'Δήμος' }, { id: 'y', text: '  δήμος ' }], correctOptionId: 'x' },
  { ...blank, options: [{ id: '__proto__', text: 'Απαντήσεις' }, blank.options[1]] },
  { ...blank, options: [{ id: 'bad', text: '  ' }, blank.options[1]] },
  { ...blank, before: ' ', after: ' ' },
];
for (const [index, content] of badBlank.entries()) {
  assert.throws(() => e.createQuizSession('invalid-' + index, 'challenge', [make('bad-fill', 'fill-in-the-blank', content)]),
    /invalid_quiz_session/, 'invalid bank content ' + index);
}
for (const content of [
  { ...mistake, incorrectOptionId: 'missing' },
  { ...mistake, correction: '' },
  { ...mistake, options: [mistake.options[0], mistake.options[0], mistake.options[2]] },
  { ...mistake, options: [mistake.options[0], mistake.options[1]] },
  { ...mistake, options: [{ ...mistake.options[0], text: ' ' }, mistake.options[1], mistake.options[2]] },
]) {
  assert.throws(() => e.createQuizSession('invalid-spot', 'challenge', [make('bad-spot', 'spot-the-mistake', content)]),
    /invalid_quiz_session/);
}
let session = e.createQuizSession('mixed-spot-fill', 'challenge', [spot, fill]);
let next = e.submitQuizAnswer(session, e.questionToken(session), 'a');
assert.equal(next.changed, true);
assert.equal(e.submitQuizAnswer(next.session, e.questionToken(next.session), 'b').reason, 'duplicate');
session = e.advanceQuizSession(next.session, e.questionToken(next.session)).session;
assert.equal(e.submitQuizAnswer(session, e.questionToken(session), 'Εκκλησία του Δήμου').reason,
  'invalid-answer', 'typed text is no longer an accepted submission');
assert.equal(e.submitQuizAnswer(session, e.questionToken(session), 'unknown-id').reason, 'invalid-answer');
next = e.submitQuizAnswer(session, e.questionToken(session), 'assembly');
assert.equal(next.changed, true);
assert.equal(e.submitQuizAnswer(next.session, e.questionToken(next.session), 'council').reason, 'duplicate');
session = e.advanceQuizSession(next.session, e.questionToken(next.session)).session;
const restored = e.restoreQuizSession(e.serializeQuizSession(session));
const result = e.calculateQuizResults(restored);
assert.equal(result.correctCount, 1);
assert.equal(result.answeredCount, 2);
assert.equal(result.completed, true);
const tampered = JSON.parse(e.serializeQuizSession(session));
tampered.answers[fill.id].value = 'not-a-tile';
assert.throws(() => e.parseQuizSession(tampered), /invalid_quiz_session/, 'unknown word-bank tile cannot restore');
const changedBank = make('fill-demo', 'fill-in-the-blank', { ...blank, correctOptionId: 'council' });
assert.notEqual(changedBank.version, fill.version, 'editing the correct option changes the version fingerprint');
console.log('Word-bank quiz contracts passed: valid and wrong tiles, invalid IDs, duplicate labels, content revisions, session serialization, tamper rejection and legacy safety.');
