import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { SpotMistakeQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import QuestionFeedbackPanel, { AnswerSummaryText } from "./QuestionFeedbackPanel";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: SpotMistakeQuestion;
  questionNumber: number;
  /** Answer accepted by the parent, not the user's unconfirmed selection. */
  answer?: string;
  onSubmit: (optionId: string) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Locate the false statement; selecting it only changes a local draft.
 * Scoring, sounds and saved progress happen on explicit confirmation only. */
export default function SpotMistakeQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange, compactAnswered = false }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const draftRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  useEffect(() => {
    setPending(null);
    draftRef.current = null;
    submittingRef.current = false;
    setSubmitting(false);
  }, [question.id, question.version]);

  const answered = answer !== undefined;
  const selectedId = answered ? answer : pending;
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const falseOption = question.content.options.find(option => option.id === question.content.incorrectOptionId);
  const questionSize = readingSize !== undefined && readingSize !== 18
    ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined;
  const optionSize = readingSize !== undefined && readingSize !== 18
    ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.5) } : undefined;

  function select(optionId: string) {
    if (answered || submittingRef.current) return;
    draftRef.current = optionId;
    setPending(optionId);
  }
  function confirm() {
    const optionId = draftRef.current;
    if (answered || submittingRef.current || optionId === null ||
      !question.content.options.some(option => option.id === optionId)) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      void Promise.resolve(onSubmit(optionId)).catch(() => {
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

  return <View testID="spot-mistake-card" style={styles.card}>
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>⌕  ΒΡΕΣ ΤΟ ΛΑΘΟΣ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text testID="spot-mistake-subject" accessibilityRole="header" style={[styles.question, questionSize]}>
      {question.prompt}{question.prompt.trim().endsWith(":") ? "" : ":"}
    </Text>
    {!answered ? <Text style={styles.hint}>Ποια πρόταση είναι λανθασμένη;</Text> : null}
    {(!answered || !compactAnswered) ? <View style={styles.answers}>
      {question.content.options.map((option, index) => {
        const selected = selectedId === option.id;
        const isFalseStatement = answered && option.id === question.content.incorrectOptionId;
        const wrongSelection = answered && selected && !isFalseStatement;
        return <AnswerMotion key={option.id} active={selected || isFalseStatement || wrongSelection}>
          <Pressable testID={`spot-mistake-option-${option.id}`}
            accessibilityRole="radio"
            accessibilityLabel={`${String.fromCharCode(65 + index)}. ${option.text}`}
            accessibilityState={{ selected, disabled: answered || submitting }}
            disabled={answered || submitting}
            onPress={() => select(option.id)}
            style={({ pressed }) => [styles.answer, selected && !answered && styles.selected,
              isFalseStatement && styles.answerCorrect, wrongSelection && styles.answerWrong,
              pressed && !answered && !submitting && styles.pressed]}>
            <View style={[styles.letterCircle, isFalseStatement && styles.circleCorrect,
              wrongSelection && styles.circleWrong]}>
              <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text style={[styles.answerText, optionSize]}>{option.text}</Text>
            {isFalseStatement ? <Text style={styles.correctIcon}>✓</Text> : null}
            {wrongSelection ? <Text style={styles.wrongIcon}>×</Text> : null}
          </Pressable>
        </AnswerMotion>;
      })}
    </View> : null}
    {!answered && !onActionChange ? <>
      <Pressable testID="spot-mistake-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: pending === null || submitting }}
        disabled={pending === null || submitting}
        onPress={confirm}
        style={({ pressed }) => [styles.confirm,
          (pending === null || submitting) && styles.confirmDisabled,
          pressed && pending !== null && !submitting && styles.confirmPressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση απάντησης  →</Text>
      </Pressable>
    </> : null}
    {answered ? <QuizReveal><QuestionFeedbackPanel testID="spot-mistake-feedback"
      correct={isCorrect} explanation={question.explanation} readingSize={readingSize}
      selection={compactAnswered ? <AnswerSummaryText>{question.content.options.find(o => o.id === answer)?.text}</AnswerSummaryText> : undefined}
      solution={!isCorrect ? <AnswerSummaryText>{falseOption?.text}</AnswerSummaryText> : undefined}>
      <Text style={styles.solution}>{question.content.correction}</Text>
    </QuestionFeedbackPanel></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  eyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  highlight: { color: colors.accentLight, fontWeight: "800" },
  letterCircle: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSurface,
    flexShrink: 0, justifyContent: "center", alignItems: "center" },
  circleCorrect: { backgroundColor: "#205143" },
  circleWrong: { backgroundColor: "#59323B" },
  letter: { color: colors.accentLight, fontSize: 13, fontWeight: "900" },
  correctIcon: { color: colors.success, fontSize: 20, fontWeight: "900" },
  wrongIcon: { color: colors.error, fontSize: 20, fontWeight: "900" },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 13 },
  feedbackTitle: { fontSize: 16, lineHeight: 23, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  falseStatement: { color: colors.text, fontSize: 14, lineHeight: 23, fontWeight: "700" },
  feedbackLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 0.5, marginTop: 4 },
  solution: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "800" },
});
