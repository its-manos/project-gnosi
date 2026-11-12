const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { playerTrophies, nextTrophy, playerClass, PLAYER_CLASSES } = load('src/gamification/trophies.ts');
const empty = { lessons: 0, worlds: 0, daily: 0, streak: 0, revision: 0, hangman: 0 };
assert.equal(playerTrophies(empty).length, 24);
assert.equal(playerTrophies(empty).filter(t => t.unlocked).length, 0);
assert.equal(new Set(playerTrophies(empty).map(t => t.id)).size, 24);
const { playerTitle } = load('src/gamification/rules.ts');
for (let level = 1; level <= 50; level++) assert.equal(playerClass(level).title, playerTitle(level));
const earned = playerTrophies({ lessons: 5, worlds: 3, daily: 7, streak: 7, revision: 10, hangman: 10 });
assert.equal(earned.filter(t => t.unlocked).length, 12);
assert.equal(nextTrophy(earned).id, 'worlds:5');
assert.equal(nextTrophy(playerTrophies(Object.fromEntries(Object.keys(empty).map(k => [k, 1000])))), undefined);
for (const item of PLAYER_CLASSES) {
  assert.equal(playerClass(item.level).id, item.id);
  if (item.level > 1) assert.notEqual(playerClass(item.level - 1).id, item.id);
}
assert.equal(playerClass(-1).id, 'novice');
console.log('Player class boundaries and trophy milestones passed');
