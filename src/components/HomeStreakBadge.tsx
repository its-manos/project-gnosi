/** Completed daily-quiz streak; deliberately not a progress ring or login count. */
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../theme";

type Props = { streak: number | null };

export default function HomeStreakBadge({ streak }: Props) {
  return <View testID="home-quiz-streak" style={styles.badge} accessible
    accessibilityLabel={streak === null ? "Φόρτωση σερί καθημερινού quiz"
      : String(streak) + " συνεχόμενες ημέρες ολοκληρωμένου καθημερινού quiz"}>
    <Svg width={20} height={24} viewBox="0 0 24 28" accessible={false} pointerEvents="none">
      <Path d="M13 2C15 8 21 10 21 17a9 9 0 0 1-18 0c0-4 2-7 5-10 0 4 1 5 2 6 3-3 4-7 3-11Z"
        fill="#E6B87B" />
      <Path d="M12 15c1 3 4 4 4 7a4 4 0 0 1-8 0c0-3 2-5 4-7Z" fill="#FFE6B8" />
    </Svg>
    <View style={styles.copy}>
      <Text testID="home-streak-count" style={styles.count} numberOfLines={1} adjustsFontSizeToFit>
        {streak === null ? "—" : streak}
      </Text>
      <Text style={styles.caption}>{streak === 1 ? "ημέρα" : "ημέρες"}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 96, paddingHorizontal: 5 },
  copy: { flexShrink: 1, alignItems: "center" },
  count: { color: "#E6B87B", fontSize: 16, lineHeight: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  caption: { color: colors.textMuted, fontSize: 10, lineHeight: 13 },
});
