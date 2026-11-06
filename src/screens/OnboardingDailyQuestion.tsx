import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import QuizReveal from "../components/QuizReveal";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { useLearningSession } from "../state/LearningSession";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { dailyReportTarget } from "../utils/contentReports";
import { colors } from "../theme";

type Props = {
  preferences: DailyChallengePreferences;
  preferencesLoaded: boolean;
  onContinue: () => Promise<boolean>;
};

/** Question 1 of the REAL shared daily set, not a sandbox or a duplicate
 * tutorial question. The same store, answer, XP ledger and card are used.
 * Subsequent questions remain in the normal Daily Quiz after onboarding. */
export default function OnboardingDailyQuestion({ preferences, preferencesLoaded, onContinue }: Props) {
  const { record, todayKey, currentQuestion, selectedAnswer, isLoading,
    questionsCompatible, startChallenge, answerQuestion, nextQuestion } =
    useDailyChallenge(preferences, preferencesLoaded);
  const { dailyStore } = useLearningSession();
  const attemptedDate = useRef<string | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => () => { mountedRef.current = false; }, []);
  async function beginChallenge() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true); setStartFailed(false);
    try {
      await startChallenge();
      if (mountedRef.current && !dailyStore.getSnapshot().doc.days[todayKey]?.record.started) setStartFailed(true);
    } catch { if (mountedRef.current) setStartFailed(true); }
    finally { startingRef.current = false; if (mountedRef.current) setStarting(false); }
  }

  useEffect(() => {
    if (!isLoading && !record.started && attemptedDate.current !== todayKey) {
      attemptedDate.current = todayKey;
      void beginChallenge();
    }
  }, [isLoading, record.started, todayKey, startChallenge]);

  const alreadyPassed = record.completed || (record.started && record.currentIndex > 0);
  const answeredFirst = record.started && record.currentIndex === 0 && selectedAnswer !== null;

  async function continueAfterQuestion() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try {
      if (answeredFirst) {
        await nextQuestion();
        // nextQuestion persists the advancement, so the normal Daily screen
        // resumes at question 2 without asking for a second first answer.
        const advanced = dailyStore.getSnapshot().doc.days[todayKey]?.record;
        if (!advanced || (advanced.currentIndex === 0 && !advanced.completed)) throw Error("daily_not_advanced");
      }
      if (record.started && !await dailyStore.flushLocal()) throw Error("daily_not_saved");
      if (!await onContinue()) setError(true);
    } catch { setError(true); }
    finally { locked.current = false; setBusy(false); }
  }

  const unavailable = !isLoading && (!questionsCompatible || startFailed);
  return <View testID="onboarding-daily-question" style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}>
        <Text style={styles.kicker}>Η ΠΡΩΤΗ ΣΟΥ ΔΟΚΙΜΑΣΙΑ  ·  01 / 07</Text>
        <Text accessibilityRole="header" style={styles.title}>Μια ερώτηση. Μια ανακάλυψη.</Text>
        <Text style={styles.copy}>Δοκίμασε την πρώτη ερώτηση της σημερινής πρόκλησης. Η απάντησή σου θα μείνει στο κανονικό quiz.</Text>
      </View>
      {alreadyPassed ? <QuizReveal><View style={styles.notice}>
        <Text style={styles.noticeTitle}>Η πρώτη στάση ολοκληρώθηκε ✦</Text>
        <Text style={styles.copy}>Η πρόοδός σου έχει αποθηκευτεί. Μπορείς να συνεχίσεις τις υπόλοιπες ερωτήσεις από την αρχική.</Text>
      </View></QuizReveal> : currentQuestion && questionsCompatible ? <QuizReveal key={currentQuestion.id}>
        <SingleChoiceQuestionCard id={`welcome:${todayKey}:${currentQuestion.id}`}
          testID="onboarding-question-card" testPrefix="onboarding-answer"
          questionNumber={1} question={currentQuestion.question} answers={currentQuestion.answers}
          correctIndex={currentQuestion.correctIndex} explanation={currentQuestion.explanation}
          answer={selectedAnswer === null ? undefined : selectedAnswer}
          badgeLabel="ΗΜΕΡΗΣΙΟ QUIZ · ΠΡΩΤΗ ΕΡΩΤΗΣΗ"
          compactAnswered reportTarget={dailyReportTarget(currentQuestion)}
          onConfirm={answerQuestion} />
      </QuizReveal> : <View style={styles.notice}>
        {isLoading || starting || (!record.started && !unavailable)
          ? <><ActivityIndicator color={colors.accentLight}/><Text style={styles.copy}>Ετοιμάζουμε την πρώτη ερώτηση…</Text></>
          : <><Text style={styles.noticeTitle}>Η πρόκληση δεν είναι διαθέσιμη.</Text>
            <Text style={styles.copy}>Δεν θα χάσεις την πρόοδό σου. Μπορείς να ξαναδοκιμάσεις ή να προχωρήσεις στο μάθημα.</Text>
            <ActionButton secondary label="Δοκίμασε ξανά" onPress={() => { attemptedDate.current = todayKey; void beginChallenge(); }} /></>}
      </View>}
      {(alreadyPassed || answeredFirst || unavailable) ? <ActionButton
        label={busy ? "Αποθήκευση…" : unavailable ? "Συνέχεια χωρίς ερώτηση →" : "Πάμε στην πρώτη διαδρομή →"}
        disabled={busy} onPress={() => void continueAfterQuestion()} /> : null}
      {answeredFirst ? <Text style={styles.tip}>Αυτή ήταν μόνο η πρώτη από 7 ερωτήσεις. Οι υπόλοιπες σε περιμένουν στην αρχική.</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>Δεν ολοκληρώθηκε η μετάβαση. Δοκίμασε ξανά· η απάντησή σου διατηρείται.</Text> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  content: { flexGrow: 1, width: "100%", maxWidth: 640, alignSelf: "center",
    justifyContent: "center", paddingHorizontal: 18, paddingVertical: 18, paddingBottom: 36 },
  heading: { gap: 12, marginBottom: 22 },
  kicker: { color: colors.accentLight, fontSize: 10, lineHeight: 17, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: "900" },
  copy: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  notice: { borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised, padding: 20, gap: 12 },
  noticeTitle: { color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 28 },
  tip: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 14, textAlign: "center" },
  error: { color: colors.error, marginTop: 14, fontSize: 13, lineHeight: 20 },
});
