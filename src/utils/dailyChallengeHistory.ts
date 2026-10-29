import { DAILY_CHALLENGE_SIZE, questions } from "../data/questions";
import type { DailyChallengeRecord } from "./dailyChallenge";

export const DAILY_CHALLENGE_HISTORY_STORAGE_KEY = "@gnosi/daily-challenge-history-v1";

export type DailyChallengeHistoryEntry = {
  dateKey: string;
  questionIds: string[];
  answers: Record<string, number>;
  correctCount: number;
  score: number;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Validate stored history without depending on current question-bank contents. */
export function parseDailyChallengeHistory(value: string | null): DailyChallengeHistoryEntry[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const uniqueByDate = new Map<string, DailyChallengeHistoryEntry>();
    for (const item of parsed) {
      if (!isRecord(item) || !isDateKey(item.dateKey)) continue;
      if (
        !Array.isArray(item.questionIds) ||
        item.questionIds.length !== DAILY_CHALLENGE_SIZE ||
        !item.questionIds.every((id) => typeof id === "string" && id.length > 0) ||
        new Set(item.questionIds).size !== DAILY_CHALLENGE_SIZE ||
        !isRecord(item.answers) ||
        !Number.isInteger(item.correctCount) ||
        (item.correctCount as number) < 0 ||
        (item.correctCount as number) > DAILY_CHALLENGE_SIZE ||
        !Number.isInteger(item.score) ||
        item.score !== (item.correctCount as number) * 100
      ) {
        continue;
      }

      const answers: Record<string, number> = {};
      let validAnswers = true;
      for (let index = 0; index < DAILY_CHALLENGE_SIZE; index += 1) {
        const answer = item.answers[String(index)];
        if (!Number.isInteger(answer) || (answer as number) < 0 || (answer as number) > 3) {
          validAnswers = false;
          break;
        }
        answers[String(index)] = answer as number;
      }
      if (!validAnswers || Object.keys(item.answers).length !== DAILY_CHALLENGE_SIZE) continue;

      uniqueByDate.set(item.dateKey, {
        dateKey: item.dateKey,
        questionIds: [...item.questionIds] as string[],
        answers,
        correctCount: item.correctCount as number,
        score: item.score as number,
      });
    }

    return [...uniqueByDate.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  } catch {
    return [];
  }
}

export function createCompletedHistoryEntry(
  record: DailyChallengeRecord,
): DailyChallengeHistoryEntry | null {
  if (
    !record.completed ||
    !record.started ||
    record.questionIds.length !== DAILY_CHALLENGE_SIZE ||
    Object.keys(record.answers).length !== DAILY_CHALLENGE_SIZE
  ) {
    return null;
  }

  let correctCount = 0;
  for (let index = 0; index < DAILY_CHALLENGE_SIZE; index += 1) {
    const question = questions.find((item) => item.id === record.questionIds[index]);
    const answer = record.answers[String(index)];
    if (!question || !Number.isInteger(answer) || answer < 0 || answer >= question.answers.length) {
      return null;
    }
    if (answer === question.correctIndex) correctCount += 1;
  }

  return {
    dateKey: record.dateKey,
    questionIds: [...record.questionIds],
    answers: { ...record.answers },
    correctCount,
    score: correctCount * 100,
  };
}

export function upsertDailyChallengeHistory(
  history: DailyChallengeHistoryEntry[],
  entry: DailyChallengeHistoryEntry,
): DailyChallengeHistoryEntry[] {
  return [entry, ...history.filter((item) => item.dateKey !== entry.dateKey)]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function removeDailyChallengeHistoryDate(
  history: DailyChallengeHistoryEntry[],
  dateKey: string,
): DailyChallengeHistoryEntry[] {
  return history.filter((item) => item.dateKey !== dateKey);
}
