import type { Lesson, LessonQuestion } from "../data/lessons";
import type { GeneralKnowledgeQuestion } from "../data/questions";
import { contentVersion, evaluateAnswer as _evaluateAnswer } from "./engine";
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

/** The authored presentation controls the UI; the historical numeric choice
 * remains a compatibility projection for rewards, completions, and review.
 * Never change lesson.question IDs or historical answer slots.
 */
export function adaptInteractiveLessonQuestion(
  lesson: Lesson, index: number,
): import("./types").BuiltinQuizQuestion | null {
  const question = lesson.questions[index];
  const format = question?.presentation;
  if (!format) return null;
  const legacy = adaptLessonQuestion(lesson, index);
  const options = question.answers.map((text, i) => ({ id: `option-${i}`, text }));
  const result = (() => {
    switch (format.type) {
      case "spot-the-mistake":
        return { type: "spot-the-mistake" as const, content: {
          options, incorrectOptionId: `option-${question.correctIndex}`, correction: format.correction,
        } };
      case "fill-in-the-blank":
        return { type: "fill-in-the-blank" as const, content: {
          before: format.before, after: format.after, options,
          correctOptionId: `option-${question.correctIndex}`,
        } };
      case "multiple-select":
        return { type: "multiple-select" as const, content: {
          answers: [...question.answers], correctIndices: [...format.correctIndices],
        } };
      case "ordering":
        return { type: "ordering" as const, content: {
          items: format.items.map(item => ({ ...item })),
          correctOrder: [...format.correctOrder],
        } };
      case "matching":
        return { type: "matching" as const, content: {
          pairs: format.pairs.map(pair => ({ ...pair })),
        } };
    }
  })();
  return {
    ...legacy, ...result,
    version: contentVersion(question.question, result.content, question.version),
  };
}

/** Map typed answer to an existing valid numeric answer slot. The numeric
 * shadow is used for historical XP, completion and mistake summaries only.
 * The original typed value is persisted separately for accurate restoration.
 */
export function projectInteractiveLessonAnswer(lesson: Lesson, index: number, value: unknown): number | null {
  const question = lesson.questions[index];
  if (!question?.presentation) return null;
  const typed = adaptInteractiveLessonQuestion(lesson, index);
  if (!typed) return null;
  const { evaluateAnswer } = requireEngine();
  const evaluation = evaluateAnswer(typed, value);
  if (!evaluation.valid) return null;
  if (question.presentation.type === "spot-the-mistake" || question.presentation.type === "fill-in-the-blank") {
    if (typeof value !== "string") return null;
    const selected = question.answers.findIndex((_, i) => value === `option-${i}`);
    return selected < 0 ? null : selected;
  }
  if (question.answers.length < 2) return null;
  if (evaluation.correct) return question.correctIndex;
  return question.answers.findIndex((_, i) => i !== question.correctIndex);
}

/** Legacy numeric attempts from the existing two pilot formats can still
 * render as their original string IDs. The richer types must have typed saves.
 */
export function restoreInteractiveLessonAnswer(
  lesson: Lesson, index: number, numeric: number | undefined,
  typed?: import("./types").QuizAnswer,
): unknown {
  if (numeric === undefined) return undefined;
  const question = adaptInteractiveLessonQuestion(lesson, index);
  if (!question) return numeric;
  if (typed?.questionVersion === question.version) {
    const { evaluateAnswer } = requireEngine();
    if (evaluateAnswer(question, typed.value).valid &&
      projectInteractiveLessonAnswer(lesson, index, typed.value) === numeric) return typed.value;
  }
  if (question.type === "spot-the-mistake" || question.type === "fill-in-the-blank")
    return `option-${numeric}`;
  return undefined;
}

/** Keep this import statically typed and compatible with Node-only tests. */
function requireEngine() {
  return { evaluateAnswer: _evaluateAnswer };
}

/** Kept for existing pilot/tests that still reference the old helper. */
export function interactiveLessonAnswerIndex(question: LessonQuestion, value: unknown): number | null {
  if (!question.presentation || typeof value !== "string") return null;
  if (question.presentation.type !== "spot-the-mistake" && question.presentation.type !== "fill-in-the-blank") return null;
  const index = question.answers.findIndex((_, i) => value === `option-${i}`);
  return index < 0 ? null : index;
}
