import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Animated } from "react-native";
import { motionAllowed, playPreferences } from "./preferences";

export function usePlayMotion() {
  return motionAllowed(useSyncExternalStore(playPreferences.subscribe, playPreferences.getSnapshot, playPreferences.getSnapshot));
}
/** A restored locked answer is already active at mount, so it never pulses. */
export function AnswerMotion({ active, children }: { active: boolean; children: ReactNode }) {
  const enabled = usePlayMotion(), previous = useRef(active), [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const fresh = active && !previous.current; previous.current = active;
    if (!enabled || !fresh) { scale.setValue(1); return; }
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.025, duration: 90, useNativeDriver: true, isInteraction: false }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start(); return () => { animation.stop(); scale.setValue(1); };
  }, [active, enabled, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
