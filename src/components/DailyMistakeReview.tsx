import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { GeneralKnowledgeQuestion } from "../data/questions";
import { colors } from "../theme";
import ActionButton from "./ActionButton";
import AnswerOption from "./AnswerOption";
import ProgressBar from "./ProgressBar";
import ReportContentButton from "./ReportContentButton";
import { dailyReportTarget } from "../utils/contentReports";

type Props = {
  questions: GeneralKnowledgeQuestion[];
  onDone: () => void;
  onAdvance: () => void;
};

/** Practice lives only in this component; it never writes daily results or history. */
export default function DailyMistakeReview({ questions, onDone, onAdvance }: Props) {
  const [{ index, answers }, setAttempt] = useState({
    index: 0,
    answers: {} as Record<string, number>,
  });
  const [sourceError, setSourceError] = useState(false);
  const sourceRequest = useRef(0);
  const question = questions[index];
  const selectedAnswer = answers[String(index)] ?? null;
  const correctCount = questions.reduce(
    (total, item, itemIndex) => total + (answers[String(itemIndex)] === item.correctIndex ? 1 : 0),
    0,
  );

  function nextQuestion() {
    if (selectedAnswer === null) return;
    sourceRequest.current += 1;
    setSourceError(false);
    setAttempt((previous) => {
      if (previous.index !== index || previous.answers[String(index)] === undefined) return previous;
      return { ...previous, index: index + 1 };
    });
    onAdvance();
  }

  async function openSource(url: string) {
    const request = ++sourceRequest.current;
    try {
      await Linking.openURL(url);
      if (request === sourceRequest.current) setSourceError(false);
    } catch {
      if (request === sourceRequest.current) setSourceError(true);
    }
  }

  if (!question) {
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Η ΕΠΑΝΑΛΗΨΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
        <Text style={styles.title}>Ένα βήμα πιο κοντά στη γνώση.</Text>
        <Text style={styles.body}>Σωστές στην εξάσκηση: {correctCount} / {questions.length}</Text>
        <Text style={styles.note}>Το σκορ και το σερί σου διατηρούνται.</Text>
        <ActionButton label="Επιστροφή στο αποτέλεσμα" onPress={onDone} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ΕΠΑΝΑΛΗΨΗ ΛΑΘΩΝ · {index + 1} / {questions.length}</Text>
      <Text style={styles.note}>Χωρίς πόντους · η εξάσκηση δεν αποθηκεύεται.</Text>
      <ProgressBar progress={((index + 1) / questions.length) * 100} />
      <Text style={styles.question}>{question.question}</Text>
      <ReportContentButton key={question.id} target={dailyReportTarget(question)} />
      <View style={styles.answers}>
        {question.answers.map((answer, answerIndex) => (
          <AnswerOption
            key={`${question.id}-${answerIndex}`}
            label={answer}
            index={answerIndex}
            selected={selectedAnswer === answerIndex}
            correct={answerIndex === question.correctIndex}
            locked={selectedAnswer !== null}
            onPress={() => {
              setAttempt((previous) => {
                if (previous.index !== index || previous.answers[String(index)] !== undefined) return previous;
                return { ...previous, answers: { ...previous.answers, [String(index)]: answerIndex } };
              });
            }}
          />
        ))}
      </View>
      {selectedAnswer !== null ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <Text style={styles.feedbackTitle}>
            {selectedAnswer === question.correctIndex ? "Σωστά!" : "Ας το θυμηθούμε:"}
          </Text>
          <Text style={styles.body}>Σωστή απάντηση: {question.answers[question.correctIndex]}</Text>
          <Text style={styles.body}>{question.explanation}</Text>
          <Pressable accessibilityRole="link" style={styles.source} onPress={() => { void openSource(question.sourceUrl); }}>
            <Text style={styles.sourceText}>Πηγή: {question.sourceTitle} ↗</Text>
          </Pressable>
          {sourceError ? <Text style={styles.error}>Δεν ήταν δυνατό το άνοιγμα της πηγής.</Text> : null}
          <ActionButton
            label={index === questions.length - 1 ? "Ολοκλήρωση επανάληψης →" : "Επόμενη ερώτηση →"}
            onPress={nextQuestion}
          />
        </View>
      ) : null}
      <ActionButton label="Επιστροφή στο αποτέλεσμα" onPress={onDone} secondary />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24 },
  eyebrow: { color: colors.accentLight, fontSize: 11, lineHeight: 18, fontWeight: "900", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900", marginVertical: 20 },
  question: { color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: "800", marginVertical: 24 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginVertical: 16 },
  answers: { gap: 11 },
  feedback: { padding: 18, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, marginTop: 22, gap: 8 },
  feedbackTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  source: { paddingVertical: 10 },
  sourceText: { color: colors.accentLight, fontSize: 12, lineHeight: 18, textDecorationLine: "underline" },
  error: { color: colors.error, fontSize: 12, lineHeight: 18 },
});
