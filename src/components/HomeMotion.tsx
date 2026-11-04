/**
 * Decorative Home 2.0 motion. Motion affects transforms/opacity only: none of
 * these components changes Yoga layout, hit areas, or saved learning state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren, ComponentProps } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type TextProps, type ViewProps } from "react-native";
import { Circle } from "react-native-svg";
import Animated, {
  Easing, FadeInDown, FadeInUp, cancelAnimation, runOnJS,
  useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const ease = Easing.out(Easing.cubic);
const ENTRANCE_RISE = 7;

function entrance(delay: number) {
  return FadeInDown.duration(320).delay(delay).easing(ease)
    .withInitialValues({ opacity: 0, translateY: ENTRANCE_RISE });
}

export function MotionView({ entranceDelay = 0, ...props }: ViewProps & { entranceDelay?: number }) {
  const reduced = useReducedMotion();
  const entering = useMemo(() => reduced ? undefined : entrance(entranceDelay), [reduced, entranceDelay]);
  return <Animated.View {...props} entering={entering} />;
}

type MotionPressableProps = PressableProps & {
  entranceDelay?: number;
  pressScale?: number;
  /** Called after the native entrance has finished, without waiting on JS timers. */
  onEntranceComplete?: () => void;
};
export function MotionPressable({
  entranceDelay, pressScale = 0.974, onEntranceComplete,
  style, onPressIn, onPressOut, disabled, ...props
}: MotionPressableProps) {
  const reduced = useReducedMotion();
  // Keep the completion callback current without restarting the entrance on
  // ordinary parent re-renders (for example, when the map is measured).
  const completionRef = useRef(onEntranceComplete);
  completionRef.current = onEntranceComplete;
  const notifyEntranceComplete = useCallback(() => completionRef.current?.(), []);
  const shouldEnter = !reduced && entranceDelay !== undefined;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const entranceOpacity = useSharedValue(shouldEnter ? 0 : 1);
  const entranceRise = useSharedValue(shouldEnter ? ENTRANCE_RISE : 0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: entranceRise.value }, { scale: scale.value }],
    opacity: entranceOpacity.value * opacity.value,
  }));
  useEffect(() => {
    if (reduced || entranceDelay === undefined) {
      entranceOpacity.value = 1;
      entranceRise.value = 0;
      notifyEntranceComplete();
    } else {
      entranceOpacity.value = withDelay(entranceDelay, withTiming(1, { duration: 320, easing: ease }));
      // The UI-thread completion is authoritative. The Category screen can
      // defer its expensive SVG mount until the card has actually entered.
      entranceRise.value = withDelay(entranceDelay,
        withTiming(0, { duration: 320, easing: ease }, finished => {
          if (finished) runOnJS(notifyEntranceComplete)();
        }));
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(entranceOpacity);
      cancelAnimation(entranceRise);
    };
  }, [entranceDelay, reduced, scale, opacity, entranceOpacity, entranceRise, notifyEntranceComplete]);

  // The old pressed opacity was only a fallback. Reanimated now owns the
  // interaction, while the original unpressed layout styles stay unchanged.
  const baseStyle = typeof style === "function" ? style({ pressed: false }) : style;
  return <AnimatedPressable {...props} disabled={disabled}
    style={[baseStyle, animatedStyle]}
    onPressIn={event => {
      if (!reduced && !disabled) {
        scale.value = withTiming(pressScale, { duration: 90 });
        opacity.value = withTiming(0.96, { duration: 90 });
      }
      onPressIn?.(event);
    }}
    onPressOut={event => {
      if (!reduced) {
        scale.value = withSpring(1, { damping: 19, stiffness: 290, mass: 0.65, overshootClamping: true });
        opacity.value = withTiming(1, { duration: 180 });
      }
      onPressOut?.(event);
    }} />;
}

/** The outer 32pt box never changes size; only the artwork inside lifts. */
export function MotionIcon({ index, children }: PropsWithChildren<{ index: number }>) {
  const reduced = useReducedMotion();
  const translateY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  useEffect(() => {
    if (reduced) {
      cancelAnimation(translateY);
      translateY.value = 0;
      return;
    }
    // Each icon spends most of its cycle at rest; offsets prevent a wave of
    // simultaneous bouncing. No SVG path is redrawn on each frame.
    translateY.value = withDelay(1000 + index * 1700, withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withDelay(11500, withTiming(0, { duration: 1 })),
      ), -1, false,
    ));
    return () => cancelAnimation(translateY);
  }, [index, reduced, translateY]);

  return <View style={styles.iconBox} accessible={false} pointerEvents="none">
    <Animated.View style={[styles.iconBox, animatedStyle]}>{children}</Animated.View>
  </View>;
}

export function MotionXpCircle({
  progress, circumference, ...circleProps
}: ComponentProps<typeof Circle> & { progress: number; circumference: number }) {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = reduced ? progress : withTiming(progress, { duration: 550, easing: ease });
    return () => cancelAnimation(value);
  }, [progress, reduced, value]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * value.value} ${circumference}`,
  }));
  return <AnimatedCircle {...circleProps} animatedProps={reduced ? undefined : animatedProps} />;
}

export function MotionCounter({ progressKey, ...props }: TextProps & { progressKey: string }) {
  const reduced = useReducedMotion();
  const entering = useMemo(() => reduced ? undefined
    : FadeInUp.duration(200).withInitialValues({ opacity: 0.2, translateY: 4 }),
  [reduced]);
  // Replace just the text when the real daily answer count changes.
  return <Animated.Text key={progressKey} {...props} entering={entering} />;
}

/** Narrow highlight over the Continue CTA; runs rarely and never blocks touch. */
export function MotionShimmer() {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(-42);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  useEffect(() => {
    if (reduced || width <= 0) return;
    x.value = withDelay(1550, withRepeat(withSequence(
      withTiming(width + 42, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      withTiming(-42, { duration: 1 }),
      withDelay(10500, withTiming(-42, { duration: 1 })),
    ), -1, false));
    return () => cancelAnimation(x);
  }, [width, reduced, x]);
  if (reduced) return null;
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}
    onLayout={event => {
      const next = Math.round(event.nativeEvent.layout.width);
      if (next > 0) setWidth(current => current === next ? current : next);
    }}>
    <Animated.View style={[styles.shimmer, animatedStyle]} />
  </View>;
}

/**
 * Highlight the actual quiz card perimeter, not an un-clipped bright oval
 * behind its counter. A single UI-thread pulse settles to a faint outline
 * while today's quiz is unfinished. No layout or hit area changes.
 */
export function MotionQuizGlow({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));
  useEffect(() => {
    cancelAnimation(glow);
    if (reduced || !active) {
      glow.value = 0;
      return;
    }
    glow.value = withDelay(650, withSequence(
      withTiming(0.68, { duration: 450, easing: ease }),
      withTiming(0.2, { duration: 700, easing: ease }),
    ));
    return () => cancelAnimation(glow);
  }, [active, reduced, glow]);
  if (reduced || !active) return null;
  return <Animated.View
    testID="home-daily-quiz-highlight"
    pointerEvents="none"
    accessible={false}
    style={[styles.quizGlow, animatedStyle]}
  />;
}

const styles = StyleSheet.create({
  iconBox: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  shimmer: { position: "absolute", top: -8, bottom: -8, left: 0,
    width: 35, backgroundColor: "#FFFFFF", opacity: 0.12, transform: [{ skewX: "-16deg" }] },
  // Overlay the 16pt-radius card's own boundary, never its content.
  quizGlow: { ...StyleSheet.absoluteFill,
    borderRadius: 16, borderWidth: 2, borderColor: "#C7B6FF" },
});
