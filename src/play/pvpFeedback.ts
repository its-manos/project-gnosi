import type { PvpRoom } from "../quiz/pvp";
import type { PracticeCueKind } from "./soundStatus";
/** Treat initial hydration and stale/background snapshots as silent baselines. */
export class PvpFeedbackTracker {
  private previous: { room: PvpRoom; visible: boolean; active: boolean } | null = null;
  private heard = new Set<string>();
  update(room: PvpRoom | null, userId: string, visible: boolean, active: boolean): PracticeCueKind[] {
    if (!room) { this.previous = null; return []; }
    const previous = this.previous;
    this.previous = { room, visible, active };
    if (!previous || !active || !previous.active || room.id !== previous.room.id) return [];
    const token = `${room.matchId}:${room.index}`;
    let cue: PracticeCueKind | null = null;
    if (room.status === "question" && visible && (!previous.visible || previous.room.matchId !== room.matchId || previous.room.index !== room.index)) cue = "question-open";
    else if (room.status === "reveal" && previous.room.status === "question" && previous.room.matchId === room.matchId && previous.room.index === room.index) {
      const self = room.players.find(player => player.id === userId);
      if (self && !self.left && room.question?.correctIndex !== undefined) cue = self.answered && self.answer === room.question.correctIndex ? "correct" : "incorrect";
    } else if (room.status === "finished" && previous.room.status === "reveal" && previous.room.matchId === room.matchId && !room.endedEarly) cue = "complete";
    if (!cue || this.heard.has(`${token}:${cue}`)) return [];
    this.heard.add(`${token}:${cue}`);
    if (this.heard.size > 128) this.heard.delete(this.heard.values().next().value!);
    return [cue];
  }
}
