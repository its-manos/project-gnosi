import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lessons } from "../data/lessons";

export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results"
  | "saved"
  | "search";

const PROGRESS_STORAGE_KEY = "@gnosi/completed-lesson-ids";

function countInlineQuestions(lessonId: string): number {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return 0;
  const paragraphCount = lesson.sections.reduce(
    (total, section) => total + section.paragraphs.length,
    0
  );
  return Math.min(lesson.questions.length, Math.floor(paragraphCount / 2));
}

export function useLearningApp() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeCategoryId, setActiveCategoryId] = useState("history");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("ancient-greece");
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");

  // These fields remain available for the standalone QuizScreen, which can
  // still be reused later for a dedicated practice mode.
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Questions embedded in the article use an answer map so each checkpoint
  // can show feedback independently as the reader progresses down the page.
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const storedValue = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
        if (storedValue !== null) {
          const parsed: unknown = JSON.parse(storedValue);
          if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
            const knownIds = new Set(lessons.map((lesson) => lesson.id));
            const validIds = [...new Set(parsed.filter((id: string) => knownIds.has(id)))];
            if (isMounted) setCompletedLessonIds(validIds);
          }
        }
      } catch (error) {
        console.warn("Could not load saved progress:", error);
      } finally {
        if (isMounted) setProgressLoaded(true);
      }
    }

    void loadProgress();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Do not overwrite persisted progress until the initial read has finished.
    if (!progressLoaded) return;
    AsyncStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(completedLessonIds)
    ).catch((error) => console.warn("Could not save progress:", error));
  }, [completedLessonIds, progressLoaded]);

  function resetAttempt() {
    setCheckpointAnswers({});
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  }

  function markActiveLessonComplete() {
    setCompletedLessonIds((currentIds) =>
      currentIds.includes(activeLessonId)
        ? currentIds
        : [...currentIds, activeLessonId]
    );
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

    resetAttempt();
    setActiveLessonId(lesson.id);
    setActiveCategoryId(lesson.categoryId);
    setActiveSubcategoryId(lesson.subcategoryId);
    setScreen("lesson");
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

    markActiveLessonComplete();
  }

  function answerCheckpoint(questionIndex: number, answerIndex: number, correctIndex: number) {
    if (checkpointAnswers[questionIndex] !== undefined) return;

    setCheckpointAnswers((currentAnswers) => {
      if (currentAnswers[questionIndex] !== undefined) return currentAnswers;
      return { ...currentAnswers, [questionIndex]: answerIndex };
    });

    if (answerIndex === correctIndex) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function finishInlineLesson() {
    const requiredAnswers = countInlineQuestions(activeLessonId);
    const answeredCount = Object.keys(checkpointAnswers).filter(
      (key) => Number(key) < requiredAnswers
    ).length;

    if (requiredAnswers === 0 || answeredCount < requiredAnswers) return;
    markActiveLessonComplete();
  }

  function restartLesson() {
    resetAttempt();
    setScreen("lesson");
  }

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
