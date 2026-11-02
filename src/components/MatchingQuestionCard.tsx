import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateAnswer } from "../quiz/engine";
import type { MatchingQuestion } from "../quiz/types";
import { colors, reading } from "../theme";
import QuizReveal from "./QuizReveal";

type Props = {
  question: MatchingQuestion;
  questionNumber: number;
  answer?: Readonly<Record<string, string>>;
  onSubmit: (pairs: Record<string, string>) => void;
  readingSize?: number;
};

/** Accessible two-step pairing. Every right choice can be assigned once. */
export default function MatchingQuestionCard({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  useEffect(() => { setSelectedLeft(null); setPending({}); }, [question.id, question.version]);
  const answered = answer !== undefined;
  const assignments = answered ? answer : pending;
  const pairs = question.content.pairs;
  const rightOptions = [...pairs].reverse();
  const ready = pairs.every(pair => Object.prototype.hasOwnProperty.call(assignments, pair.leftId));
  const correct = answered && evaluateAnswer(question, answer).correct;

  function assign(rightId: string) {
    if (answered || selectedLeft === null) return;
    setPending(previous => {
      const next: Record<string, string> = {};
      for (const [leftId, id] of Object.entries(previous)) {
        if (id !== rightId && leftId !== selectedLeft) next[leftId] = id;
      }
      next[selectedLeft] = rightId;
      return next;
    });
    setSelectedLeft(null);
  }

  const positionFor = (leftId: string) => pairs.findIndex(pair => pair.leftId === leftId) + 1;
  return <View style={styles.card} testID="matching-card">
    <View style={styles.topLine}>
      <Text style={styles.eyebrow}>ΑΝΤΙΣΤΟΙΧΙΣΕ ΤΑ ΖΕΥΓΑΡΙΑ</Text>
      <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
    </View>
    <Text style={[styles.question, readingSize ? { fontSize: readingSize } : undefined]}>{question.prompt}</Text>
    <Text style={styles.hint}>Επίλεξε μια έννοια αριστερά και μετά τη σωστή περιγραφή δεξιά. Μπορείς να διορθώσεις τις αντιστοιχίσεις πριν επιβεβαιώσεις.</Text>
    <View style={styles.columns}>
      <View style={styles.column}>
        <Text style={styles.columnTitle}>ΕΝΝΟΙΑ</Text>
        {pairs.map(pair => {
          const active = selectedLeft === pair.leftId;
          const linked = Object.prototype.hasOwnProperty.call(assignments, pair.leftId);
          return <Pressable key={pair.leftId} testID={`matching-left-${pair.leftId}`}
            accessibilityRole="button" accessibilityLabel={`${pair.leftLabel}, ${linked ? "αντιστοιχισμένο" : "χωρίς αντιστοίχιση"}`}
            accessibilityState={{ selected: active, disabled: answered }} disabled={answered}
            onPress={() => setSelectedLeft(pair.leftId)}
            style={[styles.choice, active && styles.active, linked && styles.linked]}>
            <Text style={styles.choiceText}>{pair.leftLabel}</Text>
            <Text style={styles.pairNumber}>{linked ? positionFor(pair.leftId) : "○"}</Text>
          </Pressable>;
        })}
      </View>
      <View style={styles.column}>
        <Text style={styles.columnTitle}>ΤΑΙΡΙΑΖΕΙ ΜΕ</Text>
        {rightOptions.map(pair => {
          const linkedId = Object.keys(assignments).find(leftId => assignments[leftId] === pair.rightId);
          return <Pressable key={pair.rightId} testID={`matching-right-${pair.rightId}`}
            accessibilityRole="button" accessibilityLabel={pair.rightLabel}
            accessibilityState={{ selected: Boolean(linkedId), disabled: answered || selectedLeft === null }}
            disabled={answered || selectedLeft === null}
            onPress={() => assign(pair.rightId)}
            style={[styles.choice, linkedId !== undefined && styles.linked]}>
            <Text style={styles.choiceText}>{pair.rightLabel}</Text>
            <Text style={styles.pairNumber}>{linkedId === undefined ? "○" : positionFor(linkedId)}</Text>
          </Pressable>;
        })}
      </View>
    </View>
    {!answered ? <Pressable testID="matching-confirm" accessibilityRole="button"
      accessibilityState={{ disabled: !ready }} disabled={!ready}
      onPress={() => { if (ready) onSubmit({ ...pending }); }}
      style={[styles.confirm, !ready && styles.disabled]}>
      <Text style={styles.confirmText}>Επιβεβαίωση ζευγαριών</Text>
    </Pressable> : null}
    {answered ? <QuizReveal><View testID="matching-feedback" accessibilityLiveRegion="polite"
      style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={styles.feedbackTitle}>{correct ? "Σωστά — συνέχισε!" : "Οι σωστές αντιστοιχίσεις:"}</Text>
      {!correct ? pairs.map(pair => <Text key={pair.leftId} style={styles.feedbackText}>{pair.leftLabel} → {pair.rightLabel}</Text>) : null}
      <Text style={styles.feedbackText}>{question.explanation}</Text>
    </View></QuizReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 16, marginVertical: 12, borderRadius: 19, borderWidth: 1, borderColor: reading.border, backgroundColor: reading.surface },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  eyebrow: { color: colors.accentLight, fontWeight: "900", fontSize: 10, letterSpacing: 1, flexShrink: 1 },
  counter: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  question: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: "700", marginBottom: 8 },
  hint: { color: reading.muted, fontSize: 12, lineHeight: 19, marginBottom: 16 },
  columns: { flexDirection: "row", gap: 9 },
  column: { flex: 1, minWidth: 0, gap: 8 },
  columnTitle: { color: reading.muted, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  choice: { minHeight: 70, borderColor: "#343A50", borderWidth: 1, borderRadius: 12,
    padding: 9, backgroundColor: "#242D35", justifyContent: "space-between", gap: 5 },
  active: { borderColor: colors.accentLight, backgroundColor: "#3B3940" },
  linked: { borderColor: colors.accentLight },
  choiceText: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  pairNumber: { alignSelf: "flex-end", color: colors.accentLight, fontWeight: "900", fontSize: 13 },
  confirm: { marginTop: 16, minHeight: 48, borderRadius: 12, backgroundColor: colors.accentLight,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#12181D", fontSize: 14, fontWeight: "800" },
  feedback: { marginTop: 14, padding: 12, borderRadius: 12, gap: 7 },
  feedbackCorrect: { backgroundColor: "#14352E" },
  feedbackWrong: { backgroundColor: "#302631" },
  feedbackTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  feedbackText: { color: reading.text, fontSize: 14, lineHeight: 22 },
});
