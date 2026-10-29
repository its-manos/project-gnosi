import { categories, lessons, subcategories } from "../data/lessons";
import { useLearningApp } from "../hooks/useLearningApp";
import { useSavedLessons } from "../hooks/useSavedLessons";
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import SubcategoryScreen from "../screens/SubcategoryScreen";
import LessonScreen from "../screens/LessonScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultsScreen from "../screens/ResultsScreen";
import SavedLessonsScreen from "../screens/SavedLessonsScreen";
import SearchScreen from "../screens/SearchScreen";

export default function AppNavigator() {
  const app = useLearningApp();
  const bookmarks = useSavedLessons();

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
  const savedLessons = lessons.filter((lesson) =>
    bookmarks.savedLessonIds.includes(lesson.id)
  );

  // The MVP starts with bundled local content. Keep the guard to avoid
  // rendering a blank detail screen if content IDs are accidentally removed.
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
          savedCount={bookmarks.savedLessonIds.length}
          onOpenCategory={app.openCategory}
          onOpenLesson={app.openLesson}
          onOpenSaved={() => app.setScreen("saved")}
          onOpenSearch={() => app.setScreen("search")}
        />
      );

        case "search":
      return (
        <SearchScreen
          lessons={lessons}
          categories={categories}
          subcategories={subcategories}
          onBack={() => app.setScreen("home")}
          onOpenLesson={app.openLesson}
        />
      );

    case "saved":
      return (
        <SavedLessonsScreen
          lessons={savedLessons}
          onBack={() => app.setScreen("home")}
          onOpenLesson={app.openLesson}
          onRemoveSavedLesson={bookmarks.toggleSavedLesson}
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
          isSaved={bookmarks.savedLessonIds.includes(activeLesson.id)}
          bookmarksLoaded={bookmarks.isSavedLessonsLoaded}
          onToggleSaved={bookmarks.toggleSavedLesson}
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
