import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ResilientImage from "./ResilientImage";
import { colors } from "../theme";

type Props = { lesson: Lesson; onPress: () => void };

export default function LessonCard({ lesson, onPress }: Props) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Άνοιγμα μαθήματος: ${lesson.title}`}
    >
      <ResilientImage
        uri={lesson.imageUrl}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={lesson.title}
        fallbackLabel="Η φωτογραφία του μαθήματος δεν είναι διαθέσιμη"
        loadingLabel="Φόρτωση φωτογραφίας…"
      />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{lesson.readingMinutes} ΛΕΠΤΑ ΑΝΑΓΝΩΣΗΣ</Text>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.summary}>{lesson.summary}</Text>
        <Text style={styles.meta}>{lesson.questions.length} ερωτήσεις</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
