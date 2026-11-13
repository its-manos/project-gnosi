import { useEffect, useState } from "react";
import { getPvpReview } from "../lib/pvp";
import { pvpErrorMessage, type PvpReview, type PvpRoom } from "../quiz/pvp";

/** The screen is keyed by account. Keep a completed review open across rematches. */
export function usePvpReview() {
  const [target, setTarget] = useState<{ roomId: string; matchId: string } | null>(null);
  const [data, setData] = useState<PvpReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!target) return;
    let active = true;
    setData(null); setError(null);
    void getPvpReview(target.roomId, target.matchId).then(result => {
      if (!result) throw new Error("pvp_review_unavailable");
      if (active) setData(result);
    }).catch(cause => { if (active) setError(pvpErrorMessage(cause)); });
    return () => { active = false; };
  }, [target, attempt]);
  return {
    open: Boolean(target), data, error, matchId: target?.matchId,
    show: (room: PvpRoom) => {
      if (room.status === "finished" && !target) { setData(null); setError(null); setTarget({ roomId: room.id, matchId: room.matchId }); }
    },
    close: () => { setTarget(null); setData(null); setError(null); },
    retry: () => setAttempt(value => value + 1),
  };
}
