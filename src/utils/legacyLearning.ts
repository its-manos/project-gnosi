import { lessons } from "../data/lessons";
import { getInlineQuestionCount } from "./lessonProgress";
import type { BackupAttempt } from "./learningBackup";
type SavedLessonAttempts = Record<string, BackupAttempt>;
function countInlineQuestions(id: string) { const lesson = lessons.find(l => l.id === id); return lesson ? getInlineQuestionCount(lesson) : 0; }
export function calculateScore(
  lessonId: string,
  checkpointAnswers: Record<number, number>
): number {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return 0;

  return Object.entries(checkpointAnswers).reduce(
    (score, [indexString, answerIndex]) => {
      const question = lesson.questions[Number(indexString)];
      return question && question.correctIndex === answerIndex
        ? score + 1
        : score;
    },
    0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCompletedLessonIds(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
      return [];
    }

    const knownIds = new Set(lessons.map((lesson) => lesson.id));
    return [...new Set(parsed.filter((id: string) => knownIds.has(id)))];
  } catch {
    return [];
  }
}

export function parseSavedAttempts(
  value: string | null,
  completedLessonIds: string[]
): SavedLessonAttempts {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};

    const completedIds = new Set(completedLessonIds);
    const validAttempts: SavedLessonAttempts = {};

    for (const [lessonId, rawAttempt] of Object.entries(parsed)) {
      const lesson = lessons.find((item) => item.id === lessonId);
      if (!lesson || !isRecord(rawAttempt)) continue;

      const replayOfCompletedLesson = rawAttempt.replayOfCompletedLesson === true;
      // Ignore stale attempts left by earlier versions when a lesson had already
      // been completed. A deliberate replay, saved by the current version, is
      // allowed to resume while the original completed record remains intact.
      if (completedIds.has(lessonId) && !replayOfCompletedLesson) continue;

      const rawAnswers = rawAttempt.checkpointAnswers;
      if (!isRecord(rawAnswers)) continue;

      const maxInlineQuestions = countInlineQuestions(lessonId);
      const checkpointAnswers: Record<number, number> = {};

      for (const [rawIndex, rawAnswer] of Object.entries(rawAnswers)) {
        const questionIndex = Number(rawIndex);
        if (
          !Number.isInteger(questionIndex) ||
          questionIndex < 0 ||
          questionIndex >= maxInlineQuestions ||
          typeof rawAnswer !== "number" ||
          !Number.isInteger(rawAnswer)
        ) {
          continue;
        }

        const question = lesson.questions[questionIndex];
        if (question && rawAnswer >= 0 && rawAnswer < question.answers.length) {
          checkpointAnswers[questionIndex] = rawAnswer;
        }
      }

      // Only retain actual attempts. If a reader exits before answering the
      // first checkpoint, reopening the lesson naturally starts at the top.
      if (Object.keys(checkpointAnswers).length === 0) continue;

      const updatedAt =
        typeof rawAttempt.updatedAt === "number" &&
        Number.isFinite(rawAttempt.updatedAt)
          ? rawAttempt.updatedAt
          : Date.now();

      validAttempts[lessonId] = {
        checkpointAnswers,
        // Recompute the score from the current lesson data. This prevents an
        // edited question bank from restoring a stale or incorrect score.
        score: calculateScore(lessonId, checkpointAnswers),
        updatedAt,
        replayOfCompletedLesson,
      };
    }

    return validAttempts;
  } catch {
    return {};
  }
}

