import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Animated } from "react-native";
import { motionAllowed, playPreferences } from "./preferences";

export function usePlayMotion() {
  return motionAllowed(useSyncExternalStore(playPreferences.subscribe, playPreferences.getSnapshot, playPreferences.getSnapshot));
}
/** Pulse on a new selection or a changed value. Initial and restored states stay still. */
export function AnswerMotion({ active = false, pulseKey, children }: {
  active?: boolean;
  pulseKey?: string | number;
  children: ReactNode;
}) {
  const enabled = usePlayMotion();
  const previous = useRef({ active, pulseKey });
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const valueChanged = pulseKey !== undefined && pulseKey !== previous.current.pulseKey;
    const selected = active && !previous.current.active;
    previous.current = { active, pulseKey };
    if (!enabled || (!valueChanged && !selected)) { scale.setValue(1); return; }
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: valueChanged ? 1.045 : 1.025, duration: 90, useNativeDriver: true, isInteraction: false }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start();
    return () => { animation.stop(); scale.setValue(1); };
  }, [active, pulseKey, enabled, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
