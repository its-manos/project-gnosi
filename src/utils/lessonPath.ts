import { lessonPaths } from "../data/lessonPaths";
import type { Lesson } from "../data/lessons";
import { devLessonsUnlocked } from "./devLessonAccess";

export { lessonPaths };

export function getSubcategoryPath(catalogue: readonly Lesson[], subcategoryId: string): Lesson[] {
  const order = lessonPaths[subcategoryId] ?? [];
  const rank = (id: string) => { const index = order.indexOf(id); return index < 0 ? order.length : index; };
  return catalogue.filter(l => l.subcategoryId === subcategoryId)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

function getAccessInPath(
  lesson: Lesson,
  path: readonly Lesson[],
  completed: readonly string[],
  inProgress: readonly string[],
) {
  const index = path.findIndex(item => item.id === lesson.id);
  const prerequisite = index > 0 ? path[index - 1] : null;
  // Keep existing completions and unfinished attempts accessible. Bookmarks are
  // not progress. Unlocks derive from the same account-scoped backup.
  const unlocked = index >= 0 && (
    devLessonsUnlocked() ||
    !prerequisite ||
    completed.includes(prerequisite.id) ||
    completed.includes(lesson.id) ||
    inProgress.includes(lesson.id)
  );
  return { unlocked, prerequisite, position: index + 1, total: path.length };
}

export function getLessonAccess(lesson: Lesson, catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[] = []) {
  return getAccessInPath(lesson, getSubcategoryPath(catalogue, lesson.subcategoryId), completed, inProgress);
}

/** Reuse each ordered path for one catalogue-wide selection. */
export function createLessonAccessLookup(
  catalogue: readonly Lesson[],
  completed: readonly string[],
  inProgress: readonly string[],
) {
  const paths = new Map<string, Lesson[]>();

  return (lesson: Lesson) => {
    let path = paths.get(lesson.subcategoryId);
    if (!path) {
      path = getSubcategoryPath(catalogue, lesson.subcategoryId);
      paths.set(lesson.subcategoryId, path);
    }
    return getAccessInPath(lesson, path, completed, inProgress);
  };
}

export function getNextPathLesson(current: Lesson, catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[] = []): Lesson | null {
  const path = getSubcategoryPath(catalogue, current.subcategoryId);
  const index = path.findIndex(l => l.id === current.id);
  if (index < 0) return null;
  const candidates = [...path.slice(index + 1), ...path.slice(0, index)];
  return candidates.find(lesson => !completed.includes(lesson.id) && getAccessInPath(lesson, path, completed, inProgress).unlocked) ?? null;
}
