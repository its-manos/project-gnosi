import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import FantasyMap from "../components/FantasyMap";
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
  const mapRegions = categories.map((category) => {
    const count = subcategories.filter(
      (subcategory) => subcategory.categoryId === category.id
    ).length;

    return {
      id: category.id,
      title: category.title,
      emoji: category.emoji,
      detail: count === 1 ? "1 περιοχή" : `${count} περιοχές`,
    };
  });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader />

      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>Ο ΑΤΛΑΣ ΤΗΣ ΓΝΩΣΗΣ</Text>
          <Text style={styles.title}>Πού θα ταξιδέψεις;</Text>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={styles.iconButton}
            onPress={onOpenSearch}
            accessibilityRole="button"
            accessibilityLabel="Αναζήτηση μαθημάτων"
          >
            <Text style={styles.iconButtonText}>⌕</Text>
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={onOpenSaved}
            accessibilityRole="button"
            accessibilityLabel={`Αποθηκευμένα μαθήματα: ${savedCount}`}
          >
            <Text style={styles.iconButtonText}>♧</Text>
            {savedCount > 0 ? (
              <View style={styles.savedDot} />
            ) : null}
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>
        Άγγιξε μια χώρα για να ανακαλύψεις τις θεματικές της περιοχές.
      </Text>

      <View style={styles.mapLabelRow}>
        <Text style={styles.mapLabel}>ΟΙ ΓΝΩΣΤΟΙ ΚΟΣΜΟΙ</Text>
        <Text style={styles.mapCount}>
          {categories.length} ΧΩΡΕΣ · {subcategories.length} ΠΕΡΙΟΧΕΣ
        </Text>
      </View>

      <FantasyMap
        regions={mapRegions}
        onSelectRegion={onOpenCategory}
        emptyMessage="Οι πρώτοι κόσμοι γνώσης θα εμφανιστούν εδώ."
      />

      <View style={styles.progressLine}>
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>
          {completedCount} {completedCount === 1 ? "μάθημα" : "μαθήματα"} ολοκληρωμένα
        </Text>
        <View style={styles.progressDivider} />
        <Text style={styles.progressText}>
          {savedCount} αποθηκευμένα
        </Text>
      </View>

      <Pressable
        style={styles.discoveryCard}
        onPress={() => onOpenLesson(featuredLesson.id)}
        accessibilityRole="button"
        accessibilityLabel={`Σημερινή ανακάλυψη: ${featuredLesson.title}`}
      >
        <View style={styles.discoveryIcon}>
          <Text style={styles.discoveryGlyph}>✦</Text>
        </View>
        <View style={styles.discoveryContent}>
          <Text style={styles.discoveryEyebrow}>ΜΙΑ ΜΙΚΡΗ ΑΝΑΚΑΛΥΨΗ</Text>
          <Text style={styles.discoveryTitle} numberOfLines={2}>
            {featuredLesson.title}
          </Text>
          <Text style={styles.discoveryMeta}>
            {featuredLesson.readingMinutes} λεπτά ανάγνωσης · Δες το άρθρο →
          </Text>
        </View>
      </Pressable>

      <Text style={styles.footerNote}>
        Κάθε χώρα κρύβει έναν διαφορετικό τρόπο να δεις τον κόσμο.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 34,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  headingText: { flex: 1 },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  quickActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    color: colors.accentLight,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "600",
  },
  savedDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    right: 8,
    top: 7,
    backgroundColor: colors.success,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  mapLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  mapLabel: {
    color: "#7F89A4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  mapCount: {
    color: "#7F89A4",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  progressLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 9,
    marginTop: -2,
    marginBottom: 14,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  progressText: { color: colors.textMuted, fontSize: 10 },
  progressDivider: {
    height: 12,
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  discoveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 14,
  },
  discoveryIcon: {
    width: 43,
    height: 49,
    borderRadius: 13,
    backgroundColor: colors.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  discoveryGlyph: { color: colors.accentLight, fontSize: 24 },
  discoveryContent: { flex: 1, gap: 4 },
  discoveryEyebrow: {
    color: colors.accentLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  discoveryTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  discoveryMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  footerNote: {
    color: "#68728A",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 18,
  },
});
