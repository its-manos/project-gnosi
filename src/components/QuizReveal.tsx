import { usePlayMotion } from "../play/motion";
import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated } from "react-native";

/** Calm native fade and six-point lift for question/feedback reveals.
 * No layout reflow, no scoring delay and no motion when accessibility asks
 * for reduced animations. */
export default function QuizReveal({ children }: { children: ReactNode }) {
  const enabled = usePlayMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [offset] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) { opacity.setValue(1); offset.setValue(0); return; }
    let mounted = true, changed = false;
    let animation: Animated.CompositeAnimation | undefined;
    const apply = (reduced: boolean) => {
      animation?.stop();
      if (reduced) { opacity.setValue(1); offset.setValue(0); return; }
      opacity.setValue(0);
      offset.setValue(6);
      animation = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 210, useNativeDriver: true, isInteraction: false }),
        Animated.timing(offset, { toValue: 0, duration: 260, useNativeDriver: true, isInteraction: false }),
      ]);
      animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", reduced => {
      changed = true;
      if (mounted && reduced) { animation?.stop(); opacity.setValue(1); offset.setValue(0); }
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (mounted && !changed) apply(reduced);
    }).catch(() => { if (mounted) { opacity.setValue(1); offset.setValue(0); } });
    return () => { mounted = false; subscription.remove(); animation?.stop(); };
  }, [opacity, offset, enabled]);
  return <Animated.View style={{ opacity, transform: [{ translateY: offset }] }}>{children}</Animated.View>;
}
