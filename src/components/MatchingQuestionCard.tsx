import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateAnswer } from "../quiz/engine";
import type { MatchingQuestion } from "../quiz/types";
import { colors } from "../theme";
import QuizReveal from "./QuizReveal";
import { questionCardStyles } from "./questionCardStyles";

type Props = {
  question: MatchingQuestion;
  questionNumber: number;
  answer?: Readonly<Record<string, string>>;
  onSubmit: (pairs: Record<string, string>) => void;
  readingSize?: number;
};

/** Full-width two-stage pairing remains readable with long Greek labels. */
export default function MatchingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  useEffect(() => { setSelectedLeft(null); setPending({}); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const assignments = answered ? answer : pending;
  const pairs = question.content.pairs;
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

  return <View style={styles.card} testID="matching-card">
    <View style={styles.topLine}>
      <View style={styles.typeBadge}><Text style={styles.typeLabel}>⇄  ΑΝΤΙΣΤΟΙΧΙΣΗ</Text></View>
      <Text style={styles.counter}>{String(questionNumber).padStart(2, "0")}</Text>
    </View>
    <Text style={[styles.question, readingSize ? { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.5) } : undefined]}>{question.prompt}</Text>
    <Text style={styles.hint}>Επίλεξε πρώτα μια έννοια και μετά τη σχετική περιγραφή. Μπορείς να αλλάξεις οποιοδήποτε ζευγάρι.</Text>
    <View style={styles.progressLine}>
      <Text style={styles.progressLabel}>ΣΥΝΔΕΔΕΜΕΝΑ ΖΕΥΓΑΡΙΑ</Text>
      <Text style={styles.progressCount}>{count} / {pairs.length}</Text>
    </View>
    <View style={styles.track}><View style={[styles.fill, { width: `${pairs.length ? count / pairs.length * 100 : 0}%` }]} /></View>
    <View style={styles.stepTitle}>
      <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
      <Text style={styles.stepHeading}>Διάλεξε έννοια</Text>
      <Text style={styles.stepMeta}>{selectedLeft ? "ΕΠΙΛΕΧΘΗΚΕ" : "ΠΑΤΗΣΕ ΓΙΑ ΕΠΙΛΟΓΗ"}</Text>
    </View>
    <View style={styles.options}>
      {pairs.map(pair => {
        const active = selectedLeft === pair.leftId;
        const rightId = assignments[pair.leftId];
        const linked = rightId !== undefined;
        return <Pressable key={pair.leftId} testID={`matching-left-${pair.leftId}`}
          accessibilityRole="button"
          accessibilityLabel={`${pair.leftLabel}, ${linked ? "αντιστοιχισμένο με " + labelsByRight.get(rightId) : "χωρίς αντιστοίχιση"}`}
          accessibilityState={{ selected: active, disabled: answered }} disabled={answered}
          onPress={() => setSelectedLeft(pair.leftId)}
          style={({ pressed }) => [styles.choice, active && styles.active, linked && !active && styles.linked,
            pressed && !answered && styles.pressed]}>
          <View style={[styles.number, active && styles.numberActive, linked && !active && styles.numberLinked]}>
            <Text style={styles.numberText}>{positionFor(pair.leftId)}</Text>
          </View>
          <View style={styles.choiceContent}>
            <Text style={styles.choiceText}>{pair.leftLabel}</Text>
            {linked ? <Text style={styles.linkedLabel} numberOfLines={2}>↳ {labelsByRight.get(rightId)}</Text> : null}
          </View>
          <Text style={[styles.choiceStatus, active && styles.statusActive]}>{active ? "●" : linked ? "✓" : "＋"}</Text>
        </Pressable>;
      })}
    </View>
    <View style={styles.stepTitle}>
      <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
      <Text style={styles.stepHeading}>Βρες το ταίρι</Text>
      <Text style={styles.stepMeta}>{selectedLeft ? "ΕΠΙΛΕΞΕ ΕΔΩ" : "ΠΡΩΤΑ ΕΝΝΟΙΑ"}</Text>
    </View>
    <View style={styles.options}>
      {rightOptions.map(pair => {
        const linkedId = Object.keys(assignments).find(leftId => assignments[leftId] === pair.rightId);
        const linked = linkedId !== undefined;
        return <Pressable key={pair.rightId} testID={`matching-right-${pair.rightId}`}
          accessibilityRole="button"
          accessibilityLabel={pair.rightLabel}
          accessibilityState={{ selected: linked, disabled: answered || selectedLeft === null }}
          disabled={answered || selectedLeft === null}
          onPress={() => assign(pair.rightId)}
          style={({ pressed }) => [styles.choice, linked && styles.linked,
            selectedLeft !== null && !answered && styles.available, pressed && styles.pressed]}>
          <Text style={styles.rightMarker}>{linked ? positionFor(linkedId) : "○"}</Text>
          <Text style={styles.choiceTextRight}>{pair.rightLabel}</Text>
          <Text style={styles.choiceStatus}>{linked ? "✓" : "↗"}</Text>
        </Pressable>;
      })}
    </View>
    {!answered ? <>
      <Text style={styles.footHint}>{ready ? "Όλα τα ζευγάρια συνδέθηκαν. Έλεγξέ τα πριν συνεχίσεις." :
        selectedLeft ? "Τώρα επίλεξε μία περιγραφή από το δεύτερο βήμα." : "Μπορείς να ξαναπατήσεις μια έννοια για να αλλάξεις το ταίρι της."}</Text>
      <Pressable testID="matching-confirm" accessibilityRole="button"
        accessibilityState={{ disabled: !ready }} disabled={!ready}
        onPress={() => { if (ready) onSubmit({ ...pending }); }}
        style={({ pressed }) => [styles.confirm, !ready && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.confirmText}>Επιβεβαίωση ζευγαριών  →</Text>
      </Pressable>
    </> : null}
    {answered ? <QuizReveal><View testID="matching-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, correct ? styles.correctTitle : styles.wrongTitle]}>
        {correct ? "✓  Σωστή αντιστοίχιση!" : "↗  Οι σωστές αντιστοιχίσεις"}
      </Text>
      {!correct ? <View style={styles.solutions}>{pairs.map(pair =>
        <Text key={pair.leftId} style={styles.solutionText}>✓  {pair.leftLabel} → {pair.rightLabel}</Text>)}</View> : null}
      <Text style={styles.feedbackText}>{question.explanation}</Text>
    </View></QuizReveal> : null}
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
  progressLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  progressCount: { color: colors.accentLight, fontWeight: "900", fontSize: 12 },
  track: { backgroundColor: colors.border, borderRadius: 5, height: 5, overflow: "hidden", marginBottom: 18 },
  fill: { height: 5, backgroundColor: colors.accent, borderRadius: 5 },
  stepTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  stepBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.accentSurface,
    justifyContent: "center", alignItems: "center" },
  stepBadgeText: { color: colors.accentLight, fontSize: 12, fontWeight: "900" },
  stepHeading: { color: colors.text, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  stepMeta: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.4, marginLeft: "auto" },
  options: { gap: 9, marginBottom: 18 },
  choice: { minHeight: 63, flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: colors.surfaceRaised, borderRadius: 13, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 12 },
  available: { borderColor: colors.borderStrong },
  active: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  linked: { borderColor: "#65648A", backgroundColor: "#24243A" },
  pressed: questionCardStyles.pressed,
  number: { width: 29, height: 29, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accentSurface, borderRadius: 9, flexShrink: 0 },
  numberActive: { backgroundColor: "#504782" },
  numberLinked: { backgroundColor: "#25433D" },
  numberText: { color: colors.text, fontWeight: "900", fontSize: 13 },
  choiceContent: { flex: 1, minWidth: 0, gap: 4 },
  choiceText: { color: colors.text, fontWeight: "700", fontSize: 14, lineHeight: 20 },
  linkedLabel: { color: colors.accentLight, fontSize: 12, lineHeight: 18 },
  choiceTextRight: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  rightMarker: { color: colors.accentLight, fontSize: 16, fontWeight: "900", width: 29, textAlign: "center" },
  choiceStatus: { color: colors.textMuted, fontSize: 19, fontWeight: "900" },
  statusActive: { color: colors.accentLight },
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
