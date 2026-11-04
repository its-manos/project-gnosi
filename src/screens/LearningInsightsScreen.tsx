import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import KnowledgeMastery from "../components/KnowledgeMastery";
import { CategoryProgress } from "../components/LearningActivityPanel";
import { colors } from "../theme";

export type LearningInsightsView = "knowledge" | "reading";

type Props = {
  initialView: LearningInsightsView;
  onViewChange: (view: LearningInsightsView) => void;
  onBack: () => void;
  onKnowledgeReview: () => void;
  completedLessons: Lesson[];
  totalLessonCount: number;
  lessonProgressLoaded: boolean;
  onOpenLesson: (id: string) => void;
};

export default function LearningInsightsScreen({
  initialView, onViewChange, onBack, onKnowledgeReview,
  completedLessons, totalLessonCount, lessonProgressLoaded, onOpenLesson,
}: Props) {
  const [view, setView] = useState<LearningInsightsView>(initialView);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);

  return <View style={styles.screen} testID="learning-insights-screen">
    <View style={styles.header}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Πίσω στην πρόοδο" style={styles.back}>
        <Text style={styles.backText}>‹ ΠΡΟΟΔΟΣ</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Η ΜΑΘΗΣΗ ΣΟΥ</Text>
      <View style={styles.headerSide} />
    </View>
    <View style={styles.tabs} accessibilityRole="tablist">
      {([["knowledge", "Γνώσεις"], ["reading", "Ανάγνωση"]] as const).map(([key, title]) =>
        <Pressable key={key} accessibilityRole="tab"
          accessibilityState={{ selected: view === key }} style={[styles.tab, view === key && styles.selected]}
          onPress={() => { setView(key); onViewChange(key); }}>
          <Text style={[styles.tabText, view === key && styles.selectedText]}>{title}</Text>
        </Pressable>
      )}
    </View>
    <ScrollView key={view} style={styles.scroll} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {view === "knowledge" ? <>
        <Text style={styles.title}>Ο χάρτης της γνώσης σου</Text>
        <Text style={styles.description}>Τι συγκρατείς από τις επαναλήψεις σου — όχι απλώς τι διάβασες.</Text>
        <KnowledgeMastery onOpen={onKnowledgeReview} mapOnly />
      </> : <View testID="learning-insights-reading" style={styles.reading}>
        <Text style={styles.title}>Οι κόσμοι που εξερευνάς</Text>
        <Text style={styles.description}>Η ανάγνωση μετρά ολοκληρωμένα μαθήματα, ανεξάρτητα από την κατάκτηση γνώσεων.</Text>
        <View style={styles.overview}>
          <Text style={styles.overviewLabel}>ΟΛΟΚΛΗΡΩΜΕΝΑ ΜΑΘΗΜΑΤΑ</Text>
          <Text style={styles.overviewValue}>{lessonProgressLoaded ? completedLessons.length : "—"} <Text style={styles.overviewTotal}>/ {totalLessonCount}</Text></Text>
        </View>
        {lessonProgressLoaded ? <CategoryProgress /> : <Text style={styles.description}>Φόρτωση μαθημάτων…</Text>}
        {lessonProgressLoaded && completedLessons.length > 0 ? <>
          <Pressable style={styles.disclosure} accessibilityRole="button"
            accessibilityState={{ expanded: lessonsExpanded }}
            onPress={() => setLessonsExpanded(previous => !previous)}>
            <Text style={styles.disclosureTitle}>Ολοκληρωμένα μαθήματα</Text>
            <Text style={styles.disclosureCount}>{completedLessons.length} {lessonsExpanded ? "−" : "+"}</Text>
          </Pressable>
          {lessonsExpanded ? completedLessons.map(lesson =>
            <Pressable key={lesson.id} style={styles.lesson} accessibilityRole="button"
              onPress={() => onOpenLesson(lesson.id)}>
              <Text style={styles.lessonText}>✓ {lesson.title}</Text><Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}
        </> : lessonProgressLoaded
          ? <Text style={styles.description}>Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ.</Text> : null}
      </View>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 7 },
  header: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 80, minHeight: 44, justifyContent: "center" },
  backText: { color: colors.accentLight, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontSize: 14, fontWeight: "900", letterSpacing: 1.3 },
  headerSide: { width: 80 },
  tabs: { flexDirection: "row", padding: 4, gap: 4, borderRadius: 14, backgroundColor: colors.surface, marginTop: 8 },
  tab: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 11, paddingHorizontal: 8 },
  selected: { backgroundColor: colors.accentSurface },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
  selectedText: { color: colors.accentLight, fontWeight: "900" },
  scroll: { flex: 1, minHeight: 0 },
  content: { paddingTop: 15, paddingBottom: 32, gap: 12 },
  reading: { gap: 12 },
  title: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: "900" },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  overview: { backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, padding: 16, gap: 5 },
  overviewLabel: { color: colors.accentLight, fontSize: 10, fontWeight: "800" },
  overviewValue: { color: colors.text, fontSize: 27, fontWeight: "900", fontVariant: ["tabular-nums"] },
  overviewTotal: { color: colors.textMuted, fontSize: 17, fontWeight: "700" },
  disclosure: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 52, paddingHorizontal: 14 },
  disclosureTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  disclosureCount: { color: colors.accentLight, fontWeight: "800", fontSize: 14 },
  lesson: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10 },
  lessonText: { flex: 1, color: colors.textBody, fontSize: 14, lineHeight: 22 },
  chevron: { color: colors.accentLight, fontSize: 22 },
});
