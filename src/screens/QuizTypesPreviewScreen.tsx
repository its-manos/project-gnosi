import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import QuizQuestionRenderer from "../components/QuizQuestionRenderer";
import { calculateQuizResults, createQuizSession, advanceQuizSession, evaluateAnswer, questionToken, submitQuizAnswer } from "../quiz/engine";
import { previewQuestions } from "../quiz/previewQuestions";
import type { BuiltinQuizQuestion, QuizSession } from "../quiz/types";
import { colors } from "../theme";

type Props = { onBack: () => void };
const startSession = () => createQuizSession("preview:quiz-question-types", "challenge", previewQuestions);

/**
 * Development-only phone pilot. No account, AsyncStorage, daily record,
 * leaderboard, streak, XP or sync effects. The shared engine still owns results.
 */
export default function QuizTypesPreviewScreen({ onBack }: Props) {
  const [session, setSession] = useState<QuizSession>(startSession);
  const question = session.questions[session.currentIndex] as BuiltinQuizQuestion;
  const answer = session.answers[question.id]?.value;
  const answered = answer !== undefined;
  const result = calculateQuizResults(session);

  function submit(value: unknown) {
    setSession(previous => {
      const next = submitQuizAnswer(previous, questionToken(previous), value);
      return next.changed ? next.session : previous;
    });
  }
  function advance() {
    setSession(previous => {
      const next = advanceQuizSession(previous, questionToken(previous));
      return next.changed ? next.session : previous;
    });
  }

  return <ScrollView testID="quiz-types-preview" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader onBack={onBack} backLabel="ΚΑΘΗΜΕΡΙΝΟ QUIZ" />
    <Text style={styles.eyebrow}>ΕΡΓΑΣΤΗΡΙΟ ΕΡΩΤΗΣΕΩΝ · DEV</Text>
    <Text style={styles.title}>Δοκίμασε τα νέα είδη ερωτήσεων</Text>
    <Text style={styles.note}>Δοκιμή στη συσκευή σου. Δεν επηρεάζει XP, σερί, καθημερινό κουίζ ή αποθηκευμένη πρόοδο.</Text>
    <Text style={styles.counter}>{session.completed ? "Ολοκληρώθηκε" : `Ερώτηση ${session.currentIndex + 1} / ${session.questions.length}`}</Text>
    <ProgressBar progress={Object.keys(session.answers).length / session.questions.length * 100} />
    {session.completed ? <View testID="quiz-types-preview-result" style={styles.result}>
      <Text style={styles.resultTitle}>Ολοκλήρωσες τη δοκιμή!</Text>
      <Text style={styles.text}>Σωστές απαντήσεις: {result.correctCount} / {result.total}</Text>
      <Text style={styles.note}>Το αποτέλεσμα είναι μόνο για έλεγχο λειτουργίας. Δεν αποθηκεύεται.</Text>
      <ActionButton label="Ξεκίνα από την αρχή" onPress={() => setSession(startSession())} />
      <ActionButton label="Επιστροφή στο καθημερινό quiz" onPress={onBack} secondary />
    </View> : <>
      <QuizQuestionRenderer key={question.id} question={question} questionNumber={session.currentIndex + 1}
        answer={answer} onSubmit={submit} />
      {answered ? <View style={styles.feedback}>
        <Text style={styles.text}>{evaluateAnswer(question, answer).correct ? "✓ Σωστή απάντηση" : "✕ Όχι ακριβώς"}</Text>
        <ActionButton label={session.currentIndex === session.questions.length - 1 ?
          "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →"} onPress={advance} />
      </View> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: "900", lineHeight: 35, marginTop: 9, marginBottom: 12 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginBottom: 12 },
  text: { color: colors.textBody, fontSize: 15, lineHeight: 23 },
  counter: { color: colors.accentLight, fontSize: 12, fontWeight: "800", marginVertical: 12 },
  feedback: { marginBottom: 30, gap: 6 },
  result: { marginTop: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    borderRadius: 19, padding: 18, gap: 8 },
  resultTitle: { color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: "800" },
});
