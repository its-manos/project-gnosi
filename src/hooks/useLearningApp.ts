
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

export function useLearningApp() {
  const [screen, setScreen] = useState<AppScreen>("home");

  const [activeCategoryId, setActiveCategoryId] =
    useState("history");

  const [activeSubcategoryId, setActiveSubcategoryId] =
    useState("ancient-greece");

  const [activeLessonId, setActiveLessonId] =
    useState(lessons[0]?.id ?? "");

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [score, setScore] = useState(0);

  const [completedLessonIds, setCompletedLessonIds] =
    useState<string[]>([]);

  const [progressLoaded, setProgressLoaded] = useState(false);

  // Load saved progress once when the app starts.
  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const savedProgress = await AsyncStorage.getItem(
          PROGRESS_STORAGE_KEY
        );

        if (savedProgress !== null) {
          const parsed: unknown = JSON.parse(savedProgress);

          // Validate the stored data before using it.
          if (
            Array.isArray(parsed) &&
            parsed.every((id) => typeof id === "string")
          ) {
            const validLessonIds = new Set(
              lessons.map((lesson) => lesson.id)
            );

            const validCompletedIds = [
              ...new Set(
                parsed.filter((id: string) =>
                  validLessonIds.has(id)
                )
              ),
            ];

            if (isMounted) {
              setCompletedLessonIds(validCompletedIds);
            }
          }
        }
      } catch (error) {
        console.warn("Could not load saved progress:", error);
      } finally {
        if (isMounted) {
          setProgressLoaded(true);
        }
      }
    }

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save progress only after the initial load has finished.
  // This prevents the initial empty array from overwriting saved data.
  useEffect(() => {
    if (!progressLoaded) return;

    AsyncStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(completedLessonIds)
    ).catch((error) => {
      console.warn("Could not save progress:", error);
    });
  }, [completedLessonIds, progressLoaded]);

  function openCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setScreen("category");
  }

  function openSubcategory(
    subcategoryId: string,
    categoryId: string
  ) {
    setActiveSubcategoryId(subcategoryId);
    setActiveCategoryId(categoryId);
    setScreen("subcategory");
  }

  function openLesson(lessonId: string) {
    const lesson = lessons.find(
      (item) => item.id === lessonId
    );

    if (!lesson) return;

    setActiveLessonId(lesson.id);
    setActiveCategoryId(lesson.categoryId);
    setActiveSubcategoryId(lesson.subcategoryId);
    setScreen("lesson");
  }

  function startQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setScreen("quiz");
  }

  function chooseAnswer(
    answerIndex: number,
    correctIndex: number
  ) {
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

    setCompletedLessonIds((currentIds) =>
      currentIds.includes(activeLessonId)
        ? currentIds
        : [...currentIds, activeLessonId]
    );

    setScreen("results");
  }

  return {
    screen,
    setScreen,
    activeCategoryId,
    activeSubcategoryId,
    activeLessonId,
    questionIndex,
    selectedAnswer,
    score,
    completedLessonIds,
    openCategory,
    openSubcategory,
    openLesson,
    startQuiz,
    chooseAnswer,
    nextQuestion,
  };
}
