import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { lessons } from "../data/lessons";
import { categoryCompletionRows } from "../utils/categoryCompletion";
import { useDailyDataSnapshot, useLearningDataSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { activityBuckets, activitySummary, type ActivityBucket } from "../utils/learningActivity";
import { colors } from "../theme";
import { MotionPressable, MotionView } from "./HomeMotion";
import MetricCard from "./MetricCard";
import SubjectProgressTile from "./SubjectProgressTile";
import { LearningSectionHeading, SubjectInsightPanel, SubjectShowAll } from "./LearningDetailSections";
import { getAthensDateKey } from "../utils/dailyChallenge";

const FIRST = "#BEA7F4", REPLAY = "#6FC7BD";
function dateLabel(key: string, long = false): string {
  return new Intl.DateTimeFormat("el-GR", { day: "numeric", month: long ? "long" : "short", year: long ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}
function rangeLabel(bucket: ActivityBucket): string {
  return bucket.key === bucket.end ? dateLabel(bucket.key, true) : `${dateLabel(bucket.key)} – ${dateLabel(bucket.end, true)}`;
}
function MiniMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <MetricCard variant="standard"><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.small}>{detail}</Text></MetricCard>;
}

function DashboardMetric({ label, value, detail, index }: { label: string; value: string; detail: string; index: number }) {
  return <MetricCard variant="dashboard" entranceDelay={80 + index * 65}>
    <View pointerEvents="none" accessible={false} style={[styles.metricAccent, index === 1 && styles.metricAccentReplay, index === 2 && styles.metricAccentDays]} />
    <Text style={styles.dashboardValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{value}</Text>
    <Text style={styles.dashboardLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
    <Text style={styles.dashboardDetail} numberOfLines={1}>{detail}</Text>
  </MetricCard>;
}

export default function LearningActivityPanel({ todayKey, compact = false, dashboard = false }: { todayKey: string; compact?: boolean; dashboard?: boolean }) {
  const snapshot = useLearningDataSnapshot(), daily = useDailyDataSnapshot();
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [selectedKey, setSelectedKey] = useState("");
  const dailyDates = useMemo(() => dailyHistory(daily.doc).map(row => row.dateKey), [daily.doc]);
  const summary = useMemo(() => activitySummary(snapshot.activity, snapshot.backup.completedIds, dailyDates, todayKey, [...Object.values(snapshot.weeklyReviews ?? {}).map(answer => getAthensDateKey(new Date(answer.at))), ...Object.values(snapshot.knowledgeReviews ?? {}).flatMap(dates => Object.keys(dates))]), [snapshot.activity, snapshot.backup.completedIds, snapshot.weeklyReviews, snapshot.knowledgeReviews, dailyDates, todayKey]);
  const buckets = useMemo(() => activityBuckets(snapshot.activity, todayKey, mode), [snapshot.activity, todayKey, mode]);
  const selected = buckets.find(bucket => bucket.key === selectedKey) ?? buckets[buckets.length - 1];
  // Derive the chart scale and total together; avoid two separate bucket scans.
  const { max, total } = useMemo(() => buckets.reduce(
    (result, bucket) => {
      const count = bucket.first + bucket.replay;
      result.max = Math.max(result.max, count);
      result.total += count;
      return result;
    },
    { max: 1, total: 0 },
  ), [buckets]);
  const switchMode = (value: "daily" | "weekly") => { setMode(value); setSelectedKey(""); };
  const barHeight = dashboard ? 88 : 120;


  return <View style={[styles.section, dashboard && styles.sectionDashboard]}>
    {!dashboard ? <Text style={styles.title}>Η δραστηριότητά σου</Text> : null}
    {compact && !dashboard ? <Text style={styles.small}>Αυτή την εβδομάδα: {summary.firstThisWeek} νέα μαθήματα · {summary.replaysThisWeek} επαναλήψεις</Text> : null}
    {dashboard ? <>
      <Text style={styles.dashboardHeading}>Αυτή την εβδομάδα</Text>
      <View style={styles.dashboardMetrics} testID="activity-dashboard-metrics">
        <DashboardMetric label="Νέα μαθήματα" value={String(summary.firstThisWeek)} detail="εβδομάδα" index={0} />
        <DashboardMetric label="Επαναλήψεις" value={String(summary.replaysThisWeek)} detail="εβδομάδα" index={1} />
        <DashboardMetric label="Ενεργές ημέρες" value={String(summary.activeDays)} detail="συνολικά" index={2} />
      </View>
    </> : !compact ? <View style={styles.metrics}>
      <MiniMetric label="ΝΕΑ ΜΑΘΗΜΑΤΑ" value={String(summary.firstThisWeek)} detail="αυτή την εβδομάδα" />
      <MiniMetric label="ΠΛΗΡΕΙΣ ΕΠΑΝΑΛΗΨΕΙΣ" value={String(summary.replaysThisWeek)} detail="αυτή την εβδομάδα" />
      <MiniMetric label="ΕΝΕΡΓΕΣ ΗΜΕΡΕΣ" value={String(summary.activeDays)} detail="συνολικά" />
      <MiniMetric label="ΑΚΡΙΒΕΙΑ ΜΑΘΗΜΑΤΩΝ" value={summary.accuracy === null ? "—" : `${summary.accuracy}%`} detail={summary.questions ? `${summary.correct} / ${summary.questions} σωστές` : "θα εμφανιστεί με την πρώτη ολοκλήρωση"} />
    </View> : null}
    <View style={[styles.chartCard, dashboard && styles.chartCardDashboard]} testID="activity-chart">
      <View style={dashboard ? styles.dashboardChartHeader : undefined}>
      <Text style={[styles.chartTitle, dashboard && styles.chartTitleDashboard]}>Ο ρυθμός σου</Text>
      <View style={[styles.switchRow, dashboard && styles.switchRowDashboard]}>
        {(["daily", "weekly"] as const).map(value => <Pressable key={value} onPress={() => switchMode(value)} accessibilityRole="button"
          accessibilityState={{ selected: mode === value }} style={[styles.switchButton, dashboard && styles.switchButtonDashboard, mode === value && styles.switchSelected]}>
          <Text style={[styles.switchText, dashboard && styles.switchTextDashboard, mode === value && styles.switchTextSelected]}>{value === "daily" ? "Ανά ημέρα" : "Ανά εβδομάδα"}</Text>
        </Pressable>)}
      </View>
      </View>
      {!dashboard ? <Text style={styles.period}>{mode === "daily" ? "Τελευταίες 7 ημέρες" : "Τελευταίες 8 εβδομάδες · από Δευτέρα"}</Text> : null}
      <View style={[styles.chart, dashboard && styles.chartDashboard]}>
        <View style={[styles.axis, dashboard && styles.axisDashboard]} accessible={false}><Text style={styles.axisText}>{max}</Text><Text style={styles.axisText}>0</Text></View>
        <View style={styles.bars}>
          {buckets.map((bucket, index) => {
            const count = bucket.first + bucket.replay, active = bucket.key === selected.key;
            return <MotionPressable key={`${mode}-${bucket.key}`} entranceDelay={dashboard ? 80 + index * 48 : undefined} pressScale={0.985} onPress={() => setSelectedKey(bucket.key)} accessibilityRole="button"
              accessibilityState={{ selected: active }} accessibilityLabel={`${rangeLabel(bucket)}: ${bucket.first} πρώτες ολοκληρώσεις, ${bucket.replay} επαναλήψεις`}
              style={[styles.column, dashboard && styles.columnDashboard, active && styles.selectedColumn, dashboard && active && styles.selectedColumnDashboard]}>
              <View style={[styles.barArea, dashboard && styles.barAreaDashboard]}>
                <Text style={[styles.barNumber, dashboard && styles.barNumberDashboard]}>{count}</Text>
                <View style={styles.stack}>
                  {bucket.replay > 0 ? <View style={[styles.replayBar, { height: barHeight * bucket.replay / max }]} /> : null}
                  {bucket.first > 0 ? <View style={[styles.firstBar, { height: barHeight * bucket.first / max }]} /> : null}
                  {count === 0 ? <View style={styles.zeroBar} /> : null}
                </View>
              </View>
              <Text style={[styles.barLabel, dashboard && styles.barLabelDashboard, active && styles.activeLabel]}>{new Date(`${bucket.key}T12:00:00Z`).getUTCDate()}{"\n"}{new Intl.DateTimeFormat("el-GR", { month: "short", timeZone: "UTC" }).format(new Date(`${bucket.key}T12:00:00Z`)).replace(".", "")}</Text>
            </MotionPressable>;
          })}
        </View>
      </View>
      <View style={[styles.legend, dashboard && styles.legendDashboard]}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: FIRST }]} /><Text style={styles.small}>Πρώτες ολοκληρώσεις</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: REPLAY }]} /><Text style={styles.small}>Πλήρεις επαναλήψεις</Text></View>
      </View>
      <View style={[styles.selection, dashboard && styles.selectionDashboard]} accessibilityLiveRegion="polite">
        <Text style={[styles.selectionTitle, dashboard && styles.selectionTitleDashboard]}>{rangeLabel(selected)}</Text>
        {dashboard ? <Text style={styles.dashboardSelectedSummary}>{selected.first} νέα · {selected.replay} επαναλήψεις</Text> : <Text style={styles.small}>{selected.first} νέα μαθήματα · {selected.replay} πλήρεις επαναλήψεις</Text>}
      </View>
      {!total ? <Text style={styles.hint}>Ολοκλήρωσε ένα μάθημα για να ξεκινήσεις.</Text> : null}
    </View>
    {dashboard ? <Text style={styles.dashboardAccuracy} testID="activity-accuracy">
      Ακρίβεια μαθημάτων: {summary.accuracy === null ? "—" : `${summary.accuracy}%`}
      {summary.questions > 0 ? ` · ${summary.correct} / ${summary.questions} σωστές` : ""}
    </Text> : null}
    {compact && !dashboard ? <Text style={styles.small}>{summary.activeDays} ενεργές ημέρες · Ακρίβεια μαθημάτων: {summary.accuracy === null ? "—" : `${summary.accuracy}%`}</Text> : null}
    {summary.undatedCount > 0 ? <Text style={styles.legacyNote}>{summary.undatedCount} παλιότερα μαθήματα χωρίς ημερομηνία — εκτός γραφήματος.</Text> : null}
  </View>;
}

export function CategoryProgress({ compact = false, detail = false, singleColumn = false, threeColumn = false }: { compact?: boolean; detail?: boolean; singleColumn?: boolean; threeColumn?: boolean } = {}) {
  const snapshot = useLearningDataSnapshot();
  const [expanded, setExpanded] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const rows = useMemo(
    () => categoryCompletionRows(snapshot.backup.completedIds),
    [snapshot.backup.completedIds],
  );
  // The detail screen begins with subjects already explored. Stable ties retain
  // catalogue order, and every subject is accessible via the disclosure.
  const ranked = compact || detail
    ? rows.slice().sort((a, b) => b.count - a.count
        || b.percent - a.percent || a.index - b.index)
    : rows;
  const limit = detail ? 4 : 3;
  const visible = (compact || detail) && !expanded ? ranked.slice(0, limit) : ranked;
  const selectedCategory = detail ? visible.find(row => row.category.id === selectedCategoryId) : undefined;

  return <View style={[styles.section, compact && styles.sectionCompact, detail && styles.sectionDetail]} testID="reading-category-progress">
    {detail ? <LearningSectionHeading title="ΟΙ ΘΕΜΑΤΙΚΕΣ ΣΟΥ" tone="reading" />
      : <Text style={[styles.title, compact && styles.titleCompact]}>Οι κόσμοι που εξερευνάς</Text>}
    <View style={[styles.categoryCard, compact && styles.categoryCardCompact,
      detail && styles.categoryCardDetail, detail && styles.categoryGrid,
      detail && singleColumn && styles.categoryGridSingle]}>
      {visible.map(({ category, count, total, percent }) => detail ? (
        <SubjectProgressTile key={category.id} tone="reading"
          title={category.title} emoji={category.emoji}
          completed={count} total={total} percent={percent}
          selected={selectedCategoryId === category.id}
          singleColumn={singleColumn} threeColumn={threeColumn} dense={detail}
          testID={`reading-subject-${category.id}`}
          onPress={() => setSelectedCategoryId(value => value === category.id ? null : category.id)}
          accessibilityLabel={`${category.title}, ${count} από ${total} ολοκληρωμένα μαθήματα, ${percent}%`} />
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
    {detail && selectedCategory ? <SubjectInsightPanel
      testID="reading-selected-subject" tone="reading"
      title={selectedCategory.category.title} current={selectedCategory.count}
      total={selectedCategory.total}
      caption={selectedCategory.total === 0
        ? "Δεν υπάρχουν ακόμη μαθήματα σε αυτή τη θεματική."
        : selectedCategory.count === selectedCategory.total
          ? "Ολοκλήρωσες όλα τα διαθέσιμα μαθήματα εδώ."
          : selectedCategory.count === 0
            ? "Επόμενος στόχος: το πρώτο ολοκληρωμένο μάθημα."
            : `Απομένουν ${selectedCategory.total - selectedCategory.count} μαθήματα για ολοκλήρωση.`} /> : null}
    {(compact || detail) && rows.length > limit ? (
      detail ? <SubjectShowAll testID="reading-all-subjects" tone="reading"
        expanded={expanded} count={rows.length} onPress={() => setExpanded(value => !value)} />
      : <Pressable
          style={({ pressed }) => [styles.categoryMore, pressed && styles.categoryMorePressed]}
          accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setExpanded(value => !value)}>
          <Text style={styles.categoryMoreText}>{expanded ? "Λιγότεροι κόσμοι −" : "Όλοι οι κόσμοι +"}</Text>
        </Pressable>
    ) : null}
  </View>;
}

const styles = StyleSheet.create({
  sectionDashboard: { marginTop: 0, marginBottom: 0, gap: 7 },
  dashboardChartHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  switchRowDashboard: { flex: 1, maxWidth: 176, borderRadius: 9, padding: 2, gap: 2 },
  switchButtonDashboard: { minHeight: 30, paddingVertical: 4, paddingHorizontal: 3, borderRadius: 7 },
  switchTextDashboard: { fontSize: 10, lineHeight: 15 },
  axisDashboard: { paddingTop: 20, paddingBottom: 30 },
  columnDashboard: { paddingTop: 0, paddingBottom: 2 },
  barNumberDashboard: { fontSize: 9, lineHeight: 13, marginBottom: 2 },
  barLabelDashboard: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  legendDashboard: { gap: 9 },
  selectionDashboard: { paddingTop: 7, gap: 1 },
  selectionTitleDashboard: { fontSize: 11, lineHeight: 16 },
  dashboardSelectedSummary: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  dashboardHeading: { color: colors.textBody, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  dashboardMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricAccent: { position: "absolute", left: 11, top: 0, width: 32, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: FIRST, opacity: 0.8 },
  metricAccentReplay: { backgroundColor: REPLAY },
  metricAccentDays: { backgroundColor: "#9B9EDB" },
  dashboardValue: { color: colors.accentLight, fontSize: 25, lineHeight: 30, fontWeight: "900", fontVariant: ["tabular-nums"] },
  dashboardLabel: { color: colors.text, fontSize: 10, lineHeight: 13, fontWeight: "800" },
  dashboardDetail: { color: colors.textMuted, fontSize: 9, lineHeight: 12 },
  dashboardAccuracy: { color: colors.textMuted, fontSize: 11, lineHeight: 17, paddingHorizontal: 3, marginTop: 3 },
  chartCardDashboard: { padding: 13, gap: 8, borderColor: "#44415E", backgroundColor: "#1D2337" },
  chartTitleDashboard: { fontSize: 15, lineHeight: 20, fontWeight: "800" },
  chartDashboard: { paddingTop: 0 },
  barAreaDashboard: { height: 112 },
  selectedColumnDashboard: { backgroundColor: "#302C49", borderWidth: 1, borderColor: "#635784", paddingHorizontal: 0 },
  section: { marginTop: 14, marginBottom: 14, gap: 12 },
  sectionCompact: { marginTop: 0, marginBottom: 0, gap: 8 },
  sectionDetail: { marginTop: 0, marginBottom: 0, gap: 10 },
  titleCompact: { fontSize: 14, lineHeight: 20 },
  categoryCardCompact: { padding: 12, gap: 10 },
  categoryCardDetail: { backgroundColor: "transparent", borderWidth: 0, padding: 0, gap: 0 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  categoryGridSingle: { flexDirection: "column" },
  categoryCompact: { gap: 5 },
  categoryMore: { minHeight: 44, justifyContent: "center", alignItems: "flex-end" },
  categoryMorePressed: { opacity: 0.75 },
  categoryMoreText: { color: colors.accentLight, fontSize: 13, fontWeight: "700" },
  title: { color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: "800" },
  small: { color: colors.textMuted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
