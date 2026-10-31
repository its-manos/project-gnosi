import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import KnowledgeMastery from "../components/KnowledgeMastery";
import ReviewActions from "../components/ReviewActions";
import { CategoryProgress } from "../components/LearningActivityPanel";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

type Props = {
  initialView?: "knowledge" | "reading"; onViewChange?: (view: "knowledge" | "reading") => void;
  onKnowledgeReview: () => void; onWeeklyReview?: () => void; onOpenProfile: () => void; onHome: () => void;
  completedLessons: Lesson[]; inProgressLesson: Lesson | null; inProgressAnsweredCount: number;
  inProgressQuestionCount: number; inProgressLessonCount: number; totalLessonCount: number;
  lessonProgressLoaded: boolean; onOpenLesson: (id: string) => void;
};
export default function ProgressScreen({ initialView = "knowledge", onViewChange, onKnowledgeReview, onWeeklyReview, onOpenProfile, onHome, completedLessons, inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount, inProgressLessonCount, totalLessonCount, lessonProgressLoaded, onOpenLesson }: Props) {
  const [view, setView] = useState<"knowledge" | "reading">(initialView);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" /><SyncStatus quiet />
    <View style={styles.heading} testID="progress-heading"><View style={styles.copy}><Text style={styles.title}>Η πρόοδός σου</Text><Text style={styles.body}>Κάθε μικρό βήμα μετράει.</Text></View><Pressable style={styles.profile} accessibilityRole="button" accessibilityLabel="Το προφίλ μου" onPress={onOpenProfile}><Text style={styles.link}>Προφίλ ↗</Text></Pressable></View>
    {inProgressLesson && lessonProgressLoaded ? <Pressable testID="progress-resume" style={styles.resume} onPress={() => onOpenLesson(inProgressLesson.id)} accessibilityRole="button" accessibilityLabel={`Συνέχισε το μάθημα ${inProgressLesson.title}`}><View style={styles.copy}><Text style={styles.label}>ΣΥΝΕΧΙΣΕ ΤΟ ΜΑΘΗΜΑ</Text><Text style={styles.rowTitle}>{inProgressLesson.title}</Text><Text style={styles.body}>{inProgressAnsweredCount} / {inProgressQuestionCount} ερωτήσεις{inProgressLessonCount > 1 ? ` · ${inProgressLessonCount} μαθήματα σε εξέλιξη` : ""}</Text></View><Text style={styles.arrow}>→</Text></Pressable> : null}
    <ReviewActions onReview={onKnowledgeReview} onWeeklyReview={onWeeklyReview} onExplore={onHome} />
    <View style={styles.section} testID="progress-learning">
      <View style={styles.tabs} accessibilityRole="tablist">{([['knowledge', 'Γνώσεις'], ['reading', 'Ανάγνωση']] as const).map(([key, title]) => <Pressable key={key} style={[styles.tab, view === key && styles.selected]} accessibilityRole="tab" accessibilityState={{ selected: view === key }} onPress={() => { setView(key); onViewChange?.(key); }}><Text style={[styles.tabText, view === key && styles.link]}>{title}</Text></Pressable>)}</View>
      {view === "knowledge" ? <KnowledgeMastery onOpen={onKnowledgeReview} mapOnly /> : <View testID="progress-reading" style={styles.section}>
        <Text style={styles.rowTitle}>{lessonProgressLoaded ? completedLessons.length : "—"} / {totalLessonCount} μαθήματα ολοκληρωμένα</Text>
        <Text style={styles.body}>Τα άρθρα που εξερεύνησες, ξεχωριστά από όσα συγκρατείς.</Text>
        <CategoryProgress />
        {completedLessons.length ? <><Pressable style={styles.disclosure} accessibilityRole="button" accessibilityState={{ expanded: lessonsExpanded }} onPress={() => setLessonsExpanded(v => !v)}><Text style={styles.link}>Ολοκληρωμένα μαθήματα {lessonsExpanded ? '−' : '+'}</Text></Pressable>{lessonsExpanded ? completedLessons.map(lesson => <Pressable key={lesson.id} style={styles.lesson} accessibilityRole="button" onPress={() => onOpenLesson(lesson.id)}><Text style={styles.lessonText}>✓ {lesson.title}</Text><Text style={styles.arrow}>›</Text></Pressable>) : null}</> : null}
      </View>}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 20, paddingBottom: 40, gap: 20 }, heading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }, copy: { flex: 1, gap: 6 }, title: { color: colors.text, fontSize: 29, lineHeight: 38, fontWeight: "900" }, body: { color: colors.textMuted, fontSize: 13, lineHeight: 22 }, profile: { minHeight: 44, paddingHorizontal: 14, borderRadius: 16, justifyContent: "center", backgroundColor: colors.surface }, link: { color: colors.accentLight, fontSize: 13, fontWeight: "700", lineHeight: 22 }, resume: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 }, label: { color: colors.accentLight, fontSize: 10, lineHeight: 18, fontWeight: "800" }, rowTitle: { color: colors.text, fontSize: 16, lineHeight: 25, fontWeight: "800" }, arrow: { color: colors.accentLight, fontSize: 24 }, section: { gap: 16 }, tabs: { flexDirection: "row", padding: 4, backgroundColor: colors.surface, borderRadius: 16, gap: 4 }, tab: { flex: 1, minHeight: 44, padding: 10, justifyContent: "center", alignItems: "center", borderRadius: 12 }, selected: { backgroundColor: colors.accentSurface }, tabText: { color: colors.textMuted, fontSize: 14, lineHeight: 22, fontWeight: "700" }, disclosure: { minHeight: 48, justifyContent: "center" }, lesson: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 }, lessonText: { flex: 1, color: colors.textBody, fontSize: 14, lineHeight: 23 } });
