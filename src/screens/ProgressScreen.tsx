import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { categories, type Lesson } from "../data/lessons";
import KnowledgeMastery from "../components/KnowledgeMastery";
import ReviewActions from "../components/ReviewActions";
import { CategoryProgress } from "../components/LearningActivityPanel";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

type Props = {
  initialView?: "knowledge" | "reading";
  onViewChange?: (view: "knowledge" | "reading") => void;
  onKnowledgeReview: () => void;
  onWeeklyReview?: () => void;
  onOpenProfile: () => void;
  onHome: () => void;
  completedLessons: Lesson[];
  inProgressLesson: Lesson | null;
  inProgressAnsweredCount: number;
  inProgressQuestionCount: number;
  inProgressLessonCount: number;
  totalLessonCount: number;
  lessonProgressLoaded: boolean;
  onOpenLesson: (id: string) => void;
};

export default function ProgressScreen({
  initialView = "knowledge",
  onViewChange,
  onKnowledgeReview,
  onWeeklyReview,
  onOpenProfile,
  onHome,
  completedLessons,
  inProgressLesson,
  inProgressAnsweredCount,
  inProgressQuestionCount,
  inProgressLessonCount,
  totalLessonCount,
  lessonProgressLoaded,
  onOpenLesson,
}: Props) {
  const [view, setView] = useState<"knowledge" | "reading">(initialView);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);
  const completedCount = completedLessons.length;
  const exploredCount = new Set(completedLessons.map(lesson => lesson.categoryId)).size;
  const percent = totalLessonCount > 0
    ? Math.min(100, Math.round(completedCount / totalLessonCount * 100))
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SyncStatus quiet />
      <View style={styles.heading} testID="progress-heading">
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Ο ΧΑΡΤΗΣ ΤΗΣ ΜΑΘΗΣΗΣ</Text>
          <Text style={styles.title}>Η πρόοδός σου</Text>
        </View>
        <Pressable style={styles.profile} accessibilityRole="button"
          accessibilityLabel="Το προφίλ μου" onPress={onOpenProfile}>
          <Text style={styles.link}>Προφίλ ↗</Text>
        </Pressable>
      </View>

      <View testID="progress-summary" style={styles.summary}>
        <View style={styles.summaryHeading}>
          <Text style={styles.summaryTitle}>Οι ανακαλύψεις σου</Text>
          <Text style={styles.percent}>{lessonProgressLoaded ? percent + "%" : "—"}</Text>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{lessonProgressLoaded ? completedCount : "—"} <Text style={styles.metricTotal}>/ {totalLessonCount}</Text></Text>
            <Text style={styles.metricLabel}>μαθήματα</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{lessonProgressLoaded ? exploredCount : "—"} <Text style={styles.metricTotal}>/ {categories.length}</Text></Text>
            <Text style={styles.metricLabel}>κόσμοι</Text>
          </View>
        </View>
        <View style={styles.track} accessible={lessonProgressLoaded}
          accessibilityRole="progressbar"
          accessibilityLabel="Ολοκλήρωση μαθημάτων"
          accessibilityValue={lessonProgressLoaded ? { min: 0, max: totalLessonCount || 1, now: completedCount } : undefined}>
          <View style={[styles.trackFill, { width: lessonProgressLoaded ? percent + "%" : "0%" }]} />
        </View>
      </View>

      <ReviewActions onReview={onKnowledgeReview} onWeeklyReview={onWeeklyReview}
        onExplore={onHome} inProgressLesson={inProgressLesson}
        inProgressAnsweredCount={inProgressAnsweredCount}
        inProgressQuestionCount={inProgressQuestionCount}
        inProgressLessonCount={inProgressLessonCount}
        lessonProgressLoaded={lessonProgressLoaded} onResumeLesson={onOpenLesson} />

      <View style={styles.learning} testID="progress-learning">
        <View style={styles.tabs} accessibilityRole="tablist">
          {([["knowledge", "Γνώσεις"], ["reading", "Ανάγνωση"]] as const).map(([key, title]) => (
            <Pressable key={key} style={[styles.tab, view === key && styles.selected]}
              accessibilityRole="tab" accessibilityState={{ selected: view === key }}
              onPress={() => { setView(key); onViewChange?.(key); }}>
              <Text style={[styles.tabText, view === key && styles.link]}>{title}</Text>
            </Pressable>
          ))}
        </View>
        {view === "knowledge" ? (
          <KnowledgeMastery onOpen={onKnowledgeReview} mapOnly preview />
        ) : (
          <View testID="progress-reading" style={styles.reading}>
            <Text style={styles.hint}>Η ανάγνωση και η κατάκτηση γνώσεων μετρώνται ξεχωριστά.</Text>
            <CategoryProgress compact />
            {lessonProgressLoaded && completedLessons.length > 0 ? (
              <>
                <Pressable style={styles.disclosure} accessibilityRole="button"
                  accessibilityState={{ expanded: lessonsExpanded }}
                  onPress={() => setLessonsExpanded(value => !value)}>
                  <Text style={styles.link}>Ολοκληρωμένα μαθήματα {lessonsExpanded ? "−" : "+"}</Text>
                  <Text style={styles.disclosureCount}>{completedCount}</Text>
                </Pressable>
                {lessonsExpanded ? completedLessons.map(lesson => (
                  <Pressable key={lesson.id} style={styles.lesson}
                    accessibilityRole="button" onPress={() => onOpenLesson(lesson.id)}>
                    <Text style={styles.lessonText}>✓ {lesson.title}</Text>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                )) : null}
              </>
            ) : lessonProgressLoaded ? (
              <Text style={styles.hint}>Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ.</Text>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34, gap: 12,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 47 },
  copy: { flex: 1, gap: 1 },
  eyebrow: { color: colors.accentLight, fontSize: 9, lineHeight: 14, letterSpacing: 1.1, fontWeight: "800" },
  title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: "900" },
  profile: {
    minHeight: 44, paddingHorizontal: 12, borderRadius: 13,
    justifyContent: "center", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  link: { color: colors.accentLight, fontSize: 13, fontWeight: "800", lineHeight: 20 },
  summary: {
    padding: 14, gap: 9, borderRadius: 19,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  summaryHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  percent: { color: colors.accentLight, fontSize: 14, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metrics: { flexDirection: "row", alignItems: "center", gap: 14 },
  metric: { flex: 1, gap: 1 },
  metricDivider: { height: 26, width: 1, backgroundColor: colors.border },
  metricValue: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metricTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  metricLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  track: { height: 5, borderRadius: 8, backgroundColor: colors.border, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 8, backgroundColor: colors.accent },
  learning: { gap: 10 },
  tabs: { flexDirection: "row", padding: 4, backgroundColor: colors.surface, borderRadius: 14, gap: 4 },
  tab: { flex: 1, minHeight: 44, padding: 8, justifyContent: "center", alignItems: "center", borderRadius: 11 },
  selected: { backgroundColor: colors.accentSurface },
  tabText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  reading: { gap: 8 },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 17, paddingHorizontal: 2 },
  disclosure: {
    minHeight: 44, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 4,
  },
  disclosureCount: { color: colors.textMuted, fontSize: 12 },
  lesson: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  lessonText: { flex: 1, color: colors.textBody, fontSize: 14, lineHeight: 22 },
  arrow: { color: colors.accentLight, fontSize: 22 },
});
