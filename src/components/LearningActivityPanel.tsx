import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categories, lessons } from "../data/lessons";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { activityBuckets, activitySummary, type ActivityBucket } from "../utils/learningActivity";
import { colors } from "../theme";
import { getAthensDateKey } from "../utils/dailyChallenge";

const FIRST = "#BEA7F4", REPLAY = "#6FC7BD";
function dateLabel(key: string, long = false): string {
  return new Intl.DateTimeFormat("el-GR", { day: "numeric", month: long ? "long" : "short", year: long ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}
function rangeLabel(bucket: ActivityBucket): string {
  return bucket.key === bucket.end ? dateLabel(bucket.key, true) : `${dateLabel(bucket.key)} – ${dateLabel(bucket.end, true)}`;
}
function MiniMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.small}>{detail}</Text></View>;
}

export default function LearningActivityPanel({ todayKey, compact = false }: { todayKey: string; compact?: boolean }) {
  const snapshot = useLearningSnapshot(), daily = useDailySnapshot();
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [selectedKey, setSelectedKey] = useState("");
  const dailyDates = useMemo(() => dailyHistory(daily.doc).map(row => row.dateKey), [daily.doc]);
  const summary = useMemo(() => activitySummary(snapshot.activity, snapshot.backup.completedIds, dailyDates, todayKey, [...Object.values(snapshot.weeklyReviews ?? {}).map(answer => getAthensDateKey(new Date(answer.at))), ...Object.values(snapshot.knowledgeReviews ?? {}).flatMap(dates => Object.keys(dates))]), [snapshot.activity, snapshot.backup.completedIds, snapshot.weeklyReviews, snapshot.knowledgeReviews, dailyDates, todayKey]);
  const buckets = useMemo(() => activityBuckets(snapshot.activity, todayKey, mode), [snapshot.activity, todayKey, mode]);
  const selected = buckets.find(bucket => bucket.key === selectedKey) ?? buckets[buckets.length - 1];
  const max = Math.max(1, ...buckets.map(bucket => bucket.first + bucket.replay));
  const total = buckets.reduce((sum, bucket) => sum + bucket.first + bucket.replay, 0);
  const switchMode = (value: "daily" | "weekly") => { setMode(value); setSelectedKey(""); };

  return <View style={styles.section}>
    <Text style={styles.title}>Η δραστηριότητά σου</Text>
    {compact ? <Text style={styles.small}>Αυτή την εβδομάδα: {summary.firstThisWeek} νέα μαθήματα · {summary.replaysThisWeek} επαναλήψεις</Text> : null}
    {!compact ? <View style={styles.metrics}>
      <MiniMetric label="ΝΕΑ ΜΑΘΗΜΑΤΑ" value={String(summary.firstThisWeek)} detail="αυτή την εβδομάδα" />
      <MiniMetric label="ΠΛΗΡΕΙΣ ΕΠΑΝΑΛΗΨΕΙΣ" value={String(summary.replaysThisWeek)} detail="αυτή την εβδομάδα" />
      <MiniMetric label="ΕΝΕΡΓΕΣ ΗΜΕΡΕΣ" value={String(summary.activeDays)} detail="συνολικά" />
      <MiniMetric label="ΑΚΡΙΒΕΙΑ ΜΑΘΗΜΑΤΩΝ" value={summary.accuracy === null ? "—" : `${summary.accuracy}%`} detail={summary.questions ? `${summary.correct} / ${summary.questions} σωστές` : "θα εμφανιστεί με την πρώτη ολοκλήρωση"} />
    </View> : null}
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Ο ρυθμός σου</Text>
      <View style={styles.switchRow}>
        {(["daily", "weekly"] as const).map(value => <Pressable key={value} onPress={() => switchMode(value)} accessibilityRole="button"
          accessibilityState={{ selected: mode === value }} style={[styles.switchButton, mode === value && styles.switchSelected]}>
          <Text style={[styles.switchText, mode === value && styles.switchTextSelected]}>{value === "daily" ? "Ανά ημέρα" : "Ανά εβδομάδα"}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.period}>{mode === "daily" ? "Τελευταίες 7 ημέρες" : "Τελευταίες 8 εβδομάδες · από Δευτέρα"}</Text>
      <View style={styles.chart}>
        <View style={styles.axis} accessible={false}><Text style={styles.axisText}>{max}</Text><Text style={styles.axisText}>0</Text></View>
        <View style={styles.bars}>
          {buckets.map(bucket => {
            const count = bucket.first + bucket.replay, active = bucket.key === selected.key;
            return <Pressable key={bucket.key} onPress={() => setSelectedKey(bucket.key)} accessibilityRole="button"
              accessibilityState={{ selected: active }} accessibilityLabel={`${rangeLabel(bucket)}: ${bucket.first} πρώτες ολοκληρώσεις, ${bucket.replay} επαναλήψεις`}
              style={[styles.column, active && styles.selectedColumn]}>
              <View style={styles.barArea}>
                <Text style={styles.barNumber}>{count}</Text>
                <View style={styles.stack}>
                  {bucket.replay > 0 ? <View style={[styles.replayBar, { height: 120 * bucket.replay / max }]} /> : null}
                  {bucket.first > 0 ? <View style={[styles.firstBar, { height: 120 * bucket.first / max }]} /> : null}
                  {count === 0 ? <View style={styles.zeroBar} /> : null}
                </View>
              </View>
              <Text style={[styles.barLabel, active && styles.activeLabel]}>{new Date(`${bucket.key}T12:00:00Z`).getUTCDate()}{"\n"}{new Intl.DateTimeFormat("el-GR", { month: "short", timeZone: "UTC" }).format(new Date(`${bucket.key}T12:00:00Z`)).replace(".", "")}</Text>
            </Pressable>;
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: FIRST }]} /><Text style={styles.small}>Πρώτες ολοκληρώσεις</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: REPLAY }]} /><Text style={styles.small}>Πλήρεις επαναλήψεις</Text></View>
      </View>
      <View style={styles.selection} accessibilityLiveRegion="polite">
        <Text style={styles.selectionTitle}>{rangeLabel(selected)}</Text>
        <Text style={styles.small}>{selected.first} νέα μαθήματα · {selected.replay} πλήρεις επαναλήψεις</Text>
      </View>
      {!total ? <Text style={styles.hint}>Ολοκλήρωσε ένα μάθημα για να ξεκινήσεις.</Text> : null}
    </View>
    {compact ? <Text style={styles.small}>{summary.activeDays} ενεργές ημέρες · Ακρίβεια μαθημάτων: {summary.accuracy === null ? "—" : `${summary.accuracy}%`}</Text> : null}
    {summary.undatedCount > 0 ? <Text style={styles.legacyNote}>{summary.undatedCount} παλιότερα μαθήματα χωρίς ημερομηνία — εκτός γραφήματος.</Text> : null}
  </View>;
}

export function CategoryProgress({ compact = false, detail = false, singleColumn = false, threeColumn = false }: { compact?: boolean; detail?: boolean; singleColumn?: boolean; threeColumn?: boolean } = {}) {
  const snapshot = useLearningSnapshot();
  const [expanded, setExpanded] = useState(false);
  const completed = new Set(snapshot.backup.completedIds);
  const rows = categories.map((category, index) => {
    const items = lessons.filter(lesson => lesson.categoryId === category.id);
    const count = items.filter(lesson => completed.has(lesson.id)).length;
    const percent = items.length ? Math.round(count / items.length * 100) : 0;
    return { category, index, count, total: items.length, percent };
  });
  // The detail screen begins with subjects already explored. Stable ties retain
  // catalogue order, and every subject is accessible via the disclosure.
  const ranked = compact || detail
    ? rows.slice().sort((a, b) => b.count - a.count
        || b.percent - a.percent || a.index - b.index)
    : rows;
  const limit = detail ? 4 : 3;
  const visible = (compact || detail) && !expanded ? ranked.slice(0, limit) : ranked;

  return <View style={[styles.section, compact && styles.sectionCompact, detail && styles.sectionDetail]} testID="reading-category-progress">
    <Text style={[styles.title, compact && styles.titleCompact, detail && styles.titleDetail]}>{detail ? "Ανά θεματική" : "Οι κόσμοι που εξερευνάς"}</Text>
    <View style={[styles.categoryCard, compact && styles.categoryCardCompact,
      detail && styles.categoryCardDetail, detail && styles.categoryGrid,
      detail && singleColumn && styles.categoryGridSingle]}>
      {visible.map(({ category, count, total, percent }) => detail ? (
        <View key={category.id} style={[styles.readingTile, singleColumn && styles.readingTileSingle,
          threeColumn && !singleColumn && styles.readingTileWide]}
          accessible accessibilityRole="progressbar"
          accessibilityLabel={category.title}
          accessibilityValue={{ min: 0, max: total || 1, now: count,
            text: count + " από " + total + " μαθήματα, " + percent + "%" }}>
          <View style={styles.readingTileHeader}>
            <Text style={styles.readingTileEmoji}>{category.emoji}</Text>
            {count > 0 ? <Text style={styles.readingTilePercent}>{percent}%</Text> : null}
          </View>
          <Text style={styles.readingTileTitle} numberOfLines={2}>{category.title}</Text>
          <Text style={styles.readingTileCount}>{count} / {total}</Text>
          <View style={styles.readingTileTrack}>
            <View style={[styles.categoryFillDetail, styles.readingTileFill,
              { width: percent + "%" }]} />
          </View>
        </View>
      ) : (
        <View key={category.id} style={[styles.category, compact && styles.categoryCompact]}
          accessible accessibilityRole="progressbar"
          accessibilityLabel={category.title}
          accessibilityValue={{ min: 0, max: total || 1, now: count, text: count + " από " + total + " μαθήματα, " + percent + "%" }}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{category.emoji} {category.title}</Text>
            <Text style={styles.categoryCount}>{count} / {total}</Text>
          </View>
          <View style={styles.categoryTrack}>
            <View style={[styles.categoryFill, { width: percent + "%" }]} />
          </View>
        </View>
      ))}
    </View>
    {(compact || detail) && rows.length > limit ? <Pressable
      testID={detail ? "reading-all-subjects" : undefined}
      style={({ pressed }) => [styles.categoryMore, detail && styles.detailMore,
        pressed && styles.categoryMorePressed]}
      accessibilityRole="button" accessibilityState={{ expanded }}
      onPress={() => setExpanded(value => !value)}>
      <Text style={[styles.categoryMoreText, detail && styles.detailMoreText]}>
        {detail
          ? expanded ? "Λιγότερες θεματικές" : `Όλες οι θεματικές (${rows.length})`
          : expanded ? "Λιγότεροι κόσμοι −" : "Όλοι οι κόσμοι +"}
      </Text>
      {detail ? <Text style={styles.detailMoreArrow}>{expanded ? "⌃" : "⌄"}</Text> : null}
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 14, marginBottom: 14, gap: 12 },
  sectionCompact: { marginTop: 0, marginBottom: 0, gap: 8 },
  sectionDetail: { marginTop: 0, marginBottom: 0, gap: 10 },
  titleDetail: { fontSize: 17, lineHeight: 24, fontWeight: "800" },
  titleCompact: { fontSize: 14, lineHeight: 20 },
  categoryCardCompact: { padding: 12, gap: 10 },
  categoryCardDetail: { backgroundColor: "transparent", borderWidth: 0, padding: 0, gap: 0 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryGridSingle: { flexDirection: "column" },
  readingTile: {
    flexBasis: "47%", flexGrow: 1, minWidth: 0, minHeight: 123,
    padding: 11, gap: 3, borderRadius: 15,
    backgroundColor: "#1F313D", borderWidth: 1, borderColor: "#35545F",
  },
  readingTileSingle: { minHeight: 112, flexBasis: "auto" },
  readingTileWide: { flexBasis: "30%" },
  readingTileHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  readingTileEmoji: { fontSize: 19, lineHeight: 26 },
  readingTilePercent: { color: "#9CD2D1", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  readingTileTitle: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "800", minHeight: 19 },
  readingTileCount: { color: colors.textMuted, fontSize: 13, lineHeight: 19, fontWeight: "700", fontVariant: ["tabular-nums"] },
  readingTileTrack: { height: 5, marginTop: 5, borderRadius: 5, backgroundColor: "#334B56", overflow: "hidden" },
  readingTileFill: { height: "100%", borderRadius: 5 },

  categoryDetail: {
    paddingVertical: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(146, 204, 208, 0.17)",
  },
  categoryTitleDetail: { color: "#E7ECEC" },
  categoryCountDetail: { color: "#9CD2D1" },
  categoryTrackDetail: { backgroundColor: "#31434F" },
  categoryFillDetail: { backgroundColor: "#82C4C7" },
  categoryCompact: { gap: 5 },
  categoryMore: { minHeight: 44, justifyContent: "center", alignItems: "flex-end" },
  categoryMorePressed: { opacity: 0.75 },
  detailMore: {
    paddingHorizontal: 12, minHeight: 46, borderRadius: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1D303A", borderWidth: 1, borderColor: "#35545F",
  },
  detailMoreText: { color: "#9CD2D1" },
  detailMoreArrow: { color: "#9CD2D1", fontSize: 20 },
  categoryMoreText: { color: colors.accentLight, fontSize: 13, fontWeight: "700" },
  title: { color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: "800" },
  small: { color: colors.textMuted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { flexGrow: 1, flexBasis: "46%", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 15, gap: 6 },
  metricLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 16, fontWeight: "700", letterSpacing: 0.4 },
  metricValue: { color: colors.accentLight, fontSize: 30, lineHeight: 39, fontWeight: "800" },
  chartCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  chartTitle: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "700" },
  switchRow: { flexDirection: "row", backgroundColor: colors.background, borderRadius: 12, padding: 4, gap: 4 },
  switchButton: { flex: 1, minHeight: 44, paddingVertical: 10, paddingHorizontal: 8, justifyContent: "center", borderRadius: 9 },
  switchSelected: { backgroundColor: "#373048" },
  switchText: { color: colors.textMuted, textAlign: "center", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  switchTextSelected: { color: colors.text },
  period: { color: colors.textBody, fontSize: 13, lineHeight: 21, fontWeight: "600", marginTop: 4 },
  chart: { flexDirection: "row", alignItems: "stretch", gap: 6, paddingTop: 4 },
  axis: { width: 25, justifyContent: "space-between", paddingTop: 29, paddingBottom: 45 },
  axisText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: "right" },
  bars: { flex: 1, flexDirection: "row", gap: 3, alignItems: "stretch" },
  column: { flex: 1, minWidth: 0, borderRadius: 8, paddingTop: 4, paddingHorizontal: 1, paddingBottom: 6 },
  selectedColumn: { backgroundColor: "#292637" },
  barArea: { height: 154, justifyContent: "flex-end", alignItems: "center" },
  barNumber: { color: colors.textBody, fontSize: 10, lineHeight: 17, marginBottom: 4 },
  stack: { width: "75%", maxWidth: 36, borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  firstBar: { backgroundColor: FIRST }, replayBar: { backgroundColor: REPLAY },
  zeroBar: { height: 2, backgroundColor: colors.border },
  barLabel: { color: colors.textMuted, textAlign: "center", fontSize: 10, lineHeight: 16, marginTop: 7 },
  activeLabel: { color: colors.accentLight, fontWeight: "800" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  selection: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 3 },
  selectionTitle: { color: colors.textBody, fontSize: 13, lineHeight: 21, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 18 },
  legacyNote: { color: colors.textMuted, fontSize: 12, lineHeight: 20, paddingHorizontal: 2 },
  categoryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 18 },
  category: { gap: 8 }, categoryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryTitle: { flex: 1, color: colors.textBody, fontSize: 13, lineHeight: 21, fontWeight: "600" },
  categoryCount: { color: colors.accentLight, fontSize: 12, lineHeight: 20, flexShrink: 0, fontVariant: ["tabular-nums"] },
  categoryTrack: { height: 6, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  categoryFill: { height: "100%", backgroundColor: FIRST, borderRadius: 4 },
});
