import { Linking, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import { inlineArticleMedia } from "../data/articleMedia";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import ArticleFigure from "../components/ArticleFigure";
import InlineQuestionCard from "../components/InlineQuestionCard";
import SourceLink from "../components/SourceLink";
import { colors } from "../theme";

type Props = {
  category: Category;
  subcategory: Subcategory;
  lesson: Lesson;
  isSaved: boolean;
  bookmarksLoaded: boolean;
  onToggleSaved: (lessonId: string) => void;
  checkpointAnswers: Record<number, number>;
  onAnswerCheckpoint: (questionIndex: number, answerIndex: number, correctIndex: number) => void;
  onFinishLesson: () => void;
  onBack: () => void;
};

function getParagraphCount(lesson: Lesson): number {
  return lesson.sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
}

export function getInlineQuestionCount(lesson: Lesson): number {
  return Math.min(lesson.questions.length, Math.floor(getParagraphCount(lesson) / 2));
}

export default function LessonScreen({
  category,
  subcategory,
  lesson,
  isSaved,
  bookmarksLoaded,
  onToggleSaved,
  checkpointAnswers,
  onAnswerCheckpoint,
  onFinishLesson,
  onBack,
}: Props) {
  const paragraphCount = getParagraphCount(lesson);
  const inlineQuestionCount = getInlineQuestionCount(lesson);
  const answeredCount = Array.from({ length: inlineQuestionCount }, (_, index) => index)
    .filter((index) => checkpointAnswers[index] !== undefined).length;
  const remainingCount = inlineQuestionCount - answeredCount;
  const mediaByParagraphCount = inlineArticleMedia[lesson.id] ?? [];

  // Reveal article content in pairs of paragraphs. Each unanswered
  // checkpoint keeps the paragraphs after it hidden until the learner answers.
  const firstUnansweredQuestion = Array.from(
    { length: inlineQuestionCount },
    (_, index) => index
  ).find((index) => checkpointAnswers[index] === undefined) ?? -1;

  const visibleParagraphLimit = firstUnansweredQuestion === -1
    ? paragraphCount
    : (firstUnansweredQuestion + 1) * 2;

  // Store each section's absolute paragraph position so question placement
  // remains consistent across section boundaries.
  let paragraphOffset = 0;
  const sectionsWithPositions = lesson.sections.map((section) => {
    const startParagraphNumber = paragraphOffset + 1;
    paragraphOffset += section.paragraphs.length;
    return { ...section, startParagraphNumber };
  });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} />
      <Text style={styles.eyebrow}>{category.title.toUpperCase()} / {subcategory.title.toUpperCase()}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.intro}>{lesson.intro}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>◷ {lesson.readingMinutes} λεπτά ανάγνωσης</Text>
        <Text style={styles.metaText}>{inlineQuestionCount} μικρές ερωτήσεις</Text>
      </View>

      <ActionButton
        label={isSaved ? "✓ Αποθηκευμένο — αφαίρεση" : "🔖 Αποθήκευση άρθρου"}
        onPress={() => onToggleSaved(lesson.id)}
        secondary={!isSaved}
        disabled={!bookmarksLoaded}
      />

      <Image source={{ uri: lesson.imageUrl }} style={styles.image} resizeMode="cover" />
      <Text style={styles.caption}>{lesson.imageCaption}</Text>
      <Pressable onPress={() => void Linking.openURL(lesson.imageCreditUrl).catch(() => {})}>
        <Text style={styles.credit}>Φωτογραφία: {lesson.imageCredit} ↗</Text>
      </Pressable>

      {sectionsWithPositions.map((section) => {
        // Don't reveal a section heading until its first paragraph is unlocked.
        if (section.startParagraphNumber > visibleParagraphLimit) return null;

        return (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => {
              const paragraphNumber = section.startParagraphNumber + index;
              if (paragraphNumber > visibleParagraphLimit) return null;

              const figureList = mediaByParagraphCount.filter(
                (figure) => figure.afterParagraphCount === paragraphNumber
              );
              const questionIndex = paragraphNumber % 2 === 0
                ? paragraphNumber / 2 - 1
                : -1;
              const checkpoint = questionIndex >= 0 && questionIndex < inlineQuestionCount
                ? lesson.questions[questionIndex]
                : undefined;

              return (
                <View key={`${section.title}-${paragraphNumber}`}>
                  <Text style={styles.paragraph}>{paragraph}</Text>

                  {figureList.map((figure) => (
                    <ArticleFigure key={`${lesson.id}-${figure.afterParagraphCount}`} figure={figure} />
                  ))}

                  {checkpoint && (
                    <InlineQuestionCard
                      question={checkpoint}
                      questionNumber={questionIndex + 1}
                      selectedAnswer={checkpointAnswers[questionIndex]}
                      onSelectAnswer={(answerIndex, correctIndex) =>
                        onAnswerCheckpoint(questionIndex, answerIndex, correctIndex)
                      }
                    />
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      {remainingCount > 0 && (
        <View style={styles.lockedNotice}>
          <Text style={styles.lockedNoticeIcon}>✦</Text>
          <Text style={styles.lockedNoticeTitle}>Συνέχισε την ανακάλυψη</Text>
          <Text style={styles.lockedNoticeBody}>
            Απάντησε στην παραπάνω ερώτηση για να ξεκλειδώσεις τη συνέχεια του άρθρου.
          </Text>
        </View>
      )}

      {remainingCount === 0 && (
        <>
          <View style={styles.sourcesCard}>
            <Text style={styles.sourcesTitle}>Πηγές & περαιτέρω ανάγνωση</Text>
            <Text style={styles.sourcesIntro}>Οι πηγές πίσω από το άρθρο — για όποιον θέλει να συνεχίσει την εξερεύνηση.</Text>
            {lesson.sources.map((source) => <SourceLink key={source.url} source={source} />)}
          </View>

          <View style={styles.finishCard}>
            <Text style={styles.finishTitle}>Έφτασες στο τέλος του άρθρου.</Text>
            <Text style={styles.finishBody}>
              Απάντησες σε όλες τις μικρές ερωτήσεις. Είσαι έτοιμος να δεις πώς τα πήγες.
            </Text>
            <ActionButton
              label="Ολοκλήρωση μαθήματος →"
              onPress={onFinishLesson}
              disabled={inlineQuestionCount === 0}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", lineHeight: 39, letterSpacing: -0.6, marginBottom: 13 },
  intro: { color: "#C5C7D6", fontSize: 16, lineHeight: 26, marginBottom: 17 },
  meta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 2 },
  metaText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  image: { width: "100%", height: 225, borderRadius: 20, backgroundColor: "#20263A", marginTop: 22 },
  caption: { color: "#B2B6C9", fontSize: 12, lineHeight: 19, marginTop: 10 },
  credit: { color: colors.accentLight, fontSize: 11, marginTop: 5, marginBottom: 27 },
  section: { marginBottom: 14 },
  sectionTitle: { color: "#F4F3FB", fontSize: 21, fontWeight: "800", lineHeight: 28, marginBottom: 13 },
  paragraph: { color: "#C4C7D6", fontSize: 15, lineHeight: 27, marginBottom: 15 },
  sourcesCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  sourcesTitle: { color: "#F4F3FB", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  sourcesIntro: { color: "#9EA4BA", fontSize: 13, lineHeight: 21, marginBottom: 13 },
  finishCard: { backgroundColor: "#1B1B31", borderRadius: 21, padding: 20, borderWidth: 1, borderColor: "#3A345D", marginBottom: 12 },
  finishTitle: { color: "#F5F3FF", fontSize: 19, fontWeight: "800", lineHeight: 26, marginBottom: 9 },
  finishBody: { color: "#A7ACC1", fontSize: 14, lineHeight: 23 },
  lockedNotice: {
    backgroundColor: "#171B2C",
    borderColor: "#393453",
    borderWidth: 1,
    borderRadius: 17,
    padding: 17,
    alignItems: "center",
    marginTop: 2,
    marginBottom: 25,
  },
  lockedNoticeIcon: { color: colors.accentLight, fontSize: 20, marginBottom: 7 },
  lockedNoticeTitle: { color: colors.text, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  lockedNoticeBody: { color: "#A7ACC1", fontSize: 12, lineHeight: 19, textAlign: "center" },
});
