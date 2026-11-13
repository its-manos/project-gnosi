const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  Function("module", "exports", "require", code)(module, module.exports,
    id => load(path.join(path.dirname(file), id) + ".ts"));
  return module.exports;
}
const { hangmanWords } = load("src/games/hangman/words.ts");
const { GREEK_ALPHABET: alphabet, MAX_MISTAKES, normalizeGreek, startHangman, guessHangman, nextHangman, hangmanStatus, hangmanMistakes } = load("src/games/hangman/engine.ts");
const random = () => 0.5;
assert.equal(alphabet.length, 24);
assert.equal(new Set(alphabet).size, 24);
assert.equal(MAX_MISTAKES, 6);
assert.equal(normalizeGreek("άέήίόύώϊΐϋΰςσ"), "ΑΕΗΙΟΥΩΙΙΥΥΣΣ");
assert.equal(normalizeGreek("Μαΐου"), normalizeGreek("Μαι\u0308\u0301ου"));
assert.equal(new Set(hangmanWords.map(w => w.id)).size, hangmanWords.length);
assert.equal(new Set(hangmanWords.map(w => normalizeGreek(w.word))).size, hangmanWords.length);
assert.equal(hangmanWords.length, 180);
const legacy = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hangman-before-expansion.json'), 'utf8'));
assert.equal(legacy.length, 28);
assert.deepEqual(JSON.parse(JSON.stringify(hangmanWords.slice(0, 28))), legacy, 'published words and reward IDs stay unchanged');
const categories = new Set(hangmanWords.map(w => w.category));
assert.equal(categories.size, 9);
for (const category of categories) assert.equal(hangmanWords.filter(w => w.category === category).length, 20, category);
require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'generate-hangman-bank.cjs'), '--check'], { stdio: 'inherit' });
for (const entry of hangmanWords) {
  assert.match(normalizeGreek(entry.word), /^[Α-ΡΣ-Ω]+$/u, entry.id);
  assert.ok([...normalizeGreek(entry.word)].every(l => alphabet.includes(l)), entry.id);
  assert.ok(entry.word.length >= 4 && entry.word.length <= 13, entry.id);
  assert.ok(entry.clue.length > 15 && entry.fact.length > 15, entry.id);
  assert.ok(!normalizeGreek(entry.clue).includes(normalizeGreek(entry.word)), `clue must not reveal ${entry.id}`);
}
let game = startHangman(random);
assert.equal(hangmanStatus(game), "playing");
assert.equal(hangmanMistakes(game), 0);
assert.equal(nextHangman(game, game.round, random), game, "cannot discard an active word");
for (const invalid of ["", "ΑΒ", "A", "1", " ", "👾", "!", "ςς"]) {
  assert.equal(guessHangman(game, game.round, invalid), game);
}
assert.equal(guessHangman(game, game.round - 1, "Α"), game);
const first = normalizeGreek(game.word.word)[0];
game = guessHangman(game, game.round, first.toLowerCase());
assert.equal(game.guesses[0], first);
assert.equal(guessHangman(game, game.round, first), game, "repeated taps do not consume mistakes");
assert.equal(hangmanMistakes(game), 0);
const priorGuesses = [...game.guesses];
const next = guessHangman(game, game.round, [...alphabet].find(l => !game.guesses.includes(l)));
assert.deepEqual(game.guesses, priorGuesses, "transitions do not mutate the previous round");
assert.notEqual(next, game);

// Every word can be solved. Every repeated occurrence is covered by one guess.
for (const word of hangmanWords) {
  let test = { ...startHangman(random), word };
  const letters = [...new Set(normalizeGreek(word.word))];
  for (const letter of letters) test = guessHangman(test, test.round, letter);
  assert.equal(hangmanStatus(test), "won", word.id);
  assert.equal(test.wins, 1);
  assert.equal(hangmanMistakes(test), 0);
  for (const letter of alphabet) assert.equal(guessHangman(test, test.round, letter), test);
  assert.equal(test.wins, 1, "terminal taps cannot add wins");
  let lost = { ...startHangman(random), word };
  const wrong = [...alphabet].filter(l => !normalizeGreek(word.word).includes(l));
  for (let i = 0; i < MAX_MISTAKES; i++) {
    lost = guessHangman(lost, lost.round, wrong[i]);
    assert.equal(hangmanStatus(lost), i === MAX_MISTAKES - 1 ? "lost" : "playing");
  }
  assert.equal(hangmanMistakes(lost), MAX_MISTAKES);
  assert.equal(lost.wins, 0);
  assert.equal(guessHangman(lost, lost.round, letters[0]), lost);
}
// Exercise two full decks and the boundary, while mixing wins and losses.
game = startHangman(() => 0);
let previousId;
for (let deck = 0; deck < 3; deck++) {
  const seen = new Set();
  for (let i = 0; i < hangmanWords.length; i++) {
    assert.notEqual(game.word.id, previousId, "no consecutive repeat across decks");
    assert.ok(!seen.has(game.word.id), "no repeats until all words have appeared");
    seen.add(game.word.id);
    previousId = game.word.id;
    const round = game.round;
    if (i % 2) {
      for (const l of new Set(normalizeGreek(game.word.word))) game = guessHangman(game, round, l);
    } else {
      for (const l of [...alphabet].filter(l => !normalizeGreek(game.word.word).includes(l)).slice(0, MAX_MISTAKES)) game = guessHangman(game, round, l);
    }
    const wins = game.wins;
    game = nextHangman(game, round, () => 0);
    assert.equal(game.round, round + 1);
    assert.equal(game.wins, wins);
    assert.deepEqual(game.guesses, []);
    assert.equal(hangmanStatus(game), "playing");
    assert.equal(nextHangman(game, round, random), game, "double Next cannot skip a word");
    assert.equal(guessHangman(game, round, "Α"), game, "old keyboard callbacks cannot touch a new word");
  }
  assert.equal(seen.size, hangmanWords.length);
}
console.log(`Hangman: ${hangmanWords.length} words, Greek normalization, win/loss boundaries, tap guards and shuffled decks passed.`);
