import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useDailySnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import LearningActivityPanel from "../components/LearningActivityPanel";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { MotionPressable, MotionView } from "../components/HomeMotion";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

function formatDate(dateKey: string): string {
  const date = new Date(dateKey + "T12:00:00Z");
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Athens",
  }).format(date);
}

export default function PlayerStatsScreen({ onBack }: { onBack: () => void }) {
  const daily = useDailySnapshot();
  const [dailyExpanded, setDailyExpanded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const { width, fontScale } = useWindowDimensions();
  // Preserve the screen-fitting dashboard on standard phones; use the accessible
  // scrolling layout when compact widths or enlarged text would clip content.
  const allowScroll = dailyExpanded || (viewportHeight > 0 && viewportHeight < 575) || width < 350 || fontScale > 1.2;
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

  return (
    <View style={styles.screen} testID="player-stats-screen" onLayout={event => { const next = event.nativeEvent.layout.height; if (next > 0) setViewportHeight(previous => Math.abs(previous - next) < 1 ? previous : next); }}>
      <ProgressGradientBackground />
      {allowScroll ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} testID="stats-accessibility-scroll">
        <AppHeader onBack={onBack} />
        <SyncStatus quiet />
        <MotionView entranceDelay={0} style={styles.heading}>
          <Text style={styles.eyebrow}>Ο ΡΥΘΜΟΣ ΣΟΥ</Text>
          <Text style={styles.title}>Η δραστηριότητά σου</Text>
          <Text style={styles.intro}>Η συνέπειά σου, μέρα με τη μέρα.</Text>
        </MotionView>

        <MotionView entranceDelay={65} style={styles.activityOverview} testID="activity-overview">
          <LearningActivityPanel todayKey={todayKey} dashboard />
        </MotionView>

        <MotionView entranceDelay={115} style={styles.quizSection} testID="progress-daily">
          <MotionPressable
            style={styles.disclosure} pressScale={0.985}
            accessibilityRole="button"
            accessibilityState={{ expanded: dailyExpanded }}
            onPress={() => setDailyExpanded(value => !value)}
          >
            <View style={styles.accountCopy}>
              <Text style={styles.accountTitle}>Καθημερινά quiz</Text>
              <Text style={styles.muted}>
                {historyLoaded
                  ? stats.completedChallenges + " ολοκληρωμένα · " + stats.totalPoints.toLocaleString("el-GR") + " πόντοι"
                  : "Φόρτωση στατιστικών…"}
              </Text>
            </View>
            <Text style={styles.chevron} accessible={false}>{dailyExpanded ? "−" : "+"}</Text>
          </MotionPressable>
          {dailyExpanded ? (
            <View testID="progress-daily-details" style={styles.dailyDetails}>
              {!historyLoaded ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={colors.accentLight} />
                  <Text style={styles.muted}>Φόρτωση στατιστικών…</Text>
                </View>
              ) : (
                <>
                  <View style={styles.streakRow}>
                    <View style={styles.streakCard}>
                      <Text style={styles.metricLabel}>ΤΡΕΧΟΝ ΣΕΡΙ QUIZ</Text>
                      <Text style={styles.streakValue}>{stats.currentStreak}<Text style={styles.streakUnit}> ημέρες</Text></Text>
                    </View>
                    <View style={styles.streakCard}>
                      <Text style={styles.metricLabel}>ΜΕΓΑΛΥΤΕΡΟ ΣΕΡΙ</Text>
                      <Text style={styles.streakValue}>{stats.longestStreak}<Text style={styles.streakUnit}> ημέρες</Text></Text>
                    </View>
                  </View>

                  <View style={styles.accuracyCard}>
                    <View style={styles.accuracyHeader}>
                      <View style={styles.accuracyCopy}>
                        <Text style={styles.metricLabel}>ΑΚΡΙΒΕΙΑ QUIZ</Text>
                        <Text style={styles.accuracyValue}>{stats.totalAnswers ? stats.accuracyPercent + "%" : "—"}</Text>
                      </View>
                      <Text style={styles.accuracyCount}>{stats.totalCorrectAnswers} / {stats.totalAnswers} σωστές</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.trackFill, { width: stats.accuracyPercent + "%" }]} />
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
            </View>
          ) : null}
        </MotionView>
      </ScrollView> : <View style={[styles.content, styles.fixedContent]} testID="stats-fixed-dashboard">
        <AppHeader onBack={onBack} />
        <SyncStatus quiet />
        <MotionView entranceDelay={0} style={styles.heading}>
          <Text style={styles.eyebrow}>Ο ΡΥΘΜΟΣ ΣΟΥ</Text>
          <Text style={styles.title}>Η δραστηριότητά σου</Text>
        </MotionView>
        <MotionView entranceDelay={65} style={styles.activityOverview} testID="activity-overview">
          <LearningActivityPanel todayKey={todayKey} dashboard />
        </MotionView>
        <MotionView entranceDelay={115} style={styles.quizSection} testID="progress-daily">
          <MotionPressable style={styles.disclosure} pressScale={0.985}
            accessibilityRole="button" accessibilityState={{ expanded: false }}
            onPress={() => setDailyExpanded(true)}>
            <View style={styles.accountCopy}>
              <Text style={styles.accountTitle}>Καθημερινά quiz</Text>
              <Text style={styles.muted}>{historyLoaded ? stats.completedChallenges + " ολοκληρωμένα · " + stats.totalPoints.toLocaleString("el-GR") + " πόντοι" : "Φόρτωση στατιστικών…"}</Text>
            </View>
            <Text style={styles.chevron} accessible={false}>+</Text>
          </MotionPressable>
        </MotionView>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: "#101827" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 18 },
  fixedContent: { flex: 1, minHeight: 0, justifyContent: "space-evenly" },
  heading: { gap: 2, marginTop: 1, marginBottom: 7 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: "900" },
  intro: { color: colors.textBody, fontSize: 12, lineHeight: 19 },
  activityOverview: { marginBottom: 8 },
  quizSection: { marginBottom: 6 },
  disclosure: { flexDirection: "row", alignItems: "center", minHeight: 55, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: "#20243C", borderWidth: 1, borderColor: "#484360", borderRadius: 18 },

  accountCopy: { flex: 1, gap: 4, paddingRight: 10 },
  accountTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  chevron: { color: colors.accentLight, fontSize: 25, fontWeight: "500", paddingHorizontal: 5 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  dailyDetails: { paddingTop: 10, paddingBottom: 12 },
  streakRow: { flexDirection: "row", gap: 9 },
  streakCard: { flex: 1, minWidth: 0, minHeight: 83, padding: 13, justifyContent: "space-between", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 15 },
  metricLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.45 },
  streakValue: { color: colors.accentLight, fontSize: 26, lineHeight: 34, fontWeight: "900", fontVariant: ["tabular-nums"] },
  streakUnit: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  loadingCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, padding: 24, backgroundColor: colors.surface, borderRadius: 17 },
  accuracyCard: { marginTop: 10, padding: 15, backgroundColor: colors.surfaceSoft, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  accuracyHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
  accuracyCopy: { flex: 1 },
  accuracyValue: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900", marginTop: 3 },
  accuracyCount: { color: colors.textBody, fontSize: 11, textAlign: "right", marginBottom: 6, flexShrink: 1 },
  track: { height: 7, overflow: "hidden", backgroundColor: "#282D40", borderRadius: 20, marginTop: 11 },
  trackFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 20 },
  sectionTitle: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "900", marginTop: 19, marginBottom: 10 },
  emptyCard: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  historyList: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden" },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 12, borderBottomColor: colors.border, borderBottomWidth: 1 },
  historyDateBlock: { flex: 1, paddingRight: 12 },
  historyDate: { color: colors.text, fontSize: 13, fontWeight: "800", textTransform: "capitalize" },
  historySubtext: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  historyScoreBlock: { alignItems: "flex-end", minWidth: 54 },
  historyScore: { color: colors.accentLight, fontSize: 20, fontWeight: "900" },
  historyScoreMeta: { color: colors.textMuted, fontSize: 10 },
});
