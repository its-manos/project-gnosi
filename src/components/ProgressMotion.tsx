/**
 * Small progress indicators only. Reanimated updates the fill widths on the
 * UI thread; no React state, timers, looping effects or layout transitions.
 */
import { useEffect } from "react";
import { StyleSheet, type DimensionValue } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from "react-native-reanimated";

type Tone = "knowledge" | "reading";

export function ProgressBarFill({ percent, tone }: { percent: number; tone: Tone }) {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);
  const target = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  useEffect(() => {
    cancelAnimation(value);
    value.value = reduced ? target
      : withTiming(target, { duration: 620, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(value);
  }, [target, reduced, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${value.value}%` as DimensionValue,
  }));
  return <Animated.View testID={`progress-fill-${tone}`} pointerEvents="none"
    style={[styles.fill, tone === "reading" && styles.readingFill, animatedStyle]} />;
}

const styles = StyleSheet.create({
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#A89BFF" },
  readingFill: { backgroundColor: "#7CB8BA" },
});
