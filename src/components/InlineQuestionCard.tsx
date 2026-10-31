import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LessonQuestion } from "../data/lessons";
import { colors, reading } from "../theme";
import ReportContentButton from "./ReportContentButton";
import type { ReportTarget } from "../utils/contentReports";

type Props = {
  question: LessonQuestion;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number, correctIndex: number) => void;
  readingSize?: number;
  reportTarget?: ReportTarget;
};

export default function InlineQuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelectAnswer,
  readingSize,
  reportTarget,
}: Props) {
  const answered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>ΜΙΚΡΗ ΠΑΥΣΗ</Text>
        <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
      </View>
      <Text style={[styles.question, readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{question.question}</Text>

      <View style={styles.answers}>
        {question.answers.map((answer, answerIndex) => {
          const correctOption = answered && answerIndex === question.correctIndex;
          const wrongSelection = answered && answerIndex === selectedAnswer && !isCorrect;

          return (
            <Pressable
              key={`${questionNumber}-${answerIndex}`}
              onPress={() => onSelectAnswer(answerIndex, question.correctIndex)}
              disabled={answered}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered }}
              style={[
                styles.answer,
                correctOption && styles.answerCorrect,
                wrongSelection && styles.answerWrong,
              ]}
            >
              <Text style={styles.answerLetter}>{String.fromCharCode(65 + answerIndex)}</Text>
              <Text style={[styles.answerText, readingSize ? { fontSize: readingSize - 1, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{answer}</Text>
              {correctOption && <Text style={styles.answerIcon}>✓</Text>}
              {wrongSelection && <Text style={styles.answerIcon}>×</Text>}
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View accessibilityLiveRegion="polite" style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackTitle}>{isCorrect ? "Σωστά — συνέχισε!" : "Κράτησέ το για την επόμενη φορά."}</Text>
          <Text style={[styles.feedbackText, readingSize ? { fontSize: readingSize - 1, lineHeight: Math.round(readingSize * 1.6) } : undefined]}>{question.explanation}</Text>
        </View>
      )}
      {reportTarget ? <ReportContentButton target={reportTarget} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: reading.surface,
    borderColor: reading.border,
    borderWidth: 1,
    borderRadius: 19,
    padding: 20,
    marginTop: 8,
    marginBottom: 25,
  },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  counter: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  question: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "700", marginBottom: 18 },
  answers: { gap: 8 },
  answer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242D35",
    borderRadius: 12,
    borderColor: "#343A50",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  answerCorrect: { backgroundColor: "#17372F", borderColor: "#3CC69A" },
  answerWrong: { backgroundColor: "#40232E", borderColor: "#F07585" },
  answerLetter: { width: 25, color: colors.accentLight, fontWeight: "900", fontSize: 12 },
  answerText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "500" },
  answerIcon: { marginLeft: 8, color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  feedback: { marginTop: 13, padding: 12, borderRadius: 12 },
  feedbackCorrect: { backgroundColor: "#14352E" },
  feedbackWrong: { backgroundColor: "#302631" },
  feedbackTitle: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 5 },
  feedbackText: { color: reading.text, fontSize: 15, lineHeight: 25 },
});
