import type { Lesson } from "../data/lessons";

export type AtlasRegionProgress = {
  total: number;
  completed: number;
  inProgress: number;
  percent: number;
  status: "loading" | "coming-soon" | "new" | "in-progress" | "complete";
};

export type AtlasCategoryProgress = {
  total: number;
  completed: number;
  percent: number;
};

/** Presentation-only progress. Never changes unlocks or persisted lesson state. */
export function getAtlasRegionProgress(
  lessons: readonly Pick<Lesson, "id" | "subcategoryId">[],
  subcategoryId: string,
  completedLessonIds: readonly string[],
  inProgressLessonIds: readonly string[],
  progressLoaded: boolean,
): AtlasRegionProgress {
  const regionLessons = lessons.filter(lesson => lesson.subcategoryId === subcategoryId);
  const total = regionLessons.length;
  if (!progressLoaded) return { total, completed: 0, inProgress: 0, percent: 0, status: "loading" };
  if (total === 0) return { total, completed: 0, inProgress: 0, percent: 0, status: "coming-soon" };
  const done = new Set(completedLessonIds);
  const started = new Set(inProgressLessonIds);
  const completed = regionLessons.filter(lesson => done.has(lesson.id)).length;
  const inProgress = regionLessons.filter(lesson => !done.has(lesson.id) && started.has(lesson.id)).length;
  return {
    total, completed, inProgress,
    percent: Math.round(completed / total * 100),
    status: completed === total ? "complete" : inProgress > 0 || completed > 0 ? "in-progress" : "new",
  };
}

export function getAtlasCategoryProgress(
  lessons: readonly Pick<Lesson, "id" | "categoryId">[],
  categoryId: string,
  completedLessonIds: readonly string[],
  progressLoaded: boolean,
): AtlasCategoryProgress {
  const categoryLessons = lessons.filter(lesson => lesson.categoryId === categoryId);
  const total = categoryLessons.length;
  if (!progressLoaded || total === 0) return { total, completed: 0, percent: 0 };
  const done = new Set(completedLessonIds);
  const completed = categoryLessons.filter(lesson => done.has(lesson.id)).length;
  return { total, completed, percent: Math.round(completed / total * 100) };
}
