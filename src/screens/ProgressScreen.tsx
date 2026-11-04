import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { categories, type Lesson } from "../data/lessons";
import type { LearningInsightsView } from "./LearningInsightsScreen";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import ReviewActions from "../components/ReviewActions";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

type Props = {
  onOpenInsights: (view: LearningInsightsView) => void;
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
  onOpenInsights, onKnowledgeReview, onWeeklyReview, onOpenProfile, onHome,
  completedLessons, inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  inProgressLessonCount, totalLessonCount, lessonProgressLoaded, onOpenLesson,
}: Props) {
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const { model, ready: knowledgeReady } = useKnowledgeModel();

  // Measure the *actual* content area between the top safe area and bottom
  // navigation rather than using platform-specific phone dimensions.
  const availableHeight = viewportHeight || windowHeight - 130;
  const dense = availableHeight < 610;
  const veryDense = availableHeight < 530;
  // Only exceptionally short layouts or enlarged accessibility text scroll.
  // The normal Progress screen is an actual fixed viewport, not a ScrollView.
  const accessibleScroll = availableHeight < 470 || fontScale >= 1.4;

  const completedCount = completedLessons.length;
  const exploredCount = new Set(completedLessons.map(lesson => lesson.categoryId)).size;
  const percent = totalLessonCount > 0
    ? Math.min(100, Math.round(completedCount / totalLessonCount * 100))
    : 0;
  const mastered = model.categories.reduce((sum, item) => sum + item.mastered, 0);
  const totalConcepts = model.categories.reduce((sum, item) => sum + item.total, 0);
  const viewportStyle = [
    styles.content, dense && styles.contentDense,
    veryDense && styles.contentVeryDense,
  ];
  const onViewportLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setViewportHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
  };

  const dashboard = <>
    <SyncStatus quiet />
    <View style={styles.heading} testID="progress-heading">
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Ο ΧΑΡΤΗΣ ΤΗΣ ΜΑΘΗΣΗΣ</Text>
        <Text style={[styles.title, veryDense && styles.titleDense]}>Η πρόοδός σου</Text>
      </View>
      <Pressable style={styles.profile} accessibilityRole="button"
        accessibilityLabel="Το προφίλ μου" onPress={onOpenProfile}>
        <Text style={styles.link}>Προφίλ ↗</Text>
      </Pressable>
    </View>

    <View testID="progress-summary" style={[styles.summary, dense && styles.summaryDense]}>
      <View style={styles.summaryHeading}>
        <Text style={styles.summaryTitle}>Οι ανακαλύψεις σου</Text>
        <Text style={styles.percent}>{lessonProgressLoaded ? percent + "%" : "—"}</Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, veryDense && styles.metricValueDense]}>
            {lessonProgressLoaded ? completedCount : "—"} <Text style={styles.metricTotal}>/ {totalLessonCount}</Text>
          </Text>
          <Text style={styles.metricLabel}>μαθήματα</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, veryDense && styles.metricValueDense]}>
            {lessonProgressLoaded ? exploredCount : "—"} <Text style={styles.metricTotal}>/ {categories.length}</Text>
          </Text>
          <Text style={styles.metricLabel}>κόσμοι</Text>
        </View>
      </View>
      <View style={styles.track} accessible={lessonProgressLoaded}
        accessibilityRole="progressbar"
        accessibilityLabel="Ολοκλήρωση μαθημάτων"
        accessibilityValue={lessonProgressLoaded
          ? { min: 0, max: totalLessonCount || 1, now: completedCount } : undefined}>
        <View style={[styles.trackFill, { width: lessonProgressLoaded ? percent + "%" : "0%" }]} />
      </View>
    </View>

    <ReviewActions onReview={onKnowledgeReview} onWeeklyReview={onWeeklyReview}
      onExplore={onHome} inProgressLesson={inProgressLesson}
      inProgressAnsweredCount={inProgressAnsweredCount}
      inProgressQuestionCount={inProgressQuestionCount}
      inProgressLessonCount={inProgressLessonCount}
      lessonProgressLoaded={lessonProgressLoaded} onResumeLesson={onOpenLesson}
      dense={dense} />

    <View style={styles.learning} testID="progress-learning">
      <Text style={styles.learningHeading}>Η μάθησή σου</Text>
      <View style={styles.destinations}>
        <Pressable testID="progress-knowledge-link"
          style={({ pressed }) => [styles.destination, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα γνώσεων"
          onPress={() => onOpenInsights("knowledge")}>
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationSymbol}>✦</Text>
            <Text style={styles.chevron}>↗</Text>
          </View>
          <Text style={styles.destinationTitle}>Γνώσεις</Text>
          <Text style={[styles.destinationNumber, veryDense && styles.destinationNumberDense]}>
            {knowledgeReady ? mastered + " / " + totalConcepts : "—"}
          </Text>
          <Text style={styles.destinationCaption} numberOfLines={2}>έννοιες κατακτημένες</Text>
        </Pressable>
        <Pressable testID="progress-reading-link"
          style={({ pressed }) => [styles.destination, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα ανάγνωσης"
          onPress={() => onOpenInsights("reading")}>
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationSymbol}>◈</Text>
            <Text style={styles.chevron}>↗</Text>
          </View>
          <Text style={styles.destinationTitle}>Ανάγνωση</Text>
          <Text style={[styles.destinationNumber, veryDense && styles.destinationNumberDense]}>
            {lessonProgressLoaded ? completedCount + " / " + totalLessonCount : "—"}
          </Text>
          <Text style={styles.destinationCaption} numberOfLines={2}>ολοκληρωμένα μαθήματα</Text>
        </Pressable>
      </View>
    </View>
  </>;

  return accessibleScroll ? (
    <ScrollView testID="progress-accessibility-scroll" style={styles.screen}
      onLayout={onViewportLayout} contentContainerStyle={[...viewportStyle, styles.scrollContent]}
      showsVerticalScrollIndicator={false}>
      {dashboard}
    </ScrollView>
  ) : (
    <View testID="progress-fixed-dashboard" onLayout={onViewportLayout}
      style={[styles.screen, ...viewportStyle]}>
      {dashboard}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, width: "100%", maxWidth: 720, alignSelf: "center" },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, gap: 12 },
  contentDense: { paddingTop: 7, paddingBottom: 7, gap: 8 },
  contentVeryDense: { paddingTop: 4, paddingBottom: 4, gap: 6 },
  scrollContent: { flexGrow: 1 },
  heading: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 12 },
  copy: { flex: 1, gap: 0 },
  eyebrow: { color: colors.accentLight, fontSize: 9, lineHeight: 14, letterSpacing: 1.1, fontWeight: "800" },
  title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: "900" },
  titleDense: { fontSize: 23, lineHeight: 28 },
  profile: {
    minHeight: 44, justifyContent: "center", paddingHorizontal: 12,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: 13,
  },
  link: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
  summary: {
    padding: 14, borderRadius: 19, gap: 9, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryDense: { paddingVertical: 10, paddingHorizontal: 12, gap: 6 },
  summaryHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  percent: { color: colors.accentLight, fontSize: 14, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metrics: { flexDirection: "row", alignItems: "center", gap: 14 },
  metric: { flex: 1, gap: 1 },
  metricDivider: { height: 26, width: 1, backgroundColor: colors.border },
  metricValue: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metricValueDense: { fontSize: 19, lineHeight: 22 },
  metricTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  metricLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  track: { height: 5, borderRadius: 8, backgroundColor: colors.border, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 8, backgroundColor: colors.accent },
  learning: { flex: 1, minHeight: 0, gap: 8 },
  learningHeading: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  destinations: { flex: 1, minHeight: 0, flexDirection: "row", gap: 10 },
  destination: {
    flex: 1, minWidth: 0, borderRadius: 19, borderWidth: 1,
    borderColor: colors.borderStrong, backgroundColor: colors.surface,
    paddingHorizontal: 13, paddingVertical: 10,
    justifyContent: "space-between", gap: 3,
  },
  pressed: { opacity: 0.82 },
  destinationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  destinationSymbol: { color: colors.accentLight, fontSize: 18, lineHeight: 24 },
  chevron: { color: colors.accentLight, fontSize: 18, lineHeight: 24 },
  destinationTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  destinationNumber: { color: colors.accentLight, fontSize: 22, lineHeight: 27, fontWeight: "900", fontVariant: ["tabular-nums"] },
  destinationNumberDense: { fontSize: 19, lineHeight: 22 },
  destinationCaption: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
});
