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
  const glowOpacity = useSharedValue(0.55);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  useEffect(() => {
    cancelAnimation(glowOpacity);
    if (reduced) { glowOpacity.value = 0.65; return; }
    // A stationary halo that only changes opacity avoids wobbling/scaling
    // around the medallion and stays crisp on Android and iPhone.
    glowOpacity.value = withRepeat(withSequence(
      withTiming(0.82, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.42, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(glowOpacity);
  }, [reduced, glowOpacity]);
  return <Animated.View pointerEvents="none" accessible={false}
    testID="adventure-active-halo" style={[styles.halo, animatedStyle]} />;
}

const styles = StyleSheet.create({
  progressFill: { height: "100%", backgroundColor: colors.accentLight, borderRadius: 5 },
  halo: {
    position: "absolute", top: -3, left: -3,
    width: 80, height: 80, borderRadius: 40,
    borderColor: "#B7A7F0", borderWidth: 1.5,
    backgroundColor: "transparent",
  },
});
