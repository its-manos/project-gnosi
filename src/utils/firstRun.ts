import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { getAthensDateKey } from "./dailyChallenge";
import { createSharedDailyRecord } from "./sharedDailyChallenge";
import type { DailyStore } from "../state/DailyStore";
export const WELCOME_STORAGE_KEY = "@gnosi/welcome-v1";
export const ONBOARDING_CATEGORY_KEY = "@gnosi/onboarding-category-v1";
/** The single source of truth for playable onboarding order. The lesson
 * reader follows these four guide pages but has no numbered progress step. */
export const WELCOME_GUIDE_STAGES = ["welcome", "question", "interests", "choose"] as const;
export type WelcomePhase = typeof WELCOME_GUIDE_STAGES[number] | "lesson";

export function welcomeStepNumber(phase: WelcomePhase): number {
  const index = WELCOME_GUIDE_STAGES.indexOf(phase as typeof WELCOME_GUIDE_STAGES[number]);
  return index === -1 ? WELCOME_GUIDE_STAGES.length : index + 1;
}

export function previousWelcomePhase(phase: WelcomePhase): WelcomePhase | null {
  const index = phase === "lesson" ? WELCOME_GUIDE_STAGES.length
    : WELCOME_GUIDE_STAGES.indexOf(phase);
  return index > 0 ? WELCOME_GUIDE_STAGES[index - 1] : null;
}

export function isWelcomePhase(value: string | null): value is WelcomePhase {
  return value === "lesson" || WELCOME_GUIDE_STAGES.some(stage => stage === value);
}
export const ONBOARDING_INTRO_LESSON_ID = "ancient-athens";
export const LEGACY_WELCOME_KEYS = ["@gnosi/completed-lesson-ids", "@gnosi/in-progress-lesson-attempts", "@gnosi/saved-lesson-ids", "@gnosi/daily-challenge-v1", "@gnosi/daily-challenge-history-v1", "@gnosi/daily-challenge-preferences-v1"];
export type WelcomeDestination = "daily" | "home" | "lesson";
export function shouldShowWelcome(marker: string | null, userId: string | null, hasActivity: boolean, legacyValues: (string | null)[]): boolean {
  return isWelcomePhase(marker) || (marker === null && userId === null && !hasActivity && legacyValues.every(value => value === null));
}
/** Persist choices and, if requested, start a new challenge before marking setup
 * complete. Existing started/completed dates are never reset by the guide. */
export async function finishWelcome(store: DailyStore, preferences: DailyChallengePreferences, destination: WelcomeDestination, isCurrent: () => boolean, complete: () => Promise<boolean>): Promise<boolean> {
  if (!isCurrent() || !await store.savePreferences(preferences) || !isCurrent()) return false;
  if (destination === "daily") {
    const date = getAthensDateKey();
    const state = store.getSnapshot();
    if (!state.doc.days[date]) {
      const record = createSharedDailyRecord(date);
      if (!record || !store.commitRecord(record,undefined)) return false;
    }
    if (!await store.flushLocal() || !isCurrent()) return false;
  }
  return complete();
}
