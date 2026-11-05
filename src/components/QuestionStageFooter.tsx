import { StyleSheet, View } from "react-native";
import ActionButton from "./ActionButton";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import { colors } from "../theme";

type Props = {
  action: QuestionStageAction | null;
  /** Use the actual bottom inset for screens outside native modals. */
  bottomInset?: number;
};

/** Outside the scrolling question content: always in reach, never obscured by
 * longer explanations or large accessibility text. */
export default function QuestionStageFooter({ action, bottomInset = 12 }: Props) {
  return <View testID="question-stage-footer"
    style={[styles.shell, { paddingBottom: Math.max(12, bottomInset) }]}>
    <View style={styles.content}>
      <ActionButton label={action?.label ?? "Επιβεβαίωση →"}
        disabled={!action || action.disabled}
        onPress={action?.onPress ?? (() => {})} style={styles.action} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 1,
    borderTopColor: "#41415F",
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  content: { width: "100%", maxWidth: 640, alignSelf: "center" },
  action: { marginTop: 0, minHeight: 52 },
});
