import { quickQuizQuestions } from "../data/quickQuizQuestions";
import {
  advanceQuizSession, calculateQuizResults, createQuizSession, evaluateAnswer,
  parseQuizSession, submitQuizAnswer,
} from "./engine";
import type { ChoiceQuestion, QuestionToken, QuizSession } from "./types";

export const QUICK_QUIZ_SIZE = 5;
const difficulties = ["easy", "easy", "medium", "medium", "hard"] as const;
const RECALL_GAP = 3;
const bankById = new Map(quickQuizQuestions.map(question => [question.id, question]));

export type QuickQuizProgress = {
  round: QuizSession | null;
  /** Durable timestamps let the shared mistake store recover a saved answer after a crash. */
  reviewAnswerTimes?: Record<string, number>;
  roundsCompleted: number;
  bestScore: number;
  bestStreak: number;
  /** Last round in which each question was dealt, including unanswered questions. */
  seen: Record<string, number>;
  missed: string[];
};

export function emptyQuickQuiz(): QuickQuizProgress {
  return { round: null, roundsCompleted: 0, bestScore: 0, bestStreak: 0, seen: {}, missed: [] };
}

export function readQuickQuiz(bytes: string | null): QuickQuizProgress {
  if (!bytes) return emptyQuickQuiz();
  const raw = JSON.parse(bytes);
  const count = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
  if (raw?.version !== 1 || !count(raw.roundsCompleted) ||
    !count(raw.bestScore, QUICK_QUIZ_SIZE) || !count(raw.bestStreak, raw.bestScore) ||
    !raw.seen || typeof raw.seen !== "object" || Array.isArray(raw.seen) || !Array.isArray(raw.missed)) {
    throw new Error("invalid_quick_quiz_progress");
  }
  const round = raw.round === null ? null : parseQuizSession(raw.round);
  if (round && (round.mode !== "challenge" || round.questions.length !== QUICK_QUIZ_SIZE ||
    round.questions.some(question => question.type !== "multiple-choice"))) {
    throw new Error("invalid_quick_quiz_round");
  }
  const latest = raw.roundsCompleted + (round && !round.completed ? 1 : 0);
  const seen = Object.fromEntries(Object.entries(raw.seen).filter(([id, value]) =>
    bankById.has(id) && count(value, latest) && value > 0)) as Record<string, number>;
  const missed = [...new Set<string>(raw.missed.filter((id: string) => bankById.has(id)))];
  const reviewAnswerTimes = raw.reviewAnswerTimes && typeof raw.reviewAnswerTimes === "object" && !Array.isArray(raw.reviewAnswerTimes)
    ? Object.fromEntries(Object.entries(raw.reviewAnswerTimes).filter(([id, at]) => round?.answers[id] && count(at) && (at as number) > 0 && (at as number) <= 4102444800000)) as Record<string, number> : undefined;
  return { ...(reviewAnswerTimes ? { reviewAnswerTimes } : {}), round, roundsCompleted: raw.roundsCompleted, bestScore: raw.bestScore, bestStreak: raw.bestStreak, seen, missed };
}

function shuffleChoices(question: ChoiceQuestion, random: () => number): ChoiceQuestion {
  const correctAnswer = question.content.answers[question.content.correctIndex];
  const answers = [...question.content.answers];
  for (let index = answers.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [answers[index], answers[swap]] = [answers[swap], answers[index]];
  }
  return { ...question, content: { ...question.content, answers, correctIndex: answers.indexOf(correctAnswer) } };
}

export function startQuickQuiz(
  progress: QuickQuizProgress,
  random = Math.random,
  preferredTopicIds: readonly string[] = [],
): QuickQuizProgress {
  if (progress.round && !progress.round.completed) return progress;
  const roundNumber = progress.roundsCompleted + 1;
  const missed = new Set(progress.missed);
  const preferred = new Set(preferredTopicIds);
  const candidates = quickQuizQuestions.map(question => ({
    question, lastSeen: progress.seen[question.id] ?? 0, missed: missed.has(question.id), tie: random(),
  }));
  const oldestFirst = (a: typeof candidates[number], b: typeof candidates[number]) =>
    a.lastSeen - b.lastSeen || a.tie - b.tie;
  // Reserve one slot across the whole round so easy questions cannot crowd out an older miss.
  const recall = candidates.filter(candidate => candidate.missed && candidate.lastSeen > 0 &&
    roundNumber - candidate.lastSeen >= RECALL_GAP).sort(oldestFirst)[0];
  const recallIndex = recall ? difficulties.indexOf(recall.question.difficulty) : -1;
  const usedCategories = new Set<string>();
  const usedQuestions = new Set<string>();
  if (recall) {
    usedCategories.add(recall.question.categoryId);
    usedQuestions.add(recall.question.id);
  }
  const priority = (candidate: typeof candidates[number]) => {
    if (candidate.lastSeen === 0) return 0;
    if (roundNumber - candidate.lastSeen < RECALL_GAP) return 3;
    // Extra misses can fill a slot when its difficulty runs out of alternatives.
    return candidate.missed ? 2 : 1;
  };
  const questions = difficulties.map((difficulty, index) => {
    if (recall && index === recallIndex) return recall.question;
    const eligible = candidates.filter(({ question }) =>
      question.difficulty === difficulty && !usedQuestions.has(question.id));
    // Preserve at least three different subjects and the existing unseen/mistake
    // priorities. After that, favor topics the player chose during onboarding.
    const diversityFirst = preferred.size === 0 || usedCategories.size < 3;
    const variety = (a: typeof candidates[number], b: typeof candidates[number]) =>
      Number(usedCategories.has(a.question.categoryId)) - Number(usedCategories.has(b.question.categoryId));
    const interest = (a: typeof candidates[number], b: typeof candidates[number]) =>
      Number(!preferred.has(a.question.categoryId)) - Number(!preferred.has(b.question.categoryId));
    eligible.sort((a, b) => priority(a) - priority(b) ||
      (diversityFirst ? variety(a, b) : 0) ||
      interest(a, b) ||
      (diversityFirst ? 0 : variety(a, b)) ||
      oldestFirst(a, b));
    const question = eligible[0].question;
    usedCategories.add(question.categoryId);
    usedQuestions.add(question.id);
    return question;
  });
  const seen = { ...progress.seen };
  for (const question of questions) seen[question.id] = roundNumber;
  // Save the order in the round snapshot so a resumed answer keeps its meaning.
  const dealt = questions.map(question => shuffleChoices(question, random));
  return { ...progress, seen, round: createQuizSession(`quick:${roundNumber}`, "challenge", dealt) };
}

export function quickQuizStreaks(round: QuizSession) {
  let current = 0;
  let best = 0;
  for (const question of round.questions) {
    const answer = round.answers[question.id];
    if (!answer) break;
    current = evaluateAnswer(question, answer.value).correct ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

export function playQuickQuiz(
  progress: QuickQuizProgress, roundId: string, token: QuestionToken,
  action: { type: "answer"; value: number } | { type: "advance" },
): QuickQuizProgress {
  const round = progress.round;
  if (!round || round.id !== roundId) return progress;
  const transition = action.type === "answer"
    ? submitQuizAnswer(round, token, action.value)
    : advanceQuizSession(round, token);
  if (!transition.changed) return progress;
  if (!transition.session.completed) return { ...progress, round: transition.session };

  const results = calculateQuizResults(transition.session);
  const missed = new Set(progress.missed);
  for (const question of transition.session.questions) {
    if (results.incorrectQuestionIds.includes(question.id)) missed.add(question.id);
    else missed.delete(question.id);
  }
  return {
    ...progress, round: transition.session, missed: [...missed],
    roundsCompleted: progress.roundsCompleted + 1,
    bestScore: Math.max(progress.bestScore, results.correctCount),
    bestStreak: Math.max(progress.bestStreak, quickQuizStreaks(transition.session).best),
  };
}
