/**
 * Small, UI-thread-only ambient details for the Home Midnight Atlas.
 *
 * The map, coastlines, compass and layout stay static. Only opacity and
 * one decorative dash offset change; nothing affects touch or Yoga layout.
 */
import { useEffect } from "react";
import { Circle, Ellipse, Path } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedProps, useReducedMotion,
  useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const soft = Easing.inOut(Easing.sin);

/** One low-opacity ambient glow; the existing sky gradients do not animate. */
export function HomeAtlasAmbientGlow({ h }: { h: number }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.075);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.075;
    if (reduced) return;
    opacity.value = withDelay(1200, withRepeat(withSequence(
      withTiming(0.16, { duration: 7500, easing: soft }),
      withTiming(0.075, { duration: 7500, easing: soft }),
      withDelay(2000, withTiming(0.075, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  return <AnimatedEllipse testID="home-atlas-motion-glow" pointerEvents="none"
    cx={94} cy={h * 0.34} rx={170} ry={h * 0.19}
    fill="url(#home-atlas-breath)" opacity={0.075}
    animatedProps={reduced ? undefined : animatedProps} />;
}

/** Only four stars twinkle. The rest of the celestial chart is stationary. */
export function HomeAtlasTwinkleStar({ x, y, index }: {
  x: number; y: number; index: number;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.17);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.17;
    if (reduced) return;
    opacity.value = withDelay(1500 + index * 2100, withRepeat(withSequence(
      withTiming(0.66, { duration: 1700, easing: soft }),
      withTiming(0.17, { duration: 2100, easing: soft }),
      withDelay(9400, withTiming(0.17, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [index, reduced, opacity]);

  return <AnimatedCircle testID={`home-atlas-motion-star-${index}`}
    pointerEvents="none" cx={x} cy={y} r={1.9}
    fill="#E8D5B4" opacity={0.17}
    animatedProps={reduced ? undefined : animatedProps} />;
}

/** Fine dashed survey bearing that advances by exactly one pattern repeat.
 * The geometry never moves, so its clipping and hit testing stay constant.
 */
export function HomeAtlasCurrent({ h }: { h: number }) {
  const reduced = useReducedMotion();
  const offset = useSharedValue(0);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  useEffect(() => {
    cancelAnimation(offset);
    offset.value = 0;
    if (reduced) return;
    offset.value = withDelay(2700, withRepeat(
      withTiming(-40, { duration: 24000, easing: Easing.linear }), -1, false,
    ));
    return () => cancelAnimation(offset);
  }, [reduced, offset]);

  return <AnimatedPath testID="home-atlas-motion-current"
    pointerEvents="none"
    d={`M -15 ${h * 0.59} C 110 ${h * 0.55} 294 ${h * 0.64} 437 ${h * 0.57}`}
    stroke="#B7B7AF" strokeWidth={0.75} strokeOpacity={0.13}
    fill="none" strokeDasharray="2 18" strokeDashoffset={0}
    animatedProps={reduced ? undefined : animatedProps} />;
}
