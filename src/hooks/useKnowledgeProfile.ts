import { buildKnowledgeModel } from "../knowledge/model";
import { mergeRewardLedgers } from "../gamification/rewards";
import { useMemo } from "react";
import { lessons } from "../data/lessons";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { knowledgeProfile } from "../utils/knowledgeScoring";
import { useAthensDate } from "./useAthensDate";

export function useKnowledgeProfile() {
  const learning = useLearningSnapshot(), daily = useDailySnapshot(), today = useAthensDate();
  const profile = useMemo(() => { const base = knowledgeProfile(lessons, learning.backup.completedIds,
    learning.activity, learning.weeklyReviews, dailyHistory(daily.doc), today, mergeRewardLedgers(learning.rewards, daily.doc.rewards));
    const recalled = buildKnowledgeModel({ ...learning.backup, activity: learning.activity, weeklyReviews: learning.weeklyReviews, knowledgeReviews: learning.knowledgeReviews }, daily.doc, today).recalled;
    return { ...base, recalled, badges: base.badges.map(b => b.id === "recall" ? { ...b, current: recalled, unlocked: recalled >= b.target } : b) };
  },
  [learning.backup, learning.activity, learning.weeklyReviews, learning.rewards, learning.knowledgeReviews, daily.doc, today]);
  return { profile, ready: learning.ready && daily.ready };
}
