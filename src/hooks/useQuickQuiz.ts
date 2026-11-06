import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { readQuickQuiz, type QuickQuizProgress } from "../quiz/quickQuiz";

// A pending write may outlive the keyed account navigator. A remount of
// the same scope reads only after that write settles.
const pendingWrites = new Map<string, Promise<void>>();

export function useQuickQuiz(userId: string | null) {
  const key = `@gnosi/quick-quiz/v1/${userId ? `account:${userId}` : "guest"}`;
  const [progress, setProgress] = useState<QuickQuizProgress | null>(null);
  const [error, setError] = useState<"load" | "save" | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<QuickQuizProgress | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    async function load() {
      try {
        await pendingWrites.get(key)?.catch(() => {});
        const next = readQuickQuiz(await AsyncStorage.getItem(key));
        if (!active) return;
        latest.current = next;
        setProgress(next);
      } catch {
        if (active) setError("load");
      }
    }
    void load();
    return () => { active = false; mounted.current = false; };
  }, [key, attempt]);

  const update = useCallback(async (change: (current: QuickQuizProgress) => QuickQuizProgress) => {
    const current = latest.current;
    if (!current || pendingWrites.has(key)) return null;
    const next = change(current);
    if (next === current) return null;
    setError(null);
    setBusy(true);
    const write = AsyncStorage.setItem(key, JSON.stringify({ version: 1, ...next }));
    pendingWrites.set(key, write);
    try {
      await write;
      if (!mounted.current) return null;
      latest.current = next;
      setProgress(next);
      return next;
    } catch {
      if (mounted.current) setError("save");
      throw new Error("quick_quiz_save_failed");
    } finally {
      pendingWrites.delete(key);
      if (mounted.current) setBusy(false);
    }
  }, [key]);

  function retryLoad() {
    setError(null);
    setAttempt(value => value + 1);
  }

  return { progress, update, error, busy, retryLoad };
}
