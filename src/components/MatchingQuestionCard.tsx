import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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

/** A stable board uses the same number on both ends of each draft pair. */
export default function MatchingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize, onActionChange, compactAnswered = false }: Props) {
  const { fontScale } = useWindowDimensions();
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  useEffect(() => { setSelectedLeft(null); setPending({}); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const assignments = answered ? answer : pending;
  const pairs = question.content.pairs;
  const stackColumns = fontScale >= 1.3 || (readingSize ?? 18) >= 22;
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
      <View style={styles.boardHeader}>
        <Text style={styles.instruction} accessibilityLiveRegion="polite">
          {answered ? "Τα ζευγάρια σου" : selectedLeft ? "Βρες το ταίρι της" : "Διάλεξε μια έννοια"}
        </Text>
        <Text style={styles.progressCount} accessibilityLabel={`${count} από ${pairs.length} ζευγάρια`}>
          {count} / {pairs.length}
        </Text>
      </View>
      <View style={styles.board} testID="matching-board">
        <View style={[styles.column, stackColumns && styles.fullColumn]} testID="matching-concepts">
          <Text style={styles.columnTitle}>Έννοιες</Text>
          {pairs.map((pair, index) => {
            const rightId = assignments[pair.leftId];
            const linked = rightId !== undefined;
            const selected = selectedLeft === pair.leftId;
            return <AnswerMotion key={pair.leftId} active={!answered && selected} pulseKey={answered ? undefined : rightId}>
              <Pressable testID={`matching-left-${pair.leftId}`}
                accessibilityRole="button"
                accessibilityLabel={linked ? `${pair.leftLabel}, ζευγάρι με ${labelsByRight.get(rightId)}` : pair.leftLabel}
                accessibilityState={{ selected, disabled: answered }} disabled={answered}
                onPress={() => setSelectedLeft(current => current === pair.leftId ? null : pair.leftId)}
                style={({ pressed }) => [styles.tile, linked && styles.paired, selected && styles.selected,
                  pressed && styles.pressed]}>
                <Text accessible={false} style={[styles.marker, linked && styles.pairedMarker]}>{index + 1}</Text>
                <Text style={[styles.tileLabel, choiceSize]}>{pair.leftLabel}</Text>
              </Pressable>
            </AnswerMotion>;
          })}
        </View>
        <View style={[styles.column, stackColumns && styles.fullColumn]} testID="matching-options">
          <Text style={styles.columnTitle}>Επιλογές</Text>
          {rightOptions.map(pair => {
            const linkedId = Object.keys(assignments).find(leftId => assignments[leftId] === pair.rightId);
            const linked = linkedId !== undefined;
            const disabled = answered || selectedLeft === null;
            return <AnswerMotion key={pair.rightId} pulseKey={answered ? undefined : linkedId}>
              <Pressable testID={`matching-right-${pair.rightId}`}
                accessibilityRole="button"
                accessibilityLabel={linked ? `${pair.rightLabel}, ζευγάρι ${positionFor(linkedId)}` : pair.rightLabel}
                accessibilityState={{ selected: linked, disabled }} disabled={disabled}
                onPress={() => assign(pair.rightId)}
                style={({ pressed }) => [styles.tile, linked && styles.paired,
                  !disabled && !linked && styles.available, pressed && styles.pressed]}>
                <Text accessible={false} style={[styles.marker, linked && styles.pairedMarker]}>
                  {linked ? positionFor(linkedId) : "·"}
                </Text>
                <Text style={[styles.tileLabel, choiceSize]}>{pair.rightLabel}</Text>
              </Pressable>
            </AnswerMotion>;
          })}
        </View>
      </View>
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
  boardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: 8, marginBottom: 10, flexWrap: "wrap" },
  instruction: { color: colors.textBody, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  progressCount: { color: colors.accentLight, fontWeight: "900", fontSize: 12 },
  board: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  column: { flexBasis: 130, flexGrow: 1, maxWidth: "100%", gap: 6 },
  fullColumn: { flexBasis: "100%" },
  columnTitle: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  tile: { ...questionCardStyles.answer, minHeight: 54, gap: 6, paddingHorizontal: 7 },
  available: { borderColor: colors.borderStrong },
  paired: { backgroundColor: "#23363D", borderColor: "#46626A" },
  selected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  marker: { color: colors.accentLight, backgroundColor: colors.accentSurface, fontSize: 12,
    fontWeight: "900", minWidth: 21, textAlign: "center", paddingHorizontal: 3, paddingVertical: 3, borderRadius: 6 },
  pairedMarker: { color: "#B5DED9", backgroundColor: "#34545B" },
  tileLabel: { ...questionCardStyles.answerText, fontSize: 14, lineHeight: 20, minWidth: 0 },
  disabled: questionCardStyles.confirmDisabled,
});
