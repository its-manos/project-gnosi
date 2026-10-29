const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const utilPath = path.join(__dirname, '..', 'src', 'utils', 'progressStats.ts');
const source = fs.readFileSync(utilPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sandboxModule = { exports: {} };
vm.runInNewContext(compiled, {
  exports: sandboxModule.exports,
  module: sandboxModule,
  Date,
  Set,
  Map,
  Math,
  Number,
  Object,
  Array,
});
const { calculateDailyChallengeProgress } = sandboxModule.exports;

function entry(dateKey, correctCount) {
  return { dateKey, correctCount, score: correctCount * 100, questionIds: [], answers: {} };
}

const empty = calculateDailyChallengeProgress([], '2026-10-29');
assert.deepEqual({
  completedChallenges: empty.completedChallenges,
  totalPoints: empty.totalPoints,
  accuracyPercent: empty.accuracyPercent,
  currentStreak: empty.currentStreak,
  longestStreak: empty.longestStreak,
}, {
  completedChallenges: 0,
  totalPoints: 0,
  accuracyPercent: 0,
  currentStreak: 0,
  longestStreak: 0,
});

const stats = calculateDailyChallengeProgress([
  entry('2026-10-26', 7),
  entry('2026-10-28', 4),
  entry('2026-10-29', 5),
], '2026-10-29');
assert.equal(stats.completedChallenges, 3);
assert.equal(stats.totalPoints, 1600);
assert.equal(stats.totalCorrectAnswers, 16);
assert.equal(stats.totalAnswers, 21);
assert.equal(stats.accuracyPercent, 76);
assert.equal(stats.currentStreak, 2);
assert.equal(stats.longestStreak, 2);

const yesterdayStreak = calculateDailyChallengeProgress([
  entry('2026-10-27', 2),
  entry('2026-10-28', 3),
], '2026-10-29');
assert.equal(yesterdayStreak.currentStreak, 2, 'A streak remains current until a day is missed.');

const brokenStreak = calculateDailyChallengeProgress([
  entry('2026-10-26', 2),
  entry('2026-10-27', 3),
], '2026-10-29');
assert.equal(brokenStreak.currentStreak, 0);
assert.equal(brokenStreak.longestStreak, 2);

const duplicateDate = calculateDailyChallengeProgress([
  entry('2026-10-29', 1),
  entry('2026-10-29', 6),
], '2026-10-29');
assert.equal(duplicateDate.completedChallenges, 1, 'A date must count as one challenge, even after a development replay.');
assert.equal(duplicateDate.totalPoints, 600);

console.log('Progress stats tests passed.');
