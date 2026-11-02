import { useRef, useState, type ComponentRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import QuizQuestionRenderer from "../components/QuizQuestionRenderer";
import { requestPracticeCue } from "../play/soundStatus";
import { calculateQuizResults, createQuizSession, evaluateAnswer } from "../quiz/engine";
import { advancePreview, submitPreviewAnswer } from "../quiz/previewFlow";
import { previewQuestions } from "../quiz/previewQuestions";
import type { BuiltinQuizQuestion, QuizSession } from "../quiz/types";
import { colors } from "../theme";

type Props = { onBack: () => void };
const startSession = () => createQuizSession("preview:quiz-question-types", "challenge", previewQuestions);
const titles: Record<string, string> = {
  "multiple-select": "Πολλαπλή επιλογή",
  ordering: "Βάλε σε σειρά",
  matching: "Αντιστοίχιση",
  "multiple-choice": "Μία επιλογή",
};

/**
 * Development-only phone pilot. No account, AsyncStorage, daily record,
 * leaderboard, streak, XP or sync effects.
 *
 * The current session ref is updated synchronously on accepted actions. This
 * guarantees that rapid double taps cannot replay sounds or resubmit answers,
 * and avoids side effects inside a React state-updater callback.
 */
export default function QuizTypesPreviewScreen({ onBack }: Props) {
  const [session, setSession] = useState<QuizSession>(startSession);
  const sessionRef = useRef(session);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const question = session.questions[session.currentIndex] as BuiltinQuizQuestion;
  const answer = session.answers[question.id]?.value;
  const answered = answer !== undefined;
  const result = calculateQuizResults(session);
  const step = session.currentIndex + 1;
  const title = titles[question.type] ?? "Ερώτηση";
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

  return <ScrollView ref={scrollRef} testID="quiz-types-preview" contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <AppHeader onBack={onBack} backLabel="ΚΑΘΗΜΕΡΙΝΟ QUIZ" />
    <View style={styles.header}>
      <View style={styles.pill}><Text style={styles.pillText}>✦ ΕΡΓΑΣΤΗΡΙΟ GNOSI</Text></View>
      <Text style={styles.title}>Μάθε με διαφορετικό τρόπο.</Text>
      <Text style={styles.subtitle}>Τρεις μικρές δοκιμασίες, τρεις τρόποι σκέψης.</Text>
      <View style={styles.sandboxNote}>
        <Text style={styles.sandboxTitle}>Δοκιμαστική λειτουργία</Text>
        <Text style={styles.note}>Χωρίς XP, σερί ή αποθήκευση προόδου. Οι ήχοι ακολουθούν τις ρυθμίσεις της εφαρμογής.</Text>
      </View>
    </View>
    <View style={styles.progress}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{session.completed ? "ΟΛΟΚΛΗΡΩΘΗΚΕ" : `ΔΟΚΙΜΑΣΙΑ ${step} ΑΠΟ ${session.questions.length}`}</Text>
        <Text style={styles.counter}>{answeredCount} / {session.questions.length}</Text>
      </View>
      <ProgressBar progress={answeredCount / session.questions.length * 100} />
      <View style={styles.steps}>
        {session.questions.map((q, index) => <View key={q.id} style={[styles.step, index < step - 1 && styles.stepDone,
          index === session.currentIndex && !session.completed && styles.stepCurrent,
          session.completed && styles.stepDone]}>
          <Text style={[styles.stepText, (index <= session.currentIndex || session.completed) && styles.stepTextActive]}>
            {index < step - 1 || session.completed ? "✓" : index + 1}
          </Text>
        </View>)}
      </View>
    </View>
    {session.completed ? <View testID="quiz-types-preview-result" style={styles.result}>
      <View style={styles.resultGlyph}><Text style={styles.glyph}>✦</Text></View>
      <Text style={styles.resultEyebrow}>Η ΔΙΑΔΡΟΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
      <Text style={styles.resultTitle}>Κάθε τρόπος μάθησης μετράει.</Text>
      <Text style={styles.score}>{result.correctCount} <Text style={styles.scoreSuffix}>/ {result.total}</Text></Text>
      <Text style={styles.resultCaption}>Σωστές απαντήσεις</Text>
      <Text style={styles.note}>Το αποτέλεσμα αυτής της δοκιμής δεν αποθηκεύεται.</Text>
      <ActionButton label="Δοκίμασε ξανά" onPress={restart} />
      <ActionButton label="Επιστροφή στο καθημερινό quiz" onPress={onBack} secondary />
    </View> : <>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionIndex}>0{step}</Text>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionEyebrow}>ΕΙΔΟΣ ΕΡΩΤΗΣΗΣ</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <QuizQuestionRenderer key={question.id} question={question} questionNumber={step}
        answer={answer} onSubmit={submit} />
      {answered ? <View style={styles.nextBlock}>
        <Text style={styles.nextHint}>{evaluateAnswer(question, answer).correct ? "Η σκέψη σου ήταν σωστή." : "Ένα ακόμη στοιχείο για να θυμάσαι."}</Text>
        <ActionButton label={session.currentIndex === session.questions.length - 1 ?
          "Δες το αποτέλεσμα →" : "Συνέχισε →"} onPress={advance} />
      </View> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },
  header: { paddingTop: 16, gap: 10, marginBottom: 20 },
  pill: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.accentSurface, borderRadius: 40, paddingHorizontal: 13, paddingVertical: 7 },
  pillText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", lineHeight: 39, letterSpacing: -0.4 },
  subtitle: { color: colors.textBody, fontSize: 15, lineHeight: 23 },
  sandboxNote: { marginTop: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
    backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, gap: 3 },
  sandboxTitle: { color: colors.accentLight, fontSize: 12, fontWeight: "800" },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  progress: { gap: 11, marginBottom: 24 },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  counter: { color: colors.accentLight, fontSize: 12, fontWeight: "800" },
  steps: { flexDirection: "row", gap: 8 },
  step: { flex: 1, minHeight: 29, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surfaceSoft },
  stepCurrent: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  stepDone: { borderColor: colors.success, backgroundColor: colors.successSurface },
  stepText: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  stepTextActive: { color: colors.text },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  sectionIndex: { color: colors.accentLight, fontSize: 31, lineHeight: 40, fontWeight: "900" },
  sectionInfo: { gap: 3 },
  sectionEyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  nextBlock: { marginBottom: 35 },
  nextHint: { textAlign: "center", color: colors.textBody, fontSize: 13, lineHeight: 20 },
  result: { alignItems: "center", marginTop: 4, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 12 },
  resultGlyph: { backgroundColor: colors.accentSurface, width: 64, height: 64, borderRadius: 22,
    justifyContent: "center", alignItems: "center" },
  glyph: { color: colors.accentLight, fontSize: 34 },
  resultEyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  resultTitle: { color: colors.text, fontSize: 23, fontWeight: "900", lineHeight: 31, textAlign: "center" },
  score: { color: colors.text, fontSize: 56, lineHeight: 69, fontWeight: "900", marginTop: 3 },
  scoreSuffix: { color: colors.textMuted, fontSize: 26 },
  resultCaption: { color: colors.textBody, fontSize: 14, marginBottom: 5 },
});
