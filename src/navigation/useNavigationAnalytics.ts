import { useEffect } from "react";
import type { Lesson } from "../data/lessons";
import type { AppScreen } from "../hooks/useLearningApp";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import type { AnalyticsScreen } from "../utils/betaAnalytics";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { WELCOME_GUIDE_STAGES } from "../utils/firstRun";

type NavigationAnalyticsState = {
  screen: AppScreen;
  lesson: Lesson | undefined;
  resultMode: "finished" | "returning";
  answeredCount: number;
  welcome: { visible: boolean; loading: boolean; replay: boolean; phase?: string };
  dailyChallengeOpen: boolean;
  dailyPreferencesOpen: boolean;
};

function analyticsScreenFor(
  screen: AppScreen,
  welcomeVisible: boolean,
  welcomePhase: string | undefined,
  dailyChallengeOpen: boolean,
  dailyPreferencesOpen: boolean,
): AnalyticsScreen | null {
  if (welcomeVisible && (welcomePhase !== "lesson" || (screen !== "lesson" && screen !== "results"))) return "welcome";
  if (screen === "quick-quiz" || screen === "hangman") return null;
  if (dailyPreferencesOpen) return "daily-preferences";
  if (dailyChallengeOpen) return "daily";

  // Use the published screen names accepted by the beta endpoint.
  switch (screen) {
    case "knowledge-review": return "review";
    case "profile": return "account";
    case "player-stats":
    case "learning-insights": return "progress";
    default: return screen;
  }
}

export function useNavigationAnalytics({
  screen, lesson, resultMode, answeredCount, welcome, dailyChallengeOpen, dailyPreferencesOpen,
}: NavigationAnalyticsState) {
  const { analytics, enabled } = useBetaAnalytics();
  const analyticsScreen = analyticsScreenFor(screen, welcome.visible, welcome.phase, dailyChallengeOpen, dailyPreferencesOpen);
  const lessonId = lesson?.id;

  useEffect(() => {
    if (!welcome.loading && enabled && analyticsScreen) void analytics.view(analyticsScreen);
  }, [analytics, enabled, welcome.loading, analyticsScreen]);

  useEffect(() => {
    if (!enabled || welcome.loading) return;

    if ((analyticsScreen === "lesson" || analyticsScreen === "quiz") && lesson) {
      void analytics.lesson({
        screen: analyticsScreen,
        lesson_id: lesson.id,
        category_id: lesson.categoryId,
        subcategory_id: lesson.subcategoryId,
        answered_count: answeredCount,
        total_questions: getInlineQuestionCount(lesson),
      });
    } else if (analyticsScreen === "results" && resultMode === "finished") {
      void analytics.completeLesson();
    } else {
      void analytics.lesson(null);
    }
    // Read the result mode and initial count on entry. Checkpoints update the visit below.
  }, [analytics, enabled, welcome.loading, analyticsScreen, lessonId]);

  useEffect(() => {
    if (enabled && (analyticsScreen === "lesson" || analyticsScreen === "quiz")) {
      void analytics.progress({ answered_count: answeredCount });
    }
  }, [analytics, enabled, analyticsScreen, answeredCount]);

  useEffect(() => () => { void analytics.lesson(null, "account_change"); }, [analytics]);

  return {
    trackWelcomeCompleted() {
      void analytics.track("onboarding_completed", { screen: "welcome", onboarding_step: WELCOME_GUIDE_STAGES.length, replay: welcome.replay });
    },
    trackWelcomeSkipped(step: number) {
      void analytics.track("onboarding_skipped", { screen: "welcome", onboarding_step: step, replay: welcome.replay });
    },
  };
}

