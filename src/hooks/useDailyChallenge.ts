import { createSharedDailyRecord, dailyQuestionsCompatible } from "../utils/sharedDailyChallenge";
import { LEGACY_REWARD_RULES } from "../gamification/rules";
import { quizRewardSummary } from "../gamification/rewards";
import { adaptDailyQuestion } from "../quiz/adapters";
import { advanceQuizSession, questionToken, submitQuizAnswer, calculateChoiceResults } from "../quiz/engine";
import { dailyRecordSession, updateDailyRecord } from "../quiz/compatibility";
import { questions, type GeneralKnowledgeQuestion } from "../data/questions";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { useAthensDate } from "./useAthensDate";
import { useDailySnapshot, useLearningSession } from "../state/LearningSession";
import { emptyDailyChallengeRecord, getAthensDateKey } from "../utils/dailyChallenge";
export function useDailyChallenge(_preferences: DailyChallengePreferences, preferencesLoaded: boolean) {
  const { dailyStore } = useLearningSession();
  const snapshot = useDailySnapshot();
  const todayKey = useAthensDate();
  const day = snapshot.doc.days[todayKey];
  const record = day?.record ?? emptyDailyChallengeRecord(todayKey);
  const challengeQuestions = record.questionIds.map(id => questions.find(q => q.id === id)).filter((q): q is GeneralKnowledgeQuestion => Boolean(q));
  const questionsCompatible = !record.started || dailyQuestionsCompatible(record,questions);
  const currentQuestion = questionsCompatible && record.started && !record.completed ? questions.find(q => q.id === record.questionIds[record.currentIndex]) ?? null : null;
  const selectedAnswer = record.answers[String(record.currentIndex)] ?? null;
  const correctCount = day?.history?.correctCount ?? calculateChoiceResults(challengeQuestions, record.answers).correctCount;
  const rewardSummary = quizRewardSummary(challengeQuestions.map(adaptDailyQuestion), record.answers, "daily", snapshot.doc.rewards ?? {}, record.completed);
  const rewardXP = record.completed ? snapshot.doc.rewards?.[`day:${record.dateKey}`] ?? LEGACY_REWARD_RULES.daily + correctCount * LEGACY_REWARD_RULES.dailyCorrect : rewardSummary.totalXP;
  const currentDate = () => getAthensDateKey() === todayKey;
  async function startChallenge() {
    if (!snapshot.ready || !preferencesLoaded || !currentDate() || record.started || record.completed) return;
    const next = createSharedDailyRecord(todayKey,questions);
    if (!next) return;
    dailyStore.commitRecord(next,day);
    await dailyStore.flushLocal();
  }
  async function answerQuestion(answerIndex: number) {
    if (!questionsCompatible || !currentDate() || !record.started || record.completed || record.answers[String(record.currentIndex)] !== undefined) return;
    if (!currentQuestion || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= currentQuestion.answers.length) return;
    const session = dailyRecordSession(record, questions);
    if (!session) return;
    const transition = submitQuizAnswer(session, questionToken(session), answerIndex);
    if (!transition.changed) return;
    dailyStore.commitRecord(updateDailyRecord(record, transition.session), day);
    await dailyStore.flushLocal();
  }
  async function nextQuestion() {
    if (!questionsCompatible || !currentDate() || !record.started || record.completed || selectedAnswer === null) return;
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
  return { questionsCompatible, resultDetails: day?.details, rewardSummary, rewardXP, todayKey, record, isLoading: !snapshot.ready || !preferencesLoaded, challengeQuestions, currentQuestion, selectedAnswer, correctCount, startChallenge, answerQuestion, nextQuestion, resetChallengeForDevelopment, accountScoped: Boolean(snapshot.userId), reviewAvailable: questionsCompatible };
}
