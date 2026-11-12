import { playerTrophies, type Trophy, type TrophyMetrics } from '../gamification/trophies';
export type TrophyUnlock = { scope: string; trophies: Trophy[] };
const listeners = new Set<(event: TrophyUnlock) => void>();
const empty: TrophyMetrics = { lessons: 0, worlds: 0, daily: 0, streak: 0, revision: 0, hangman: 0 };
/** Called only by accepted local completions. Restore/import/sync never call this. */
export function announceTrophyCrossings(scope: string, before: Partial<TrophyMetrics>, after: Partial<TrophyMetrics>) {
  const previous = { ...empty, ...before };
  const trophies = playerTrophies({ ...empty, ...after }).filter(trophy => trophy.unlocked && previous[trophy.family] < trophy.target);
  if (!trophies.length) return;
  for (const listener of listeners) { try { listener({ scope, trophies }); } catch { /* Cosmetic feedback cannot interrupt progress. */ } }
}
export function subscribeTrophyUnlocks(listener: (event: TrophyUnlock) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
