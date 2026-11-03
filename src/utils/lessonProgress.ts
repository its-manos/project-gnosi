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

/**
 * Display-only placement of checkpoints. Published paragraph anchors are kept
 * intact for editorial history and image positioning. Opted-in lessons reveal
 * their questions after the last paragraph of the containing section.
 *
 * Several questions may share a section ending. The reader presents them in
 * canonical question order; none of the saved answer slots are renumbered.
 */
export function getReadingQuestionPlacements(lesson: Lesson): QuestionPlacement[] {
  const authored = getQuestionPlacements(lesson);
  if (lesson.questionPlacement !== "section-end") return authored;
  const paragraphs = lesson.sections.flatMap(section => section.paragraphs);
  const endByParagraph = new Map<number, number>();
  let count = 0;
  for (const section of lesson.sections) {
    const start = count + 1;
    count += section.paragraphs.length;
    for (let number = start; number <= count; number++) endByParagraph.set(number, count);
  }
  return authored.map(placement => {
    const end = endByParagraph.get(placement.afterParagraphNumber);
    if (end === undefined || end === placement.afterParagraphNumber) return placement;
    return {
      ...placement,
      afterParagraphNumber: end,
      afterParagraphId: getParagraphId(paragraphs[end - 1], end),
    };
  });
}

/** The reading gate follows displayed checkpoints, not their authored anchors. */
export function getReadingVisibleParagraphLimit(lesson: Lesson, checkpointAnswers: Record<number, number>): number {
  const next = getReadingQuestionPlacements(lesson).find(p => checkpointAnswers[p.questionIndex] === undefined);
  return next ? next.afterParagraphNumber : getParagraphCount(lesson);
}

/**
 * Resume at the first pending question when it shares the already answered
 * question's section ending; otherwise resume at the next paragraph as before.
 */
export function getReadingResumeParagraphNumber(lesson: Lesson, checkpointAnswers: Record<number, number>): number | null {
  const placements = getReadingQuestionPlacements(lesson);
  let answered = 0;
  while (answered < placements.length && checkpointAnswers[placements[answered].questionIndex] !== undefined) answered++;
  if (answered === 0) return null;
  const previousEnd = placements[answered - 1].afterParagraphNumber;
  if (answered < placements.length && placements[answered].afterParagraphNumber === previousEnd) return previousEnd;
  return Math.min(previousEnd + 1, getParagraphCount(lesson));
}
