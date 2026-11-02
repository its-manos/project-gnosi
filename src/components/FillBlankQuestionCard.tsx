import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { evaluateAnswer } from "../quiz/engine";
import type { FillBlankQuestion } from "../quiz/types";
import { colors } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: FillBlankQuestion;
  questionNumber: number;
  answer?: string;
  onSubmit: (value: string) => void;
  readingSize?: number;
};

export default function FillBlankQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [draft, setDraft] = useState("");
  useEffect(() => { setDraft(""); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const isCorrect = answered && evaluateAnswer(question, answer).correct;
  const ready = draft.trim().length > 0;
  const shown = answered ? answer : draft;
  const labelStyle = readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined;

  function confirm() {
    if (!answered && ready) onSubmit(draft.trim());
  }

  return <View style={styles.card} testID="fill-blank-card">
    <View style={styles.topLine}>
      <View style={styles.badge}><Text style={styles.badgeText}>✎  ΣΥΜΠΛΗΡΩΣΕ ΤΟ ΚΕΝΟ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={[styles.prompt, labelStyle]}>{question.prompt}</Text>
    <Text style={styles.hint}>Πληκτρολόγησε μια σύντομη απάντηση χωρίς να επιλέξεις από έτοιμες λύσεις.</Text>
    <View style={styles.passage}>
      <Text style={[styles.passageText, labelStyle]}>{question.content.before}</Text>
      <View style={[styles.blank, answered && (isCorrect ? styles.blankCorrect : styles.blankWrong)]}>
        <Text style={styles.blankText}>{answered ? answer : "________________"}</Text>
      </View>
      {question.content.after.trim() ? <Text style={[styles.passageText, labelStyle]}>{question.content.after}</Text> : null}
    </View>
    <Text style={styles.inputLabel}>Η ΑΠΑΝΤΗΣΗ ΣΟΥ</Text>
    <TextInput
      testID="fill-blank-input"
      accessibilityLabel="Συμπλήρωσε το κενό"
      value={shown}
      editable={!answered}
      maxLength={80}
      autoCapitalize="sentences"
      autoCorrect={false}
      spellCheck={false}
      returnKeyType="done"
      onChangeText={setDraft}
      onSubmitEditing={confirm}
      placeholder="Γράψε εδώ…"
      placeholderTextColor={colors.textMuted}
      style={[styles.input, answered && (isCorrect ? styles.inputCorrect : styles.inputWrong)]}
    />
    <Text style={styles.footHint}>Δεν μετρούν οι διαφορές σε κεφαλαία ή κενά
      {question.content.accentSensitive ? "." : " και τόνους."} Δεν διορθώνονται αυτόματα λάθος λέξεις.</Text>
    {!answered ? <Pressable testID="fill-blank-confirm" accessibilityRole="button"
      accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={confirm}
      style={({ pressed }) => [styles.confirm, !ready && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.confirmText}>Έλεγχος απάντησης  →</Text>
    </Pressable> : null}
    {answered ? <QuizReveal><View testID="fill-blank-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.badText]}>
        {isCorrect ? "✓  Σωστή απάντηση!" : "↗  Η σωστή συμπλήρωση"}
      </Text>
      {!isCorrect ? <View style={styles.solutionBox}>
        <Text style={styles.solutionLabel}>ΣΩΣΤΗ ΑΠΑΝΤΗΣΗ</Text>
        <Text style={styles.solution}>{question.content.displayAnswer}</Text>
      </View> : null}
      <Text style={styles.explanation}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 22,
    padding: 18, marginTop: 12, marginBottom: 22 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 18 },
  badge: { backgroundColor: colors.accentSurface, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  badgeText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  prompt: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800", marginBottom: 9 },
  hint: { color: colors.textBody, fontSize: 13, lineHeight: 21, marginBottom: 18 },
  passage: { backgroundColor: colors.surfaceRaised, paddingHorizontal: 16, paddingVertical: 18,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 12, marginBottom: 22 },
  passageText: { color: colors.text, fontSize: 18, lineHeight: 28, fontWeight: "700" },
  blank: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 12,
    borderBottomWidth: 2, borderBottomColor: colors.accent, backgroundColor: colors.accentSurface, borderRadius: 8 },
  blankText: { color: colors.accentLight, fontSize: 16, fontWeight: "800" },
  blankCorrect: { backgroundColor: colors.successSurface, borderBottomColor: colors.success },
  blankWrong: { backgroundColor: colors.errorSurface, borderBottomColor: colors.error },
  inputLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 0.8, marginBottom: 10 },
  input: { minHeight: 56, borderRadius: 13, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised, paddingVertical: 13, paddingHorizontal: 15,
    fontSize: 16, fontWeight: "700", color: colors.text },
  inputCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  inputWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 13 },
  confirm: { backgroundColor: colors.accent, marginTop: 20, borderRadius: 14, minHeight: 54,
    alignItems: "center", justifyContent: "center", padding: 12 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.8 },
  confirmText: { color: colors.background, fontSize: 15, fontWeight: "900" },
  feedback: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 18, gap: 9 },
  feedbackCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  feedbackWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  feedbackTitle: { fontSize: 17, fontWeight: "900" },
  goodText: { color: colors.success },
  badText: { color: colors.error },
  solutionBox: { borderTopWidth: 1, borderColor: colors.borderStrong, paddingTop: 10, gap: 6 },
  solutionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "900" },
  solution: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "800" },
  explanation: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
});
