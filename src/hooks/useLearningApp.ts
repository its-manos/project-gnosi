import { emitPlayFeedback } from "../play/events";
import { quizRewardSummary } from "../gamification/rewards";
import { adaptLessonQuestion } from "../quiz/adapters";
import { advanceQuizSession, calculateQuizResults, createQuizSession, evaluateChoice, submitQuizAnswer } from "../quiz/engine";
import { legacyAnswerSlots, restoreLegacySession } from "../quiz/compatibility";
import type { QuizSession } from "../quiz/types";
import { useEffect, useRef, useState } from "react";
import { lessons } from "../data/lessons";
import type { LearningBackup } from "../utils/learningBackup";
import { calculateScore } from "../utils/legacyLearning";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { lessonReview } from "../utils/lessonReview";
import { lessonScores } from "../utils/weeklyReview";
import { getLessonAccess } from "../utils/lessonPath";
function countInlineQuestions(id: string): number { const lesson = lessons.find(l => l.id === id); return lesson ? getInlineQuestionCount(lesson) : 0; }

export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results"
  | "review"
  | "weekly-review"
  | "knowledge-review"
  | "profile"
  | "player-stats"
  | "account"
  | "progress"
  | "saved"
  | "search";


export function useLearningApp() {
  const feedbackAttempt = useRef(0);
  const completionRun = useRef("");
  const standaloneSession = useRef<QuizSession | null>(null);
  const renderRun = completionRun.current;
  const [lessonOrigin, setLessonOrigin] = useState<AppScreen>("subcategory");
  function newCompletionRun() { completionRun.current = `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`; }
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
  const [earnedXP, setEarnedXP] = useState(0);
  const [resultMode, setResultMode] = useState<"finished" | "returning">("finished");
  const [reviewIndices, setReviewIndices] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewAnswer, setReviewAnswer] = useState<number | null>(null);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const reviewSession = useRef<{ lessonId: string; index: number; answer: number | null }>({ lessonId: "", index: 0, answer: null });
  const { store } = useLearningSession();
  const snapshot = useLearningSnapshot();
  const completedLessonIds = snapshot.backup.completedIds;
  const lessonAttempts = snapshot.backup.attempts;
  const progressLoaded = snapshot.ready;
  const activeLesson = lessons.find(lesson => lesson.id === activeLessonId) ?? lessons[0];
  const review = lessonReview(activeLesson, snapshot.activity);

  function resetAttempt() {
    setCheckpointAnswers({});
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  }

  function activateLesson(lessonId: string) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    const backup = store.getSnapshot().backup;
    if (!getLessonAccess(lesson, lessons, backup.completedIds, Object.keys(backup.attempts)).unlocked) {
      setActiveCategoryId(lesson.categoryId);
      setActiveSubcategoryId(lesson.subcategoryId);
      setScreen("subcategory");
      return;
    }
    if (!["lesson", "quiz", "results", "review"].includes(screen)) setLessonOrigin(screen);
    newCompletionRun();
    setEarnedXP(0);
    standaloneSession.current = null;
    setPracticeComplete(false);
    reviewSession.current = { lessonId: "", index: 0, answer: null };

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
    const previous = store.getSnapshot();
    if (previous.backup.completedIds.includes(lessonId) && !savedAttempt) {
      setResultMode("returning");
      setScore(lessonReview(lesson, previous.activity).result?.correctCount ?? 0);
      setScreen("results");
    } else setScreen("lesson");
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

  async function markActiveLessonComplete(answers = checkpointAnswers) {
    if (renderRun !== completionRun.current) return;
    setEarnedXP(store.complete(activeLessonId, { id: completionRun.current, answers }));
    setScore(calculateScore(activeLessonId, answers));
    await store.flushLocal();
    if (renderRun !== completionRun.current) return;
    setResultMode("finished");
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
    newCompletionRun();
    setEarnedXP(0);
    standaloneSession.current = createQuizSession(`quiz:${activeLessonId}:${completionRun.current}`, "lesson", activeLesson.questions.map((_, i) => adaptLessonQuestion(activeLesson, i)));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCheckpointAnswers({});
    setScore(0);
    setScreen("quiz");
  }

  function chooseAnswer(answerIndex: number, _correctIndex: number) {
    if (renderRun !== completionRun.current) return;
    const session = standaloneSession.current, question = session?.questions[questionIndex];
    if (!session || !question) return;
    const transition = submitQuizAnswer(session, { id: question.id, version: question.version }, answerIndex);
    if (!transition.changed) return;
    standaloneSession.current = transition.session;
    emitPlayFeedback({ scope: store.userId ?? "guest", id: `standalone:${session.id}:${question.id}`, kind: evaluateChoice(activeLesson.questions[questionIndex], answerIndex).correct ? "correct" : "incorrect" });
    setSelectedAnswer(answerIndex);
    setCheckpointAnswers(legacyAnswerSlots(transition.session));
    setScore(calculateQuizResults(transition.session).correctCount);
  }

  function nextQuestion(_questionCount: number) {
    if (renderRun !== completionRun.current) return;
    const session = standaloneSession.current, question = session?.questions[questionIndex];
    if (!session || !question) return;
    const transition = advanceQuizSession(session, { id: question.id, version: question.version });
    if (!transition.changed) return;
    standaloneSession.current = transition.session;
    if (transition.session.completed) {
      void markActiveLessonComplete(legacyAnswerSlots(transition.session));
    } else {
      setQuestionIndex(transition.session.currentIndex);
      setSelectedAnswer(null);
    }
  }

  function answerCheckpoint(
    checkpointIndex: number,
    answerIndex: number,
    correctIndex: number
  ) {
    if (renderRun !== completionRun.current) return;
    const lesson = lessons.find(item => item.id === activeLessonId);
    if (!lesson) return;
    const current = store.getSnapshot().backup;
    const previous = current.attempts[activeLessonId]?.checkpointAnswers ?? checkpointAnswers;
    const normalized = lesson.questions.slice(0, getInlineQuestionCount(lesson)).map((_, i) => adaptLessonQuestion(lesson, i));
    const question = normalized[checkpointIndex];
    if (!question) return;
    const session = restoreLegacySession(`inline:${lesson.id}`, "lesson", normalized, previous);
    const transition = submitQuizAnswer(session, { id: question.id, version: question.version }, answerIndex);
    if (!transition.changed) return;
    const nextAnswers = legacyAnswerSlots(transition.session);
    const nextScore = calculateQuizResults(transition.session).correctCount;
    // Store state changes synchronously before React renders, preventing stale double taps.
    store.answer(activeLessonId, {
      checkpointAnswers: nextAnswers,
      score: nextScore,
      updatedAt: Date.now(),
      replayOfCompletedLesson: current.attempts[activeLessonId]?.replayOfCompletedLesson ?? current.completedIds.includes(activeLessonId),
    });
    setCheckpointAnswers(nextAnswers);
    setScore(nextScore);
    if (lesson.questions[checkpointIndex]?.correctIndex !== correctIndex) {
      console.warn("Checkpoint answer key differs from lesson data:", lesson.id, checkpointIndex);
    }
  }

  function finishInlineLesson() {
    if (renderRun !== completionRun.current) return;
    const answers = store.getSnapshot().backup.attempts[activeLessonId]?.checkpointAnswers ?? checkpointAnswers;
    const requiredAnswers = countInlineQuestions(activeLessonId);
    const result = calculateScore(activeLessonId, answers);
    const answeredCount = Object.keys(answers).filter(key => Number(key) < requiredAnswers).length;
    if (requiredAnswers === 0 || answeredCount < requiredAnswers) return;
    setScore(result);
    void markActiveLessonComplete(answers);
  }

  function restartLesson() {
    newCompletionRun();
    setEarnedXP(0);
    standaloneSession.current = null;
    setPracticeComplete(false);
    void removeAttempt(activeLessonId);
    resetAttempt();
    setScreen("lesson");
  }

  function startMistakeReview() {
    const current = lessonReview(activeLesson, store.getSnapshot().activity);
    if (current.status !== "available") return;
    setReviewIndices(current.indices);
    reviewSession.current = { lessonId: activeLessonId, index: 0, answer: null };
    setReviewIndex(0);
    setReviewAnswer(null);
    setPracticeComplete(false);
    setScreen("review");
  }
  function answerReview(answer: number) {
    const question = activeLesson.questions[reviewIndices[reviewIndex]];
    const session = reviewSession.current;
    if (!question || session.lessonId !== activeLessonId || session.index !== reviewIndex || session.answer !== null || !evaluateChoice(question, answer).valid) return;
    session.answer = answer;
    feedbackAttempt.current++;
    emitPlayFeedback({ scope: store.userId ?? "guest", id: `mistake:${activeLessonId}:${reviewIndex}:${completionRun.current}:${feedbackAttempt.current}`, kind: evaluateChoice(question, answer).correct ? "correct" : "incorrect" });
    setReviewAnswer(answer);
  }
  function nextReviewQuestion() {
    const question = activeLesson.questions[reviewIndices[reviewIndex]];
    const session = reviewSession.current;
    if (!question || session.lessonId !== activeLessonId || session.index !== reviewIndex || !evaluateChoice(question, session.answer).correct) return;
    session.index++;
    session.answer = null;
    setReviewIndex(session.index);
    setReviewAnswer(null);
  }
  function retryReviewQuestion() {
    const session = reviewSession.current, question = activeLesson.questions[reviewIndices[reviewIndex]];
    if (!question || session.lessonId !== activeLessonId || session.index !== reviewIndex || session.answer === null || evaluateChoice(question, session.answer).correct) return;
    session.answer = null;
    setReviewAnswer(null);
  }
  function endMistakeReview() {
    setPracticeComplete(reviewIndices.length > 0 && reviewIndex === reviewIndices.length);
    reviewSession.current = { lessonId: "", index: 0, answer: null };
    setScreen("results");
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
    lessonBackScreen: lessonOrigin,
    setScreen,
    activeCategoryId,
    activeSubcategoryId,
    activeLessonId,
    questionIndex,
    selectedAnswer,
    checkpointAnswers,
    score,
    earnedXP,
    combo: quizRewardSummary(activeLesson.questions.map((_, i) => adaptLessonQuestion(activeLesson, i)), checkpointAnswers, "lesson").combo,
    highestCombo: quizRewardSummary(activeLesson.questions.map((_, i) => adaptLessonQuestion(activeLesson, i)), checkpointAnswers, "lesson").highestCombo,
    resultMode,
    review,
    lessonScores: lessonScores(activeLesson, snapshot.activity, snapshot.weeklyReviews),
    reviewIndices,
    reviewIndex,
    reviewAnswer,
    practiceComplete,
    startMistakeReview,
    answerReview,
    nextReviewQuestion,
    retryReviewQuestion,
    endMistakeReview,
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
