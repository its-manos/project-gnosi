import type { DailyChallengeHistoryEntry } from "./dailyChallengeHistory";

export type DailyChallengeProgressStats = {
  completedChallenges: number;
  totalPoints: number;
  totalCorrectAnswers: number;
  totalAnswers: number;
  accuracyPercent: number;
  currentStreak: number;
  longestStreak: number;
};

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Derive score, accuracy, and calendar-day streaks from completed daily quizzes. */
export function calculateDailyChallengeProgress(
  history: DailyChallengeHistoryEntry[],
  todayKey: string,
): DailyChallengeProgressStats {
  const uniqueHistory = [...new Map(history.map((item) => [item.dateKey, item])).values()];
  const completedDates = uniqueHistory.map((item) => item.dateKey).sort();
  const completedDateSet = new Set(completedDates);
  const completedChallenges = uniqueHistory.length;
  const totalCorrectAnswers = uniqueHistory.reduce((total, item) => total + item.correctCount, 0);
  const totalAnswers = completedChallenges * 7;

  let currentStreak = 0;
  let streakCursor = completedDateSet.has(todayKey)
    ? todayKey
    : shiftDateKey(todayKey, -1);
  if (completedDateSet.has(streakCursor)) {
    while (completedDateSet.has(streakCursor)) {
      currentStreak += 1;
      streakCursor = shiftDateKey(streakCursor, -1);
    }
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;
  for (const dateKey of completedDates) {
    runningStreak = previousDate && shiftDateKey(previousDate, 1) === dateKey
      ? runningStreak + 1
      : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = dateKey;
  }

  return {
    completedChallenges,
    totalPoints: uniqueHistory.reduce((total, item) => total + item.score, 0),
    totalCorrectAnswers,
    totalAnswers,
    accuracyPercent: totalAnswers > 0 ? Math.round((totalCorrectAnswers / totalAnswers) * 100) : 0,
    currentStreak,
    longestStreak,
  };
}
