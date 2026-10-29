import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
};

export default function ActionButton({ label, onPress, secondary = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, secondary && styles.secondary]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    backgroundColor: colors.accent,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 16,
  },
  secondary: {
    backgroundColor: "#22263A",
    borderWidth: 1,
    borderColor: "#3A3E55",
  },
  label: { color: "#171426", fontSize: 14, fontWeight: "900", textAlign: "center" },
  secondaryLabel: { color: "#E4E3F0" },
});
