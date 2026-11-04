import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { useLearningSnapshot } from "../state/LearningSession";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

type Props = {
  onReview: () => void;
  onWeeklyReview?: () => void;
  onExplore: () => void;
  inProgressLesson?: Lesson | null;
  inProgressAnsweredCount?: number;
  inProgressQuestionCount?: number;
  inProgressLessonCount?: number;
  lessonProgressLoaded?: boolean;
  onResumeLesson?: (id: string) => void;
};

export default function ReviewActions({
  onReview, onExplore, inProgressLesson = null,
  inProgressAnsweredCount = 0, inProgressQuestionCount = 0,
  inProgressLessonCount = 0, lessonProgressLoaded = false, onResumeLesson,
}: Props) {
  const { model, today, ready } = useKnowledgeModel();
  const learning = useLearningSnapshot();
  const active = !!(learning.knowledgeSession
    && !learning.knowledgeSession.completed
    && learning.knowledgeSession.date === today);
  const reviewDue = ready && (active || model.due.length > 0);
  const resumableLesson = lessonProgressLoaded && onResumeLesson ? inProgressLesson : null;
  // An ongoing/due review takes priority. Otherwise resume a lesson before
  // offering exploration. Every secondary action stays accessible.
  const resumePrimary = !!resumableLesson && !reviewDue;
  const primaryTitle = resumePrimary
    ? resumableLesson?.title
    : !ready ? "Φόρτωση επανάληψης…"
    : active ? "Συνέχισε εκεί που έμεινες"
    : model.due.length ? model.due.length + " ερωτήσεις σε περιμένουν"
    : "Έτοιμος για μια νέα ανακάλυψη;";
  const primaryDetail = resumePrimary
    ? inProgressAnsweredCount + " / " + inProgressQuestionCount + " ερωτήσεις"
      + (inProgressLessonCount > 1 ? " · " + inProgressLessonCount + " μαθήματα σε εξέλιξη" : "")
    : active ? "Η επανάληψή σου έχει αποθηκευτεί."
    : reviewDue ? "Μικρές επαναλήψεις για γνώση που μένει."
    : ready ? "Δεν έχεις εκκρεμείς επαναλήψεις." : "";
  const primaryLabel = resumePrimary ? "Συνέχισε το μάθημα"
    : active ? "Συνέχεια επανάληψης"
    : reviewDue ? "Ξεκίνα την επανάληψη" : "Εξερεύνησε τα μαθήματα";
  const primaryAction = resumePrimary && resumableLesson && onResumeLesson
    ? () => onResumeLesson(resumableLesson.id)
    : reviewDue ? onReview : onExplore;

  return (
    <View style={styles.card} testID="progress-reviews">
      <Text style={styles.label}>ΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ</Text>
      <Text style={styles.title} numberOfLines={2}>{primaryTitle}</Text>
      {primaryDetail ? <Text style={styles.body} numberOfLines={2}>{primaryDetail}</Text> : null}
      {ready || resumePrimary ? (
        <View testID={resumePrimary ? "progress-resume" : "progress-primary-action"}>
          <ActionButton label={primaryLabel} onPress={primaryAction} style={styles.action} />
        </View>
      ) : null}
      {resumableLesson && !resumePrimary ? (
        <Pressable testID="progress-resume" style={styles.secondary}
          accessibilityRole="button"
          accessibilityLabel={"Συνέχισε το μάθημα " + resumableLesson.title}
          onPress={() => onResumeLesson?.(resumableLesson.id)}>
          <Text style={styles.secondaryText} numberOfLines={1}>Συνέχισε το μάθημα · {resumableLesson.title}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ) : null}
      {ready && !reviewDue && model.practice.length > 0 ? (
        <Pressable style={styles.secondary} accessibilityRole="button" onPress={onReview}>
          <Text style={styles.secondaryText}>Λίγη ελεύθερη εξάσκηση</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14, gap: 6, borderRadius: 19,
    backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong,
  },
  label: { color: colors.accentLight, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  title: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  action: { minHeight: 44, marginTop: 3, paddingVertical: 9 },
  secondary: {
    flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40,
    paddingTop: 3,
  },
  secondaryText: { flex: 1, color: colors.accentLight, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  arrow: { color: colors.accentLight, fontSize: 21 },
});
