import { useMemo } from "react";
import { useLearningDataSnapshot } from "../state/LearningSession";
import { buildMistakeModel } from "../knowledge/mistakes";
export function useMistakesModel() {
  const learning = useLearningDataSnapshot();
  const model = useMemo(() => buildMistakeModel(learning.mistakes), [learning.mistakes]);
  return { model, ready: learning.ready };
}
