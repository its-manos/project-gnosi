import { useMemo } from "react";
import { lessons } from "../data/lessons";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { knowledgeProfile } from "../utils/knowledgeScoring";
import { useAthensDate } from "./useAthensDate";

export function useKnowledgeProfile() {
  const learning = useLearningSnapshot(), daily = useDailySnapshot(), today = useAthensDate();
  const profile = useMemo(() => knowledgeProfile(lessons, learning.backup.completedIds,
    learning.activity, learning.weeklyReviews, dailyHistory(daily.doc), today),
  [learning.backup.completedIds, learning.activity, learning.weeklyReviews, daily.doc, today]);
  return { profile, ready: learning.ready && daily.ready };
}
