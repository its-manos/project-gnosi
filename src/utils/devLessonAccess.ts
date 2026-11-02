/**
 * In-memory, device-local testing override.
 *
 * Never stores completed lessons, XP or quiz answers; never syncs with Supabase.
 * New development sessions start with normal lesson progression. Production
 * builds cannot enable this flag, even if setDevLessonUnlockAll(true) is called.
 */
let unlockAllForTesting = false;

export function devLessonsUnlocked(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && unlockAllForTesting;
}

export function setDevLessonUnlockAll(enabled: boolean): void {
  unlockAllForTesting = typeof __DEV__ !== "undefined" && __DEV__ && enabled;
}
