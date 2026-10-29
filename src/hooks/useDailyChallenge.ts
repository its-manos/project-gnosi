import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DAILY_CHALLENGE_SIZE,
  questions,
  type GeneralKnowledgeQuestion,
} from "../data/questions";
import {
  emptyDailyChallengeRecord,
  getAthensDateKey,
  parseDailyChallengeRecord,
  selectDailyQuestions,
  type DailyChallengeRecord,
} from "../utils/dailyChallenge";

const DAILY_CHALLENGE_STORAGE_KEY = "@gnosi/daily-challenge-v1";

export function useDailyChallenge() {
  const [todayKey, setTodayKey] = useState(() => getAthensDateKey());
  const [record, setRecord] = useState<DailyChallengeRecord>(() => emptyDailyChallengeRecord(todayKey));
  const [isLoading, setIsLoading] = useState(true);
  const recordRef = useRef<DailyChallengeRecord>(record);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Refresh the local challenge date when the app returns to the foreground,
  // and while it remains open across midnight in the Europe/Athens timezone.
  useEffect(() => {
    const refreshDate = () => {
      const currentDateKey = getAthensDateKey();
      setTodayKey((previousDateKey) =>
        previousDateKey === currentDateKey ? previousDateKey : currentDateKey
      );
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDate();
    });
    const interval = setInterval(refreshDate, 60_000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const commit = useCallback((nextRecord: DailyChallengeRecord) => {
    recordRef.current = nextRecord;
    setRecord(nextRecord);
    const serialized = JSON.stringify(nextRecord);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, serialized));
    return writeQueueRef.current;
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function load() {
      let nextRecord = emptyDailyChallengeRecord(todayKey);
      try {
        const saved = await AsyncStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
        nextRecord = parseDailyChallengeRecord(saved, todayKey) ?? nextRecord;
      } catch (error) {
        console.warn("Could not load today's challenge:", error);
      }

      if (isMounted) {
        recordRef.current = nextRecord;
        setRecord(nextRecord);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  const challengeQuestions = record.dateKey === todayKey ? record.questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is GeneralKnowledgeQuestion => Boolean(question)) : [];

  const currentQuestion = record.dateKey === todayKey && record.started
    ? challengeQuestions[record.currentIndex] ?? null
    : null;
  const selectedAnswer = record.dateKey === todayKey
    ? record.answers[String(record.currentIndex)] ?? null
    : null;
  const correctCount = challengeQuestions.reduce((total, question, index) => {
    return record.answers[String(index)] === question.correctIndex ? total + 1 : total;
  }, 0);

  const startChallenge = useCallback(async () => {
    const current = recordRef.current;
    if (isLoading || current.dateKey !== todayKey || current.started || current.completed) return;
    const selected = selectDailyQuestions(todayKey);
    if (selected.length !== DAILY_CHALLENGE_SIZE) return;

    await commit({
      dateKey: todayKey,
      questionIds: selected.map((question) => question.id),
      currentIndex: 0,
      answers: {},
      started: true,
      completed: false,
    });
  }, [commit, isLoading, todayKey]);

  const answerQuestion = useCallback(async (answerIndex: number) => {
    const current = recordRef.current;
    if (!current.started || current.completed || current.dateKey !== todayKey) return;
    if (current.answers[String(current.currentIndex)] !== undefined) return;

    const question = questions.find((item) => item.id === current.questionIds[current.currentIndex]);
    if (!question || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.answers.length) return;

    await commit({
      ...current,
      answers: { ...current.answers, [String(current.currentIndex)]: answerIndex },
    });
  }, [commit, todayKey]);

  const nextQuestion = useCallback(async () => {
    const current = recordRef.current;
    if (!current.started || current.completed || current.dateKey !== todayKey) return;
    if (current.answers[String(current.currentIndex)] === undefined) return;

    if (current.currentIndex < DAILY_CHALLENGE_SIZE - 1) {
      await commit({ ...current, currentIndex: current.currentIndex + 1 });
      return;
    }

    if (Object.keys(current.answers).length < DAILY_CHALLENGE_SIZE) return;
    await commit({ ...current, completed: true });
  }, [commit, todayKey]);

  return {
    todayKey,
    record,
    isLoading: isLoading || record.dateKey !== todayKey,
    challengeQuestions,
    currentQuestion,
    selectedAnswer,
    correctCount,
    startChallenge,
    answerQuestion,
    nextQuestion,
  };
}
