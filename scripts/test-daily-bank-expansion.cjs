const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, imports = {}) {
  const filename = path.join(root, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputText)(id => {
    assert.ok(Object.hasOwn(imports, id), `Unexpected import ${id}`);
    return imports[id];
  }, module, module.exports);
  return module.exports;
}
const data = load('src/data/questions.ts');
const topics = load('src/data/dailyChallengeTopics.ts');
const imports = { '../data/questions': data, '../data/dailyChallengeTopics': topics };
const daily = load('src/utils/dailyChallenge.ts', imports);
const history = load('src/utils/dailyChallengeHistory.ts', imports);
const original = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/daily-bank-before-expansion.json'), 'utf8'));
const { questions, DAILY_CHALLENGE_SIZE: size } = data;
const oldIds = new Set(original.map(q => q.id));
const added = questions.filter(q => !oldIds.has(q.id));
assert.equal(added.length, 72);
assert.equal(questions.length, original.length + 72);
assert.deepEqual(questions.slice(0, original.length), original, 'Published questions and ordering must stay unchanged');
assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
assert.equal(new Set(questions.map(q => q.question.normalize('NFC').trim())).size, questions.length);
for (const q of questions) {
  assert.equal(q.answers.length, 4, q.id);
  assert.equal(new Set(q.answers.map(a => a.trim())).size, 4, q.id);
  assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, q.id);
  assert.ok(topics.DAILY_CHALLENGE_TOPICS.some(t => t.id === q.categoryId), q.id);
  assert.ok(['easy', 'medium', 'hard'].includes(q.difficulty), q.id);
  assert.ok(q.question.trim() && q.explanation.trim() && q.sourceTitle.trim(), q.id);
  assert.equal(new URL(q.sourceUrl).protocol, 'https:', q.id);
}
for (const t of topics.DAILY_CHALLENGE_TOPICS) {
  for (const d of ['easy', 'medium', 'hard']) {
    assert.equal(added.filter(q => q.categoryId === t.id && q.difficulty === d).length, 3, `${t.id}/${d}`);
  }
}
for (let slot = 0; slot < 4; slot++) assert.equal(added.filter(q => q.correctIndex === slot).length, 18);
// Every supported interest subset now has >=9 exact-level candidates. Exercise
// the real selector, determinism and saved-attempt parser across 30 Athens dates.
const ids = topics.DAILY_CHALLENGE_TOPICS.map(t => t.id);
let selections = 0;
for (let mask = 0; mask < 2 ** ids.length; mask++) {
  const topicIds = ids.filter((_, i) => mask & (1 << i));
  if (topicIds.length < 3 || topicIds.length > 5) continue;
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (let day = 1; day <= 30; day++) {
      const dateKey = `2026-11-${String(day).padStart(2, '0')}`;
      const prefs = { topicIds, difficulty };
      const picked = daily.selectDailyQuestions(dateKey, questions, prefs);
      assert.equal(picked.length, size);
      assert.equal(new Set(picked.map(q => q.id)).size, size);
      assert.ok(picked.every(q => topicIds.includes(q.categoryId) && q.difficulty === difficulty));
      assert.deepEqual(daily.selectDailyQuestions(dateKey, questions, { ...prefs, topicIds: [...topicIds].reverse() }), picked);
      const record = { dateKey, questionIds: picked.map(q => q.id), currentIndex: 0, answers: {}, started: true, completed: false };
      assert.deepEqual(daily.parseDailyChallengeRecord(JSON.stringify(record), dateKey), record);
      selections++;
    }
  }
}
// Attempts generated with the old bank stay pinned even though selection for a
// new attempt can now change. Test all three levels, mixed answers and histories.
for (const difficulty of ['easy', 'medium', 'hard']) {
  const dateKey = '2026-10-31';
  const picked = daily.selectDailyQuestions(dateKey, original, { topicIds: ['science', 'history', 'culture'], difficulty });
  const questionIds = picked.map(q => q.id);
  const answers = Object.fromEntries(picked.map((q, i) => [String(i), i % 2 ? (q.correctIndex + 1) % 4 : q.correctIndex]));
  const started = { dateKey, questionIds, currentIndex: 2, answers: { 0: answers[0], 1: answers[1] }, started: true, completed: false };
  assert.deepEqual(daily.parseDailyChallengeRecord(JSON.stringify(started), dateKey), started);
  const complete = { dateKey, questionIds, currentIndex: size - 1, answers, started: true, completed: true };
  assert.deepEqual(daily.parseDailyChallengeRecord(JSON.stringify(complete), dateKey), complete);
  const entry = history.createCompletedHistoryEntry(complete);
  assert.equal(entry.correctCount, 4);
  assert.equal(entry.score, 400);
  assert.deepEqual(history.parseDailyChallengeHistory(JSON.stringify([entry])), [entry]);
}
for (const t of topics.DAILY_CHALLENGE_TOPICS) {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const picked = added.filter(q => q.categoryId === t.id || q.difficulty === difficulty).slice(0, size);
    const complete = { dateKey: '2026-10-31', questionIds: picked.map(q => q.id), currentIndex: size - 1, answers: Object.fromEntries(picked.map((q, i) => [String(i), q.correctIndex])), started: true, completed: true };
    assert.equal(history.createCompletedHistoryEntry(complete).score, 700);
  }
}
console.log(`Daily bank expansion passed: ${original.length} unchanged + ${added.length} new; ${selections} preference/date selections; pinned old sessions and scores preserved.`);
