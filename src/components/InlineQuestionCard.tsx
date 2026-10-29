import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LessonQuestion } from "../data/lessons";
import { colors } from "../theme";

type Props = {
  question: LessonQuestion;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number, correctIndex: number) => void;
};

export default function InlineQuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onSelectAnswer,
}: Props) {
  const answered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>ΜΙΚΡΗ ΠΑΥΣΗ</Text>
        <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
      </View>
      <Text style={styles.question}>{question.question}</Text>

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
              <Text style={styles.answerText}>{answer}</Text>
              {correctOption && <Text style={styles.answerIcon}>✓</Text>}
              {wrongSelection && <Text style={styles.answerIcon}>×</Text>}
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackTitle}>{isCorrect ? "Σωστά — συνέχισε!" : "Κράτησέ το για την επόμενη φορά."}</Text>
          <Text style={styles.feedbackText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#171B2C",
    borderColor: "#393453",
    borderWidth: 1,
    borderRadius: 19,
    padding: 17,
    marginTop: 8,
    marginBottom: 25,
  },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  counter: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  question: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "800", marginBottom: 14 },
  answers: { gap: 8 },
  answer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202538",
    borderRadius: 12,
    borderColor: "#343A50",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  answerCorrect: { backgroundColor: "#17372F", borderColor: "#3CC69A" },
  answerWrong: { backgroundColor: "#40232E", borderColor: "#F07585" },
  answerLetter: { width: 25, color: colors.accentLight, fontWeight: "900", fontSize: 12 },
  answerText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  answerIcon: { marginLeft: 8, color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  feedback: { marginTop: 13, padding: 12, borderRadius: 12 },
  feedbackCorrect: { backgroundColor: "#14352E" },
  feedbackWrong: { backgroundColor: "#302631" },
  feedbackTitle: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 5 },
  feedbackText: { color: "#BEC3D4", fontSize: 12, lineHeight: 19 },
});
