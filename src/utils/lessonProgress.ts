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
 * When reopening an attempted lesson, restore to the section containing the
 * paragraph paired with the most recent answered checkpoint. That lets the
 * reader revisit the heading and context they were just learning, rather than
 * jumping forward to the next unanswered question.
 */
export function getResumeParagraphNumber(
  lesson: Lesson,
  checkpointAnswers: Record<number, number>
): number | null {
  const inlineQuestionCount = getInlineQuestionCount(lesson);
  if (inlineQuestionCount === 0) return null;

  const checkpointIndexes = Array.from(
    { length: inlineQuestionCount },
    (_, index) => index
  );
  const firstUnansweredQuestion = checkpointIndexes.find(
    (index) => checkpointAnswers[index] === undefined
  );

  // The main article flow only unlocks checkpoints in order. Use the number of
  // consecutive answered checkpoints so malformed/stale data cannot target a
  // paragraph that is still locked.
  const consecutiveAnsweredCount = firstUnansweredQuestion === undefined
    ? inlineQuestionCount
    : firstUnansweredQuestion;

  if (consecutiveAnsweredCount === 0) return null;

  const paragraphCount = getParagraphCount(lesson);
  const target = consecutiveAnsweredCount * 2;

  return Math.max(1, Math.min(target, paragraphCount));
}
