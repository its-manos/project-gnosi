/* global __dirname */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const cache = new Map();
function load(file) {
 if (cache.has(file)) return cache.get(file);
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
 vm.runInNewContext(code, { module, exports: module.exports, Intl, Date, console, require: id => {
  if (id.startsWith('.')) return load(path.normalize(path.join(path.dirname(file), id)) + '.ts');
  throw Error(id);
 }});
 cache.set(file, module.exports); return module.exports;
}
const engine = load('src/quiz/engine.ts'), adapters = load('src/quiz/adapters.ts'), bridge = load('src/quiz/compatibility.ts');
const { lessons } = load('src/data/lessons.ts'), { questions } = load('src/data/questions.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const sourceSnapshot = JSON.stringify([lessons, questions]);
const all = [...questions.map(adapters.adaptDailyQuestion), ...lessons.flatMap(l => l.questions.map((_, i) => adapters.adaptLessonQuestion(l, i)))];
assert.equal(new Set(all.map(q => q.id)).size, all.length, 'IDs are globally unique across daily and lesson banks');
for (const question of all) {
 const session = engine.createQuizSession('audit', 'challenge', [question]);
 assert.equal(engine.evaluateAnswer(question, question.content.correctIndex).correct, true);
 for (const answer of [null, undefined, NaN, Infinity, -1, 0.5, '0', 999, {}, []]) assert.equal(engine.evaluateAnswer(question, answer).valid, false);
 assert.ok(question.sources.length > 0, question.id);
 assert.deepEqual(plain(engine.restoreQuizSession(engine.serializeQuizSession(session))), plain(session));
}
assert.equal(JSON.stringify([lessons, questions]), sourceSnapshot, 'adapters leave every published question, source and answer order intact');
const q = all.slice(0, 3), initial = engine.createQuizSession('session:test', 'daily', q), initialBytes = engine.serializeQuizSession(initial);
assert.equal(engine.advanceQuizSession(initial, engine.questionToken(initial)).reason, 'answer-required');
assert.equal(engine.submitQuizAnswer(initial, { ...engine.questionToken(initial), version: 'old' }, 0).reason, 'stale-question');
let state = initial;
for (let i = 0; i < q.length; i++) {
 const token = engine.questionToken(state), answer = i === 1 ? (q[i].content.correctIndex + 1) % 4 : q[i].content.correctIndex;
 const transition = engine.submitQuizAnswer(state, token, answer);
 assert.equal(transition.changed, true);
 assert.equal(engine.submitQuizAnswer(transition.session, token, (answer + 1) % 4).reason, 'duplicate', 'first answer remains final even if wrong');
 const resumed = engine.restoreQuizSession(engine.serializeQuizSession(transition.session));
 assert.equal(engine.submitQuizAnswer(resumed, token, answer).changed, false, 'restart does not permit another scored answer');
 const advanced = engine.advanceQuizSession(resumed, token); assert.equal(advanced.changed, true);
 assert.equal(engine.advanceQuizSession(advanced.session, token).changed, false, 'double Next cannot skip a question');
 if (i < q.length - 1) assert.equal(engine.submitQuizAnswer(advanced.session, token, answer).reason, 'stale-question');
 state = advanced.session;
}
assert.equal(engine.serializeQuizSession(initial), initialBytes, 'transitions never mutate the original session');
const result = engine.calculateQuizResults(state, 100);
assert.equal(result.correctCount, 2); assert.equal(result.points, 200); assert.equal(result.accuracyPercent, 67); assert.equal(result.completed, true);
assert.deepEqual(plain(result.incorrectQuestionIds), [q[1].id]);
assert.equal(engine.submitQuizAnswer(state, engine.questionToken(state), 0).reason, 'completed');
assert.equal(engine.calculateQuizResults(state).points, 2, 'lesson correct-count scale remains one');
for (const invalid of [-1, NaN, Infinity, 0.5]) assert.throws(() => engine.calculateQuizResults(state, invalid), /invalid_scoring_policy/);
const mutate = fn => { const raw = plain(state); fn(raw); assert.throws(() => engine.parseQuizSession(raw), /invalid_quiz_session/); };
mutate(raw => raw.schemaVersion = 2);
mutate(raw => raw.questions[0].id = '__proto__');
mutate(raw => raw.questions[0].type = 'constructor');
mutate(raw => raw.questions[1].id = raw.questions[0].id);
mutate(raw => raw.questions[0].conceptIds = []);
mutate(raw => raw.questions[0].difficulty = 'impossible');
mutate(raw => raw.questions[0].content.correctIndex = 100);
mutate(raw => raw.questions[0].media = { uri: 'asset', alt: 2 });
mutate(raw => raw.answers[q[0].id].questionVersion = 'changed');
mutate(raw => delete raw.answers[q[0].id]);
mutate(raw => raw.answers[q[0].id].value = '2');
mutate(raw => raw.answers.unknown = { questionVersion: '1', value: 0 });
mutate(raw => raw.currentIndex = 0);
assert.throws(() => engine.restoreQuizSession('broken'));
assert.throws(() => engine.createQuizSession('empty', 'review', []));
assert.throws(() => engine.createQuizSession('too-many', 'review', Array.from({ length: 101 }, (_, i) => ({ ...q[0], id: 'q' + i }))));
const injected = { ...plain(state), xp: 99999, result: { correctCount: 999 } };
assert.equal(engine.calculateQuizResults(engine.parseQuizSession(injected)).correctCount, 2, 'cached or injected totals do not determine results');
assert.equal('xp' in engine.parseQuizSession(injected), false);
const original = questions[0];
assert.equal(adapters.adaptDailyQuestion({ ...original, explanation: original.explanation + '!' }).version, q[0].version, 'explanation-only edit preserves scored revision');
assert.notEqual(adapters.adaptDailyQuestion({ ...original, correctIndex: (original.correctIndex + 1) % 4 }).version, q[0].version);
assert.notEqual(adapters.adaptDailyQuestion({ ...original, question: original.question + '!' }).version, q[0].version);
assert.notEqual(adapters.adaptDailyQuestion({ ...original, answers: [...original.answers].reverse() }).version, q[0].version);
const retained = engine.restoreQuizSession(engine.serializeQuizSession(state));
assert.equal(retained.questions[0].version, q[0].version, 'snapshot retains its content revision');
const lesson = lessons[0], normalized = lesson.questions.map((_, i) => adapters.adaptLessonQuestion(lesson, i));
assert.equal(normalized[0].difficultyOrigin, 'legacy-default', 'legacy lesson difficulty is explicitly provisional');
const edited = { ...lesson, questions: [{ ...lesson.questions[0], id: 'curated-id', difficulty: 'hard', version: 'editorial-2', conceptIds: ['arch:load'], media: { uri: 'bundled-image', alt: 'Διάγραμμα φορτίων' } }, ...lesson.questions.slice(1)] };
const curated = adapters.adaptLessonQuestion(edited, 0);
assert.equal(curated.id, 'curated-id'); assert.equal(curated.difficulty, 'hard'); assert.equal(curated.difficultyOrigin, 'editorial'); assert.equal(curated.media.alt, 'Διάγραμμα φορτίων');
assert.equal(curated.version.startsWith('editorial-2:'), true);
const slots = { 0: lesson.questions[0].correctIndex, 1: (lesson.questions[1].correctIndex + 1) % 4 };
const legacy = bridge.restoreLegacySession('inline:test', 'lesson', normalized, slots);
assert.equal(legacy.currentIndex, 2); assert.deepEqual(plain(bridge.legacyAnswerSlots(legacy)), slots);
assert.throws(() => bridge.restoreLegacySession('gap', 'lesson', normalized, { 1: 0 }));
assert.throws(() => bridge.restoreLegacySession('alias', 'lesson', normalized, { '01': 0 }));
assert.throws(() => bridge.restoreLegacySession('range', 'lesson', normalized, { 99: 0 }));
assert.equal(engine.calculateChoiceResults(lesson.questions, { ...slots, 0: 99 }).invalidIndices.length, 1);
const record = { dateKey: '2026-10-31', questionIds: questions.slice(0, 7).map(q => q.id), currentIndex: 0, started: true, completed: false, answers: {} };
const session = bridge.dailyRecordSession(record, questions), submission = engine.submitQuizAnswer(session, engine.questionToken(session), questions[0].correctIndex);
const updated = bridge.updateDailyRecord(record, submission.session);
assert.deepEqual(plain(updated), plain({ ...record, answers: { 0: questions[0].correctIndex } }));
assert.deepEqual(plain(bridge.updateDailyRecord(updated, engine.advanceQuizSession(submission.session, engine.questionToken(submission.session)).session)), plain({ ...updated, currentIndex: 1 }));
assert.equal(bridge.dailyRecordSession({ ...record, started: false }, questions), null);
assert.throws(() => bridge.dailyRecordSession({ ...record, questionIds: ['retired'] }, questions));
assert.throws(() => bridge.updateDailyRecord(record, { ...session, id: 'another-day' }));
// A test-only format demonstrates that progression, serialization and results
// can be reused by future formats; this does not introduce new production UI.
const custom = { ...q[0], id: 'custom', type: 'test-boolean', content: true };
const handlers = { ...engine.DEFAULT_QUESTION_HANDLERS, 'test-boolean': { validateContent: c => typeof c === 'boolean', evaluate: (c, a) => ({ valid: typeof a === 'boolean', correct: a === c }) } };
assert.throws(() => engine.createQuizSession('unsupported', 'review', [custom]));
let customSession = engine.createQuizSession('custom-session', 'review', [custom], handlers);
customSession = engine.submitQuizAnswer(customSession, engine.questionToken(customSession), true, handlers).session;
customSession = engine.advanceQuizSession(customSession, engine.questionToken(customSession)).session;
assert.equal(engine.calculateQuizResults(engine.restoreQuizSession(engine.serializeQuizSession(customSession, handlers), handlers), 1, handlers).correctCount, 1);
console.log(`Unified quiz engine passed: ${all.length} adapted questions, metadata/revisions/sources, validation, transitions, stale and duplicate taps, interrupted resume, legacy bridges, frozen snapshots, results, corruption rejection and handler extension.`);
