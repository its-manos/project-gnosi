import { LEGACY_REWARD_RULES } from "./rules";
import type { Lesson } from "../data/lessons";
import type { DailyChallengeHistoryEntry } from "../utils/dailyChallengeHistory";
import { lessonQuizMatches, type CompletionEvents } from "../utils/learningActivity";
import { type WeeklyAnswers, weeklyPlan } from "../utils/weeklyReview";
import { adaptLessonQuestion } from "../quiz/adapters";
import { hasReward, type RewardLedger } from "./rewards";
/** Frozen v1 credit. Missing receipts from old clients are credited only once. */
export function migrateLearningRewards(catalogue: readonly Lesson[], completed: readonly string[], events: CompletionEvents, reviews: WeeklyAnswers, previous: RewardLedger = {}): RewardLedger {
  const ledger = { ...previous }, first = new Map<string, CompletionEvents[string]>();
  for (const [, event] of Object.entries(events).sort(([aId, a], [bId, b]) => a.at - b.at || aId.localeCompare(bId))) if (!first.has(event.lessonId)) first.set(event.lessonId, event);
  for (const id of new Set([...completed, ...first.keys()])) {
    const key = `lesson:${id}`, lesson = catalogue.find(l => l.id === id), event = first.get(id);
    if (!hasReward(ledger, key)) {
      ledger[key] = LEGACY_REWARD_RULES.lesson + (event && !event.wasCompleted ? Math.round(LEGACY_REWARD_RULES.lessonAccuracy * event.correctCount / event.questionCount) : 0);
      if (lesson) for (let i = 0; i < lesson.questions.length; i++) ledger[`seen:${adaptLessonQuestion(lesson, i).id}`] = 0;
    }
    if (lesson && !hasReward(ledger, `category:${lesson.categoryId}`)) ledger[`category:${lesson.categoryId}`] = LEGACY_REWARD_RULES.category;
  }
  for (const review of Object.values(reviews)) {
    const source = events[review.sourceId], lesson = source && catalogue.find(l => l.id === source.lessonId);
    if (lesson && lessonQuizMatches(lesson, source.quizKey) && lesson.questions[review.questionIndex]?.correctIndex === review.answerIndex && !hasReward(ledger, `recall:${lesson.id}:${review.questionIndex}`)) ledger[`recall:${lesson.id}:${review.questionIndex}`] = LEGACY_REWARD_RULES.recall;
  }
  for (const week of new Set(Object.values(reviews).map(r => r.week))) {
    const plan = weeklyPlan(events, reviews, week);
    if (plan.length && plan.every(q => reviews[q.id]) && !hasReward(ledger, `review:${week}`)) ledger[`review:${week}`] = 0;
  }
  return ledger;
}
export function migrateDailyRewards(history: readonly DailyChallengeHistoryEntry[], previous: RewardLedger = {}): RewardLedger {
  const ledger = { ...previous };
  for (const day of history) {
    const key = `day:${day.dateKey}`;
    if (hasReward(ledger, key)) continue;
    ledger[key] = LEGACY_REWARD_RULES.daily + day.correctCount * LEGACY_REWARD_RULES.dailyCorrect;
    for (const id of day.questionIds) ledger[`seen:daily:${id}`] = 0;
  }
  return ledger;
}
