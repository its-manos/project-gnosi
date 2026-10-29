import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import CategoryCard from "../components/CategoryCard";
import { colors } from "../theme";

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
  featuredLesson: Lesson;
  completedCount: number;
  savedCount: number;
  onOpenCategory: (categoryId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSaved: () => void;
  onOpenSearch: () => void;
};

export default function HomeScreen({
  categories,
  subcategories,
  featuredLesson,
  completedCount,
  savedCount,
  onOpenCategory,
  onOpenLesson,
  onOpenSaved,
  onOpenSearch,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader />

      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>ΛΙΓΗ ΓΝΩΣΗ ΚΑΘΕ ΜΕΡΑ</Text>
        <Text style={styles.title}>Ο κόσμος έχει{"\n"}πολλά να σου πει.</Text>
        <Text style={styles.body}>
          Ανακάλυψε κάτι καινούριο, διάβασε μια σύντομη ιστορία και δοκίμασε όσα έμαθες.
        </Text>
      </View>

      <Pressable
        style={styles.searchTrigger}
        onPress={onOpenSearch}
        accessibilityRole="button"
        accessibilityLabel="Αναζήτηση μαθημάτων και θεμάτων"
      >
        <Text style={styles.searchIcon}>⌕</Text>
        <View style={styles.searchTextWrap}>
          <Text style={styles.searchTitle}>Τι θέλεις να μάθεις;</Text>
          <Text style={styles.searchHint}>Αναζήτησε ένα θέμα ή μια ιδέα</Text>
        </View>
        <Text style={styles.searchArrow}>→</Text>
      </Pressable>

      <View style={styles.featuredCard}>
        <View style={styles.featuredTopRow}>
          <Text style={styles.featuredBadge}>ΠΡΟΤΕΙΝΟΜΕΝΟ</Text>
          <Text style={styles.readingTime}>◷ {featuredLesson.readingMinutes} λεπτά</Text>
        </View>
        <Text style={styles.featuredTitle}>{featuredLesson.title}</Text>
        <Text style={styles.featuredDescription}>{featuredLesson.summary}</Text>
        <ActionButton label="Ξεκίνα την ανάγνωση →" onPress={() => onOpenLesson(featuredLesson.id)} />
      </View>

      <View style={styles.savedCard}>
        <View style={styles.savedText}>
          <Text style={styles.savedTitle}>Τα αποθηκευμένα σου</Text>
          <Text style={styles.muted}>
            {savedCount === 0
              ? "Κράτησε άρθρα για να τα ξαναβρείς εύκολα."
              : `${savedCount} ${savedCount === 1 ? "άρθρο" : "άρθρα"} στη λίστα σου`}
          </Text>
        </View>
        <ActionButton
          label="🔖 Προβολή αποθηκευμένων"
          onPress={onOpenSaved}
          secondary
        />
      </View>

      <View style={styles.heading}>
        <Text style={styles.sectionTitle}>Εξερεύνησε τον κόσμο</Text>
        <Text style={styles.muted}>Διάλεξε αυτό που σου κινεί την περιέργεια.</Text>
      </View>

      <View style={styles.grid}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            subcategoryCount={subcategories.filter((item) => item.categoryId === category.id).length}
            onPress={() => onOpenCategory(category.id)}
          />
        ))}
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Η πρόοδός σου</Text>
        <Text style={styles.body}>
          Έχεις ολοκληρώσει {completedCount} {completedCount === 1 ? "μάθημα" : "μαθήματα"}.
        </Text>
        <Text style={styles.note}>
          Η πρόοδός σου αποθηκεύεται τοπικά σε αυτή τη συσκευή. Δεν συγχρονίζεται ακόμη με άλλες συσκευές.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  welcome: { marginBottom: 26 },
  searchTrigger: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 22, gap: 12 },
  searchIcon: { color: colors.accent, fontSize: 29, lineHeight: 32 },
  searchTextWrap: { flex: 1, gap: 3 },
  searchTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  searchHint: { color: colors.textMuted, fontSize: 11 },
  searchArrow: { color: colors.accentLight, fontSize: 19, fontWeight: "700" },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 35, fontWeight: "900", lineHeight: 42, letterSpacing: -0.8, marginBottom: 14 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  featuredCard: { backgroundColor: colors.surfaceRaised, borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, padding: 20, marginBottom: 18 },
  featuredTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  featuredBadge: { color: "#BEB4FF", backgroundColor: "#302B4A", overflow: "hidden", borderRadius: 8, fontSize: 9, fontWeight: "900", letterSpacing: 1, paddingHorizontal: 10, paddingVertical: 7 },
  readingTime: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  featuredTitle: { color: colors.text, fontSize: 25, fontWeight: "800", lineHeight: 32, marginBottom: 10 },
  featuredDescription: { color: "#B1B5C8", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  savedCard: { backgroundColor: colors.surface, borderRadius: 19, padding: 18, marginBottom: 32, borderWidth: 1, borderColor: colors.border },
  savedText: { gap: 6 },
  savedTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  heading: { marginBottom: 18 },
  sectionTitle: { color: "#F4F3FB", fontSize: 20, fontWeight: "800", marginBottom: 7 },
  muted: { color: "#979CB3", fontSize: 12, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  progressCard: { backgroundColor: colors.surface, borderRadius: 19, padding: 18, marginTop: 26, borderWidth: 1, borderColor: "#282D41" },
  progressTitle: { color: "#F4F3FB", fontSize: 16, fontWeight: "800", marginBottom: 9 },
  note: { color: "#737B95", fontSize: 11, lineHeight: 17, marginTop: 12 },
});
