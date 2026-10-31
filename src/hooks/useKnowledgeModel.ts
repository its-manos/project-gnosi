import { useMemo } from "react";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { buildKnowledgeModel } from "../knowledge/model";
import { useAthensDate } from "./useAthensDate";

export function useKnowledgeModel() {
  const learning = useLearningSnapshot(), daily = useDailySnapshot(), today = useAthensDate();
  const model = useMemo(() => buildKnowledgeModel({ ...learning.backup, activity: learning.activity, weeklyReviews: learning.weeklyReviews, knowledgeReviews: learning.knowledgeReviews }, daily.doc, today), [learning.backup, learning.activity, learning.weeklyReviews, learning.knowledgeReviews, daily.doc, today]);
  return { model, today, ready: learning.ready && daily.ready };
}
