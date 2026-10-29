import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Subcategory } from "../data/lessons";
import { colors } from "../theme";

type Props = { subcategory: Subcategory; lessonCount: number; onPress: () => void };

export default function SubcategoryCard({ subcategory, lessonCount, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.content}>
        <Text style={styles.title}>{subcategory.title}</Text>
        <Text style={styles.description}>{subcategory.description}</Text>
        <Text style={styles.count}>
          {lessonCount > 0 ? `${lessonCount} ${lessonCount === 1 ? "μάθημα" : "μαθήματα"}` : "Σύντομα διαθέσιμο"}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, marginBottom: 12 },
  content: { flex: 1, paddingRight: 12 },
  title: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "800", marginBottom: 6 },
  description: { color: "#A7ACC1", fontSize: 12, lineHeight: 19 },
  count: { color: "#B9AEFF", fontSize: 10, fontWeight: "800", marginTop: 14 },
  arrow: { color: colors.accentLight, fontSize: 28 },
});
