import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { FillBlankQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import QuestionFeedbackPanel, { AnswerSummaryText } from "./QuestionFeedbackPanel";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: FillBlankQuestion;
  questionNumber?: number;
  answer?: string;
  onSubmit: (optionId: string) => void;
  readingSize?: number;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** The authored sentence is the question. Do not restate it with an extra
 * prompt, tutorial and duplicate heading above the word bank. */
export default function FillBlankQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pendingRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  useEffect(() => {
    pendingRef.current = null;
    submittingRef.current = false;
    setPending(null);
    setSubmitting(false);
  }, [question.id, question.version]);

  const answered = answer !== undefined;
  const selectedId = answered ? answer : pending;
  const selectedOption = question.content.options.find(option => option.id === selectedId);
  const correctOption = question.content.options.find(option => option.id === question.content.correctOptionId);
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const sentenceSize = readingSize !== undefined && readingSize !== 18
    ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined;
  const optionSize = readingSize !== undefined && readingSize !== 18
    ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.5) } : undefined;
  const before = question.content.before.trim();
  const after = question.content.after.trim();
  const punctuationOnly = /^[.,;:!?…·]+$/.test(after);

  function choose(id: string) {
    if (answered || submittingRef.current) return;
    pendingRef.current = id;
    setPending(id);
  }
  function confirm() {
    const id = pendingRef.current;
    if (answered || submittingRef.current || id === null ||
      !question.content.options.some(option => option.id === id)) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      void Promise.resolve(onSubmit(id)).catch(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  // In an immersive question stage the caller owns the footer location.
  // The card still owns its draft and confirmation guard.
  useEffect(() => {
    if (!onActionChange) return;
    onActionChange(answered ? null : { label: "Επιβεβαίωση →", disabled: pending === null || submitting, onPress: confirm });
    return () => onActionChange(null);
  }, [answered, pending, submitting, onActionChange]);

  return <View style={styles.card} testID="fill-blank-card">
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.badge}><Text style={styles.badgeText}>✎  ΣΥΜΠΛΗΡΩΣΕ ΤΟ ΚΕΝΟ</Text></View>
      {questionNumber !== undefined ? <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text> : null}
    </View>
    <View testID="fill-blank-sentence" style={styles.passage} accessible
      accessibilityRole="header"
      accessibilityLabel={`${before} ${selectedOption?.text ?? "κενό"} ${after}`}>
      <View style={styles.sentence}>
        {before ? <Text style={[styles.passageText, sentenceSize]}>{before}</Text> : null}
        <View style={styles.slotTail}>
          <View testID="fill-blank-slot" style={[styles.slot,
            answered && (isCorrect ? styles.slotCorrect : styles.slotWrong),
            !answered && pending !== null && styles.slotFilled]}>
            <Text style={[styles.slotText, selectedOption && styles.slotTextFilled, optionSize]}>
              {selectedOption ? selectedOption.text : "________"}
            </Text>
          </View>
          {punctuationOnly ? <Text style={[styles.passageText, sentenceSize]}>{after}</Text> : null}
        </View>
        {!punctuationOnly && after ? <Text style={[styles.passageText, sentenceSize]}>{after}</Text> : null}
      </View>
    </View>
    {!answered ? <>
      <View style={styles.options}>
        {question.content.options.map((option, index) => {
          const selected = selectedId === option.id;
          return <AnswerMotion key={option.id} active={selected}>
            <Pressable testID={`fill-blank-option-${option.id}`}
              accessibilityRole="button" accessibilityLabel={option.text}
              accessibilityState={{ selected, disabled: submitting }}
              disabled={submitting}
              onPress={() => choose(option.id)}
              style={({ pressed }) => [styles.option, selected && styles.selected,
                pressed && !submitting && styles.pressed]}>
              <View style={[styles.optionNumber, selected && styles.numberSelected]}>
                <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={[styles.optionText, optionSize]}>{option.text}</Text>
              {selected ? <Text style={styles.optionMark}>✓</Text> : null}
            </Pressable>
          </AnswerMotion>;
        })}
      </View>
      {!onActionChange ? <Pressable testID="fill-blank-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: pending === null || submitting }}
        disabled={pending === null || submitting} onPress={confirm}
        style={({ pressed }) => [styles.confirm,
          (pending === null || submitting) && styles.confirmDisabled,
          pressed && pending !== null && !submitting && styles.confirmPressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση  →</Text>
      </Pressable> : null}
    </> : <QuizReveal><QuestionFeedbackPanel testID="fill-blank-feedback"
      correct={isCorrect} explanation={question.explanation} readingSize={readingSize}
      solution={!isCorrect ? <AnswerSummaryText>{correctOption?.text}</AnswerSummaryText> : undefined}
    /></QuizReveal>}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  badge: questionCardStyles.typeBadge,
  badgeText: questionCardStyles.typeLabel,
  passage: { backgroundColor: "#20263A", padding: 10, borderRadius: 13,
    borderLeftWidth: 2, borderLeftColor: "#8276BB", marginBottom: 8 },
  sentence: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  passageText: { color: colors.text, fontSize: 18, lineHeight: 28, fontWeight: "700", flexShrink: 1 },
  slotTail: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" },
  slot: { minHeight: 36, flexShrink: 1, maxWidth: "100%", paddingHorizontal: 9, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.accent, backgroundColor: "#353052",
    borderStyle: "dashed", borderRadius: 11, justifyContent: "center" },
  slotFilled: { borderStyle: "solid" },
  slotCorrect: { borderColor: colors.success, borderStyle: "solid", backgroundColor: colors.successSurface },
  slotWrong: { borderColor: colors.error, borderStyle: "solid", backgroundColor: colors.errorSurface },
  slotText: { color: colors.accentLight, fontSize: 15, lineHeight: 22, fontWeight: "800", flexShrink: 1 },
  slotTextFilled: { color: colors.text },
  options: questionCardStyles.answers,
  option: questionCardStyles.answer,
  selected: questionCardStyles.selected,
  pressed: questionCardStyles.pressed,
  optionNumber: { height: 28, width: 28, borderRadius: 8, alignItems: "center", justifyContent: "center",
    flexShrink: 0, backgroundColor: colors.accentSurface },
  numberSelected: { backgroundColor: "#514785" },
  optionNumberText: { color: colors.text, fontWeight: "900", fontSize: 13 },
  optionText: questionCardStyles.answerText,
  optionMark: { color: colors.accentLight, fontSize: 19, fontWeight: "900" },
  confirm: questionCardStyles.confirm,
  confirmDisabled: questionCardStyles.confirmDisabled,
  confirmPressed: questionCardStyles.confirmPressed,
  confirmText: questionCardStyles.confirmText,
  feedback: questionCardStyles.feedback,
  feedbackCorrect: questionCardStyles.feedbackCorrect,
  feedbackWrong: questionCardStyles.feedbackWrong,
  feedbackTitle: { fontSize: 17, lineHeight: 24, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  solution: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "800" },
  explanation: questionCardStyles.feedbackText,
});
