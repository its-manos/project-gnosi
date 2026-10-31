const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
function loadTypeScriptModule(relativePath, mockedImports = {}) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require(id) {
      if (Object.hasOwn(mockedImports, id)) return mockedImports[id];
      throw new Error(`Unexpected import in isolated test: ${id}`);
    },
    Date,
    Set,
    Map,
    Math,
    Number,
    Object,
    Array,
    JSON,
    console,
  });
  return module.exports;
}

const questionBank = loadTypeScriptModule('src/data/questions.ts');
const historyModule = loadTypeScriptModule('src/utils/dailyChallengeHistory.ts', {
  '../quiz/engine': loadTypeScriptModule('src/quiz/engine.ts'),
  '../data/questions': questionBank,
});
const { questions, DAILY_CHALLENGE_SIZE } = questionBank;
const {
  createCompletedHistoryEntry,
  parseDailyChallengeHistory,
  upsertDailyChallengeHistory,
  removeDailyChallengeHistoryDate,
} = historyModule;

const selected = questions.slice(0, DAILY_CHALLENGE_SIZE);
const answers = Object.fromEntries(selected.map((question, index) => [String(index), question.correctIndex]));
const completeRecord = {
  dateKey: '2026-10-29',
  questionIds: selected.map((question) => question.id),
  currentIndex: DAILY_CHALLENGE_SIZE - 1,
  answers,
  started: true,
  completed: true,
};
const entry = createCompletedHistoryEntry(completeRecord);
assert.ok(entry);
assert.equal(entry.correctCount, DAILY_CHALLENGE_SIZE);
assert.equal(entry.score, 700);

const persisted = JSON.stringify([entry]);
const parsed = parseDailyChallengeHistory(persisted);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].dateKey, '2026-10-29');
assert.equal(parsed[0].score, 700);

const replayedSameDay = { ...entry, correctCount: 4, score: 400 };
const upserted = upsertDailyChallengeHistory(parsed, replayedSameDay);
assert.equal(upserted.length, 1, 'Same-day replays must replace, not duplicate, history.');
assert.equal(upserted[0].score, 400);
assert.equal(removeDailyChallengeHistoryDate(upserted, '2026-10-29').length, 0);
assert.equal(parseDailyChallengeHistory('{malformed').length, 0);
assert.equal(createCompletedHistoryEntry({ ...completeRecord, completed: false }), null);

const broken = JSON.parse(persisted);
broken[0].answers['6'] = 8;
assert.equal(parseDailyChallengeHistory(JSON.stringify(broken)).length, 0, 'Impossible saved answers must be discarded.');

console.log('Daily challenge history tests passed.');
