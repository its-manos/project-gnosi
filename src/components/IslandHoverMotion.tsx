/**
 * Island Atlas: restrained UI-thread hovering for destination artwork + labels.
 *
 * One low-amplitude transform per island, with staggered starts. Coastline
 * paths, bundled WebPs, labels and progress do not animate their own props.
 * The parent Pressable remains stationary, so native hit targets never drift.
 */
import { useEffect, type PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

// A few small composited views are cheap; cap perpetual movement if a category
// eventually has many more destinations than the current three History islands.
export const MAX_HOVERING_ISLANDS = 8;
const easing = Easing.inOut(Easing.sin);

export function islandHoverAmplitude(index: number) {
  return 1.25 + (index % 3) * 0.4; // 1.25–2.05 dp
}

export default function IslandHoverMotion({
  children, index,
}: PropsWithChildren<{ index: number }>) {
  const reduced = useReducedMotion();
  const displacement = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: displacement.value },
      // Tiny counter-drift, derived from the same value (no extra animations).
      { translateX: displacement.value * (index % 2 === 0 ? 0.12 : -0.12) },
    ],
  }));

  useEffect(() => {
    cancelAnimation(displacement);
    displacement.value = 0;
    if (reduced || index >= MAX_HOVERING_ISLANDS) return;

    const amplitude = islandHoverAmplitude(index);
    displacement.value = withDelay(900 + index * 380, withRepeat(withSequence(
      withTiming(-amplitude, { duration: 2300, easing }),
      withTiming(amplitude, { duration: 3000, easing }),
      withTiming(0, { duration: 2300, easing }),
    ), -1, false));

    return () => cancelAnimation(displacement);
  }, [index, reduced, displacement]);

  return (
    <Animated.View testID={"island-atlas-hover-" + index}
      style={[styles.floatGroup, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatGroup: { width: "100%", alignItems: "center" },
});
