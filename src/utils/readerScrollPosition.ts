import type { Lesson } from "../data/lessons";
import { getReadingQuestionPlacements, getReadingResumeParagraphNumber } from "./lessonProgress";

/** All offsets refer to the reader ScrollView's content coordinates. */
export const READER_SCROLL_TOP_GAP = 12;
export const READER_SECTION_TOP_PADDING = 20;

export type ReaderScrollAnchor =
  | { kind: "paragraph"; number: number }
  | { kind: "checkpoint"; number: number }
  | { kind: "finish" };

export type ReaderParagraphPosition = { sectionIndex: number; y: number };
export type ReaderScrollMeasurements = {
  sectionStarts: readonly number[];
  sectionPositions: Readonly<Record<number, number>>;
  paragraphPositions: Readonly<Record<number, ReaderParagraphPosition>>;
  checkpointPositions: Readonly<Record<number, number>>;
  finishPosition: number | null;
};

/** Preserve canonical checkpoint numbering. A partially answered question
 * group resumes at its question invitation, not the paragraph above it. */
export function getReaderResumeAnchor(
  lesson: Lesson, answers: Record<number, number>,
): ReaderScrollAnchor | null {
  const number = getReadingResumeParagraphNumber(lesson, answers);
  if (number === null) return null;

  const placements = getReadingQuestionPlacements(lesson);
  const firstPending = placements.findIndex(p => answers[p.questionIndex] === undefined);
  if (firstPending < 0) return { kind: "finish" };

  if (firstPending > 0
    && placements[firstPending - 1].afterParagraphNumber === placements[firstPending].afterParagraphNumber) {
    return { kind: "checkpoint", number: placements[firstPending].afterParagraphNumber };
  }

  return { kind: "paragraph", number };
}

/** Always resolve an exact paragraph rather than selecting a later section.
 * At section boundaries align the visible marker (below the border), not the
 * outer container. Within a section align the requested paragraph's top. */
export function resolveReaderScrollY(
  anchor: ReaderScrollAnchor,
  positions: ReaderScrollMeasurements,
): number | undefined {
  if (anchor.kind === "finish") {
    return positions.finishPosition === null
      ? undefined : Math.max(0, positions.finishPosition - READER_SCROLL_TOP_GAP);
  }
  const paragraph = positions.paragraphPositions[anchor.number];
  if (!paragraph) return undefined;
  const sectionY = positions.sectionPositions[paragraph.sectionIndex];
  if (sectionY === undefined) return undefined;

  let y: number;
  if (anchor.kind === "checkpoint") {
    const gateY = positions.checkpointPositions[anchor.number];
    if (gateY === undefined) return undefined;
    y = sectionY + paragraph.y + gateY;
  } else if (positions.sectionStarts[paragraph.sectionIndex] === anchor.number) {
    y = sectionY + READER_SECTION_TOP_PADDING;
  } else {
    y = sectionY + paragraph.y;
  }
  return Math.max(0, y - READER_SCROLL_TOP_GAP);
}
