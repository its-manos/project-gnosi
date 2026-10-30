import type { BackupControls } from "../components/CloudBackupPanel";
import SyncStatus from "../components/SyncStatus";
import AccountPanel from "../components/AccountPanel";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import type { Lesson } from "../data/lessons";
import {
  createCompletedHistoryEntry,
  DAILY_CHALLENGE_HISTORY_STORAGE_KEY,
  parseDailyChallengeHistory,
  upsertDailyChallengeHistory,
  type DailyChallengeHistoryEntry,
} from "../utils/dailyChallengeHistory";
import { DAILY_CHALLENGE_STORAGE_KEY, getAthensDateKey, parseDailyChallengeRecord } from "../utils/dailyChallenge";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { colors } from "../theme";

type Props = {
  backupControls?: BackupControls;
  canResetLessonProgress?: boolean;
  onHome: () => void;
  completedLessons: Lesson[];
  inProgressLesson: Lesson | null;
  inProgressAnsweredCount: number;
  inProgressQuestionCount: number;
  inProgressLessonCount: number;
  totalLessonCount: number;
  lessonProgressLoaded: boolean;
  onOpenLesson: (lessonId: string) => void;
  onResetLessonProgressForDevelopment: () => Promise<void>;
};

function formatDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Athens",
  }).format(date);
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export default function ProgressScreen({
  backupControls,
  canResetLessonProgress = true,
  onHome,
  completedLessons,
  inProgressLesson,
  inProgressAnsweredCount,
  inProgressQuestionCount,
  inProgressLessonCount,
  totalLessonCount,
  lessonProgressLoaded,
  onOpenLesson,
  onResetLessonProgressForDevelopment,
}: Props) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [history, setHistory] = useState<DailyChallengeHistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  // The progress tab is mounted when opened, so re-read local history on every
  // visit instead of relying on a stale copy held by the navigation layer.
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const [historyValue, currentValue] = await AsyncStorage.multiGet([
          DAILY_CHALLENGE_HISTORY_STORAGE_KEY,
          DAILY_CHALLENGE_STORAGE_KEY,
        ]).then((pairs) => [pairs[0]?.[1] ?? null, pairs[1]?.[1] ?? null]);

        let nextHistory = parseDailyChallengeHistory(historyValue);
        const todayKey = getAthensDateKey();
        const currentRecord = parseDailyChallengeRecord(currentValue, todayKey);
        const migratedEntry = currentRecord ? createCompletedHistoryEntry(currentRecord) : null;
        if (migratedEntry) {
          nextHistory = upsertDailyChallengeHistory(nextHistory, migratedEntry);
          await AsyncStorage.setItem(DAILY_CHALLENGE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
        }

        if (isMounted) setHistory(nextHistory);
      } catch (error) {
        console.warn("Could not load daily challenge history:", error);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setHistoryLoaded(true);
      }
    }

    void loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => calculateDailyChallengeProgress(history, todayKey),
    [history, todayKey],
  );

  function confirmResetLessonProgress() {
    if (!__DEV__ || !lessonProgressLoaded || isResetting) return;

    Alert.alert(
      "Καθαρισμός προόδου μαθημάτων",
      "Θα διαγραφούν τα ολοκληρωμένα μαθήματα και οι ημιτελείς προσπάθειες ανάγνωσης από αυτή τη συσκευή. Τα αποθηκευμένα άρθρα και η πρόοδος της καθημερινής πρόκλησης δεν θα αλλάξουν.",
      [
        { text: "Άκυρο", style: "cancel" },
        {
          text: "Διαγραφή προόδου",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              await onResetLessonProgressForDevelopment();
            } catch {
              Alert.alert("Δεν έγινε η διαγραφή", "Δεν ήταν δυνατή η διαγραφή της προόδου μαθημάτων. Δες τα μηνύματα στο terminal.");
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  }

  const lessonProgressPercent = totalLessonCount > 0
    ? Math.min(100, Math.round((completedLessons.length / totalLessonCount) * 100))
    : 0;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" style={styles.header} />
      <SyncStatus detailed />
      <View style={styles.accountSection}>
        <ActionButton label={isAccountOpen ? "Απόκρυψη στοιχείων λογαριασμού" : "Λογαριασμός — Σύνδεση / Εγγραφή"} style={styles.accountButton} secondary onPress={() => setIsAccountOpen((open) => !open)} />
        {isAccountOpen ? <AccountPanel backupControls={backupControls} /> : null}
      </View>

      <Text style={styles.eyebrow}>Η ΔΙΑΔΡΟΜΗ ΣΟΥ</Text>
      <Text style={styles.title}>Η πρόοδός σου</Text>
      <Text style={styles.intro}>Κάθε μικρό βήμα προσθέτει μια νέα γνώση. Δες πώς τα πηγαίνεις στις καθημερινές προκλήσεις και στα άρθρα.</Text>

      <Text style={styles.sectionTitle}>Καθημερινή πρόκληση</Text>
      {!historyLoaded ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.accentLight} />
          <Text style={styles.muted}>Φόρτωση στατιστικών…</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <MetricCard label="ΤΡΕΧΟΝ ΣΕΡΙ" value={`${stats.currentStreak}`} detail={stats.currentStreak === 1 ? "ημέρα" : "ημέρες"} />
            <MetricCard label="ΜΕΓΑΛΥΤΕΡΟ ΣΕΡΙ" value={`${stats.longestStreak}`} detail={stats.longestStreak === 1 ? "ημέρα" : "ημέρες"} />
            <MetricCard label="ΟΛΟΚΛΗΡΩΜΕΝΑ QUIZ" value={`${stats.completedChallenges}`} detail="ημερήσιες προκλήσεις" />
            <MetricCard label="ΣΥΝΟΛΙΚΟΙ ΠΟΝΤΟΙ" value={stats.totalPoints.toLocaleString("el-GR")} detail="100 πόντοι ανά σωστή απάντηση" />
          </View>

          <View style={styles.accuracyCard}>
            <View style={styles.accuracyHeader}>
              <View style={styles.accuracyCopy}>
                <Text style={styles.metricLabel}>ΣΥΝΟΛΙΚΗ ΑΚΡΙΒΕΙΑ</Text>
                <Text style={styles.accuracyValue}>{stats.accuracyPercent}%</Text>
              </View>
              <Text style={styles.accuracyCount}>{stats.totalCorrectAnswers} / {stats.totalAnswers} σωστές</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${stats.accuracyPercent}%` }]} />
            </View>
            <Text style={styles.metricDetail}>Η ακρίβεια υπολογίζεται από όλες τις ολοκληρωμένες ημερήσιες προκλήσεις.</Text>
          </View>

          <Text style={styles.sectionTitle}>Πρόσφατες προκλήσεις</Text>
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Η πρώτη σου πρόκληση σε περιμένει</Text>
              <Text style={styles.muted}>Μόλις ολοκληρώσεις την πρώτη ημερήσια πρόκληση, θα εμφανιστούν εδώ το σκορ και οι επιδόσεις σου.</Text>
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

      <Text style={styles.sectionTitle}>Μαθήματα</Text>
      {!lessonProgressLoaded ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.accentLight} />
          <Text style={styles.muted}>Φόρτωση προόδου μαθημάτων…</Text>
        </View>
      ) : (
        <View style={styles.lessonProgressCard}>
          <View style={styles.lessonProgressHeader}>
            <Text style={styles.lessonProgressHeading}>Ολοκληρωμένα μαθήματα</Text>
            <Text style={styles.lessonProgressCount}>{completedLessons.length} / {totalLessonCount}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${lessonProgressPercent}%` }]} />
          </View>
          <Text style={styles.metricDetail}>{lessonProgressPercent}% του διαθέσιμου περιεχομένου έχει ολοκληρωθεί.</Text>

          {inProgressLesson ? (
            <Pressable style={styles.inProgressRow} onPress={() => onOpenLesson(inProgressLesson.id)} accessibilityRole="button">
              <View style={styles.lessonTextBlock}>
                <Text style={styles.lessonStatus}>ΣΕ ΕΞΕΛΙΞΗ</Text>
                <Text style={styles.lessonTitle}>{inProgressLesson.title}</Text>
                <Text style={styles.muted}>{inProgressAnsweredCount} / {inProgressQuestionCount} ερωτήσεις checkpoint απαντήθηκαν</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}

          {completedLessons.length > 0 ? (
            <View style={styles.completedLessonSection}>
              <Text style={styles.subsectionTitle}>Ολοκληρωμένα</Text>
              {completedLessons.slice(0, 5).map((lesson) => (
                <Pressable key={lesson.id} style={styles.completedLessonRow} onPress={() => onOpenLesson(lesson.id)} accessibilityRole="button">
                  <Text style={styles.completedMark}>✓</Text>
                  <Text style={styles.completedLessonTitle}>{lesson.title}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
              {completedLessons.length > 5 ? <Text style={styles.muted}>Και {completedLessons.length - 5} ακόμη μαθήματα.</Text> : null}
            </View>
          ) : (
            <Text style={styles.muted}>Δεν έχεις ολοκληρώσει ακόμη κάποιο μάθημα.</Text>
          )}
          {inProgressLessonCount > 1 ? <Text style={styles.muted}>Έχεις {inProgressLessonCount} ημιτελείς προσπάθειες αποθηκευμένες.</Text> : null}
        </View>
      )}

      {__DEV__ ? (
        <View style={styles.devTools}>
          <Text style={styles.devLabel}>ΕΡΓΑΛΕΙΑ ΑΝΑΠΤΥΞΗΣ</Text>
          <Text style={styles.devDescription}>Διαθέσιμο μόνο ως επισκέπτης. Καθαρίζει τοπικές ολοκληρώσεις και ημιτελείς προσπάθειες, χωρίς να διαγράφει δεδομένα λογαριασμού.</Text>
          <ActionButton
            label={isResetting ? "Γίνεται καθαρισμός…" : "Καθαρισμός προόδου μαθημάτων (DEV)"}
            onPress={confirmResetLessonProgress}
            secondary
            disabled={!canResetLessonProgress || !lessonProgressLoaded || isResetting}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 12 },
  accountSection: { marginBottom: 24 },
  accountButton: { marginTop: 0 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
  title: { color: colors.text, fontSize: 31, lineHeight: 39, fontWeight: "900", marginBottom: 10 },
  intro: { color: colors.textBody, fontSize: 14, lineHeight: 22, marginBottom: 25 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 15, marginBottom: 13 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "48%", flexGrow: 1, minHeight: 112, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 15, justifyContent: "space-between" },
  metricLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, lineHeight: 14 },
  metricValue: { color: colors.accentLight, fontSize: 29, fontWeight: "900", marginVertical: 5 },
  metricDetail: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  loadingCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, padding: 24, backgroundColor: colors.surface, borderRadius: 17 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  accuracyCard: { marginTop: 12, padding: 17, backgroundColor: colors.surfaceSoft, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  accuracyHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
  accuracyCopy: { flex: 1 },
  accuracyValue: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 4 },
  accuracyCount: { color: colors.textBody, fontSize: 11, textAlign: "right", marginBottom: 6 },
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
  lessonProgressCard: { padding: 17, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 11 },
  lessonProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  lessonProgressHeading: { color: colors.text, fontSize: 14, fontWeight: "800", flex: 1 },
  lessonProgressCount: { color: colors.accentLight, fontSize: 14, fontWeight: "900" },
  inProgressRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 3 },
  lessonTextBlock: { flex: 1, paddingRight: 12 },
  lessonStatus: { color: colors.accentLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  lessonTitle: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  chevron: { color: colors.accentLight, fontSize: 28, fontWeight: "400", paddingLeft: 6 },
  completedLessonSection: { marginTop: 5, gap: 2 },
  subsectionTitle: { color: colors.textBody, fontSize: 11, fontWeight: "800", marginBottom: 7 },
  completedLessonRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  completedMark: { color: colors.success, fontSize: 15, fontWeight: "900" },
  completedLessonTitle: { color: colors.textBody, fontSize: 12, flex: 1 },
  devTools: { marginTop: 26, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#121523" },
  devLabel: { color: colors.accentLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 },
  devDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
});
