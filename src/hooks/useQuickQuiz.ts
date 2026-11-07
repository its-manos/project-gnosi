import { mistakeById, mistakeKey } from "../knowledge/mistakes";
import { useLearningSession } from "../state/LearningSession";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { readQuickQuiz, type QuickQuizProgress } from "../quiz/quickQuiz";

// A pending write may outlive the keyed account navigator. A remount of
// the same scope reads only after that write settles.
const pendingWrites = new Map<string, Promise<void>>();

export function useQuickQuiz(userId: string | null) {
  const { store } = useLearningSession();
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
        // The per-round timestamp is a tiny durable handoff, not a second mistake history.
        for (const id of next.missed) {
          const q = mistakeById.get(id)?.question;
          if (q && !store.getSnapshot().mistakes[mistakeKey(q)]) store.importMistakes({ [mistakeKey(q)]: {
            questionId: q.id, version: q.version, wrong: { at: 946684800001, value: null }, correctAt: 0,
          } });
        }
        if (next.round) for (const q of next.round.questions) {
          const answer = next.round.answers[q.id], at = next.reviewAnswerTimes?.[q.id];
          if (answer && (at || !store.getSnapshot().mistakes[mistakeKey(q)])) store.recordQuestionAnswer(q, answer.value, at ?? 946684800002);
        }
        // A correction in the unified review also clears Quick Quiz's recall hint.
        next.missed = next.missed.filter(id => {
          const q = mistakeById.get(id)?.question, row = q && store.getSnapshot().mistakes[mistakeKey(q)];
          return !row?.wrong || row.correctAt <= row.wrong.at;
        });
        latest.current = next;
        setProgress(next);
      } catch {
        if (active) setError("load");
      }
    }
    void load();
    return () => { active = false; mounted.current = false; };
  }, [key, attempt, store]);

  const update = useCallback(async (change: (current: QuickQuizProgress) => QuickQuizProgress) => {
    const current = latest.current;
    if (!current || pendingWrites.has(key)) return null;
    const changed = change(current);
    if (changed === current) return null;
    const reviewAnswerTimes = changed.round?.id === current.round?.id ? { ...current.reviewAnswerTimes } : {};
    if (changed.round) for (const q of changed.round.questions) {
      if (changed.round.answers[q.id] && (changed.round.id !== current.round?.id || !current.round.answers[q.id])) reviewAnswerTimes[q.id] = Date.now();
    }
    const missed = changed.missed.filter(id => {
      const q = mistakeById.get(id)?.question, row = q && store.getSnapshot().mistakes[mistakeKey(q)];
      return !row?.wrong || row.correctAt <= row.wrong.at;
    });
    const next = { ...changed, missed, reviewAnswerTimes };
    setError(null);
    setBusy(true);
    const write = AsyncStorage.setItem(key, JSON.stringify({ version: 1, ...next }));
    pendingWrites.set(key, write);
    try {
      await write;
      if (!mounted.current) return null;
      if (next.round) for (const q of next.round.questions) {
        const answer = next.round.answers[q.id];
        if (answer && (next.round.id !== current.round?.id || !current.round.answers[q.id])) store.recordQuestionAnswer(q, answer.value, reviewAnswerTimes[q.id]);
      }
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
  }, [key, store]);

  function retryLoad() {
    setError(null);
    setAttempt(value => value + 1);
  }

  return { progress, update, error, busy, retryLoad };
}
