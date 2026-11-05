import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import QuizReveal from "./QuizReveal";

/** Keep a whole first sentence when feasible. Never mutate persisted editorial copy. */
export function explanationTeaser(value: string, maxLength = 150): string {
  const text = value.trim();
  if (text.length <= maxLength) return text;
  // Avoid breaking Greek sentences partway through a clause when a short
  // first sentence is available.
  const first = text.match(/^.{35,150}?[.!;;](?=\s|$)/u)?.[0];
  if (first && first.length < text.length) return first;
  const boundary = text.lastIndexOf(" ", maxLength - 1);
  return `${text.slice(0, boundary > 55 ? boundary : maxLength).trimEnd()}…`;
}

type Props = {
  correct: boolean;
  explanation: string;
  /** Display only the meaningful answer(s), not an entire locked option grid. */
  selection?: ReactNode;
  /** Only shown when the submitted answer was incorrect. */
  solution?: ReactNode;
  /** Optional authored correction or source / reward, not another result card. */
  children?: ReactNode;
  combo?: number;
  readingSize?: number;
  testID?: string;
};

/** One focused post-answer surface for all question types. Never scores, never
 * advances automatically, and always makes the full authored explanation
 * available with a single accessible tap. */
export default function QuestionFeedbackPanel({
  correct, explanation, selection, solution, children, combo = 0, readingSize, testID,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const takeaway = explanationTeaser(explanation);
  const hasMore = takeaway !== explanation.trim();
  const textScale = readingSize !== undefined && readingSize !== 18
    ? { fontSize: Math.max(14, readingSize - 2), lineHeight: Math.round(readingSize * 1.45) }
    : undefined;
  return <View testID={testID} style={[styles.panel, correct ? styles.correct : styles.wrong]}>
    <View style={styles.top} accessible accessibilityLiveRegion="polite">
      <Text style={[styles.status, correct ? styles.correctStatus : styles.wrongStatus]}>
        {correct ? "✓  Σωστά!" : "×  Η απάντηση δεν ήταν σωστή"}
      </Text>
      {combo > 1 ? <Text style={styles.combo}>✦  ΣΕΡΙ {combo}</Text> : null}
    </View>
    {selection ? <View style={styles.detail} testID={testID ? `${testID}-selection` : undefined}>
      <Text style={styles.label}>Η ΑΠΑΝΤΗΣΗ ΣΟΥ</Text>
      {selection}
    </View> : null}
    {!correct && solution ? <View style={styles.detail} testID={testID ? `${testID}-solution` : undefined}>
      <Text style={styles.label}>ΣΩΣΤΗ ΑΠΑΝΤΗΣΗ</Text>
      {solution}
    </View> : null}
    <View style={styles.takeaway}>
      <Text style={styles.label}>ΤΙ ΚΡΑΤΑΜΕ</Text>
      <Text style={[styles.description, textScale]} testID={testID ? `${testID}-explanation` : undefined}>
        {expanded ? explanation : takeaway}
      </Text>
      {hasMore ? <Pressable testID={testID ? `${testID}-toggle` : undefined}
        accessibilityRole="button" accessibilityLabel={expanded ? "Σύμπτυξη εξήγησης" : "Διάβασε ολόκληρη την εξήγηση"}
        accessibilityState={{ expanded }} hitSlop={5}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        onPress={() => setExpanded(value => !value)}>
        <Text style={styles.toggleText}>{expanded ? "Λιγότερα  ↑" : "Πλήρης εξήγηση  ↓"}</Text>
      </Pressable> : null}
    </View>
    {children ? <View style={styles.extra}>{children}</View> : null}
  </View>;
}

export function AnswerSummaryText({ children }: { children: ReactNode }) {
  return <Text style={styles.selectionText}>{children}</Text>;
}

const styles = StyleSheet.create({
  panel: { marginTop: 10, padding: 15, borderRadius: 17, borderWidth: 1,
    backgroundColor: "#20283C", gap: 11 },
  correct: { borderColor: "#47746A", borderLeftWidth: 3, borderLeftColor: colors.success },
  wrong: { borderColor: "#705269", borderLeftWidth: 3, borderLeftColor: colors.error },
  top: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
  status: { fontSize: 16, fontWeight: "900", lineHeight: 23 },
  correctStatus: { color: colors.success },
  wrongStatus: { color: "#E8A3AE" },
  combo: { backgroundColor: "#302F4B", color: colors.accentLight, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: "900" },
  detail: { gap: 5 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.55 },
  selectionText: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "750" },
  takeaway: { gap: 5 },
  description: { color: colors.textBody, fontSize: 14, lineHeight: 22 },
  toggle: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", paddingRight: 16 },
  toggleText: { fontSize: 13, color: colors.accentLight, fontWeight: "800" },
  pressed: { opacity: 0.72 },
  extra: { gap: 8, borderTopWidth: 1, borderTopColor: "#383C56", paddingTop: 9 },
});
