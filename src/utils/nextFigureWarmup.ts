import type { Lesson } from "../data/lessons";
import { inlineArticleMedia } from "../data/articleMedia";
import { getParagraphId } from "./lessonProgress";

/** Only warm the first image *behind* the current checkpoint gate.
 * This respects editorial paragraph IDs as well as legacy numeric placements.
 * No entire-lesson or catalogue prefetching. */
export function nextPendingFigureUrl(lesson: Lesson, visibleLimit: number): string | null {
  const figures = inlineArticleMedia[lesson.id] ?? [];
  if (!figures.length) return null;
  const paragraphs = lesson.sections.flatMap(section => section.paragraphs);
  const ids = new Map(paragraphs.map((paragraph, index) => [getParagraphId(paragraph, index + 1), index + 1]));
  let nextPosition = Infinity;
  let nextUrl: string | null = null;
  for (const figure of figures) {
    const position = figure.afterParagraphId
      ? ids.get(figure.afterParagraphId)
      : figure.afterParagraphCount;
    if (position === undefined || !Number.isInteger(position) || position <= visibleLimit || position > paragraphs.length || position >= nextPosition) continue;
    if (typeof figure.url !== "string" || !figure.url.startsWith("https://")) continue;
    nextPosition = position;
    nextUrl = figure.url;
  }
  return nextUrl;
}
