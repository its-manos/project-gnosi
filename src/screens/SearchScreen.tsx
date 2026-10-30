import { getReadingState, type ReadingState } from "../utils/readingDiscovery";
import { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import LessonCard from "../components/LessonCard";
import { colors } from "../theme";

type Props = {
  completedLessonIds: string[];
  inProgressLessonIds: string[];
  progressLoaded: boolean;
  lessons: Lesson[];
  categories: Category[];
  subcategories: Subcategory[];
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
};

// Normalize accents and Greek final sigma so searches work naturally in Greek.
function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .replace(/ς/g, "σ")
    .trim();
}

export default function SearchScreen({
  completedLessonIds,
  inProgressLessonIds,
  progressLoaded,
  lessons,
  categories,
  subcategories,
  onBack,
  onOpenLesson,
}: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<ReadingState | "all">("all");
  const normalizedQuery = normalizeSearchText(query);

  // Build the full-text index only when the content catalogue changes, not
  // on every keystroke. This remains inexpensive now and scales better later.
  const searchIndex = useMemo(
    () => lessons.map((lesson) => {
      const category = categories.find(
        (item) => item.id === lesson.categoryId
      );
      const subcategory = subcategories.find(
        (item) => item.id === lesson.subcategoryId
      );

      const searchableText = [
        lesson.title,
        lesson.summary,
        lesson.intro,
        category?.title ?? "",
        category?.description ?? "",
        subcategory?.title ?? "",
        subcategory?.description ?? "",
        ...lesson.sections.flatMap((section) => [
          section.title,
          ...section.paragraphs,
        ]),
        ...lesson.sources.flatMap((source) => [
          source.title,
          source.publisher,
        ]),
      ].join(" ");

      return {
        lesson,
        normalizedText: normalizeSearchText(searchableText),
      };
    }),
    [lessons, categories, subcategories]
  );

  const results = useMemo(() => searchIndex.filter(({ lesson, normalizedText }) => (
    (!normalizedQuery || normalizedText.includes(normalizedQuery)) &&
    (!categoryId || lesson.categoryId === categoryId) &&
    (status === "all" || (progressLoaded && getReadingState(lesson.id, completedLessonIds, inProgressLessonIds) === status))
  )).map((entry) => entry.lesson), [searchIndex, normalizedQuery, categoryId, status, progressLoaded, completedLessonIds, inProgressLessonIds]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader onBack={onBack} backLabel="ΑΡΧΙΚΗ" />

      <Text style={styles.eyebrow}>ΑΝΑΚΑΛΥΨΕ ΚΑΤΙ ΝΕΟ</Text>
      <Text style={styles.title}>Τι θέλεις να μάθεις;</Text>
      <Text style={styles.intro}>
        Ψάξε ανάμεσα σε τίτλους, θεματικές, περιλήψεις και το περιεχόμενο των άρθρων.
      </Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="π.χ. αρχαία Ελλάδα, διάστημα…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Αναζήτηση μαθημάτων"
          onSubmitEditing={Keyboard.dismiss}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Καθαρισμός αναζήτησης"
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.filterLabel}>Κατηγορία</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {[{ id: null, title: "Όλες" }, ...categories].map((category) => (
          <Pressable key={category.id ?? "all"} onPress={() => setCategoryId(category.id)} accessibilityRole="button"
            accessibilityState={{ selected: categoryId === category.id }}
            style={[styles.chip, categoryId === category.id && styles.activeChip]}>
            <Text style={styles.chipText}>{category.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.filterLabel}>Η ανάγνωσή σου</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {([{ id: "all", title: "Όλα" }, { id: "unread", title: "Αδιάβαστα" }, { id: "in-progress", title: "Σε εξέλιξη" }, { id: "completed", title: "Ολοκληρωμένα" }] as const).map((filter) => (
          <Pressable key={filter.id} onPress={() => setStatus(filter.id)} disabled={!progressLoaded && filter.id !== "all"}
            accessibilityRole="button" accessibilityState={{ selected: status === filter.id, disabled: !progressLoaded && filter.id !== "all" }}
            style={[styles.chip, status === filter.id && styles.activeChip]}><Text style={styles.chipText}>{filter.title}</Text></Pressable>
        ))}
      </ScrollView>
      {!progressLoaded ? <Text style={styles.emptyText}>Φόρτωση προόδου ανάγνωσης…</Text> : null}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>
          {normalizedQuery || categoryId || status !== "all" ? "Αποτελέσματα" : "Όλα τα μαθήματα"}
        </Text>
        <Text style={styles.count}>
          {results.length} {results.length === 1 ? "μάθημα" : "μαθήματα"}
        </Text>
      </View>

      {results.length > 0 ? (
        results.map((lesson) => {
          const category = categories.find(
            (item) => item.id === lesson.categoryId
          );
          const subcategory = subcategories.find(
            (item) => item.id === lesson.subcategoryId
          );

          return (
            <View key={lesson.id} style={styles.resultItem}>
              <Text style={styles.context}>
                {[category?.title, subcategory?.title]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
              <LessonCard
                lesson={lesson} readingState={progressLoaded ? getReadingState(lesson.id, completedLessonIds, inProgressLessonIds) : undefined}
                onPress={() => onOpenLesson(lesson.id)}
              />
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyTitle}>Δεν βρέθηκαν μαθήματα</Text>
          <Text style={styles.emptyText}>
            Δοκίμασε μια πιο γενική λέξη ή άλλαξε τα φίλτρα κατηγορίας και ανάγνωσης.
          </Text>
          <Pressable
            onPress={() => { setQuery(""); setCategoryId(null); setStatus("all"); }}
            style={styles.resetButton}
            accessibilityRole="button"
          >
            <Text style={styles.resetLabel}>Εμφάνιση όλων των μαθημάτων</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 8 },
  filters: { gap: 8, paddingBottom: 18 },
  chip: { minHeight: 44, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  activeChip: { borderColor: colors.accentLight, backgroundColor: colors.accentSurface },
  chipText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  intro: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginBottom: 20 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, paddingHorizontal: 14, minHeight: 56, marginBottom: 26 },
  searchIcon: { color: colors.accent, fontSize: 27, marginRight: 10 },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12 },
  clearButton: { padding: 4, marginLeft: 6 },
  clearText: { color: colors.textMuted, fontSize: 25, lineHeight: 28 },
  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  count: { color: colors.textMuted, fontSize: 12 },
  resultItem: { marginBottom: 2 },
  context: { color: colors.accentLight, fontSize: 10, fontWeight: "800", letterSpacing: 0.4, marginBottom: 8 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 22, alignItems: "flex-start" },
  emptyEmoji: { fontSize: 34, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: "800", marginBottom: 8 },
  emptyText: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  resetButton: { marginTop: 18, paddingVertical: 10 },
  resetLabel: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
});
