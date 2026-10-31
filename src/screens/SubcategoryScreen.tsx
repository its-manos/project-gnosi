import { getReadingState } from "../utils/readingDiscovery";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import LessonCard from "../components/LessonCard";
import { colors } from "../theme";
import { getLessonAccess, getSubcategoryPath } from "../utils/lessonPath";

type Props = {
  completedLessonIds: string[];
  inProgressLessonIds: string[];
  progressLoaded: boolean;
  category: Category;
  subcategory: Subcategory;
  lessons: Lesson[];
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
};

export default function SubcategoryScreen({ category, subcategory, lessons, onBack, onOpenLesson, completedLessonIds, inProgressLessonIds, progressLoaded }: Props) {
  const path = getSubcategoryPath(lessons, subcategory.id);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} />
      <Text style={styles.eyebrow}>{category.title.toUpperCase()}</Text>
      <Text style={styles.title}>{subcategory.title}</Text>
      <Text style={styles.body}>{subcategory.description}</Text>
      <Text style={styles.sectionTitle}>Μαθήματα</Text>
      {path.length > 1 ? <Text style={styles.pathHint}>Ολοκλήρωσε ένα μάθημα για να ανοίξεις το επόμενο.</Text> : null}
      {path.length > 0 ? path.map((lesson, index) => {
        const access = getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds);
        return <LessonCard key={lesson.id} lesson={lesson} position={index + 1}
          lockedReason={!progressLoaded ? "Φόρτωση προόδου…" : !access.unlocked ? `Ολοκλήρωσε πρώτα: ${access.prerequisite?.title}` : undefined}
          readingState={progressLoaded ? getReadingState(lesson.id, completedLessonIds, inProgressLessonIds) : undefined} onPress={() => onOpenLesson(lesson.id)} />;
      }) : (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>Νέα μαθήματα έρχονται</Text>
          <Text style={styles.body}>Εξερεύνησε μια άλλη περιοχή μέχρι τότε.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pathHint: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginBottom: 18 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  sectionTitle: { color: "#F4F3FB", fontSize: 20, fontWeight: "800", marginTop: 32, marginBottom: 17 },
  empty: { backgroundColor: colors.surface, borderRadius: 20, padding: 22, marginTop: 12, borderWidth: 1, borderColor: "#282D41" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 12 },
});
