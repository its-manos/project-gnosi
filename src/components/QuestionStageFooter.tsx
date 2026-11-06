import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { usePlayMotion } from "../play/motion";
import ActionButton from "./ActionButton";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";

type Props = {
  action: QuestionStageAction | null;
  /** Use the actual bottom inset for screens outside native modals. */
  bottomInset?: number;
};

/** Fixed footer: confirm and continue never change its height or block the
 * question. Give a quiet cue when confirmation becomes available or the purpose changes. */
export default function QuestionStageFooter({ action, bottomInset = 12 }: Props) {
  const motionEnabled = usePlayMotion();
  const mode = action && !action.label.startsWith("Επιβεβαίωση") ? "continue" : "confirm";
  const confirmState = mode !== "confirm" || !action ? "idle" : action.disabled ? "waiting" : "ready";
  const previous = useRef({ mode, confirmState });
  const [opacity] = useState(() => new Animated.Value(1));
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const changed = previous.current.mode !== mode;
    const becameReady = confirmState === "ready" && previous.current.confirmState === "waiting";
    previous.current = { mode, confirmState };
    if ((!changed && !becameReady) || !motionEnabled) {
      opacity.setValue(1);
      offset.setValue(0);
      return;
    }
    opacity.setValue(changed ? 0.82 : 0.9);
    offset.setValue(changed ? 4 : 2);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 165, useNativeDriver: true, isInteraction: false }),
      Animated.timing(offset, { toValue: 0, duration: 195, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(1);
      offset.setValue(0);
    };
  }, [mode, confirmState, motionEnabled, opacity, offset]);

  return <View testID="question-stage-footer"
    style={[styles.shell, { paddingBottom: Math.max(12, bottomInset) }]}>
    <Animated.View style={[styles.content, { opacity, transform: [{ translateY: offset }] }]}>
      <ActionButton label={action?.label ?? "Επιβεβαίωση →"}
        disabled={!action || action.disabled}
        onPress={action?.onPress ?? (() => {})} style={styles.action} />
    </Animated.View>
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
