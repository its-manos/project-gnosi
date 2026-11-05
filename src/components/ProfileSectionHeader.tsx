import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { colors } from "../theme";

// Keep the profile-family screens on the same safe-area-relative grid.
// AppNavigator already owns the top/side safe areas; do not inset twice.
export const profileSectionLayout = {
  horizontal: 18,
  top: 8,
  below: 13,
} as const;

type Props = {
  eyebrow: string;
  title: string;
  actionLabel: string;
  actionAccessibilityLabel: string;
  onAction: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function ProfileSectionHeader({
  eyebrow, title, actionLabel, actionAccessibilityLabel, onAction, style,
}: Props) {
  return (
    <View testID="profile-section-header" style={[styles.header, style]}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.84}>{title}</Text>
      </View>
      <Pressable onPress={onAction} accessibilityRole="button"
        accessibilityLabel={actionAccessibilityLabel} hitSlop={4}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
        <Text style={styles.actionText} numberOfLines={1}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  eyebrow: { color: "#AD9FEB", fontSize: 10, lineHeight: 15, letterSpacing: 1.1, fontWeight: "900" },
  title: { color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: "900", flexShrink: 1 },
  action: { minHeight: 44, paddingHorizontal: 11, borderRadius: 13, justifyContent: "center",
    backgroundColor: "#1D2538", borderColor: "#3D405C", borderWidth: 1 },
  actionPressed: { backgroundColor: "#2D304A" },
  actionText: { color: "#C2B4FF", fontSize: 12, fontWeight: "800" },
});
