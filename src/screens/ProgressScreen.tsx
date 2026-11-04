import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { categories, type Lesson } from "../data/lessons";
import type { LearningInsightsView } from "./LearningInsightsScreen";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import HomeAtlasBackground from "../components/HomeAtlasBackground";
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

const RING_CIRCUMFERENCE = 2 * Math.PI * 31;

export default function ProgressScreen({
  onOpenInsights, onKnowledgeReview, onWeeklyReview, onOpenProfile, onHome,
  completedLessons, inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  inProgressLessonCount, totalLessonCount, lessonProgressLoaded, onOpenLesson,
}: Props) {
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const { model, ready: knowledgeReady } = useKnowledgeModel();

  // Measure inside the app's safe area, ABOVE the bottom navigation.
  // Normal devices render a fixed page, not a tall, rubber-band ScrollView.
  const availableHeight = viewportHeight || windowHeight - 130;
  const roomy = availableHeight >= 760;
  const dense = availableHeight < 650;
  const veryDense = availableHeight < 600;
  // Protect touch targets and readable text on very short or zoomed screens.
  const accessibleScroll = availableHeight < 525 || fontScale >= 1.4;

  const completedCount = completedLessons.length;
  const exploredCount = new Set(completedLessons.map(lesson => lesson.categoryId)).size;
  const percent = totalLessonCount > 0
    ? Math.min(100, Math.round(completedCount / totalLessonCount * 100))
    : 0;
  const mastered = model.categories.reduce((sum, item) => sum + item.mastered, 0);
  const totalConcepts = model.categories.reduce((sum, item) => sum + item.total, 0);
  const masteryPercent = totalConcepts ? Math.round(mastered / totalConcepts * 100) : 0;
  const onViewportLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setViewportHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
  };
  const contentStyle = [
    styles.content, roomy && styles.contentRoomy,
    dense && styles.contentDense, veryDense && styles.contentVeryDense,
  ];

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

    <View testID="progress-summary" style={[styles.summary, veryDense && styles.summaryDense]}>
      <View style={[styles.ring, veryDense && styles.ringDense]} accessible
        accessibilityRole="progressbar" accessibilityLabel="Ολοκλήρωση μαθημάτων"
        accessibilityValue={lessonProgressLoaded
          ? { min: 0, max: 100, now: percent } : { text: "Φόρτωση προόδου" }}>
        <Svg width="100%" height="100%" viewBox="0 0 80 80" pointerEvents="none">
          <Circle cx="40" cy="40" r="31" fill="none" stroke="#3C405A" strokeWidth="6" />
          <Circle cx="40" cy="40" r="31" fill="none" stroke={colors.accent} strokeWidth="6"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - (lessonProgressLoaded ? percent : 0) / 100)}
            strokeLinecap="round" transform="rotate(-90 40 40)" />
        </Svg>
        <Text style={styles.ringValue}>{lessonProgressLoaded ? percent + "%" : "—"}</Text>
      </View>
      <View style={styles.summaryBody}>
        <Text style={styles.summaryTitle}>Οι ανακαλύψεις σου</Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {lessonProgressLoaded ? completedCount : "—"}
              <Text style={styles.metricTotal}> / {totalLessonCount}</Text>
            </Text>
            <Text style={styles.metricLabel}>μαθήματα</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {lessonProgressLoaded ? exploredCount : "—"}
              <Text style={styles.metricTotal}> / {categories.length}</Text>
            </Text>
            <Text style={styles.metricLabel}>κόσμοι</Text>
          </View>
        </View>
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
          style={({ pressed }) => [styles.destination, dense && styles.destinationDense,
            veryDense && styles.destinationVeryDense, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα γνώσεων"
          onPress={() => onOpenInsights("knowledge")}>
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationTitle}>✦  Γνώσεις</Text>
            <Text style={styles.chevron}>↗</Text>
          </View>
          <View style={styles.destinationCenter}>
            <Text style={[styles.destinationNumber, veryDense && styles.destinationNumberDense]}>
              {knowledgeReady ? mastered + " / " + totalConcepts : "—"}
            </Text>
            <Text style={styles.destinationCaption} numberOfLines={1}>έννοιες κατακτημένες</Text>
          </View>
          <View style={styles.destinationFoot}>
            <View style={styles.destinationTrack} accessible={false}>
              <View style={[styles.knowledgeFill, { width: knowledgeReady ? masteryPercent + "%" : "0%" }]} />
            </View>
            <Text style={styles.destinationAction}>Δες την ανάλυση  ›</Text>
          </View>
        </Pressable>
        <Pressable testID="progress-reading-link"
          style={({ pressed }) => [styles.destination, dense && styles.destinationDense,
            veryDense && styles.destinationVeryDense, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα ανάγνωσης"
          onPress={() => onOpenInsights("reading")}>
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationTitle}>◇  Ανάγνωση</Text>
            <Text style={styles.chevron}>↗</Text>
          </View>
          <View style={styles.destinationCenter}>
            <Text style={[styles.destinationNumber, veryDense && styles.destinationNumberDense]}>
              {lessonProgressLoaded ? completedCount + " / " + totalLessonCount : "—"}
            </Text>
            <Text style={styles.destinationCaption} numberOfLines={1}>μαθήματα ολοκληρωμένα</Text>
          </View>
          <View style={styles.destinationFoot}>
            <View style={styles.destinationTrack} accessible={false}>
              <View style={[styles.readingFill, { width: lessonProgressLoaded ? percent + "%" : "0%" }]} />
            </View>
            <Text style={styles.destinationAction}>Δες την ανάλυση  ›</Text>
          </View>
        </Pressable>
      </View>
    </View>
  </>;

  return (
    <View testID="progress-shell" onLayout={onViewportLayout} style={styles.screen}>
      <HomeAtlasBackground showAmbientMotion={false} />
      {accessibleScroll ? (
        <ScrollView testID="progress-accessibility-scroll"
          style={styles.scroll} contentContainerStyle={[...contentStyle, styles.scrollContent]}
          showsVerticalScrollIndicator={false}>
          {dashboard}
        </ScrollView>
      ) : (
        <View testID="progress-fixed-dashboard" style={[styles.fixedContent, ...contentStyle]}>
          {dashboard}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, minHeight: 0, width: "100%", maxWidth: 720,
    alignSelf: "center", overflow: "hidden", backgroundColor: "#101827",
  },
  scroll: { flex: 1, minHeight: 0 },
  // Extra height belongs below the dashboard, not between its sections.
  // space-between created oversized vertical gutters on tall phones/tablets.
  fixedContent: { flex: 1, minHeight: 0, justifyContent: "flex-start" },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, gap: 14 },
  contentRoomy: { paddingTop: 18, paddingBottom: 18, gap: 16 },
  contentDense: { paddingTop: 7, paddingBottom: 9, gap: 9 },
  contentVeryDense: { paddingTop: 5, paddingBottom: 6, gap: 6 },
  scrollContent: { flexGrow: 1 },
  heading: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 12 },
  copy: { flex: 1, gap: 1 },
  eyebrow: { color: colors.accentLight, fontSize: 9, lineHeight: 14, letterSpacing: 1.1, fontWeight: "900" },
  title: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: "900" },
  titleDense: { fontSize: 21, lineHeight: 27 },
  profile: {
    minHeight: 44, justifyContent: "center", paddingHorizontal: 12,
    backgroundColor: "#1B2032", borderWidth: 1, borderColor: colors.border,
    borderRadius: 13,
  },
  link: { color: colors.accentLight, fontSize: 12, fontWeight: "800" },
  summary: {
    minHeight: 104, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20,
    backgroundColor: "#192234", borderWidth: 1, borderColor: "#384153",
  },
  summaryDense: { minHeight: 94, paddingHorizontal: 11, paddingVertical: 9, gap: 9 },
  ring: { width: 78, height: 78, alignItems: "center", justifyContent: "center" },
  ringDense: { width: 68, height: 68 },
  ringValue: {
    position: "absolute", textAlign: "center", color: colors.accentLight,
    fontSize: 17, lineHeight: 23, fontWeight: "900", fontVariant: ["tabular-nums"],
  },
  summaryBody: { flex: 1, minWidth: 0, gap: 10 },
  summaryTitle: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "800" },
  metrics: { flexDirection: "row", alignItems: "center", gap: 10 },
  metric: { flex: 1, minWidth: 0, gap: 2 },
  metricDivider: { height: 28, width: 1, backgroundColor: "#384054" },
  metricValue: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metricTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  metricLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  learning: { gap: 8 },
  learningHeading: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  destinations: { flexDirection: "row", gap: 10 },
  destination: {
    flex: 1, minWidth: 0, height: 176, borderRadius: 19,
    borderWidth: 1, borderColor: "#43405C", backgroundColor: "#192033",
    paddingHorizontal: 13, paddingVertical: 12,
    justifyContent: "space-between",
  },
  destinationDense: { height: 154, paddingVertical: 10, paddingHorizontal: 11 },
  destinationVeryDense: { height: 142, paddingVertical: 8 },
  pressed: { opacity: 0.82 },
  destinationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 3 },
  destinationTitle: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "900" },
  chevron: { color: colors.accentLight, fontSize: 18, lineHeight: 22 },
  destinationCenter: { gap: 3 },
  destinationNumber: { color: colors.accentLight, fontSize: 25, lineHeight: 31, fontWeight: "900", fontVariant: ["tabular-nums"] },
  destinationNumberDense: { fontSize: 21, lineHeight: 27 },
  destinationCaption: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  destinationFoot: { gap: 8 },
  destinationTrack: { height: 5, backgroundColor: "#333951", borderRadius: 5, overflow: "hidden" },
  knowledgeFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 5 },
  readingFill: { height: "100%", backgroundColor: "#7CB8BA", borderRadius: 5 },
  destinationAction: { color: "#BAB0EF", fontSize: 11, lineHeight: 16, fontWeight: "800" },
});
