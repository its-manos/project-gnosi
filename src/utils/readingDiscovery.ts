import type { Lesson } from "../data/lessons";

export type ReadingState = "unread" | "in-progress" | "completed";
export type Recommendation = { lesson: Lesson; reason: "same-topic" | "same-category" | "explore" };
export const readingStateLabels: Record<ReadingState, string> = {
  unread: "Αδιάβαστο", "in-progress": "Σε εξέλιξη", completed: "Ολοκληρωμένο",
};

export function getReadingState(id: string, completed: readonly string[], inProgress: readonly string[]): ReadingState {
  // A partially answered replay is resumable even if the original was completed.
  if (inProgress.includes(id)) return "in-progress";
  return completed.includes(id) ? "completed" : "unread";
}

function unreadPool(catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[]) {
  const seen = new Set<string>();
  return catalogue.filter((lesson) => {
    if (seen.has(lesson.id)) return false;
    seen.add(lesson.id);
    return getReadingState(lesson.id, completed, inProgress) === "unread";
  }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function rotate<T>(items: readonly T[], dayKey: string): T[] {
  const parsed = Date.parse(`${dayKey}T12:00:00Z`);
  const day = Number.isFinite(parsed) ? Math.floor(parsed / 86_400_000) : 0;
  const offset = items.length ? ((day % items.length) + items.length) % items.length : 0;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function getHomeDiscovery(catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[], dayKey: string) {
  const pool = rotate(unreadPool(catalogue, completed, inProgress), dayKey);
  const featured = pool[0] ?? null;
  const suggestions: Lesson[] = [];
  const usedCategories = new Set(featured ? [featured.categoryId] : []);
  for (const lesson of pool.slice(1)) {
    if (!usedCategories.has(lesson.categoryId)) {
      suggestions.push(lesson); usedCategories.add(lesson.categoryId);
    }
    if (suggestions.length === 2) break;
  }
  // Small or nearly completed catalogues may have only one topic left.
  for (const lesson of pool.slice(1)) {
    if (suggestions.length === 2) break;
    if (!suggestions.some((item) => item.id === lesson.id)) suggestions.push(lesson);
  }
  return { featured, suggestions };
}

export function getRelatedLessons(current: Lesson, catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[], dayKey: string): Recommendation[] {
  const pool = rotate(unreadPool(catalogue, completed, inProgress).filter((item) => item.id !== current.id), dayKey);
  const rank = (item: Lesson) => item.subcategoryId === current.subcategoryId ? 0 : item.categoryId === current.categoryId ? 1 : 2;
  return pool.map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => rank(a.lesson) - rank(b.lesson) || a.index - b.index)
    .slice(0, 2)
    .map(({ lesson }) => ({ lesson, reason: rank(lesson) === 0 ? "same-topic" : rank(lesson) === 1 ? "same-category" : "explore" }));
}
