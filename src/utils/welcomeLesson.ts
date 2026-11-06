import type { Lesson } from "../data/lessons";
import { createLessonAccessLookup } from "./lessonPath";

export function welcomeLessonCandidates(catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[]): Lesson[] {
  const getAccess = createLessonAccessLookup(catalogue, completed, inProgress);
  return catalogue.filter(lesson =>
    !lesson.contentNote &&
    !completed.includes(lesson.id) &&
    !inProgress.includes(lesson.id) &&
    getAccess(lesson).unlocked
  );
}

export function pickWelcomeLesson(candidates: readonly Lesson[], topicIds: readonly string[]): Lesson | null {
  for (const topic of topicIds) {
    const lesson = candidates.find(l => l.categoryId === topic);
    if (lesson) return lesson;
  }
  return candidates[0] ?? null;
}
