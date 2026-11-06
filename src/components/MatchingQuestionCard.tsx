import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerMotion } from "../play/motion";
import { evaluateAnswer } from "../quiz/engine";
import type { MatchingQuestion } from "../quiz/types";
import { colors } from "../theme";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import QuizReveal from "./QuizReveal";
import QuestionFeedbackPanel, { AnswerSummaryText } from "./QuestionFeedbackPanel";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: MatchingQuestion;
  questionNumber?: number;
  answer?: Readonly<Record<string, string>>;
  onSubmit: (pairs: Record<string, string>) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Show one list at a time so long labels can use the full card width. */
export default function MatchingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange, compactAnswered = false }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  useEffect(() => { setSelectedLeft(null); setPending({}); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const assignments = answered ? answer : pending;
  const pairs = question.content.pairs;
  const activePair = pairs.find(pair => pair.leftId === selectedLeft);
  const choiceSize = readingSize !== undefined && readingSize !== 18
    ? { fontSize: Math.max(14, readingSize - 1), lineHeight: Math.round(readingSize * 1.5) } : undefined;
  const rightOptions = [...pairs].reverse();
  const count = pairs.filter(pair => Object.prototype.hasOwnProperty.call(assignments, pair.leftId)).length;
  const ready = count === pairs.length;
  const correct = answered && evaluateAnswer(question, answer).correct;
  const positionFor = (leftId: string) => pairs.findIndex(pair => pair.leftId === leftId) + 1;
  const labelsByRight = new Map<string, string>(pairs.map(pair => [pair.rightId, pair.rightLabel] as const));

  function assign(rightId: string) {
    if (answered || selectedLeft === null) return;
    const leftId = selectedLeft;
    setPending(previous => {
      // Reassigning a right-hand option removes any previous owner: always
      // preserve a one-to-one map for the engine.
      const next: Record<string, string> = {};
      for (const [left, right] of Object.entries(previous)) {
        if (right !== rightId && left !== leftId) next[left] = right;
      }
      next[leftId] = rightId;
      return next;
    });
    setSelectedLeft(null);
  }

  // In an immersive question stage the caller owns the footer location.
  // The card still owns its draft and confirmation guard.
  useEffect(() => {
    if (!onActionChange) return;
    onActionChange(answered ? null : { label: "Επιβεβαίωση →", disabled: !ready, onPress: () => { if (ready) onSubmit({ ...pending }); } });
    return () => onActionChange(null);
  }, [answered, pending, ready, onActionChange]);

  return <View style={styles.card} testID="matching-card">
    <View pointerEvents="none" accessible={false} style={styles.rim} />
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>⇄  ΑΝΤΙΣΤΟΙΧΙΣΗ</Text></View>
      {questionNumber !== undefined ? <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text> : null}
    </View>
    <Text accessibilityRole="header" style={[styles.question, readingSize !== undefined && readingSize !== 18 ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{question.prompt}</Text>
    {(!answered || !compactAnswered) ? <>
      <View style={styles.stepTitle}>
        <Text style={styles.stepHeading}>{answered ? "Έννοιες" : activePair ? "Βρες το ταίρι" : "Διάλεξε έννοια"}</Text>
        <Text style={styles.progressCount} accessibilityLabel={`${count} από ${pairs.length} ζευγάρια`}>{count} / {pairs.length}</Text>
      </View>
      {activePair && !answered ? <Pressable testID="matching-change-concept" accessibilityRole="button"
        accessibilityLabel={`Άλλαξε έννοια. Επιλεγμένη έννοια: ${activePair.leftLabel}`}
        onPress={() => setSelectedLeft(null)} style={({ pressed }) => [styles.activePair, pressed && styles.pressed]}>
        <Text style={styles.changeGlyph} accessible={false}>‹</Text>
        <Text style={[styles.choiceTextRight, choiceSize]}>{activePair.leftLabel}</Text>
      </Pressable> : null}
      {!activePair || answered ? <View style={styles.options}>
        {pairs.map(pair => {
          const rightId = assignments[pair.leftId];
          const linked = rightId !== undefined;
          return <AnswerMotion key={pair.leftId} active={!answered && linked}>
            <Pressable testID={`matching-left-${pair.leftId}`}
              accessibilityRole="button"
              accessibilityLabel={`${pair.leftLabel}, ${linked ? "αντιστοιχισμένο με " + labelsByRight.get(rightId) : "χωρίς αντιστοίχιση"}`}
              accessibilityState={{ disabled: answered }} disabled={answered}
              onPress={() => setSelectedLeft(pair.leftId)}
              style={({ pressed }) => [styles.choice, linked && styles.linked,
                pressed && !answered && styles.pressed]}>
              <View style={[styles.number, linked && styles.numberLinked]}>
                <Text style={styles.numberText}>{positionFor(pair.leftId)}</Text>
              </View>
              <View style={styles.choiceContent}>
                <Text style={[styles.choiceText, choiceSize]}>{pair.leftLabel}</Text>
                {linked ? <Text style={styles.linkedLabel}>↳ {labelsByRight.get(rightId)}</Text> : null}
              </View>
              <Text style={styles.choiceStatus}>{linked ? "✓" : "＋"}</Text>
            </Pressable>
          </AnswerMotion>;
        })}
      </View> : null}
      {activePair || answered ? <View style={styles.options}>
        {rightOptions.map(pair => {
          const linkedId = Object.keys(assignments).find(leftId => assignments[leftId] === pair.rightId);
          const linked = linkedId !== undefined;
          return <AnswerMotion key={pair.rightId} active={!answered && linked}>
            <Pressable testID={`matching-right-${pair.rightId}`}
              accessibilityRole="button"
              accessibilityLabel={pair.rightLabel}
              accessibilityState={{ selected: linked, disabled: answered || selectedLeft === null }}
              disabled={answered || selectedLeft === null}
              onPress={() => assign(pair.rightId)}
              style={({ pressed }) => [styles.choice, linked && styles.linked,
                pressed && styles.pressed]}>
              <Text style={styles.rightMarker}>{linked ? positionFor(linkedId) : "○"}</Text>
              <Text style={[styles.choiceTextRight, choiceSize]}>{pair.rightLabel}</Text>
              <Text style={styles.choiceStatus}>{linked ? "✓" : "↗"}</Text>
            </Pressable>
          </AnswerMotion>;
        })}
      </View> : null}
    </> : null}
    {!answered && !onActionChange ? <>
      <Pressable testID="matching-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: !ready }} disabled={!ready}
        onPress={() => { if (ready) onSubmit({ ...pending }); }}
        style={({ pressed }) => [styles.confirm, !ready && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση ζευγαριών  →</Text>
      </Pressable>
    </> : null}
    {answered ? <QuizReveal><QuestionFeedbackPanel testID="matching-feedback"
      correct={correct} explanation={question.explanation} readingSize={readingSize}
      selection={compactAnswered ? <AnswerSummaryText>{pairs.map(pair =>
        `${pair.leftLabel} → ${labelsByRight.get(assignments[pair.leftId]) ?? "—"}`).join("\n")}
      </AnswerSummaryText> : undefined}
      solution={!correct ? <AnswerSummaryText>{pairs.map(pair =>
        `${pair.leftLabel} → ${pair.rightLabel}`).join("\n")}</AnswerSummaryText> : undefined}
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
  progressCount: { color: colors.accentLight, fontWeight: "900", fontSize: 12 },
  stepTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: 8, marginBottom: 8, flexWrap: "wrap" },
  stepHeading: { color: colors.text, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  options: { ...questionCardStyles.answers, marginBottom: 6 },
  choice: questionCardStyles.answer,
  activePair: { ...questionCardStyles.answer, minHeight: 44, marginBottom: 8,
    borderColor: colors.accent, backgroundColor: colors.accentSurface },
  changeGlyph: { color: colors.accentLight, fontSize: 23, fontWeight: "800", width: 29, textAlign: "center" },
  linked: { borderColor: "#65648A", backgroundColor: "#24243A" },
  pressed: questionCardStyles.pressed,
  number: { width: 29, height: 29, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accentSurface, borderRadius: 9, flexShrink: 0 },
  numberLinked: { backgroundColor: "#25433D" },
  numberText: { color: colors.text, fontWeight: "900", fontSize: 13 },
  choiceContent: { flex: 1, minWidth: 0, gap: 4 },
  choiceText: { color: colors.text, fontWeight: "700", fontSize: 14, lineHeight: 20 },
  linkedLabel: { color: colors.accentLight, fontSize: 12, lineHeight: 18 },
  choiceTextRight: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  rightMarker: { color: colors.accentLight, fontSize: 16, fontWeight: "900", width: 29, textAlign: "center" },
  choiceStatus: { color: colors.textMuted, fontSize: 19, fontWeight: "900" },
  footHint: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  confirm: questionCardStyles.confirm,
  disabled: questionCardStyles.confirmDisabled,
  confirmText: questionCardStyles.confirmText,
  feedback: questionCardStyles.feedback,
  feedbackCorrect: questionCardStyles.feedbackCorrect,
  feedbackWrong: questionCardStyles.feedbackWrong,
  feedbackTitle: { fontSize: 17, fontWeight: "900" },
  correctTitle: { color: colors.success },
  wrongTitle: { color: colors.error },
  solutions: { borderTopWidth: 1, borderColor: colors.borderStrong, paddingTop: 10, gap: 9 },
  solutionText: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  feedbackText: questionCardStyles.feedbackText,
});
