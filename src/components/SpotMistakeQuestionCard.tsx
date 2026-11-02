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
  onSubmit: (optionId: string) => void;
  readingSize?: number;
};

/** Show a subject and multiple full statements; select the single false one. */
export default function SpotMistakeQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const answered = answer !== undefined;
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const falseOption = question.content.options.find(option => option.id === question.content.incorrectOptionId);

  return <View testID="spot-mistake-card" style={styles.card}>
    <View style={styles.topLine}>
      <View style={styles.badge}><Text style={styles.badgeText}>⌕  ΒΡΕΣ ΤΟ ΛΑΘΟΣ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={styles.eyebrow}>ΤΟ ΘΕΜΑ</Text>
    <Text testID="spot-mistake-subject" style={[styles.subject, readingSize ?
      { fontSize: readingSize + 3, lineHeight: Math.round((readingSize + 3) * 1.5) } : undefined]}>
      {question.prompt}{question.prompt.trim().endsWith(":") ? "" : ":"}
    </Text>
    <Text style={styles.instruction}>Ποια από τις παρακάτω προτάσεις είναι <Text style={styles.highlight}>λανθασμένη</Text>;</Text>
    <View style={styles.options}>
      {question.content.options.map((option, index) => {
        const selected = answer === option.id;
        const isFalseStatement = answered && option.id === question.content.incorrectOptionId;
        const wrongSelection = answered && selected && !isFalseStatement;
        return <AnswerMotion key={option.id} active={isFalseStatement || wrongSelection}>
          <Pressable testID={`spot-mistake-option-${option.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${String.fromCharCode(65 + index)}. ${option.text}`}
            accessibilityState={{ selected, disabled: answered }}
            disabled={answered}
            onPress={() => onSubmit(option.id)}
            style={({ pressed }) => [styles.option, selected && styles.selected,
              isFalseStatement && styles.correct, wrongSelection && styles.wrong,
              pressed && !answered && styles.pressed]}>
            <View style={[styles.letterCircle, isFalseStatement && styles.circleCorrect,
              wrongSelection && styles.circleWrong]}>
              <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text style={[styles.optionText, readingSize ? { fontSize: readingSize - 1,
              lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{option.text}</Text>
            {isFalseStatement ? <Text style={styles.correctIcon}>✓</Text> : null}
            {wrongSelection ? <Text style={styles.wrongIcon}>×</Text> : null}
          </Pressable>
        </AnswerMotion>;
      })}
    </View>
    {!answered ? <Text style={styles.footHint}>Διάλεξε τη μία λανθασμένη δήλωση για να συνεχίσεις.</Text> : null}
    {answered ? <QuizReveal><View testID="spot-mistake-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.badText]}>
        {isCorrect ? "✓  Εντόπισες τη λανθασμένη δήλωση!" : "↗  Η λανθασμένη δήλωση είναι:"}
      </Text>
      <Text style={styles.falseStatement}>{falseOption?.text}</Text>
      <Text style={styles.feedbackLabel}>ΤΙ ΙΣΧΥΕΙ ΣΤΗΝ ΠΡΑΓΜΑΤΙΚΟΤΗΤΑ</Text>
      <Text style={styles.solution}>{question.content.correction}</Text>
      <Text style={styles.explanation}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface,
    padding: 18, borderRadius: 22, marginTop: 12, marginBottom: 22 },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    gap: 9, marginBottom: 20 },
  badge: { backgroundColor: colors.accentSurface, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  badgeText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  eyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  subject: { color: colors.text, fontSize: 22, lineHeight: 32, fontWeight: "900", marginBottom: 13 },
  instruction: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginBottom: 18 },
  highlight: { color: colors.accentLight, fontWeight: "800" },
  options: { gap: 11 },
  option: { minHeight: 65, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 13,
    paddingVertical: 12, backgroundColor: colors.surfaceRaised, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  correct: { borderColor: colors.success, backgroundColor: colors.successSurface },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  pressed: { opacity: 0.83 },
  letterCircle: { width: 29, height: 29, borderRadius: 9, backgroundColor: colors.accentSurface,
    flexShrink: 0, justifyContent: "center", alignItems: "center" },
  circleCorrect: { backgroundColor: "#205143" },
  circleWrong: { backgroundColor: "#59323B" },
  letter: { color: colors.text, fontSize: 13, fontWeight: "900" },
  optionText: { minWidth: 0, flex: 1, color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "600" },
  correctIcon: { color: colors.success, fontSize: 19, fontWeight: "900" },
  wrongIcon: { color: colors.error, fontSize: 19, fontWeight: "900" },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 13 },
  feedback: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 18, gap: 9 },
  feedbackCorrect: { borderColor: colors.success, backgroundColor: colors.successSurface },
  feedbackWrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  feedbackTitle: { fontSize: 16, lineHeight: 23, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  falseStatement: { color: colors.text, fontSize: 14, lineHeight: 23, fontWeight: "700" },
  feedbackLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 0.5,
    marginTop: 4 },
  solution: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "800" },
  explanation: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginTop: 5 },
});
