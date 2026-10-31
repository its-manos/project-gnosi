import { readingStateLabels, type ReadingState } from "../utils/readingDiscovery";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import LessonCover from "./LessonCover";
import { colors } from "../theme";

type Props = { lesson: Lesson; onPress: () => void; readingState?: ReadingState; lockedReason?: string; position?: number };

export default function LessonCard({ lesson, onPress, readingState, lockedReason, position }: Props) {
  return (
    <Pressable
      style={[styles.card, !!lockedReason && styles.locked]}
      onPress={onPress}
      disabled={!!lockedReason}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!lockedReason }}
      accessibilityLabel={`${lesson.title}${lockedReason ? `, Κλειδωμένο. ${lockedReason}` : readingState ? `, ${readingStateLabels[readingState]}` : ""}`}
    >
      <LessonCover lesson={lesson} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{position ? `ΒΗΜΑ ${position} · ` : ""}{lesson.readingMinutes} ΛΕΠΤΑ ΑΝΑΓΝΩΣΗΣ</Text>
        {lockedReason ? <Text style={styles.lockLabel}>Κλειδωμένο · {lockedReason}</Text> : readingState ? <Text style={[styles.readingState, readingState === "completed" && styles.completedState]}>{readingStateLabels[readingState]}</Text> : null}
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.summary}>{lesson.summary}</Text>
        <Text style={styles.meta}>{lesson.questions.length} ερωτήσεις · {lesson.sources.length} πηγές</Text>
        {lesson.contentNote ? <Text style={styles.contentNote}>Δύσκολο ιστορικό θέμα · χωρίς γραφικές περιγραφές</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  locked: { borderStyle: "dashed" },
  lockLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 9 },
  readingState: { color: "#B9D8CE", fontSize: 12, lineHeight: 20, marginBottom: 9, fontWeight: "600" },
  completedState: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 19,
    overflow: "hidden",
    marginBottom: 14,
  },
  image: { width: "100%", height: 165 },
  content: { padding: 17 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 7,
  },
  summary: {
    color: "#A7ACC1",
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 12,
  },
  contentNote: { color: "#D2C3A4", fontSize: 12, lineHeight: 19, marginTop: 10 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
