import { dailyXP } from "../utils/knowledgeScoring";
import KnowledgeProgress from "../components/KnowledgeProgress";
import { useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import DailyMistakeReview from "../components/DailyMistakeReview";
import ReportContentButton from "../components/ReportContentButton";
import { dailyReportTarget } from "../utils/contentReports";
import { DAILY_CHALLENGE_SIZE, questions } from "../data/questions";
import { DAILY_CHALLENGE_TOPICS, CHALLENGE_DIFFICULTIES, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { colors } from "../theme";

type Props = {
  onHome: () => void;
  onOpenPreferences: () => void;
  preferences: DailyChallengePreferences;
  preferencesLoaded: boolean;
};

export default function DailyChallengeScreen({
  onHome,
  onOpenPreferences,
  preferences,
  preferencesLoaded,
}: Props) {
  const {
    record,
    isLoading,
    challengeQuestions,
    currentQuestion,
    selectedAnswer,
    correctCount,
    accountScoped,
    reviewAvailable,
    startChallenge,
    answerQuestion,
    nextQuestion,
  } = useDailyChallenge(preferences, preferencesLoaded);
  const [sourceError, setSourceError] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [reviewDateKey, setReviewDateKey] = useState<string | null>(null);
  const missedQuestions = challengeQuestions.filter(
    (question, index) => record.answers[String(index)] !== question.correctIndex,
  );
  const isCorrect = currentQuestion !== null && selectedAnswer === currentQuestion.correctIndex;
  const selectedTopicNames = DAILY_CHALLENGE_TOPICS
    .filter((topic) => preferences.topicIds.includes(topic.id))
    .map((topic) => topic.title);
  const selectedDifficultyName = CHALLENGE_DIFFICULTIES.find(
    (item) => item.id === preferences.difficulty,
  )?.title ?? "Μεσαίο";

  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
      setSourceError(false);
    } catch {
      setSourceError(true);
    }
  }

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" />
      {accountScoped ? <Text style={styles.syncNote}>Η πρόοδός σου συγχρονίζεται στις συσκευές σου.</Text> : null}

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accentLight} size="large" />
          <Text style={styles.muted}>Φόρτωση της σημερινής πρόκλησης…</Text>
        </View>
      ) : record.completed && reviewAvailable && reviewDateKey === record.dateKey ? (
        <DailyMistakeReview
          key={`${record.dateKey}-${record.questionIds.join("-")}-${JSON.stringify(record.answers)}`}
          questions={missedQuestions}
          onDone={() => { setReviewDateKey(null); scrollRef.current?.scrollTo({ y: 0, animated: false }); }}
          onAdvance={() => scrollRef.current?.scrollTo({ y: 0, animated: false })}
        />
      ) : record.completed ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{correctCount === DAILY_CHALLENGE_SIZE ? "🏆" : "✨"}</Text>
          <Text style={styles.eyebrow}>Η ΠΡΟΚΛΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
          <Text style={styles.resultTitle}>
            {correctCount === DAILY_CHALLENGE_SIZE
              ? "Άψογα! Και οι 7 σωστές!"
              : correctCount >= 5
                ? "Πολύ καλή προσπάθεια!"
                : "Κάθε μέρα μαθαίνεις κάτι νέο."}
          </Text>
          <View style={styles.scoreCard}>
            <Text style={styles.muted}>Οι πόντοι σου</Text>
            <Text style={styles.score}>{correctCount * 100} / 700</Text>
            <Text style={styles.scoreMeta}>{correctCount} από {DAILY_CHALLENGE_SIZE} σωστές απαντήσεις</Text>
            <Text style={styles.scoreMeta}>Αυτή η πρόκληση: {dailyXP(correctCount)} XP</Text>
          </View>
          <KnowledgeProgress compact />
          <Text style={styles.tomorrowNote}>Η επόμενη πρόκληση θα είναι διαθέσιμη αύριο.</Text>
          {!reviewAvailable ? <Text style={styles.tomorrowNote}>Η βαθμολογία έχει διατηρηθεί. Η επανάληψη δεν είναι διαθέσιμη για ερωτήσεις παλαιότερης έκδοσης.</Text> : missedQuestions.length > 0 ? (
            <View style={styles.reviewInvitation}>
              <Text style={styles.body}>Ξαναδοκίμασε τα λάθη σου χωρίς αλλαγή στο σκορ.</Text>
              <ActionButton
                label={`Επανάληψη λαθών (${missedQuestions.length}) →`}
                onPress={() => { setReviewDateKey(record.dateKey); scrollRef.current?.scrollTo({ y: 0, animated: false }); }}
              />
            </View>
          ) : (
            <Text style={styles.tomorrowNote}>Δεν έχεις λάθη για επανάληψη σήμερα!</Text>
          )}
          <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} />
        </View>
      ) : !record.started ? (
        <View style={styles.introContainer}>
          <View style={styles.heroMark}><Text style={styles.heroGlyph}>✦</Text></View>
          <Text style={styles.eyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
          <Text style={styles.title}>7 ερωτήσεις. Νέες γνώσεις κάθε μέρα.</Text>
          <Text style={styles.body}>
            100 πόντοι για κάθε σωστή απάντηση.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.preferencesSummary}>
              <Text style={styles.preferencesSummaryLabel}>ΤΑ ΘΕΜΑΤΑ ΣΟΥ</Text>
              <Text style={styles.preferencesSummaryValue}>{selectedTopicNames.join(" · ")}</Text>
              <Text style={styles.preferencesSummaryLabel}>ΔΥΣΚΟΛΙΑ</Text>
              <Text style={styles.preferencesSummaryValue}>{selectedDifficultyName}</Text>
            </View>
          </View>
          <ActionButton label="Προσαρμογή πρόκλησης" onPress={onOpenPreferences} secondary />
          {questions.length < DAILY_CHALLENGE_SIZE ? (
            <Text style={styles.errorText}>Δεν υπάρχουν ακόμη αρκετές ερωτήσεις για τη σημερινή πρόκληση.</Text>
          ) : null}
          <ActionButton
            label="Ξεκίνα την πρόκληση →"
            onPress={() => { setSourceError(false); void startChallenge(); }}
            disabled={questions.length < DAILY_CHALLENGE_SIZE}
          />
          <ActionButton label="Όχι τώρα" onPress={onHome} secondary />
        </View>
      ) : currentQuestion ? (
        <View>
          <Text style={styles.eyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
          <View style={styles.progressRow}>
            <Text style={styles.muted}>Η πρόοδός σου</Text>
            <Text style={styles.counter}>{record.currentIndex + 1} / {DAILY_CHALLENGE_SIZE}</Text>
          </View>
          <ProgressBar progress={((record.currentIndex + 1) / DAILY_CHALLENGE_SIZE) * 100} />
          <View style={styles.questionCard}>
            <Text style={styles.questionNumber}>ΕΡΩΤΗΣΗ {record.currentIndex + 1}</Text>
            <Text style={styles.question}>{currentQuestion.question}</Text>
          </View>
          <View style={styles.answers}>
            <ReportContentButton key={currentQuestion.id} target={dailyReportTarget(currentQuestion)} />
            {currentQuestion.answers.map((answer, index) => (
              <AnswerOption
                key={`${currentQuestion.id}-${answer}`}
                label={answer}
                index={index}
                selected={selectedAnswer === index}
                correct={index === currentQuestion.correctIndex}
                locked={selectedAnswer !== null}
                onPress={() => { void answerQuestion(index); }}
              />
            ))}
          </View>
          {selectedAnswer !== null ? (
            <View style={styles.feedback}>
              <Text style={styles.feedbackTitle}>{isCorrect ? "Σωστά! 🎉" : "Καλή προσπάθεια!"}</Text>
              <Text style={styles.body}>{currentQuestion.explanation}</Text>
              <Pressable
                onPress={() => { void openSource(currentQuestion.sourceUrl); }}
                accessibilityRole="link"
                style={styles.sourceLink}
              >
                <Text style={styles.sourceLinkText}>Πηγή: {currentQuestion.sourceTitle} ↗</Text>
              </Pressable>
              {sourceError ? <Text style={styles.sourceError}>Δεν ήταν δυνατό το άνοιγμα της πηγής.</Text> : null}
              <ActionButton
                label={record.currentIndex === DAILY_CHALLENGE_SIZE - 1 ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →"}
                onPress={() => { setSourceError(false); void nextQuestion(); }}
              />
              <Text style={styles.scoreNote}>Σωστές μέχρι τώρα: {correctCount} · {correctCount * 100} πόντοι</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Δεν ήταν δυνατή η φόρτωση της σημερινής πρόκλησης.</Text>
          <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  syncNote: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 16 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  centerState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  introContainer: { alignItems: "stretch", paddingTop: 24 },
  heroMark: { width: 72, height: 72, alignSelf: "center", alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 25 },
  heroGlyph: { color: colors.accentLight, fontSize: 38 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: "900", marginBottom: 14 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  featureList: { marginTop: 22, gap: 12, backgroundColor: colors.surface, padding: 17, borderColor: colors.border, borderWidth: 1, borderRadius: 18 },
  feature: { color: colors.textBody, fontSize: 13, lineHeight: 19 },
  preferencesSummary: { marginTop: 5, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  preferencesSummaryLabel: { color: colors.accentLight, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  preferencesSummaryValue: { color: colors.text, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  progressRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 11 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  counter: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
  questionCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 21, borderWidth: 1, borderColor: colors.border, marginTop: 25, marginBottom: 19 },
  questionNumber: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 13 },
  question: { color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 30 },
  answers: { gap: 11 },
  feedback: { backgroundColor: colors.surfaceSoft, borderRadius: 19, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 22 },
  feedbackTitle: { color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: 9 },
  sourceLink: { alignSelf: "flex-start", paddingVertical: 9 },
  sourceLinkText: { color: colors.accentLight, fontSize: 12, lineHeight: 18, textDecorationLine: "underline" },
  sourceError: { color: colors.error, fontSize: 11, marginTop: 2 },
  scoreNote: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 20 },
  resultContainer: { alignItems: "center", paddingTop: 42 },
  reviewInvitation: { width: "100%", padding: 18, marginTop: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  resultEmoji: { fontSize: 62, marginBottom: 23 },
  resultTitle: { color: colors.text, fontSize: 28, fontWeight: "900", lineHeight: 36, textAlign: "center", marginBottom: 14 },
  scoreCard: { width: "100%", alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 22, padding: 25, marginTop: 28, marginBottom: 18 },
  score: { color: colors.accentLight, fontSize: 46, fontWeight: "900", marginVertical: 7 },
  scoreMeta: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 4 },
  tomorrowNote: { color: colors.textBody, textAlign: "center", fontSize: 13, lineHeight: 20, marginVertical: 5 },
});
