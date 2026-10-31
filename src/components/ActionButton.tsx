import { Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { colors } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
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
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: "#171426",
    fontSize: 14,
    lineHeight: 21,
    flexShrink: 1,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryLabel: {
    color: "#E4E3F0",
  },
});
