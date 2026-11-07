import { StyleSheet, Text, View } from "react-native";
import { MotionPressable } from "./HomeMotion";
import { ProgressBarFill } from "./ProgressMotion";
import ProgressTrack from "./ProgressTrack";
import { colors } from "../theme";

export type SubjectProgressTone = "knowledge" | "reading";

type Props = {
  title: string;
  emoji: string;
  completed: number;
  total: number;
  percent: number;
  tone: SubjectProgressTone;
  selected: boolean;
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
  singleColumn?: boolean;
  threeColumn?: boolean;
  /** Compact detail tiles keep the default two-column grid visible on phones. */
  dense?: boolean;
};

/**
 * The same compact Midnight Atlas category tile for mastery and reading.
 * Data semantics and colors remain distinct; both use the existing UI-thread progress fill.
 */
export default function SubjectProgressTile({
  title, emoji, completed, total, percent, tone, selected, onPress,
  testID, accessibilityLabel, singleColumn = false, threeColumn = false, dense = false,
}: Props) {
  const reading = tone === "reading";
  const complete = total > 0 && completed === total;
  const progressing = reading ? completed > 0 : percent > 0;
  return <MotionPressable testID={testID} pressScale={0.985} onPress={onPress}
    style={[styles.tile, threeColumn && !singleColumn && styles.wide,
      singleColumn && styles.single,
      reading && styles.readingTile,
      progressing && (reading ? styles.readingProgressing : styles.knowledgeProgressing),
      complete && (reading ? styles.readingComplete : styles.knowledgeComplete),
      selected && (reading ? styles.readingSelected : styles.knowledgeSelected),
      dense && styles.dense]}
    accessibilityRole="button" accessibilityState={{ selected, expanded: selected }}
    accessibilityLabel={accessibilityLabel}
    accessibilityHint="Άνοιγμα σύντομης ανάλυσης της θεματικής">
    <View style={styles.top}>
      <View style={[styles.icon, reading && styles.readingIcon,
        progressing && (reading ? styles.readingIconActive : styles.knowledgeIconActive)]}
        accessible={false}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      {complete
        ? <View style={[styles.state, styles.completeState,
            reading && styles.readingCompleteState]} accessible={false}>
            <Text style={[styles.check, reading && styles.readingCheck]}>✓</Text>
          </View>
        : progressing
          ? <View style={[styles.state, reading && styles.readingState]} accessible={false}>
              <Text style={[styles.percent, reading && styles.readingPercent]}>{percent}%</Text>
            </View>
          : <Text style={[styles.chevron, reading && styles.readingChevron]}
              accessible={false}>›</Text>}
    </View>
    <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit
      minimumFontScale={0.86}>{title}</Text>
    <View style={styles.foot}>
      <Text style={[styles.footLabel, reading && styles.readingFootLabel]}>
        {reading ? "ΜΑΘΗΜΑΤΑ" : "ΚΑΤΑΚΤΗΣΗ"}
      </Text>
      <Text style={[styles.count, reading && styles.readingCount,
        complete && (reading ? styles.readingCountComplete : styles.knowledgeCountComplete)]}>
        {completed}<Text style={[styles.countTotal, reading && styles.readingCountTotal]}> / {total}</Text>
      </Text>
    </View>
    <ProgressTrack variant="subject" tone={tone} pointerEvents="none">
      <ProgressBarFill tone={tone} percent={percent} />
    </ProgressTrack>
  </MotionPressable>;
}

const styles = StyleSheet.create({
  tile: {
    width: "48.5%", minWidth: 0, minHeight: 137,
    paddingHorizontal: 12, paddingTop: 11, paddingBottom: 12, borderRadius: 17,
    backgroundColor: "#22263B", borderWidth: 1, borderColor: "#42435F",
    gap: 7, justifyContent: "space-between", overflow: "hidden",
  },
  wide: { width: "31.7%" },
  dense: { minHeight: 116, paddingTop: 8, paddingBottom: 9, gap: 5 },
  single: { width: "100%", minHeight: 118 },
  knowledgeProgressing: { borderColor: "#625B91", backgroundColor: "#262840" },
  knowledgeComplete: { borderColor: "#8277AD", backgroundColor: "#2D2A44" },
  knowledgeSelected: { borderColor: "#C2B5FF", backgroundColor: "#332E50" },
  readingTile: { borderColor: "#35545F", backgroundColor: "#1F313D" },
  readingProgressing: { borderColor: "#4A717B", backgroundColor: "#233944" },
  readingComplete: { borderColor: "#6E9A9B", backgroundColor: "#264149" },
  readingSelected: { borderColor: "#9CD2D1", backgroundColor: "#2A454F" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  icon: {
    width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center",
    backgroundColor: "#31324F", borderWidth: 1, borderColor: "#494563",
  },
  knowledgeIconActive: { backgroundColor: "#3A355B", borderColor: "#7367A4" },
  readingIcon: { backgroundColor: "#29404A", borderColor: "#44616B" },
  readingIconActive: { backgroundColor: "#2E5057", borderColor: "#5D9497" },
  emoji: { fontSize: 20, lineHeight: 28 },
  state: {
    minWidth: 38, height: 25, paddingHorizontal: 6, alignItems: "center",
    justifyContent: "center", backgroundColor: "#363150",
    borderColor: "#5C5389", borderWidth: 1, borderRadius: 9,
  },
  readingState: { backgroundColor: "#29474F", borderColor: "#497E83" },
  completeState: { minWidth: 26, backgroundColor: "#3D375F" },
  readingCompleteState: { backgroundColor: "#2C5658" },
  percent: { color: "#D3C6FF", fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  readingPercent: { color: "#B8E9E3" },
  check: { color: "#DDD2FF", fontSize: 17, lineHeight: 20, fontWeight: "900" },
  readingCheck: { color: "#C5ECE7" },
  chevron: { color: "#938CB6", fontSize: 25, lineHeight: 28, paddingHorizontal: 4 },
  readingChevron: { color: "#84B7BA" },
  title: {
    color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "900",
    minHeight: 38, textAlignVertical: "center",
  },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  footLabel: {
    color: "#B2ADD0", fontSize: 9, lineHeight: 13,
    fontWeight: "900", letterSpacing: 0.65, flexShrink: 1,
  },
  readingFootLabel: { color: "#9FCAC9" },
  count: { color: "#E3D9FF", fontSize: 13, lineHeight: 17,
    fontWeight: "900", fontVariant: ["tabular-nums"] },
  readingCount: { color: "#C7EAE6" },
  countTotal: { color: "#AAA9C3", fontSize: 12, fontWeight: "700" },
  readingCountTotal: { color: "#94B5B9" },
  knowledgeCountComplete: { color: "#DAD2FF" },
  readingCountComplete: { color: "#B7ECE8" },
});
