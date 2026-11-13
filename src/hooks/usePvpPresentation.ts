import { useEffect, useRef, useState } from "react";
import type { PvpRoom } from "../quiz/pvp";

/** Every visible reveal gets a full three seconds, independent of poll latency. */
export function usePvpPresentation(incoming: PvpRoom | null) {
  const [room, setRoom] = useState(incoming);
  const [revealEndsAt, setRevealEndsAt] = useState(0);
  const current = useRef(incoming);
  const latest = useRef(incoming);
  const until = useRef(0);
  useEffect(() => {
    latest.current = incoming;
    const before = current.current;
    const sameRound = before && incoming && before.id === incoming.id && before.matchId === incoming.matchId && before.index === incoming.index;
    if (incoming?.status === "reveal" && (!sameRound || before?.status !== "reveal")) {
      until.current = Date.now() + 3000;
      setRevealEndsAt(until.current);
    }
    const preserve = before?.status === "reveal" && incoming && incoming.id === before.id && incoming.matchId === before.matchId &&
      (incoming.status === "question" || incoming.status === "finished") && !incoming.endedEarly && Date.now() < until.current;
    if (!preserve) { current.current = incoming; setRoom(incoming); return; }
    const timer = setTimeout(() => { current.current = latest.current; setRoom(latest.current); }, until.current - Date.now());
    return () => clearTimeout(timer);
  }, [incoming]);
  return { room, revealEndsAt };
}
