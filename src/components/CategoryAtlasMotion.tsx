/** Lightweight, UI-thread-only motion for the fixed Category Atlas.
 * Static islands, routes, labels and touch geometry remain unchanged.
 * The normal (non-fitted) FantasyMap is intentionally unaffected.
 */
import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import { Circle, Path, Rect } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useReducedMotion,
  useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const soften = Easing.inOut(Easing.sin);

/** A single low-opacity layer breathes over the existing static nebula.
 * No geometric transformations, timers on JS, or per-frame React renders.
 */
export function AtlasAtmosphereBreath({ height }: { height: number }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.07);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.07;
    if (reduced) return;
    opacity.value = withDelay(900, withRepeat(withSequence(
      withTiming(0.17, { duration: 6500, easing: soften }),
      withTiming(0.07, { duration: 6500, easing: soften }),
      withDelay(1800, withTiming(0.07, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  return <AnimatedRect testID="atlas-motion-atmosphere" pointerEvents="none"
    x={40} y={height * 0.13} width={280} height={height * 0.72}
    fill="url(#atlas-nebula)" opacity={0.07}
    animatedProps={reduced ? undefined : animatedProps} />;
}

/** Five stars at most; the other 50 static stars never change or re-render. */
export function AtlasTwinkleStar({ cx, cy, index }: {
  cx: number; cy: number; index: number;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.17);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.17;
    if (reduced) return;
    opacity.value = withDelay(1100 + index * 730, withRepeat(withSequence(
      withTiming(0.58, { duration: 1400, easing: soften }),
      withTiming(0.17, { duration: 1800, easing: soften }),
      withDelay(7300, withTiming(0.17, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [index, reduced, opacity]);

  return <AnimatedCircle testID={`atlas-motion-star-${index}`}
    pointerEvents="none" cx={cx} cy={cy} r={1.8} fill="#E6D7BF"
    opacity={0.17} animatedProps={reduced ? undefined : animatedProps} />;
}

/** Press-in glint stays within the existing coastline and never takes taps. */
export function AtlasDestinationFeedback({ d, active }: {
  d: string; active: boolean;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = reduced ? (active ? 0.42 : 0)
      : withTiming(active ? 0.42 : 0, { duration: active ? 90 : 180 });
    return () => cancelAnimation(opacity);
  }, [active, reduced, opacity]);

  return <AnimatedPath testID="atlas-motion-press-glint" pointerEvents="none"
    d={d} fill="none" stroke="#EBD9BF" strokeWidth={3.2}
    opacity={reduced && active ? 0.42 : 0}
    animatedProps={reduced ? undefined : animatedProps} />;
}


/** Category shortcut progress follows the real percentage without changing
 * the card's dimensions or forcing any map re-layout. */
export function AtlasProgressFill({ percent }: { percent: number }) {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    width: (value.value + "%") as DimensionValue,
  }));
  useEffect(() => {
    cancelAnimation(value);
    const target = Math.max(0, Math.min(100, percent));
    value.value = reduced ? target
      : withTiming(target, { duration: 550, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(value);
  }, [percent, reduced, value]);
  return <Animated.View testID="atlas-continue-progress-fill"
    style={[styles.progressFill, animatedStyle]} pointerEvents="none">
    <View style={styles.progressSheen} />
  </Animated.View>;
}

/** A one-time restrained card perimeter glint, not a looping pulse. */
export function AtlasContinueAccent() {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0.16);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  useEffect(() => {
    cancelAnimation(glow);
    glow.value = 0.16;
    if (reduced) return;
    glow.value = withDelay(360, withSequence(
      withTiming(0.48, { duration: 390, easing: Easing.out(Easing.cubic) }),
      withTiming(0.16, { duration: 820, easing: Easing.out(Easing.cubic) }),
    ));
    return () => cancelAnimation(glow);
  }, [reduced, glow]);
  return <Animated.View testID="atlas-continue-accent"
    pointerEvents="none" accessible={false}
    style={[styles.continueAccent, animatedStyle]} />;
}

/** Small diagonal arrow cue once on entry, with no permanent movement. */
export function AtlasContinueArrow() {
  const reduced = useReducedMotion();
  const lift = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lift.value }, { translateY: -lift.value * 0.55 }],
  }));
  useEffect(() => {
    cancelAnimation(lift);
    lift.value = 0;
    if (reduced) return;
    lift.value = withDelay(680, withSequence(
      withTiming(3, { duration: 230, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) }),
    ));
    return () => cancelAnimation(lift);
  }, [reduced, lift]);
  return <Animated.Text testID="atlas-continue-arrow"
    style={[styles.continueArrow, animatedStyle]}>↗</Animated.Text>;
}

const styles = StyleSheet.create({
  progressFill: {
    height: "100%", borderRadius: 5, backgroundColor: "#B1A5FF",
  },
  progressSheen: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
    backgroundColor: "#EEE6FF", opacity: 0.35,
  },
  continueAccent: {
    ...StyleSheet.absoluteFill, borderRadius: 18, borderWidth: 1,
    borderColor: "#CABDF7",
  },
  continueArrow: {
    color: "#171B2A", fontSize: 22, lineHeight: 28, fontWeight: "900",
  },
});
