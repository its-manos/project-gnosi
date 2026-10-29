import type { Lesson } from "../data/lessons";

/** Total number of paragraphs in the lesson body, excluding the intro. */
export function getParagraphCount(lesson: Lesson): number {
  return lesson.sections.reduce(
    (total, section) => total + section.paragraphs.length,
    0
  );
}

/** Inline checkpoints appear after each pair of article paragraphs. */
export function getInlineQuestionCount(lesson: Lesson): number {
  return Math.min(
    lesson.questions.length,
    Math.floor(getParagraphCount(lesson) / 2)
  );
}

/**
 * On resume, target the first paragraph made available after the last
 * consecutively answered checkpoint. LessonScreen prefers that paragraph's
 * section heading when one is available in the currently unlocked content.
 */
export function getResumeParagraphNumber(
  lesson: Lesson,
  checkpointAnswers: Record<number, number>
): number | null {
  const inlineQuestionCount = getInlineQuestionCount(lesson);
  const paragraphCount = getParagraphCount(lesson);

  if (inlineQuestionCount === 0 || paragraphCount === 0) return null;

  // Checkpoints are answered in order. Count only the consecutive answers from
  // the beginning so malformed/stale state cannot skip an unanswered question.
  let consecutiveAnsweredCount = 0;
  while (
    consecutiveAnsweredCount < inlineQuestionCount &&
    checkpointAnswers[consecutiveAnsweredCount] !== undefined
  ) {
    consecutiveAnsweredCount += 1;
  }

  if (consecutiveAnsweredCount === 0) return null;

  // Q1 follows paragraph 2, Q2 follows paragraph 4, etc. Resume on the next
  // paragraph (3, 5, 7...) rather than the paragraph before that question.
  const nextParagraph = consecutiveAnsweredCount * 2 + 1;
  return Math.min(nextParagraph, paragraphCount);
}
