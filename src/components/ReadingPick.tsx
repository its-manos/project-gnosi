import { Pressable, StyleSheet, Text, View } from "react-native";
import { categories, type Lesson } from "../data/lessons";
import { colors } from "../theme";

export default function ReadingPick({ lesson, label, onPress, featured = false }: {
  lesson: Lesson; label: string; onPress: () => void; featured?: boolean;
}) {
  const category = categories.find((item) => item.id === lesson.categoryId);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${lesson.title}, ${lesson.readingMinutes} λεπτά ανάγνωσης`}
      style={({ pressed }) => [styles.card, featured && styles.featured, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.context}><Text style={styles.category}>{category?.emoji} {category?.title}</Text><Text style={styles.state}>Αδιάβαστο</Text></View>
      <Text style={[styles.title, featured && styles.featuredTitle]}>{lesson.title}</Text>
      {featured ? <Text style={styles.summary}>{lesson.summary}</Text> : null}
      {lesson.contentNote ? <Text style={styles.note}>Δύσκολο ιστορικό θέμα · χωρίς γραφικές περιγραφές</Text> : null}
      <Text style={styles.meta}>{lesson.readingMinutes} λεπτά · {lesson.sources.length} πηγές · Διάβασε →</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, marginBottom: 12, gap: 10 },
  featured: { backgroundColor: "#202634", borderColor: "#514B6A", padding: 21 },
  pressed: { opacity: 0.75 },
  label: { color: colors.accentLight, fontSize: 11, lineHeight: 17, fontWeight: "800", letterSpacing: 0.7 },
  context: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  category: { color: colors.textMuted, fontSize: 12, lineHeight: 20, flexShrink: 1 },
  state: { color: "#B9D8CE", fontSize: 11, lineHeight: 18 },
  title: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "700" },
  featuredTitle: { fontSize: 23, lineHeight: 32 },
  summary: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  note: { color: "#D2C3A4", fontSize: 12, lineHeight: 19 },
  meta: { color: colors.accentLight, fontSize: 12, lineHeight: 20, fontWeight: "600" },
});
