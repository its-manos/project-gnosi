import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LessonQuestion } from "../data/lessons";
import { AnswerMotion } from "../play/motion";
import { colors } from "../theme";
import type { ReportTarget } from "../utils/contentReports";
import QuizReveal from "./QuizReveal";
import ReportContentButton from "./ReportContentButton";

type Props = {
  combo?: number;
  question: LessonQuestion;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number, correctIndex: number) => void;
  readingSize?: number;
  reportTarget?: ReportTarget;
};

/**
 * Reading-first single-choice checkpoint. Submission and saved state stay in
 * the parent lesson flow; this card only presents/locks the answered question.
 */
export default function InlineQuestionCard({
  combo = 0,
  question,
  questionNumber,
  selectedAnswer,
  onSelectAnswer,
  readingSize,
  reportTarget,
}: Props) {
  const answered = selectedAnswer !== undefined;
  const isCorrect = answered && selectedAnswer === question.correctIndex;
  const correctAnswer = question.answers[question.correctIndex];
  const questionTextSize = readingSize
    ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) }
    : undefined;
  const answerTextSize = readingSize
    ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.55) }
    : undefined;

  return (
    <View style={styles.card} testID="lesson-question-card">
      <View style={styles.topLine}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦  ΣΤΑΣΗ ΓΝΩΣΗΣ</Text>
        </View>
        <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
      </View>

      <Text accessibilityRole="header" style={[styles.question, questionTextSize]}>
        {question.question}
      </Text>
      <Text style={styles.instructions}>Επίλεξε μία απάντηση για να συνεχίσεις την ανάγνωση.</Text>

      <View style={styles.answers}>
        {question.answers.map((label, index) => {
          const selected = selectedAnswer === index;
          const correctOption = answered && index === question.correctIndex;
          const wrongSelection = answered && selected && !isCorrect;
          return (
            <AnswerMotion key={index} active={correctOption || wrongSelection}>
              <Pressable
                testID={`lesson-question-option-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${String.fromCharCode(65 + index)}. ${label}`}
                accessibilityState={{ selected, disabled: answered }}
                disabled={answered}
                onPress={() => { if (!answered) onSelectAnswer(index, question.correctIndex); }}
                style={({ pressed }) => [
                  styles.answer,
                  correctOption && styles.answerCorrect,
                  wrongSelection && styles.answerWrong,
                  pressed && !answered && styles.answerPressed,
                ]}
              >
                <View style={[styles.letterBox, correctOption && styles.letterCorrect, wrongSelection && styles.letterWrong]}>
                  <Text style={[styles.letter, correctOption && styles.letterCorrectText, wrongSelection && styles.letterWrongText]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.answerText, answerTextSize]}>{label}</Text>
                {correctOption ? <Text style={styles.correctIcon}>✓</Text> : null}
                {wrongSelection ? <Text style={styles.wrongIcon}>×</Text> : null}
              </Pressable>
            </AnswerMotion>
          );
        })}
      </View>

      {answered ? (
        <QuizReveal>
          <View testID="lesson-question-feedback" accessibilityLiveRegion="polite"
            style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={styles.feedbackTop}>
              <Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.badText]}>
                {isCorrect ? "✓  Σωστά!" : "Η σωστή απάντηση"}
              </Text>
              {combo > 1 ? (
                <View style={styles.comboBadge}><Text style={styles.comboText}>✦  ΣΕΡΙ {combo}</Text></View>
              ) : null}
            </View>
            {!isCorrect ? <Text testID="lesson-question-correction" style={[styles.correction, answerTextSize]}>
              {correctAnswer}
            </Text> : null}
            <Text style={styles.explanationLabel}>ΓΙΑΤΙ ΣΥΜΒΑΙΝΕΙ ΑΥΤΟ;</Text>
            <Text style={[styles.feedbackText, answerTextSize]}>{question.explanation}</Text>
          </View>
        </QuizReveal>
      ) : null}

      {reportTarget ? <ReportContentButton target={reportTarget} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
    marginBottom: 22,
  },
  topLine: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap", gap: 10, marginBottom: 18,
  },
  badge: { backgroundColor: colors.accentSurface, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  badgeText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  question: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800", marginBottom: 9 },
  instructions: { color: colors.textBody, fontSize: 13, lineHeight: 21, marginBottom: 18 },
  answers: { gap: 10 },
  answer: {
    minHeight: 62, flexDirection: "row", alignItems: "center", gap: 13,
    borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    backgroundColor: colors.surfaceRaised, paddingHorizontal: 13, paddingVertical: 12,
  },
  answerPressed: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  answerCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  answerWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  letterBox: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSurface,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  letterCorrect: { backgroundColor: colors.successSurface, borderWidth: 1, borderColor: colors.success },
  letterWrong: { backgroundColor: colors.errorSurface, borderWidth: 1, borderColor: colors.error },
  letter: { color: colors.accentLight, fontSize: 13, fontWeight: "900" },
  letterCorrectText: { color: colors.success },
  letterWrongText: { color: colors.error },
  answerText: { minWidth: 0, flex: 1, color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "600" },
  correctIcon: { color: colors.success, fontSize: 20, fontWeight: "900", flexShrink: 0 },
  wrongIcon: { color: colors.error, fontSize: 20, fontWeight: "900", flexShrink: 0 },
  feedback: { marginTop: 18, borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  feedbackCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  feedbackWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  feedbackTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  feedbackTitle: { fontSize: 17, lineHeight: 24, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  comboBadge: { backgroundColor: colors.accentSurface, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  comboText: { color: colors.accentLight, fontSize: 10, fontWeight: "900" },
  correction: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "800" },
  explanationLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.7, fontWeight: "900", marginTop: 2 },
  feedbackText: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
});
