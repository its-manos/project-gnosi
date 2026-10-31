import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  index: number;
  selected: boolean;
  correct: boolean;
  locked: boolean;
  onPress: () => void;
};

export default function AnswerOption({ label, index, selected, correct, locked, onPress }: Props) {
  const answerIsCorrect = locked && correct;
  const answerIsWrong = locked && selected && !correct;
  return (
    <Pressable
      style={({ pressed }) => [styles.button, answerIsCorrect && styles.correct, answerIsWrong && styles.wrong, pressed && !locked && styles.pressed]}
      onPress={onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
    >
      <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
      <Text style={styles.label}>{label}</Text>
      {answerIsCorrect && <Text style={styles.icon}>✓</Text>}
      {answerIsWrong && <Text style={styles.icon}>✕</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  button: { minHeight: 61, flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 13, borderWidth: 1, borderColor: "#30354A" },
  correct: { backgroundColor: colors.successSurface, borderColor: colors.success },
  wrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  letter: { color: "#AEA3FF", fontSize: 13, fontWeight: "900", width: 29, flexShrink: 0 },
  label: { color: "#ECECF5", fontSize: 14, lineHeight: 21, fontWeight: "600", flex: 1 },
  icon: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginLeft: 8, flexShrink: 0 },
});
