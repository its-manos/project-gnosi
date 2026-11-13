export type PvpCueKind = "pvp-join" | "pvp-leave" | "pvp-ready" | "pvp-countdown" | "pvp-lock" | "pvp-warning";
export type FeedbackKind = PvpCueKind | "correct" | "incorrect" | "complete" | "mastered" | "level-up" | "question-open" | "lesson-preview" | "lesson-open" | "world-open" | "island-open";
export type FeedbackEvent = { id: string; scope: string; kind: FeedbackKind; xp?: number; answerXP?: number; pendingXP?: boolean; label?: string; level?: number };
const listeners = new Set<(event: FeedbackEvent) => void>();
/** Only accepted local actions publish here. Hydration, imports and sync never do.
 * Cosmetic failures must never affect an answer, score or storage write. */
export function emitPlayFeedback(event: FeedbackEvent) {
  for (const listener of listeners) { try { listener(event); } catch { /* Optional feedback. */ } }
}
export function subscribePlayFeedback(listener: (event: FeedbackEvent) => void) {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
export const feedbackPriority: Record<FeedbackKind, number> = { correct: 1, incorrect: 1, complete: 2, mastered: 3, "level-up": 4, "question-open": 0, "lesson-preview": 0, "lesson-open": 0, "world-open": 0, "island-open": 0, "pvp-join": 0, "pvp-leave": 0, "pvp-ready": 0, "pvp-countdown": 0, "pvp-lock": 0, "pvp-warning": 0 };
export class FeedbackGate {
  private seen = new Set<string>();
  private last: { kind: FeedbackKind; at: number } | null = null;
  accept(event: FeedbackEvent, scope: string, foreground: boolean, now: number): boolean {
    if (event.scope !== scope || !foreground || this.seen.has(event.id)) return false;
    this.seen.add(event.id);
    if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!);
    const reward = (event.answerXP ?? event.xp ?? 0) > 0;
    if (!reward && event.answerXP === undefined && this.last && now - this.last.at < 900 && feedbackPriority[this.last.kind] > feedbackPriority[event.kind]) return false;
    this.last = { kind: event.kind, at: now }; return true;
  }
  reset() { this.last = null; }
}
