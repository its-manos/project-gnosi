import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { FillBlankQuestion } from "../quiz/types";
import { colors } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: FillBlankQuestion;
  questionNumber: number;
  answer?: string;
  onSubmit: (optionId: string) => void;
  readingSize?: number;
};

/** A word bank fills a visible slot, with one explicit confirmation. */
export default function FillBlankQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => { setPending(null); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const selectedId = answered ? answer : pending;
  const selectedOption = question.content.options.find(option => option.id === selectedId);
  const correctOption = question.content.options.find(option => option.id === question.content.correctOptionId);
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const sentenceSize = readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined;

  function confirm() {
    if (!answered && pending !== null) onSubmit(pending);
  }

  return <View style={styles.card} testID="fill-blank-card">
    <View style={styles.topLine}>
      <View style={styles.badge}><Text style={styles.badgeText}>✎  ΣΥΜΠΛΗΡΩΣΕ ΤΟ ΚΕΝΟ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={[styles.prompt, sentenceSize]}>{question.prompt}</Text>
    <Text style={styles.hint}>Διάλεξε μία λέξη ή φράση από τις επιλογές για να ολοκληρώσεις την πρόταση.</Text>
    <View style={styles.passage}>
      <Text style={styles.passageHeading}>Η ΠΡΟΤΑΣΗ</Text>
      <View style={styles.sentence}>
        {question.content.before.trim() ? <Text style={[styles.passageText, sentenceSize]}>{question.content.before.trim()}</Text> : null}
        <View testID="fill-blank-slot" style={[styles.slot,
          answered && (isCorrect ? styles.slotCorrect : styles.slotWrong),
          !answered && pending !== null && styles.slotFilled]}>
          <Text style={[styles.slotText, selectedOption && styles.slotTextFilled]}>
            {selectedOption ? selectedOption.text : "Επίλεξε απάντηση…"}
          </Text>
        </View>
        {question.content.after.trim() ? <Text style={[styles.passageText, sentenceSize]}>{question.content.after.trim()}</Text> : null}
      </View>
    </View>
    <View style={styles.wordBankHeading}>
      <Text style={styles.inputLabel}>ΕΠΙΛΕΞΕ ΓΙΑ ΤΟ ΚΕΝΟ</Text>
      <Text style={styles.wordBankCounter}>{question.content.options.length} ΕΠΙΛΟΓΕΣ</Text>
    </View>
    <View style={styles.options}>
      {question.content.options.map((option, index) => {
        const selected = selectedId === option.id;
        const isRightOption = answered && option.id === question.content.correctOptionId;
        const wrongSelection = answered && selected && !isRightOption;
        return <AnswerMotion key={option.id} active={isRightOption || wrongSelection}>
          <Pressable testID={`fill-blank-option-${option.id}`}
            accessibilityRole="button"
            accessibilityLabel={option.text}
            accessibilityState={{ selected, disabled: answered }}
            disabled={answered}
            onPress={() => setPending(option.id)}
            style={({ pressed }) => [styles.option, selected && styles.selected,
              isRightOption && styles.optionCorrect, wrongSelection && styles.optionWrong,
              pressed && !answered && styles.pressed]}>
            <View style={[styles.optionNumber, selected && styles.numberSelected]}>
              <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text style={styles.optionText}>{option.text}</Text>
            <Text style={[styles.optionMark, isRightOption && styles.markCorrect,
              wrongSelection && styles.markWrong]}>{isRightOption ? "✓" : wrongSelection ? "×" : selected ? "●" : "○"}</Text>
          </Pressable>
        </AnswerMotion>;
      })}
    </View>
    {!answered ? <>
      <Text style={styles.footHint}>Μπορείς να αλλάξεις την επιλογή σου πριν επιβεβαιώσεις.</Text>
      <Pressable testID="fill-blank-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: pending === null }} disabled={pending === null}
        onPress={confirm}
        style={({ pressed }) => [styles.confirm, pending === null && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση απάντησης  →</Text>
      </Pressable>
    </> : null}
    {answered ? <QuizReveal><View testID="fill-blank-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.badText]}>
        {isCorrect ? "✓  Συμπλήρωσες σωστά το κενό!" : "↗  Η σωστή συμπλήρωση"}
      </Text>
      {!isCorrect ? <View style={styles.solutionBox}>
        <Text style={styles.solutionLabel}>ΣΩΣΤΗ ΕΠΙΛΟΓΗ</Text>
        <Text style={styles.solution}>{correctOption?.text}</Text>
      </View> : null}
      <Text style={styles.explanation}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: 22, padding: 18, marginTop: 12, marginBottom: 22 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 18 },
  badge: { backgroundColor: colors.accentSurface, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  badgeText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  prompt: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800", marginBottom: 9 },
  hint: { color: colors.textBody, fontSize: 13, lineHeight: 21, marginBottom: 17 },
  passage: { backgroundColor: colors.surfaceRaised, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, gap: 11, marginBottom: 23 },
  passageHeading: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.8, fontWeight: "900" },
  sentence: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 },
  passageText: { color: colors.text, fontSize: 17, lineHeight: 27, fontWeight: "700", flexShrink: 1 },
  slot: { minHeight: 44, maxWidth: "100%", paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSurface,
    borderStyle: "dashed", borderRadius: 10, justifyContent: "center" },
  slotFilled: { borderStyle: "solid" },
  slotCorrect: { borderColor: colors.success, borderStyle: "solid", backgroundColor: colors.successSurface },
  slotWrong: { borderColor: colors.error, borderStyle: "solid", backgroundColor: colors.errorSurface },
  slotText: { color: colors.accentLight, fontSize: 14, lineHeight: 21, fontWeight: "700", flexShrink: 1 },
  slotTextFilled: { color: colors.text, fontWeight: "800" },
  wordBankHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 11 },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  wordBankCounter: { color: colors.accentLight, fontSize: 10, fontWeight: "800" },
  options: { gap: 10 },
  option: { minHeight: 59, flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, borderRadius: 13 },
  selected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successSurface },
  optionWrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  pressed: { opacity: 0.8 },
  optionNumber: { height: 28, width: 28, borderRadius: 8, alignItems: "center", justifyContent: "center",
    flexShrink: 0, backgroundColor: colors.accentSurface },
  numberSelected: { backgroundColor: "#504782" },
  optionNumberText: { color: colors.text, fontWeight: "900", fontSize: 13 },
  optionText: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "600" },
  optionMark: { color: colors.textMuted, fontSize: 18, fontWeight: "900" },
  markCorrect: { color: colors.success },
  markWrong: { color: colors.error },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 13 },
  confirm: { backgroundColor: colors.accent, marginTop: 18, borderRadius: 14,
    minHeight: 54, alignItems: "center", justifyContent: "center", padding: 12 },
  disabled: { opacity: 0.38 },
  confirmText: { color: colors.background, fontWeight: "900", fontSize: 15 },
  feedback: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 18, gap: 10 },
  feedbackCorrect: { borderColor: colors.success, backgroundColor: colors.successSurface },
  feedbackWrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  feedbackTitle: { fontSize: 16, lineHeight: 23, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  solutionBox: { borderTopWidth: 1, borderColor: colors.borderStrong, paddingTop: 10, gap: 6 },
  solutionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  solution: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "800" },
  explanation: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
});
