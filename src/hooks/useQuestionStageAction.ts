import { useCallback, useState } from "react";

export type QuestionStageAction = {
  label: string;
  disabled: boolean;
  onPress: () => void;
};

/** Cards still own their unconfirmed drafts. A screen owns only the placement
 * of the confirmation button, so scoring and persistence remain unchanged. */
export function useQuestionStageAction(questionKey: string) {
  const [registered, setRegistered] = useState<{
    key: string;
    action: QuestionStageAction | null;
  }>({ key: questionKey, action: null });

  const onActionChange = useCallback((action: QuestionStageAction | null) => {
    setRegistered(previous =>
      previous.key === questionKey && previous.action === action
        ? previous
        : { key: questionKey, action }
    );
  }, [questionKey]);

  return {
    action: registered.key === questionKey ? registered.action : null,
    onActionChange,
  };
}
