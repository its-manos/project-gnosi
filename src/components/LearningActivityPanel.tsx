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

export default function LearningActivityPanel({ todayKey }: { todayKey: string }) {
  const snapshot = useLearningSnapshot(), daily = useDailySnapshot();
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [selectedKey, setSelectedKey] = useState("");
  const dailyDates = useMemo(() => dailyHistory(daily.doc).map(row => row.dateKey), [daily.doc]);
  const summary = useMemo(() => activitySummary(snapshot.activity, snapshot.backup.completedIds, dailyDates, todayKey, Object.values(snapshot.weeklyReviews ?? {}).map(answer => getAthensDateKey(new Date(answer.at)))), [snapshot.activity, snapshot.backup.completedIds, snapshot.weeklyReviews, dailyDates, todayKey]);
  const buckets = useMemo(() => activityBuckets(snapshot.activity, todayKey, mode), [snapshot.activity, todayKey, mode]);
  const selected = buckets.find(bucket => bucket.key === selectedKey) ?? buckets[buckets.length - 1];
  const max = Math.max(1, ...buckets.map(bucket => bucket.first + bucket.replay));
  const total = buckets.reduce((sum, bucket) => sum + bucket.first + bucket.replay, 0);
  const switchMode = (value: "daily" | "weekly") => { setMode(value); setSelectedKey(""); };

  return <View style={styles.section}>
    <Text style={styles.title}>Η δραστηριότητά σου</Text>
    <Text style={styles.small}>Οι πρώτες ολοκληρώσεις και οι πλήρεις επαναλήψεις μετριούνται χωριστά. Η εξάσκηση στα λάθη δεν προσθέτει νέα προσπάθεια.</Text>
    <View style={styles.metrics}>
      <MiniMetric label="ΝΕΑ ΜΑΘΗΜΑΤΑ" value={String(summary.firstThisWeek)} detail="αυτή την εβδομάδα" />
      <MiniMetric label="ΠΛΗΡΕΙΣ ΕΠΑΝΑΛΗΨΕΙΣ" value={String(summary.replaysThisWeek)} detail="αυτή την εβδομάδα · ανεξάρτητα από το σκορ" />
      <MiniMetric label="ΕΝΕΡΓΕΣ ΗΜΕΡΕΣ" value={String(summary.activeDays)} detail="με μάθημα, ημερήσιο quiz ή δεύτερη ευκαιρία" />
      <MiniMetric label="ΑΚΡΙΒΕΙΑ ΜΑΘΗΜΑΤΩΝ" value={summary.accuracy === null ? "—" : `${summary.accuracy}%`} detail={summary.questions ? `${summary.correct} / ${summary.questions} σωστές στις καταγεγραμμένες ολοκληρώσεις` : "θα εμφανιστεί με την πρώτη ολοκλήρωση"} />
    </View>
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Ο ρυθμός σου</Text>
      <View style={styles.switchRow}>
        {(["daily", "weekly"] as const).map(value => <Pressable key={value} onPress={() => switchMode(value)} accessibilityRole="button"
          accessibilityState={{ selected: mode === value }} style={[styles.switchButton, mode === value && styles.switchSelected]}>
          <Text style={[styles.switchText, mode === value && styles.switchTextSelected]}>{value === "daily" ? "Ανά ημέρα" : "Ανά εβδομάδα"}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.period}>{mode === "daily" ? "Τελευταίες 7 ημέρες" : "Τελευταίες 8 εβδομάδες · από Δευτέρα"}</Text>
      <Text style={styles.small}>{mode === "weekly" ? "Η τρέχουσα εβδομάδα περιλαμβάνει όσα ολοκλήρωσες μέχρι σήμερα." : "Οι ημέρες υπολογίζονται με την ώρα Ελλάδας."}</Text>
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
      <Text style={styles.hint}>{total ? "Πάτησε μια στήλη για τις λεπτομέρειες." : "Οι πρώτες στήλες θα εμφανιστούν όταν ολοκληρώσεις ένα μάθημα."}</Text>
    </View>
    {summary.undatedCount > 0 ? <Text style={styles.legacyNote}>{summary.undatedCount} παλιότερα ολοκληρωμένα μαθήματα παραμένουν στο σύνολό σου. Δεν εμφανίζονται στις στήλες, επειδή δεν είχε καταγραφεί η ημερομηνία τους.</Text> : null}
  </View>;
}

export function CategoryProgress() {
  const snapshot = useLearningSnapshot(), completed = new Set(snapshot.backup.completedIds);
  return <View style={styles.section}>
    <Text style={styles.title}>Οι κόσμοι που εξερευνάς</Text>
    <Text style={styles.small}>Μοναδικά ολοκληρωμένα μαθήματα ανά θεματική, μαζί με τις παλιότερες ολοκληρώσεις.</Text>
    <View style={styles.categoryCard}>{categories.map(category => {
      const items = lessons.filter(lesson => lesson.categoryId === category.id);
      const count = items.filter(lesson => completed.has(lesson.id)).length;
      const percent = items.length ? Math.round(count / items.length * 100) : 0;
      return <View key={category.id} style={styles.category} accessible accessibilityRole="progressbar"
        accessibilityLabel={category.title} accessibilityValue={{ min: 0, max: items.length || 1, now: count, text: `${count} από ${items.length} μαθήματα, ${percent}%` }}>
        <View style={styles.categoryHeader}><Text style={styles.categoryTitle}>{category.emoji} {category.title}</Text><Text style={styles.categoryCount}>{count} / {items.length}</Text></View>
        <View style={styles.categoryTrack}><View style={[styles.categoryFill, { width: `${percent}%` }]} /></View>
      </View>;
    })}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 14, marginBottom: 14, gap: 12 },
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
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  selection: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 3 },
  selectionTitle: { color: colors.textBody, fontSize: 13, lineHeight: 21, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 18 },
  legacyNote: { color: colors.textMuted, fontSize: 12, lineHeight: 20, paddingHorizontal: 2 },
  categoryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 18 },
  category: { gap: 8 }, categoryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryTitle: { flex: 1, color: colors.textBody, fontSize: 13, lineHeight: 21, fontWeight: "600" },
  categoryCount: { color: colors.accentLight, fontSize: 12, lineHeight: 20 },
  categoryTrack: { height: 6, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  categoryFill: { height: "100%", backgroundColor: FIRST, borderRadius: 4 },
});
