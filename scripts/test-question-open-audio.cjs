/* Question entrances use a non-scoring cue. An unfinished round can be
 * revisited without replaying an XP event or having its sound deduplicated. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { load } = require("./helpers/load-typescript.cjs");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const { FeedbackGate } = load("src/play/events.ts");
const { requestPracticeCue, subscribePracticeCue } = load("src/play/soundStatus.ts");

// Reopening the same unfinished question reuses the round/question IDs.
// Reward-event IDs must stay deduplicated, but entrance sounds must not.
const gate = new FeedbackGate();
const oldOpening = { scope: "guest", id: "round:question:open", kind: "question-open" };
assert.equal(gate.accept(oldOpening, "guest", true, 1000), true);
assert.equal(gate.accept(oldOpening, "guest", true, 3000), false);

const cues = [];
const off = subscribePracticeCue(kind => cues.push(kind));
requestPracticeCue("question-open");
requestPracticeCue("question-open");
off();
requestPracticeCue("question-open");
assert.deepEqual(cues, ["question-open", "question-open"],
  "returning to an unfinished question must play its opening cue again");

const quick = read("src/screens/QuickQuizScreen.tsx");
assert.match(quick, /if \(liveQuestionId\) requestPracticeCue\("question-open"\)/,
  "Quick Quiz uses the non-scoring entrance cue");
assert.doesNotMatch(quick, /emitPlayFeedback\(\{ scope, kind: "question-open"/,
  "do not deduplicate Quick Quiz entrance sounds as reward events");
assert.match(quick, /round && !round\.completed && question && answer === undefined/,
  "only an active unanswered Quick Quiz question plays its opening cue");

const daily = read("src/screens/DailyChallengeScreen.tsx");
assert.match(daily, /const openingQuestionId=activeQuiz&&selectedAnswer===null&&currentQuestion/,
  "Daily Quiz opens only when a live unanswered question is visible");
assert.match(daily, /openingQuestionId\) requestPracticeCue\("question-open"\)/,
  "Daily Quiz reuses the same entrance sound as lesson questions");
assert.match(daily, /\},\[openingQuestionId\]\);/,
  "Daily Quiz plays once per newly visible question, not on ordinary rerenders");

const onboarding = read("src/screens/OnboardingDailyQuestion.tsx");
assert.match(onboarding, /record\.currentIndex === 0 && selectedAnswer === null && currentQuestion/,
  "Onboarding opens only the real first unanswered daily question");
assert.match(onboarding, /if \(opening\) requestPracticeCue\("question-open"\)/);
const weekly = read("src/screens/WeeklyReviewScreen.tsx");
assert.match(weekly, /snapshot\.ready && !expired && item && !answer/);
assert.match(weekly, /if \(opening\) requestPracticeCue\("question-open"\)/);
console.log("Question entrance audio passed: repeated visits, live-question guards, no XP or replay gate interference.");
