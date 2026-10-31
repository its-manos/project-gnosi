import ProfileScreen from "../screens/ProfileScreen";
import PlayerStatsScreen from "../screens/PlayerStatsScreen";
import KnowledgeReviewScreen from "../screens/KnowledgeReviewScreen";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import type { AnalyticsScreen } from "../utils/betaAnalytics";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { parseLearningBackup } from "../utils/learningBackup";
import { getHomeDiscovery } from "../utils/readingDiscovery";
import { getLessonAccess, getNextPathLesson, getSubcategoryPath } from "../utils/lessonPath";
import { welcomeLessonCandidates } from "../utils/welcomeLesson";
import { useAthensDate } from "../hooks/useAthensDate";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

import { categories, lessons, subcategories } from "../data/lessons";
import { useLearningApp, type AppScreen } from "../hooks/useLearningApp";
import { useSavedLessons } from "../hooks/useSavedLessons";
import { useDailyChallengePreferences } from "../hooks/useDailyChallengePreferences";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import BottomNavigation from "../components/BottomNavigation";
import WelcomeScreen from "../screens/WelcomeScreen";
import { useWelcome } from "../hooks/useWelcome";
import { useDailySnapshot, useLearningSession } from "../state/LearningSession";
import { finishWelcome, type WelcomeDestination } from "../utils/firstRun";
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import SubcategoryScreen from "../screens/SubcategoryScreen";
import LessonScreen from "../screens/LessonScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultsScreen from "../screens/ResultsScreen";
import ReviewMistakesScreen from "../screens/ReviewMistakesScreen";
import WeeklyReviewScreen from "../screens/WeeklyReviewScreen";
import AccountScreen from "../screens/AccountScreen";
import SavedLessonsScreen from "../screens/SavedLessonsScreen";
import SearchScreen from "../screens/SearchScreen";
import DailyChallengeScreen from "../screens/DailyChallengeScreen";
import DailyChallengePreferencesScreen from "../screens/DailyChallengePreferencesScreen";
import SyncStatus from "../components/SyncStatus";
import ProgressScreen from "../screens/ProgressScreen";

export default function AppNavigator() {
  const app = useLearningApp();
  const { analytics, enabled: usageEnabled } = useBetaAnalytics();
  const discoveryDate = useAthensDate();
  const bookmarks = useSavedLessons();
  const dailyPreferences = useDailyChallengePreferences();
  const { dailyStore } = useLearningSession();
  const daily = useDailySnapshot();
  const hasActivity = app.completedLessonIds.length > 0 || app.inProgressLessonCount > 0 || bookmarks.savedLessonIds.length > 0 || daily.doc.preferences !== null || Object.keys(daily.doc.days).length > 0;
  const welcome = useWelcome(daily.userId, hasActivity);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isDailyPreferencesOpen, setIsDailyPreferencesOpen] = useState(false);
  const [preferencesOrigin, setPreferencesOrigin] = useState<"home" | "daily" | "profile">("home");
  const [knowledgeOrigin, setKnowledgeOrigin] = useState<"home" | "progress">("progress");
  const openKnowledgeReview = (origin: "home" | "progress") => { setKnowledgeOrigin(origin); app.setScreen("knowledge-review"); };
  const [progressView, setProgressView] = useState<"knowledge" | "reading">("knowledge");
  const [profileOrigin, setProfileOrigin] = useState<"home" | "progress">("home");
  const openProfile = (origin: "home" | "progress") => { setProfileOrigin(origin); app.setScreen("profile"); };
  const [accountOrigin, setAccountOrigin] = useState<"home" | "progress" | "profile">("home");
  const openAccount = (origin: "home" | "progress" | "profile") => { setAccountOrigin(origin); app.setScreen("account"); };

  const openDailyPreferences = useCallback((origin: "home" | "daily" | "profile") => {
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

  async function completeWelcome(preferences: DailyChallengePreferences, destination: WelcomeDestination, lessonId?: string) {
    const selectedLesson = destination === "lesson" ? lessons.find(l => l.id === lessonId) : null;
    if (destination === "lesson" && (!selectedLesson || !getLessonAccess(selectedLesson, lessons, app.completedLessonIds, app.inProgressLessonIds).unlocked)) return false;
    const completed = await finishWelcome(dailyStore, preferences, destination, welcome.isCurrent, welcome.complete);
    if (!completed || !welcome.isCurrent()) return false;
    void analytics.track("onboarding_completed", { screen: "welcome", onboarding_step: 4, replay: welcome.replay });
    setIsDailyPreferencesOpen(false); setIsDailyChallengeOpen(destination === "daily");
    if (selectedLesson) app.openLesson(selectedLesson.id);
    else app.setScreen("home");
    return true;
  }
  async function skipWelcome(step = 1) {
    if (await welcome.skip()) {
      void analytics.track("onboarding_skipped", { screen: "welcome", onboarding_step: step, replay: welcome.replay });
      app.setScreen("home"); setIsDailyPreferencesOpen(false); setIsDailyChallengeOpen(false);
    }
  }

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
    () => getSubcategoryPath(lessons, app.activeSubcategoryId),
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
  const nextLesson = activeLesson ? getNextPathLesson(activeLesson, lessons, app.completedLessonIds, app.inProgressLessonIds) : null;

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

  // Use the same leave guard as the on-screen controls for Android system Back.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (welcome.visible || welcome.loading) return false;
      if (isDailyPreferencesOpen) { closeDailyPreferences(); return true; }
      if (isDailyChallengeOpen) { setIsDailyChallengeOpen(false); return true; }
      if (app.screen === "home") return false;
      if (app.screen === "review") { app.endMistakeReview(); return true; }
      const destination: AppScreen = app.screen === "account" ? accountOrigin
        : app.screen === "profile" ? profileOrigin
        : app.screen === "player-stats" ? "profile"
        : app.screen === "knowledge-review" ? knowledgeOrigin
        : app.screen === "weekly-review" ? "progress"
        : app.screen === "lesson" || app.screen === "results" ? app.lessonBackScreen
        : app.screen === "quiz" ? "lesson"
        : app.screen === "subcategory" ? "category" : "home";
      navigateTo(destination);
      return true;
    });
    return () => subscription.remove();
  });

  const analyticsScreen: AnalyticsScreen = welcome.visible ? "welcome"
    : isDailyPreferencesOpen ? "daily-preferences" : isDailyChallengeOpen ? "daily" : app.screen === "knowledge-review" ? "review" : app.screen === "profile" ? "account" : app.screen === "player-stats" ? "progress" : app.screen;
  const answeredForAnalytics = Object.keys(app.checkpointAnswers).length;
  const analyticsLessonId = activeLesson?.id;
  useEffect(() => {
    if (!welcome.loading && usageEnabled) void analytics.view(analyticsScreen);
  }, [analytics, usageEnabled, welcome.loading, analyticsScreen]);
  useEffect(() => {
    if (!usageEnabled || welcome.loading) return;
    if ((analyticsScreen === "lesson" || analyticsScreen === "quiz") && activeLesson) {
      void analytics.lesson({ screen: analyticsScreen, lesson_id: activeLesson.id, category_id: activeLesson.categoryId,
        subcategory_id: activeLesson.subcategoryId, answered_count: answeredForAnalytics, total_questions: getInlineQuestionCount(activeLesson) });
    } else if (analyticsScreen === "results" && app.resultMode === "finished") {
      void analytics.completeLesson();
    } else void analytics.lesson(null);
    // Counts are updated separately, so checkpoints do not create new visits.
  }, [analytics, usageEnabled, welcome.loading, analyticsScreen, analyticsLessonId]);
  useEffect(() => {
    if (usageEnabled && (analyticsScreen === "lesson" || analyticsScreen === "quiz")) {
      void analytics.progress({ answered_count: answeredForAnalytics });
    }
  }, [analytics, usageEnabled, analyticsScreen, answeredForAnalytics]);
  useEffect(() => () => { void analytics.lesson(null, "account_change"); }, [analytics]);

  if (welcome.loading) return <SafeAreaView style={styles.welcomeLoading}><ActivityIndicator color="#B1A5FF" /><Text style={styles.welcomeLoadingText}>Φόρτωση…</Text></SafeAreaView>;

  let screenContent: ReactNode = null;

  if (!activeCategory || !activeSubcategory || !activeLesson) {
    return null;
  }

  if (welcome.visible) {
    screenContent = <WelcomeScreen initialPreferences={dailyPreferences.preferences} replay={welcome.replay}
      lessonCandidates={welcomeLessonCandidates(lessons, app.completedLessonIds, app.inProgressLessonIds)}
      hasStartedChallenge={Boolean(daily.doc.days[discoveryDate]?.record.started)} onFinish={completeWelcome} onSkip={skipWelcome} />;
  } else if (isDailyPreferencesOpen) {
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
        completedLessonIds={app.completedLessonIds} inProgressLessonIds={app.inProgressLessonIds}
        onOpenLesson={id => { setIsDailyChallengeOpen(false); app.openLesson(id); }}
        onWeeklyReview={() => { setIsDailyChallengeOpen(false); openKnowledgeReview("home"); }}
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
          onKnowledgeReview={() => openKnowledgeReview("home")}
          onOpenProfile={() => openProfile("home")}
          onWeeklyReview={() => app.setScreen("weekly-review")}
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

    case "profile":
      screenContent = <ProfileScreen onBack={() => app.setScreen(profileOrigin)} onStats={() => app.setScreen("player-stats")}
        onAccount={() => openAccount("profile")} onInterests={() => openDailyPreferences("profile")} onGuide={welcome.open} />;
      break;
    case "player-stats":
      screenContent = <PlayerStatsScreen onBack={() => app.setScreen("profile")} completedLessons={completedLessons} totalLessonCount={lessons.length} lessonProgressLoaded={app.progressLoaded} />;
      break;
    case "account":
      screenContent = <AccountScreen onBack={() => app.setScreen(accountOrigin)}
        devControls={{ canResetLessonProgress: app.canResetLessonProgress, lessonProgressLoaded: app.progressLoaded, onResetLessonProgressForDevelopment: app.resetLessonProgressForDevelopment }}
        backupControls={app.progressLoaded && bookmarks.isSavedLessonsLoaded ? {
          deviceBackup: parseLearningBackup({ schemaVersion: 1, completedIds: app.completedLessonIds, savedIds: bookmarks.savedLessonIds, attempts: app.lessonAttempts }),
          onRestoreBackup: async backup => { await Promise.all([app.mergeRestoredProgress(backup), bookmarks.mergeRestoredBookmarks(backup.savedIds)]); },
        } : undefined} />;
      break;

    case "progress":
      screenContent = (
        <ProgressScreen
          initialView={progressView} onViewChange={setProgressView}
          onKnowledgeReview={() => openKnowledgeReview("progress")}
          onOpenProfile={() => openProfile("progress")}
          onWeeklyReview={() => app.setScreen("weekly-review")}
          onHome={() => navigateTo("home")}
          completedLessons={completedLessons}
          inProgressLesson={inProgressLesson}
          inProgressAnsweredCount={app.inProgressAnsweredCount}
          inProgressQuestionCount={app.inProgressQuestionCount}
          inProgressLessonCount={app.inProgressLessonCount}
          totalLessonCount={lessons.length}
          lessonProgressLoaded={app.progressLoaded}
          onOpenLesson={app.openLesson}
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
          catalogue={lessons}
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
          onBack={() => navigateTo(app.lessonBackScreen)}
        />
      );
      break;

    case "quiz":
      screenContent = (
        <QuizScreen
          combo={app.combo}
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

    case "knowledge-review":
      screenContent = <KnowledgeReviewScreen key={daily.userId ?? "guest"} onBack={() => app.setScreen(knowledgeOrigin)} />;
      break;

    case "weekly-review":
      screenContent = <WeeklyReviewScreen key={daily.userId ?? "guest"} onBack={() => app.setScreen("progress")} />;
      break;

    case "review":
      screenContent = <ReviewMistakesScreen lesson={activeLesson} indices={app.reviewIndices} index={app.reviewIndex} selected={app.reviewAnswer}
        onChoose={app.answerReview} onNext={app.nextReviewQuestion} onRetry={app.retryReviewQuestion} onBack={app.endMistakeReview} />;
      break;

    case "results":
      screenContent = (
        <ResultsScreen
          earnedXP={app.earnedXP} highestCombo={app.highestCombo}
          key={activeLesson.id}
          lessonScores={app.lessonScores}
          onWeeklyReview={() => app.setScreen("weekly-review")}
          lesson={activeLesson}
          score={app.score}
          review={app.review}
          returning={app.resultMode === "returning"}
          practiceComplete={app.practiceComplete}
          onReviewMistakes={app.startMistakeReview}
          onHome={() => navigateTo("home")}
          onReadAgain={app.restartLesson}
          nextLesson={nextLesson}
          pathProgress={{ title: activeSubcategory.title, total: subcategoryLessons.length, completed: subcategoryLessons.filter(l => app.completedLessonIds.includes(l.id)).length }}
          onOpenLesson={app.openLesson}
          onBrowse={() => navigateTo("category")}
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
        {!welcome.visible && app.screen === "home" && !isDailyChallengeOpen && !isDailyPreferencesOpen ? <SyncStatus quiet /> : null}
        {screenContent}
      </SafeAreaView>
      {!welcome.visible ? <BottomNavigation
        currentScreen={isDailyChallengeOpen ? "home" : app.screen === "profile" ? profileOrigin : app.screen === "player-stats" ? profileOrigin : app.screen === "account" ? accountOrigin === "profile" ? profileOrigin : accountOrigin : app.screen === "knowledge-review" ? knowledgeOrigin : app.screen}
        onNavigate={(destination) => {
          setIsDailyPreferencesOpen(false);
          setIsDailyChallengeOpen(false);
          navigateTo(destination);
        }}
      /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeLoading: { flex: 1, backgroundColor: "#0B0D15", alignItems: "center", justifyContent: "center", gap: 14 },
  welcomeLoadingText: { color: "#ABB0C1", fontSize: 14 },
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
