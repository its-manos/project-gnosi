import GameXpStatus from "../components/GameXpStatus";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AtlasContinueCard, { atlasContinueStyles } from "../components/AtlasContinueCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import SourceLink from "../components/SourceLink";
import type { useQuickQuiz } from "../hooks/useQuickQuiz";
import { emitPlayFeedback } from "../play/events";
import { requestPracticeCue } from "../play/soundStatus";
import { calculateQuizResults, evaluateAnswer, questionToken } from "../quiz/engine";
import { playQuickQuiz, QUICK_QUIZ_SIZE, quickQuizStreaks, startQuickQuiz } from "../quiz/quickQuiz";
import type { ChoiceQuestion } from "../quiz/types";
import { colors } from "../theme";

type Props = {
  game: ReturnType<typeof useQuickQuiz>;
  scope: string;
  preferredTopicIds?: readonly string[];
  onHome: () => void;
};

const categoryLabels: Record<string, string> = {
  history: "Ιστορία", science: "Επιστήμη", nature: "Φύση",
  technology: "Τεχνολογία", culture: "Τέχνες", geography: "Γεωγραφία",
};

function NextButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <AtlasContinueCard accessibilityRole="button" disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress} style={styles.next}>
    <Text style={atlasContinueStyles.title}>{label}</Text>
    <Text accessible={false} style={styles.arrow}>→</Text>
  </AtlasContinueCard>;
}

function QuestionSources({ question }: { question: ChoiceQuestion }) {
  return <>{question.sources.map(source => <SourceLink key={source.url}
    source={{ ...source, publisher: source.publisher ?? "Πηγή" }} />)}</>;
}

function ResultStat({ value, label }: { value: string | number; label: string }) {
  return <View style={styles.stat} accessible accessibilityLabel={`${label}, ${value}`}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

export default function QuickQuizScreen({ game, scope, preferredTopicIds = [], onHome }: Props) {
  const insets = useSafeAreaInsets();
  const entered = useRef(false);
  const openingResult = useRef<string | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [review, setReview] = useState(false);
  const { progress, busy, error, update, retryLoad } = game;
  const round = progress?.round;
  const question = round?.questions[round.currentIndex] as ChoiceQuestion | undefined;
  const answer = question && round ? round.answers[question.id]?.value as number | undefined : undefined;

  function newRound() {
    void update(current => startQuickQuiz(current, Math.random, preferredTopicIds)).then(saved => { if (saved) setReview(false); }).catch(() => {});
  }

  useEffect(() => {
    if (entered.current || !progress) return;
    entered.current = true;
    if (progress.round?.completed) openingResult.current = progress.round.id;
    if (!progress.round || progress.round.completed) void update(current => startQuickQuiz(current, Math.random, preferredTopicIds)).catch(() => {});
  }, [progress, update]);

  const liveQuestionId = round && !round.completed && question && answer === undefined
    ? `${round.id}:${question.id}` : null;
  useEffect(() => {
    if (liveQuestionId) requestPracticeCue("question-open");
  }, [scope, liveQuestionId]);

  useEffect(() => {
    if (!review) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setReview(false);
      return true;
    });
    return () => subscription.remove();
  }, [review]);

  const pageKey = `${round?.id}:${round?.currentIndex}:${round?.completed}:${review}`;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [pageKey]);

  async function confirm(value: number) {
    if (!round || !question) return;
    const saved = await update(current => playQuickQuiz(current, round.id, questionToken(round), { type: "answer", value }));
    if (!saved) throw new Error("quick_quiz_answer_not_saved");
    emitPlayFeedback({
      scope, id: `${round.id}:${question.id}:answer`,
      kind: evaluateAnswer(question, value).correct ? "correct" : "incorrect", answerXP: saved.creditedXP, xp: saved.creditedXP,
    });
  }

  function advance() {
    if (!round) return;
    void update(current => playQuickQuiz(current, round.id, questionToken(round), { type: "advance" }))
      .then(saved => {
        if (saved?.round?.completed) emitPlayFeedback({ scope, id: `${round.id}:complete`, kind: "complete" });
      }).catch(() => {});
  }

  const results = round?.completed ? calculateQuizResults(round) : null;
  const streaks = round ? quickQuizStreaks(round) : null;
  const perfect = results?.correctCount === QUICK_QUIZ_SIZE;
  // Opening from Home normally deals a new round. If saving that round fails,
  // the previous result stays available with the same retry action.
  const showResults = progress && round?.completed && results && entered.current &&
    (openingResult.current !== round.id || error === "save");
  return <View testID="quick-quiz-screen" style={styles.screen}>
    <ProgressGradientBackground />
    <ProfileSectionHeader title={review ? "Τα λάθη σου" : "Γρήγορο Κουίζ"}
      actionLabel={review ? "‹ Αποτελέσματα" : "‹ Αρχική"}
      actionAccessibilityLabel={review ? "Επιστροφή στα αποτελέσματα" : "Επιστροφή στην αρχική"}
      onAction={review ? () => setReview(false) : onHome} style={styles.header} />
    <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      showsVerticalScrollIndicator={false}>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">
        {error === "load" ? "Δεν φορτώθηκε η πρόοδος του κουίζ." : "Η αλλαγή δεν αποθηκεύτηκε. Δοκίμασε ξανά."}
      </Text> : null}
      {!round || (round.completed && !showResults) ? <View style={styles.center}>
        {error === "load" ? <NextButton label="Δοκίμασε ξανά" onPress={retryLoad} />
          : error === "save" ? <NextButton label="Ξεκίνα γύρο" onPress={newRound} disabled={busy} />
          : <ActivityIndicator accessibilityLabel="Φόρτωση γύρου" color={colors.accentLight} />}
      </View> : null}
      {showResults ? review ? round.questions.filter(item => results.incorrectQuestionIds.includes(item.id)).map(item => {
        const missed = item as ChoiceQuestion;
        return <SingleChoiceQuestionCard key={missed.id} id={missed.id} question={missed.prompt}
          questionNumber={round.questions.indexOf(item) + 1} answers={missed.content.answers}
          correctIndex={missed.content.correctIndex} explanation={missed.explanation}
          answer={round.answers[missed.id].value as number} onConfirm={() => {}}
          badgeLabel={categoryLabels[missed.categoryId]} compactAnswered feedbackExtra={<QuestionSources question={missed} />} />;
      }) : <View style={styles.results} testID="quick-quiz-results">
        <View style={[styles.scoreCard, perfect && styles.perfectScoreCard]}>
          <Text accessibilityRole="header" style={[styles.eyebrow, perfect && styles.perfectLabel]}>
            {perfect ? "ΤΕΛΕΙΟΣ ΓΥΡΟΣ" : "Ο ΓΥΡΟΣ ΣΟΥ"}
          </Text>
          <Text style={styles.score} accessibilityLabel={`${results.correctCount} στις ${results.total} σωστές`}>
            {results.correctCount}<Text style={styles.scoreTotal}> / {results.total}</Text>
          </Text>
          <View style={styles.scoreMarks} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {round.questions.map(item => {
              const missed = results.incorrectQuestionIds.includes(item.id);
              return <View key={item.id} style={[styles.scoreMark, missed && styles.missedMark]}>
                <Text style={[styles.scoreMarkText, missed && styles.missedMarkText]}>{missed ? "×" : "✓"}</Text>
              </View>;
            })}
          </View>
          <Text style={styles.body}>Καλύτερο σερί γύρου · {streaks?.best}</Text>
          <GameXpStatus game="quick" />
        </View>
        <NextButton label="Νέος γύρος" onPress={newRound} disabled={busy} />
        {results.incorrectQuestionIds.length ? <Pressable accessibilityRole="button" style={styles.review}
          onPress={() => setReview(true)}><Text style={styles.reviewText}>Δες τα λάθη σου</Text></Pressable> : null}
        <View style={styles.stats}>
          <ResultStat label="Ρεκόρ σκορ" value={`${progress.bestScore}/${QUICK_QUIZ_SIZE}`} />
          <ResultStat label="Ρεκόρ σερί" value={progress.bestStreak} />
          <ResultStat label="Γύροι" value={progress.roundsCompleted} />
        </View>
      </View> : null}
      {round && !round.completed && question ? <>
        <View style={styles.progress}>
          <Text style={styles.eyebrow} accessibilityLabel={`Ερώτηση ${round.currentIndex + 1} από ${QUICK_QUIZ_SIZE}`}>
            {round.currentIndex + 1} / {QUICK_QUIZ_SIZE}
          </Text>
          <View style={styles.track} accessible={false}>
            {round.questions.map((item, i) => <View key={item.id}
              style={[styles.segment, i < round.currentIndex && styles.segmentDone, i === round.currentIndex && styles.segmentCurrent]} />)}
          </View>
        </View>
        <SingleChoiceQuestionCard key={`${round.id}:${question.id}`} id={question.id} question={question.prompt}
          answers={question.content.answers} correctIndex={question.content.correctIndex}
          explanation={question.explanation} questionNumber={round.currentIndex + 1} answer={answer}
          onConfirm={confirm} badgeLabel={categoryLabels[question.categoryId]} compactAnswered combo={streaks?.current}
          feedbackExtra={<QuestionSources question={question} />} />
        {answer !== undefined ? <NextButton
          label={round.currentIndex + 1 === QUICK_QUIZ_SIZE ? "Αποτελέσματα" : "Επόμενη ερώτηση"}
          onPress={advance} disabled={busy} /> : null}
      </> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: profileSectionLayout.horizontal, marginTop: profileSectionLayout.top },
  content: { flexGrow: 1, paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.below, gap: 12 },
  center: { flex: 1, justifyContent: "center" },
  error: { color: colors.error, fontWeight: "700" },
  progress: { flexDirection: "row", alignItems: "center", gap: 12 },
  track: { flex: 1, flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "#292C40" },
  segmentDone: { backgroundColor: "#6E60A4" },
  segmentCurrent: { backgroundColor: colors.accentLight },
  eyebrow: { color: colors.accentLight, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  results: { flex: 1, justifyContent: "center", gap: 12 },
  scoreCard: { backgroundColor: "#1B2034", borderColor: "#6A618C", borderWidth: 1, borderRadius: 20,
    padding: 16, alignItems: "center", gap: 8 },
  perfectScoreCard: { borderColor: "#B38A53", backgroundColor: "#292335" },
  perfectLabel: { color: "#F3CB89" },
  score: { color: colors.text, fontSize: 52, fontWeight: "900" },
  scoreTotal: { color: colors.accentLight, fontSize: 24 },
  scoreMarks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  scoreMark: { backgroundColor: colors.successSurface, borderRadius: 8, alignItems: "center",
    minWidth: 30, paddingVertical: 4, paddingHorizontal: 6 },
  scoreMarkText: { color: colors.success, fontWeight: "900" },
  missedMark: { backgroundColor: colors.errorSurface },
  missedMarkText: { color: colors.error },
  stats: { backgroundColor: colors.surface, borderRadius: 16, padding: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: { flexGrow: 1, alignItems: "center", gap: 3 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textAlign: "center" },
  body: { color: colors.textBody, fontSize: 14, fontWeight: "700" },
  next: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 },
  arrow: { color: colors.accentLight, fontSize: 20, fontWeight: "800" },
  review: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  reviewText: { color: colors.accentLight, fontSize: 14, fontWeight: "800" },
});
