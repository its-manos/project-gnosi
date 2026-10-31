export type FeedbackKind = "correct" | "incorrect" | "complete" | "mastered" | "level-up";
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
const priorities: Record<FeedbackKind, number> = { correct: 1, incorrect: 1, complete: 2, mastered: 3, "level-up": 4 };
export class FeedbackGate {
  private seen = new Set<string>();
  private last: { kind: FeedbackKind; at: number } | null = null;
  accept(event: FeedbackEvent, scope: string, foreground: boolean, now: number): boolean {
    if (event.scope !== scope || !foreground || this.seen.has(event.id)) return false;
    this.seen.add(event.id);
    if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!);
    if (event.answerXP === undefined && this.last && now - this.last.at < 900 && priorities[this.last.kind] > priorities[event.kind]) return false;
    this.last = { kind: event.kind, at: now }; return true;
  }
  reset() { this.last = null; }
}
