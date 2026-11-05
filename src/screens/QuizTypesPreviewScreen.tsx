import { useRef, useState, type ComponentRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import QuizReveal from "../components/QuizReveal";
import QuizQuestionRenderer from "../components/QuizQuestionRenderer";
import { useAdaptiveQuestionScroll } from "../hooks/useAdaptiveQuestionScroll";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
import QuestionStageFooter from "../components/QuestionStageFooter";
import DevTypedLessonPilotScreen from "./DevTypedLessonPilotScreen";
import { requestPracticeCue } from "../play/soundStatus";
import { calculateQuizResults, createQuizSession, evaluateAnswer } from "../quiz/engine";
import { advancePreview, submitPreviewAnswer } from "../quiz/previewFlow";
import { previewQuestions } from "../quiz/previewQuestions";
import type { BuiltinQuizQuestion, QuizSession } from "../quiz/types";
import { colors } from "../theme";

type Props = { onBack: () => void };
const startSession = () => createQuizSession("preview:quiz-question-types", "challenge", previewQuestions);

/** Dev-only phone pilot. No XP, streak, score syncing or daily record writes.
 * Display each type as a real question stage, not a long explanatory dev page.
 * The session ref prevents duplicate submit/advance effects. */
export default function QuizTypesPreviewScreen({ onBack }: Props) {
  const [session, setSession] = useState<QuizSession>(startSession);
  const [showArticlePilot, setShowArticlePilot] = useState(false);
  const sessionRef = useRef(session);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const viewport = useAdaptiveQuestionScroll();
  const insets = useSafeAreaInsets();
  const question = session.questions[session.currentIndex] as BuiltinQuizQuestion;
  const stageAction = useQuestionStageAction(question.id);
  const answer = session.answers[question.id]?.value;
  const answered = answer !== undefined;
  const result = calculateQuizResults(session);
  const step = session.currentIndex + 1;
  const answeredCount = Object.keys(session.answers).length;

  function submit(value: unknown) {
    const transition = submitPreviewAnswer(sessionRef.current, value);
    if (!transition.changed) return;
    sessionRef.current = transition.session;
    setSession(transition.session);
    if (transition.cue) requestPracticeCue(transition.cue);
  }
  function advance() {
    const transition = advancePreview(sessionRef.current);
    if (!transition.changed) return;
    sessionRef.current = transition.session;
    setSession(transition.session);
    if (transition.cue) requestPracticeCue(transition.cue);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }
  function restart() {
    const next = startSession();
    sessionRef.current = next;
    setSession(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  if (showArticlePilot) return <DevTypedLessonPilotScreen onBack={() => setShowArticlePilot(false)} />;

  return <View style={styles.root} testID="quiz-types-preview">
    <ProgressGradientBackground />
    <View style={styles.chrome}>
      <AppHeader onBack={onBack} backLabel="ΚΑΘΗΜΕΡΙΝΟ QUIZ" style={styles.appHeader} />
    </View>
    <ScrollView ref={scrollRef} style={styles.viewport}
      contentContainerStyle={styles.content}
      onLayout={viewport.onLayout} onContentSizeChange={viewport.onContentSizeChange}
      scrollEnabled={session.completed || viewport.scrollEnabled}
      bounces={session.completed || viewport.scrollEnabled}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.progress}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>✦  ΕΡΓΑΣΤΗΡΙΟ ΕΡΩΤΗΣΕΩΝ</Text>
          <Text style={styles.counter}>{session.completed ? session.questions.length : step} / {session.questions.length}</Text>
        </View>
        <ProgressBar progress={answeredCount / session.questions.length * 100} />
        <View style={styles.steps} accessible accessibilityLabel={`${answeredCount} από ${session.questions.length} απαντήθηκαν`}>
          {session.questions.map((q, index) => <View key={q.id}
            style={[styles.step, index < step - 1 && styles.stepDone,
              index === session.currentIndex && !session.completed && styles.stepCurrent,
              session.completed && styles.stepDone]} />)}
        </View>
      </View>
      {session.completed ? <View testID="quiz-types-preview-result" style={styles.result}>
        <Text style={styles.resultGlyph}>✦</Text>
        <Text style={styles.resultEyebrow}>Η ΔΟΚΙΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
        <Text style={styles.resultTitle}>Κάθε τρόπος μάθησης μετράει.</Text>
        <Text style={styles.score}>{result.correctCount} <Text style={styles.scoreSuffix}>/ {result.total}</Text></Text>
        <Text style={styles.resultCaption}>Σωστές απαντήσεις · Η δοκιμή δεν αποθηκεύεται</Text>
        <ActionButton label="Δοκίμασε ξανά" onPress={restart} />
        <ActionButton label="Δοκίμασε τις ερωτήσεις μέσα σε άρθρο (dev)" onPress={() => setShowArticlePilot(true)} secondary />
        <ActionButton label="Επιστροφή στο καθημερινό quiz" onPress={onBack} secondary />
      </View> : <>
        <QuizReveal key={question.id}>
          <QuizQuestionRenderer question={question} questionNumber={step} answer={answer} onSubmit={submit}
            onActionChange={stageAction.onActionChange} />
        </QuizReveal>
      </>}
    </ScrollView>
    {!session.completed ? <QuestionStageFooter bottomInset={insets.bottom} action={answered ? {
      label: session.currentIndex === session.questions.length - 1 ? "Δες το αποτέλεσμα →" : "Συνέχισε →",
      disabled: false, onPress: advance,
    } : stageAction.action} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chrome: { paddingHorizontal: 16, paddingTop: 6 },
  appHeader: { marginBottom: 4 },
  viewport: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", width: "100%", maxWidth: 680,
    alignSelf: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  progress: { gap: 8, marginBottom: 8 },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  progressLabel: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  counter: { color: colors.textBody, fontSize: 12, fontWeight: "900" },
  steps: { flexDirection: "row", gap: 6 },
  step: { flex: 1, height: 3, borderRadius: 3, backgroundColor: colors.border },
  stepCurrent: { backgroundColor: colors.accentLight },
  stepDone: { backgroundColor: colors.success },
  result: { alignItems: "center", borderWidth: 1, borderColor: "#4E4B70",
    backgroundColor: "#1B2235", borderRadius: 24, padding: 22, gap: 8 },
  resultGlyph: { color: colors.accentLight, fontSize: 38 },
  resultEyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  resultTitle: { color: colors.text, fontSize: 22, fontWeight: "900", lineHeight: 30, textAlign: "center" },
  score: { color: colors.text, fontSize: 52, lineHeight: 64, fontWeight: "900" },
  scoreSuffix: { color: colors.textMuted, fontSize: 25 },
  resultCaption: { color: colors.textBody, fontSize: 12, lineHeight: 20, textAlign: "center" },
});
