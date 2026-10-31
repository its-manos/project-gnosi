import { mergeRewardLedgers, parseRewardLedger, type RewardLedger } from "../gamification/rewards";
import { migrateLearningRewards } from "../gamification/migration";
import { lessons } from "../data/lessons";
import { parseLearningBackup, type BackupAttempt, type LearningBackup } from "./learningBackup";
import { mergeCompletionEvents, parseCompletionEvents, type CompletionEvents } from "./learningActivity";
import { mergeWeeklyAnswers, parseWeeklyAnswers, type WeeklyAnswers } from "./weeklyReview";
export type Stamp = [number, string];
export type ProgressValue = { completed: boolean; attempt: BackupAttempt | null };
type Register<T> = { stamp: Stamp; value: T };
export type SyncDocument = { schemaVersion: 1; rewards?: RewardLedger; clock: number; progress: Record<string, Register<ProgressValue>>; bookmarks: Record<string, Register<boolean>>; activity: CompletionEvents; weeklyReviews?: WeeklyAnswers };
const known = new Set(lessons.map(l => l.id));
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
export const emptySyncDocument = (): SyncDocument => ({ schemaVersion: 1, clock: 0, progress: {}, bookmarks: {}, activity: {} });
const ordered = <T,>(values: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(values).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
export function parseSyncDocument(raw: unknown): SyncDocument {
  if (!record(raw) || raw.schemaVersion !== 1 || !Number.isSafeInteger(raw.clock) || (raw.clock as number) < 0 || !record(raw.progress) || !record(raw.bookmarks)) throw new Error("invalid_sync");
  const result = emptySyncDocument(); result.clock = raw.clock as number;
  if (raw.rewards !== undefined) result.rewards = parseRewardLedger(raw.rewards, "learning");
  result.activity = parseCompletionEvents(raw.activity);
  result.weeklyReviews = parseWeeklyAnswers(raw.weeklyReviews, result.activity);
  const stamp = (entry: unknown): Register<unknown> => {
    if (!record(entry) || !Array.isArray(entry.stamp) || entry.stamp.length !== 2 || !Number.isSafeInteger(entry.stamp[0]) || entry.stamp[0] < 0 || entry.stamp[0] > result.clock || typeof entry.stamp[1] !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(entry.stamp[1])) throw new Error("invalid_sync");
    return { stamp: [entry.stamp[0], entry.stamp[1]], value: entry.value };
  };
  for (const [id, rawEntry] of Object.entries(raw.progress)) {
    if (!known.has(id)) throw new Error("unknown_catalogue");
    const entry = stamp(rawEntry); const value = entry.value;
    if (!record(value) || typeof value.completed !== "boolean" || !(value.attempt === null || record(value.attempt))) throw new Error("invalid_sync");
    const validated = parseLearningBackup({ schemaVersion: 1, completedIds: value.completed ? [id] : [], savedIds: [], attempts: value.attempt ? { [id]: value.attempt } : {} });
    result.progress[id] = { stamp: entry.stamp, value: { completed: value.completed, attempt: validated.attempts[id] ?? null } };
  }
  for (const [id, rawEntry] of Object.entries(raw.bookmarks)) {
    if (!known.has(id)) throw new Error("unknown_catalogue");
    const entry = stamp(rawEntry);
    if (typeof entry.value !== "boolean") throw new Error("invalid_sync");
    result.bookmarks[id] = { stamp: entry.stamp, value: entry.value };
  }
  result.progress = ordered(result.progress); result.bookmarks = ordered(result.bookmarks);
  return result;
}
export function compareStamps(a: Stamp, b: Stamp): number {
  return a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
}
function winner<T>(a: Register<T> | undefined, b: Register<T>): Register<T> {
  if (!a) return b;
  const order = compareStamps(a.stamp, b.stamp);
  return order > 0 || (order === 0 && JSON.stringify(a.value) >= JSON.stringify(b.value)) ? a : b;
}
/** Logical edit order (device ID breaks concurrent ties), completion union,
 * whole-attempt registers and permanent bookmark/attempt tombstones. */
export function mergeSyncDocuments(a: SyncDocument, b: SyncDocument): SyncDocument {
  const merged: SyncDocument = { schemaVersion: 1, clock: Math.max(a.clock, b.clock), progress: { ...a.progress }, bookmarks: { ...a.bookmarks }, activity: mergeCompletionEvents(a.activity, b.activity), weeklyReviews: mergeWeeklyAnswers(a.weeklyReviews, b.weeklyReviews) };
  for (const [id, entry] of Object.entries(b.progress)) {
    const current = merged.progress[id]; const selected = winner(current, entry);
    merged.progress[id] = { stamp: selected.stamp, value: { ...selected.value, completed: Boolean(current?.value.completed || entry.value.completed) } };
  }
  for (const [id, entry] of Object.entries(b.bookmarks)) merged.bookmarks[id] = winner(merged.bookmarks[id], entry);
  if (a.rewards !== undefined || b.rewards !== undefined) merged.rewards = migrateLearningRewards(lessons, Object.keys(merged.progress).filter(id => merged.progress[id].value.completed), merged.activity, merged.weeklyReviews ?? {}, mergeRewardLedgers(a.rewards, b.rewards));
  return parseSyncDocument(merged);
}
export function syncBackup(doc: SyncDocument): LearningBackup {
  return parseLearningBackup({ schemaVersion: 1, completedIds: Object.keys(doc.progress).filter(id => doc.progress[id].value.completed), savedIds: Object.keys(doc.bookmarks).filter(id => doc.bookmarks[id].value), attempts: Object.fromEntries(Object.entries(doc.progress).filter(([, entry]) => entry.value.attempt !== null).map(([id, entry]) => [id, entry.value.attempt])) });
}
export function seedSyncBackup(raw: LearningBackup): SyncDocument {
  const backup = parseLearningBackup(raw); const doc = emptySyncDocument();
  for (const id of new Set([...backup.completedIds, ...Object.keys(backup.attempts)])) doc.progress[id] = { stamp: [0, "backup"], value: { completed: backup.completedIds.includes(id), attempt: backup.attempts[id] ?? null } };
  for (const id of backup.savedIds) doc.bookmarks[id] = { stamp: [0, "backup"], value: true };
  return parseSyncDocument(doc);
}
