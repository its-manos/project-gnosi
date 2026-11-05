import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { colors } from "../theme";
import type { ReportTarget } from "../utils/contentReports";
import ReportContentButton from "./ReportContentButton";
import QuizReveal from "./QuizReveal";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  id: string;
  question: string;
  answers: readonly string[];
  correctIndex: number;
  explanation: string;
  questionNumber: number;
  /** Committed answer from lesson/daily/preview store; never a draft. */
  answer?: number;
  onConfirm: (index: number) => void | Promise<unknown>;
  readingSize?: number;
  badgeLabel?: string;
  showFeedback?: boolean;
  combo?: number;
  reportTarget?: ReportTarget;
  testID?: string;
  testPrefix?: string;
};

/** A single presentation and two-phase interaction for every old-style choice.
 * Tapping only changes local UI; the parent receives an answer on confirmation.
 * No progress, XP, sound, or persistence side-effects live in this component.
 */
export default function SingleChoiceQuestionCard({
  id, question, answers, correctIndex, explanation, questionNumber, answer,
  onConfirm, readingSize, badgeLabel = "ΜΙΑ ΕΠΙΛΟΓΗ", showFeedback = true,
  combo = 0, reportTarget, testID = "choice-question-card", testPrefix = "single-choice",
}: Props) {
  const [draft, setDraft] = useState<number | null>(null);
  const draftRef = useRef<number | null>(null);
  const pendingSubmit = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    draftRef.current = null;
    pendingSubmit.current = false;
    setDraft(null);
    setSubmitting(false);
  }, [id]);
  const answered = answer !== undefined;
  const selected = answered ? answer : draft;
  const isCorrect = answered && answer === correctIndex;
  const scaledQuestion = readingSize !== undefined && readingSize !== 18
    ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined;
  const scaledAnswer = readingSize !== undefined && readingSize !== 18
    ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.5) } : undefined;

  function choose(index: number) {
    if (answered || pendingSubmit.current) return;
    draftRef.current = index;
    setDraft(index);
  }
  function confirm() {
    const index = draftRef.current;
    if (answered || pendingSubmit.current || index === null || index < 0 || index >= answers.length) return;
    pendingSubmit.current = true;
    setSubmitting(true);
    // A rejected asynchronous write may be retried; a successful confirmation
    // stays locked while React receives the parent-owned committed answer.
    try {
      void Promise.resolve(onConfirm(index)).catch(() => {
        pendingSubmit.current = false;
        setSubmitting(false);
      });
    } catch {
      pendingSubmit.current = false;
      setSubmitting(false);
    }
  }

  return <View style={styles.card} testID={testID}>
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>✦  {badgeLabel}</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text accessibilityRole="header" style={[styles.question, scaledQuestion]}>{question}</Text>
    <Text style={styles.hint}>Διάλεξε μία απάντηση και επιβεβαίωσέ την.</Text>
    <View style={styles.answers}>
      {answers.map((label, index) => {
        const chosen = selected === index;
        const correctOption = answered && index === correctIndex;
        const wrongSelection = answered && chosen && !isCorrect;
        return <AnswerMotion key={index} active={correctOption || wrongSelection}>
          <Pressable
            testID={`${testPrefix}-option-${index}`}
            accessibilityRole="radio"
            accessibilityLabel={`${String.fromCharCode(65 + index)}. ${label}`}
            accessibilityState={{ selected: chosen, disabled: answered || submitting }}
            disabled={answered || submitting}
            onPress={() => choose(index)}
            style={({ pressed }) => [styles.answer, chosen && !answered && styles.selected,
              pressed && !answered && !submitting && styles.pressed,
              correctOption && styles.answerCorrect, wrongSelection && styles.answerWrong]}
          >
            <View style={[styles.letterBox, chosen && !answered && styles.letterSelected,
              correctOption && styles.letterCorrect, wrongSelection && styles.letterWrong]}>
              <Text style={[styles.letter, correctOption && styles.correctText, wrongSelection && styles.wrongText]}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text style={[styles.answerText, scaledAnswer]}>{label}</Text>
            {correctOption ? <Text style={styles.correctIcon}>✓</Text> : null}
            {wrongSelection ? <Text style={styles.wrongIcon}>×</Text> : null}
          </Pressable>
        </AnswerMotion>;
      })}
    </View>
    {!answered ? <Pressable
      testID={`${testPrefix}-confirm`}
      accessibilityRole="button"
      accessibilityState={{ disabled: draft === null || submitting }}
      disabled={draft === null || submitting}
      onPress={confirm}
      style={({ pressed }) => [styles.confirm, (draft === null || submitting) && styles.confirmDisabled,
        pressed && draft !== null && !submitting && styles.confirmPressed]}>
      <Text style={styles.confirmText}>Επιβεβαίωση απάντησης  →</Text>
    </Pressable> : null}
    {answered && showFeedback ? <QuizReveal><View testID={`${testPrefix}-feedback`}
      accessibilityLiveRegion="polite"
      style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <View style={styles.feedbackTop}>
        <Text style={[styles.feedbackHeading, isCorrect ? styles.correctText : styles.wrongText]}>
          {isCorrect ? "✓  Σωστά!" : "Η σωστή απάντηση"}
        </Text>
        {combo > 1 ? <View style={styles.comboBadge}><Text style={styles.comboText}>✦  ΣΕΡΙ {combo}</Text></View> : null}
      </View>
      {!isCorrect ? <Text testID={`${testPrefix}-correction`} style={[styles.correction, scaledAnswer]}>
        {answers[correctIndex]}
      </Text> : null}
      <Text style={styles.explanationLabel}>ΕΞΗΓΗΣΗ</Text>
      <Text style={[styles.feedbackText, scaledAnswer]}>{explanation}</Text>
    </View></QuizReveal> : null}
    {reportTarget ? <ReportContentButton target={reportTarget} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  ...questionCardStyles,
  letterBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSurface,
    alignItems: "center", justifyContent: "center", flexShrink: 0 },
  letterSelected: { backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.accent },
  letterCorrect: { backgroundColor: colors.successSurface, borderWidth: 1, borderColor: colors.success },
  letterWrong: { backgroundColor: colors.errorSurface, borderWidth: 1, borderColor: colors.error },
  letter: { color: colors.accentLight, fontSize: 13, fontWeight: "900" },
  correctIcon: { color: colors.success, fontSize: 20, fontWeight: "900" },
  wrongIcon: { color: colors.error, fontSize: 20, fontWeight: "900" },
  feedbackTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  feedbackHeading: { fontSize: 17, fontWeight: "900" },
  correctText: { color: colors.success },
  wrongText: { color: colors.error },
  comboBadge: { backgroundColor: colors.accentSurface, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  comboText: { color: colors.accentLight, fontSize: 10, fontWeight: "900" },
  correction: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: "800" },
  explanationLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
});
