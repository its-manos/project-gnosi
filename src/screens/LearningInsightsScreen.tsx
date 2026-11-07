import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { Lesson } from "../data/lessons";
import { useMistakesModel } from "../hooks/useMistakesModel";
import KnowledgeMastery from "../components/KnowledgeMastery";
import { CategoryProgress } from "../components/LearningActivityPanel";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { MotionView, MotionXpCircle } from "../components/HomeMotion";
import { colors } from "../theme";

export type LearningInsightsView = "knowledge" | "reading";
const INSIGHT_RING_LENGTH = 2 * Math.PI * 34;

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
  const [completedLimit, setCompletedLimit] = useState(12);
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale >= 1.3;
  const wide = width >= 600 && fontScale < 1.3;
  // On short phones show one row initially; the rest stay one tap away.
  // At large text sizes the grid becomes a single readable column.
  const singleColumn = width < 325 || fontScale >= 1.3;
  const subjectLimit = height < 740 || fontScale >= 1.3 ? 2 : 4;
  const { model, ready: knowledgeReady } = useMistakesModel();

  const readingTab = view === "reading";
  const mastered = model.revised;
  const totalConcepts = model.total;
  const current = readingTab ? completedLessons.length : mastered;
  const total = readingTab ? totalLessonCount : totalConcepts;
  const ready = readingTab ? lessonProgressLoaded : knowledgeReady;
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round(current / total * 100))) : 0;

  return <View style={styles.screen} testID="learning-insights-screen">
    <ProgressGradientBackground />
    <View style={styles.foreground}>
      <MotionView entranceDelay={0} style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Πίσω στην πρόοδο"
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
          <Text style={styles.backText}>‹ ΠΡΟΟΔΟΣ</Text>
        </Pressable>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Η ΜΑΘΗΣΗ ΣΟΥ</Text>
        <View style={styles.headerSide} />
      </MotionView>

      <MotionView entranceDelay={60} style={styles.tabs} accessibilityRole="tablist">
        {(["knowledge", "reading"] as const).map(key => {
          const selected = view === key;
          return <Pressable key={key} accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab, selected && styles.selected,
              selected && key === "reading" && styles.selectedReading,
              pressed && styles.tabPressed,
            ]}
            onPress={() => {
              if (view === key) return;
              setView(key);
              onViewChange(key);
            }}>
            <Text style={[styles.tabText, selected && styles.selectedText,
              selected && key === "reading" && styles.selectedReadingText]}>
              {key === "knowledge" ? "✦  Γνώσεις" : "◇  Ανάγνωση"}
            </Text>
          </Pressable>;
        })}
      </MotionView>

      <ScrollView key={view} style={styles.scroll} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false} alwaysBounceVertical={false} bounces={false}>
        <MotionView entranceDelay={90} testID="insights-overview"
          style={[styles.overview, readingTab && styles.readingOverview]}>
          <View style={[styles.overviewAccent, readingTab && styles.readingAccentBar]}
            pointerEvents="none" />
          <View style={styles.overviewRow}>
            <View style={styles.overviewMain}>
              <Text style={[styles.overviewEyebrow, readingTab && styles.readingAccent]}>
                {readingTab ? "ΜΑΘΗΜΑΤΑ" : "ΛΑΘΗ ΠΟΥ ΔΙΟΡΘΩΣΕΣ"}
              </Text>
              <View style={styles.overviewValues}>
                <Text style={[styles.overviewValue, compact && styles.overviewValueCompact]}>
                  {ready ? current : "—"}
                </Text>
                <Text style={styles.overviewTotal}> / {total}</Text>
              </View>
            </View>
            <View testID="insights-ring" style={styles.ring}
              accessible accessibilityRole="progressbar"
              accessibilityLabel={readingTab ? "Ολοκλήρωση μαθημάτων" : "Διορθωμένα λάθη"}
              accessibilityValue={ready ? { min: 0, max: 100, now: percent } : { text: "Φόρτωση" }}>
              <Svg width="100%" height="100%" viewBox="0 0 88 88" pointerEvents="none">
                <Circle cx="44" cy="44" r="34" fill="none"
                  stroke={readingTab ? "#35515D" : "#3B3957"} strokeWidth={7} />
                {ready && percent > 0 ? <MotionXpCircle cx="44" cy="44" r="34" fill="none"
                  stroke={readingTab ? "#8BCACB" : colors.accent}
                  strokeWidth={7} strokeLinecap="round"
                  transform="rotate(-90 44 44)" circumference={INSIGHT_RING_LENGTH}
                  progress={percent / 100}
                  strokeDasharray={`${INSIGHT_RING_LENGTH * percent / 100} ${INSIGHT_RING_LENGTH}`} /> : null}
              </Svg>
              <Text testID="insights-overview-percent"
                style={[styles.ringPercent, readingTab && styles.readingAccent]}>
                {ready ? percent + "%" : "—"}
              </Text>
            </View>
          </View>
        </MotionView>

        {readingTab ? <View testID="learning-insights-reading" style={styles.details}>
          {lessonProgressLoaded ? (
            <MotionView entranceDelay={150}>
              <CategoryProgress detail detailLimit={subjectLimit} singleColumn={singleColumn} threeColumn={wide} />
            </MotionView>
          ) : <Text style={styles.empty}>Φόρτωση μαθημάτων…</Text>}
          {lessonProgressLoaded && completedLessons.length > 0 ? <>
            <MotionView entranceDelay={195}>
              <Pressable testID="insights-completed-toggle"
                style={({ pressed }) => [styles.disclosure, pressed && styles.disclosurePressed]}
                accessibilityRole="button" accessibilityState={{ expanded: lessonsExpanded }}
                onPress={() => {
                  setLessonsExpanded(previous => !previous);
                  setCompletedLimit(12);
                }}>
                <View style={styles.disclosureCopy}>
                  <Text style={styles.disclosureTitle}>Ολοκληρωμένα μαθήματα</Text>
                </View>
                <View style={styles.disclosureCountBadge}>
                  <Text style={styles.disclosureCount}>{completedLessons.length}</Text>
                </View>
                <Text style={styles.chevron}>{lessonsExpanded ? "⌃" : "⌄"}</Text>
              </Pressable>
            </MotionView>
            {lessonsExpanded ? <MotionView entranceDelay={0} style={styles.lessons}>
              {completedLessons.slice(0, completedLimit).map(lesson => (
                <Pressable key={lesson.id} style={({ pressed }) => [
                  styles.lesson, pressed && styles.lessonPressed,
                ]} accessibilityRole="button" onPress={() => onOpenLesson(lesson.id)}>
                  <View style={styles.lessonCheck}><Text style={styles.lessonCheckText}>✓</Text></View>
                  <Text style={styles.lessonText}>{lesson.title}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
              {completedLessons.length > completedLimit ? <Pressable testID="insights-completed-more"
                accessibilityRole="button" style={({ pressed }) => [styles.moreLessons, pressed && styles.disclosurePressed]}
                onPress={() => setCompletedLimit(value => value + 12)}>
                <Text style={styles.moreLessonsText}>Περισσότερα μαθήματα ({completedLessons.length - completedLimit}) ↓</Text>
              </Pressable> : null}
            </MotionView> : null}
          </> : lessonProgressLoaded
            ? <Text style={styles.empty}>Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ.</Text>
            : null}
        </View> : <View testID="learning-insights-knowledge" style={styles.details}>
          <MotionView entranceDelay={150}>
            <KnowledgeMastery onOpen={onKnowledgeReview} mapOnly detail subjectLimit={subjectLimit}
              singleColumn={singleColumn} threeColumn={wide} />
          </MotionView>
        </View>}
      </ScrollView>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, minHeight: 0, width: "100%", maxWidth: 720,
    alignSelf: "center", overflow: "hidden", backgroundColor: "#0D1827",
  },
  foreground: { flex: 1, minHeight: 0, paddingHorizontal: 16, paddingTop: 7 },
  header: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 82, minHeight: 44, justifyContent: "center", borderRadius: 12 },
  backPressed: { backgroundColor: "rgba(169, 155, 255, 0.10)" },
  backText: { color: colors.accentLight, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text,
    fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  headerTitleCompact: { fontSize: 11, letterSpacing: 0.4 },
  headerSide: { width: 82 },
  tabs: {
    flexDirection: "row", padding: 4, gap: 4, borderRadius: 15,
    backgroundColor: "#171B2C", borderWidth: 1, borderColor: "#34364D", marginTop: 8,
  },
  tab: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 11, paddingHorizontal: 6 },
  selected: { backgroundColor: "#322D4E" },
  selectedReading: { backgroundColor: "#213942" },
  tabPressed: { opacity: 0.8 },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
  selectedText: { color: "#C1B5FF", fontWeight: "900" },
  selectedReadingText: { color: "#9CD2D1" },
  scroll: { flex: 1, minHeight: 0 },
  content: { paddingTop: 11, paddingBottom: 15, gap: 11 },
  // Matched dimensions in both tabs; only semantic values and color accents differ.
  overview: {
    backgroundColor: "#1B2035", borderWidth: 1, borderColor: "#51496D",
    borderRadius: 19, paddingHorizontal: 15, paddingVertical: 10,
    minHeight: 100, justifyContent: "center", overflow: "hidden",
  },
  readingOverview: { backgroundColor: "#192A35", borderColor: "#385963" },
  overviewAccent: {
    position: "absolute", left: 18, top: -1, width: 88, height: 3,
    borderRadius: 3, backgroundColor: "#A99BFF",
  },
  readingAccentBar: { backgroundColor: "#8BCACB" },
  overviewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  overviewMain: { flex: 1, minWidth: 0, gap: 5 },
  overviewEyebrow: { color: "#B3A5FB", fontSize: 11, lineHeight: 17,
    fontWeight: "900", letterSpacing: 0.6 },
  readingAccent: { color: "#9CD2D1" },
  overviewValues: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  overviewValue: { color: colors.text, fontSize: 38, lineHeight: 46,
    fontWeight: "900", fontVariant: ["tabular-nums"] },
  overviewValueCompact: { fontSize: 30, lineHeight: 38 },
  overviewTotal: { color: colors.textMuted, fontSize: 17, lineHeight: 27, fontWeight: "700" },
  ring: { width: 74, height: 74, justifyContent: "center", alignItems: "center" },
  ringPercent: {
    position: "absolute", color: "#B8AAFF", fontSize: 18, lineHeight: 24,
    fontWeight: "900", fontVariant: ["tabular-nums"],
  },
  details: { gap: 10 },
  empty: {
    color: colors.textMuted, fontSize: 13, lineHeight: 21, paddingHorizontal: 6, paddingVertical: 9,
  },
  disclosure: {
    minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#18232F", borderWidth: 1, borderColor: "#38515B",
    borderRadius: 15, paddingHorizontal: 13, paddingVertical: 7,
  },
  disclosurePressed: { backgroundColor: "#233947" },
  disclosureCopy: { flex: 1, minWidth: 0, gap: 3 },
  disclosureTitle: { color: colors.text, fontSize: 14, fontWeight: "800", lineHeight: 20 },
  disclosureCountBadge: {
    minWidth: 28, paddingHorizontal: 7, height: 26, alignItems: "center", justifyContent: "center",
    borderRadius: 13, backgroundColor: "#304B51",
  },
  disclosureCount: { color: "#A2D8D6", fontWeight: "900", fontSize: 12 },
  chevron: { color: "#9CD2D1", fontSize: 20, lineHeight: 25 },
  lessons: {
    borderRadius: 17, backgroundColor: "#17202D", borderColor: "#334453",
    borderWidth: 1, overflow: "hidden",
  },
  lesson: {
    minHeight: 50, paddingHorizontal: 12, paddingVertical: 9,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#364456",
  },
  lessonPressed: { backgroundColor: "#253545" },
  lessonCheck: {
    width: 23, height: 23, borderRadius: 12, justifyContent: "center", alignItems: "center",
    backgroundColor: "#254640",
  },
  lessonCheckText: { color: "#94D7BD", fontSize: 12, fontWeight: "800" },
  lessonText: { flex: 1, color: colors.textBody, fontSize: 13, lineHeight: 20 },
  moreLessons: { minHeight: 46, justifyContent: "center", paddingHorizontal: 14 },
  moreLessonsText: { color: "#9CD2D1", fontSize: 13, fontWeight: "800" },
});
