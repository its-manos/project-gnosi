import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { usePlayMotion } from "../play/motion";

/** One small native pulse for a changed state; never loops or changes layout. */
export default function PvpPulse({ pulseKey, children, style, animateOnMount = false }: {
  pulseKey: string | number; children: ReactNode; style?: StyleProp<ViewStyle>; animateOnMount?: boolean;
}) {
  const motion = usePlayMotion();
  const previous = useRef(pulseKey);
  const first = useRef(true);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const changed = previous.current !== pulseKey || (first.current && animateOnMount);
    previous.current = pulseKey; first.current = false;
    if (!motion || !changed) { scale.setValue(1); return; }
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: animateOnMount ? 1.08 : 1.025, duration: 110, useNativeDriver: true, isInteraction: false }),
      Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start();
    return () => { animation.stop(); scale.setValue(1); };
  }, [pulseKey, motion, scale, animateOnMount]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}
