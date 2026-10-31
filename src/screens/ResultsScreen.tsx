import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import LessonResultChart from "../components/LessonResultChart";
import ReportContentButton from "../components/ReportContentButton";
import { lessonReportTarget } from "../utils/contentReports";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import type { ReviewState } from "../utils/lessonReview";
import type { lessonScores as calculateLessonScores } from "../utils/weeklyReview";
import { colors } from "../theme";

type Props = {
  lesson: Lesson; score: number; onHome: () => void; onReadAgain: () => void;
  onOpenLesson: (id: string) => void; onBrowse: () => void; nextLesson?: Lesson | null;
  pathProgress?: { title: string; completed: number; total: number };
  lessonScores?: ReturnType<typeof calculateLessonScores>; onWeeklyReview?: () => void;
  review?: ReviewState; returning?: boolean; practiceComplete?: boolean; onReviewMistakes?: () => void;
};

export default function ResultsScreen({ lesson, score, onHome, onReadAgain, onOpenLesson, onBrowse, nextLesson, pathProgress, review, returning = false, practiceComplete = false, onReviewMistakes, lessonScores, onWeeklyReview }: Props) {
  const [details, setDetails] = useState(false);
  const total = getInlineQuestionCount(lesson);
  const displayedScore = returning
    ? lessonScores?.best ?? (review?.status !== "changed" ? review?.result?.correctCount ?? null : null)
    : score;
  const strongResult = displayedScore !== null && total > 0 && displayedScore / total >= 0.75;
  const perfect = displayedScore === total && total > 0;
  const canPractice = review?.status === "available" && !!onReviewMistakes;
  const pathComplete = !!pathProgress && pathProgress.total > 0 && pathProgress.completed === pathProgress.total;

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" />
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{returning ? "ΤΟ ΜΑΘΗΜΑ ΣΟΥ" : "ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ"}</Text>
      <Text style={styles.title}>{returning ? "Συνέχισε την ανακάλυψη" : perfect ? "Τα πέτυχες όλα!" : strongResult ? "Τα πήγες πολύ καλά!" : "Έκανες το επόμενο βήμα"}</Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      {displayedScore !== null ? <LessonResultChart correct={displayedScore} total={total} label={returning ? "Το καλύτερο σκορ σου" : "Αυτή η προσπάθεια"} />
        : <Text style={styles.message}>Κάνε μια νέα προσπάθεια για να δεις το σκορ σου.</Text>}
      {practiceComplete ? <Text style={styles.success}>Ολοκλήρωσες την εξάσκηση στα λάθη.</Text> : null}
      {displayedScore === null ? <ActionButton label="Πλήρης επανάληψη μαθήματος" onPress={onReadAgain} /> : null}
      {!strongResult && canPractice && !practiceComplete ? <ActionButton label={`Εξάσκηση στα λάθη (${review.indices.length})`} onPress={onReviewMistakes} /> : null}
      {nextLesson ? <View style={styles.next}>
        <Text style={styles.nextLabel}>ΣΤΗΝ ΙΔΙΑ ΔΙΑΔΡΟΜΗ</Text>
        <Text style={styles.nextTitle}>{nextLesson.title}</Text>
        <ActionButton label="Επόμενο μάθημα" onPress={() => onOpenLesson(nextLesson.id)} secondary={displayedScore === null || (!strongResult && canPractice && !practiceComplete)} />
      </View> : null}
      <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} secondary={displayedScore === null || !!nextLesson || (!strongResult && canPractice && !practiceComplete)} />
      {(strongResult || practiceComplete) && canPractice ? <ActionButton label={`Εξάσκηση στα λάθη (${review.indices.length})`} onPress={onReviewMistakes} secondary /> : null}
      {pathProgress ? <View style={styles.pathCard}>
        <View style={styles.pathHeading}><Text style={styles.pathTitle}>{pathProgress.title}</Text><Text style={styles.pathCount}>{pathProgress.completed} / {pathProgress.total}</Text></View>
        <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={`Πρόοδος: ${pathProgress.title}`}
          accessibilityValue={{ min: 0, max: pathProgress.total, now: pathProgress.completed }}>
          <View style={[styles.fill, { width: `${pathProgress.total ? Math.min(100, pathProgress.completed / pathProgress.total * 100) : 0}%` }]} />
        </View>
        <Text style={styles.small}>{pathComplete ? "Ολοκλήρωσες αυτή τη διαδρομή!" : nextLesson ? "Η διαδρομή συνεχίζεται." : "Συνέχισε τη διαδρομή από τη θεματική σου."}</Text>
      </View> : null}
      {pathComplete ? <Pressable onPress={onBrowse} accessibilityRole="button" style={styles.textButton}><Text style={styles.link}>Διάλεξε άλλη θεματική →</Text></Pressable> : null}
      <Pressable onPress={() => setDetails(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: details }} style={styles.textButton}>
        <Text style={styles.link}>{details ? "Λιγότερες επιλογές −" : "Περισσότερες επιλογές +"}</Text>
      </Pressable>
      {details ? <View style={styles.details}>
        {lessonScores?.best !== null && lessonScores?.best !== undefined ? <>
          <Text style={styles.detailMetric}>Καλύτερο σκορ: {lessonScores.best} / {lessonScores.total}</Text>
          <Text style={styles.small}>{lessonScores.hasDetails ? `Κατακτημένες ερωτήσεις: ${lessonScores.mastered} / ${lessonScores.total}.` : "Μια νέα προσπάθεια θα καταγράψει ποιες ερωτήσεις γνωρίζεις."}</Text>
        </> : null}
        {practiceComplete ? <Text style={styles.small}>Η εξάσκηση δεν αλλάζει το σκορ της προσπάθειας.</Text> : null}
        {review?.status === "missing-details" || review?.status === "no-result" ? <Text style={styles.small}>Δεν έχουν αποθηκευτεί τα παλιότερα λάθη. Κάνε μια πλήρη επανάληψη για νέα καταγραφή.</Text> : null}
        {review?.status === "changed" ? <Text style={styles.small}>Οι ερωτήσεις έχουν αλλάξει. Κάνε μια νέα προσπάθεια στο ενημερωμένο μάθημα.</Text> : null}
        {displayedScore !== null ? <ActionButton label="Πλήρης επανάληψη μαθήματος" onPress={onReadAgain} secondary /> : null}
        <Text style={styles.small}>Το καλύτερο σκορ σου διατηρείται.</Text>
        {onWeeklyReview ? <><ActionButton label="Εβδομαδιαία επανάληψη" onPress={onWeeklyReview} secondary /><Text style={styles.small}>Τα νέα λάθη επιστρέφουν από την επόμενη Δευτέρα.</Text></> : null}
        <ReportContentButton target={lessonReportTarget(lesson)} />
      </View> : null}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, width: "100%", maxWidth: 560, alignSelf: "center" },
  container: { paddingTop: 12, paddingBottom: 8 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 1.2, textAlign: "center", marginBottom: 8 },
  title: { color: colors.text, fontSize: 27, lineHeight: 35, fontWeight: "900", textAlign: "center" },
  lessonTitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 },
  message: { color: colors.textMuted, fontSize: 14, lineHeight: 22, textAlign: "center", marginVertical: 24 },
  success: { color: colors.success, fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 16 },
  pathCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginTop: 22, marginBottom: 4 },
  pathHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 8 },
  pathTitle: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "700", flexGrow: 1, flexShrink: 1 },
  pathCount: { color: colors.accentLight, fontSize: 13, lineHeight: 21, fontWeight: "700" },
  track: { height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.accentLight, borderRadius: 3 },
  small: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  next: { marginTop: 18 },
  nextLabel: { color: colors.accentLight, fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 0.8 },
  nextTitle: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "600", marginTop: 5 },
  textButton: { minHeight: 44, paddingVertical: 12, justifyContent: "center", alignItems: "center", marginTop: 6 },
  link: { color: colors.accentLight, fontSize: 13, lineHeight: 21, textAlign: "center", fontWeight: "600" },
  details: { marginTop: 8, padding: 16, gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  detailMetric: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "700" },
});
