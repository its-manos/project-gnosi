import { getAthensDateKey } from "./dailyChallenge";

export type CompletionEvent = {
  lessonId: string;
  at: number;
  wasCompleted: boolean;
  correctCount: number;
  questionCount: number;
  quizKey: string;
  missedQuestionIndices?: number[];
};
export type CompletionEvents = Record<string, CompletionEvent>;
export type ActivityBucket = { key: string; end: string; first: number; replay: number };
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Old documents have no activity. Never assign dates to their completions. */
export function parseCompletionEvents(raw: unknown): CompletionEvents {
  if (raw === undefined) return {};
  if (!object(raw)) throw new Error("invalid_sync");
  const result: CompletionEvents = {};
  for (const [id, value] of Object.entries(raw).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (!/^[a-zA-Z0-9_-]{1,220}$/.test(id) || !object(value) ||
      typeof value.lessonId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.lessonId) ||
      typeof value.at !== "number" || !Number.isSafeInteger(value.at) || value.at < 946684800000 || value.at > 4102444800000 ||
      typeof value.wasCompleted !== "boolean" ||
      typeof value.questionCount !== "number" || !Number.isInteger(value.questionCount) || value.questionCount < 1 || value.questionCount > 100 ||
      typeof value.correctCount !== "number" || !Number.isInteger(value.correctCount) || value.correctCount < 0 || value.correctCount > value.questionCount ||
      typeof value.quizKey !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.quizKey)) throw new Error("invalid_sync");
    result[id] = { lessonId: value.lessonId, at: value.at, wasCompleted: value.wasCompleted,
      correctCount: value.correctCount, questionCount: value.questionCount, quizKey: value.quizKey };
    if (value.missedQuestionIndices !== undefined) {
      const missed = value.missedQuestionIndices;
      const questionCount = value.questionCount;
      if (!Array.isArray(missed) || missed.length !== value.questionCount - value.correctCount ||
        !missed.every((index, position) => typeof index === "number" && Number.isInteger(index) && index >= 0 && index < questionCount && (position === 0 || index > missed[position - 1]))) throw new Error("invalid_sync");
      result[id].missedQuestionIndices = [...missed];
    }
  }
  return result;
}

/** Immutable event union: equal IDs are retries, never extra completions. */
export function mergeCompletionEvents(left: CompletionEvents, right: CompletionEvents): CompletionEvents {
  const a = parseCompletionEvents(left), b = parseCompletionEvents(right);
  for (const [id, event] of Object.entries(b)) {
    const existing = a[id];
    if (existing) {
      const { missedQuestionIndices: leftMissed, ...leftBase } = existing;
      const { missedQuestionIndices: rightMissed, ...rightBase } = event;
      if (JSON.stringify(leftBase) !== JSON.stringify(rightBase) ||
        (leftMissed !== undefined && rightMissed !== undefined && JSON.stringify(leftMissed) !== JSON.stringify(rightMissed))) throw new Error("invalid_sync");
      // Old app versions omit the optional details; retain the richer record.
      a[id] = leftMissed !== undefined ? existing : event;
    } else a[id] = event;
  }
  return parseCompletionEvents(a);
}

export function quizFingerprint(questions: { question: string; answers: string[]; correctIndex: number }[]): string {
  const text = JSON.stringify(questions.map(({ question, answers, correctIndex }) => ({ question, answers, correctIndex })));
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `q_${(hash >>> 0).toString(16)}`;
}

// Date-key arithmetic uses calendar dates in UTC, not local 24-hour intervals.
// This preserves Athens day/week boundaries through DST transitions.
export function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function mondayOf(key: string): string {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
  return shiftDateKey(key, -((weekday + 6) % 7));
}

export function classifiedActivity(events: CompletionEvents, today: string) {
  const rows = Object.entries(events).map(([id, event]) => ({ id, ...event, date: getAthensDateKey(new Date(event.at)) }))
    .filter(event => event.date <= today)
    .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const first = new Set<string>();
  return rows.map(event => {
    const isFirst = !event.wasCompleted && !first.has(event.lessonId);
    if (isFirst) first.add(event.lessonId);
    return { ...event, isFirst };
  });
}

export function activityBuckets(events: CompletionEvents, today: string, mode: "daily" | "weekly"): ActivityBucket[] {
  const weekly = mode === "weekly", size = weekly ? 8 : 7, stride = weekly ? 7 : 1;
  const current = weekly ? mondayOf(today) : today;
  const buckets: ActivityBucket[] = Array.from({ length: size }, (_, index) => {
    const key = shiftDateKey(current, -(size - 1 - index) * stride);
    return { key, end: weekly ? shiftDateKey(key, 6) : key, first: 0, replay: 0 };
  });
  for (const event of classifiedActivity(events, today)) {
    const key = weekly ? mondayOf(event.date) : event.date;
    const bucket = buckets.find(item => item.key === key);
    if (bucket) { if (event.isFirst) bucket.first++; else bucket.replay++; }
  }
  return buckets;
}

export function activitySummary(events: CompletionEvents, completedIds: string[], dailyDates: string[], today: string, reviewDates: string[] = []) {
  const rows = classifiedActivity(events, today);
  const datedFirstIds = new Set(rows.filter(event => event.isFirst).map(event => event.lessonId));
  const active = new Set([...rows.map(event => event.date), ...dailyDates.filter(date => date <= today), ...reviewDates.filter(date => date <= today)]);
  const questions = rows.reduce((sum, event) => sum + event.questionCount, 0);
  const correct = rows.reduce((sum, event) => sum + event.correctCount, 0);
  const week = mondayOf(today);
  return {
    firstThisWeek: rows.filter(event => event.isFirst && event.date >= week).length,
    replaysThisWeek: rows.filter(event => !event.isFirst && event.date >= week).length,
    activeDays: active.size,
    undatedCount: [...new Set(completedIds)].filter(id => !datedFirstIds.has(id)).length,
    accuracy: questions ? Math.round(correct / questions * 100) : null,
    correct, questions,
  };
}
