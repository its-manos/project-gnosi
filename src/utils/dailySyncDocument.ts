import { DEFAULT_DAILY_CHALLENGE_PREFERENCES, normalizeDailyChallengePreferences, DAILY_CHALLENGE_TOPICS, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { parseDailyChallengeRecord, type DailyChallengeRecord } from "./dailyChallenge";
import { parseDailyChallengeHistory, type DailyChallengeHistoryEntry } from "./dailyChallengeHistory";
import { compareStamps, type Stamp } from "./syncDocument";
export type DailyDay = { run: Stamp; edit: Stamp; record: DailyChallengeRecord; history: DailyChallengeHistoryEntry | null };
export type DailyDocument = { schemaVersion: 1; clock: number; preferences: { stamp: Stamp; value: DailyChallengePreferences } | null; days: Record<string, DailyDay> };
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
export const emptyDailyDocument = (): DailyDocument => ({ schemaVersion: 1, clock: 0, preferences: null, days: {} });
export const dailyDateValid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
export function dailyPreferences(value: unknown): DailyChallengePreferences {
  if (!object(value) || !Array.isArray(value.topicIds) || value.topicIds.length < 3 || value.topicIds.length > 5 || new Set(value.topicIds).size !== value.topicIds.length || !value.topicIds.every(id => DAILY_CHALLENGE_TOPICS.some(t => t.id === id)) || !["easy", "medium", "hard"].includes(String(value.difficulty))) throw new Error("invalid_daily");
  const normalized = normalizeDailyChallengePreferences(value); normalized.topicIds.sort(); return normalized;
}
export function currentDailyPreferences(doc: DailyDocument): DailyChallengePreferences { return doc.preferences?.value ?? normalizeDailyChallengePreferences(DEFAULT_DAILY_CHALLENGE_PREFERENCES); }
export function parseDailyDocument(raw: unknown): DailyDocument {
  if (!object(raw) || raw.schemaVersion !== 1 || !Number.isSafeInteger(raw.clock) || (raw.clock as number) < 0 || !object(raw.days)) throw new Error("invalid_daily");
  const doc = emptyDailyDocument(); doc.clock = raw.clock as number;
  const stamp = (value: unknown): Stamp => {
    if (!Array.isArray(value) || value.length !== 2 || !Number.isSafeInteger(value[0]) || value[0] < 0 || value[0] > doc.clock || typeof value[1] !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value[1])) throw new Error("invalid_daily");
    return [value[0], value[1]];
  };
  if (raw.preferences !== null) {
    if (!object(raw.preferences)) throw new Error("invalid_daily");
    doc.preferences = { stamp: stamp(raw.preferences.stamp), value: dailyPreferences(raw.preferences.value) };
  }
  for (const [date, rawDay] of Object.entries(raw.days).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (!dailyDateValid(date) || !object(rawDay) || !object(rawDay.record)) throw new Error("invalid_daily");
    const run = stamp(rawDay.run), edit = stamp(rawDay.edit);
    if (compareStamps(run, edit) > 0) throw new Error("invalid_daily");
    let record: DailyChallengeRecord; let history: DailyChallengeHistoryEntry | null = null;
    if (rawDay.record.completed === true) {
      const parsed = parseDailyChallengeHistory(JSON.stringify([rawDay.history]));
      history = parsed[0] ?? null;
      if (!history || history.dateKey !== date || rawDay.record.dateKey !== date || rawDay.record.started !== true || rawDay.record.currentIndex !== 6 || JSON.stringify(rawDay.record.questionIds) !== JSON.stringify(history.questionIds)) throw new Error("invalid_daily");
      for (let i = 0; i < 7; i += 1) if (!object(rawDay.record.answers) || rawDay.record.answers[String(i)] !== history.answers[String(i)]) throw new Error("invalid_daily");
      if (Object.keys(rawDay.record.answers as object).length !== 7) throw new Error("invalid_daily");
      record = { dateKey: date, started: true, completed: true, currentIndex: 6, questionIds: history.questionIds, answers: history.answers };
    } else {
      const parsed = parseDailyChallengeRecord(JSON.stringify(rawDay.record), date);
      if (!parsed?.started || parsed.completed || rawDay.history !== null) throw new Error("invalid_daily");
      record = parsed;
    }
    doc.days[date] = { run, edit, record, history };
  }
  return doc;
}
const tie = (a: DailyDay, b: DailyDay) => JSON.stringify(a) < JSON.stringify(b) ? a : b;
function chooseDay(a: DailyDay, b: DailyDay): DailyDay {
  if (a.record.completed !== b.record.completed) return a.record.completed ? a : b;
  if (a.record.completed) { const order = compareStamps(a.edit, b.edit); return order < 0 ? a : order > 0 ? b : tie(a, b); }
  const runOrder = compareStamps(a.run, b.run);
  if (runOrder !== 0) return runOrder < 0 ? a : b;
  const rank = (day: DailyDay) => day.record.currentIndex * 2 + Number(day.record.answers[String(day.record.currentIndex)] !== undefined);
  if (rank(a) !== rank(b)) return rank(a) > rank(b) ? a : b;
  const order = compareStamps(a.edit, b.edit); return order > 0 ? a : order < 0 ? b : tie(a, b);
}
/** One whole attempt per Athens date. Completion wins over partial; concurrent
 * completed results choose the earliest logical completion, never highest score. */
export function mergeDailyDocuments(a: DailyDocument, b: DailyDocument): DailyDocument {
  let preferences = a.preferences ?? b.preferences;
  if (a.preferences && b.preferences) {
    const order = compareStamps(a.preferences.stamp, b.preferences.stamp);
    preferences = order > 0 ? a.preferences : order < 0 ? b.preferences : JSON.stringify(a.preferences.value) >= JSON.stringify(b.preferences.value) ? a.preferences : b.preferences;
  }
  const days = { ...a.days };
  for (const [date, day] of Object.entries(b.days)) days[date] = days[date] ? chooseDay(days[date], day) : day;
  return parseDailyDocument({ schemaVersion: 1, clock: Math.max(a.clock, b.clock), preferences, days });
}
export function dailyHistory(doc: DailyDocument): DailyChallengeHistoryEntry[] {
  return Object.values(doc.days).flatMap(day => day.history ? [day.history] : []).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
