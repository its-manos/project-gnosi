import KnowledgeProgress from "../components/KnowledgeProgress";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import ProgressTrack from "../components/ProgressTrack";
import ReportContentButton from "../components/ReportContentButton";
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

/** A result is a moment of progress, not another dashboard to decipher. */
export default function ResultsScreen({
  earnedXP = 0, highestCombo = 0, lesson, score, onHome, onReadAgain,
  onOpenLesson, onBrowse, nextLesson, pathProgress, review, returning = false,
  practiceComplete = false, onReviewMistakes, lessonScores, onWeeklyReview,
}: Props) {
  const [details, setDetails] = useState(false);
  const total = getInlineQuestionCount(lesson);
  // Old results may have changed question revisions: never fabricate a score.
  const displayedScore = returning
    ? lessonScores?.best ?? (review?.status !== "changed" ? review?.result?.correctCount ?? null : null)
    : score;
  const validScore = displayedScore !== null && total > 0;
  const count = validScore ? Math.max(0, Math.min(total, displayedScore)) : null;
  const accuracy = count === null ? null : Math.round(count / total * 100);
  const strongResult = count !== null && count / total >= 0.75;
  const perfect = count !== null && count === total;
  const canPractice = review?.status === "available" && !!onReviewMistakes;
  const practiceFirst = canPractice && !strongResult && !practiceComplete;
  const pathComplete = !!pathProgress && pathProgress.total > 0 && pathProgress.completed === pathProgress.total;
  const pathPercent = pathProgress && pathProgress.total > 0
    ? Math.min(100, Math.max(0, pathProgress.completed / pathProgress.total * 100)) : 0;
  const heading = returning ? "Η διαδρομή συνεχίζεται"
    : perfect ? "Τα πέτυχες όλα!"
    : strongResult ? "Πολύ καλή διαδρομή!"
    : "Κάθε απάντηση είναι ένα βήμα.";
  const practiceLabel = "Εξάσκηση στα λάθη (" + (canPractice ? review.indices.length : 0) + ")";

  return <View style={styles.root} testID="lesson-results-screen">
    <ProgressGradientBackground />
    <View style={styles.chrome}>
      <ProfileSectionHeader eyebrow="Ο ΧΑΡΤΗΣ ΤΗΣ ΜΑΘΗΣΗΣ" title="Ολοκλήρωση"
        actionLabel="Αρχική" actionAccessibilityLabel="Επιστροφή στην αρχική"
        onAction={onHome} style={styles.header} />
    </View>
    <ScrollView style={styles.viewport} contentContainerStyle={styles.content}
      bounces={false} showsVerticalScrollIndicator={false}>
      <View style={styles.hero} testID="lesson-result-hero">
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{returning ? "ΤΟ ΜΑΘΗΜΑ ΣΟΥ" : "ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ"}</Text>
          <Text style={styles.title} accessibilityRole="header">{heading}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>
        <View style={styles.seal} accessible={false} pointerEvents="none">
          <View style={styles.sealOrbit}/>
          <Text style={styles.star}>✦</Text>
        </View>
      </View>

      <AtlasCard entranceDelay={70} style={styles.scoreCard} testID="lesson-result-score">
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
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{accuracy}%</Text>
              <Text style={styles.metricLabel}>Ακρίβεια</Text>
            </View>
            {!returning ? <>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{earnedXP > 0 ? "+" + earnedXP : "—"}</Text>
                <Text style={styles.metricLabel}>XP απονομής</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{highestCombo}</Text>
                <Text style={styles.metricLabel}>Καλύτερο σερί</Text>
              </View>
            </> : null}
          </View>
          {!returning && earnedXP === 0 ?
            <Text style={styles.rewardNote}>Τα XP αυτής της ολοκλήρωσης έχουν ήδη καταγραφεί.</Text> : null}
        </> : <View style={styles.noScore}>
          <Text style={styles.scoreLabel}>ΠΑΛΙΟΤΕΡΗ ΠΡΟΣΠΑΘΕΙΑ</Text>
          <Text style={styles.noScoreText}>Η ολοκλήρωσή σου διατηρείται, αλλά δεν υπάρχει συγκρίσιμος αναλυτικός βαθμός.</Text>
        </View>}
      </AtlasCard>

      {practiceComplete ?
        <View style={styles.successPill} accessibilityLiveRegion="polite">
          <Text style={styles.successText}>✓ Ολοκλήρωσες την εξάσκηση στα λάθη.</Text>
        </View> : null}

      {practiceFirst && onReviewMistakes ?
        <ActionButton label={practiceLabel + " →"} onPress={onReviewMistakes} style={styles.primaryAction} /> : null}

      {nextLesson ?
        <Pressable testID="lesson-next-action" onPress={() => onOpenLesson(nextLesson.id)}
          accessibilityRole="button" accessibilityLabel={"Επόμενο μάθημα: " + nextLesson.title}
          style={({ pressed }) => [styles.nextCard, !practiceFirst && styles.nextCardPrimary, pressed && styles.nextPressed]}>
          <View style={styles.nextCopy}>
            <Text style={styles.eyebrow}>{practiceFirst ? "ΣΥΝΕΧΙΣΕ ΟΤΑΝ ΕΙΣΑΙ ΕΤΟΙΜΟΣ" : "Η ΕΠΟΜΕΝΗ ΑΝΑΚΑΛΥΨΗ"}</Text>
            <Text style={styles.nextTitle}>{nextLesson.title}</Text>
          </View>
          <View style={styles.nextArrow} accessible={false}>
            <Text style={styles.nextArrowText}>›</Text>
          </View>
        </Pressable>
        : <ActionButton label={pathComplete ? "Διάλεξε άλλη θεματική →" : "Συνέχισε την εξερεύνηση →"}
          onPress={onBrowse} style={styles.primaryAction}
          secondary={practiceFirst} />}

      {pathProgress && pathProgress.total > 0 ?
        <View style={styles.pathCard} testID="lesson-path-progress">
          <View style={styles.pathHeading}>
            <View style={styles.pathCopy}>
              <Text style={styles.eyebrow}>Η ΔΙΑΔΡΟΜΗ ΣΟΥ</Text>
              <Text style={styles.pathTitle}>{pathProgress.title}</Text>
            </View>
            <Text style={styles.pathCount}>{pathProgress.completed} / {pathProgress.total}</Text>
          </View>
          <ProgressTrack variant="subject" tone="reading" accessible accessibilityRole="progressbar"
            accessibilityLabel={"Ολοκλήρωση διαδρομής " + pathProgress.title}
            accessibilityValue={{ min: 0, max: pathProgress.total, now: pathProgress.completed }}>
            <View style={[styles.pathFill, { width: String(pathPercent) + "%" }]} />
          </ProgressTrack>
          {pathComplete ? <Text style={styles.pathNote}>Ολοκλήρωσες αυτή τη διαδρομή!</Text> : null}
        </View> : null}

      <Pressable testID="lesson-result-details" accessibilityRole="button"
        accessibilityState={{ expanded: details }} onPress={() => setDetails(value => !value)}
        style={({ pressed }) => [styles.detailsToggle, pressed && styles.detailsPressed]}>
        <Text style={styles.detailsText}>{details ? "Λιγότερες επιλογές  −" : "Περισσότερες επιλογές  +"}</Text>
      </Pressable>

      {details ? <View style={styles.details} testID="lesson-result-expanded">
        <KnowledgeProgress compact />
        {lessonScores?.best !== null && lessonScores?.best !== undefined ?
          <Text style={styles.detailText}>Καλύτερο σκορ: {lessonScores.best} / {lessonScores.total}
            {lessonScores.hasDetails ? " · Σωστές απαντημένες ερωτήσεις: " + lessonScores.mastered : ""}</Text> : null}
        {practiceComplete ? <Text style={styles.detailText}>Η εξάσκηση δεν αλλάζει το σκορ της προσπάθειας.</Text> : null}
        {review?.status === "missing-details" || review?.status === "no-result" ?
          <Text style={styles.detailText}>Τα παλιότερα λάθη δεν έχουν αποθηκευτεί. Η ολοκλήρωση διατηρείται.</Text> : null}
        {review?.status === "changed" ?
          <Text style={styles.detailText}>Οι ερωτήσεις έχουν αλλάξει. Το παλιό σκορ δεν επανυπολογίζεται.</Text> : null}
        {canPractice && !practiceFirst && onReviewMistakes ?
          <ActionButton label={practiceLabel} onPress={onReviewMistakes} secondary style={styles.detailAction} /> : null}
        <ActionButton label="Προαιρετική επανάληψη μαθήματος" onPress={onReadAgain}
          secondary style={styles.detailAction} />
        <Text style={styles.detailText}>Το καλύτερο σκορ σου διατηρείται.</Text>
        {onWeeklyReview ? <>
          <ActionButton label="Νέες δοκιμές κατανόησης" onPress={onWeeklyReview}
            secondary style={styles.detailAction} />
          <Text style={styles.detailText}>Προαιρετική εξάσκηση με διαφορετικές περιπτώσεις, όταν υπάρχουν διαθέσιμες.</Text>
        </> : null}
        <ReportContentButton target={lessonReportTarget(lesson)} />
      </View> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chrome: { paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top },
  header: { marginBottom: profileSectionLayout.below },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 28, gap: 10 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 94, paddingVertical: 4 },
  heroCopy: { flex: 1, minWidth: 0, gap: 5 },
  eyebrow: { color: "#BFB3ED", fontSize: 10, lineHeight: 16, fontWeight: "900", letterSpacing: 0.9 },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: "900" },
  lessonTitle: { color: colors.textBody, fontSize: 13, lineHeight: 20, fontWeight: "600" },
  seal: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#302B4A",
    borderColor: "#796AAB", borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sealOrbit: { width: 74, height: 74, position: "absolute", borderWidth: 1, borderColor: "#54527D", borderRadius: 38 },
  star: { color: "#DCD0FF", fontSize: 31, lineHeight: 39 },
  scoreCard: { padding: 16, gap: 9, backgroundColor: "#1A2032", borderColor: "#444361", borderRadius: 21 },
  cardRim: { position: "absolute", top: 0, left: 20, right: 20, height: 2, backgroundColor: "#8376B9" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  scoreCopy: { flex: 1, minWidth: 0, gap: 5 },
  scoreLabel: { color: "#C0B3F2", fontSize: 10, lineHeight: 16, fontWeight: "900", letterSpacing: 0.9 },
  scoreHint: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  score: { color: colors.text, fontSize: 43, lineHeight: 52, fontWeight: "900", flexShrink: 0 },
  denominator: { color: colors.textMuted, fontSize: 18, fontWeight: "700" },
  scoreFill: { height: "100%", borderRadius: 9, backgroundColor: "#84C9B6" },
  metrics: { flexDirection: "row", alignItems: "center", paddingTop: 9, borderTopWidth: 1, borderTopColor: "#373C54" },
  metric: { flex: 1, alignItems: "center", gap: 2 },
  metricDivider: { width: 1, height: 28, backgroundColor: "#3A4059" },
  metricValue: { color: colors.accentLight, fontSize: 20, lineHeight: 26, fontWeight: "900" },
  metricLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: "center" },
  rewardNote: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  noScore: { gap: 9, paddingVertical: 8 },
  noScoreText: { color: colors.textBody, fontSize: 13, lineHeight: 20 },
  successPill: { backgroundColor: "#19382F", borderWidth: 1, borderColor: "#3E7866", borderRadius: 13, padding: 10 },
  successText: { color: "#A6DFCA", fontSize: 12, lineHeight: 19, fontWeight: "700" },
  primaryAction: { marginTop: 2 },
  nextCard: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, borderRadius: 17,
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#41445E", backgroundColor: "#1B2133" },
  nextCardPrimary: { borderColor: "#7871A7", backgroundColor: "#25263D" },
  nextPressed: { backgroundColor: "#31324D" },
  nextCopy: { flex: 1, minWidth: 0, gap: 4 },
  nextTitle: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  nextArrow: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#373254",
    borderWidth: 1, borderColor: "#71679C", alignItems: "center", justifyContent: "center" },
  nextArrowText: { color: "#E0D4FF", fontSize: 26, lineHeight: 29, fontWeight: "800" },
  pathCard: { gap: 8, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderColor: "#3C4359", backgroundColor: "#192130" },
  pathHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  pathCopy: { flex: 1, minWidth: 0, gap: 4 },
  pathTitle: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "800" },
  pathCount: { color: colors.accentLight, fontSize: 13, lineHeight: 19, fontWeight: "900" },
  pathFill: { height: "100%", backgroundColor: "#7CB8BA", borderRadius: 6 },
  pathNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18 },
  detailsToggle: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  detailsPressed: { backgroundColor: "#282D44" },
  detailsText: { color: "#C9BDFF", fontSize: 13, lineHeight: 19, fontWeight: "800" },
  details: { gap: 8, backgroundColor: "#151B2B", borderRadius: 17, borderColor: "#373D55", borderWidth: 1, padding: 12 },
  detailText: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  detailAction: { marginTop: 5 },
});
