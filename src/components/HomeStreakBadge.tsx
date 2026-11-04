/**
 * Home quiz streak medallion. The flame stays vector-sharp and the numeral
 * stays readable while the artwork flickers gently behind it.
 * No layout or SVG-path animation occurs per frame.
 */
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion,
  useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";

type Props = {
  /** Null while account-scoped daily progress is loading. */
  streak: number | null;
};

export default function HomeStreakBadge({ streak }: Props) {
  const reducedMotion = useReducedMotion();
  const active = (streak ?? 0) > 0;
  const breathe = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(breathe);
    breathe.value = 0;
    if (reducedMotion) return;

    // Transform only the small flame layer on the UI thread. A broken streak
    // still gets a gentler idle motion without looking like an active streak.
    breathe.value = withRepeat(
      withTiming(1, {
        duration: active ? 1450 : 2100,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(breathe);
  }, [active, breathe, reducedMotion]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: 0.94 - breathe.value * 0.07,
    transform: [
      { translateY: -breathe.value * 0.85 },
      { rotate: `${breathe.value * 1.4 - 0.7}deg` },
      { scaleY: 1 + breathe.value * 0.045 },
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
        {/* An ornamental frame rather than a second progress meter.
            The level's XP ring remains the visual source of progress. */}
        <Svg width={50} height={50} viewBox="0 0 50 50"
          style={styles.ring} accessible={false} pointerEvents="none">
          <Circle cx={25} cy={25} r={21} fill="none"
            stroke="#413B5C" strokeWidth={2.5} />
          <Circle cx={25} cy={25} r={17.7} fill="none"
            stroke="#5D5C93" strokeOpacity={0.27} strokeWidth={0.8} />
          <Path d="M 20 4.6 A 21 21 0 0 1 43.9 15.9"
            fill="none" stroke={active ? "#8C9EFF" : "#797BAF"}
            strokeWidth={2.8} strokeLinecap="round" opacity={0.8} />
          <Path d="M 11 40.2 A 21 21 0 0 0 18 44"
            fill="none" stroke="#637AE6" strokeOpacity={0.38}
            strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
        <Animated.View style={[styles.flame, flameStyle]} pointerEvents="none"
          accessible={false}>
          <Svg width={39} height={41} viewBox="0 0 48 48" accessible={false}>
            <Defs>
              <LinearGradient id="homeStreakFlameOuter" x1="22%" y1="0%" x2="72%" y2="100%">
                <Stop offset="0%" stopColor="#61D7FF" />
                <Stop offset="47%" stopColor="#6387FF" />
                <Stop offset="100%" stopColor="#9251E9" />
              </LinearGradient>
              <LinearGradient id="homeStreakFlameInner" x1="16%" y1="0%" x2="83%" y2="100%">
                <Stop offset="0%" stopColor="#B2F3FF" />
                <Stop offset="58%" stopColor="#78A9FF" />
                <Stop offset="100%" stopColor="#A76AFF" />
              </LinearGradient>
            </Defs>
            {/* Open, irregular tongues show above and beside the numeral. */}
            <Path
              d="M25 4 C28 13 21 18 25 24 C30 21 32 16 30 12
                 C39 18 41 29 36 36 C30 44 17 44 12 35
                 C8 28 13 24 16 19 C17 23 19 26 17 29
                 C24 24 22 17 25 4 Z"
              fill="url(#homeStreakFlameOuter)" opacity={active ? 1 : 0.78}
            />
            <Path
              d="M25 15 C28 20 24 24 25 27 C29 25 31 22 32 20
                 C36 28 33 35 28 38 C22 41 17 35 20 29
                 C23 26 25 22 25 15 Z"
              fill="url(#homeStreakFlameInner)" opacity={active ? 0.9 : 0.7}
            />
            <Path d="M14 31 C12 35 17 40 22 41" stroke="#9D6DFF"
              strokeWidth={1.4} strokeLinecap="round" fill="none"
              opacity={0.6} />
          </Svg>
        </Animated.View>
        {/* A dark lower core gives one-, two- and three-digit streaks contrast
            without masking the flame's visible tip. */}
        <View pointerEvents="none" style={styles.numberCore}>
          <Text testID="home-streak-count" style={styles.count}
            numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {streak === null ? "—" : streak}
          </Text>
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>σερί quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 4 },
  badge: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#151928", borderWidth: 1, borderColor: "#403A55",
  },
  ring: { position: "absolute", top: 0, left: 0 },
  flame: {
    position: "absolute", top: 3, left: 5.5,
    width: 39, height: 41, alignItems: "center", justifyContent: "center",
  },
  numberCore: {
    position: "absolute", top: 25, left: 14, width: 22, height: 21,
    borderRadius: 12, backgroundColor: "rgba(18, 21, 43, 0.94)",
    borderWidth: 0.7, borderColor: "rgba(157, 148, 249, 0.45)",
    alignItems: "center", justifyContent: "center",
  },
  count: {
    width: 20, textAlign: "center", color: "#F3F0FF",
    fontSize: 14, lineHeight: 17, fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  label: { color: "#ABB0C1", fontSize: 10, lineHeight: 13 },
});
