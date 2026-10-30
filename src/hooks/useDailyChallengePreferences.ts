import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { currentDailyPreferences } from "../utils/dailySyncDocument";
import { useDailySnapshot, useLearningSession } from "../state/LearningSession";
export function useDailyChallengePreferences() {
  const { dailyStore } = useLearningSession();
  const snapshot = useDailySnapshot();
  return {
    preferences: currentDailyPreferences(snapshot.doc),
    isLoading: !snapshot.ready,
    savePreferences: (value: DailyChallengePreferences) => dailyStore.savePreferences(value),
  };
}
