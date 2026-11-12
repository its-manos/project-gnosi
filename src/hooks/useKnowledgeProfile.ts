import { playerTrophies } from "../gamification/trophies";
import { learningTrophyMetrics, dailyTrophyMetrics } from "../gamification/trophyProgress";
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
    const trophies = playerTrophies({
      ...learningTrophyMetrics(lessons, completedIds, activity, rewards, today),
      ...dailyTrophyMetrics(dailyHistory(daily.doc), today),
    });
    return { ...base, recalled, badges, trophies };
  }, [completedIds, activity, weeklyReviews, rewards, knowledgeReviews, daily.doc, today]);
  return { profile, ready: ready && daily.ready };
}
