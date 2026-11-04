/**
 * Small progress indicators only. Reanimated updates the fill widths on the
 * UI thread; no React state, timers, looping effects or layout transitions.
 */
import { useEffect } from "react";
import { StyleSheet, type DimensionValue } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withSequence, withTiming,
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

/**
 * A soft *interior* halo, not another ring outline. Briefly brightens when
 * loaded completion changes; there is never a permanent pulse/loop.
 */
export function ProgressRingGlow({ progress, ready }: { progress: number; ready: boolean }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const target = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  useEffect(() => {
    cancelAnimation(opacity);
    if (!ready || target === 0) {
      opacity.value = 0;
      return;
    }
    opacity.value = 0.085;
    if (!reduced) {
      opacity.value = withDelay(430, withSequence(
        withTiming(0.19, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0.085, { duration: 760, easing: Easing.inOut(Easing.sin) }),
      ));
    }
    return () => cancelAnimation(opacity);
  }, [target, ready, reduced, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View testID="progress-ring-glow" pointerEvents="none"
    accessible={false} style={[styles.ringGlow, animatedStyle]} />;
}

/** A single gentle surface lift within the actual primary CTA.
 * Rendered beneath the button label and clipped to its rounded shape:
 * unlike the old 1.4px stripe, it doesn't look like a rendering artifact.
 */
export function ProgressActionHighlight() {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.025);
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.025;
    if (!reduced) {
      opacity.value = withDelay(540, withSequence(
        withTiming(0.085, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0.025, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ));
    }
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View testID="progress-action-highlight" pointerEvents="none"
    accessible={false} style={[styles.actionHighlight, animatedStyle]} />;
}

const styles = StyleSheet.create({
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#A89BFF" },
  readingFill: { backgroundColor: "#7CB8BA" },
  ringGlow: {
    position: "absolute", top: "17%", bottom: "17%", left: "17%", right: "17%",
    backgroundColor: "#A89BFF", borderRadius: 999,
  },
  actionHighlight: {
    ...StyleSheet.absoluteFill, borderRadius: 15,
    backgroundColor: "#FFFFFF",
  },
});
