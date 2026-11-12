import type { Lesson } from '../data/lessons';
import type { CompletionEvents } from '../utils/learningActivity';
import type { RewardLedger } from './rewards';
import type { DailyChallengeHistoryEntry } from '../utils/dailyChallengeHistory';
import { getAthensDateKey } from '../utils/dailyChallenge';
import { calculateDailyChallengeProgress } from '../utils/progressStats';
/** Shared projection for the Profile and local milestone notifications. */
export function learningTrophyMetrics(catalogue: readonly Lesson[], completedIds: readonly string[], activity: CompletionEvents, rewards: RewardLedger = {}, today: string) {
  const completed = new Set([...completedIds, ...Object.values(activity).filter(event => getAthensDateKey(new Date(event.at)) <= today).map(event => event.lessonId)]);
  const byId = new Map(catalogue.map(lesson => [lesson.id, lesson.categoryId]));
  const worlds = new Set([...completed].map(id => byId.get(id)).filter(Boolean));
  return { lessons: completed.size, worlds: worlds.size,
    revision: Object.keys(rewards).filter(key => key.startsWith('review:') && key.slice(7) <= today).length,
    hangman: Object.entries(rewards).filter(([key, xp]) => key.startsWith('game:hangman:') && key.slice(13, 23) <= today && xp > 0).length };
}
export function dailyTrophyMetrics(history: DailyChallengeHistoryEntry[], today: string) {
  const stats = calculateDailyChallengeProgress(history.filter(item => item.dateKey <= today), today);
  return { daily: stats.completedChallenges, streak: stats.longestStreak };
}
