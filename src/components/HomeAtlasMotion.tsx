/**
 * Low-cost Home Atlas ambient motion.
 *
 * Keep the main cartographic SVG completely static: never animate its path
 * or gradient props. The only looping work is opacity on a small, separate
 * view and four tiny star views, all on the UI thread.
 */
import { useEffect, type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

const ease = Easing.inOut(Easing.sin);
/**
 * One-off compositor fade for the fixed cartography only. It starts after
 * the existing deferred native SVG mount, so the heavy chart never competes
 * with the card entrances; no SVG paths or gradients animate.
 */
export function HomeAtlasReveal({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = reduced ? 1 : 0;
    if (!reduced) {
      opacity.value = withDelay(100, withTiming(1, {
        duration: 600, easing: Easing.out(Easing.cubic),
      }));
    }
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  return <Animated.View testID="home-atlas-reveal" pointerEvents="none"
    accessible={false} style={[styles.reveal, animatedStyle]}>
    {children}
  </Animated.View>;
}

const highlights = [
  { x: 115, y: 0.065 }, { x: 362, y: 0.058 },
  { x: 403, y: 0.416 }, { x: 387, y: 0.75 },
] as const;

export function HomeAtlasAmbientGlow({ width, height }: { width: number; height: number }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.065);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.065;
    if (reduced) return;
    opacity.value = withDelay(1300, withRepeat(withSequence(
      withTiming(0.13, { duration: 9000, easing: ease }),
      withTiming(0.065, { duration: 9000, easing: ease }),
      withDelay(2200, withTiming(0.065, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  // The tiny SVG is rendered just once; only its parent view's opacity changes.
  // It does not occupy or redraw the full Home screen.
  const haloWidth = width * 0.72;
  const haloHeight = height * 0.36;
  return <Animated.View testID="home-atlas-motion-glow" pointerEvents="none"
    accessible={false} style={[styles.glow,
      { width: haloWidth, height: haloHeight, left: -width * 0.12, top: height * 0.17 },
      animatedStyle]}>
    <Svg width={haloWidth} height={haloHeight} viewBox="0 0 220 260"
      pointerEvents="none">
      <Defs>
        <RadialGradient id="home-ambient-view-glow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#7EA7B5" stopOpacity={0.9} />
          <Stop offset="66%" stopColor="#456E81" stopOpacity={0.33} />
          <Stop offset="100%" stopColor="#456E81" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={130} rx={110} ry={130} fill="url(#home-ambient-view-glow)" />
    </Svg>
  </Animated.View>;
}

function TwinkleDot({ width, height, x, y, index }: {
  width: number; height: number; x: number; y: number; index: number;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.17);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.17;
    if (reduced) return;
    opacity.value = withDelay(1700 + index * 2400, withRepeat(withSequence(
      withTiming(0.58, { duration: 1800, easing: ease }),
      withTiming(0.17, { duration: 2200, easing: ease }),
      withDelay(10200, withTiming(0.17, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(opacity);
  }, [index, reduced, opacity]);

  return <Animated.View testID={`home-atlas-motion-star-${index}`}
    accessible={false} pointerEvents="none"
    style={[styles.star,
      { left: x / 420 * width - 1.5, top: y * height - 1.5 },
      animatedStyle]} />;
}

export function HomeAtlasTwinkles({ width, height }: { width: number; height: number }) {
  return <View testID="home-atlas-motion-stars" pointerEvents="none"
    accessible={false} style={StyleSheet.absoluteFill}>
    {highlights.map((star, index) =>
      <TwinkleDot key={index} width={width} height={height}
        index={index} x={star.x} y={star.y} />)}
  </View>;
}

const styles = StyleSheet.create({
  reveal: { ...StyleSheet.absoluteFill },
  glow: { position: "absolute" },
  star: { position: "absolute", width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: "#E8D5B4" },
});
