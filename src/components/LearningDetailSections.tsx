import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Tone = "knowledge" | "reading";

type HeadingProps = { title: string; tone: Tone };

/** Consistent category eyebrow across both detail views. */
export function LearningSectionHeading({ title, tone }: HeadingProps) {
  return <Text style={[styles.heading, tone === "reading" && styles.headingReading]}>{title}</Text>;
}

type InsightProps = {
  tone: Tone;
  title: string;
  current: number;
  total: number;
  caption: string;
  note?: string;
  testID: string;
};

/** Selection details are screen-owned; this renders their common accessible shell. */
export function SubjectInsightPanel({ tone, title, current, total, caption, note, testID }: InsightProps) {
  const reading = tone === "reading";
  return <View testID={testID} accessibilityLiveRegion="polite"
    style={[styles.insight, reading && styles.insightReading]}>
    <View style={styles.insightHeading}>
      <Text style={styles.insightTitle} numberOfLines={2}>{title}</Text>
      <Text style={[styles.insightValue, reading && styles.insightValueReading]}>
        {current} / {total}
      </Text>
    </View>
    <Text style={styles.insightCaption}>{caption}</Text>
    {note ? <Text style={[styles.insightNote, reading && styles.insightNoteReading]}>{note}</Text> : null}
  </View>;
}

type ShowAllProps = {
  tone: Tone;
  expanded: boolean;
  count: number;
  onPress: () => void;
  testID: string;
};

/** Same 46pt disclosure and accessible expanded state; only accent differs. */
export function SubjectShowAll({ tone, expanded, count, onPress, testID }: ShowAllProps) {
  const reading = tone === "reading";
  return <Pressable testID={testID} accessibilityRole="button"
    accessibilityState={{ expanded }}
    accessibilityLabel={expanded ? "Λιγότερες θεματικές" : `Όλες οι θεματικές (${count})`}
    style={({ pressed }) => [styles.showAll, reading && styles.showAllReading,
      pressed && (reading ? styles.showAllPressedReading : styles.showAllPressed)]}
    onPress={onPress}>
    <Text style={[styles.showAllText, reading && styles.showAllTextReading]}>
      {expanded ? "Λιγότερες θεματικές" : `Όλες οι θεματικές (${count})`}
    </Text>
    <Text accessible={false} style={[styles.showAllArrow, reading && styles.showAllTextReading]}>
      {expanded ? "⌃" : "⌄"}
    </Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  heading: {
    color: "#BDB1FB", fontSize: 11, lineHeight: 18,
    fontWeight: "900", letterSpacing: 0.65,
  },
  headingReading: { color: "#9CD2D1" },
  insight: {
    backgroundColor: "#27273F", borderWidth: 1, borderColor: "#514976",
    borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, gap: 5,
  },
  insightReading: { backgroundColor: "#1D3540", borderColor: "#40626C" },
  insightHeading: {
    flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between",
  },
  insightTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "800" },
  insightValue: {
    color: "#C4B8FF", fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"],
  },
  insightValueReading: { color: "#B0E1DD" },
  insightCaption: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  insightNote: { color: "#ADA3DD", fontSize: 11, lineHeight: 16 },
  insightNoteReading: { color: "#9FCAC9" },
  showAll: {
    minHeight: 46, borderRadius: 13, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#22233A", borderWidth: 1, borderColor: "#414060",
  },
  showAllReading: { backgroundColor: "#1D303A", borderColor: "#35545F" },
  showAllPressed: { backgroundColor: "#2F2C4A" },
  showAllPressedReading: { backgroundColor: "#294450" },
  showAllText: { color: "#BEB3FF", fontSize: 13, fontWeight: "800" },
  showAllTextReading: { color: "#9CD2D1" },
  showAllArrow: { color: "#BEB3FF", fontSize: 20 },
});
