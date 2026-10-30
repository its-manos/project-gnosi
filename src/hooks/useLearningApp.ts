import { useEffect, useState } from "react";
import { lessons } from "../data/lessons";
import type { LearningBackup } from "../utils/learningBackup";
import { calculateScore } from "../utils/legacyLearning";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
function countInlineQuestions(id: string): number { const lesson = lessons.find(l => l.id === id); return lesson ? getInlineQuestionCount(lesson) : 0; }

export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results"
  | "progress"
  | "saved"
  | "search";


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
  const { store } = useLearningSession();
  const snapshot = useLearningSnapshot();
  const completedLessonIds = snapshot.backup.completedIds;
  const lessonAttempts = snapshot.backup.attempts;
  const progressLoaded = snapshot.ready;

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

    const savedAttempt = store.getSnapshot().backup.attempts[lesson.id];

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
    // Resolve a navigation tap queued before AsyncStorage hydration completed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingOpenLessonId(null);
    activateLesson(lessonId);
    // The pending ID is cleared in this effect, so it runs only for a queued open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoaded, pendingOpenLessonId, lessonAttempts, completedLessonIds]);

  function removeAttempt(lessonId: string): Promise<boolean> {
    store.clearAttempt(lessonId);
    return store.flushLocal();
  }

  async function markActiveLessonComplete() {
    store.complete(activeLessonId);
    await store.flushLocal();
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
    const current = store.getSnapshot().backup;
    store.answer(activeLessonId, {
      checkpointAnswers: nextAnswers,
      score: nextScore,
      updatedAt: Date.now(),
      replayOfCompletedLesson: current.attempts[activeLessonId]?.replayOfCompletedLesson ?? current.completedIds.includes(activeLessonId),
    });

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

  async function resetLessonProgressForDevelopment(): Promise<void> {
    if (!__DEV__) return;
    await store.resetGuestProgress();
    resetAttempt();
  }
  async function mergeRestoredProgress(backup: LearningBackup): Promise<void> {
    await store.restoreProgress(backup);
  }

  const latestAttemptEntry = Object.entries(lessonAttempts)
    .filter(([lessonId, attempt]) =>
      !completedLessonIds.includes(lessonId) || attempt.replayOfCompletedLesson
    )
    .sort(([, first], [, second]) => second.updatedAt - first.updatedAt)[0];

  const inProgressLessonIds = Object.entries(lessonAttempts)
    .filter(([id, attempt]) => !completedLessonIds.includes(id) || attempt.replayOfCompletedLesson)
    .map(([id]) => id);

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
    lessonAttempts,
    mergeRestoredProgress,
    progressLoaded,
    inProgressLessonId,
    inProgressLessonIds,
    inProgressAnsweredCount: Object.keys(inProgressCheckpointAnswers).length,
    inProgressQuestionCount: inProgressLessonId
      ? countInlineQuestions(inProgressLessonId)
      : 0,
    inProgressLessonCount: Object.entries(lessonAttempts).filter(([lessonId, attempt]) =>
      !completedLessonIds.includes(lessonId) || attempt.replayOfCompletedLesson
    ).length,
    openCategory,
    openSubcategory,
    openLesson,
    startQuiz,
    chooseAnswer,
    nextQuestion,
    answerCheckpoint,
    finishInlineLesson,
    restartLesson,
    resetLessonProgressForDevelopment,
    canResetLessonProgress: store.userId === null,
  };
}
