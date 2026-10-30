import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { getAthensDateKey } from "../utils/dailyChallenge";

/** Keep daily reading picks current after midnight or returning to the app. */
export function useAthensDate() {
  const [dayKey, setDayKey] = useState(() => getAthensDateKey());
  useEffect(() => {
    const refresh = () => setDayKey(getAthensDateKey());
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    const timer = setInterval(refresh, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, []);
  return dayKey;
}
