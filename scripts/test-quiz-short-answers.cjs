/* Greek short-answer and mistake-spotting security/compatibility contracts. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/quiz/engine.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(js, { module, exports: module.exports });
const e = module.exports;
function make(id, type, content) {
  const prompt = id + ' question?';
  return { id, type, version: e.contentVersion(prompt, content), prompt, content,
    categoryId: 'history', subcategoryId: 'athens', conceptIds: [id],
    difficulty: 'medium', difficultyOrigin: 'editorial', explanation: 'Επεξήγηση',
    sources: [{ title: 'Britannica', url: 'https://www.britannica.com/place/ancient-Greece' }] };
}
const mistake = { segments: [
  { id: 'a', text: 'Η συνέλευση' }, { id: 'b', text: 'συμμετείχε' },
  { id: 'c', text: 'στην πολιτική ζωή.' },
], incorrectSegmentId: 'b', correction: 'Συνεδρίαζε.' };
const spot = make('spot-demo', 'spot-the-mistake', mistake);
assert.equal(e.evaluateAnswer(spot, 'b').correct, true);
assert.deepEqual(JSON.parse(JSON.stringify(e.evaluateAnswer(spot, 'a'))), { valid: true, correct: false });
assert.equal(e.evaluateAnswer(spot, 'not-in-question').valid, false);
assert.equal(e.evaluateAnswer(spot, 1).valid, false);
const blank = { before: 'Η συνέλευση ονομαζόταν', after: '.',
  acceptedAnswers: ['Εκκλησία του Δήμου', 'Εκκλησία Δήμου'], displayAnswer: 'Εκκλησία του Δήμου' };
const fill = make('fill-demo', 'fill-in-the-blank', blank);
for (const answer of ['Εκκλησία του Δήμου', 'εκκλησια του δημου', '  ΕΚΚΛΗΣΙΑ   ΤΟΥ ΔΗΜΟΥ ',
  'ΕΚΚΛΗΣΊΑ ΤΟΥ ΔΉΜΟΥ', 'Εκκλησία Δήμου']) {
  assert.equal(e.evaluateAnswer(fill, answer).correct, true, answer);
}
assert.equal(e.normalizeBlankAnswer(' ΔΗΜΟΣ '), e.normalizeBlankAnswer('δήμος'), 'final sigma');
assert.equal(e.evaluateAnswer(fill, 'Βουλή των Πεντακοσίων').correct, false);
assert.equal(e.evaluateAnswer(fill, 'Εκκλησεια του Δημου').correct, false, 'not fuzzy spelling');
for (const answer of ['', '    ', '\n', 'x'.repeat(81)]) assert.equal(e.evaluateAnswer(fill, answer).valid, false);
assert.equal(e.evaluateAnswer(fill, null).valid, false);
const sensitive = make('accent', 'fill-in-the-blank',
  { ...blank, acceptedAnswers: ['Δήμος'], displayAnswer: 'Δήμος', accentSensitive: true });
assert.equal(e.evaluateAnswer(sensitive, 'Δήμος').correct, true);
assert.equal(e.evaluateAnswer(sensitive, 'δημοσ').correct, false, 'accent-sensitive authoring is possible');
const badBlank = [
  { ...blank, acceptedAnswers: ['Δήμος', 'Δημος'], displayAnswer: 'Δήμος' },
  { ...blank, displayAnswer: 'Αδύνατο' },
  { ...blank, acceptedAnswers: [] },
  { ...blank, acceptedAnswers: ['  '] },
  { ...blank, accentSensitive: 'yes' },
];
for (const [index, content] of badBlank.entries()) {
  assert.throws(() => e.createQuizSession('invalid-' + index, 'challenge', [make('bad-fill', 'fill-in-the-blank', content)]),
    /invalid_quiz_session/);
}
for (const content of [
  { ...mistake, incorrectSegmentId: 'missing' },
  { ...mistake, correction: '' },
  { ...mistake, segments: [mistake.segments[0], mistake.segments[0], mistake.segments[2]] },
]) assert.throws(() => e.createQuizSession('invalid-spot', 'challenge', [make('bad-spot', 'spot-the-mistake', content)]),
  /invalid_quiz_session/);
let session = e.createQuizSession('mixed-spot-fill', 'challenge', [spot, fill]);
let next = e.submitQuizAnswer(session, e.questionToken(session), 'a');
assert.equal(next.changed, true);
assert.equal(e.submitQuizAnswer(next.session, e.questionToken(next.session), 'b').reason, 'duplicate');
session = e.advanceQuizSession(next.session, e.questionToken(next.session)).session;
next = e.submitQuizAnswer(session, e.questionToken(session), 'ΕΚΚΛΗΣΙΑ ΤΟΥ ΔΗΜΟΥ');
assert.equal(next.changed, true);
session = e.advanceQuizSession(next.session, e.questionToken(next.session)).session;
const restored = e.restoreQuizSession(e.serializeQuizSession(session));
const result = e.calculateQuizResults(restored);
assert.equal(result.correctCount, 1);
assert.equal(result.answeredCount, 2);
assert.equal(result.completed, true);
const tampered = JSON.parse(e.serializeQuizSession(session));
tampered.answers[fill.id].value = '';
assert.throws(() => e.parseQuizSession(tampered), /invalid_quiz_session/, 'corrupt blank cannot restore');
console.log('Short answers passed: Greek accents, case, spaces, final sigma, alternate solutions, strict spelling, content validation, serialization and tamper rejection.');
