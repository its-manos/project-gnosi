import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { usePlayMotion } from "../play/motion";

/** One native fade/lift per forward screen entry. Transforms preserve layout.
 * Hydrating preferences or returning from a question never replays the reveal. */
export default function ScreenEntrance({ children, style, testID = "lesson-entrance", animateOnMount = true, duration = 340, rise = 12 }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string;
  animateOnMount?: boolean; duration?: number; rise?: number;
}) {
  const motion = usePlayMotion();
  const enabled = motion && animateOnMount;
  const progress = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  const entered = useRef(false);
  useEffect(() => {
    if (!enabled) { progress.stopAnimation(); progress.setValue(1); entered.current = true; return; }
    if (entered.current) return;
    entered.current = true;
    const animation = Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [enabled, progress, duration]);
  return <Animated.View testID={testID} style={[style, { opacity: progress,
    transform: [{ translateY: enabled ? progress.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) : 0 }] }]}>{children}</Animated.View>;
}
