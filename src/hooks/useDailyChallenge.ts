import { advanceQuizSession, questionToken, submitQuizAnswer, calculateChoiceResults } from "../quiz/engine";
import { dailyRecordSession, updateDailyRecord } from "../quiz/compatibility";
import { questions, DAILY_CHALLENGE_SIZE, type GeneralKnowledgeQuestion } from "../data/questions";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { useAthensDate } from "./useAthensDate";
import { useDailySnapshot, useLearningSession } from "../state/LearningSession";
import { emptyDailyChallengeRecord, getAthensDateKey, selectDailyQuestions } from "../utils/dailyChallenge";
export function useDailyChallenge(preferences: DailyChallengePreferences, preferencesLoaded: boolean) {
  const { dailyStore } = useLearningSession();
  const snapshot = useDailySnapshot();
  const todayKey = useAthensDate();
  const day = snapshot.doc.days[todayKey];
  const record = day?.record ?? emptyDailyChallengeRecord(todayKey);
  const challengeQuestions = record.questionIds.map(id => questions.find(q => q.id === id)).filter((q): q is GeneralKnowledgeQuestion => Boolean(q));
  const currentQuestion = record.started && !record.completed ? questions.find(q => q.id === record.questionIds[record.currentIndex]) ?? null : null;
  const selectedAnswer = record.answers[String(record.currentIndex)] ?? null;
  const correctCount = day?.history?.correctCount ?? calculateChoiceResults(challengeQuestions, record.answers).correctCount;
  const currentDate = () => getAthensDateKey() === todayKey;
  async function startChallenge() {
    if (!snapshot.ready || !preferencesLoaded || !currentDate() || record.started || record.completed) return;
    const selected = selectDailyQuestions(todayKey, questions, preferences);
    if (selected.length !== DAILY_CHALLENGE_SIZE) return;
    dailyStore.commitRecord({ dateKey: todayKey, questionIds: selected.map(q => q.id), currentIndex: 0, answers: {}, started: true, completed: false }, day);
    await dailyStore.flushLocal();
  }
  async function answerQuestion(answerIndex: number) {
    if (!currentDate() || !record.started || record.completed || record.answers[String(record.currentIndex)] !== undefined) return;
    if (!currentQuestion || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= currentQuestion.answers.length) return;
    const session = dailyRecordSession(record, questions);
    if (!session) return;
    const transition = submitQuizAnswer(session, questionToken(session), answerIndex);
    if (!transition.changed) return;
    dailyStore.commitRecord(updateDailyRecord(record, transition.session), day);
    await dailyStore.flushLocal();
  }
  async function nextQuestion() {
    if (!currentDate() || !record.started || record.completed || selectedAnswer === null) return;
    const session = dailyRecordSession(record, questions);
    if (!session) return;
    const transition = advanceQuizSession(session, questionToken(session));
    if (!transition.changed) return;
    dailyStore.commitRecord(updateDailyRecord(record, transition.session), day);
    await dailyStore.flushLocal();
  }
  async function resetChallengeForDevelopment() {
    if (__DEV__ && !snapshot.userId) await dailyStore.resetGuestDate(todayKey);
  }
  return { todayKey, record, isLoading: !snapshot.ready || !preferencesLoaded, challengeQuestions, currentQuestion, selectedAnswer, correctCount, startChallenge, answerQuestion, nextQuestion, resetChallengeForDevelopment, accountScoped: Boolean(snapshot.userId), reviewAvailable: challengeQuestions.length === record.questionIds.length };
}
