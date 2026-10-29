import { ScrollView, StyleSheet, Text } from "react-native";
import type { Category, Subcategory, Lesson } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import SubcategoryCard from "../components/SubcategoryCard";
import { colors } from "../theme";

type Props = {
  category: Category;
  subcategories: Subcategory[];
  lessons: Lesson[];
  onBack: () => void;
  onOpenSubcategory: (subcategoryId: string, categoryId: string) => void;
};

export default function CategoryScreen({ category, subcategories, lessons, onBack, onOpenSubcategory }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} />
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={styles.title}>{category.title}</Text>
      <Text style={styles.body}>{category.description}</Text>
      <Text style={styles.sectionTitle}>Θεματικές ενότητες</Text>
      {subcategories.map((subcategory) => (
        <SubcategoryCard
          key={subcategory.id}
          subcategory={subcategory}
          lessonCount={lessons.filter((lesson) => lesson.subcategoryId === subcategory.id).length}
          onPress={() => onOpenSubcategory(subcategory.id, category.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  sectionTitle: { color: "#F4F3FB", fontSize: 20, fontWeight: "800", marginTop: 32, marginBottom: 17 },
});
