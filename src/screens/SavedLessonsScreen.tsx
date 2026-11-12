import { getReadingState } from "../utils/readingDiscovery";
import { getLessonAccess } from "../utils/lessonPath";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppBackground from "../components/AppBackground";
import LessonCard from "../components/LessonCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
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
  const savedCount = lessons.length === 1
    ? "1 αποθηκευμένο άρθρο"
    : `${lessons.length} αποθηκευμένα άρθρα`;

  return (
    <View style={styles.screen} testID="saved-lessons-screen">
      <AppBackground />
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
                accessibilityRole="button"
                accessibilityLabel={`Αφαίρεση από αποθηκευμένα: ${lesson.title}`}
                style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}>
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  accessible={false} pointerEvents="none">
                  <Path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z" stroke={colors.accentLight}
                    strokeWidth={1.8} strokeLinejoin="round" />
                </Svg>
                <Text style={styles.removeText}>Αφαίρεση</Text>
              </Pressable>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ProfileSectionHeader title="Αποθηκευμένα"
              actionLabel="‹ Προφίλ" actionAccessibilityLabel="Πίσω στο προφίλ"
              onAction={onBack} />
            <View style={styles.libraryHeading}>
              <Text style={styles.eyebrow}>Η ΒΙΒΛΙΟΘΗΚΗ ΣΟΥ</Text>
              {lessons.length > 0 ? <Text style={styles.intro}>{savedCount} για να συνεχίσεις όποτε θέλεις.</Text> : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon} accessible={false}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z" stroke={colors.accentLight}
                  strokeWidth={1.7} strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>Η βιβλιοθήκη σου είναι άδεια</Text>
            <Text style={styles.body}>
              Πάτησε τον σελιδοδείκτη σε ένα άρθρο για να το κρατήσεις εδώ.
            </Text>
            <ActionButton label="Επιστροφή στο προφίλ" onPress={onBack} />
          </View>
        }
        contentContainerStyle={[styles.content, lessons.length === 0 && styles.emptyContent]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: "#0D1827" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top,
    paddingBottom: 36 },
  emptyContent: { flexGrow: 1 },
  header: { marginBottom: 15 },
  libraryHeading: { marginTop: 7, gap: 3 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, lineHeight: 16 },
  intro: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  emptyCard: { backgroundColor: "#192337", borderWidth: 1, borderColor: "#41465D",
    borderRadius: 20, padding: 22, marginTop: 4, gap: 10, alignItems: "center" },
  emptyIcon: { width: 54, height: 54, borderRadius: 17, alignItems: "center",
    justifyContent: "center", backgroundColor: "#2B2948", borderWidth: 1,
    borderColor: "#575078", marginBottom: 2 },
  emptyTitle: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: "900",
    textAlign: "center" },
  body: { color: colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: "center",
    marginBottom: 5 },
  lessonItem: { marginBottom: 18 },
  removeButton: { alignSelf: "flex-end", minHeight: 44, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12,
    marginTop: -7, borderRadius: 12, backgroundColor: "#1A2538",
    borderWidth: 1, borderColor: "#38435C" },
  removeButtonPressed: { backgroundColor: "#2D304A", borderColor: "#655A8A" },
  removeText: { color: colors.accentLight, fontSize: 12, fontWeight: "700" },
});
