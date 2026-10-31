import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getReportOutbox } from "../lib/contentReports";
import { useLearningSession } from "../state/LearningSession";

export function useReportOutbox() {
  const { store: learning } = useLearningSession();
  const store = useMemo(() => getReportOutbox(learning.userId), [learning.userId]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.start(); }, [store]);
  return { store, ...snapshot };
}
