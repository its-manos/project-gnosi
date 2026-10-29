import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = { onBack?: () => void; backLabel?: string };

export default function AppHeader({ onBack, backLabel = "ΠΙΣΩ" }: Props) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable style={styles.side} onPress={onBack} accessibilityRole="button">
          <Text style={styles.backText}>‹ {backLabel}</Text>
        </Pressable>
      ) : <View style={styles.side} />}
      <Text style={styles.logo}>ΓΝΩΣΗ</Text>
      <View style={[styles.side, styles.right]}><Text style={styles.sparkle}>✦</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 30, minHeight: 36 },
  side: { width: 82, minHeight: 30, justifyContent: "center" },
  right: { alignItems: "flex-end" },
  backText: { color: "#B6B0FF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  logo: { color: colors.accentLight, fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  sparkle: { color: colors.accentLight, fontSize: 23 },
});
