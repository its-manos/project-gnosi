import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { lessons, type Lesson } from "../data/lessons";
import { lessonScores } from "../utils/weeklyReview";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import LearningActivityPanel from "../components/LearningActivityPanel";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";
function formatDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Athens",
  }).format(date);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, styles.cardLabel]}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function PlayerStatsScreen({ onBack, completedLessons, totalLessonCount, lessonProgressLoaded }: { onBack: () => void; completedLessons: Lesson[]; totalLessonCount: number; lessonProgressLoaded: boolean }) {
  const learning = useLearningSnapshot();
  const daily = useDailySnapshot();
  const [dailyExpanded, setDailyExpanded] = useState(false);
  const mastery = useMemo(() => {
    const rows = lessons.map(lesson => lessonScores(lesson, learning.activity, learning.weeklyReviews));
    return { count: rows.reduce((sum, row) => sum + row.mastered, 0), unknown: completedLessons.filter(lesson => !lessonScores(lesson, learning.activity, learning.weeklyReviews).hasDetails).length };
  }, [learning.activity, learning.weeklyReviews, completedLessons]);
  const history = useMemo(() => dailyHistory(daily.doc), [daily.doc]);
  const historyLoaded = daily.ready;
  const [todayKey, setTodayKey] = useState(() => getAthensDateKey());

  useEffect(() => {
    const refreshDate = () => setTodayKey(getAthensDateKey());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDate();
    });
    const interval = setInterval(refreshDate, 60_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(
    () => calculateDailyChallengeProgress(history, todayKey),
    [history, todayKey],
  );

  const lessonProgressPercent = totalLessonCount ? Math.min(100, Math.round(completedLessons.length / totalLessonCount * 100)) : 0;
  return <ScrollView contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} /><SyncStatus quiet />
    <Text style={styles.title}>Τα στατιστικά σου</Text>
    <Text style={styles.intro}>Ο ρυθμός σου, οι ανακαλύψεις σου και οι καθημερινές προκλήσεις σου.</Text>
      <View testID="progress-overview" style={styles.overview}>
        <View style={styles.completionHero}>
          <Text style={styles.metricLabel}>ΟΛΟΚΛΗΡΩΜΕΝΑ ΜΑΘΗΜΑΤΑ</Text>
          <Text style={styles.heroValue}>{lessonProgressLoaded ? completedLessons.length : "—"}<Text style={styles.heroTotal}> / {totalLessonCount}</Text></Text>
          <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Ολοκληρωμένα μαθήματα" accessibilityValue={{ min: 0, max: totalLessonCount || 1, now: lessonProgressLoaded ? completedLessons.length : 0 }}>
            <View style={[styles.trackFill, { width: lessonProgressLoaded ? `${lessonProgressPercent}%` : "0%" }]} />
          </View>
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard label="ΤΡΕΧΟΝ ΗΜΕΡΗΣΙΟ ΣΕΡΙ" value={historyLoaded ? String(stats.currentStreak) : "—"} />
          <MetricCard label="ΣΩΣΤΑ ΑΠΑΝΤΗΜΕΝΕΣ ΕΡΩΤΗΣΕΙΣ" value={learning.ready ? String(mastery.count) : "—"} />
        </View>
        {learning.ready && mastery.unknown > 0 ? <Text style={styles.muted}>Παλιότερα σκορ χωρίς ανάλυση: χρειάζεται επανάληψη.</Text> : null}
      </View>

    <LearningActivityPanel todayKey={todayKey} />
      <View testID="progress-daily">
        <Pressable style={styles.disclosure} accessibilityRole="button" accessibilityState={{ expanded: dailyExpanded }} onPress={() => setDailyExpanded(value => !value)}>
          <View style={styles.accountCopy}><Text style={styles.accountTitle}>Οι καθημερινές προκλήσεις σου</Text><Text style={styles.muted}>{historyLoaded ? `${stats.completedChallenges} quiz · ${stats.totalPoints.toLocaleString("el-GR")} πόντοι` : "Φόρτωση στατιστικών…"}</Text></View><Text style={styles.chevron}>{dailyExpanded ? "−" : "+"}</Text>
        </Pressable>
        {dailyExpanded ? <View testID="progress-daily-details" style={styles.dailyDetails}>
      {!historyLoaded ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.accentLight} />
          <Text style={styles.muted}>Φόρτωση στατιστικών…</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <MetricCard label="ΜΕΓΑΛΥΤΕΡΟ ΣΕΡΙ" value={`${stats.longestStreak}`} />
            <MetricCard label="ΟΛΟΚΛΗΡΩΜΕΝΑ QUIZ" value={`${stats.completedChallenges}`} />
            <MetricCard label="ΣΥΝΟΛΙΚΟΙ ΠΟΝΤΟΙ" value={stats.totalPoints.toLocaleString("el-GR")} />
          </View>

          <View style={styles.accuracyCard}>
            <View style={styles.accuracyHeader}>
              <View style={styles.accuracyCopy}>
                <Text style={styles.metricLabel}>ΣΥΝΟΛΙΚΗ ΑΚΡΙΒΕΙΑ</Text>
                <Text style={styles.accuracyValue}>{stats.totalAnswers ? `${stats.accuracyPercent}%` : "—"}</Text>
              </View>
              <Text style={styles.accuracyCount}>{stats.totalCorrectAnswers} / {stats.totalAnswers} σωστές</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${stats.accuracyPercent}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Πρόσφατες προκλήσεις</Text>
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Η πρώτη σου πρόκληση σε περιμένει</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.slice(0, 10).map((entry) => (
                <View key={entry.dateKey} style={styles.historyRow}>
                  <View style={styles.historyDateBlock}>
                    <Text style={styles.historyDate}>{formatDate(entry.dateKey)}</Text>
                    <Text style={styles.historySubtext}>{entry.correctCount} / 7 σωστές απαντήσεις</Text>
                  </View>
                  <View style={styles.historyScoreBlock}>
                    <Text style={styles.historyScore}>{entry.score}</Text>
                    <Text style={styles.historyScoreMeta}>πόντοι</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
        </View> : null}
      </View>

  </ScrollView>;
}
const styles = StyleSheet.create({
  overview: { gap: 12, marginTop: 4, marginBottom: 16 },
  completionHero: { backgroundColor: colors.accentSurface, borderRadius: 22, borderColor: colors.borderStrong, borderWidth: 1, padding: 20 },
  heroValue: { color: colors.text, fontSize: 44, lineHeight: 56, fontWeight: "900", marginTop: 8 },
  heroTotal: { color: colors.textMuted, fontSize: 20, fontWeight: "600" },
  disclosure: { flexDirection: "row", alignItems: "center", minHeight: 72, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, marginVertical: 8 },
  dailyDetails: { paddingBottom: 12 },
  accountCopy: { flex: 1, gap: 4 },
  accountTitle: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "800" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42 },
  title: { color: colors.text, fontSize: 31, lineHeight: 39, fontWeight: "900", marginBottom: 10 },
  intro: { color: colors.textBody, fontSize: 14, lineHeight: 22, marginBottom: 25 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 15, marginBottom: 13 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { flexBasis: "46%", flexGrow: 1, minHeight: 112, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 15, gap: 8 },
  metricLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, lineHeight: 14 },
  cardLabel: { minHeight: 28, flexGrow: 1 },
  metricValue: { color: colors.accentLight, fontSize: 29, lineHeight: 38, fontWeight: "900", fontVariant: ["tabular-nums"] },
  loadingCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, padding: 24, backgroundColor: colors.surface, borderRadius: 17 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  accuracyCard: { marginTop: 12, padding: 17, backgroundColor: colors.surfaceSoft, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  accuracyHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
  accuracyCopy: { flex: 1 },
  accuracyValue: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 4 },
  accuracyCount: { color: colors.textBody, fontSize: 11, textAlign: "right", marginBottom: 6, flexShrink: 1 },
  track: { height: 7, overflow: "hidden", backgroundColor: "#282D40", borderRadius: 20, marginTop: 13 },
  trackFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 20 },
  emptyCard: { padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  historyList: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 18, overflow: "hidden" },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomColor: colors.border, borderBottomWidth: 1 },
  historyDateBlock: { flex: 1, paddingRight: 12 },
  historyDate: { color: colors.text, fontSize: 13, fontWeight: "800", textTransform: "capitalize" },
  historySubtext: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  historyScoreBlock: { alignItems: "flex-end", minWidth: 54 },
  historyScore: { color: colors.accentLight, fontSize: 20, fontWeight: "900" },
  historyScoreMeta: { color: colors.textMuted, fontSize: 10 },
  chevron: { color: colors.accentLight, fontSize: 28, fontWeight: "400", paddingLeft: 6 },
});
