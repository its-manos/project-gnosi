import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { useLearningSnapshot } from "../state/LearningSession";
import ActionButton from "./ActionButton";
import { ProgressActionHighlight } from "./ProgressMotion";
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
  dense?: boolean;
};

export default function ReviewActions({
  onReview, onExplore, inProgressLesson = null,
  inProgressAnsweredCount = 0, inProgressQuestionCount = 0,
  inProgressLessonCount = 0, lessonProgressLoaded = false, onResumeLesson, dense = false,
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
    : reviewDue ? "" // The due count and CTA already explain the next step.
    : ready ? "Δεν έχεις εκκρεμείς επαναλήψεις." : "";
  const primaryLabel = resumePrimary ? "Συνέχισε το μάθημα"
    : active ? "Συνέχεια επανάληψης"
    : reviewDue ? "Ξεκίνα την επανάληψη" : "Εξερεύνησε τα μαθήματα";
  const primaryAction = resumePrimary && resumableLesson && onResumeLesson
    ? () => onResumeLesson(resumableLesson.id)
    : reviewDue ? onReview : onExplore;

  return (
    <View style={[styles.card, dense && styles.cardDense]} testID="progress-reviews">
      <View style={styles.eyebrow}>
        <View style={[styles.statusDot, reviewDue && styles.statusDotDue]} />
        <Text style={styles.label}>ΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ</Text>
        <View style={styles.eyebrowLine} />
      </View>
      <Text style={[styles.title, dense && styles.titleDense]} numberOfLines={2}>{primaryTitle}</Text>
      {primaryDetail ? <Text style={styles.body} numberOfLines={dense ? 1 : 2}>{primaryDetail}</Text> : null}
      {ready || resumePrimary ? (
        <View testID={resumePrimary ? "progress-resume" : "progress-primary-action"} style={styles.actionFrame}>
          <ActionButton label={primaryLabel} onPress={primaryAction}
            style={[styles.action, dense && styles.actionDense]} />
          <ProgressActionHighlight />
        </View>
      ) : null}
      {resumableLesson && !resumePrimary ? (
        <Pressable testID="progress-resume"
          style={({ pressed }) => [styles.secondary, dense && styles.secondaryDense, pressed && styles.secondaryPressed]}
          accessibilityRole="button"
          accessibilityLabel={"Συνέχισε το μάθημα " + resumableLesson.title}
          onPress={() => onResumeLesson?.(resumableLesson.id)}>
          <Text style={styles.secondaryText} numberOfLines={1}>Συνέχισε το μάθημα · {resumableLesson.title}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ) : null}
      {ready && !reviewDue && model.practice.length > 0 ? (
        <Pressable style={({ pressed }) => [styles.secondary, dense && styles.secondaryDense, pressed && styles.secondaryPressed]}
          accessibilityRole="button" onPress={onReview}>
          <Text style={styles.secondaryText}>Λίγη ελεύθερη εξάσκηση</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14, paddingVertical: 12, gap: 5, borderRadius: 19,
    backgroundColor: "#2B2843", borderWidth: 1, borderColor: "#554C75",
  },
  cardDense: { paddingHorizontal: 12, paddingVertical: 9, gap: 4 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 7, minHeight: 15 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#88C6C8" },
  statusDotDue: { backgroundColor: "#B6A8FF" },
  eyebrowLine: { flex: 1, height: 1, backgroundColor: "rgba(199, 180, 245, 0.18)" },
  label: { color: colors.accentLight, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  title: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "800" },
  titleDense: { fontSize: 15, lineHeight: 20 },
  body: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  actionFrame: { position: "relative", borderRadius: 15 },
  action: { minHeight: 44, marginTop: 3, paddingVertical: 9 },
  actionDense: { marginTop: 0, paddingVertical: 8 },
  secondary: {
    flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44,
    paddingTop: 3,
  },
  secondaryDense: { minHeight: 44, paddingTop: 0 },
  secondaryPressed: { opacity: 0.72 },
  secondaryText: { flex: 1, color: colors.accentLight, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  arrow: { color: colors.accentLight, fontSize: 21 },
});
