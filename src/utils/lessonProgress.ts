import type { Lesson } from "../data/lessons";

/** New articles use stable paragraph IDs; legacy articles retain string paragraphs. */
export function getParagraphCount(lesson: Lesson): number {
  return lesson.sections.reduce((total, section) => total + section.paragraphs.length, 0);
}

export function getParagraphText(paragraph: Lesson["sections"][number]["paragraphs"][number]): string {
  return typeof paragraph === "string" ? paragraph : paragraph.text;
}

export function getParagraphId(paragraph: Lesson["sections"][number]["paragraphs"][number], number: number): string {
  return typeof paragraph === "string" ? `legacy-paragraph-${number}` : paragraph.id;
}

export type QuestionPlacement = { questionIndex: number; questionId: string; afterParagraphNumber: number; afterParagraphId: string };

/** Explicit placements are ordered by the canonical question array; old lessons use paragraph pairs. */
export function getQuestionPlacements(lesson: Lesson): QuestionPlacement[] {
  const all = lesson.sections.flatMap(section => section.paragraphs);
  if (!lesson.checkpoints) {
    return lesson.questions.slice(0, Math.floor(all.length / 2)).map((question, questionIndex) => ({
      questionIndex, questionId: question.id ?? `legacy-question-${questionIndex}`,
      afterParagraphNumber: (questionIndex + 1) * 2,
      afterParagraphId: getParagraphId(all[(questionIndex + 1) * 2 - 1], (questionIndex + 1) * 2),
    }));
  }
  const paragraphs = new Map(all.map((paragraph, index) => [getParagraphId(paragraph, index + 1), index + 1]));
  const checkpoints = new Map(lesson.checkpoints.map(checkpoint => [checkpoint.questionId, checkpoint.afterParagraphId]));
  return lesson.questions.map((question, questionIndex) => {
    if (!question.id) throw new Error(`missing_explicit_question_id:${lesson.id}:${questionIndex}`);
    const paragraphId = checkpoints.get(question.id);
    const afterParagraphNumber = paragraphId ? paragraphs.get(paragraphId) : undefined;
    if (!paragraphId || afterParagraphNumber === undefined) throw new Error(`invalid_checkpoint:${lesson.id}:${question.id}`);
    return { questionIndex, questionId: question.id, afterParagraphId: paragraphId, afterParagraphNumber };
  });
}

export function getInlineQuestionCount(lesson: Lesson): number {
  return getQuestionPlacements(lesson).length;
}

export function getVisibleParagraphLimit(lesson: Lesson, checkpointAnswers: Record<number, number>): number {
  const placements = getQuestionPlacements(lesson);
  const next = placements.find(p => checkpointAnswers[p.questionIndex] === undefined);
  return next ? next.afterParagraphNumber : getParagraphCount(lesson);
}

/** Resume at the paragraph immediately after the last consecutively answered checkpoint. */
export function getResumeParagraphNumber(lesson: Lesson, checkpointAnswers: Record<number, number>): number | null {
  const placements = getQuestionPlacements(lesson);
  let answered = 0;
  while (answered < placements.length && checkpointAnswers[answered] !== undefined) answered++;
  if (answered === 0) return null;
  const next = placements[answered - 1].afterParagraphNumber + 1;
  return Math.min(next, getParagraphCount(lesson));
}
