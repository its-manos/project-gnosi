import ReadingPick from "../components/ReadingPick";
import type { Recommendation } from "../utils/readingDiscovery";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import { colors } from "../theme";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import type { ReviewState } from "../utils/lessonReview";
import type { lessonScores as calculateLessonScores } from "../utils/weeklyReview";

type Props = { lesson: Lesson; score: number; onHome: () => void; onReadAgain: () => void; recommendations: Recommendation[]; onOpenLesson: (id: string) => void; onBrowse: () => void;
  lessonScores?: ReturnType<typeof calculateLessonScores>; onWeeklyReview?: () => void;
  review?: ReviewState; returning?: boolean; practiceComplete?: boolean; onReviewMistakes?: () => void };

export default function ResultsScreen({ lesson, score, onHome, onReadAgain, recommendations, onOpenLesson, onBrowse, review, returning = false, practiceComplete = false, onReviewMistakes, lessonScores, onWeeklyReview }: Props) {
  const totalQuestions = review?.result?.questionCount ?? getInlineQuestionCount(lesson);
  const displayedScore = returning ? lessonScores?.best ?? review?.result?.correctCount ?? null : score;
  const perfectScore = totalQuestions > 0 && displayedScore === totalQuestions;
  const percentage = totalQuestions > 0
    ? Math.round((displayedScore ?? 0) / totalQuestions * 100)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" />
      <View style={styles.container}>
        <Text style={styles.emoji}>{perfectScore ? "🏆" : "✨"}</Text>
        <Text style={styles.eyebrow}>{returning ? "ΕΠΙΣΤΡΟΦΗ ΣΤΟ ΜΑΘΗΜΑ" : "ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ"}</Text>
        <Text style={styles.title}>
          {returning ? "Πώς θέλεις να συνεχίσεις;" : perfectScore ? "Εξαιρετικά!" : score >= 2 ? "Πολύ καλή προσπάθεια!" : "Κάθε μέρα μαθαίνεις κάτι νέο."}
        </Text>
        <Text style={styles.body}>{returning ? "Έχεις ήδη ολοκληρώσει" : "Ολοκλήρωσες"} το μάθημα «{lesson.title}».</Text>
        {displayedScore !== null ? <View style={styles.scoreCard}>
          <Text style={styles.muted}>{returning ? lessonScores?.best !== null && lessonScores?.best !== undefined ? "Καλύτερη πλήρης προσπάθεια" : "Τελευταία καταγεγραμμένη πλήρης προσπάθεια" : "Η βαθμολογία αυτής της προσπάθειας"}</Text>
          <Text style={styles.score}>{displayedScore} / {totalQuestions}</Text>
          <Text style={styles.meta}>{percentage}% σωστές απαντήσεις</Text>
          {returning && review?.result ? <Text style={styles.meta}>Τελευταία πλήρης: {review.result.correctCount} / {review.result.questionCount}</Text> : null}
        </View> : null}
        {lessonScores?.best !== null && lessonScores?.best !== undefined ? <View style={styles.scoreCard}>
          <Text style={styles.muted}>Καλύτερη πλήρης προσπάθεια</Text>
          <Text style={styles.cardScore}>{lessonScores.best} / {lessonScores.total}</Text>
          <Text style={styles.muted}>Κατάκτηση γνώσης</Text>
          <Text style={styles.cardScore}>{lessonScores.hasDetails ? `${lessonScores.mastered} / ${lessonScores.total}` : "Χρειάζεται νέα προσπάθεια"}</Text>
          <Text style={styles.body}>Ερωτήσεις που απάντησες σωστά σε πλήρη προσπάθεια ή στην εβδομαδιαία δεύτερη ευκαιρία. Η άμεση εξάσκηση σε προετοιμάζει, χωρίς να αλλάζει τη βαθμολογία.</Text>
        </View> : null}
        <View style={styles.reviewSection}>
          {practiceComplete ? <Text style={styles.reviewSuccess}>Διόρθωσες τις ερωτήσεις στην εξάσκηση. Το αρχικό σκορ παραμένει ίδιο.</Text> : null}
          {review?.status === "available" && onReviewMistakes ? <>
            <ActionButton label={`Εξάσκηση στα λάθη (${review.indices.length})`} onPress={onReviewMistakes} />
            <Text style={styles.body}>Μόνο τα λάθη της τελευταίας πλήρους προσπάθειας. Χωρίς νέα ολοκλήρωση ή αύξηση επαναλήψεων.</Text>
          </> : null}
          {review?.status === "missing-details" || review?.status === "no-result" ? <Text style={styles.body}>Για την παλιότερη προσπάθεια δεν είχαν αποθηκευτεί οι ερωτήσεις που χάθηκαν. Μια νέα πλήρης προσπάθεια θα ενεργοποιήσει τη στοχευμένη εξάσκηση.</Text> : null}
          {review?.status === "changed" ? <Text style={styles.body}>Το quiz έχει αλλάξει από την προηγούμενη προσπάθεια. Κάνε μια πλήρη επανάληψη για εξάσκηση στις τωρινές ερωτήσεις.</Text> : null}
          <ActionButton label="Πλήρης επανάληψη μαθήματος" onPress={onReadAgain} secondary />
          <Text style={styles.body}>Η πλήρης επανάληψη περιλαμβάνει όλες τις ερωτήσεις και καταγράφεται ως νέα προσπάθεια, ανεξάρτητα από το σκορ.</Text>
          {onWeeklyReview ? <><ActionButton label="Η εβδομαδιαία δεύτερη ευκαιρία" onPress={onWeeklyReview} secondary /><Text style={styles.body}>Τα νέα λάθη μπαίνουν στη δεύτερη ευκαιρία από την επόμενη Δευτέρα. Το καλύτερο σκορ σου διατηρείται ακόμη κι αν μια επανάληψη δεν πάει τόσο καλά.</Text></> : null}
        </View>
        <View style={styles.nextSection}>
          <Text style={styles.nextTitle}>Τι θα διαβάσεις μετά;</Text>
          {recommendations.length ? recommendations.map(({ lesson: next, reason }) => (
            <ReadingPick key={next.id} lesson={next}
              label={reason === "same-topic" ? "ΣΤΗΝ ΙΔΙΑ ΘΕΜΑΤΙΚΗ" : reason === "same-category" ? "ΣΤΗΝ ΙΔΙΑ ΚΑΤΗΓΟΡΙΑ" : "ΜΙΑ ΔΙΑΦΟΡΕΤΙΚΗ ΔΙΑΔΡΟΜΗ"}
              onPress={() => onOpenLesson(next.id)} />
          )) : <Text style={styles.body}>Δεν υπάρχουν άλλες αδιάβαστες προτάσεις. Μπορείς να συνεχίσεις ένα άρθρο από την αρχική ή να επιστρέψεις σε όσα ολοκλήρωσες.</Text>}
          <ActionButton label="Εξερεύνησε όλα τα άρθρα" onPress={onBrowse} secondary />
        </View>
        <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardScore: { color: colors.accentLight, fontSize: 28, fontWeight: "800", marginVertical: 10 },
  reviewSection: { width: "100%", gap: 12, marginVertical: 16 },
  reviewSuccess: { color: colors.success, fontSize: 14, lineHeight: 23, textAlign: "center" },
  nextSection: { width: "100%", marginTop: 12, marginBottom: 16 },
  nextTitle: { color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: "700", marginBottom: 16 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  container: { alignItems: "center", paddingTop: 24 },
  emoji: { fontSize: 64, marginBottom: 24 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 29, lineHeight: 36, fontWeight: "900", textAlign: "center", marginBottom: 14 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23, textAlign: "center" },
  scoreCard: { width: "100%", alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 22, padding: 26, marginTop: 28, marginBottom: 18 },
  muted: { color: "#979CB3", fontSize: 12 },
  score: { color: colors.accentLight, fontSize: 52, fontWeight: "900", marginVertical: 6 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
