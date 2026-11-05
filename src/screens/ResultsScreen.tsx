import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import ProgressTrack from "../components/ProgressTrack";
import ReportContentButton from "../components/ReportContentButton";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { lessonReportTarget } from "../utils/contentReports";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import type { ReviewState } from "../utils/lessonReview";
import type { lessonScores as calculateLessonScores } from "../utils/weeklyReview";
import { colors } from "../theme";

type Props = {
  earnedXP?: number; highestCombo?: number;
  lesson: Lesson; score: number; onHome: () => void; onReadAgain: () => void;
  onOpenLesson: (id: string) => void; onBrowse: () => void; nextLesson?: Lesson | null;
  pathProgress?: { title: string; completed: number; total: number };
  lessonScores?: ReturnType<typeof calculateLessonScores>; onWeeklyReview?: () => void;
  review?: ReviewState; returning?: boolean; practiceComplete?: boolean; onReviewMistakes?: () => void;
};

/** A concise completion moment: one next action, clear results and visible long-term progress. */
export default function ResultsScreen({
  earnedXP = 0, highestCombo = 0, lesson, score, onHome, onReadAgain,
  onOpenLesson, onBrowse, nextLesson, pathProgress, review, returning = false,
  practiceComplete = false, onReviewMistakes, lessonScores, onWeeklyReview,
}: Props) {
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const total = getInlineQuestionCount(lesson);
  // Returning attempts can have revised questions. Never invent a legacy score.
  const displayedScore = returning
    ? lessonScores?.best ?? (review?.status !== "changed" ? review?.result?.correctCount ?? null : null)
    : score;
  const count = displayedScore !== null && total > 0
    ? Math.max(0, Math.min(total, displayedScore)) : null;
  const accuracy = count === null ? null : Math.round(count / total * 100);
  const heading = returning ? "Η επίδοσή σου"
    : count === total && count !== null ? "Τα πέτυχες όλα!"
    : count !== null && count / total >= 0.75 ? "Πολύ καλά!"
    : "Συνεχίζεις!";
  const pathTotal = pathProgress?.total ?? 0;
  const pathCompleted = Math.min(pathTotal, Math.max(0, pathProgress?.completed ?? 0));
  const pathPercent = pathTotal > 0 ? pathCompleted / pathTotal * 100 : 0;
  const pathComplete = pathTotal > 0 && pathCompleted === pathTotal;
  const xpRequired = Math.max(1, profile.required);
  const xpEarned = Math.max(0, Math.min(xpRequired, profile.earned));
  const levelPercent = profileReady ? xpEarned / xpRequired * 100 : 0;
  const canPractice = review?.status === "available" && !!onReviewMistakes;
  const mainAction = nextLesson ? () => onOpenLesson(nextLesson.id) : onBrowse;

  return <View style={styles.root} testID="lesson-results-screen">
    <ProgressGradientBackground />
    <View style={styles.chrome}>
      <ProfileSectionHeader eyebrow="ΜΑΘΗΜΑ" title="Αποτελέσματα"
        actionLabel="Αρχική" actionAccessibilityLabel="Επιστροφή στην αρχική"
        onAction={onHome} style={styles.header} />
    </View>
    <ScrollView style={styles.viewport} contentContainerStyle={styles.content}
      bounces={false} showsVerticalScrollIndicator={false}>
      <Pressable testID={nextLesson ? "lesson-next-action" : "lesson-browse-action"}
        onPress={mainAction} accessibilityRole="button"
        accessibilityLabel={nextLesson
          ? "Συνέχισε στο επόμενο μάθημα: " + nextLesson.title
          : pathComplete ? "Ολοκλήρωσες τη διαδρομή. Διάλεξε άλλη θεματική."
            : "Συνέχισε την εξερεύνηση"}
        accessibilityHint="Άνοιγμα της επόμενης διαδρομής μάθησης"
        style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{returning ? "ΤΟ ΜΑΘΗΜΑ ΣΟΥ" : "ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ"}</Text>
          <Text style={styles.heroTitle}>{heading}</Text>
          <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
          <View style={styles.nextLine}>
            <Text style={styles.nextLabel}>{nextLesson ? "ΣΥΝΕΧΕΙΑ ΣΤΟ ΕΠΟΜΕΝΟ" : "ΣΥΝΕΧΕΙΑ"}</Text>
            <Text style={styles.nextTitle} numberOfLines={2}>
              {nextLesson?.title ?? (pathComplete ? "Διάλεξε νέα θεματική" : "Πίσω στην εξερεύνηση")}
            </Text>
          </View>
        </View>
        <View style={styles.playButton} pointerEvents="none" accessible={false}>
          <Text style={styles.playGlyph}>{nextLesson ? "▶" : "›"}</Text>
        </View>
      </Pressable>

      <AtlasCard entranceDelay={60} style={styles.scoreCard} testID="lesson-result-score">
        <View style={styles.cardRim} pointerEvents="none" />
        {count !== null && accuracy !== null ? <>
          <View style={styles.scoreRow} accessible
            accessibilityLabel={(returning ? "Καλύτερη αποθηκευμένη επίδοση" : "Αυτή η προσπάθεια")
              + ": " + count + " από " + total + " σωστές απαντήσεις, " + accuracy + " τοις εκατό"}>
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreLabel}>{returning ? "ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ" : "Η ΕΠΙΔΟΣΗ ΣΟΥ"}</Text>
              <Text style={styles.scoreHint}>Σωστές απαντήσεις</Text>
            </View>
            <Text style={styles.score}>{count}<Text style={styles.denominator}> / {total}</Text></Text>
          </View>
          <ProgressTrack variant="accuracy" accessible accessibilityRole="progressbar"
            accessibilityLabel="Ποσοστό σωστών απαντήσεων"
            accessibilityValue={{ min: 0, max: 100, now: accuracy }}>
            <View style={[styles.scoreFill, { width: String(accuracy) + "%" }]} />
          </ProgressTrack>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreMetaText}>{accuracy}% ακρίβεια</Text>
            {!returning ? <Text style={styles.scoreMetaText}>Σερί {highestCombo}</Text> : null}
          </View>
        </> : <View style={styles.noScore}>
          <Text style={styles.scoreLabel}>ΠΑΛΙΟΤΕΡΗ ΠΡΟΣΠΑΘΕΙΑ</Text>
          <Text style={styles.noScoreText}>Το μάθημα παραμένει ολοκληρωμένο. Δεν υπάρχει συγκρίσιμος παλιότερος βαθμός.</Text>
        </View>}
      </AtlasCard>

      <View style={styles.progressCard} testID="lesson-progression">
        <View style={styles.progressHeading}>
          <Text style={styles.eyebrow}>Η ΠΡΟΟΔΟΣ ΣΟΥ</Text>
          {!returning && earnedXP > 0 ? <Text style={styles.xpReward}>+{earnedXP} XP</Text> : null}
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressTitle}>{profileReady ? "Επίπεδο " + profile.level : "Επίπεδο —"}</Text>
          <Text style={styles.progressCount}>{profileReady
            ? profile.earned.toLocaleString("el-GR") + " / " + profile.required.toLocaleString("el-GR") + " XP"
            : "— XP"}</Text>
        </View>
        <ProgressTrack variant="subject" accessible accessibilityRole="progressbar"
          accessibilityLabel="Πρόοδος μέχρι το επόμενο επίπεδο"
          accessibilityValue={profileReady
            ? { min: 0, max: xpRequired, now: xpEarned }
            : { text: "Φόρτωση επιπέδου" }}>
          <View style={[styles.levelFill, { width: String(levelPercent) + "%" }]} />
        </ProgressTrack>
        {profileReady ? <Text style={styles.levelRemaining}>{profile.remaining} XP μέχρι το επόμενο επίπεδο</Text>
          : <Text style={styles.levelRemaining}>Φόρτωση προόδου…</Text>}
        {pathProgress && pathTotal > 0 ? <>
          <View style={styles.progressDivider} />
          <View style={styles.progressRow} testID="lesson-path-progress">
            <Text style={styles.progressTitle} numberOfLines={2}>{pathProgress.title}</Text>
            <Text style={styles.progressCount}>{pathCompleted} / {pathTotal} μαθήματα</Text>
          </View>
          <ProgressTrack variant="subject" tone="reading" accessible accessibilityRole="progressbar"
            accessibilityLabel={"Ολοκλήρωση διαδρομής " + pathProgress.title}
            accessibilityValue={{ min: 0, max: pathTotal, now: pathCompleted }}>
            <View style={[styles.pathFill, { width: String(pathPercent) + "%" }]} />
          </ProgressTrack>
          {pathComplete ? <Text style={styles.pathComplete}>✓ Ολοκλήρωσες αυτή τη διαδρομή!</Text> : null}
        </> : null}
      </View>

      {practiceComplete ? <Text style={styles.successText} accessibilityLiveRegion="polite">
        ✓ Ολοκλήρωσες την εξάσκηση στα λάθη.
      </Text> : null}

      <View testID="lesson-result-tools" style={styles.tools}>
        {canPractice && onReviewMistakes ? <Pressable
          testID="lesson-practice-action" accessibilityRole="button"
          accessibilityLabel={"Εξάσκηση στα λάθη (" + review.indices.length + ")"}
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} onPress={onReviewMistakes}>
          <Text style={styles.toolText}>Εξάσκηση στα λάθη ({review.indices.length})</Text>
        </Pressable> : null}
        <Pressable testID="lesson-replay-action" accessibilityRole="button"
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} onPress={onReadAgain}>
          <Text style={styles.toolText}>Ξαναδιάβασε</Text>
        </Pressable>
        {onWeeklyReview ? <Pressable testID="lesson-review-action" accessibilityRole="button"
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]} onPress={onWeeklyReview}>
          <Text style={styles.toolText}>Δοκιμές γνώσης</Text>
        </Pressable> : null}
      </View>
      <View style={styles.reportRow}>
        <ReportContentButton target={lessonReportTarget(lesson)} />
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chrome: { paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top },
  header: { marginBottom: 7 },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center",
    paddingHorizontal: 18, paddingTop: 5, paddingBottom: 30, gap: 11 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 19,
    paddingVertical: 12, paddingHorizontal: 12, minHeight: 134,
    backgroundColor: "#25253D", borderColor: "#69618F", borderWidth: 1 },
  heroPressed: { backgroundColor: "#343152", transform: [{ scale: 0.992 }] },
  heroCopy: { flex: 1, minWidth: 0, gap: 4 },
  eyebrow: { color: "#C0B3F2", fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.85 },
  heroTitle: { color: colors.text, fontSize: 23, lineHeight: 30, fontWeight: "900" },
  lessonTitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  nextLine: { marginTop: 7, gap: 3 },
  nextLabel: { color: "#95D0C8", fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.55 },
  nextTitle: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  playButton: { width: 65, height: 65, flexShrink: 0, borderRadius: 22,
    backgroundColor: "#B6A6FF", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E0D7FF" },
  playGlyph: { color: "#191529", fontSize: 25, lineHeight: 31, fontWeight: "900", marginLeft: 3 },
  scoreCard: { paddingHorizontal: 15, paddingVertical: 13, gap: 7,
    backgroundColor: "#1A2032", borderColor: "#444361", borderRadius: 20 },
  cardRim: { position: "absolute", top: 0, left: 20, right: 20,
    height: 2, backgroundColor: "#8376B9" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  scoreCopy: { flex: 1, minWidth: 0, gap: 5 },
  scoreLabel: { color: "#C0B3F2", fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8 },
  scoreHint: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  score: { color: colors.text, fontSize: 41, lineHeight: 49, fontWeight: "900", flexShrink: 0 },
  denominator: { color: colors.textMuted, fontSize: 18, fontWeight: "700" },
  scoreFill: { height: "100%", backgroundColor: "#84C9B6", borderRadius: 9 },
  scoreMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  scoreMetaText: { color: colors.textBody, fontSize: 12, lineHeight: 19, fontWeight: "700" },
  noScore: { gap: 8, paddingVertical: 5 },
  noScoreText: { color: colors.textBody, fontSize: 13, lineHeight: 20 },
  progressCard: { paddingHorizontal: 14, paddingVertical: 13, gap: 8,
    backgroundColor: "#1C2034", borderColor: "#444261", borderWidth: 1, borderRadius: 19 },
  progressHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  xpReward: { color: "#D6C6FF", backgroundColor: "#3D315A",
    overflow: "hidden", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4,
    fontSize: 13, lineHeight: 19, fontWeight: "900" },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9 },
  progressTitle: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "800",
    flex: 1, minWidth: 0 },
  progressCount: { color: "#BEB0F2", fontSize: 12, lineHeight: 19, fontWeight: "800" },
  levelFill: { width: "0%", height: "100%", backgroundColor: "#B1A5FF", borderRadius: 6 },
  pathFill: { width: "0%", height: "100%", backgroundColor: "#7CB8BA", borderRadius: 6 },
  levelRemaining: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  progressDivider: { height: 1, backgroundColor: "#393C56", marginVertical: 4 },
  pathComplete: { color: "#A1DCCB", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  successText: { color: "#A1DCCB", fontSize: 12, lineHeight: 19, fontWeight: "700" },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingTop: 4 },
  tool: { minHeight: 44, minWidth: 100, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: "#484661",
    backgroundColor: "#20243A", alignItems: "center", justifyContent: "center" },
  toolPressed: { backgroundColor: "#34304C" },
  toolText: { color: "#C9BEF9", fontSize: 12, lineHeight: 19, fontWeight: "800", textAlign: "center" },
  reportRow: { alignSelf: "center", marginTop: -2 },
});
