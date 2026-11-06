import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateAnswer } from "../quiz/engine";
import type { OrderingQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import QuestionFeedbackPanel, { AnswerSummaryText } from "./QuestionFeedbackPanel";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: OrderingQuestion;
  questionNumber?: number;
  answer?: readonly string[];
  onSubmit: (ids: string[]) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Accessible row reordering; item identity rather than stale position drives every move. */
export default function OrderingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange, compactAnswered = false }: Props) {
  const [pending, setPending] = useState<string[]>(() => question.content.items.map(item => item.id));
  useEffect(() => { setPending(question.content.items.map(item => item.id)); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const order = answered ? answer : pending;
  const correct = answered && evaluateAnswer(question, answer).correct;
  const labels = new Map<string, string>(question.content.items.map(item => [item.id, item.label] as const));
  const correctOrder = question.content.correctOrder;

  function move(id: string, offset: number) {
    if (answered) return;
    setPending(previous => {
      const index = previous.indexOf(id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // In an immersive question stage the caller owns the footer location.
  // The card still owns its draft and confirmation guard.
  useEffect(() => {
    if (!onActionChange) return;
    onActionChange(answered ? null : { label: "Επιβεβαίωση →", disabled: false, onPress: () => onSubmit([...pending]) });
    return () => onActionChange(null);
  }, [answered, pending, onActionChange]);

  return <View style={styles.card} testID="ordering-card">
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>↕  ΣΩΣΤΗ ΣΕΙΡΑ</Text></View>
      {questionNumber !== undefined ? <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text> : null}
    </View>
    <Text style={[styles.question, readingSize !== undefined && readingSize !== 18 ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{question.prompt}</Text>
    {!answered ? <Text style={styles.hint}>Χρησιμοποίησε τα βέλη για να αλλάξεις τη σειρά.</Text> : null}
    {(!answered || !compactAnswered) ? <View style={styles.orderList}>
      {order.map((id, index) => {
        const atCorrectPlace = answered && id === correctOrder[index];
        return <View key={id} testID={`ordering-item-${id}`}
          style={[styles.item, atCorrectPlace && styles.itemCorrect, answered && !atCorrectPlace && styles.itemWrong]}>
          <View style={[styles.number, atCorrectPlace && styles.numberCorrect]}>
            <Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
          <Text style={styles.label}>{labels.get(id) ?? id}</Text>
          {!answered ? <View style={styles.controls}>
            <Pressable testID={`ordering-up-${id}`} accessibilityRole="button"
              accessibilityLabel={`Μετακίνησε το ${labels.get(id)} προς τα πάνω`}
              accessibilityState={{ disabled: index === 0 }}
              disabled={index === 0} style={({ pressed }) => [styles.control, index === 0 && styles.disabled, pressed && styles.pressed]}
              onPress={() => move(id, -1)}><Text style={styles.arrow}>↑</Text></Pressable>
            <Pressable testID={`ordering-down-${id}`} accessibilityRole="button"
              accessibilityLabel={`Μετακίνησε το ${labels.get(id)} προς τα κάτω`}
              accessibilityState={{ disabled: index === order.length - 1 }}
              disabled={index === order.length - 1}
              style={({ pressed }) => [styles.control, index === order.length - 1 && styles.disabled, pressed && styles.pressed]}
              onPress={() => move(id, 1)}><Text style={styles.arrow}>↓</Text></Pressable>
          </View> : <Text style={[styles.resultMark, atCorrectPlace ? styles.correctMark : styles.wrongMark]}>
            {atCorrectPlace ? "✓" : "×"}
          </Text>}
        </View>;
      })}
    </View> : null}
    {!answered && !onActionChange ? <>
      <Pressable testID="ordering-confirm" accessibilityRole="button" onPress={() => onSubmit([...pending])}
        style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση σειράς  →</Text>
      </Pressable>
    </> : null}
    {answered ? <QuizReveal><QuestionFeedbackPanel
      testID="ordering-feedback" correct={correct}
      explanation={question.explanation} readingSize={readingSize}
      selection={compactAnswered ? <AnswerSummaryText>{order.map((id, i) =>
        `${i + 1}. ${labels.get(id) ?? id}`).join("  →  ")}</AnswerSummaryText> : undefined}
      solution={!correct ? <AnswerSummaryText>{correctOrder.map((id, i) =>
        `${i + 1}. ${labels.get(id) ?? id}`).join("  →  ")}</AnswerSummaryText> : undefined}
    /></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  card: questionCardStyles.card,
  topLine: questionCardStyles.topLine,
  typeBadge: questionCardStyles.typeBadge,
  typeLabel: questionCardStyles.typeLabel,
  counter: questionCardStyles.counter,
  question: questionCardStyles.question,
  hint: questionCardStyles.hint,
  orderList: { gap: 10 },
  item: { minHeight: 69, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1,
    backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 14,
    paddingHorizontal: 11, paddingVertical: 9 },
  itemCorrect: { borderColor: colors.success, backgroundColor: colors.successSurface },
  itemWrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  number: { width: 33, height: 36, borderRadius: 10, backgroundColor: colors.accentSurface, alignItems: "center",
    justifyContent: "center", flexShrink: 0 },
  numberCorrect: { backgroundColor: "#205143" },
  numberText: { color: colors.accentLight, fontSize: 13, fontWeight: "900" },
  label: { flex: 1, minWidth: 0, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  controls: { flexDirection: "row", gap: 5 },
  control: { minWidth: 43, minHeight: 45, alignItems: "center", justifyContent: "center",
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.accentSurface },
  disabled: { opacity: 0.3 },
  pressed: questionCardStyles.pressed,
  arrow: { color: colors.accentLight, fontSize: 22, fontWeight: "700" },
  resultMark: { width: 26, textAlign: "center", fontWeight: "900", fontSize: 20 },
  correctMark: { color: colors.success },
  wrongMark: { color: colors.error },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 13 },
  confirm: questionCardStyles.confirm,
  confirmText: questionCardStyles.confirmText,
  feedback: questionCardStyles.feedback,
  feedbackCorrect: questionCardStyles.feedbackCorrect,
  feedbackWrong: questionCardStyles.feedbackWrong,
  feedbackTitle: { fontSize: 17, fontWeight: "900" },
  correctTitle: { color: colors.success },
  wrongTitle: { color: colors.error },
  solutionList: { borderTopWidth: 1, borderColor: colors.borderStrong, paddingTop: 10, gap: 7 },
  solutionItem: { color: colors.text, fontSize: 14, lineHeight: 23, fontWeight: "700" },
  feedbackText: questionCardStyles.feedbackText,
});
