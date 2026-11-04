/** Adventure Path-specific visual polish. Does not affect map geometry or scroll. */
import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import { colors } from "../theme";

export function AdventureProgressFill({ percent }: { percent: number }) {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(value);
    const target = Math.max(0, Math.min(100, percent));
    value.value = reduced ? target : withTiming(target, {
      duration: 600, easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(value);
  }, [percent, reduced, value]);
  const animatedStyle = useAnimatedStyle(() => ({
    width: (value.value + "%") as DimensionValue,
  }));
  return <Animated.View testID="adventure-progress-fill"
    style={[styles.progressFill, animatedStyle]} />;
}

export function AdventureActiveHalo() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1.15);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.75 + (scale.value - 1.12) * 2.5,
  }));
  useEffect(() => {
    cancelAnimation(scale);
    if (reduced) { scale.value = 1.15; return; }
    scale.value = withRepeat(withSequence(
      withTiming(1.19, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.12, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(scale);
  }, [reduced, scale]);
  return <Animated.View pointerEvents="none" accessible={false}
    testID="adventure-active-halo" style={[styles.halo, animatedStyle]} />;
}

const styles = StyleSheet.create({
  progressFill: { height: "100%", backgroundColor: colors.accentLight, borderRadius: 5 },
  halo: {
    position: "absolute", width: 74, height: 74, borderRadius: 37,
    borderColor: "#8C7CDE", borderWidth: 1, backgroundColor: "#25213E",
  },
});
