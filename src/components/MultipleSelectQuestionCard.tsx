import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { MultipleSelectQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: MultipleSelectQuestion;
  questionNumber: number;
  /** Parent-owned submitted answer; draft selections never count as scored. */
  answer?: readonly number[];
  onSubmit: (selectedIndices: number[]) => void;
  readingSize?: number;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Multi-answer card with separate draft selection and confirmed feedback. */
export default function MultipleSelectQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange }: Props) {
  const [pending, setPending] = useState<number[]>([]);
  useEffect(() => { setPending([]); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const selected = answered ? answer : pending;
  const result = answered ? evaluateAnswer(question, answer) : null;
  const isCorrect = result?.correct === true;
  const correctLabels = question.content.correctIndices.map(i => question.content.answers[i]);

  function toggle(index: number) {
    if (answered) return;
    setPending(previous => previous.includes(index) ? previous.filter(i => i !== index) : [...previous, index]);
  }

  // In an immersive question stage the caller owns the footer location.
  // The card still owns its draft and confirmation guard.
  useEffect(() => {
    if (!onActionChange) return;
    onActionChange(answered ? null : { label: "Επιβεβαίωση →", disabled: pending.length === 0, onPress: () => { if (pending.length > 0) onSubmit([...pending]); } });
    return () => onActionChange(null);
  }, [answered, pending, onActionChange]);

  return <View style={styles.card} testID="multiple-select-card">
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>☑  ΠΟΛΛΑΠΛΗ ΕΠΙΛΟΓΗ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={[styles.question, readingSize !== undefined && readingSize !== 18 ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>
      {question.prompt}
    </Text>
    <View style={styles.selectionBar}>
      <Text style={styles.selectionText}>{answered ? "Η απάντησή σου" : "Οι επιλογές σου"}</Text>
      <Text style={styles.selectionCount}>{selected.length} / {question.content.answers.length}</Text>
    </View>
    <View style={styles.answers}>
      {question.content.answers.map((label, index) => {
        const checked = selected.includes(index);
        const correctOption = answered && question.content.correctIndices.includes(index);
        const wrongSelection = answered && checked && !correctOption;
        return <AnswerMotion key={index} active={checked || correctOption || wrongSelection}>
          <Pressable
            testID={`multiple-select-option-${index}`}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked, disabled: answered }}
            onPress={() => toggle(index)}
            disabled={answered}
            style={({ pressed }) => [styles.answer, checked && styles.selected, pressed && !answered && styles.pressed,
              correctOption && styles.answerCorrect, wrongSelection && styles.answerWrong]}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked, correctOption && styles.checkboxCorrect,
              wrongSelection && styles.checkboxWrong]}>
              <Text style={styles.check}>{checked ? "✓" : correctOption ? "✓" : ""}</Text>
            </View>
            <Text style={[styles.answerText, readingSize !== undefined && readingSize !== 18 ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{label}</Text>
            {correctOption ? <Text style={styles.statusCorrect}>✓</Text> : null}
            {wrongSelection ? <Text style={styles.statusWrong}>×</Text> : null}
          </Pressable>
        </AnswerMotion>;
      })}
    </View>
    {!answered && !onActionChange ? <Pressable testID="multiple-select-confirm" accessibilityRole="button"
      accessibilityState={{ disabled: pending.length === 0 }} disabled={pending.length === 0}
      onPress={() => { if (pending.length > 0) onSubmit([...pending]); }}
      style={({ pressed }) => [styles.confirm, pending.length === 0 && styles.confirmDisabled, pressed && styles.confirmPressed]}>
      <Text style={styles.confirmText}>Επιβεβαίωση επιλογών  →</Text>
    </Pressable> : null}
    {answered ? <QuizReveal><View testID="multiple-select-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackHeading, isCorrect ? styles.correctHeading : styles.wrongHeading]}>
        {isCorrect ? "✓  Σωστά!" : "↗  Δες τι κρατάμε"}
      </Text>
      {!isCorrect ? <View style={styles.solution}>
        <Text style={styles.solutionHeading}>Οι σωστές επιλογές</Text>
        {correctLabels.map((label, index) => <Text key={index} style={styles.solutionText}>✓  {label}</Text>)}
      </View> : null}
      <Text style={styles.feedbackText}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  selectionBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  selectionText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  selectionCount: { color: colors.accentLight, fontSize: 13, fontWeight: "900" },
  checkbox: { height: 25, width: 25, borderWidth: 2, borderColor: colors.textMuted, borderRadius: 7,
    alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  checkboxCorrect: { borderColor: colors.success, backgroundColor: "#205143" },
  checkboxWrong: { borderColor: colors.error, backgroundColor: "#59323B" },
  check: { color: colors.text, fontSize: 15, fontWeight: "900" },
  statusCorrect: { color: colors.success, fontSize: 20, fontWeight: "900" },
  statusWrong: { color: colors.error, fontSize: 20, fontWeight: "900" },
  feedbackHeading: { fontSize: 17, fontWeight: "900" },
  correctHeading: { color: colors.success },
  wrongHeading: { color: colors.error },
  solution: { gap: 6, borderTopWidth: 1, borderColor: colors.borderStrong, paddingTop: 11 },
  solutionHeading: { color: colors.text, fontSize: 12, fontWeight: "800" },
  solutionText: { color: colors.textBody, fontSize: 13, lineHeight: 20 },
});
