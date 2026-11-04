import { categories, lessons } from "../data/lessons";

/** Keep catalogue order for stable tie-breaking in the reading dashboard. */
export function categoryCompletionRows(completedLessonIds: readonly string[]) {
  const completed = new Set(completedLessonIds);
  const counts = new Map<string, { total: number; count: number }>();
  for (const lesson of lessons) {
    const current = counts.get(lesson.categoryId) ?? { total: 0, count: 0 };
    current.total += 1;
    if (completed.has(lesson.id)) current.count += 1;
    counts.set(lesson.categoryId, current);
  }
  return categories.map((category, index) => {
    const { total, count } = counts.get(category.id) ?? { total: 0, count: 0 };
    return { category, index, count, total, percent: total ? Math.round(count / total * 100) : 0 };
  });
}
