import { useState } from "react";
import { lessons } from "../data/lessons";

export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results";

export function useLearningApp() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeCategoryId, setActiveCategoryId] = useState("history");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("ancient-greece");
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? "");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

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
