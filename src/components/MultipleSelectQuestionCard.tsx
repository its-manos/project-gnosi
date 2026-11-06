import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { MultipleSelectQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import QuestionFeedbackPanel, { AnswerSummaryText } from "./QuestionFeedbackPanel";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: MultipleSelectQuestion;
  questionNumber?: number;
  /** Parent-owned submitted answer; draft selections never count as scored. */
  answer?: readonly number[];
  onSubmit: (selectedIndices: number[]) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Multi-answer card with separate draft selection and confirmed feedback. */
export default function MultipleSelectQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange, compactAnswered = false }: Props) {
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
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>☑  ΔΙΑΛΕΞΕ ΟΣΕΣ ΙΣΧΥΟΥΝ</Text></View>
      {questionNumber !== undefined ? <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text> : null}
    </View>
    <Text accessibilityRole="header" style={[styles.question, readingSize !== undefined && readingSize !== 18 ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>
      {question.prompt}
    </Text>
    {(!answered || !compactAnswered) ? <View style={styles.answers}>
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
    </View> : null}
    {!answered && !onActionChange ? <Pressable testID="multiple-select-confirm" accessibilityRole="button"
      accessibilityState={{ disabled: pending.length === 0 }} disabled={pending.length === 0}
      onPress={() => { if (pending.length > 0) onSubmit([...pending]); }}
      style={({ pressed }) => [styles.confirm, pending.length === 0 && styles.confirmDisabled, pressed && styles.confirmPressed]}>
      <Text style={styles.confirmText}>Επιβεβαίωση επιλογών  →</Text>
    </Pressable> : null}
    {answered ? <QuizReveal><QuestionFeedbackPanel
      testID="multiple-select-feedback" correct={isCorrect}
      explanation={question.explanation} readingSize={readingSize}
      selection={compactAnswered ? <AnswerSummaryText>
        {selected.map(i => question.content.answers[i]).join(" · ")}
      </AnswerSummaryText> : undefined}
      solution={!isCorrect ? <AnswerSummaryText>{correctLabels.join(" · ")}</AnswerSummaryText> : undefined}
    /></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  checkbox: { height: 25, width: 25, borderWidth: 2, borderColor: colors.textMuted, borderRadius: 7,
    alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  checkboxCorrect: { borderColor: colors.success, backgroundColor: "#205143" },
  checkboxWrong: { borderColor: colors.error, backgroundColor: "#59323B" },
  check: { color: colors.text, fontSize: 15, fontWeight: "900" },
  statusCorrect: { color: colors.success, fontSize: 20, fontWeight: "900" },
  statusWrong: { color: colors.error, fontSize: 20, fontWeight: "900" },
});
