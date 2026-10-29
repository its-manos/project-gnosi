import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

import { categories, lessons, subcategories } from "../data/lessons";
import { useLearningApp, type AppScreen } from "../hooks/useLearningApp";
import { useSavedLessons } from "../hooks/useSavedLessons";
import BottomNavigation from "../components/BottomNavigation";
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

  const navigateTo = useCallback((destination: AppScreen) => {
    if (destination === app.screen) return;

    // Returning from the legacy standalone quiz to its article is an internal
    // step; keep the current attempt instead of warning or resetting it.
    if (app.screen === "quiz" && destination === "lesson") {
      app.setScreen(destination);
      return;
    }

    const isInUnfinishedLearningFlow =
      app.screen === "lesson" || app.screen === "quiz";
    const isLeavingLearningFlow =
      destination !== "lesson" && destination !== "quiz";

    if (isInUnfinishedLearningFlow && isLeavingLearningFlow) {
      Alert.alert(
        "Το μάθημα δεν έχει ολοκληρωθεί",
        `Βρίσκεσαι στη μέση του «${activeLesson?.title ?? "μαθήματος"}». Αν φύγεις τώρα, οι απαντήσεις αυτής της προσπάθειας δεν αποθηκεύονται και θα χρειαστεί να ξεκινήσεις ξανά αν ανοίξεις το μάθημα αργότερα.`,
        [
          {
            text: "Συνέχεια μαθήματος",
            style: "cancel",
          },
          {
            text: "Έξοδος από το μάθημα",
            style: "destructive",
            onPress: () => app.setScreen(destination),
          },
        ]
      );
      return;
    }

    app.setScreen(destination);
  }, [app, activeLesson?.title]);

  let screenContent: ReactNode = null;

  if (!activeCategory || !activeSubcategory || !activeLesson) {
    return null;
  }

  switch (app.screen) {
    case "home":
      screenContent = (
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
      break;

    case "search":
      screenContent = (
        <SearchScreen
          lessons={lessons}
          categories={categories}
          subcategories={subcategories}
          onBack={() => navigateTo("home")}
          onOpenLesson={app.openLesson}
        />
      );
      break;

    case "saved":
      screenContent = (
        <SavedLessonsScreen
          lessons={savedLessons}
          onBack={() => navigateTo("home")}
          onOpenLesson={app.openLesson}
          onRemoveSavedLesson={bookmarks.toggleSavedLesson}
        />
      );
      break;

    case "category":
      screenContent = (
        <CategoryScreen
          category={activeCategory}
          subcategories={categorySubcategories}
          lessons={lessons}
          onBack={() => navigateTo("home")}
          onOpenSubcategory={app.openSubcategory}
        />
      );
      break;

    case "subcategory":
      screenContent = (
        <SubcategoryScreen
          category={activeCategory}
          subcategory={activeSubcategory}
          lessons={subcategoryLessons}
          onBack={() => navigateTo("category")}
          onOpenLesson={app.openLesson}
        />
      );
      break;

    case "lesson":
      screenContent = (
        <LessonScreen
          category={activeCategory}
          subcategory={activeSubcategory}
          lesson={activeLesson}
          isSaved={bookmarks.savedLessonIds.includes(activeLesson.id)}
          bookmarksLoaded={bookmarks.isSavedLessonsLoaded}
          onToggleSaved={bookmarks.toggleSavedLesson}
          checkpointAnswers={app.checkpointAnswers}
          onAnswerCheckpoint={app.answerCheckpoint}
          onFinishLesson={app.finishInlineLesson}
          onBack={() => navigateTo("subcategory")}
        />
      );
      break;

    case "quiz":
      screenContent = (
        <QuizScreen
          lesson={activeLesson}
          questionIndex={app.questionIndex}
          selectedAnswer={app.selectedAnswer}
          score={app.score}
          onBack={() => navigateTo("lesson")}
          onChooseAnswer={app.chooseAnswer}
          onNextQuestion={app.nextQuestion}
        />
      );
      break;

    case "results":
      screenContent = (
        <ResultsScreen
          lesson={activeLesson}
          score={app.score}
          onHome={() => navigateTo("home")}
          onReadAgain={app.restartLesson}
        />
      );
      break;

    default:
      screenContent = null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView
        style={styles.screenViewport}
        edges={["top", "left", "right"]}
      >
        {screenContent}
      </SafeAreaView>
      <BottomNavigation
        currentScreen={app.screen}
        onNavigate={(destination) => navigateTo(destination)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0D15",
  },
  screenViewport: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#0B0D15",
  },
});
