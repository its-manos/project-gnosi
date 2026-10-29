import { Pressable, StyleSheet, Text } from "react-native";
import type { Category } from "../data/lessons";
import { colors } from "../theme";

type Props = { category: Category; subcategoryCount: number; onPress: () => void };

export default function CategoryCard({ category, subcategoryCount, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={styles.title}>{category.title}</Text>
      <Text style={styles.description}>{category.description}</Text>
      <Text style={[styles.count, subcategoryCount === 0 && styles.soon]}>
        {subcategoryCount > 0 ? `${subcategoryCount} θεματικές` : "Σύντομα διαθέσιμο"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "48%", minHeight: 180, padding: 15, backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: "#282D41" },
  emoji: { fontSize: 29, marginBottom: 17 },
  title: { color: "#F0EFF8", fontWeight: "800", fontSize: 14, lineHeight: 20, marginBottom: 6 },
  description: { color: "#9CA2B8", fontSize: 11, lineHeight: 17, flex: 1 },
  count: { color: "#B9AEFF", fontSize: 10, fontWeight: "800", marginTop: 14 },
  soon: { color: "#858AA0" },
});
