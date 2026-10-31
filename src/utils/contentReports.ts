import type { Lesson } from "../data/lessons";
import type { GeneralKnowledgeQuestion } from "../data/questions";
import { quizFingerprint } from "./learningActivity";

export const REPORT_REASONS = [
  { id: "incorrect", label: "Ίσως υπάρχει λάθος" },
  { id: "unclear", label: "Δεν είναι ξεκάθαρο" },
  { id: "image", label: "Πρόβλημα με εικόνα" },
  { id: "other", label: "Κάτι άλλο" },
] as const;
export type ReportReason = typeof REPORT_REASONS[number]["id"];
export type ReportTarget = { kind: "lesson" | "daily"; itemId: string; title: string; questionIndex: number | null; questionText: string | null; contentKey: string };
export type ContentReport = { id: string; clientId: string; createdAt: number; target: ReportTarget; reason: ReportReason; note: string };
const fingerprint = (value: unknown) => quizFingerprint([{ question: JSON.stringify(value), answers: [], correctIndex: 0 }]);
export function lessonReportTarget(lesson: Lesson, questionIndex: number | null = null): ReportTarget {
  if (questionIndex !== null && (!Number.isInteger(questionIndex) || !lesson.questions[questionIndex])) throw new Error("invalid_report_target");
  const question = questionIndex === null ? null : lesson.questions[questionIndex];
  return { kind: "lesson", itemId: lesson.id, title: lesson.title, questionIndex, questionText: question?.question ?? null, contentKey: fingerprint(question ?? lesson) };
}
export function dailyReportTarget(question: GeneralKnowledgeQuestion): ReportTarget {
  return { kind: "daily", itemId: question.id, title: "Καθημερινή πρόκληση", questionIndex: null, questionText: question.question, contentKey: fingerprint(question) };
}
export const reportTargetKey = (target: ReportTarget) => `${target.kind}_${target.itemId}_${target.questionIndex ?? "article"}_${target.contentKey}`;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max && value.trim().length > 0;
export function parseContentReport(value: unknown): ContentReport {
  if (!object(value) || Object.keys(value).length !== 6 || !id(value.id) || !id(value.clientId) ||
    !Number.isSafeInteger(value.createdAt) || (value.createdAt as number) < 946684800000 || (value.createdAt as number) > 4102444800000 ||
    !REPORT_REASONS.some(reason => reason.id === value.reason) || typeof value.note !== "string" || value.note.length > 2000 ||
    (value.reason === "other" && !value.note.trim()) || !object(value.target)) throw new Error("invalid_report");
  const t = value.target;
  if (Object.keys(t).length !== 6 || !["lesson", "daily"].includes(t.kind as string) || !id(t.itemId) || !id(t.contentKey) || !text(t.title, 300) ||
    !(t.questionIndex === null || (typeof t.questionIndex === "number" && Number.isInteger(t.questionIndex) && t.questionIndex >= 0 && t.questionIndex <= 99)) ||
    !(t.questionText === null || text(t.questionText, 2000)) || (t.questionIndex !== null && t.questionText === null) ||
    (t.kind === "daily" && (t.questionText === null || t.questionIndex !== null))) throw new Error("invalid_report");
  return { id: value.id, clientId: value.clientId, createdAt: value.createdAt as number, target: { kind: t.kind as ReportTarget["kind"], itemId: t.itemId, title: t.title, questionIndex: t.questionIndex as number | null, questionText: t.questionText as string | null, contentKey: t.contentKey }, reason: value.reason as ReportReason, note: value.note };
}
export function reportDeliveryError(error: unknown): string {
  if ((error as { code?: string })?.code === "P0001") return "Έχεις στείλει αρκετές αναφορές αυτή την ώρα. Η αναφορά φυλάχτηκε· δοκίμασε ξανά αργότερα.";
  return "Η αποστολή δεν επιβεβαιώθηκε ακόμη. Η αναφορά φυλάχτηκε στη συσκευή σου. Δοκίμασε ξανά εδώ ή από τον Λογαριασμό → Αναφορές σε αναμονή.";
}
