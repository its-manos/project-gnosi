import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { PvpRoom } from "../quiz/pvp";
import { PvpFeedbackTracker } from "../play/pvpFeedback";
import { requestPracticeCue } from "../play/soundStatus";
export function usePvpFeedback(room: PvpRoom | null, userId: string | null, visible: boolean, fresh: boolean, countdown = 0, secondsLeft = 0) {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const tracker = useRef(new PvpFeedbackTracker());
  const latest = useRef(room);
  const resumeSnapshot = useRef<PvpRoom | null | undefined>(undefined);
  latest.current = room;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      // Skip the first returning snapshot even when timers were suspended.
      if (state !== "active") { tracker.current = new PvpFeedbackTracker(); setNotice(null); resumeSnapshot.current = latest.current; }
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (resumeSnapshot.current !== undefined) {
      if (room === resumeSnapshot.current) return;
      resumeSnapshot.current = undefined;
      tracker.current = new PvpFeedbackTracker();
    }
    for (const cue of tracker.current.update(room, userId ?? "guest", visible, fresh && AppState.currentState === "active", countdown, secondsLeft)) requestPracticeCue(cue);
    if (tracker.current.notice) setNotice({ message: tracker.current.notice });
    if (!fresh || room?.status !== "lobby") setNotice(null);
  }, [room, userId, visible, fresh, countdown, secondsLeft]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  return notice?.message ?? null;
}
