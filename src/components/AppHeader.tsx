import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { colors } from "../theme";

type Props = { onBack?: () => void; backLabel?: string; style?: StyleProp<ViewStyle> };

export default function AppHeader({ onBack, backLabel = "ΠΙΣΩ", style }: Props) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <Pressable style={styles.side} onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel === 'ΠΙΣΩ' ? 'Επιστροφή' : `Επιστροφή: ${backLabel}`} hitSlop={4}>
          <Text style={styles.backText}>‹ {backLabel}</Text>
        </Pressable>
      ) : <View style={styles.side} />}
      <Text style={styles.logo} maxFontSizeMultiplier={1.3}>ΓΝΩΣΗ</Text>
      <View style={[styles.side, styles.right]}><Text style={styles.sparkle}>✦</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22, minHeight: 44 },
  side: { flex: 1, minWidth: 64, minHeight: 44, justifyContent: "center" },
  right: { alignItems: "flex-end" },
  backText: { color: "#B6B0FF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  logo: { color: colors.accentLight, fontSize: 22, fontWeight: "900", letterSpacing: 4, flexShrink: 1, textAlign: "center" },
  sparkle: { color: colors.accentLight, fontSize: 23 },
});
