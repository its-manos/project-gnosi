import type { Lesson, LessonQuestion } from "../data/lessons";
import type { GeneralKnowledgeQuestion } from "../data/questions";
import { contentVersion } from "./engine";
import type { ChoiceQuestion } from "./types";

export function adaptLessonQuestion(lesson: Lesson, index: number): ChoiceQuestion {
  const question: LessonQuestion | undefined = lesson.questions[index];
  if (!question) throw new Error("unknown_question");
  const id = question.id ?? `lesson:${lesson.id}:q${index + 1}`;
  const content = { answers: [...question.answers], correctIndex: question.correctIndex };
  return { id, type: "multiple-choice", version: contentVersion(question.question, content, question.version),
    categoryId: lesson.categoryId, subcategoryId: lesson.subcategoryId,
    conceptIds: [...(question.conceptIds ?? [id])], difficulty: question.difficulty ?? "medium",
    difficultyOrigin: question.difficulty ? "editorial" : "legacy-default",
    prompt: question.question, explanation: question.explanation, content,
    sources: (question.sources ?? lesson.sources).map(source => ({ ...source })), media: question.media ? { ...question.media } : undefined };
}
export function adaptDailyQuestion(question: GeneralKnowledgeQuestion): ChoiceQuestion {
  const id = `daily:${question.id}`, content = { answers: [...question.answers], correctIndex: question.correctIndex };
  return { id, type: "multiple-choice", version: contentVersion(question.question, content, question.version),
    categoryId: question.categoryId, subcategoryId: question.subcategoryId,
    conceptIds: [...(question.conceptIds ?? [id])], difficulty: question.difficulty, difficultyOrigin: "editorial",
    prompt: question.question, explanation: question.explanation, content,
    sources: (question.sources ?? [{ title: question.sourceTitle, url: question.sourceUrl }]).map(source => ({ ...source })),
    media: question.media ? { ...question.media } : undefined };
}

/** Lesson reader pilot: reuse the production question cards while preserving
 * numeric legacy checkpoint answers, storage, scoring and XP. This bridge
 * intentionally covers only the two single-choice interactive formats.
 */
export function adaptInteractiveLessonQuestion(lesson: Lesson, index: number): import("./types").SpotMistakeQuestion | import("./types").FillBlankQuestion | null {
  const question = lesson.questions[index];
  if (!question?.presentation) return null;
  const legacy = adaptLessonQuestion(lesson, index);
  const options = question.answers.map((text, i) => ({ id: `option-${i}`, text }));
  if (question.presentation.type === "spot-the-mistake") {
    return { ...legacy, type: "spot-the-mistake", content: {
      options, incorrectOptionId: `option-${question.correctIndex}`, correction: question.presentation.correction,
    } };
  }
  return { ...legacy, type: "fill-in-the-blank", content: {
    before: question.presentation.before, after: question.presentation.after, options,
    correctOptionId: `option-${question.correctIndex}`,
  } };
}

export function interactiveLessonAnswerIndex(question: LessonQuestion, value: unknown): number | null {
  if (!question.presentation || typeof value !== "string") return null;
  const index = question.answers.findIndex((_, i) => value === `option-${i}`);
  return index < 0 ? null : index;
}
