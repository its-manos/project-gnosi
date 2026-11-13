import type { PvpCueKind } from "./events";
export type SoundStatus = { phase: "loading" | "ready" | "playing" | "error"; message: string };
let snapshot: SoundStatus = { phase: "loading", message: "Φόρτωση ήχων…" };
const listeners = new Set<() => void>(), previews = new Set<() => void>();
export const getSoundStatus = () => snapshot;
export const subscribeSoundStatus = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function reportSoundStatus(phase: SoundStatus["phase"], message: string) {
  snapshot = { phase, message }; for (const fn of listeners) fn();
}
export function requestSoundPreview() { for (const fn of previews) fn(); }
export const subscribeSoundPreview = (fn: () => void) => { previews.add(fn); return () => { previews.delete(fn); }; };

/** Non-scoring practice cues share the existing guarded native audio player.
 * This is intentionally separate from rewarded events: no XP, toast or sync. */
export type PracticeCueKind = PvpCueKind | "correct" | "incorrect" | "complete" | "question-open" | "lesson-preview" | "lesson-open" | "world-open" | "island-open";
const practiceCues = new Set<(kind: PracticeCueKind) => void>();
export function requestPracticeCue(kind: PracticeCueKind) {
  for (const listener of practiceCues) { try { listener(kind); } catch { /* Sound never blocks gameplay. */ } }
}
export const subscribePracticeCue = (fn: (kind: PracticeCueKind) => void) => {
  practiceCues.add(fn);
  return () => { practiceCues.delete(fn); };
};
