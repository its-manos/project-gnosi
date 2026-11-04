/**
 * Daily quiz streak indicator. Uses the same 50pt circular treatment as the
 * adjacent level badge, with its own short caption inside the ring.
 *
 * The accent arc is decorative, NOT a percentage of streak completion.
 */
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

type Props = {
  /** Null while account-scoped daily progress is loading. */
  streak: number | null;
};

const RING_RADIUS = 21;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const ACCENT_ARC = RING_LENGTH * 0.28;

export default function HomeStreakBadge({ streak }: Props) {
  return (
    <View
      testID="home-quiz-streak"
      style={styles.badge}
      accessible
      accessibilityLabel={streak === null
        ? "Φόρτωση σερί καθημερινού quiz"
        : String(streak) + " συνεχόμενες ημέρες ολοκληρωμένου καθημερινού quiz"}
    >
      <Svg width={50} height={50} viewBox="0 0 50 50"
        style={styles.ring} accessible={false} pointerEvents="none">
        <Circle cx={25} cy={25} r={RING_RADIUS} fill="none"
          stroke={colors.borderStrong} strokeWidth={3.5} />
        <Circle cx={25} cy={25} r={RING_RADIUS} fill="none"
          stroke={colors.accentLight} strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={`${ACCENT_ARC} ${RING_LENGTH}`}
          rotation={-90} origin="25, 25" />
      </Svg>
      <View pointerEvents="none" style={styles.center}>
        <Text style={styles.caption}>ΣΕΡΙ</Text>
        <Text testID="home-streak-count" style={styles.count}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
          {streak === null ? "—" : streak}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface,
  },
  ring: { position: "absolute", top: 0, left: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  caption: { color: colors.textMuted, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  count: {
    color: colors.accentLight, fontSize: 18, lineHeight: 21,
    fontWeight: "900", fontVariant: ["tabular-nums"],
    maxWidth: 36, textAlign: "center",
  },
});
