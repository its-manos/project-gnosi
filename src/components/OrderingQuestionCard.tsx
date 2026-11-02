import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateAnswer } from "../quiz/engine";
import type { OrderingQuestion } from "../quiz/types";
import { colors, reading } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: OrderingQuestion;
  questionNumber: number;
  answer?: readonly string[];
  onSubmit: (ids: string[]) => void;
  readingSize?: number;
};

/** Move controls also work with screen readers; no drag gesture is required. */
export default function OrderingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [pending, setPending] = useState<string[]>(() => question.content.items.map(item => item.id));
  useEffect(() => { setPending(question.content.items.map(item => item.id)); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const order = answered ? answer : pending;
  const correct = answered && evaluateAnswer(question, answer).correct;
  const labels = new Map<string, string>(question.content.items.map(item => [item.id, item.label] as const));

  function move(index: number, offset: number) {
    if (answered) return;
    const target = index + offset;
    if (target < 0 || target >= pending.length) return;
    setPending(previous => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return <View style={styles.card} testID="ordering-card">
    <View style={styles.topLine}>
      <Text style={styles.eyebrow}>ΒΑΛΕ ΣΤΗ ΣΩΣΤΗ ΣΕΙΡΑ</Text>
      <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
    </View>
    <Text style={[styles.question, readingSize ? { fontSize: readingSize } : undefined]}>{question.prompt}</Text>
    <Text style={styles.hint}>Χρησιμοποίησε τα βέλη για να αλλάξεις τη σειρά και έπειτα επιβεβαίωσε.</Text>
    {order.map((id, index) => <View key={id} testID={`ordering-item-${id}`} style={styles.item}>
      <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
      <Text style={styles.label}>{labels.get(id) ?? id}</Text>
      {!answered ? <View style={styles.controls}>
        <Pressable testID={`ordering-up-${id}`} accessibilityRole="button"
          accessibilityLabel={`Μετακίνησε το ${labels.get(id)} προς τα πάνω`}
          accessibilityState={{ disabled: index === 0 }}
          disabled={index === 0} style={[styles.control, index === 0 && styles.disabled]}
          onPress={() => move(index, -1)}><Text style={styles.arrow}>↑</Text></Pressable>
        <Pressable testID={`ordering-down-${id}`} accessibilityRole="button"
          accessibilityLabel={`Μετακίνησε το ${labels.get(id)} προς τα κάτω`}
          accessibilityState={{ disabled: index === order.length - 1 }}
          disabled={index === order.length - 1} style={[styles.control, index === order.length - 1 && styles.disabled]}
          onPress={() => move(index, 1)}><Text style={styles.arrow}>↓</Text></Pressable>
      </View> : null}
    </View>)}
    {!answered ? <Pressable testID="ordering-confirm" accessibilityRole="button" onPress={() => onSubmit([...pending])}
      style={styles.confirm}><Text style={styles.confirmText}>Επιβεβαίωση σειράς</Text></Pressable> : null}
    {answered ? <QuizReveal><View testID="ordering-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={styles.feedbackTitle}>{correct ? "Σωστά — συνέχισε!" : "Η σωστή σειρά:"}</Text>
      {!correct ? <Text style={styles.feedbackText}>{question.content.correctOrder.map(id => labels.get(id)).join(" → ")}</Text> : null}
      <Text style={styles.feedbackText}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 20, marginVertical: 12, borderRadius: 19, borderWidth: 1, borderColor: reading.border, backgroundColor: reading.surface },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.accentLight, fontWeight: "900", fontSize: 10, letterSpacing: 1, flexShrink: 1 },
  counter: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  question: { color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: "700", marginBottom: 8 },
  hint: { color: reading.muted, fontSize: 12, lineHeight: 20, marginBottom: 16 },
  item: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#242D35",
    borderColor: "#343A50", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, marginBottom: 9 },
  number: { width: 25, alignItems: "center" },
  numberText: { color: colors.accentLight, fontSize: 14, fontWeight: "900" },
  label: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  controls: { flexDirection: "row", gap: 4 },
  control: { minWidth: 44, minHeight: 46, justifyContent: "center", alignItems: "center", borderRadius: 9, backgroundColor: "#343A50" },
  disabled: { opacity: 0.35 },
  arrow: { color: colors.text, fontSize: 22, fontWeight: "700" },
  confirm: { marginTop: 10, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentLight },
  confirmText: { color: "#12181D", fontSize: 14, fontWeight: "800" },
  feedback: { padding: 13, borderRadius: 12, marginTop: 14, gap: 8 },
  feedbackCorrect: { backgroundColor: "#14352E" },
  feedbackWrong: { backgroundColor: "#302631" },
  feedbackTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  feedbackText: { color: reading.text, fontSize: 14, lineHeight: 22 },
});
