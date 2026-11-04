/** Adventure Path-specific visual polish. Does not affect map geometry or scroll. */
import { useEffect } from "react";
import { StyleSheet, Text, View, type DimensionValue } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withTiming,
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
    style={[styles.progressFill, animatedStyle]}>
    <View pointerEvents="none" accessible={false} style={styles.progressSheen} />
  </Animated.View>;
}

/** A single, short border glint when the Continue card opens.
 * The outline is decorative and never captures taps or changes layout.
 */
export function AdventureContinueAccent() {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0.22);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  useEffect(() => {
    cancelAnimation(glow);
    if (reduced) { glow.value = 0.22; return; }
    glow.value = withDelay(460, withSequence(
      withTiming(0.58, { duration: 430, easing: Easing.out(Easing.cubic) }),
      withTiming(0.22, { duration: 850, easing: Easing.out(Easing.cubic) }),
    ));
    return () => cancelAnimation(glow);
  }, [reduced, glow]);
  return <Animated.View testID="adventure-continue-accent"
    pointerEvents="none" accessible={false} style={[styles.continueAccent, animatedStyle]} />;
}

/** One small arrow nudge on entry, not a distracting perpetual bounce. */
export function AdventureContinueArrow() {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  useEffect(() => {
    cancelAnimation(x);
    x.value = 0;
    if (reduced) return;
    x.value = withDelay(700, withSequence(
      withTiming(3, { duration: 240, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }),
    ));
    return () => cancelAnimation(x);
  }, [reduced, x]);
  return <Animated.Text testID="adventure-continue-chevron"
    style={[styles.continueArrow, animatedStyle]}>›</Animated.Text>;
}

export function AdventureActiveHalo() {
  const reduced = useReducedMotion();
  // One shared value drives a single soft pulse, rather than scaling the
  // checkpoint itself or stacking multiple moving concentric borders.
  const pulse = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.13 }],
    opacity: 0.78 * (1 - pulse.value),
  }));
  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
    if (reduced) return; // A visible, stationary outline.
    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
      // Pause while invisible, then reset behind the coin for the next pulse.
      withDelay(550, withTiming(0, { duration: 0 })),
    ), -1, false);
    return () => cancelAnimation(pulse);
  }, [reduced, pulse]);
  return <Animated.View pointerEvents="none" accessible={false}
    testID="adventure-active-halo" style={[styles.halo, animatedStyle]} />;
}

const styles = StyleSheet.create({
  progressFill: {
    height: "100%", backgroundColor: colors.accentLight,
    borderRadius: 5, overflow: "hidden",
  },
  progressSheen: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
    backgroundColor: "#EEE6FF", opacity: 0.38,
  },
  continueAccent: {
    ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1,
    borderColor: "#C7B6FF",
  },
  continueArrow: {
    color: "#1C1B32", fontSize: 30, lineHeight: 36, fontWeight: "600", marginTop: -3,
  },
  halo: {
    // The 84pt ring starts just outside the 74pt wrapper. At maximum scale
    // its faded edge stays close to the marker, not over neighboring titles.
    position: "absolute", top: -5, left: -5,
    width: 84, height: 84, borderRadius: 42,
    borderColor: "#BCAAFB", borderWidth: 2.5,
    backgroundColor: "rgba(159,137,242,0.16)",
  },
});
