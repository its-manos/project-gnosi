import { getReadingState } from "../utils/readingDiscovery";
import { getLessonAccess } from "../utils/lessonPath";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import LessonCard from "../components/LessonCard";
import { colors } from "../theme";

type Props = {
  completedLessonIds: string[];
  inProgressLessonIds: string[];
  progressLoaded: boolean;
  lessons: Lesson[];
  catalogue: Lesson[];
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
  onRemoveSavedLesson: (lessonId: string) => void;
};

export default function SavedLessonsScreen({
  completedLessonIds,
  inProgressLessonIds,
  progressLoaded,
  lessons,
  catalogue,
  onBack,
  onOpenLesson,
  onRemoveSavedLesson,
}: Props) {
  return (
    <FlatList
      testID="saved-lessons-list"
      data={lessons}
      keyExtractor={(lesson) => lesson.id}
      renderItem={({ item: lesson }) => {
        const access = getLessonAccess(lesson, catalogue, completedLessonIds, inProgressLessonIds);
        return (
          <View style={styles.lessonItem}>
            <LessonCard lesson={lesson}
              readingState={progressLoaded ? getReadingState(lesson.id, completedLessonIds, inProgressLessonIds) : undefined}
              lockedReason={!progressLoaded ? "Φόρτωση προόδου…" : !access.unlocked ? `Ολοκλήρωσε πρώτα: ${access.prerequisite?.title}` : undefined}
              onPress={() => onOpenLesson(lesson.id)} />
            <Pressable onPress={() => onRemoveSavedLesson(lesson.id)}
              accessibilityRole="button" style={styles.removeButton}>
              <Text style={styles.removeText}>Αφαίρεση από αποθηκευμένα</Text>
            </Pressable>
          </View>
        );
      }}
      ListHeaderComponent={
        <View>
          <AppHeader onBack={onBack} backLabel="ΑΡΧΙΚΗ" />
          <Text style={styles.title}>Αποθηκευμένα άρθρα</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emoji}>🔖</Text>
          <Text style={styles.emptyTitle}>Η λίστα σου είναι ακόμη άδεια</Text>
          <Text style={styles.body}>
            Πάτησε τον σελιδοδείκτη σε ένα άρθρο για να το κρατήσεις εδώ.
          </Text>
          <ActionButton label="Επιστροφή στην αρχική" onPress={onBack} />
        </View>
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 38, marginBottom: 10 },
  intro: { color: "#A7ACC1", fontSize: 14, lineHeight: 23, marginBottom: 24 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 22, marginTop: 10 },
  emoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 10 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  lessonItem: { marginBottom: 16 },
  removeButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingVertical: 8, paddingHorizontal: 4 },
  removeText: { color: colors.accentLight, fontSize: 12, fontWeight: "700" },
});
