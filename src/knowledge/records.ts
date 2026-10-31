import { getAthensDateKey } from "../utils/dailyChallenge";

export type ReviewFact = { version: string; answerIndex: number; at: number; mode: "scheduled" | "practice" };
export type KnowledgeReviews = Record<string, Record<string, ReviewFact>>;
export const REVIEW_HISTORY_LIMIT = 32;
export const safeKnowledgeId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9_:.-]{1,240}$/.test(v) && !["__proto__", "constructor", "prototype"].includes(v);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const validReviewDate = (v: unknown): v is string => typeof v === "string" && /^20\d{2}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
export function parseKnowledgeReviews(raw: unknown): KnowledgeReviews {
  if (raw === undefined) return {};
  if (!object(raw) || Object.keys(raw).length > 1000) throw new Error("invalid_sync");
  const result: KnowledgeReviews = {};
  for (const id of Object.keys(raw).sort()) {
    const dates = raw[id];
    if (!safeKnowledgeId(id) || !object(dates) || Object.keys(dates).length > REVIEW_HISTORY_LIMIT) throw new Error("invalid_sync");
    result[id] = {};
    for (const date of Object.keys(dates).sort()) {
      const fact = dates[date];
      if (!validReviewDate(date) || !object(fact) || Object.keys(fact).length !== 4 || !safeKnowledgeId(fact.version) ||
        !Number.isInteger(fact.answerIndex) || (fact.answerIndex as number) < 0 || (fact.answerIndex as number) > 99 ||
        !Number.isSafeInteger(fact.at) || (fact.at as number) < 946684800000 || (fact.at as number) > 4102444800000 ||
        getAthensDateKey(new Date(fact.at as number)) !== date || !["scheduled", "practice"].includes(String(fact.mode))) throw new Error("invalid_sync");
      result[id][date] = { version: fact.version, answerIndex: fact.answerIndex as number, at: fact.at as number, mode: fact.mode as ReviewFact["mode"] };
    }
  }
  return result;
}
/** Earliest answer wins; latest 32 dates form a bounded, convergent union. */
export function mergeKnowledgeReviews(a: KnowledgeReviews = {}, b: KnowledgeReviews = {}): KnowledgeReviews {
  const result: KnowledgeReviews = {};
  for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const dates = [...new Set([...Object.keys(a[id] ?? {}), ...Object.keys(b[id] ?? {})])].sort().slice(-REVIEW_HISTORY_LIMIT);
    result[id] = Object.fromEntries(dates.map(date => {
      const x = a[id]?.[date], y = b[id]?.[date];
      const fact = !x ? y : !y ? x : x.at < y.at ? x : y.at < x.at ? y : JSON.stringify([x.version, x.answerIndex, x.mode]) <= JSON.stringify([y.version, y.answerIndex, y.mode]) ? x : y;
      return [date, fact];
    }));
  }
  return parseKnowledgeReviews(result);
}

export type MasteryState = "new" | "learning" | "familiar" | "mastered";
export type KnowledgeSession = {
  id: string; date: string; mode: "scheduled" | "practice"; questionIds: string[]; questionVersions: string[];
  answers: Record<string, number>; currentIndex: number; completed: boolean;
  beforeStates: MasteryState[]; qualifiedIndices: number[]; earnedXP: number;
};
export function parseKnowledgeSession(raw: unknown): KnowledgeSession | null {
  if (raw === null) return null;
  if (!object(raw) || Object.keys(raw).length !== 11 || !safeKnowledgeId(raw.id) || !validReviewDate(raw.date) || !["scheduled", "practice"].includes(String(raw.mode)) ||
    !Array.isArray(raw.questionIds) || raw.questionIds.length < 1 || raw.questionIds.length > 5 || !raw.questionIds.every(safeKnowledgeId) || new Set(raw.questionIds).size !== raw.questionIds.length ||
    !Array.isArray(raw.questionVersions) || raw.questionVersions.length !== raw.questionIds.length || !raw.questionVersions.every(safeKnowledgeId) ||
    !Array.isArray(raw.beforeStates) || raw.beforeStates.length !== raw.questionIds.length || !raw.beforeStates.every(s => ["new", "learning", "familiar", "mastered"].includes(s)) ||
    !object(raw.answers) || !Number.isInteger(raw.currentIndex) || (raw.currentIndex as number) < 0 || (raw.currentIndex as number) >= raw.questionIds.length ||
    typeof raw.completed !== "boolean" || ![0, 10].includes(raw.earnedXP as number) || (!raw.completed && raw.earnedXP !== 0) ||
    !Array.isArray(raw.qualifiedIndices) || new Set(raw.qualifiedIndices).size !== raw.qualifiedIndices.length) throw new Error("invalid_sync");
  const index = raw.currentIndex as number;
  for (const [key, answer] of Object.entries(raw.answers)) if (!/^[0-4]$/.test(key) || Number(key) > index || !Number.isInteger(answer) || (answer as number) < 0 || (answer as number) > 99) throw new Error("invalid_sync");
  for (let i = 0; i < index; i++) if (raw.answers[String(i)] === undefined) throw new Error("invalid_sync");
  if (raw.completed && (index !== raw.questionIds.length - 1 || Object.keys(raw.answers).length !== raw.questionIds.length)) throw new Error("invalid_sync");
  if (!raw.qualifiedIndices.every(i => Number.isInteger(i) && i >= 0 && i <= index && (raw.answers as Record<string, unknown>)[String(i)] !== undefined)) throw new Error("invalid_sync");
  return JSON.parse(JSON.stringify(raw)) as KnowledgeSession;
}

/** PostgreSQL jsonb orders object keys by UTF-8 length, then byte value.
 * Session strings are restricted ASCII, so this also gives an exact RPC tie-break. */
export function knowledgeSessionTie(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(knowledgeSessionTie).join(",")}]`;
  if (object(value)) return `{${Object.keys(value).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).map(k => `${JSON.stringify(k)}:${knowledgeSessionTie(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
