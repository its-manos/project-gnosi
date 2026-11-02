import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { SpotMistakeQuestion } from "../quiz/types";
import { colors } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: SpotMistakeQuestion;
  questionNumber: number;
  answer?: string;
  onSubmit: (segmentId: string) => void;
  readingSize?: number;
};

/** One authored erroneous passage, selected by stable ID rather than text offsets. */
export default function SpotMistakeQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const answered = answer !== undefined;
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const mistake = question.content.segments.find(s => s.id === question.content.incorrectSegmentId);
  return <View testID="spot-mistake-card" style={styles.card}>
    <View style={styles.topLine}>
      <View style={styles.badge}><Text style={styles.badgeText}>⌕  ΒΡΕΣ ΤΟ ΛΑΘΟΣ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={[styles.prompt, readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{question.prompt}</Text>
    <Text style={styles.hint}>Μία φράση της πρότασης δεν είναι σωστή. Πάτησέ την.</Text>
    <View style={styles.passage} accessibilityLabel="Διάλεξε τη λανθασμένη φράση">
      <View style={styles.chunks}>
        {question.content.segments.map(segment => {
          const selected = answer === segment.id;
          const correctSegment = answered && segment.id === question.content.incorrectSegmentId;
          const wrongSelection = selected && !correctSegment;
          return <AnswerMotion key={segment.id} active={correctSegment || wrongSelection}>
            <Pressable testID={`spot-mistake-segment-${segment.id}`}
              accessibilityRole="button"
              accessibilityLabel={segment.text}
              accessibilityState={{ selected, disabled: answered }}
              disabled={answered}
              onPress={() => onSubmit(segment.id)}
              style={({ pressed }) => [styles.segment, selected && styles.selected,
                correctSegment && styles.correct, wrongSelection && styles.wrong,
                pressed && !answered && styles.pressed]}>
              <Text style={[styles.segmentText, selected && styles.selectedText]}>{segment.text}</Text>
              {correctSegment ? <Text style={styles.correctIcon}>✓</Text> : null}
              {wrongSelection ? <Text style={styles.wrongIcon}>×</Text> : null}
            </Pressable>
          </AnswerMotion>;
        })}
      </View>
    </View>
    {!answered ? <Text style={styles.footHint}>Μία επιλογή · χωρίς επιβεβαίωση</Text> : null}
    {answered ? <QuizReveal><View testID="spot-mistake-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.badText]}>
        {isCorrect ? "✓  Το εντόπισες!" : "↗  Αυτό είναι το λάθος"}
      </Text>
      <Text style={styles.feedbackLabel}>Λανθασμένη διατύπωση</Text>
      <Text style={styles.feedbackText}>{mistake?.text}</Text>
      <Text style={styles.feedbackLabel}>Σωστή διατύπωση</Text>
      <Text style={styles.solution}>{question.content.correction}</Text>
      <Text style={styles.explanation}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface,
    padding: 18, borderRadius: 22, marginTop: 12, marginBottom: 22 },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 9, marginBottom: 18 },
  badge: { backgroundColor: colors.accentSurface, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  badgeText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  prompt: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800", marginBottom: 9 },
  hint: { color: colors.textBody, fontSize: 13, lineHeight: 21, marginBottom: 16 },
  passage: { borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, padding: 12 },
  chunks: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 8 },
  segment: { minHeight: 45, maxWidth: "100%", flexDirection: "row", gap: 6, alignItems: "center",
    paddingHorizontal: 11, paddingVertical: 10, borderRadius: 11, borderWidth: 1,
    backgroundColor: colors.surfaceSoft, borderColor: colors.border },
  segmentText: { flexShrink: 1, color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  selectedText: { fontWeight: "800" },
  correct: { borderColor: colors.success, backgroundColor: colors.successSurface },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  pressed: { opacity: 0.8 },
  correctIcon: { color: colors.success, fontSize: 17, fontWeight: "900" },
  wrongIcon: { color: colors.error, fontSize: 17, fontWeight: "900" },
  footHint: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
  feedback: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 18, gap: 8 },
  feedbackCorrect: { borderColor: colors.success, backgroundColor: colors.successSurface },
  feedbackWrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  feedbackTitle: { fontSize: 17, fontWeight: "900", marginBottom: 3 },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  feedbackLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  feedbackText: { color: colors.text, fontSize: 14, lineHeight: 23 },
  solution: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "800" },
  explanation: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginTop: 7 },
});
