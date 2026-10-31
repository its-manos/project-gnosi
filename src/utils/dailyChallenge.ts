import { readDailyMetadata, type DailyRecordMetadata } from "./sharedDailyChallenge";
import {
  DAILY_CHALLENGE_SIZE,
  questions,
  type GeneralKnowledgeQuestion,
} from "../data/questions";
import {
  DEFAULT_DAILY_CHALLENGE_PREFERENCES,
  normalizeDailyChallengePreferences,
  type DailyChallengePreferences,
} from "../data/dailyChallengeTopics";

export const DAILY_CHALLENGE_STORAGE_KEY = "@gnosi/daily-challenge-v1";

export type DailyChallengeRecord = DailyRecordMetadata & {
  dateKey: string;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, number>;
  started: boolean;
  completed: boolean;
};

export function emptyDailyChallengeRecord(dateKey: string): DailyChallengeRecord {
  return {
    dateKey,
    questionIds: [],
    currentIndex: 0,
    answers: {},
    started: false,
    completed: false,
  };
}

const athensFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens", year: "numeric", month: "2-digit", day: "2-digit" });

/** Return the calendar date in the app's chosen Europe/Athens timezone. */
export function getAthensDateKey(date: Date = new Date()): string {
  const parts = athensFormatter.formatToParts(date);

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * Pick seven questions while respecting interests and difficulty whenever the
 * bank has enough eligible questions. Saved question IDs keep an active set
 * unchanged, even when preferences are edited later.
 */
export function selectDailyQuestions(
  dateKey: string,
  bank: GeneralKnowledgeQuestion[] = questions,
  rawPreferences: DailyChallengePreferences = DEFAULT_DAILY_CHALLENGE_PREFERENCES,
): GeneralKnowledgeQuestion[] {
  if (bank.length < DAILY_CHALLENGE_SIZE) return [];

  const preferences = normalizeDailyChallengePreferences(rawPreferences);
  const selectedTopics = new Set(preferences.topicIds);
  const topicPool = bank.filter((question) => selectedTopics.has(question.categoryId));
  const exactPool = topicPool.filter((question) => question.difficulty === preferences.difficulty);
  const allAtDifficulty = bank.filter((question) => question.difficulty === preferences.difficulty);
  const seedInput = `${dateKey}|${preferences.topicIds.slice().sort().join(",")}|${preferences.difficulty}`;

  let seed = 2166136261;
  for (let index = 0; index < seedInput.length; index += 1) {
    seed ^= seedInput.charCodeAt(index);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const shuffled = <T,>(items: T[]): T[] => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(random() * (index + 1));
      [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
    }
    return result;
  };

  let chosen: GeneralKnowledgeQuestion[] = [];
  const addUnique = (pool: GeneralKnowledgeQuestion[]) => {
    const chosenIds = new Set(chosen.map((question) => question.id));
    const needed = DAILY_CHALLENGE_SIZE - chosen.length;
    if (needed <= 0) return;
    chosen = [...chosen, ...shuffled(pool.filter((question) => !chosenIds.has(question.id))).slice(0, needed)];
  };

  // First include questions matching both preferred topic and difficulty.
  if (exactPool.length >= DAILY_CHALLENGE_SIZE) {
    chosen = shuffled(exactPool).slice(0, DAILY_CHALLENGE_SIZE);
  } else {
    addUnique(exactPool);
    // Then preserve difficulty, including other topics only if needed.
    addUnique(allAtDifficulty);
    // If a difficulty has too few questions in the whole bank, keep the topic
    // choices first and widen to other levels, then finally the full bank.
    addUnique(topicPool);
    addUnique(bank);
  }

  return chosen.length === DAILY_CHALLENGE_SIZE ? shuffled(chosen) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate persisted data before restoring it, including stale question IDs. */
export function parseDailyChallengeRecord(
  value: string | null,
  dateKey: string,
  bank: GeneralKnowledgeQuestion[] = questions
): DailyChallengeRecord | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.dateKey !== dateKey) return null;

    if (
      typeof parsed.started !== "boolean" ||
      typeof parsed.completed !== "boolean" ||
      !Number.isInteger(parsed.currentIndex) ||
      (parsed.currentIndex as number) < 0 ||
      (parsed.currentIndex as number) >= DAILY_CHALLENGE_SIZE ||
      !Array.isArray(parsed.questionIds) ||
      !isRecord(parsed.answers)
    ) {
      return null;
    }

    const questionIds = parsed.questionIds;
    const knownQuestions = new Map(bank.map((question) => [question.id, question]));

    if (parsed.started) {
      if (
        questionIds.length !== DAILY_CHALLENGE_SIZE ||
        !questionIds.every((id) => typeof id === "string" && knownQuestions.has(id)) ||
        new Set(questionIds).size !== DAILY_CHALLENGE_SIZE
      ) {
        return null;
      }
    } else if (
      questionIds.length !== 0 ||
      parsed.completed ||
      parsed.currentIndex !== 0 ||
      Object.keys(parsed.answers).length !== 0
    ) {
      return null;
    }

    const answers: Record<string, number> = {};
    for (const [indexString, rawAnswer] of Object.entries(parsed.answers)) {
      // Persisted answers must represent a possible in-app state. Do not
      // silently ignore corrupt entries, as that can make the quiz skip around.
      if (!/^(0|[1-6])$/.test(indexString)) return null;
      const index = Number(indexString);
      if (!Number.isInteger(rawAnswer)) return null;

      const question = knownQuestions.get(questionIds[index] as string);
      if (
        !question ||
        (rawAnswer as number) < 0 ||
        (rawAnswer as number) >= question.answers.length
      ) {
        return null;
      }
      answers[indexString] = rawAnswer as number;
    }

    if (parsed.started) {
      const currentIndex = parsed.currentIndex as number;

      // Every earlier question must already be answered, and answers cannot
      // exist for a question the player has not reached yet.
      for (let index = 0; index < currentIndex; index += 1) {
        if (answers[String(index)] === undefined) return null;
      }
      for (let index = currentIndex + 1; index < DAILY_CHALLENGE_SIZE; index += 1) {
        if (answers[String(index)] !== undefined) return null;
      }
    }

    if (
      parsed.completed &&
      ((parsed.currentIndex as number) !== DAILY_CHALLENGE_SIZE - 1 ||
        Object.keys(answers).length !== DAILY_CHALLENGE_SIZE)
    ) {
      return null;
    }

    return {
      ...readDailyMetadata(parsed),
      dateKey,
      questionIds: questionIds as string[],
      currentIndex: parsed.currentIndex as number,
      answers,
      started: parsed.started,
      completed: parsed.completed,
    };
  } catch {
    return null;
  }
}
