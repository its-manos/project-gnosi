import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lessons } from "../data/lessons";
import { getInlineQuestionCount } from "../utils/lessonProgress";

export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results"
  | "saved"
  | "search";

type SavedLessonAttempt = {
  checkpointAnswers: Record<number, number>;
  score: number;
  updatedAt: number;
  /** True when this is an unfinished replay of a previously completed lesson. */
  replayOfCompletedLesson: boolean;
};

type SavedLessonAttempts = Record<string, SavedLessonAttempt>;

const COMPLETED_STORAGE_KEY = "@gnosi/completed-lesson-ids";
const ATTEMPTS_STORAGE_KEY = "@gnosi/in-progress-lesson-attempts";

function countInlineQuestions(lessonId: string): number {
  const lesson = lessons.find((item) => item.id === lessonId);
  return lesson ? getInlineQuestionCount(lesson) : 0;
}

// Serialize writes so a slower older write cannot overwrite a newer attempt.
let attemptsWriteQueue: Promise<void> = Promise.resolve();
let completedWriteQueue: Promise<void> = Promise.resolve();

function persistLessonAttempts(
  attempts: SavedLessonAttempts
): Promise<void> {
  const serializedAttempts = JSON.stringify(attempts);

  attemptsWriteQueue = attemptsWriteQueue.then(async () => {
    try {
      await AsyncStorage.setItem(
        ATTEMPTS_STORAGE_KEY,
        serializedAttempts
      );
    } catch (error) {
      console.warn("Could not save unfinished lessons:", error);
    }
  });

  return attemptsWriteQueue;
}

function persistCompletedLessonIds(lessonIds: string[]): Promise<void> {
  const serializedIds = JSON.stringify(lessonIds);

  completedWriteQueue = completedWriteQueue.then(async () => {
    try {
      await AsyncStorage.setItem(COMPLETED_STORAGE_KEY, serializedIds);
    } catch (error) {
      console.warn("Could not save completed lessons:", error);
    }
  });

  return completedWriteQueue;
}

function calculateScore(
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

function parseCompletedLessonIds(value: string | null): string[] {
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

function parseSavedAttempts(
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

export function useLearningApp() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeCategoryId, setActiveCategoryId] = useState("history");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("ancient-greece");
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [pendingOpenLessonId, setPendingOpenLessonId] = useState<string | null>(null);

  // Kept for the legacy standalone QuizScreen. The primary learning flow uses
  // the inline checkpoint answers below.
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [lessonAttempts, setLessonAttempts] = useState<SavedLessonAttempts>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const [completedValue, attemptsValue] = await Promise.all([
          AsyncStorage.getItem(COMPLETED_STORAGE_KEY),
          AsyncStorage.getItem(ATTEMPTS_STORAGE_KEY),
        ]);

        const validCompletedIds = parseCompletedLessonIds(completedValue);
        const validAttempts = parseSavedAttempts(attemptsValue, validCompletedIds);

        if (isMounted) {
          setCompletedLessonIds(validCompletedIds);
          setLessonAttempts(validAttempts);
        }
      } catch (error) {
        console.warn("Could not load learning progress:", error);
      } finally {
        if (isMounted) setProgressLoaded(true);
      }
    }

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  // Unfinished attempts are written at the point of each checkpoint change.
  // This avoids depending on a later render effect to persist the answer.

  function resetAttempt() {
    setCheckpointAnswers({});
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  }

  function activateLesson(lessonId: string) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;

    setActiveLessonId(lesson.id);
    setActiveCategoryId(lesson.categoryId);
    setActiveSubcategoryId(lesson.subcategoryId);

    const savedAttempt = lessonAttempts[lesson.id];

    if (savedAttempt) {
      setCheckpointAnswers(savedAttempt.checkpointAnswers);
      setScore(savedAttempt.score);
    } else {
      setCheckpointAnswers({});
      setScore(0);
    }

    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScreen("lesson");
  }

  // If someone opens a lesson before AsyncStorage finishes loading, delay the
  // route transition until saved attempts are available instead of resetting it.
  useEffect(() => {
    if (!progressLoaded || !pendingOpenLessonId) return;

    const lessonId = pendingOpenLessonId;
    setPendingOpenLessonId(null);
    activateLesson(lessonId);
    // The pending ID is cleared in this effect, so it runs only for a queued open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoaded, pendingOpenLessonId, lessonAttempts, completedLessonIds]);

  function removeAttempt(lessonId: string): Promise<void> {
    if (!lessonAttempts[lessonId]) return Promise.resolve();

    const nextAttempts = { ...lessonAttempts };
    delete nextAttempts[lessonId];

    setLessonAttempts(nextAttempts);
    return persistLessonAttempts(nextAttempts);
  }

  async function markActiveLessonComplete() {
    const nextCompletedIds = completedLessonIds.includes(activeLessonId)
      ? completedLessonIds
      : [...completedLessonIds, activeLessonId];

    setCompletedLessonIds(nextCompletedIds);

    // Wait for both writes before navigating to Results. This avoids relying
    // exclusively on a post-render effect at the moment the user finishes.
    await Promise.all([
      persistCompletedLessonIds(nextCompletedIds),
      removeAttempt(activeLessonId),
    ]);

    setScreen("results");
  }

  function openCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setScreen("category");
  }

  function openSubcategory(subcategoryId: string, categoryId: string) {
    setActiveSubcategoryId(subcategoryId);
    setActiveCategoryId(categoryId);
    setScreen("subcategory");
  }

  function openLesson(lessonId: string) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;

    if (!progressLoaded) {
      setPendingOpenLessonId(lessonId);
      return;
    }

    activateLesson(lessonId);
  }

  function startQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCheckpointAnswers({});
    setScore(0);
    setScreen("quiz");
  }

  function chooseAnswer(answerIndex: number, correctIndex: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    if (answerIndex === correctIndex) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function nextQuestion(questionCount: number) {
    if (selectedAnswer === null) return;

    if (questionIndex < questionCount - 1) {
      setQuestionIndex((currentIndex) => currentIndex + 1);
      setSelectedAnswer(null);
      return;
    }

    void markActiveLessonComplete();
  }

  function answerCheckpoint(
    checkpointIndex: number,
    answerIndex: number,
    correctIndex: number
  ) {
    if (checkpointAnswers[checkpointIndex] !== undefined) return;

    const lesson = lessons.find((item) => item.id === activeLessonId);
    if (!lesson) return;

    const nextAnswers = {
      ...checkpointAnswers,
      [checkpointIndex]: answerIndex,
    };
    const nextScore = calculateScore(activeLessonId, nextAnswers);

    setCheckpointAnswers(nextAnswers);
    setScore(nextScore);

    // Persist the exact answer snapshot immediately, rather than waiting for a
    // React effect after the next render. This keeps resume data reliable when
    // the reader leaves the lesson or backgrounds the app right after answering.
    const nextAttempts: SavedLessonAttempts = {
      ...lessonAttempts,
      [activeLessonId]: {
        checkpointAnswers: nextAnswers,
        score: nextScore,
        updatedAt: Date.now(),
        replayOfCompletedLesson:
          lessonAttempts[activeLessonId]?.replayOfCompletedLesson ??
          completedLessonIds.includes(activeLessonId),
      },
    };

    setLessonAttempts(nextAttempts);
    void persistLessonAttempts(nextAttempts);

    // Keep the passed correctIndex in the function contract used by the card.
    // Calculate the stored score from lesson data to avoid drift if state updates batch.
    if (answerIndex === correctIndex && lesson.questions[checkpointIndex]?.correctIndex !== correctIndex) {
      console.warn("Checkpoint answer key differs from lesson data:", lesson.id, checkpointIndex);
    }
  }

  function finishInlineLesson() {
    const requiredAnswers = countInlineQuestions(activeLessonId);
    const answeredCount = Object.keys(checkpointAnswers).filter(
      (key) => Number(key) < requiredAnswers
    ).length;

    if (requiredAnswers === 0 || answeredCount < requiredAnswers) return;
    void markActiveLessonComplete();
  }

  function restartLesson() {
    void removeAttempt(activeLessonId);
    resetAttempt();
    setScreen("lesson");
  }

  const latestAttemptEntry = Object.entries(lessonAttempts)
    .filter(([lessonId, attempt]) =>
      !completedLessonIds.includes(lessonId) || attempt.replayOfCompletedLesson
    )
    .sort(([, first], [, second]) => second.updatedAt - first.updatedAt)[0];

  const inProgressLessonId = progressLoaded
    ? latestAttemptEntry?.[0] ?? null
    : null;
  const inProgressCheckpointAnswers = latestAttemptEntry?.[1].checkpointAnswers ?? {};

  return {
    screen,
    setScreen,
    activeCategoryId,
    activeSubcategoryId,
    activeLessonId,
    questionIndex,
    selectedAnswer,
    checkpointAnswers,
    score,
    completedLessonIds,
    progressLoaded,
    inProgressLessonId,
    inProgressAnsweredCount: Object.keys(inProgressCheckpointAnswers).length,
    inProgressQuestionCount: inProgressLessonId
      ? countInlineQuestions(inProgressLessonId)
      : 0,
    openCategory,
    openSubcategory,
    openLesson,
    startQuiz,
    chooseAnswer,
    nextQuestion,
    answerCheckpoint,
    finishInlineLesson,
    restartLesson,
  };
}
