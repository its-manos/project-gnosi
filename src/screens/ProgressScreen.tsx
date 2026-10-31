import KnowledgeProgress from "../components/KnowledgeProgress";
import UsageSharing from "../components/UsageSharing";
import SyncStatus from "../components/SyncStatus";
import WeeklyReviewCard from "../components/WeeklyReviewCard";
import LearningActivityPanel, { CategoryProgress } from "../components/LearningActivityPanel";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import { lessons, type Lesson } from "../data/lessons";
import { lessonScores } from "../utils/weeklyReview";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { colors } from "../theme";

type Props = {
  onWeeklyReview?: () => void;
  onOpenWelcome?: () => void;
  onOpenAccount?: () => void;
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, styles.cardLabel]}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function ProgressScreen({
  onWeeklyReview,
  onOpenWelcome,
  onOpenAccount,
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
  const learning = useLearningSnapshot();
  const daily = useDailySnapshot();
  const [dailyExpanded, setDailyExpanded] = useState(false);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);
  const mastery = useMemo(() => {
    const rows = lessons.map(lesson => lessonScores(lesson, learning.activity, learning.weeklyReviews));
    return { count: rows.reduce((sum, row) => sum + row.mastered, 0), unknown: completedLessons.filter(lesson => !lessonScores(lesson, learning.activity, learning.weeklyReviews).hasDetails).length };
  }, [learning.activity, learning.weeklyReviews, completedLessons]);
  const history = useMemo(() => dailyHistory(daily.doc), [daily.doc]);
  const historyLoaded = daily.ready;
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

  const stats = useMemo(
    () => calculateDailyChallengeProgress(history, todayKey),
    [history, todayKey],
  );

  function confirmResetLessonProgress() {
    if (!__DEV__ || !lessonProgressLoaded || isResetting) return;

    Alert.alert(
      "Καθαρισμός προόδου μαθημάτων",
      "Θα διαγραφούν οι ολοκληρώσεις, οι ημιτελείς προσπάθειες και η καταγεγραμμένη δραστηριότητα μαθημάτων του επισκέπτη. Τα αποθηκευμένα άρθρα και η πρόοδος της καθημερινής πρόκλησης δεν θα αλλάξουν.",
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
      <SyncStatus quiet />
      <Text accessibilityRole="header" style={styles.title}>Η πρόοδός σου</Text>

      <KnowledgeProgress />

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

      {inProgressLesson && lessonProgressLoaded ? <View testID="progress-resume" style={styles.actionSection}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Συνέχισε το μάθημα</Text>
        <Pressable style={styles.resumeCard} onPress={() => onOpenLesson(inProgressLesson.id)} accessibilityRole="button" accessibilityLabel={`Συνέχισε το μάθημα ${inProgressLesson.title}`}>
          <View style={styles.lessonTextBlock}><Text style={styles.lessonStatus}>ΣΕ ΕΞΕΛΙΞΗ</Text><Text style={styles.lessonTitle}>{inProgressLesson.title}</Text><Text style={styles.muted}>{inProgressAnsweredCount} / {inProgressQuestionCount} ερωτήσεις απαντήθηκαν</Text></View><Text style={styles.chevron}>→</Text>
        </Pressable>
        {inProgressLessonCount > 1 ? <Text style={styles.muted}>Έχεις ακόμη {inProgressLessonCount - 1} ημιτελείς προσπάθειες στις θεματικές σου.</Text> : null}
      </View> : null}

      {onWeeklyReview ? <View testID="progress-weekly"><WeeklyReviewCard onOpen={onWeeklyReview} /></View> : null}
      <View testID="progress-activity"><LearningActivityPanel todayKey={todayKey} compact /></View>

      <View testID="progress-categories">
        <CategoryProgress />
        {completedLessons.length > 0 ? <>
          <Pressable style={styles.disclosure} accessibilityRole="button" accessibilityState={{ expanded: lessonsExpanded }} onPress={() => setLessonsExpanded(value => !value)}>
            <View style={styles.accountCopy}><Text style={styles.accountTitle}>Τα ολοκληρωμένα μαθήματά σου</Text><Text style={styles.muted}>{completedLessons.length} μαθήματα</Text></View><Text style={styles.chevron}>{lessonsExpanded ? "−" : "+"}</Text>
          </Pressable>
          {lessonsExpanded ? <View style={styles.lessonProgressCard}>{completedLessons.map(lesson => <Pressable key={lesson.id} style={styles.completedLessonRow} onPress={() => onOpenLesson(lesson.id)} accessibilityRole="button"><Text style={styles.completedMark}>✓</Text><Text style={styles.completedLessonTitle}>{lesson.title}</Text><Text style={styles.chevron}>›</Text></Pressable>)}</View> : null}
        </> : null}
      </View>

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

      <View testID="progress-account" style={styles.footerSection}>
        {onOpenAccount ? <Pressable accessibilityRole="button" onPress={onOpenAccount} style={styles.accountLink}>
          <View style={styles.accountCopy}><Text style={styles.accountTitle}>Ο λογαριασμός μου</Text></View><Text style={styles.chevron}>›</Text>
        </Pressable> : null}
        {onOpenWelcome ? <Pressable style={styles.guideLink} accessibilityRole="button" onPress={onOpenWelcome}><Text style={styles.guideLinkText}>Δες τον οδηγό εκκίνησης →</Text></Pressable> : null}
      </View>

      <UsageSharing />

      {__DEV__ ? (
        <View style={styles.devTools}>
          <Text style={styles.devLabel}>ΕΡΓΑΛΕΙΑ ΑΝΑΠΤΥΞΗΣ</Text>
          <Text style={styles.devDescription}>Διαθέσιμο μόνο ως επισκέπτης. Καθαρίζει ολοκληρώσεις, ημιτελείς προσπάθειες και δραστηριότητα μαθημάτων του επισκέπτη, χωρίς να διαγράφει δεδομένα λογαριασμού.</Text>
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
  overview: { gap: 12, marginTop: 4, marginBottom: 16 },
  completionHero: { backgroundColor: colors.accentSurface, borderRadius: 22, borderColor: colors.borderStrong, borderWidth: 1, padding: 20 },
  heroValue: { color: colors.text, fontSize: 44, lineHeight: 56, fontWeight: "900", marginTop: 8 },
  heroTotal: { color: colors.textMuted, fontSize: 20, fontWeight: "600" },
  actionSection: { gap: 10, marginBottom: 12 },
  resumeCard: { flexDirection: "row", alignItems: "center", padding: 18, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, minHeight: 88 },
  disclosure: { flexDirection: "row", alignItems: "center", minHeight: 72, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, marginVertical: 8 },
  dailyDetails: { paddingBottom: 12 },
  footerSection: { marginTop: 22 },
  guideLink: { minHeight: 44, justifyContent: "center", paddingVertical: 10, marginBottom: 10 },
  guideLinkText: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  header: { marginBottom: 12 },
  accountLink: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface },
  accountCopy: { flex: 1, gap: 4 },
  accountTitle: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "800" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
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
  completedLessonRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, minHeight: 48 },
  completedMark: { color: colors.success, fontSize: 15, fontWeight: "900" },
  completedLessonTitle: { color: colors.textBody, fontSize: 12, flex: 1 },
  devTools: { marginTop: 26, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#121523" },
  devLabel: { color: colors.accentLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 },
  devDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
});
