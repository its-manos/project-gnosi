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
const bankById = new Map(quickQuizQuestions.map(question => [question.id, question]));
assert.equal(quickQuizQuestions.length, 30);
assert.equal(new Set(quickQuizQuestions.map(question => question.id)).size, quickQuizQuestions.length);
for (const question of quickQuizQuestions) {
  assert.ok(!dailyIds.has(question.id) && !dailyPrompts.has(question.prompt));
  assert.equal(new Set(question.content.answers).size, 4, question.id);
  assert.equal(new URL(question.sources[0].url).protocol, "https:");
}

let progress = readQuickQuiz(null);
assert.deepEqual(progress, emptyQuickQuiz());
const shuffled = startQuickQuiz(progress, () => 0.5);
for (const question of shuffled.round.questions) {
  const authored = bankById.get(question.id).content;
  assert.notDeepEqual(question.content.answers, authored.answers);
  assert.deepEqual([...question.content.answers].sort(), [...authored.answers].sort());
  assert.equal(question.content.answers[question.content.correctIndex], authored.answers[authored.correctIndex]);
}
const legacyRound = {
  ...shuffled,
  round: { ...shuffled.round, questions: shuffled.round.questions.map(question => bankById.get(question.id)) },
};
const legacyToken = questionToken(legacyRound.round);
const legacyIndex = legacyRound.round.questions[0].content.correctIndex;
const legacyAnswered = playQuickQuiz(legacyRound, legacyRound.round.id, legacyToken, { type: "answer", value: legacyIndex });
const resumed = startQuickQuiz(restore(legacyAnswered));
assert.deepEqual(resumed, legacyAnswered, "pre-shuffle rounds resume with their original option order");
assert.equal(quickQuizStreaks(resumed.round).current, 1);
const recentlyDealt = [];
const allDealt = new Set();
let firstMiss;
for (let number = 1; number <= 15; number++) {
  const seenBefore = progress.seen;
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
  if (number === 4) {
    assert.ok(ids.includes(firstMiss), "round four reserves a slot for the first miss even with unseen questions available");
    assert.ok(ids.filter(id => id !== firstMiss).every(id => !seenBefore[id]), "the other four slots stay fresh");
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
  if (number >= 4) assert.ok(!progress.missed.includes(firstMiss), "a correct recall clears the miss");
  assert.deepEqual(restore(progress), progress);
}
assert.equal(allDealt.size, quickQuizQuestions.length);

const easyMiss = quickQuizQuestions.find(question => question.difficulty === "easy").id;
const hardMiss = quickQuizQuestions.find(question => question.difficulty === "hard").id;
const multipleMisses = restore({
  ...emptyQuickQuiz(), roundsCompleted: 4, seen: { [easyMiss]: 2, [hardMiss]: 1 }, missed: [easyMiss, hardMiss],
});
const recallRound = startQuickQuiz(multipleMisses, () => 0.5).round;
assert.deepEqual(recallRound.questions.map(question => question.id).filter(id => multipleMisses.missed.includes(id)),
  [hardMiss], "reserve one recall slot for the oldest eligible miss across difficulties");

const allMissed = quickQuizQuestions.map(question => question.id);
const saturated = restore({
  ...emptyQuickQuiz(), roundsCompleted: 6, missed: allMissed,
  seen: Object.fromEntries(allMissed.map((id, index) => [id, index % 6 + 1])),
});
const saturatedIds = startQuickQuiz(saturated, () => 0.5).round.questions.map(question => question.id);
assert.equal(new Set(saturatedIds).size, 5,
  "a bank of missed questions can still deal a full round");
assert.ok(saturatedIds.every(id => saturated.seen[id] <= 4), "fallback still respects the two-round gap");

assert.throws(() => readQuickQuiz(JSON.stringify({ version: 2, ...progress })), /invalid_quick_quiz_progress/);
console.log("Quick Quiz selection, choice shuffling, resume, scoring, recall and duplicate guards passed.");
