/** Lightweight, UI-thread-only motion for the fixed Category Atlas.
 * Static islands, routes, labels and touch geometry remain unchanged.
 * Ambient loops animate only small native-view opacity, never SVG properties.
 * One-shot destination glints retain their exact coastline shape.
 * The normal (non-fitted) FantasyMap is intentionally unaffected.
 */
import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Svg, { Ellipse, Path, RadialGradient, Stop, Defs } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useReducedMotion,
  useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const soften = Easing.inOut(Easing.sin);

/** A compact, self-contained gradient stays static inside a composited view.
 * Only the wrapper's native opacity animates, so the map SVG never repaints.
 */
export function AtlasAtmosphereBreath() {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.07);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
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

  return <Animated.View testID="atlas-motion-atmosphere"
    pointerEvents="none" accessible={false}
    style={[styles.atmosphere, animatedStyle]}>
    <Svg width="100%" height="100%" viewBox="0 0 240 300" pointerEvents="none">
      <Defs>
        <RadialGradient id="atlas-native-ambient" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#8C7CB0" stopOpacity={0.9} />
          <Stop offset="65%" stopColor="#5C638B" stopOpacity={0.38} />
          <Stop offset="100%" stopColor="#5C638B" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={120} cy={150} rx={120} ry={150} fill="url(#atlas-native-ambient)" />
    </Svg>
  </Animated.View>;
}

/** Five tiny native-view dots; the other fifty chart stars never animate. */
export function AtlasTwinkleStar({ cx, cy, index, mapHeight }: {
  cx: number; cy: number; index: number; mapHeight: number;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.17);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
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

  return <Animated.View testID={`atlas-motion-star-${index}`}
    pointerEvents="none" accessible={false}
    style={[styles.star, {
      left: `${cx / 360 * 100}%`,
      top: `${cy / mapHeight * 100}%`,
    }, animatedStyle]} />;
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
  atmosphere: {
    position: "absolute", left: "10%", top: "18%",
    width: "76%", height: "65%",
  },
  star: {
    position: "absolute", width: 3.6, height: 3.6, borderRadius: 1.8,
    backgroundColor: "#E6D7BF",
  },
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
