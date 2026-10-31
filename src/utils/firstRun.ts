import { questions, DAILY_CHALLENGE_SIZE } from "../data/questions";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { getAthensDateKey, selectDailyQuestions } from "./dailyChallenge";
import { currentDailyPreferences } from "./dailySyncDocument";
import type { DailyStore } from "../state/DailyStore";
export const WELCOME_STORAGE_KEY = "@gnosi/welcome-v1";
export const LEGACY_WELCOME_KEYS = ["@gnosi/completed-lesson-ids", "@gnosi/in-progress-lesson-attempts", "@gnosi/saved-lesson-ids", "@gnosi/daily-challenge-v1", "@gnosi/daily-challenge-history-v1", "@gnosi/daily-challenge-preferences-v1"];
export type WelcomeDestination = "daily" | "home" | "lesson";
export function shouldShowWelcome(marker: string | null, userId: string | null, hasActivity: boolean, legacyValues: (string | null)[]): boolean {
  return marker === null && userId === null && !hasActivity && legacyValues.every(value => value === null);
}
/** Persist choices and, if requested, start a new challenge before marking setup
 * complete. Existing started/completed dates are never reset by the guide. */
export async function finishWelcome(store: DailyStore, preferences: DailyChallengePreferences, destination: WelcomeDestination, isCurrent: () => boolean, complete: () => Promise<boolean>): Promise<boolean> {
  if (!isCurrent() || !await store.savePreferences(preferences) || !isCurrent()) return false;
  if (destination === "daily") {
    const date = getAthensDateKey();
    const state = store.getSnapshot();
    if (!state.doc.days[date]) {
      const selected = selectDailyQuestions(date, questions, currentDailyPreferences(state.doc));
      if (selected.length !== DAILY_CHALLENGE_SIZE) return false;
      if (!store.commitRecord({ dateKey: date, questionIds: selected.map(q => q.id), currentIndex: 0, answers: {}, started: true, completed: false }, undefined)) return false;
    }
    if (!await store.flushLocal() || !isCurrent()) return false;
  }
  return complete();
}
