import type { Lesson } from "../data/lessons";
import { quizFingerprint, type CompletionEvent, type CompletionEvents } from "./learningActivity";

export type ReviewState = { result: CompletionEvent | null; indices: number[]; status: "available" | "perfect" | "missing-details" | "changed" | "no-result" };
export function lessonReview(lesson: Lesson, events: CompletionEvents): ReviewState {
  const latest = Object.entries(events).filter(([, event]) => event.lessonId === lesson.id)
    .sort(([aId, a], [bId, b]) => b.at - a.at || (aId < bId ? 1 : aId > bId ? -1 : 0))[0]?.[1] ?? null;
  if (!latest) return { result: null, indices: [], status: "no-result" };
  if (latest.quizKey !== quizFingerprint(lesson.questions)) return { result: latest, indices: [], status: "changed" };
  if (latest.correctCount === latest.questionCount) return { result: latest, indices: [], status: "perfect" };
  if (latest.missedQuestionIndices === undefined) return { result: latest, indices: [], status: "missing-details" };
  return { result: latest, indices: [...latest.missedQuestionIndices], status: "available" };
}
