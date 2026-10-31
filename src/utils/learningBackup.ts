import { evaluateChoice } from "../quiz/engine";
import { lessons } from "../data/lessons";
import { getInlineQuestionCount } from "./lessonProgress";

export type BackupAttempt = {
  checkpointAnswers: Record<number, number>;
  score: number;
  updatedAt: number;
  replayOfCompletedLesson: boolean;
};
export type LearningBackup = {
  schemaVersion: 1;
  completedIds: string[];
  savedIds: string[];
  attempts: Record<string, BackupAttempt>;
};
const catalogue = new Map(lessons.map(lesson => [lesson.id, lesson]));
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Reject unsupported/corrupt envelopes and unknown catalogue IDs; validate answers. */
export function parseLearningBackup(value: unknown): LearningBackup {
  if (!record(value) || value.schemaVersion !== 1 || !Array.isArray(value.completedIds) || !Array.isArray(value.savedIds) || !record(value.attempts)) {
    throw new Error("invalid_backup");
  }
  if (!value.completedIds.every(id => typeof id === "string") || !value.savedIds.every(id => typeof id === "string")) throw new Error("invalid_backup");
  if ([...value.completedIds, ...value.savedIds, ...Object.keys(value.attempts)].some(id => typeof id !== "string" || !catalogue.has(id))) throw new Error("unknown_catalogue");
  const ids = (items: unknown[]) => [...new Set(items.filter((id): id is string => typeof id === "string" && catalogue.has(id)))].sort();
  const completedIds = ids(value.completedIds);
  const attempts: LearningBackup["attempts"] = {};
  for (const [id, raw] of Object.entries(value.attempts)) {
    const lesson = catalogue.get(id);
    if (!lesson) continue;
    if (!record(raw) || !record(raw.checkpointAnswers) || typeof raw.updatedAt !== "number" || !Number.isFinite(raw.updatedAt) || raw.updatedAt < 0) throw new Error("invalid_backup");
    const replayOfCompletedLesson = raw.replayOfCompletedLesson === true;
    if (completedIds.includes(id) && !replayOfCompletedLesson) continue;
    const checkpointAnswers: Record<number, number> = {};
    let score = 0;
    // Only restore a consecutive, valid sequence, so a corrupt hole cannot skip a gate.
    for (let i = 0; i < getInlineQuestionCount(lesson); i += 1) {
      const answer = raw.checkpointAnswers[i];
      if (answer === undefined) break;
      if (typeof answer !== "number" || !evaluateChoice(lesson.questions[i], answer).valid) throw new Error("invalid_backup");
      checkpointAnswers[i] = answer;
      if (evaluateChoice(lesson.questions[i], answer).correct) score += 1;
    }
    if (Object.keys(checkpointAnswers).length) attempts[id] = { checkpointAnswers, score, updatedAt: raw.updatedAt, replayOfCompletedLesson };
  }
  return { schemaVersion: 1, completedIds, savedIds: ids(value.savedIds), attempts };
}

/** Additive restore: completion/bookmark union; strongest whole attempt wins, local on ties.
 * Answers from different attempts are never mixed. Deletions do not propagate.
 */
export function mergeLearningBackups(local: LearningBackup, incoming: LearningBackup): LearningBackup {
  const left = parseLearningBackup(local);
  const right = parseLearningBackup(incoming);
  const completedIds = [...new Set([...left.completedIds, ...right.completedIds])];
  // A completed record supersedes an ordinary unfinished attempt, but never a
  // deliberate replay. Filter before ranking so a stale normal attempt cannot
  // crowd out a shorter replay and then be discarded at normalization.
  const eligible = (id: string, attempt: BackupAttempt) => !completedIds.includes(id) || attempt.replayOfCompletedLesson;
  const attempts = Object.fromEntries(Object.entries(right.attempts).filter(([id, attempt]) => eligible(id, attempt)));
  for (const [id, attempt] of Object.entries(left.attempts)) {
    if (!eligible(id, attempt)) continue;
    const other = attempts[id];
    const count = Object.keys(attempt.checkpointAnswers).length;
    const otherCount = other ? Object.keys(other.checkpointAnswers).length : -1;
    if (!other || count > otherCount || (count === otherCount && attempt.updatedAt >= other.updatedAt)) attempts[id] = attempt;
  }
  return parseLearningBackup({ schemaVersion: 1, completedIds, savedIds: [...left.savedIds, ...right.savedIds], attempts });
}

export function describeLearningBackup(backup: LearningBackup): string {
  return `${backup.completedIds.length} ολοκληρωμένα · ${Object.keys(backup.attempts).length} σε εξέλιξη · ${backup.savedIds.length} αποθηκευμένα`;
}
