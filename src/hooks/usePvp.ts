import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as api from "../lib/pvp";
import { pvpClockOffset, pvpErrorMessage, type PvpRoom, type PvpSettings } from "../quiz/pvp";

/** One request at a time prevents late poll responses from replacing accepted actions. */
export function usePvp(userId: string | null) {
  const [room, setRoom] = useState<PvpRoom | null>(null);
  const [loading, setLoading] = useState(Boolean(userId && api.pvpAvailable));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [lastSynced, setLastSynced] = useState(0);
  const latest = useRef<PvpRoom | null>(null);
  const inFlight = useRef(false);
  const actionPending = useRef(false);
  const settled = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(false);

  const request = useCallback(async (operation: () => Promise<PvpRoom | null>, foreground = true) => {
    if (!mounted.current || !userId || !api.pvpAvailable) return false;
    if (foreground) {
      if (actionPending.current) return false;
      actionPending.current = true;
      setBusy(true);
      // A tap during a poll waits for that response; it is never silently lost.
      if (inFlight.current) await settled.current;
      if (!mounted.current) { actionPending.current = false; return false; }
    } else if (inFlight.current || actionPending.current) return false;
    inFlight.current = true;
    let release!: () => void;
    settled.current = new Promise<void>(resolve => { release = resolve; });
    const sent = Date.now();
    try {
      const snapshot = await operation();
      if (!mounted.current) return false;
      if (snapshot) setOffset(pvpClockOffset(snapshot.serverNow, sent, Date.now()));
      latest.current = snapshot;
      setRoom(snapshot);
      setLastSynced(Date.now());
      setError(null);
      return true;
    } catch (cause) {
      if (mounted.current) {
        setError(pvpErrorMessage(cause));
        if ((cause as { message?: string })?.message === "pvp_not_member") {
          latest.current = null;
          setRoom(null);
        }
      }
      return false;
    } finally {
      inFlight.current = false;
      if (foreground) actionPending.current = false;
      if (mounted.current) { if (foreground) setBusy(false); setLoading(false); }
      release();
    }
  }, [userId]);

  const refresh = useCallback(() => request(() => latest.current ? api.getPvpRoom(latest.current.id) : api.resumePvpRoom(), false), [request]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    // Short polling keeps the protocol independent of Realtime publication settings.
    const poll = setInterval(() => {
      if (latest.current && latest.current.status !== "closed" && AppState.currentState === "active") void refresh();
    }, 1500);
    const subscription = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
    return () => { mounted.current = false; clearInterval(poll); subscription.remove(); };
  }, [refresh]);

  return {
    room, busy, loading, error, offset, lastSynced, available: api.pvpAvailable,
    refresh,
    create: (name: string, settings: PvpSettings) => request(() => api.createPvpRoom(name, settings)),
    join: (name: string, code: string) => request(() => api.joinPvpRoom(name, code)),
    ready: (ready: boolean) => { const current = latest.current; return current ? request(() => api.readyPvpRoom(current.id, ready)) : Promise.resolve(false); },
    start: () => { const current = latest.current; return current ? request(() => api.startPvpRoom(current.id, current.matchId)) : Promise.resolve(false); },
    answer: (value: number) => { const current = latest.current; return current ? request(() => api.answerPvpRoom(current, value)) : Promise.resolve(false); },
    rematch: () => { const current = latest.current; return current ? request(() => api.rematchPvpRoom(current.id, current.matchId)) : Promise.resolve(false); },
    leave: () => { const current = latest.current; return current ? request(() => api.leavePvpRoom(current.id)) : Promise.resolve(false); },
    dismiss: () => { latest.current = null; setRoom(null); setError(null); },
  };
}
