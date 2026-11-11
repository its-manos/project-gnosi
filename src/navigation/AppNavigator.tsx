import { requestPracticeCue } from "../play/soundStatus";
import LessonIntroductionModal from "../components/LessonIntroductionModal";
import ProfileScreen from "../screens/ProfileScreen";
import { backDestination, requiresLearningExitConfirmation } from "./navigationRules";
import PlayerStatsScreen from "../screens/PlayerStatsScreen";
import KnowledgeReviewScreen from "../screens/KnowledgeReviewScreen";
import { useNavigationAnalytics } from "./useNavigationAnalytics";
import { parseLearningBackup } from "../utils/learningBackup";
import { getHomeDiscovery } from "../utils/readingDiscovery";
import { getLessonAccess, getNextPathLesson, getSubcategoryPath } from "../utils/lessonPath";
import { devLessonsUnlocked, setDevLessonUnlockAll } from "../utils/devLessonAccess";
import { useAthensDate } from "../hooks/useAthensDate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ONBOARDING_INTRO_LESSON_ID, previousWelcomePhase, type WelcomePhase } from "../utils/firstRun";
import HangmanScreen from "../screens/HangmanScreen";
import QuickQuizScreen from "../screens/QuickQuizScreen";
import { useQuickQuiz } from "../hooks/useQuickQuiz";
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
import DailyChallengeScreen from "../screens/DailyChallengeScreen";
import DailyChallengePreferencesScreen from "../screens/DailyChallengePreferencesScreen";
import SyncStatus from "../components/SyncStatus";
import ProgressScreen from "../screens/ProgressScreen";
import LearningInsightsScreen, { type LearningInsightsView } from "../screens/LearningInsightsScreen";

export default function AppNavigator() {
  const app = useLearningApp();
  const [lessonPreview, setLessonPreview] = useState<{ id: string; welcomeCategoryId?: string; reread?: boolean } | null>(null);
  function previewLesson(id: string) {
    const lesson = lessons.find(item => item.id === id);
    if (!lesson) return;
    // Selection must not start a session or change the reader's saved position.
    if (app.progressLoaded && !getLessonAccess(lesson, lessons, app.completedLessonIds, app.inProgressLessonIds).unlocked) return;
    setLessonPreview({ id });
  }
  async function startPreviewLesson() {
    if (!lessonPreview || !app.progressLoaded) return false;
    if (lessonPreview.welcomeCategoryId && !await welcome.advance("lesson", lessonPreview.welcomeCategoryId)) return false;
    setIsDailyChallengeOpen(false);
    if (lessonPreview.reread) app.restartLesson();
    else app.openLesson(lessonPreview.id);
    requestPracticeCue("lesson-open");
    setLessonPreview(null);
    return true;
  }
  const preview = lessons.find(item => item.id === lessonPreview?.id);
  const [allLessonsUnlockedForTesting, setAllLessonsUnlockedForTesting] = useState(() => devLessonsUnlocked());
  function toggleAllLessonsForTesting() {
    if (!__DEV__) return;
    setDevLessonUnlockAll(!devLessonsUnlocked());
    setAllLessonsUnlockedForTesting(devLessonsUnlocked());
  }
  const discoveryDate = useAthensDate();
  const bookmarks = useSavedLessons();
  const dailyPreferences = useDailyChallengePreferences();
  const { dailyStore } = useLearningSession();
  const daily = useDailySnapshot();
  const quickQuiz = useQuickQuiz(daily.userId);
  const hasActivity = app.completedLessonIds.length > 0 || app.inProgressLessonCount > 0 || bookmarks.savedLessonIds.length > 0 || daily.doc.preferences !== null || Object.keys(daily.doc.days).length > 0;
  const welcome = useWelcome(daily.userId, hasActivity);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isDevQuizPreviewOpen, setIsDevQuizPreviewOpen] = useState(false);
  const [isDevDailyIntroPreviewOpen, setIsDevDailyIntroPreviewOpen] = useState(false);
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
  // Catalogue order is stable; Set membership avoids scanning saved/completed
  // ID arrays once for every lesson whenever these lists change.
  const savedLessons = useMemo(() => {
    const savedIds = new Set(bookmarks.savedLessonIds);
    return lessons.filter(lesson => savedIds.has(lesson.id));
  }, [bookmarks.savedLessonIds]);
  const completedIds = useMemo(() => new Set(app.completedLessonIds), [app.completedLessonIds]);
  const completedLessons = useMemo(
    () => lessons.filter(lesson => completedIds.has(lesson.id)),
    [completedIds],
  );
  const completedSubcategoryCount = useMemo(
    () => subcategoryLessons.reduce((count, lesson) => count + Number(completedIds.has(lesson.id)), 0),
    [subcategoryLessons, completedIds],
  );
  const inProgressLesson = lessons.find(
    (lesson) => lesson.id === app.inProgressLessonId
  ) ?? null;

  const latestAttemptAt = app.inProgressLessonId
    ? app.lessonAttempts[app.inProgressLessonId]?.updatedAt ?? 0
    : 0;
  const homePathLesson = useMemo(() => {
    // An unfinished lesson stays first if it was worked on after the last completion.
    let latestCompletion;
    for (const event of Object.values(app.completionEvents)) {
      if (event.at >= latestAttemptAt && completedIds.has(event.lessonId) &&
        (!latestCompletion || event.at > latestCompletion.at)) {
        latestCompletion = event;
      }
    }
    const finishedLesson = latestCompletion && lessons.find(lesson => lesson.id === latestCompletion.lessonId);
    return finishedLesson ? getNextPathLesson(finishedLesson, lessons, app.completedLessonIds, app.inProgressLessonIds) : null;
  }, [app.completionEvents, completedIds, latestAttemptAt, app.completedLessonIds, app.inProgressLessonIds, allLessonsUnlockedForTesting]);
  const featuredLesson = useMemo(
    () => homePathLesson ?? getHomeDiscovery(lessons, app.completedLessonIds, app.inProgressLessonIds, discoveryDate).featured,
    [homePathLesson, app.completedLessonIds, app.inProgressLessonIds, discoveryDate],
  );
  const nextLesson = useMemo(
    () => activeLesson ? getNextPathLesson(activeLesson, lessons, app.completedLessonIds, app.inProgressLessonIds) : null,
    [activeLesson, app.completedLessonIds, app.inProgressLessonIds],
  );

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

    if (requiresLearningExitConfirmation(currentScreen, destination)) {
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

  // Keep the native listener stable across progress, animation and state renders.
  // Read the latest navigation state at press time to avoid stale closures.
  const hardwareBackRef = useRef<() => boolean>(() => false);
  hardwareBackRef.current = () => {
    if (welcome.loading) return false;
    if (welcome.visible) {
      const previous = previousWelcomePhase(welcome.phase);
      if (!previous) return false;
      void welcome.advance(previous);
      return true;
    }
    if (isDevDailyIntroPreviewOpen) { setIsDevDailyIntroPreviewOpen(false); return true; }
    if (isDevQuizPreviewOpen) { setIsDevQuizPreviewOpen(false); return true; }
    if (isDailyPreferencesOpen) { closeDailyPreferences(); return true; }
    if (isDailyChallengeOpen) { setIsDailyChallengeOpen(false); return true; }
    if (app.screen === "home") return false;
    if (app.screen === "review") { app.endMistakeReview(); return true; }
    const destination = backDestination(app.screen, {
      account: accountOrigin,
      profile: profileOrigin,
      knowledge: knowledgeOrigin,
      lesson: app.lessonBackScreen,
    });
    navigateTo(destination);
    return true;
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress", () => hardwareBackRef.current(),
    );
    return () => subscription.remove();
  }, []);

  const { trackWelcomeCompleted, trackWelcomeSkipped } = useNavigationAnalytics({
    screen: app.screen,
    lesson: activeLesson,
    resultMode: app.resultMode,
    answeredCount: Object.keys(app.checkpointAnswers).length,
    welcome,
    dailyChallengeOpen: isDailyChallengeOpen,
    dailyPreferencesOpen: isDailyPreferencesOpen,
  });

  // The onboarding lesson is an ordinary, persisted lesson attempt. Restore the
  // route after process death rather than replacing its reader with a demo.
  useEffect(() => {
    if (welcome.loading || !welcome.visible || welcome.phase !== "lesson") return;
    if (app.activeLessonId === ONBOARDING_INTRO_LESSON_ID &&
      (app.screen === "lesson" || app.screen === "results")) return;
    app.openLesson(ONBOARDING_INTRO_LESSON_ID);
  }, [welcome.loading, welcome.visible, welcome.phase, app.screen, app.activeLessonId]);

  const completingWelcome = useRef(false);
  useEffect(() => {
    if (!welcome.visible || welcome.phase !== "lesson" ||
      app.screen !== "results" || app.activeLessonId !== ONBOARDING_INTRO_LESSON_ID ||
      completingWelcome.current) return;
    completingWelcome.current = true;
    void welcome.complete().then(ok => {
      if (ok) trackWelcomeCompleted();
      completingWelcome.current = false;
    }).catch(() => { completingWelcome.current = false; });
  }, [welcome.visible, welcome.phase, app.screen, app.activeLessonId]);

  async function advanceWelcome(phase: WelcomePhase, categoryId?: string) {
    return welcome.advance(phase, categoryId);
  }
  async function saveWelcomeInterests(preferences: DailyChallengePreferences) {
    // Persist choices before entering the final category selection page.
    if (!await dailyPreferences.savePreferences(preferences)) return false;
    return welcome.advance("choose");
  }
  async function beginWelcomeLesson(categoryId: string) {
    const lesson = lessons.find(l => l.id === ONBOARDING_INTRO_LESSON_ID);
    if (!lesson || !categories.some(category => category.id === categoryId) ||
      !getLessonAccess(lesson, lessons, app.completedLessonIds, app.inProgressLessonIds).unlocked) return false;
    setLessonPreview({ id: lesson.id, welcomeCategoryId: categoryId });
    return true;
  }
  async function skipWelcome(step = 1) {
    if (await welcome.skip()) {
      trackWelcomeSkipped(step);
      app.setScreen("home"); setIsDailyPreferencesOpen(false); setIsDailyChallengeOpen(false);
    }
  }

  if (welcome.loading) return <SafeAreaView style={styles.welcomeLoading}><ActivityIndicator color="#B1A5FF" /><Text style={styles.welcomeLoadingText}>Φόρτωση…</Text></SafeAreaView>;

  let screenContent: ReactNode = null;

  if (!activeCategory || !activeSubcategory || !activeLesson) {
    return null;
  }

  if (welcome.visible && (welcome.phase !== "lesson" || app.screen !== "results")) {
    if (welcome.phase === "lesson") {
      screenContent = <LessonScreen
        category={activeCategory} subcategory={activeSubcategory} lesson={activeLesson}
        isSaved={bookmarks.savedLessonIds.includes(activeLesson.id)}
        bookmarksLoaded={bookmarks.isSavedLessonsLoaded}
        onToggleSaved={bookmarks.toggleSavedLesson}
        checkpointAnswers={app.checkpointAnswers}
        typedCheckpointAnswers={app.typedCheckpointAnswers}
        onAnswerCheckpoint={app.answerCheckpoint}
        onFinishLesson={app.finishInlineLesson}
        onBack={() => {
          const previous = previousWelcomePhase(welcome.phase);
          if (previous) void welcome.advance(previous);
        }} />;
    } else {
      screenContent = <WelcomeScreen phase={welcome.phase} replay={welcome.replay}
        categories={categories} selectedCategoryId={welcome.categoryId}
        preferences={dailyPreferences.preferences} preferencesLoaded={!dailyPreferences.isLoading}
        onAdvance={advanceWelcome} onSaveInterests={saveWelcomeInterests}
        onBeginLesson={beginWelcomeLesson} onSkip={skipWelcome} />;
    }
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
        onOpenLesson={previewLesson}
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
          onOpenHangman={() => app.setScreen("hangman")}
          onOpenQuickQuiz={() => app.setScreen("quick-quiz")}
          quickQuizInProgress={Boolean(quickQuiz.progress?.round && !quickQuiz.progress.round.completed)}
          onOpenProfile={() => openProfile("home")}
          categories={categories}
          subcategories={subcategories}
          featuredLesson={featuredLesson}
          progressLoaded={app.progressLoaded}
          completedCount={app.completedLessonIds.length}
          inProgressLesson={!homePathLesson || homePathLesson.id === inProgressLesson?.id ? inProgressLesson : null}
          inProgressAnsweredCount={app.inProgressAnsweredCount}
          inProgressQuestionCount={app.inProgressQuestionCount}
          onResumeLesson={previewLesson}
          onOpenCategory={app.openCategory}
          onOpenLesson={previewLesson}
          onStartDailyChallenge={() => setIsDailyChallengeOpen(true)}
        />
      );
      break;

    case "hangman":
      screenContent = <HangmanScreen key={daily.userId ?? "guest"} onHome={() => app.setScreen("home")} />;
      break;

    case "quick-quiz":
      screenContent = <QuickQuizScreen game={quickQuiz} scope={daily.userId ?? "guest"}
        preferredTopicIds={dailyPreferences.preferences.topicIds}
        onHome={() => app.setScreen("home")} />;
      break;

    case "profile":
      screenContent = <ProfileScreen onBack={() => app.setScreen(profileOrigin)} onStats={() => app.setScreen("player-stats")}
        onAccount={() => openAccount("profile")} onInterests={() => openDailyPreferences("profile")}
        onSaved={() => app.setScreen("saved")} onGuide={welcome.open} />;
      break;
    case "player-stats":
      screenContent = <PlayerStatsScreen onBack={() => app.setScreen("profile")} />;
      break;
    case "account":
      screenContent = <AccountScreen onBack={() => app.setScreen(accountOrigin)}
        devPreviewOpen={isDevQuizPreviewOpen} onCloseDevPreview={() => setIsDevQuizPreviewOpen(false)}
        dailyIntroPreview={isDevDailyIntroPreviewOpen ? {
          preferences: dailyPreferences.preferences, preferencesLoaded: !dailyPreferences.isLoading,
          onClose: () => setIsDevDailyIntroPreviewOpen(false),
          onContinue: () => { setIsDevDailyIntroPreviewOpen(false); app.setScreen("home"); setIsDailyChallengeOpen(true); },
          onOpenPreferences: () => { setIsDevDailyIntroPreviewOpen(false); openDailyPreferences("profile"); },
        } : undefined}
        devControls={{ canResetLessonProgress: app.canResetLessonProgress, lessonProgressLoaded: app.progressLoaded, onResetLessonProgressForDevelopment: app.resetLessonProgressForDevelopment, allLessonsUnlockedForTesting, onToggleAllLessonsForTesting: toggleAllLessonsForTesting, onOpenQuestionPreview: () => { if (__DEV__) setIsDevQuizPreviewOpen(true); }, onOpenDailyIntroPreview: () => { if (__DEV__) setIsDevDailyIntroPreviewOpen(true); } }}
        backupControls={app.progressLoaded && bookmarks.isSavedLessonsLoaded ? {
          deviceBackup: parseLearningBackup({ schemaVersion: 1, completedIds: app.completedLessonIds, savedIds: bookmarks.savedLessonIds, attempts: app.lessonAttempts }),
          onRestoreBackup: async backup => { await Promise.all([app.mergeRestoredProgress(backup), bookmarks.mergeRestoredBookmarks(backup.savedIds)]); },
        } : undefined} />;
      break;

    case "progress":
      screenContent = (
        <ProgressScreen
          onOpenInsights={(view: LearningInsightsView) => { setProgressView(view); app.setScreen("learning-insights"); }}
          onKnowledgeReview={() => openKnowledgeReview("progress")}
          onOpenProfile={() => openProfile("progress")}
          onHome={() => navigateTo("home")}
          completedLessons={completedLessons}
          inProgressLesson={inProgressLesson}
          inProgressAnsweredCount={app.inProgressAnsweredCount}
          inProgressQuestionCount={app.inProgressQuestionCount}
          inProgressLessonCount={app.inProgressLessonCount}
          totalLessonCount={lessons.length}
          lessonProgressLoaded={app.progressLoaded}
          onOpenLesson={previewLesson}
        />
      );
      break;

    case "learning-insights":
      screenContent = (
        <LearningInsightsScreen
          initialView={progressView} onViewChange={setProgressView}
          onBack={() => app.setScreen("progress")}
          onKnowledgeReview={() => openKnowledgeReview("progress")}
          completedLessons={completedLessons}
          totalLessonCount={lessons.length}
          lessonProgressLoaded={app.progressLoaded}
          onOpenLesson={previewLesson}
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
          onBack={() => navigateTo("profile")}
          onOpenLesson={previewLesson}
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
          completedLessonIds={app.completedLessonIds}
          inProgressLessonIds={app.inProgressLessonIds}
          progressLoaded={app.progressLoaded}
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
          onOpenLesson={previewLesson}
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
          typedCheckpointAnswers={app.typedCheckpointAnswers}
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
          onWeeklyReview={() => openKnowledgeReview("progress")}
          lesson={activeLesson}
          score={app.score}
          review={app.review}
          returning={app.resultMode === "returning"}
          practiceComplete={app.practiceComplete}
          onReviewMistakes={app.startMistakeReview}
          onHome={() => navigateTo("home")}
          onReadAgain={() => setLessonPreview({ id: activeLesson.id, reread: true })}
          nextLesson={nextLesson}
          pathProgress={{ title: activeSubcategory.title, total: subcategoryLessons.length, completed: completedSubcategoryCount }}
          onOpenLesson={previewLesson}
          onBrowse={() => navigateTo("category")}
        />
      );
      break;

    default:
      screenContent = null;
  }

  return (
    <View style={styles.container}>
      {preview ? <LessonIntroductionModal key={preview.id} lesson={preview}
        subcategoryTitle={subcategories.find(item => item.id === preview.subcategoryId)?.title}
        actionLabel={lessonPreview?.reread ? "Διάβασε ξανά" : app.lessonAttempts[preview.id] ? "Συνέχεια μαθήματος" : app.completedLessonIds.includes(preview.id) ? "Προβολή αποτελεσμάτων" : "Ξεκίνα το μάθημα"}
        onDismiss={() => setLessonPreview(null)} onStart={startPreviewLesson} /> : null}
      <SafeAreaView
        style={styles.screenViewport}
        edges={["top", "left", "right"]}
      >
        {!welcome.visible && app.screen === "home" && !isDailyChallengeOpen && !isDailyPreferencesOpen ? <SyncStatus quiet /> : null}
        {screenContent}
      </SafeAreaView>
      {!welcome.visible && !isDailyChallengeOpen && !isDevQuizPreviewOpen && !isDevDailyIntroPreviewOpen && app.screen !== "quiz" && app.screen !== "quick-quiz" && app.screen !== "hangman" ? <BottomNavigation
        currentScreen={isDailyChallengeOpen ? "home" : app.screen === "account" ? accountOrigin : app.screen === "knowledge-review" ? knowledgeOrigin : app.screen}
        onNavigate={(destination) => {
          setIsDailyPreferencesOpen(false);
          setIsDailyChallengeOpen(false);
          setIsDevQuizPreviewOpen(false);
          setIsDevDailyIntroPreviewOpen(false);
          // A bottom-tab visit is a root destination. Deep links from Home or
          // Progress still remember their origin for Android system Back.
          if (destination === "profile" && app.screen !== "profile") {
            setProfileOrigin(app.screen === "progress" || app.screen === "learning-insights" ? "progress" : "home");
          }
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

