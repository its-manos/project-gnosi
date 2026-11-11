import { requestPracticeCue } from "../play/soundStatus";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import QuizReveal from "../components/QuizReveal";
import { MotionView } from "../components/HomeMotion";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { useLearningSession } from "../state/LearningSession";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { dailyReportTarget } from "../utils/contentReports";
import { colors } from "../theme";
import { onboardingLayout } from "./onboardingLayout";

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
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 790 || fontScale > 1.15;
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
  const opening = !isLoading && questionsCompatible && record.started && !record.completed &&
    record.currentIndex === 0 && selectedAnswer === null && currentQuestion ? `${record.dateKey}:${currentQuestion.id}` : null;
  useEffect(() => { if (opening) requestPracticeCue("question-open"); }, [opening]);

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
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact,
      { paddingBottom: Math.max(onboardingLayout.minBottomPadding, insets.bottom + 18) }]}
      showsVerticalScrollIndicator={false}>
      <MotionView entranceDelay={35} style={[styles.heading, compact && styles.headingCompact]}>
        <Text style={styles.kicker}>Η ΠΡΩΤΗ ΣΟΥ ΔΟΚΙΜΑΣΙΑ  ·  01 / 07</Text>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Μια ερώτηση. Μια ανακάλυψη.</Text>
        <Text style={styles.copy}>Δοκίμασε την πρώτη ερώτηση της σημερινής πρόκλησης. Η απάντησή σου θα μείνει στο κανονικό quiz.</Text>
      </MotionView>
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
            <Text style={styles.copy}>Η πρόοδός σου παραμένει ασφαλής. Μπορείς να ξαναδοκιμάσεις ή να συνεχίσεις στα ενδιαφέροντά σου.</Text>
            <ActionButton secondary label="Δοκίμασε ξανά" onPress={() => { attemptedDate.current = todayKey; void beginChallenge(); }} /></>}
      </View>}
      {(alreadyPassed || answeredFirst || unavailable) ? <MotionView entranceDelay={60}>
        <ActionButton
          label={busy ? "Αποθήκευση…" : unavailable ? "Συνέχεια χωρίς ερώτηση →" : "Διάλεξε τα ενδιαφέροντά σου →"}
          disabled={busy} onPress={() => void continueAfterQuestion()} />
      </MotionView> : null}
      {answeredFirst ? <Text style={styles.tip}>Αυτή ήταν μόνο η πρώτη από 7 ερωτήσεις. Οι υπόλοιπες σε περιμένουν στην αρχική.</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>Δεν ολοκληρώθηκε η μετάβαση. Δοκίμασε ξανά· η απάντησή σου διατηρείται.</Text> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  content: { flexGrow: 1, width: "100%", maxWidth: onboardingLayout.maxWidth, alignSelf: "center",
    justifyContent: "center", paddingHorizontal: onboardingLayout.horizontal, paddingTop: 18 },
  contentCompact: { justifyContent: "flex-start", paddingTop: 12 },
  heading: { gap: 9, marginBottom: 17 },
  headingCompact: { gap: 7, marginBottom: 12 },
  kicker: { color: colors.accentLight, fontSize: 10, lineHeight: 17, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: onboardingLayout.titleSize,
    lineHeight: onboardingLayout.titleLineHeight, fontWeight: "900" },
  titleCompact: { fontSize: 25, lineHeight: 32 },
  copy: { color: colors.textBody, fontSize: 14, lineHeight: 21 },
  notice: { borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised, padding: 20, gap: 12 },
  noticeTitle: { color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 28 },
  tip: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 14, textAlign: "center" },
  error: { color: colors.error, marginTop: 14, fontSize: 13, lineHeight: 20 },
});
