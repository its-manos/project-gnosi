import GameXpStatus from "../components/GameXpStatus";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import ProfileSectionHeader from "../components/ProfileSectionHeader";
import AppBackground from "../components/AppBackground";
import DailyMissionMap from "../components/DailyMissionMap";
import DailyJourneyTrack from "../components/DailyJourneyTrack";
import QuizReveal from "../components/QuizReveal";
import QuestionStageFooter from "../components/QuestionStageFooter";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import SourceLink from "../components/SourceLink";
import { quizFlowStyles as styles } from "../components/quizFlowStyles";
import { useAdaptiveQuestionScroll } from "../hooks/useAdaptiveQuestionScroll";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
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
const difficultyLabels = { easy: "Εύκολο", medium: "Μεσαίο", hard: "Δύσκολο" };

function QuestionSources({ question }: { question: ChoiceQuestion }) {
  return <>{question.sources.map(source => <SourceLink key={source.url}
    source={{ ...source, publisher: source.publisher ?? "Πηγή" }} />)}</>;
}

export default function QuickQuizScreen({ game, scope, preferredTopicIds = [], onHome }: Props) {
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const compactIntro = height < 900 || fontScale >= 1.2;
  const denseIntro = height < 740 || fontScale >= 1.4;
  const quizViewport = useAdaptiveQuestionScroll();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [entry, setEntry] = useState<"loading" | "intro" | "play">("loading");
  const [review, setReview] = useState(false);
  const { progress, busy, error, update, retryLoad } = game;
  const round = progress?.round;
  const question = round?.questions[round.currentIndex] as ChoiceQuestion | undefined;
  const answer = question && round ? round.answers[question.id]?.value as number | undefined : undefined;
  const stageAction = useQuestionStageAction(`${round?.id}:${question?.id}`);
  const activeQuiz = entry === "play" && Boolean(round && !round.completed && question);

  function newRound() {
    void update(current => startQuickQuiz(current, Math.random, preferredTopicIds))
      .then(saved => {
        if (saved) {
          setEntry("play");
          setReview(false);
        }
      }).catch(() => {});
  }

  useEffect(() => {
    if (entry !== "loading" || !progress) return;
    // Resume saved questions directly. A fresh round starts only from the intro CTA.
    setEntry(progress.round && !progress.round.completed ? "play" : "intro");
  }, [progress, entry]);

  const liveQuestionId = entry === "play" && round && !round.completed && question && answer === undefined
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

  const pageKey = `${entry}:${round?.id}:${round?.currentIndex}:${round?.completed}:${review}`;
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
  const showResults = entry === "play" && progress && round?.completed && results;
  const showIntro = entry === "intro" && progress;
  const perfect = results?.correctCount === QUICK_QUIZ_SIZE;
  const resultMask = round && results
    ? round.questions.map(item => !results.incorrectQuestionIds.includes(item.id)) : [];

  return <View testID="quick-quiz-screen" style={styles.root}>
    <AppBackground />
    <View style={styles.pageChrome}>
      <ProfileSectionHeader title={review ? "Ανασκόπηση" : showResults ? "Αποτέλεσμα" : "Γρήγορο Κουίζ"}
        actionLabel={review ? "‹ Αποτέλεσμα" : "‹ Αρχική"}
        actionAccessibilityLabel={review ? "Επιστροφή στο αποτέλεσμα" : "Επιστροφή στην αρχική"}
        onAction={review ? () => setReview(false) : onHome} style={styles.pageHeader} />
    </View>
    <ScrollView testID="quick-quiz-viewport" ref={scroll} style={styles.viewport}
      contentContainerStyle={[styles.content, activeQuiz ? styles.activeContent : styles.pageContent,
        !activeQuiz && { paddingBottom: insets.bottom + 22 }]}
      onLayout={quizViewport.onLayout} onContentSizeChange={quizViewport.onContentSizeChange}
      scrollEnabled={quizViewport.scrollEnabled} bounces={quizViewport.scrollEnabled}
      showsVerticalScrollIndicator={false}>
      {error ? <Text style={styles.errorText} accessibilityLiveRegion="polite">
        {error === "load" ? "Δεν φορτώθηκε η πρόοδος του κουίζ." : "Η αλλαγή δεν αποθηκεύτηκε. Δοκίμασε ξανά."}
      </Text> : null}
      {entry === "loading" ? <View style={styles.centerState}>
        {error === "load" ? <ActionButton label="Δοκίμασε ξανά" onPress={retryLoad} />
          : <><ActivityIndicator accessibilityLabel="Φόρτωση γύρου" color={colors.accentLight} />
            <Text style={styles.note}>Φόρτωση του Γρήγορου Κουίζ…</Text></>}
      </View> : null}
      {showIntro ? <View testID="quick-quiz-intro" style={[styles.introContainer, denseIntro && styles.introDense]}>
        <QuizReveal><View style={[styles.introBody, compactIntro && styles.introBodyCompact]}>
          <View style={styles.introLead}>
            <View style={styles.introCopy}>
              <Text style={styles.eyebrow}>Η ΕΠΟΜΕΝΗ ΣΟΥ ΕΞΕΡΕΥΝΗΣΗ</Text>
              <Text style={[styles.introTitle, denseIntro && styles.introTitleDense]}>{QUICK_QUIZ_SIZE} στάσεις γνώσης.</Text>
              <Text style={styles.introSubtitle}>Ένας μικρός γύρος, όποτε θέλεις.</Text>
            </View>
            <View style={[styles.heroMark, denseIntro && styles.heroMarkDense]} accessible={false}>
              <View style={styles.heroOrbitOuter} /><View style={styles.heroOrbitInner} />
              <View style={styles.heroCore}><Text style={styles.heroGlyph}>ϟ</Text></View>
              <View style={styles.heroSatellite} /><Text style={styles.heroSmallStar}>✧</Text>
            </View>
          </View>
          <Text style={styles.sharedNote}>Ερωτήσεις από διαφορετικούς κόσμους, με βάση τα ενδιαφέροντά σου.</Text>
          <DailyMissionMap variant="quick" compact={compactIntro} />
          <View style={styles.introActions}>
            <ActionButton label="Ξεκίνα τον γύρο →" onPress={newRound} disabled={busy} style={styles.actionPrimary} />
            <Text style={styles.introNote}>Η πρόοδός σου αποθηκεύεται. Μπορείς να συνεχίσεις τον γύρο αργότερα.</Text>
            <GameXpStatus game="quick" />
          </View>
        </View></QuizReveal>
      </View> : null}
      {showResults ? review ? round.questions.filter(item => results.incorrectQuestionIds.includes(item.id)).map(item => {
        const missed = item as ChoiceQuestion;
        return <SingleChoiceQuestionCard key={missed.id} id={missed.id} question={missed.prompt}
          questionNumber={round.questions.indexOf(item) + 1} answers={missed.content.answers}
          correctIndex={missed.content.correctIndex} explanation={missed.explanation}
          answer={round.answers[missed.id].value as number} onConfirm={() => {}}
          badgeLabel={categoryLabels[missed.categoryId]} compactAnswered feedbackExtra={<QuestionSources question={missed} />} />;
      }) : <QuizReveal><View style={[styles.resultContainer, compactIntro && styles.resultContainerCompact]} testID="quick-quiz-results">
        <View style={[styles.resultHero, compactIntro && styles.resultHeroCompact]}>
          <View style={styles.resultHeroCopy}>
            <Text style={styles.eyebrow}>Ο ΓΥΡΟΣ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
            <Text accessibilityRole="header" style={[styles.title, compactIntro && styles.resultTitleCompact]}>
              {perfect ? "Τα πέτυχες όλα!" : results.correctCount >= 4 ? "Πολύ καλός γύρος!" : "Κάθε απάντηση είναι μια νέα γνώση."}
            </Text>
          </View>
          <View style={[styles.resultSeal, compactIntro && styles.resultSealCompact]} accessible={false}>
            <View style={styles.resultSealOrbit} /><Text style={styles.resultStar}>ϟ</Text>
          </View>
        </View>
        <View style={[styles.scoreCard, compactIntro && styles.scoreCardCompact]}>
          <View pointerEvents="none" style={styles.cardRim} />
          <View style={styles.resultScoreRow}>
            <View style={styles.resultScoreCopy}>
              <Text style={styles.scoreLabel}>Η ΕΠΙΔΟΣΗ ΤΟΥ ΓΥΡΟΥ</Text>
              <Text style={styles.scoreHint}>Σωστές απαντήσεις</Text>
            </View>
            <Text style={[styles.bigScore, compactIntro && styles.bigScoreCompact]}
              accessibilityLabel={`${results.correctCount} στις ${results.total} σωστές`}>
              {results.correctCount}<Text style={styles.scoreDenominator}> / {results.total}</Text>
            </Text>
          </View>
          <View style={styles.resultRoute}><DailyJourneyTrack variant="quick" mode="result" correctMask={resultMask} /></View>
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{Math.round(results.correctCount / results.total * 100)}%</Text><Text style={styles.metricLabel}>Ακρίβεια</Text></View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}><Text style={styles.metricValue}>{streaks?.best}</Text><Text style={styles.metricLabel}>Καλύτερο σερί</Text></View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}><Text style={styles.metricValue}>{progress.roundsCompleted}</Text><Text style={styles.metricLabel}>Γύροι</Text></View>
          </View>
          <GameXpStatus game="quick" />
        </View>
        <View style={styles.actionGroup}>
          <ActionButton label="Νέος γύρος →" onPress={newRound} disabled={busy} style={styles.actionPrimary} />
          {results.incorrectQuestionIds.length ? <Pressable accessibilityRole="button" style={styles.mistakeAction}
            onPress={() => setReview(true)}><Text style={styles.mistakeActionText}>Δες τα λάθη σου ({results.incorrectQuestionIds.length}) ›</Text></Pressable> : null}
        </View>
        <View style={styles.highlightRow}>
          <View style={styles.highlightMark}><Text style={styles.highlightStar}>✦</Text></View>
          <View style={styles.highlightCopy}>
            <Text style={styles.eyebrow}>ΤΑ ΡΕΚΟΡ ΣΟΥ</Text>
            <Text style={styles.highlightTitle}>Σκορ {progress.bestScore}/{QUICK_QUIZ_SIZE} · Σερί {progress.bestStreak}</Text>
          </View>
        </View>
        <Text style={styles.tomorrow}>Ένας νέος γύρος σε περιμένει όποτε θέλεις.</Text>
      </View></QuizReveal> : null}
      {activeQuiz && round && question ? <QuizReveal key={`${round.id}:${question.id}`}><View>
        <DailyJourneyTrack variant="quick" mode="question" answeredCount={Object.keys(round.answers).length} currentIndex={round.currentIndex} />
        <SingleChoiceQuestionCard key={`${round.id}:${question.id}`} id={question.id} question={question.prompt}
          answers={question.content.answers} correctIndex={question.content.correctIndex}
          explanation={question.explanation} questionNumber={round.currentIndex + 1} answer={answer}
          onConfirm={confirm} onActionChange={stageAction.onActionChange}
          badgeLabel={`${categoryLabels[question.categoryId]} · ${difficultyLabels[question.difficulty]}`}
          compactAnswered combo={streaks?.current} feedbackExtra={<QuestionSources question={question} />} />
      </View></QuizReveal> : null}
    </ScrollView>
    {activeQuiz ? <QuestionStageFooter bottomInset={insets.bottom} action={answer !== undefined ? {
      label: round!.currentIndex + 1 === QUICK_QUIZ_SIZE ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →",
      onPress: advance, disabled: busy,
    } : stageAction.action ? { ...stageAction.action, disabled: busy || stageAction.action.disabled } : null} /> : null}
  </View>;
}
