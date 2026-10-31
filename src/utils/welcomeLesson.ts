import type { Lesson } from "../data/lessons";
import { getLessonAccess } from "./lessonPath";

export function welcomeLessonCandidates(catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[]): Lesson[] {
  return catalogue.filter(l => !l.contentNote && !completed.includes(l.id) && !inProgress.includes(l.id) && getLessonAccess(l, catalogue, completed, inProgress).unlocked);
}

export function pickWelcomeLesson(candidates: readonly Lesson[], topicIds: readonly string[]): Lesson | null {
  for (const topic of topicIds) {
    const lesson = candidates.find(l => l.categoryId === topic);
    if (lesson) return lesson;
  }
  return candidates[0] ?? null;
}
