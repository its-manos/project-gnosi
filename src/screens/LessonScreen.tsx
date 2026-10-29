import { Linking, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import SourceLink from "../components/SourceLink";
import { colors } from "../theme";

type Props = { category: Category; subcategory: Subcategory; lesson: Lesson; onBack: () => void; onStartQuiz: () => void };

export default function LessonScreen({ category, subcategory, lesson, onBack, onStartQuiz }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} />
      <Text style={styles.eyebrow}>{category.title.toUpperCase()} / {subcategory.title.toUpperCase()}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.intro}>{lesson.intro}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>◷ {lesson.readingMinutes} λεπτά ανάγνωσης</Text>
        <Text style={styles.metaText}>{lesson.questions.length} ερωτήσεις</Text>
      </View>
      <Image source={{ uri: lesson.imageUrl }} style={styles.image} resizeMode="cover" />
      <Text style={styles.caption}>{lesson.imageCaption}</Text>
      <Pressable onPress={() => void Linking.openURL(lesson.imageCreditUrl).catch(() => {})}>
        <Text style={styles.credit}>Φωτογραφία: {lesson.imageCredit} ↗</Text>
      </Pressable>

      {lesson.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>
      ))}

      <View style={styles.sourcesCard}>
        <Text style={styles.sourcesTitle}>Πηγές & περαιτέρω ανάγνωση</Text>
        <Text style={styles.sourcesIntro}>Εξερεύνησε τις πηγές για να μάθεις περισσότερα για το θέμα.</Text>
        {lesson.sources.map((source) => <SourceLink key={source.url} source={source} />)}
      </View>

      <View style={styles.quizCallout}>
        <Text style={styles.quizTitle}>Ώρα να δοκιμάσεις όσα έμαθες</Text>
        <Text style={styles.body}>Απάντησε σε λίγες ερωτήσεις βασισμένες στο άρθρο.</Text>
        <ActionButton label="Ολοκλήρωσα την ανάγνωση →" onPress={onStartQuiz} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", lineHeight: 39, letterSpacing: -0.6, marginBottom: 13 },
  intro: { color: "#C5C7D6", fontSize: 16, lineHeight: 26, marginBottom: 17 },
  meta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 17 },
  metaText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  image: { width: "100%", height: 225, borderRadius: 20, backgroundColor: "#20263A" },
  caption: { color: "#B2B6C9", fontSize: 12, lineHeight: 19, marginTop: 10 },
  credit: { color: colors.accentLight, fontSize: 11, marginTop: 5, marginBottom: 27 },
  section: { marginBottom: 26 },
  sectionTitle: { color: "#F4F3FB", fontSize: 21, fontWeight: "800", lineHeight: 28, marginBottom: 13 },
  paragraph: { color: "#C4C7D6", fontSize: 15, lineHeight: 27, marginBottom: 15 },
  sourcesCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  sourcesTitle: { color: "#F4F3FB", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  sourcesIntro: { color: "#9EA4BA", fontSize: 13, lineHeight: 21, marginBottom: 13 },
  quizCallout: { backgroundColor: "#1B1B31", borderRadius: 21, padding: 20, borderWidth: 1, borderColor: "#3A345D", marginBottom: 12 },
  quizTitle: { color: "#F5F3FF", fontSize: 19, fontWeight: "800", lineHeight: 26, marginBottom: 9 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
});
