import { StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { colors } from "../theme";

export default function QuestionStageProgress({ current, total }: { current: number; total: number }) {
  return <View style={styles.progress} accessible accessibilityRole="progressbar"
    accessibilityLabel="Πρόοδος ερωτήσεων"
    accessibilityValue={{ min: 0, max: total, now: current, text: `Ερώτηση ${current} από ${total}` }}>
    <AnswerMotion pulseKey={current}><Text style={styles.count}>{current} / {total}</Text></AnswerMotion>
    <View style={styles.track}>
      {Array.from({ length: total }, (_, index) => <View key={index}
        style={[styles.segment, index + 1 < current && styles.done, index + 1 === current && styles.current]} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", alignItems: "center", gap: 12 },
  count: { color: colors.accentLight, fontSize: 12, fontWeight: "900" },
  track: { flex: 1, flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "#292C40" },
  done: { backgroundColor: "#6E60A4" },
  current: { backgroundColor: colors.accentLight },
});
