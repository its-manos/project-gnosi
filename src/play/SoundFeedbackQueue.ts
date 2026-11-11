import { feedbackPriority, type FeedbackKind } from "./events";

/** Coalesce cues from one action, independently of XP/toast delivery.
 * No timers or delayed backlog: one microtask selects the strongest cue.
 * A short celebration gets space before a lower-priority transition. */
export class SoundFeedbackQueue {
  private pending: FeedbackKind | null = null;
  private scheduled = false;
  private generation = 0;
  private last: { kind: FeedbackKind; at: number } | null = null;
  constructor(private play: (kind: FeedbackKind) => void, private now = Date.now) {}
  enqueue(kind: FeedbackKind) {
    if (!this.pending || feedbackPriority[kind] >= feedbackPriority[this.pending]) this.pending = kind;
    if (this.scheduled) return;
    this.scheduled = true;
    const token = this.generation;
    void Promise.resolve().then(() => {
      if (token !== this.generation) return;
      const next = this.pending;
      this.pending = null;
      this.scheduled = false;
      if (!next) return;
      const at = this.now();
      const answer = next === "correct" || next === "incorrect";
      const hold = this.last?.kind === "level-up" ? 800 : this.last?.kind === "mastered" ? 460 : 600;
      if (!answer && this.last && at - this.last.at < hold &&
          feedbackPriority[this.last.kind] >= 2 && feedbackPriority[next] < feedbackPriority[this.last.kind]) return;
      this.last = { kind: next, at };
      try { this.play(next); } catch { /* Cosmetic feedback cannot fail an action. */ }
    });
  }
  clear() { this.generation++; this.pending = null; this.scheduled = false; this.last = null; }
}
