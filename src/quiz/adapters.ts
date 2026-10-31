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
