import { parseLearningBackup } from "../utils/learningBackup";
import { getHomeDiscovery, getRelatedLessons } from "../utils/readingDiscovery";
import { useAthensDate } from "../hooks/useAthensDate";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

import { categories, lessons, subcategories } from "../data/lessons";
import { useLearningApp, type AppScreen } from "../hooks/useLearningApp";
import { useSavedLessons } from "../hooks/useSavedLessons";
import { useDailyChallengePreferences } from "../hooks/useDailyChallengePreferences";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import BottomNavigation from "../components/BottomNavigation";
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import SubcategoryScreen from "../screens/SubcategoryScreen";
import LessonScreen from "../screens/LessonScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultsScreen from "../screens/ResultsScreen";
import SavedLessonsScreen from "../screens/SavedLessonsScreen";
import SearchScreen from "../screens/SearchScreen";
import DailyChallengeScreen from "../screens/DailyChallengeScreen";
import DailyChallengePreferencesScreen from "../screens/DailyChallengePreferencesScreen";
import SyncStatus from "../components/SyncStatus";
import ProgressScreen from "../screens/ProgressScreen";

export default function AppNavigator() {
  const app = useLearningApp();
  const discoveryDate = useAthensDate();
  const bookmarks = useSavedLessons();
  const dailyPreferences = useDailyChallengePreferences();
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isDailyPreferencesOpen, setIsDailyPreferencesOpen] = useState(false);
  const [preferencesOrigin, setPreferencesOrigin] = useState<"home" | "daily">("home");

  const openDailyPreferences = useCallback((origin: "home" | "daily") => {
    setPreferencesOrigin(origin);
    setIsDailyPreferencesOpen(true);
  }, []);

  const closeDailyPreferences = useCallback(() => {
    setIsDailyPreferencesOpen(false);
    if (preferencesOrigin === "home") setIsDailyChallengeOpen(false);
  }, [preferencesOrigin]);

  const savePreferences = dailyPreferences.savePreferences;
  const saveDailyPreferences = useCallback(async (preferences: DailyChallengePreferences) => {
    const saved = await savePreferences(preferences);
    if (saved) setIsDailyPreferencesOpen(false);
    return saved;
  }, [savePreferences]);

  const activeCategory =
    categories.find((item) => item.id === app.activeCategoryId) ?? categories[0];
  const activeSubcategory =
    subcategories.find((item) => item.id === app.activeSubcategoryId) ?? subcategories[0];
  const activeLesson =
    lessons.find((item) => item.id === app.activeLessonId) ?? lessons[0];

  const categorySubcategories = useMemo(
    () => subcategories.filter((item) => item.categoryId === app.activeCategoryId),
    [app.activeCategoryId]
  );
  const subcategoryLessons = useMemo(
    () => lessons.filter((item) => item.subcategoryId === app.activeSubcategoryId),
    [app.activeSubcategoryId]
  );
  const savedLessons = useMemo(
    () => lessons.filter((lesson) => bookmarks.savedLessonIds.includes(lesson.id)),
    [bookmarks.savedLessonIds]
  );
  const completedLessons = useMemo(
    () => lessons.filter((lesson) => app.completedLessonIds.includes(lesson.id)),
    [app.completedLessonIds]
  );
  const inProgressLesson = lessons.find(
    (lesson) => lesson.id === app.inProgressLessonId
  ) ?? null;

  const discovery = getHomeDiscovery(lessons, app.completedLessonIds, app.inProgressLessonIds, discoveryDate);
  const related = activeLesson ? getRelatedLessons(activeLesson, lessons, app.completedLessonIds, app.inProgressLessonIds, discoveryDate) : [];

  const currentScreen = app.screen;
  const setAppScreen = app.setScreen;
  const activeLessonTitle = activeLesson?.title ?? "μαθήματος";

  const navigateTo = (destination: AppScreen) => {
    if (destination === currentScreen) return;

    // Returning from the legacy standalone quiz to its article is an internal
    // step; keep the current attempt instead of warning or resetting it.
    if (currentScreen === "quiz" && destination === "lesson") {
      setAppScreen(destination);
      return;
    }

    const isInUnfinishedLearningFlow =
      currentScreen === "lesson" || currentScreen === "quiz";
    const isLeavingLearningFlow =
      destination !== "lesson" && destination !== "quiz";

    if (isInUnfinishedLearningFlow && isLeavingLearningFlow) {
      const message = currentScreen === "lesson"
        ? `Βρίσκεσαι στη μέση του «${activeLessonTitle}». Οι απαντήσεις που έχεις ήδη δώσει αποθηκεύονται στη συσκευή σου. Μπορείς να επιστρέψεις από την αρχική με την επιλογή «Συνέχισε από εκεί που έμεινες».`
        : `Βρίσκεσαι στη μέση του quiz «${activeLessonTitle}». Η τρέχουσα προσπάθεια του ξεχωριστού quiz δεν αποθηκεύεται ακόμη. Αν φύγεις, θα χρειαστεί να το ξεκινήσεις ξανά.`;

      Alert.alert(
        "Το μάθημα δεν έχει ολοκληρωθεί",
        message,
        [
          {
            text: "Συνέχεια μαθήματος",
            style: "cancel",
          },
          {
            text: "Έξοδος από το μάθημα",
            style: "destructive",
            onPress: () => setAppScreen(destination),
          },
        ]
      );
      return;
    }

    setAppScreen(destination);
  };

  let screenContent: ReactNode = null;

  if (!activeCategory || !activeSubcategory || !activeLesson) {
    return null;
  }

  if (isDailyPreferencesOpen) {
    screenContent = (
      <DailyChallengePreferencesScreen
        initialPreferences={dailyPreferences.preferences}
        isLoading={dailyPreferences.isLoading}
        onSave={saveDailyPreferences}
        onCancel={closeDailyPreferences}
      />
    );
  } else if (isDailyChallengeOpen) {
    screenContent = (
      <DailyChallengeScreen
        onHome={() => setIsDailyChallengeOpen(false)}
        onOpenPreferences={() => openDailyPreferences("daily")}
        preferences={dailyPreferences.preferences}
        preferencesLoaded={!dailyPreferences.isLoading}
      />
    );
  } else switch (app.screen) {
    case "home":
      screenContent = (
        <HomeScreen
          categories={categories}
          subcategories={subcategories}
          featuredLesson={discovery.featured}
          suggestedLessons={discovery.suggestions}
          progressLoaded={app.progressLoaded}
          completedCount={app.completedLessonIds.length}
          savedCount={bookmarks.savedLessonIds.length}
          inProgressLesson={inProgressLesson}
          inProgressAnsweredCount={app.inProgressAnsweredCount}
          inProgressQuestionCount={app.inProgressQuestionCount}
          onResumeLesson={app.openLesson}
          onOpenCategory={app.openCategory}
          onOpenLesson={app.openLesson}
          onOpenSaved={() => app.setScreen("saved")}
          onOpenSearch={() => app.setScreen("search")}
          onStartDailyChallenge={() => setIsDailyChallengeOpen(true)}
          onOpenDailyPreferences={() => openDailyPreferences("home")}
        />
      );
      break;

    case "progress":
      screenContent = (
        <ProgressScreen
          backupControls={app.progressLoaded && bookmarks.isSavedLessonsLoaded ? {
            deviceBackup: parseLearningBackup({ schemaVersion: 1, completedIds: app.completedLessonIds, savedIds: bookmarks.savedLessonIds, attempts: app.lessonAttempts }),
            onRestoreBackup: async backup => {
              await Promise.all([
                app.mergeRestoredProgress(backup),
                bookmarks.mergeRestoredBookmarks(backup.savedIds),
              ]);
            },
          } : undefined}
          onHome={() => navigateTo("home")}
          completedLessons={completedLessons}
          inProgressLesson={inProgressLesson}
          inProgressAnsweredCount={app.inProgressAnsweredCount}
          inProgressQuestionCount={app.inProgressQuestionCount}
          inProgressLessonCount={app.inProgressLessonCount}
          totalLessonCount={lessons.length}
          lessonProgressLoaded={app.progressLoaded}
          canResetLessonProgress={app.canResetLessonProgress}
          onOpenLesson={app.openLesson}
          onResetLessonProgressForDevelopment={app.resetLessonProgressForDevelopment}
        />
      );
      break;

    case "search":
      screenContent = (
        <SearchScreen
          completedLessonIds={app.completedLessonIds}
          inProgressLessonIds={app.inProgressLessonIds}
          progressLoaded={app.progressLoaded}
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
          completedLessonIds={app.completedLessonIds}
          inProgressLessonIds={app.inProgressLessonIds}
          progressLoaded={app.progressLoaded}
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
          completedLessonIds={app.completedLessonIds}
          inProgressLessonIds={app.inProgressLessonIds}
          progressLoaded={app.progressLoaded}
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
          recommendations={related}
          onOpenLesson={app.openLesson}
          onBrowse={() => navigateTo("search")}
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
        {app.screen === "home" && !isDailyChallengeOpen && !isDailyPreferencesOpen ? <SyncStatus /> : null}
        {screenContent}
      </SafeAreaView>
      <BottomNavigation
        currentScreen={isDailyChallengeOpen ? "home" : app.screen}
        onNavigate={(destination) => {
          setIsDailyPreferencesOpen(false);
          setIsDailyChallengeOpen(false);
          navigateTo(destination);
        }}
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
