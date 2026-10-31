import { playerTitle, LEGACY_REWARD_RULES } from "../gamification/rules";
import { totalRewardXP, type RewardLedger } from "../gamification/rewards";
import type { Lesson } from "../data/lessons";
import type { DailyChallengeHistoryEntry } from "./dailyChallengeHistory";
import { getAthensDateKey } from "./dailyChallenge";
import { lessonQuizMatches, type CompletionEvents } from "./learningActivity";
import type { WeeklyAnswers } from "./weeklyReview";

export const XP_RULES = LEGACY_REWARD_RULES;

/** XP measures participation; quiz points measure accuracy. There are no streak penalties. */
export function levelProgress(xp: number) {
  const safe = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  // Level n begins at 100 * (n - 1) * n: 0, 200, 600, 1200...
  const level = Math.floor((1 + Math.sqrt(1 + safe / 25)) / 2);
  const start = 100 * (level - 1) * level, next = 100 * level * (level + 1);
  return { level, title: playerTitle(level), earned: safe - start, required: next - start, remaining: next - safe };
}

export function dailyXP(correctCount: number) {
  return XP_RULES.daily + Math.max(0, Math.min(7, Math.floor(correctCount))) * XP_RULES.dailyCorrect;
}

/** Activity projects learning metrics; live XP comes from the permanent ledger.
 * Without a ledger, retain the frozen v1 projection for compatibility tests.
 * Immediate lesson answers/practice are familiarity; delayed review is recall.
 */
export function knowledgeProfile(catalogue: readonly Lesson[], completedIds: readonly string[], events: CompletionEvents, reviews: WeeklyAnswers, history: readonly DailyChallengeHistoryEntry[], today: string, rewards?: RewardLedger) {
  const byId = new Map(catalogue.map(l => [l.id, l]));
  const rows = Object.entries(events).filter(([, e]) => getAthensDateKey(new Date(e.at)) <= today)
    .sort(([aId, a], [bId, b]) => a.at - b.at || aId.localeCompare(bId));
  const first = new Map<string, (typeof rows)[number][1]>();
  for (const [, event] of rows) if (!first.has(event.lessonId)) first.set(event.lessonId, event);
  const completed = new Set([...completedIds, ...first.keys()]);
  const explored = new Set([...completed].map(id => byId.get(id)?.categoryId).filter((id): id is string => !!id));
  const learningXP = completed.size * XP_RULES.lesson + [...first.values()].reduce((sum, e) =>
    sum + (e.wasCompleted ? 0 : Math.round(XP_RULES.lessonAccuracy * e.correctCount / e.questionCount)), 0);
  const recalled = new Set<string>();
  for (const review of Object.values(reviews)) {
    const source = events[review.sourceId], lesson = source && byId.get(source.lessonId);
    if (!lesson || getAthensDateKey(new Date(review.at)) > today ||
      getAthensDateKey(new Date(source.at)) >= review.week ||
      !source.missedQuestionIndices?.includes(review.questionIndex) ||
      !lessonQuizMatches(lesson, source.quizKey) ||
      lesson.questions[review.questionIndex]?.correctIndex !== review.answerIndex) continue;
    const key = `${lesson.id}:${review.questionIndex}`;
    recalled.add(key);
  }
  const daily = new Map(history.filter(h => h.dateKey <= today).map(h => [h.dateKey, h]));
  const challengeXP = [...daily.values()].reduce((sum, h) => sum + dailyXP(h.correctCount), 0);
  const recallXP = recalled.size * XP_RULES.recall, explorationXP = explored.size * XP_RULES.category;
  const totalXP = rewards === undefined ? learningXP + challengeXP + recallXP + explorationXP : totalRewardXP(rewards);
  const sum = (prefix: string) => Object.entries(rewards ?? {}).filter(([id]) => id.startsWith(prefix)).reduce((s, [, xp]) => s + xp, 0);
  const badges = [
    { id: "first", title: "Πρώτη ανακάλυψη", current: completed.size, target: 1 },
    { id: "curious", title: "Περίεργο πνεύμα", current: completed.size, target: 5 },
    { id: "explorer", title: "Εξερευνητής", current: explored.size, target: Math.min(3, new Set(catalogue.map(l => l.categoryId)).size) || 3 },
    { id: "recall", title: "Το θυμήθηκα!", current: recalled.size, target: 1 },
  ].map(badge => ({ ...badge, unlocked: badge.current >= badge.target }));
  return { totalXP, learningXP: rewards === undefined ? learningXP : sum("lesson:"), challengeXP: rewards === undefined ? challengeXP : sum("day:"), recallXP: rewards === undefined ? recallXP : sum("recall:") + sum("review:"), explorationXP: rewards === undefined ? explorationXP : sum("category:"), completed: completed.size,
    explored: explored.size, recalled: recalled.size, badges, ...levelProgress(totalXP) };
}
