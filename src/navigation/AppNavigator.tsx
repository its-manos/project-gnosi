import { categories, lessons, subcategories } from "../data/lessons";
import { useLearningApp } from "../hooks/useLearningApp";
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import SubcategoryScreen from "../screens/SubcategoryScreen";
import LessonScreen from "../screens/LessonScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultsScreen from "../screens/ResultsScreen";

export default function AppNavigator() {
  const app = useLearningApp();

  const activeCategory =
    categories.find((item) => item.id === app.activeCategoryId) ?? categories[0];
  const activeSubcategory =
    subcategories.find((item) => item.id === app.activeSubcategoryId) ?? subcategories[0];
  const activeLesson =
    lessons.find((item) => item.id === app.activeLessonId) ?? lessons[0];

  const categorySubcategories = subcategories.filter(
    (item) => item.categoryId === app.activeCategoryId
  );
  const subcategoryLessons = lessons.filter(
    (item) => item.subcategoryId === app.activeSubcategoryId
  );

  // The MVP starts with bundled local content, so these arrays should not be empty.
  // Keep this guard in place to avoid a blank screen if lesson data is removed accidentally.
  if (!activeCategory || !activeSubcategory || !activeLesson) {
    return null;
  }

  switch (app.screen) {
    case "home":
      return (
        <HomeScreen
          categories={categories}
          subcategories={subcategories}
          featuredLesson={lessons.find((item) => item.id === "ancient-athens") ?? activeLesson}
          completedCount={app.completedLessonIds.length}
          onOpenCategory={app.openCategory}
          onOpenLesson={app.openLesson}
        />
      );

    case "category":
      return (
        <CategoryScreen
          category={activeCategory}
          subcategories={categorySubcategories}
          lessons={lessons}
          onBack={() => app.setScreen("home")}
          onOpenSubcategory={app.openSubcategory}
        />
      );

    case "subcategory":
      return (
        <SubcategoryScreen
          category={activeCategory}
          subcategory={activeSubcategory}
          lessons={subcategoryLessons}
          onBack={() => app.setScreen("category")}
          onOpenLesson={app.openLesson}
        />
      );

    case "lesson":
      return (
        <LessonScreen
          category={activeCategory}
          subcategory={activeSubcategory}
          lesson={activeLesson}
          onBack={() => app.setScreen("subcategory")}
          onStartQuiz={app.startQuiz}
        />
      );

    case "quiz":
      return (
        <QuizScreen
          lesson={activeLesson}
          questionIndex={app.questionIndex}
          selectedAnswer={app.selectedAnswer}
          score={app.score}
          onBack={() => app.setScreen("lesson")}
          onChooseAnswer={app.chooseAnswer}
          onNextQuestion={app.nextQuestion}
        />
      );

    case "results":
      return (
        <ResultsScreen
          lesson={activeLesson}
          score={app.score}
          onHome={() => app.setScreen("home")}
          onReadAgain={() => app.setScreen("lesson")}
        />
      );
    default:
      return null;
  }
}
