import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

export default function LessonResultChart({ correct, total, label }: { correct: number; total: number; label: string }) {
  const count = Math.max(0, Math.min(total, correct));
  const fraction = total > 0 ? count / total : 0;
  const circumference = 2 * Math.PI * 66;
  return <View style={styles.card} accessible accessibilityLabel={`${label}: ${count} από ${total} σωστές απαντήσεις, ${Math.round(fraction * 100)} τοις εκατό`}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.chart} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={160} height={160} viewBox="0 0 160 160" accessible={false}>
        <Circle cx={80} cy={80} r={66} fill="none" stroke={colors.borderStrong} strokeWidth={10} />
        {count > 0 ? <Circle cx={80} cy={80} r={66} fill="none" stroke={colors.success} strokeWidth={10}
          strokeDasharray={`${circumference * fraction} ${circumference}`} rotation={-90} origin="80, 80" /> : null}
      </Svg>
      <View style={styles.center}><Text style={styles.score}>{count}<Text style={styles.total}> / {total}</Text></Text><Text style={styles.caption}>σωστές</Text></View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { alignItems: "center", paddingVertical: 16, gap: 10 },
  label: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  chart: { width: 160, height: 160 },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  score: { color: colors.text, fontSize: 34, lineHeight: 44, fontWeight: "900" },
  total: { color: colors.textMuted, fontSize: 22, fontWeight: "600" },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
