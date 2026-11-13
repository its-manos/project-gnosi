import type { PvpRoom } from "../quiz/pvp";
import type { PracticeCueKind } from "./soundStatus";

/** Treat initial hydration and stale/background snapshots as silent baselines. */
export class PvpFeedbackTracker {
  private previous: { room: PvpRoom; visible: boolean; active: boolean; countdown: number; secondsLeft: number } | null = null;
  private heard = new Set<string>();
  notice: string | null = null;
  update(room: PvpRoom | null, userId: string, visible: boolean, active: boolean, countdown = 0, secondsLeft = 0): PracticeCueKind[] {
    this.notice = null;
    if (!room) { this.previous = null; this.heard.clear(); return []; }
    const previous = this.previous;
    this.previous = { room, visible, active, countdown, secondsLeft };
    if (!previous || !active || !previous.active || room.id !== previous.room.id) return [];
    const token = `${room.matchId}:${room.index}`;
    const sameRound = previous.room.matchId === room.matchId && previous.room.index === room.index;
    const self = room.players.find(player => player.id === userId);
    let cue: PracticeCueKind | null = null;
    let key = "";
    if (room.status === "lobby" && previous.room.status === "lobby" && sameRound) {
      const before = previous.room.players.filter(player => !player.left);
      const after = room.players.filter(player => !player.left);
      const joined = after.filter(player => player.id !== userId && !before.some(old => old.id === player.id));
      const left = before.filter(player => player.id !== userId && !after.some(next => next.id === player.id));
      const readied = after.filter(player => player.ready && player.connected && before.some(old => old.id === player.id && !old.ready));
      if (joined.length) { cue = "pvp-join"; this.notice = joined.length === 1 ? `${joined[0].name} μπήκε στην παρέα.` : `${joined.length} παίκτες μπήκαν στην παρέα.`; }
      else if (left.length) { cue = "pvp-leave"; this.notice = left.length === 1 ? `${left[0].name} αποχώρησε.` : `${left.length} παίκτες αποχώρησαν.`; }
      else if (readied.length) {
        cue = "pvp-ready";
        this.notice = after.length >= 2 && after.every(player => player.ready && player.connected) ? "Όλοι έτοιμοι! Ο οικοδεσπότης μπορεί να ξεκινήσει." :
          readied.length === 1 ? `${readied[0].name} είναι έτοιμος.` : `${readied.length} παίκτες είναι έτοιμοι.`;
      }
      // A later join/ready is a new event, even in the same lobby.
      return cue ? [cue] : [];
    }
    if (room.status === "question" && visible && (!previous.visible || !sameRound)) cue = "question-open";
    else if (room.status === "reveal" && previous.room.status === "question" && sameRound) {
      if (self && !self.left && room.question?.correctIndex !== undefined) cue = self.answered && self.answer === room.question.correctIndex ? "correct" : "incorrect";
    } else if (room.status === "finished" && previous.room.status === "reveal" && sameRound && !room.endedEarly) cue = "complete";
    else if (room.status === "question" && countdown >= 1 && countdown <= 3 &&
      (previous.room.status === "lobby" || !sameRound || countdown < previous.countdown)) {
      cue = "pvp-countdown"; key = `:${countdown}`;
    } else if (room.status === "question" && sameRound && visible && self?.answered &&
      previous.room.players.some(player => player.id === userId && !player.answered)) cue = "pvp-lock";
    else if (room.status === "question" && sameRound && visible && !self?.answered && secondsLeft > 0 && secondsLeft <= 5 && previous.secondsLeft > 5) cue = "pvp-warning";
    if (!cue || this.heard.has(`${token}:${cue}${key}`)) return [];
    this.heard.add(`${token}:${cue}${key}`);
    if (this.heard.size > 128) this.heard.delete(this.heard.values().next().value!);
    return [cue];
  }
}
