import { useMemo } from "react";
import { useLearningSnapshot } from "../state/LearningSession";
import { buildMistakeModel } from "../knowledge/mistakes";
export function useMistakesModel() {
  const learning = useLearningSnapshot();
  const model = useMemo(() => buildMistakeModel(learning.mistakes), [learning.mistakes]);
  return { model, ready: learning.ready };
}
