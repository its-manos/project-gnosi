import {
  DAILY_CHALLENGE_SIZE,
  questions,
  type GeneralKnowledgeQuestion,
} from "../data/questions";

export type DailyChallengeRecord = {
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

/** Return the calendar date in the app's chosen Europe/Athens timezone. */
export function getAthensDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** A date-seeded shuffle makes the planned set stable for that date. */
export function selectDailyQuestions(
  dateKey: string,
  bank: GeneralKnowledgeQuestion[] = questions
): GeneralKnowledgeQuestion[] {
  if (bank.length < DAILY_CHALLENGE_SIZE) return [];

  let seed = 2166136261;
  for (let index = 0; index < dateKey.length; index += 1) {
    seed ^= dateKey.charCodeAt(index);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const shuffled = [...bank];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }

  return shuffled.slice(0, DAILY_CHALLENGE_SIZE);
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
