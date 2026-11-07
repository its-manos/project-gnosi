import { useEffect, type PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

export default function HangmanFeedbackMotion({ mistakes, won, children, style }: PropsWithChildren<{
  mistakes: number; won: boolean; style?: StyleProp<ViewStyle>;
}>) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!reduced && mistakes > 0) x.value = withSequence(
      withTiming(-5, { duration: 55 }), withTiming(5, { duration: 65 }),
      withTiming(-3, { duration: 55 }), withTiming(0, { duration: 65 }));
    return () => { cancelAnimation(x); x.value = 0; };
  }, [mistakes, reduced, x]);
  useEffect(() => {
    if (!reduced && won) scale.value = withSequence(
      withTiming(1.08, { duration: 180 }), withTiming(1, { duration: 220 }));
    return () => { cancelAnimation(scale); scale.value = 1; };
  }, [won, reduced, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { scale: scale.value }] }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
