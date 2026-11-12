import { playerTrophies } from "../gamification/trophies";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { countRecalledConcepts } from "../knowledge/model";
import { mergeRewardLedgers } from "../gamification/rewards";
import { useMemo } from "react";
import { lessons } from "../data/lessons";
import { useDailyDataSnapshot, useLearningDataSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { knowledgeProfile } from "../utils/knowledgeScoring";
import { useAthensDate } from "./useAthensDate";

export function useKnowledgeProfile() {
  const { backup: { completedIds }, activity, weeklyReviews, rewards, knowledgeReviews, ready } = useLearningDataSnapshot();
  const daily = useDailyDataSnapshot();
  const today = useAthensDate();
  const profile = useMemo(() => {
    const base = knowledgeProfile(
      lessons, completedIds, activity, weeklyReviews, dailyHistory(daily.doc), today,
      mergeRewardLedgers(rewards, daily.doc.rewards),
    );
    const recalled = countRecalledConcepts({ completedIds, activity, weeklyReviews, knowledgeReviews }, daily.doc, today);
    const badges = base.badges.map(badge =>
      badge.id === "recall" ? { ...badge, current: recalled, unlocked: recalled >= badge.target } : badge,
    );
    const history = dailyHistory(daily.doc).filter(item => item.dateKey <= today);
    const stats = calculateDailyChallengeProgress(history, today);
    const trophies = playerTrophies({ lessons: base.completed, worlds: base.explored,
      daily: stats.completedChallenges, streak: stats.longestStreak,
      // Permanent completion receipts keep earned milestones after later mistakes.
      revision: Object.keys(rewards ?? {}).filter(key => key.startsWith("review:") && key.slice(7) <= today).length,
      hangman: Object.entries(rewards ?? {}).filter(([key, xp]) => key.startsWith("game:hangman:") && key.slice(13, 23) <= today && xp > 0).length,
    });
    return { ...base, recalled, badges, trophies };
  }, [completedIds, activity, weeklyReviews, rewards, knowledgeReviews, daily.doc, today]);
  return { profile, ready: ready && daily.ready };
}
