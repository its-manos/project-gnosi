import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { MultipleSelectQuestion } from "../quiz/types";
import { colors, reading } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: MultipleSelectQuestion;
  questionNumber: number;
  /** Persisted value, supplied by the parent after confirmation. */
  answer?: readonly number[];
  onSubmit: (selectedIndices: number[]) => void;
  readingSize?: number;
};

/** Interactive presentation only. The parent owns the scored submission and storage. */
export default function MultipleSelectQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [pending, setPending] = useState<number[]>([]);
  useEffect(() => { setPending([]); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const selected = answered ? answer : pending;
  const result = answered ? evaluateAnswer(question, answer) : null;
  const isCorrect = result?.correct === true;

  function toggle(index: number) {
    if (answered) return;
    setPending(previous => previous.includes(index) ? previous.filter(i => i !== index) : [...previous, index]);
  }

  return (
    <View style={styles.card} testID="multiple-select-card">
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>ΕΠΙΛΕΞΕ ΟΣΕΣ ΙΣΧΥΟΥΝ</Text>
        <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
      </View>
      <Text style={[styles.question, readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>
        {question.prompt}
      </Text>
      <Text style={styles.hint}>Μπορεί να υπάρχουν περισσότερες από μία σωστές απαντήσεις.</Text>
      <View style={styles.answers}>
        {question.content.answers.map((label, index) => {
          const checked = selected.includes(index);
          const correctOption = answered && question.content.correctIndices.includes(index);
          const wrongSelection = answered && checked && !correctOption;
          return <AnswerMotion key={index} active={correctOption || wrongSelection}>
            <Pressable
              testID={`multiple-select-option-${index}`}
              accessibilityRole="checkbox"
              accessibilityLabel={label}
              accessibilityState={{ checked, disabled: answered }}
              onPress={() => toggle(index)}
              disabled={answered}
              style={[styles.answer, checked && styles.selected, correctOption && styles.answerCorrect, wrongSelection && styles.answerWrong]}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                <Text style={styles.check}>{checked ? "✓" : ""}</Text>
              </View>
              <Text style={[styles.answerText, readingSize ? { fontSize: readingSize - 1, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{label}</Text>
              {correctOption ? <Text style={styles.correctMark}>✓</Text> : null}
              {wrongSelection ? <Text style={styles.correctMark}>×</Text> : null}
            </Pressable>
          </AnswerMotion>;
        })}
      </View>
      {!answered ? <Pressable testID="multiple-select-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: pending.length === 0 }} disabled={pending.length === 0}
        onPress={() => { if (pending.length > 0) onSubmit([...pending]); }}
        style={[styles.confirm, pending.length === 0 && styles.confirmDisabled]}>
        <Text style={styles.confirmText}>Επιβεβαίωση</Text>
      </Pressable> : null}
      {answered ? <QuizReveal><View testID="multiple-select-feedback" accessibilityLiveRegion="polite"
        style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
        <Text style={styles.feedbackTitle}>{isCorrect ? "Σωστά — συνέχισε!" : "Κράτησέ το για την επόμενη φορά."}</Text>
        <Text style={[styles.feedbackText, readingSize ? { fontSize: readingSize - 1, lineHeight: Math.round(readingSize * 1.6) } : undefined]}>{question.explanation}</Text>
      </View></QuizReveal> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: reading.surface, borderColor: reading.border, borderWidth: 1, borderRadius: 19,
    padding: 20, marginTop: 8, marginBottom: 25 },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, flexShrink: 1 },
  counter: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  question: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "700", marginBottom: 8 },
  hint: { color: reading.muted, fontSize: 12, lineHeight: 19, marginBottom: 16 },
  answers: { gap: 8 },
  answer: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#242D35",
    borderRadius: 12, borderColor: "#343A50", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  selected: { borderColor: colors.accentLight },
  answerCorrect: { backgroundColor: "#17372F", borderColor: "#3CC69A" },
  answerWrong: { backgroundColor: "#40232E", borderColor: "#F07585" },
  checkbox: { height: 22, width: 22, borderWidth: 1, borderColor: reading.muted, borderRadius: 5,
    alignItems: "center", justifyContent: "center" },
  checkboxChecked: { borderColor: colors.accentLight },
  check: { color: colors.accentLight, fontSize: 15, fontWeight: "900" },
  answerText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "500" },
  correctMark: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  confirm: { minHeight: 48, marginTop: 16, padding: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accentLight, borderRadius: 12 },
  confirmDisabled: { opacity: 0.45 },
  confirmText: { color: "#12181D", fontSize: 15, fontWeight: "800" },
  feedback: { marginTop: 13, padding: 12, borderRadius: 12 },
  feedbackCorrect: { backgroundColor: "#14352E" },
  feedbackWrong: { backgroundColor: "#302631" },
  feedbackTitle: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 5 },
  feedbackText: { color: reading.text, fontSize: 15, lineHeight: 25 },
});
