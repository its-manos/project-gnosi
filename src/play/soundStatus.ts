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
