import { availableScreenHeight, stableLayoutHeight } from "../utils/screenLayout";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { categories, type Lesson } from "../data/lessons";
import type { LearningInsightsView } from "./LearningInsightsScreen";
import { useMistakesModel } from "../hooks/useMistakesModel";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { MotionView, MotionPressable, MotionXpCircle, MotionCounter } from "../components/HomeMotion";
import { ProgressBarFill, ProgressRingGlow } from "../components/ProgressMotion";
import ProgressTrack from "../components/ProgressTrack";
import ReviewActions from "../components/ReviewActions";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

type Props = {
  onOpenInsights: (view: LearningInsightsView) => void;
  onKnowledgeReview: () => void;
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
  onOpenInsights, onKnowledgeReview, onOpenProfile, onHome,
  completedLessons, inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  inProgressLessonCount, totalLessonCount, lessonProgressLoaded, onOpenLesson,
}: Props) {
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const { model, ready: knowledgeReady } = useMistakesModel();

  // Measure inside the app's safe area, ABOVE the bottom navigation.
  // Normal devices render a fixed page, not a tall, rubber-band ScrollView.
  const availableHeight = availableScreenHeight(viewportHeight, windowHeight);
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
  const mastered = model.revised;
  const totalConcepts = model.total;
  const masteryPercent = totalConcepts ? Math.round(mastered / totalConcepts * 100) : 0;
  const onViewportLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setViewportHeight(previous => stableLayoutHeight(previous, next));
  };
  const contentStyle = [
    styles.content, roomy && styles.contentRoomy,
    dense && styles.contentDense, veryDense && styles.contentVeryDense,
  ];

  const dashboard = <>
    <SyncStatus quiet />
    <MotionView entranceDelay={0} style={styles.heading} testID="progress-heading">
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Ο ΧΑΡΤΗΣ ΤΗΣ ΜΑΘΗΣΗΣ</Text>
        <Text style={[styles.title, veryDense && styles.titleDense]}>Η πρόοδός σου</Text>
      </View>
      <Pressable style={({ pressed }) => [styles.profile, pressed && styles.profilePressed]} accessibilityRole="button"
        accessibilityLabel="Το προφίλ μου" onPress={onOpenProfile}>
        <Text style={styles.link}>Προφίλ ↗</Text>
      </Pressable>
    </MotionView>

    <MotionView entranceDelay={70} testID="progress-summary" style={[styles.summary, veryDense && styles.summaryDense]}>
      <View style={[styles.ring, veryDense && styles.ringDense]} accessible
        accessibilityRole="progressbar" accessibilityLabel="Ολοκλήρωση μαθημάτων"
        accessibilityValue={lessonProgressLoaded
          ? { min: 0, max: 100, now: percent } : { text: "Φόρτωση προόδου" }}>
        <ProgressRingGlow ready={lessonProgressLoaded} progress={percent} />
        <Svg width="100%" height="100%" viewBox="0 0 80 80" pointerEvents="none">
          <Circle cx="40" cy="40" r="31" fill="none" stroke="#3C405A" strokeWidth="6" />
          {lessonProgressLoaded && percent > 0 ? (
            <MotionXpCircle cx="40" cy="40" r="31" fill="none"
              stroke={colors.accent} strokeWidth={6} strokeLinecap="round"
              transform="rotate(-90 40 40)" circumference={RING_CIRCUMFERENCE}
              progress={percent / 100}
              strokeDasharray={`${RING_CIRCUMFERENCE * percent / 100} ${RING_CIRCUMFERENCE}`} />
          ) : null}
        </Svg>
        <Text style={styles.ringValue}>{lessonProgressLoaded ? percent + "%" : "—"}</Text>
      </View>
      <View style={styles.summaryBody}>
        <Text style={styles.summaryTitle}>Οι ανακαλύψεις σου</Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <MotionCounter progressKey={`lessons-${lessonProgressLoaded ? completedCount : "loading"}`}
              style={styles.metricValue} numberOfLines={1}>
              {lessonProgressLoaded ? completedCount : "—"}
              <Text style={styles.metricTotal}> / {totalLessonCount}</Text>
            </MotionCounter>
            <Text style={styles.metricLabel}>μαθήματα</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <MotionCounter progressKey={`worlds-${lessonProgressLoaded ? exploredCount : "loading"}`}
              style={styles.metricValue} numberOfLines={1}>
              {lessonProgressLoaded ? exploredCount : "—"}
              <Text style={styles.metricTotal}> / {categories.length}</Text>
            </MotionCounter>
            <Text style={styles.metricLabel}>κόσμοι</Text>
          </View>
        </View>
      </View>
    </MotionView>

    <MotionView entranceDelay={140}>
      <ReviewActions
        onReview={onKnowledgeReview} onExplore={onHome}
        inProgressLesson={inProgressLesson}
        inProgressAnsweredCount={inProgressAnsweredCount}
        inProgressQuestionCount={inProgressQuestionCount}
        inProgressLessonCount={inProgressLessonCount}
        lessonProgressLoaded={lessonProgressLoaded}
        onResumeLesson={onOpenLesson} dense={dense}
      />
    </MotionView>

    <View style={styles.learning} testID="progress-learning">
      <MotionView entranceDelay={205} style={styles.learningHeadingRow}>
        <Text style={styles.learningHeading}>Η μάθησή σου</Text>
        <View style={styles.learningHeadingRule} />
      </MotionView>
      <View style={styles.destinations}>
        <MotionPressable testID="progress-knowledge-link" entranceDelay={235} pressScale={0.983}
          style={[styles.destination, dense && styles.destinationDense,
            veryDense && styles.destinationVeryDense]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα γνώσεων"
          onPress={() => onOpenInsights("knowledge")}>
          <View pointerEvents="none" style={[styles.destinationAccent, styles.knowledgeAccent]} />
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationTitle}>✦  Γνώσεις</Text>
            <Text style={styles.chevron}>↗</Text>
          </View>
          <View style={styles.destinationCenter}>
            <MotionCounter progressKey={`mastery-${knowledgeReady ? mastered + "-" + totalConcepts : "loading"}`}
              style={[styles.destinationNumber, veryDense && styles.destinationNumberDense]}
              numberOfLines={1}>
              {knowledgeReady ? mastered + " / " + totalConcepts : "—"}
            </MotionCounter>
            <Text style={styles.destinationCaption} numberOfLines={1}>λάθη που διόρθωσες</Text>
          </View>
          <View style={styles.destinationFoot}>
            <ProgressTrack variant="destination" accessible={false}>
              <ProgressBarFill tone="knowledge" percent={knowledgeReady ? masteryPercent : 0} />
            </ProgressTrack>
            <Text style={styles.destinationAction}>Δες την ανάλυση  ›</Text>
          </View>
        </MotionPressable>
        <MotionPressable testID="progress-reading-link" entranceDelay={290} pressScale={0.983}
          style={[styles.destination, styles.readingDestination, dense && styles.destinationDense,
            veryDense && styles.destinationVeryDense]}
          accessibilityRole="button" accessibilityLabel="Άνοιγμα ανάγνωσης"
          onPress={() => onOpenInsights("reading")}>
          <View pointerEvents="none" style={[styles.destinationAccent, styles.readingAccent]} />
          <View style={styles.destinationHeader}>
            <Text style={styles.destinationTitle}>◇  Ανάγνωση</Text>
            <Text style={[styles.chevron, styles.readingChevron]}>↗</Text>
          </View>
          <View style={styles.destinationCenter}>
            <MotionCounter progressKey={`reading-${lessonProgressLoaded ? completedCount : "loading"}`}
              style={[styles.destinationNumber, styles.readingNumber, veryDense && styles.destinationNumberDense]}
              numberOfLines={1}>
              {lessonProgressLoaded ? completedCount + " / " + totalLessonCount : "—"}
            </MotionCounter>
            <Text style={styles.destinationCaption} numberOfLines={1}>μαθήματα ολοκληρωμένα</Text>
          </View>
          <View style={styles.destinationFoot}>
            <ProgressTrack variant="destination" accessible={false}>
              <ProgressBarFill tone="reading" percent={lessonProgressLoaded ? percent : 0} />
            </ProgressTrack>
            <Text style={[styles.destinationAction, styles.readingAction]}>Δες την ανάλυση  ›</Text>
          </View>
        </MotionPressable>
      </View>
    </View>
  </>;

  return (
    <View testID="progress-shell" onLayout={onViewportLayout} style={styles.screen}>
      <ProgressGradientBackground />
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
  profilePressed: { backgroundColor: "#292A47", borderColor: "#655A8A" },
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
  learningHeadingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  learningHeadingRule: { flex: 1, height: 1, backgroundColor: "rgba(188, 176, 223, 0.2)" },
  destinations: { flexDirection: "row", gap: 10 },
  destination: {
    flex: 1, minWidth: 0, height: 176, borderRadius: 19,
    borderWidth: 1, borderColor: "#43405C", backgroundColor: "#192033",
    paddingHorizontal: 13, paddingVertical: 12,
    justifyContent: "space-between",
  },
  readingDestination: { backgroundColor: "#182631", borderColor: "#35515D" },
  destinationAccent: {
    position: "absolute", top: -1, left: 17, width: 55,
    height: 2, borderRadius: 2,
  },
  knowledgeAccent: { backgroundColor: "#A99BFF" },
  readingAccent: { backgroundColor: "#82C4C7" },
  destinationDense: { height: 154, paddingVertical: 10, paddingHorizontal: 11 },
  destinationVeryDense: { height: 142, paddingVertical: 8 },
  destinationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 3 },
  destinationTitle: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "900" },
  chevron: { color: colors.accentLight, fontSize: 18, lineHeight: 22 },
  readingChevron: { color: "#8CC9CA" },
  destinationCenter: { gap: 3 },
  destinationNumber: { color: colors.accentLight, fontSize: 25, lineHeight: 31, fontWeight: "900", fontVariant: ["tabular-nums"] },
  destinationNumberDense: { fontSize: 21, lineHeight: 27 },
  readingNumber: { color: "#9CD2D1" },
  destinationCaption: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  destinationFoot: { gap: 8 },
  destinationAction: { color: "#BAB0EF", fontSize: 11, lineHeight: 16, fontWeight: "800" },
  readingAction: { color: "#9BCBCB" },
});
