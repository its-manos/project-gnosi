const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Load the same TypeScript bank and transitions Metro uses.
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  Function("module", "exports", "require", outputText)(module, module.exports,
    id => load(path.normalize(path.join(path.dirname(file), id)) + ".ts"));
  return module.exports;
}

const { quickQuizQuestions } = load("src/data/quickQuizQuestions.ts");
const { questions: daily } = load("src/data/questions.ts");
const { calculateQuizResults, questionToken } = load("src/quiz/engine.ts");
const { emptyQuickQuiz, playQuickQuiz, quickQuizStreaks, readQuickQuiz, startQuickQuiz } = load("src/quiz/quickQuiz.ts");
const restore = progress => readQuickQuiz(JSON.stringify({ version: 1, ...progress }));

const dailyIds = new Set(daily.map(question => question.id));
const dailyPrompts = new Set(daily.map(question => question.question));
assert.equal(new Set(quickQuizQuestions.map(question => question.id)).size, quickQuizQuestions.length);
for (const question of quickQuizQuestions) {
  assert.ok(!dailyIds.has(question.id) && !dailyPrompts.has(question.prompt));
  assert.equal(new Set(question.content.answers).size, 4, question.id);
  assert.equal(new URL(question.sources[0].url).protocol, "https:");
}

let progress = readQuickQuiz(null);
assert.deepEqual(progress, emptyQuickQuiz());
const recentlyDealt = [];
const allDealt = new Set();
let recalled = false;
let firstMiss;
for (let number = 1; number <= 15; number++) {
  progress = startQuickQuiz(progress, () => 0.5);
  const { id, questions } = progress.round;
  const ids = questions.map(question => question.id);
  assert.equal(new Set(ids).size, 5);
  assert.deepEqual(questions.map(question => question.difficulty), ["easy", "easy", "medium", "medium", "hard"]);
  assert.ok(new Set(questions.map(question => question.categoryId)).size >= 3);
  assert.ok(ids.every(id => !recentlyDealt.flat().includes(id)), "do not deal questions from the previous two rounds");
  recentlyDealt.push(ids);
  if (recentlyDealt.length > 2) recentlyDealt.shift();
  for (const id of ids) allDealt.add(id);
  if (number > 1 && ids.includes(firstMiss)) {
    assert.ok(number >= 4);
    recalled = true;
  }
  assert.equal(startQuickQuiz(progress), progress, "opening an incomplete round resumes it");
  const firstToken = questionToken(progress.round);
  assert.equal(playQuickQuiz(progress, "previous-round", firstToken, { type: "answer", value: 0 }), progress);
  assert.equal(playQuickQuiz(progress, id, firstToken, { type: "advance" }), progress);

  for (const [index, question] of questions.entries()) {
    const token = questionToken(progress.round);
    let value = question.content.correctIndex;
    if (number === 1 && index === 2) {
      firstMiss = question.id;
      value = (value + 1) % question.content.answers.length;
    }
    progress = playQuickQuiz(progress, id, token, { type: "answer", value });
    progress = restore(progress);
    assert.equal(progress.round.answers[token.id].value, value);
    assert.equal(playQuickQuiz(progress, id, token, { type: "answer", value: (value + 1) % 4 }), progress);
    progress = playQuickQuiz(progress, id, token, { type: "advance" });
    assert.equal(playQuickQuiz(progress, id, token, { type: "advance" }), progress, "double advance cannot skip or count twice");
  }
  const result = calculateQuizResults(progress.round);
  assert.equal(result.correctCount, number === 1 ? 4 : 5);
  assert.equal(quickQuizStreaks(progress.round).best, number === 1 ? 2 : 5);
  assert.equal(progress.roundsCompleted, number);
  assert.equal(progress.bestScore, number === 1 ? 4 : 5);
  assert.equal(progress.bestStreak, number === 1 ? 2 : 5);
  if (number === 1) assert.deepEqual(progress.missed, [firstMiss]);
  if (recalled) assert.ok(!progress.missed.includes(firstMiss));
  assert.deepEqual(restore(progress), progress);
}
assert.ok(recalled, "a miss returns after a gap and a correct recall clears it");
assert.equal(allDealt.size, quickQuizQuestions.length);
assert.throws(() => readQuickQuiz(JSON.stringify({ version: 2, ...progress })), /invalid_quick_quiz_progress/);
console.log("Quick Quiz selection, resume, scoring, recall and duplicate guards passed.");
