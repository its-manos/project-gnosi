import { quickQuizQuestions } from "../data/quickQuizQuestions";
import {
  advanceQuizSession, calculateQuizResults, createQuizSession, evaluateAnswer,
  parseQuizSession, submitQuizAnswer,
} from "./engine";
import type { ChoiceQuestion, QuestionToken, QuizSession } from "./types";

export const QUICK_QUIZ_SIZE = 5;
const difficulties = ["easy", "easy", "medium", "medium", "hard"] as const;
const bankById = new Map(quickQuizQuestions.map(question => [question.id, question]));

export type QuickQuizProgress = {
  round: QuizSession | null;
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
  return { round, roundsCompleted: raw.roundsCompleted, bestScore: raw.bestScore, bestStreak: raw.bestStreak, seen, missed };
}

export function startQuickQuiz(progress: QuickQuizProgress, random = Math.random): QuickQuizProgress {
  if (progress.round && !progress.round.completed) return progress;
  const roundNumber = progress.roundsCompleted + 1;
  const usedCategories = new Set<string>();
  const usedQuestions = new Set<string>();
  let recalled = false;
  const candidates = quickQuizQuestions.map(question => ({ question, tie: random() }));
  const questions = difficulties.map(difficulty => {
    const eligible = candidates.filter(({ question }) =>
      question.difficulty === difficulty && !usedQuestions.has(question.id));
    const priority = (question: ChoiceQuestion) => {
      const lastSeen = progress.seen[question.id];
      if (lastSeen === undefined) return 0;
      const age = roundNumber - lastSeen;
      if (!recalled && age >= 3 && progress.missed.includes(question.id)) return 1;
      return age >= 3 ? 2 : 3;
    };
    eligible.sort((a, b) => priority(a.question) - priority(b.question) ||
      Number(usedCategories.has(a.question.categoryId)) - Number(usedCategories.has(b.question.categoryId)) ||
      (progress.seen[a.question.id] ?? 0) - (progress.seen[b.question.id] ?? 0) || a.tie - b.tie);
    const question = eligible[0].question;
    recalled ||= priority(question) === 1;
    usedCategories.add(question.categoryId);
    usedQuestions.add(question.id);
    return question;
  });
  const seen = { ...progress.seen };
  for (const question of questions) seen[question.id] = roundNumber;
  return { ...progress, seen, round: createQuizSession(`quick:${roundNumber}`, "challenge", questions) };
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
