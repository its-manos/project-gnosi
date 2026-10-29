
import { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  categories,
  subcategories,
  lessons,
} from "./src/data/lessons";

type Screen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results";

function Header({
  onBack,
  backLabel = "ΠΙΣΩ",
}: {
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          style={styles.headerSide}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>‹ {backLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}

      <Text style={styles.logo}>ΓΝΩΣΗ</Text>

      <View style={[styles.headerSide, styles.headerRight]}>
        <Text style={styles.logoSparkle}>✦</Text>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.actionButton,
        secondary && styles.secondaryButton,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          secondary && styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("home");

  const [activeCategoryId, setActiveCategoryId] =
    useState("history");

  const [activeSubcategoryId, setActiveSubcategoryId] =
    useState("ancient-greece");

  const [activeLessonId, setActiveLessonId] =
    useState(lessons[0].id);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [score, setScore] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] =
    useState<string[]>([]);

  const activeCategory =
    categories.find(
      (category) => category.id === activeCategoryId
    ) ?? categories[0];

  const activeSubcategory =
    subcategories.find(
      (subcategory) =>
        subcategory.id === activeSubcategoryId
    ) ?? subcategories[0];

  const activeLesson =
    lessons.find(
      (lesson) => lesson.id === activeLessonId
    ) ?? lessons[0];

  const categorySubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.categoryId === activeCategoryId
  );

  const subcategoryLessons = lessons.filter(
    (lesson) =>
      lesson.subcategoryId === activeSubcategoryId
  );

  const currentQuestion =
    activeLesson.questions[questionIndex];

  const correctAnswerSelected =
    selectedAnswer === currentQuestion.correctIndex;

  function openCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setScreen("category");
  }

  function openSubcategory(subcategoryId: string) {
    const subcategory = subcategories.find(
      (item) => item.id === subcategoryId
    );

    if (!subcategory) return;

    setActiveSubcategoryId(subcategory.id);
    setActiveCategoryId(subcategory.categoryId);
    setScreen("subcategory");
  }

  function openLesson(lessonId: string) {
    const lesson = lessons.find(
      (item) => item.id === lessonId
    );

    if (!lesson) return;

    setActiveLessonId(lesson.id);
    setActiveCategoryId(lesson.categoryId);
    setActiveSubcategoryId(lesson.subcategoryId);
    setScreen("lesson");
  }

  function startQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setScreen("quiz");
  }

  function chooseAnswer(answerIndex: number) {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);

    if (
      answerIndex === currentQuestion.correctIndex
    ) {
      setScore((previousScore) => previousScore + 1);
    }
  }

  function nextQuestion() {
    if (selectedAnswer === null) return;

    if (
      questionIndex < activeLesson.questions.length - 1
    ) {
      setQuestionIndex((previousIndex) => previousIndex + 1);
      setSelectedAnswer(null);
      return;
    }

    setCompletedLessonIds((previousIds) =>
      previousIds.includes(activeLesson.id)
        ? previousIds
        : [...previousIds, activeLesson.id]
    );

    setScreen("results");
  }

  const completedCount = completedLessonIds.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0D15"
      />

      {/* HOME SCREEN */}
      {screen === "home" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header />

          <View style={styles.welcome}>
            <Text style={styles.eyebrow}>
              ΛΙΓΗ ΓΝΩΣΗ ΚΑΘΕ ΜΕΡΑ
            </Text>

            <Text style={styles.homeTitle}>
              Ο κόσμος έχει{"\n"}
              πολλά να σου πει.
            </Text>

            <Text style={styles.bodyText}>
              Ανακάλυψε κάτι καινούριο, διάβασε μια
              σύντομη ιστορία και δοκίμασε όσα έμαθες.
            </Text>
          </View>

          <View style={styles.featuredCard}>
            <View style={styles.featuredTopRow}>
              <Text style={styles.featuredBadge}>
                ΠΡΟΤΕΙΝΟΜΕΝΟ
              </Text>

              <Text style={styles.readingTime}>
                ◷ 4 λεπτά
              </Text>
            </View>

            <Text style={styles.featuredTitle}>
              Μια μέρα στην αρχαία Αθήνα
            </Text>

            <Text style={styles.featuredDescription}>
              Πίσω από τα μνημεία κρύβονται οι ιστορίες
              των καθημερινών ανθρώπων.
            </Text>

            <ActionButton
              label="Ξεκίνα την ανάγνωση →"
              onPress={() =>
                openLesson("ancient-athens")
              }
            />
          </View>

          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>
              Εξερεύνησε τον κόσμο
            </Text>

            <Text style={styles.mutedText}>
              Διάλεξε αυτό που σου κινεί την περιέργεια.
            </Text>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const count = subcategories.filter(
                (subcategory) =>
                  subcategory.categoryId === category.id
              ).length;

              return (
                <Pressable
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    openCategory(category.id)
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.categoryEmoji}>
                    {category.emoji}
                  </Text>

                  <Text style={styles.categoryTitle}>
                    {category.title}
                  </Text>

                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>

                  <Text
                    style={[
                      styles.categoryCount,
                      count === 0 && styles.comingSoonText,
                    ]}
                  >
                    {count > 0
                      ? `${count} θεματικές`
                      : "Σύντομα διαθέσιμο"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>
              Η πρόοδός σου
            </Text>

            <Text style={styles.bodyText}>
              Έχεις ολοκληρώσει {completedCount}{" "}
              {completedCount === 1
                ? "μάθημα"
                : "μαθήματα"}{" "}
              σε αυτή τη συνεδρία.
            </Text>

            <Text style={styles.smallNote}>
              Η πρόοδος προς το παρόν δεν διατηρείται
              μετά την επανεκκίνηση της εφαρμογής.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* CATEGORY SCREEN */}
      {screen === "category" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header onBack={() => setScreen("home")} />

          <Text style={styles.largeEmoji}>
            {activeCategory.emoji}
          </Text>

          <Text style={styles.pageTitle}>
            {activeCategory.title}
          </Text>

          <Text style={styles.bodyText}>
            {activeCategory.description}
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              styles.categoryListHeading,
            ]}
          >
            Θεματικές ενότητες
          </Text>

          {categorySubcategories.length > 0 ? (
            categorySubcategories.map((subcategory) => {
              const lessonCount = lessons.filter(
                (lesson) =>
                  lesson.subcategoryId === subcategory.id
              ).length;

              return (
                <Pressable
                  key={subcategory.id}
                  style={styles.subcategoryCard}
                  onPress={() =>
                    openSubcategory(subcategory.id)
                  }
                  accessibilityRole="button"
                >
                  <View style={styles.subcategoryContent}>
                    <Text style={styles.subcategoryTitle}>
                      {subcategory.title}
                    </Text>

                    <Text
                      style={styles.subcategoryDescription}
                    >
                      {subcategory.description}
                    </Text>

                    <Text style={styles.categoryCount}>
                      {lessonCount > 0
                        ? `${lessonCount} ${
                            lessonCount === 1
                              ? "μάθημα"
                              : "μαθήματα"
                          }`
                        : "Σύντομα διαθέσιμο"}
                    </Text>
                  </View>

                  <Text style={styles.subcategoryArrow}>
                    ›
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.largeEmoji}>📚</Text>

              <Text style={styles.emptyTitle}>
                Ετοιμάζουμε νέες θεματικές
              </Text>

              <Text style={styles.bodyText}>
                Σύντομα θα προστεθούν νέες ενότητες
                και μαθήματα.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* SUBCATEGORY SCREEN */}
      {screen === "subcategory" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            onBack={() => setScreen("category")}
          />

          <Text style={styles.eyebrow}>
            {activeCategory.title.toUpperCase()}
          </Text>

          <Text style={styles.pageTitle}>
            {activeSubcategory.title}
          </Text>

          <Text style={styles.bodyText}>
            {activeSubcategory.description}
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              styles.categoryListHeading,
            ]}
          >
            Μαθήματα
          </Text>

          {subcategoryLessons.length > 0 ? (
            subcategoryLessons.map((lesson) => (
              <Pressable
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => openLesson(lesson.id)}
                accessibilityRole="button"
              >
                <Image
                  source={{ uri: lesson.imageUrl }}
                  style={styles.lessonThumbnail}
                />

                <View style={styles.lessonCardContent}>
                  <Text style={styles.eyebrow}>
                    {lesson.readingMinutes} ΛΕΠΤΑ ΑΝΑΓΝΩΣΗΣ
                  </Text>

                  <Text style={styles.lessonCardTitle}>
                    {lesson.title}
                  </Text>

                  <Text style={styles.lessonCardSummary}>
                    {lesson.summary}
                  </Text>

                  <Text style={styles.readingTime}>
                    {lesson.questions.length} ερωτήσεις
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.largeEmoji}>📚</Text>

              <Text style={styles.emptyTitle}>
                Νέα μαθήματα έρχονται
              </Text>

              <Text style={styles.bodyText}>
                Θα προσθέσουμε άρθρα με εικόνες, πηγές
                και quiz σε αυτή τη θεματική.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ARTICLE SCREEN */}
      {screen === "lesson" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            onBack={() => setScreen("subcategory")}
          />

          <Text style={styles.eyebrow}>
            {activeCategory.title.toUpperCase()} /{" "}
            {activeSubcategory.title.toUpperCase()}
          </Text>

          <Text style={styles.articleTitle}>
            {activeLesson.title}
          </Text>

          <Text style={styles.articleIntro}>
            {activeLesson.intro}
          </Text>

          <View style={styles.articleMeta}>
            <Text style={styles.readingTime}>
              ◷ {activeLesson.readingMinutes} λεπτά
              ανάγνωσης
            </Text>

            <Text style={styles.readingTime}>
              {activeLesson.questions.length} ερωτήσεις
            </Text>
          </View>

          <Image
            source={{ uri: activeLesson.imageUrl }}
            style={styles.articleImage}
            resizeMode="cover"
          />

          <Text style={styles.imageCaption}>
            {activeLesson.imageCaption}
          </Text>

          <Pressable
            onPress={() =>
              void Linking.openURL(
                activeLesson.imageCreditUrl
              ).catch(() => {})
            }
          >
            <Text style={styles.imageCredit}>
              Φωτογραφία: {activeLesson.imageCredit} ↗
            </Text>
          </Pressable>

          {activeLesson.sections.map((section) => (
            <View
              key={section.title}
              style={styles.articleSection}
            >
              <Text style={styles.articleSectionTitle}>
                {section.title}
              </Text>

              {section.paragraphs.map(
                (paragraph, index) => (
                  <Text
                    key={`${section.title}-${index}`}
                    style={styles.paragraph}
                  >
                    {paragraph}
                  </Text>
                )
              )}
            </View>
          ))}

          <View style={styles.sourcesCard}>
            <Text style={styles.sourcesHeading}>
              Πηγές & περαιτέρω ανάγνωση
            </Text>

            <Text style={styles.sourcesIntro}>
              Εξερεύνησε τις πηγές για να μάθεις
              περισσότερα για το θέμα.
            </Text>

            {activeLesson.sources.map((source) => (
              <Pressable
                key={source.url}
                style={styles.sourceLink}
                onPress={() =>
                  void Linking.openURL(source.url).catch(
                    () => {}
                  )
                }
                accessibilityRole="link"
              >
                <View style={styles.sourceTextContainer}>
                  <Text style={styles.sourceTitle}>
                    {source.title}
                  </Text>

                  <Text style={styles.sourcePublisher}>
                    {source.publisher}
                  </Text>
                </View>

                <Text style={styles.sourceArrow}>↗</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.quizCallout}>
            <Text style={styles.quizCalloutTitle}>
              Ώρα να δοκιμάσεις όσα έμαθες
            </Text>

            <Text style={styles.bodyText}>
              Απάντησε σε λίγες ερωτήσεις βασισμένες
              στο άρθρο.
            </Text>

            <ActionButton
              label="Ολοκλήρωσα την ανάγνωση →"
              onPress={startQuiz}
            />
          </View>
        </ScrollView>
      )}

      {/* QUIZ SCREEN */}
      {screen === "quiz" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            onBack={() => setScreen("lesson")}
            backLabel="ΑΡΘΡΟ"
          />

          <Text style={styles.eyebrow}>
            ΕΛΕΓΧΟΣ ΓΝΩΣΕΩΝ
          </Text>

          <Text style={styles.pageTitle}>
            {activeLesson.title}
          </Text>

          <View style={styles.quizProgressRow}>
            <Text style={styles.mutedText}>
              Πρόοδος quiz
            </Text>

            <Text style={styles.quizCounter}>
              {questionIndex + 1} /{" "}
              {activeLesson.questions.length}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((questionIndex + 1) /
                      activeLesson.questions.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionNumber}>
              ΕΡΩΤΗΣΗ {questionIndex + 1}
            </Text>

            <Text style={styles.questionText}>
              {currentQuestion.question}
            </Text>
          </View>

          <View style={styles.answers}>
            {currentQuestion.answers.map(
              (answer, index) => {
                const isCorrectAnswer =
                  selectedAnswer !== null &&
                  index === currentQuestion.correctIndex;

                const isWrongSelection =
                  selectedAnswer === index &&
                  index !== currentQuestion.correctIndex;

                return (
                  <Pressable
                    key={answer}
                    style={[
                      styles.answerButton,
                      isCorrectAnswer &&
                        styles.answerCorrect,
                      isWrongSelection &&
                        styles.answerWrong,
                    ]}
                    onPress={() => chooseAnswer(index)}
                    disabled={selectedAnswer !== null}
                    accessibilityRole="button"
                  >
                    <Text style={styles.answerLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>

                    <Text style={styles.answerText}>
                      {answer}
                    </Text>

                    {isCorrectAnswer && (
                      <Text style={styles.answerIcon}>
                        ✓
                      </Text>
                    )}

                    {isWrongSelection && (
                      <Text style={styles.answerIcon}>
                        ✕
                      </Text>
                    )}
                  </Pressable>
                );
              }
            )}
          </View>

          {selectedAnswer !== null && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>
                {correctAnswerSelected
                  ? "Σωστά! 🎉"
                  : "Όχι ακριβώς!"}
              </Text>

              <Text style={styles.bodyText}>
                {currentQuestion.explanation}
              </Text>

              <ActionButton
                label={
                  questionIndex ===
                  activeLesson.questions.length - 1
                    ? "Δες το αποτέλεσμα →"
                    : "Επόμενη ερώτηση →"
                }
                onPress={nextQuestion}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* RESULTS SCREEN */}
      {screen === "results" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            onBack={() => setScreen("home")}
            backLabel="ΑΡΧΙΚΗ"
          />

          <View style={styles.resultsContainer}>
            <Text style={styles.resultsEmoji}>
              {score === activeLesson.questions.length
                ? "🏆"
                : "✨"}
            </Text>

            <Text style={styles.eyebrow}>
              ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ
            </Text>

            <Text style={styles.resultsTitle}>
              {score === activeLesson.questions.length
                ? "Εξαιρετικά!"
                : score >= 2
                  ? "Πολύ καλή προσπάθεια!"
                  : "Κάθε μέρα μαθαίνεις κάτι νέο."}
            </Text>

            <Text style={styles.bodyText}>
              Ολοκλήρωσες το μάθημα «
              {activeLesson.title}».
            </Text>

            <View style={styles.scoreCard}>
              <Text style={styles.mutedText}>
                Η βαθμολογία σου
              </Text>

              <Text style={styles.finalScore}>
                {score} / {activeLesson.questions.length}
              </Text>

              <Text style={styles.readingTime}>
                {Math.round(
                  (score / activeLesson.questions.length) *
                    100
                )}
                % σωστές απαντήσεις
              </Text>
            </View>

            <ActionButton
              label="Επιστροφή στην αρχική"
              onPress={() => setScreen("home")}
            />

            <ActionButton
              label="Ξαναδιάβασε το άρθρο"
              onPress={() => setScreen("lesson")}
              secondary
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0D15",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    minHeight: 36,
  },
  headerSide: {
    width: 82,
    minHeight: 30,
    justifyContent: "center",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  backText: {
    color: "#B6B0FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  logo: {
    color: "#B1A5FF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
  },
  logoSparkle: {
    color: "#B1A5FF",
    fontSize: 23,
  },
  welcome: {
    marginBottom: 26,
  },
  eyebrow: {
    color: "#A89BFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    lineHeight: 16,
    marginBottom: 12,
  },
  homeTitle: {
    color: "#F6F5FC",
    fontSize: 35,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  bodyText: {
    color: "#A7ACC1",
    fontSize: 14,
    lineHeight: 23,
  },
  featuredCard: {
    backgroundColor: "#191D2D",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#34304E",
    padding: 20,
    marginBottom: 32,
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  featuredBadge: {
    color: "#BEB4FF",
    backgroundColor: "#302B4A",
    overflow: "hidden",
    borderRadius: 8,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  readingTime: {
    color: "#9EA3BA",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredTitle: {
    color: "#F6F5FC",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 10,
  },
  featuredDescription: {
    color: "#B1B5C8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  actionButton: {
    minHeight: 52,
    backgroundColor: "#A89BFF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 16,
  },
  actionButtonText: {
    color: "#171426",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#22263A",
    borderWidth: 1,
    borderColor: "#3A3E55",
  },
  secondaryButtonText: {
    color: "#E4E3F0",
  },
  sectionHeadingRow: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#F4F3FB",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 7,
  },
  mutedText: {
    color: "#979CB3",
    fontSize: 12,
    lineHeight: 19,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  categoryCard: {
    width: "48%",
    minHeight: 180,
    padding: 15,
    backgroundColor: "#151928",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#282D41",
  },
  categoryEmoji: {
    fontSize: 29,
    marginBottom: 17,
  },
  categoryTitle: {
    color: "#F0EFF8",
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  categoryDescription: {
    color: "#9CA2B8",
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  categoryCount: {
    color: "#B9AEFF",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 14,
  },
  comingSoonText: {
    color: "#858AA0",
  },
  progressCard: {
    backgroundColor: "#151928",
    borderRadius: 19,
    padding: 18,
    marginTop: 26,
    borderWidth: 1,
    borderColor: "#282D41",
  },
  progressCardTitle: {
    color: "#F4F3FB",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 9,
  },
  smallNote: {
    color: "#737B95",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  largeEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  pageTitle: {
    color: "#F6F5FC",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
    marginBottom: 10,
  },
  categoryListHeading: {
    marginTop: 32,
    marginBottom: 17,
  },
  subcategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171B2A",
    borderWidth: 1,
    borderColor: "#2B3044",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  subcategoryContent: {
    flex: 1,
    paddingRight: 12,
  },
  subcategoryTitle: {
    color: "#F6F5FC",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 6,
  },
  subcategoryDescription: {
    color: "#A7ACC1",
    fontSize: 12,
    lineHeight: 19,
  },
  subcategoryArrow: {
    color: "#B1A5FF",
    fontSize: 28,
  },
  lessonCard: {
    backgroundColor: "#171B2A",
    borderColor: "#2B3044",
    borderWidth: 1,
    borderRadius: 19,
    overflow: "hidden",
    marginBottom: 14,
  },
  lessonThumbnail: {
    width: "100%",
    height: 165,
    backgroundColor: "#252A3D",
  },
  lessonCardContent: {
    padding: 17,
  },
  lessonCardTitle: {
    color: "#F6F5FC",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 7,
  },
  lessonCardSummary: {
    color: "#A7ACC1",
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#151928",
    borderRadius: 20,
    padding: 22,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#282D41",
  },
  emptyTitle: {
    color: "#F6F5FC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  articleTitle: {
    color: "#F6F5FC",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 39,
    letterSpacing: -0.6,
    marginBottom: 13,
  },
  articleIntro: {
    color: "#C5C7D6",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 17,
  },
  articleMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 17,
  },
  articleImage: {
    width: "100%",
    height: 225,
    borderRadius: 20,
    backgroundColor: "#20263A",
  },
  imageCaption: {
    color: "#B2B6C9",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  imageCredit: {
    color: "#A99DFF",
    fontSize: 11,
    marginTop: 5,
    marginBottom: 27,
  },
  articleSection: {
    marginBottom: 26,
  },
  articleSectionTitle: {
    color: "#F4F3FB",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 13,
  },
  paragraph: {
    color: "#C4C7D6",
    fontSize: 15,
    lineHeight: 27,
    marginBottom: 15,
  },
  sourcesCard: {
    backgroundColor: "#151928",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2B3044",
    marginBottom: 20,
  },
  sourcesHeading: {
    color: "#F4F3FB",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  sourcesIntro: {
    color: "#9EA4BA",
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 13,
  },
  sourceLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#2B3044",
    gap: 12,
  },
  sourceTextContainer: {
    flex: 1,
  },
  sourceTitle: {
    color: "#C8C0FF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  sourcePublisher: {
    color: "#949AB0",
    fontSize: 11,
  },
  sourceArrow: {
    color: "#B5ABFF",
    fontSize: 18,
  },
  quizCallout: {
    backgroundColor: "#1B1B31",
    borderRadius: 21,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3A345D",
    marginBottom: 12,
  },
  quizCalloutTitle: {
    color: "#F5F3FF",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 9,
  },
  quizProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 11,
  },
  quizCounter: {
    color: "#C0B5FF",
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#292D41",
    overflow: "hidden",
    marginBottom: 27,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A89BFF",
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: "#181C2B",
    borderRadius: 20,
    padding: 21,
    borderWidth: 1,
    borderColor: "#30354B",
    marginBottom: 19,
  },
  questionNumber: {
    color: "#A99DFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 13,
  },
  questionText: {
    color: "#F5F4FB",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  answers: {
    gap: 11,
  },
  answerButton: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171B2A",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#30354A",
  },
  answerCorrect: {
    backgroundColor: "#17372F",
    borderColor: "#3CC69A",
  },
  answerWrong: {
    backgroundColor: "#40232E",
    borderColor: "#F07585",
  },
  answerLetter: {
    color: "#AEA3FF",
    fontSize: 13,
    fontWeight: "900",
    width: 29,
  },
  answerText: {
    color: "#ECECF5",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    flex: 1,
  },
  answerIcon: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginLeft: 8,
  },
  feedbackCard: {
    backgroundColor: "#171B2A",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#30354A",
    padding: 18,
    marginTop: 22,
  },
  feedbackTitle: {
    color: "#F5F4FB",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 9,
  },
  resultsContainer: {
    alignItems: "center",
    paddingTop: 50,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  resultsTitle: {
    color: "#F6F5FC",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
  },
  scoreCard: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#171B2A",
    borderColor: "#34304E",
    borderWidth: 1,
    borderRadius: 22,
    padding: 26,
    marginTop: 28,
    marginBottom: 18,
  },
  finalScore: {
    color: "#B1A5FF",
    fontSize: 52,
    fontWeight: "900",
    marginVertical: 6,
  },
});
