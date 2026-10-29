import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import { DAILY_CHALLENGE_SIZE, questions } from "../data/questions";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { colors } from "../theme";

type Props = { onHome: () => void };

export default function DailyChallengeScreen({ onHome }: Props) {
  const {
    record,
    isLoading,
    challengeQuestions,
    currentQuestion,
    selectedAnswer,
    correctCount,
    startChallenge,
    answerQuestion,
    nextQuestion,
  } = useDailyChallenge();
  const [sourceError, setSourceError] = useState(false);
  const isCorrect = currentQuestion !== null && selectedAnswer === currentQuestion.correctIndex;

  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
      setSourceError(false);
    } catch {
      setSourceError(true);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accentLight} size="large" />
          <Text style={styles.muted}>Φόρτωση της σημερινής πρόκλησης…</Text>
        </View>
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
          <Text style={styles.muted}>Ολοκλήρωσες τη σημερινή πρόκληση της ΓΝΩΣΗΣ.</Text>
          <View style={styles.scoreCard}>
            <Text style={styles.muted}>Οι πόντοι σου</Text>
            <Text style={styles.score}>{correctCount * 100} / 700</Text>
            <Text style={styles.scoreMeta}>{correctCount} από {DAILY_CHALLENGE_SIZE} σωστές απαντήσεις</Text>
            <Text style={styles.scoreMeta}>{Math.round((correctCount / DAILY_CHALLENGE_SIZE) * 100)}% επιτυχία</Text>
          </View>
          <Text style={styles.tomorrowNote}>Η επόμενη πρόκληση θα είναι διαθέσιμη αύριο.</Text>
          <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} />
        </View>
      ) : !record.started ? (
        <View style={styles.introContainer}>
          <View style={styles.heroMark}><Text style={styles.heroGlyph}>✦</Text></View>
          <Text style={styles.eyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
          <Text style={styles.title}>7 ερωτήσεις. Νέες γνώσεις κάθε μέρα.</Text>
          <Text style={styles.body}>
            Δοκίμασε τις γνώσεις σου σε διαφορετικά θέματα. Κάθε σωστή απάντηση αξίζει 100 πόντους, μέχρι 700 συνολικά.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>• 7 ερωτήσεις πολλαπλής επιλογής</Text>
            <Text style={styles.feature}>• Άμεση εξήγηση μετά από κάθε απάντηση</Text>
            <Text style={styles.feature}>• Μπορείς να κλείσεις την εφαρμογή και να συνεχίσεις αργότερα</Text>
          </View>
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
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  centerState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  introContainer: { alignItems: "stretch", paddingTop: 24 },
  heroMark: { width: 72, height: 72, alignSelf: "center", alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 25 },
  heroGlyph: { color: colors.accentLight, fontSize: 38 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: "900", marginBottom: 14 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  featureList: { marginTop: 22, gap: 12, backgroundColor: colors.surface, padding: 17, borderColor: colors.border, borderWidth: 1, borderRadius: 18 },
  feature: { color: colors.textBody, fontSize: 13, lineHeight: 19 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 11 },
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
  resultEmoji: { fontSize: 62, marginBottom: 23 },
  resultTitle: { color: colors.text, fontSize: 28, fontWeight: "900", lineHeight: 36, textAlign: "center", marginBottom: 14 },
  scoreCard: { width: "100%", alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 22, padding: 25, marginTop: 28, marginBottom: 18 },
  score: { color: colors.accentLight, fontSize: 46, fontWeight: "900", marginVertical: 7 },
  scoreMeta: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 4 },
  tomorrowNote: { color: colors.textBody, textAlign: "center", fontSize: 13, lineHeight: 20, marginVertical: 5 },
});
