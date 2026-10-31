import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import ReportContentButton from "../components/ReportContentButton";
import { lessonReportTarget } from "../utils/contentReports";
import { colors } from "../theme";

type Props = {
  lesson: Lesson;
  questionIndex: number;
  selectedAnswer: number | null;
  score: number;
  onBack: () => void;
  onChooseAnswer: (answerIndex: number, correctIndex: number) => void;
  onNextQuestion: (questionCount: number) => void;
};

export default function QuizScreen({ lesson, questionIndex, selectedAnswer, score, onBack, onChooseAnswer, onNextQuestion }: Props) {
  const question = lesson.questions[questionIndex];
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} backLabel="ΑΡΘΡΟ" />
      <Text style={styles.eyebrow}>ΕΛΕΓΧΟΣ ΓΝΩΣΕΩΝ</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <View style={styles.progressRow}>
        <Text style={styles.muted}>Πρόοδος quiz</Text>
        <Text style={styles.counter}>{questionIndex + 1} / {lesson.questions.length}</Text>
      </View>
      <ProgressBar progress={((questionIndex + 1) / lesson.questions.length) * 100} />
      <View style={styles.questionCard}>
        <Text style={styles.questionNumber}>ΕΡΩΤΗΣΗ {questionIndex + 1}</Text>
        <Text style={styles.question}>{question.question}</Text>
      </View>
      <View style={styles.answers}>
        {question.answers.map((answer, index) => (
          <AnswerOption
            key={answer}
            label={answer}
            index={index}
            selected={selectedAnswer === index}
            correct={index === question.correctIndex}
            locked={selectedAnswer !== null}
            onPress={() => onChooseAnswer(index, question.correctIndex)}
          />
        ))}
      </View>
      <ReportContentButton key={questionIndex} target={lessonReportTarget(lesson, questionIndex)} />
      {selectedAnswer !== null && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{isCorrect ? "Σωστά! 🎉" : "Όχι ακριβώς!"}</Text>
          <Text style={styles.body}>{question.explanation}</Text>
          <ActionButton
            label={questionIndex === lesson.questions.length - 1 ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →"}
            onPress={() => onNextQuestion(lesson.questions.length)}
          />
          <Text style={styles.scoreNote}>Σωστές απαντήσεις μέχρι τώρα: {score}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  progressRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 11 },
  muted: { color: "#979CB3", fontSize: 12, lineHeight: 19 },
  counter: { color: "#C0B5FF", fontSize: 13, fontWeight: "800" },
  questionCard: { backgroundColor: "#181C2B", borderRadius: 20, padding: 21, borderWidth: 1, borderColor: "#30354B", marginTop: 27, marginBottom: 19 },
  questionNumber: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 13 },
  question: { color: "#F5F4FB", fontSize: 22, fontWeight: "800", lineHeight: 30 },
  answers: { gap: 11 },
  feedback: { backgroundColor: colors.surfaceSoft, borderRadius: 19, borderWidth: 1, borderColor: "#30354A", padding: 18, marginTop: 22 },
  feedbackTitle: { color: "#F5F4FB", fontSize: 20, fontWeight: "900", marginBottom: 9 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  scoreNote: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
});
