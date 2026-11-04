/**
 * Compact, native-rendered quiz streak badge. The layout matches Home's XP
 * circle; only a tiny, compositor-side flame transform is animated.
 */
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion,
  useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";

type Props = {
  /** Null while daily progress is being restored. */
  streak: number | null;
};

export default function HomeStreakBadge({ streak }: Props) {
  const reducedMotion = useReducedMotion();
  const active = (streak ?? 0) > 0;
  const flameScale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(flameScale);
    flameScale.value = 1;
    if (reducedMotion) return;

    // Keep the flame alive without redrawing SVG paths every frame.
    // A zero streak still has a quieter idle animation.
    flameScale.value = withRepeat(
      withTiming(active ? 1.055 : 1.03, {
        duration: active ? 1450 : 1900,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(flameScale);
  }, [active, flameScale, reducedMotion]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - flameScale.value) * 9 },
      { scale: flameScale.value },
    ],
  }));

  return (
    <View
      testID="home-quiz-streak"
      style={styles.container}
      accessible
      accessibilityLabel={streak === null
        ? "Φόρτωση σερί καθημερινού quiz"
        : String(streak) + " συνεχόμενες ημέρες ολοκληρωμένου καθημερινού quiz"}
    >
      <View style={styles.badge}>
        <Svg width={48} height={48} viewBox="0 0 48 48"
          style={styles.ring} accessible={false} pointerEvents="none">
          <Circle cx={24} cy={24} r={20.5} fill="none"
            stroke="#423A68" strokeWidth={3} />
          <Circle cx={24} cy={24} r={16.5} fill="none"
            stroke="#6384E9" strokeOpacity={0.26} strokeWidth={0.8} />
          <Path d="M 18 4.5 A 20.5 20.5 0 0 1 42.6 15.4"
            fill="none" stroke="#B6A5FF" strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M 7.1 35.6 A 20.5 20.5 0 0 0 18 43.5"
            fill="none" stroke="#516DF7" strokeOpacity={0.65}
            strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Animated.View pointerEvents="none" style={[styles.flame, flameStyle]}>
          <Svg width={42} height={42} viewBox="0 0 48 48" accessible={false}>
            <Defs>
              <LinearGradient id="streakFlame" x1="0%" y1="0%" x2="90%" y2="100%">
                <Stop offset="0%" stopColor="#4AD5FF" />
                <Stop offset="52%" stopColor="#6474FF" />
                <Stop offset="100%" stopColor="#A35DFF" />
              </LinearGradient>
              <LinearGradient id="streakCore" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#A5EAFF" />
                <Stop offset="100%" stopColor="#856AFF" />
              </LinearGradient>
            </Defs>
            {/* Three layered silhouettes suggest motion without animated path data. */}
            <Path d="M24 5 C30 12 23 17 29 22 C33 18 36 15 34 10
              C43 18 43 29 38 35 C34 41 27 43 22 42
              C12 41 8 33 11 25 C14 20 17 17 17 12
              C22 18 22 23 20 27 C27 21 28 12 24 5 Z"
              fill="url(#streakFlame)" opacity={active ? 0.94 : 0.78} />
            <Path d="M23 17 C28 23 25 28 27 30 C30 26 32 23 31 20
              C37 27 36 36 30 39 C23 43 16 37 17 31
              C19 27 22 24 23 17 Z"
              fill="url(#streakCore)" opacity={0.78} />
            <Path d="M12 35 C19 41 30 42 38 33"
              fill="none" stroke="#8E6BFF" strokeWidth={2.3}
              strokeLinecap="round" opacity={0.85} />
          </Svg>
        </Animated.View>
        <Text testID="home-streak-count" style={styles.count}
          numberOfLines={1} adjustsFontSizeToFit>
          {streak === null ? "—" : streak}
        </Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>σερί quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 4 },
  badge: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#151928",
    borderWidth: 1, borderColor: "#403A55",
  },
  ring: { position: "absolute", top: 0, left: 0 },
  flame: { position: "absolute", top: 2, left: 2, width: 42, height: 42 },
  count: {
    color: "#F3F0FF", fontSize: 18, lineHeight: 23,
    fontWeight: "900", fontVariant: ["tabular-nums"],
    textShadowColor: "#1A1E62", textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  label: { color: "#ABB0C1", fontSize: 10, lineHeight: 13 },
});
