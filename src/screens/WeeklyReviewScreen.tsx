import { requestPracticeCue } from "../play/soundStatus";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { useAthensDate } from "../hooks/useAthensDate";
import { shuffledIndices, weeklyPlan } from "../utils/weeklyReview";
import { mondayOf } from "../utils/learningActivity";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import AppBackground from "../components/AppBackground";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import SyncStatus from "../components/SyncStatus";
import { lessonReportTarget } from "../utils/contentReports";
import { colors } from "../theme";

/**
 * Keep the original weekly plan, persisted answers and one-try rule.
 * These views are presentation only; no XP or review records are written here.
 */
export default function WeeklyReviewScreen({ onBack }: { onBack: () => void }) {
  const { store } = useLearningSession(), snapshot = useLearningSnapshot(), today = useAthensDate();
  const [initial] = useState(() => ({
    week: mondayOf(today), userId: snapshot.userId,
    items: weeklyPlan(snapshot.activity, snapshot.weeklyReviews, today),
  }));
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showCorrections, setShowCorrections] = useState(false);
  const expired = initial.week !== mondayOf(today) || initial.userId !== snapshot.userId;
  const items = initial.items;
  const item = items.find(q => q.id === feedbackId) ?? items.find(q => !snapshot.weeklyReviews[q.id]);
  const question = item?.lesson.questions[item.questionIndex];
  const answer = item ? snapshot.weeklyReviews[item.id] : undefined;
  const displayOrder = item && question ? shuffledIndices(question.answers.length, item.id) : [];
  const displayAnswers = displayOrder.map(index => question!.answers[index]);
  const committedDisplayIndex = answer ? displayOrder.indexOf(answer.answerIndex) : undefined;
  const done = items.filter(q => snapshot.weeklyReviews[q.id]).length;
  const correct = items.filter(q =>
    snapshot.weeklyReviews[q.id]?.answerIndex === q.lesson.questions[q.questionIndex].correctIndex).length;
  const finished = items.length > 0 && !item;
  // An answer is committed before Continue; its on-screen question number must
  // still describe the same question, not jump to the next one.
  const itemNumber = item ? items.findIndex(q => q.id === item.id) + 1 : 0;
  const isCorrect = !!answer && !!question && answer.answerIndex === question.correctIndex;
  const wrongRows = finished ? items.filter(q =>
    snapshot.weeklyReviews[q.id]?.answerIndex !== q.lesson.questions[q.questionIndex].correctIndex) : [];
  const weekLabel = initial.week.split("-").reverse().join("/");
  const reward = snapshot.rewards?.["review:" + initial.week] ?? 0;
  const opening = snapshot.ready && !expired && item && !answer ? item.id : null;
  useEffect(() => { if (opening) requestPracticeCue("question-open"); }, [opening]);
  const continuedId = useRef<string | null>(null);
  function continueReview() {
    if (expired || !snapshot.ready || !feedbackId || continuedId.current === feedbackId) return;
    continuedId.current = feedbackId;
    setFeedbackId(null);
    if (items.every(q => store.getSnapshot().weeklyReviews[q.id])) requestPracticeCue("complete");
  }

  function choose(answerIndex: number) {
    if (!item || expired || !snapshot.ready) return;
    if (store.answerWeekly(item.id, answerIndex)) { setFeedbackId(item.id); setMessage(""); }
    else setMessage("Η διαθέσιμη προσπάθεια ενημερώθηκε. Επέστρεψε και άνοιξε ξανά τη δεύτερη ευκαιρία.");
  }

  return <View testID="weekly-review-screen" style={styles.root}>
    <AppBackground />
    <View style={styles.chrome}>
      <ProfileSectionHeader title="Επανάληψη"
        actionLabel="Πρόοδος" actionAccessibilityLabel="Επιστροφή στην πρόοδο"
        onAction={onBack} style={styles.pageHeader} />
    </View>
    <ScrollView style={styles.viewport} contentContainerStyle={styles.content}
      bounces={false} showsVerticalScrollIndicator={false}>
      <SyncStatus quiet />
      <View testID="weekly-review-lead" style={styles.lead}>
        <Text style={styles.eyebrow}>ΕΒΔΟΜΑΔΑ ΑΠΟ {weekLabel}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {finished ? "Κάθε επανάληψη μετρά." : "Μια δεύτερη ευκαιρία."}
        </Text>
        {!item && !finished ? <Text style={styles.subtitle}>Ξαναθυμήσου όσα έμαθες, με τον δικό σου ρυθμό.</Text> : null}
      </View>

      {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}

      {!expired && snapshot.ready && items.length > 0 ?
        <View testID="weekly-review-journey" style={styles.journey}>
          <View style={styles.journeyHeading}>
            <Text style={styles.eyebrow}>{finished ? "Η ΔΙΑΔΡΟΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ" : "Η ΠΡΟΟΔΟΣ ΣΟΥ"}</Text>
            <Text style={styles.journeyCount}>{done} / {items.length}</Text>
          </View>
          <View style={styles.route} accessible accessibilityRole="progressbar"
            accessibilityLabel={finished
              ? "Η επανάληψη ολοκληρώθηκε. " + correct + " σωστές από " + items.length + " απαντήσεις."
              : "Απαντήθηκαν " + done + " από " + items.length + " ερωτήσεις."}
            accessibilityValue={{ min: 0, max: items.length, now: done }}>
            <View style={styles.rail} pointerEvents="none" />
            {items.map((q, index) => {
              const saved = snapshot.weeklyReviews[q.id];
              const right = saved && saved.answerIndex === q.lesson.questions[q.questionIndex].correctIndex;
              return <View key={q.id} testID={"weekly-review-stop-" + (index + 1)} style={styles.stopSlot}>
                <View style={[styles.stop, q.id === item?.id && !saved && styles.stopCurrent,
                  saved && (right ? styles.stopCorrect : styles.stopWrong)]}>
                  <Text style={[styles.stopGlyph, saved && styles.stopGlyphDone]}>{saved ? right ? "✓" : "×" : "·"}</Text>
                </View>
              </View>;
            })}
          </View>
        </View> : null}

      {expired ? <View style={styles.stateCard}>
        <Text style={styles.cardTitle}>Η εβδομάδα άλλαξε</Text>
        <Text style={styles.body}>Άλλαξε η εβδομάδα ή ο λογαριασμός. Άνοιξε ξανά την επανάληψη για τα τωρινά δεδομένα.</Text>
        <ActionButton label="Επιστροφή" onPress={onBack} style={styles.flatAction} />
      </View>
      : !snapshot.ready ? <View style={styles.stateCard}>
        <ActivityIndicator color={colors.accentLight} />
        <Text style={styles.body}>Φόρτωση προόδου…</Text>
      </View>
      : !items.length ? <View testID="weekly-review-empty" style={styles.stateCard}>
        <View style={styles.emptySeal}><Text style={styles.emptyStar}>✦</Text></View>
        <Text style={styles.cardTitle}>Όλα τακτοποιημένα!</Text>
        <Text style={styles.body}>Δεν υπάρχουν παλιές ερωτήσεις για επανάληψη αυτή την εβδομάδα. Έως 10 επιστρέφουν κάθε Δευτέρα, όταν υπάρχει κάτι να θυμηθείς.</Text>
        <ActionButton label="Επιστροφή στην εξερεύνηση" onPress={onBack} style={styles.flatAction} />
      </View>
      : finished ? <>
        <AtlasCard testID="weekly-review-result" entranceDelay={60} style={styles.scoreCard}>
          <View pointerEvents="none" style={styles.cardRim} />
          <View style={styles.scoreRow} accessible
            accessibilityLabel={"Σωστές απαντήσεις στην εβδομαδιαία επανάληψη: " + correct + " από " + items.length}>
            <View style={styles.scoreCopy}>
              <Text style={styles.eyebrow}>ΤΟ ΑΠΟΤΕΛΕΣΜΑ ΣΟΥ</Text>
              <Text style={styles.scoreHint}>Σωστές απαντήσεις</Text>
            </View>
            <Text style={styles.score}>{correct}<Text style={styles.scoreTotal}> / {items.length}</Text></Text>
          </View>
          <View style={styles.scoreFooter}>
            <Text style={styles.scoreFootLabel}>{wrongRows.length === 0 ? "Όλες σωστές — εξαιρετική ανάκληση!" : "Κάθε λάθος είναι μια νέα ευκαιρία μάθησης."}</Text>
            <View style={styles.reward}>
              <Text style={styles.rewardValue}>+{reward}</Text>
              <Text style={styles.rewardLabel}>XP επανάληψης</Text>
            </View>
          </View>
        </AtlasCard>
        {wrongRows.length > 0 ? <>
          <Pressable testID="weekly-review-corrections-toggle" accessibilityRole="button"
            accessibilityState={{ expanded: showCorrections }}
            onPress={() => setShowCorrections(value => !value)}
            style={({ pressed }) => [styles.correctionsToggle, pressed && styles.togglePressed]}>
            <Text style={styles.correctionsLabel}>{showCorrections ? "Απόκρυψη εξηγήσεων −"
              : "Δες τις εξηγήσεις (" + wrongRows.length + ") +"}</Text>
          </Pressable>
          {showCorrections ? <View testID="weekly-review-corrections" style={styles.corrections}>
            {wrongRows.map(q => {
              const missed = q.lesson.questions[q.questionIndex];
              return <View key={q.id} style={styles.correction}>
                <Text style={styles.correctionQuestion}>{missed.question}</Text>
                <Text style={styles.correctAnswer}>Σωστή απάντηση: {missed.answers[missed.correctIndex]}</Text>
                <Text style={styles.body}>{missed.explanation}</Text>
              </View>;
            })}
          </View> : null}
        </> : null}
        <ActionButton label="Πίσω στην πρόοδο" onPress={onBack} style={styles.flatAction} />
      </>
      : item && question ? <>
        <View style={styles.questionContext}>
          <Text style={styles.eyebrow}>ΑΠΟ ΤΟ ΜΑΘΗΜΑ</Text>
          <Text style={styles.questionLesson}>{item.lesson.title}</Text>
        </View>
        <SingleChoiceQuestionCard
          key={item.id}
          id={item.id}
          question={question.question}
          answers={displayAnswers}
          correctIndex={displayOrder.indexOf(question.correctIndex)}
          explanation={question.explanation}
          questionNumber={itemNumber}
          badgeLabel="ΕΒΔΟΜΑΔΙΑ ΕΠΑΝΑΛΗΨΗ"
          answer={committedDisplayIndex}
          onConfirm={displayIndex => choose(displayOrder[displayIndex])}
          showFeedback={false}
          reportTarget={lessonReportTarget(item.lesson, item.questionIndex)}
          testID="weekly-choice-card"
          testPrefix="weekly-choice"
        />
        {answer ? <View testID="weekly-review-feedback"
          style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}
          accessibilityLiveRegion="polite">
          <Text style={styles.feedbackTitle}>{isCorrect ? "Το κράτησες στη μνήμη σου!" : "Ας το θυμηθούμε"}</Text>
          {!isCorrect ? <Text style={styles.correctAnswer}>
            Σωστή απάντηση: {question.answers[question.correctIndex]}
          </Text> : null}
          <Text style={styles.body}>{question.explanation}</Text>
          <ActionButton label={done === items.length ? "Δες το αποτέλεσμα" : "Συνέχεια"}
            onPress={continueReview} style={styles.flatAction} />
        </View> : null}
      </> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chrome: { paddingTop: profileSectionLayout.top, paddingHorizontal: profileSectionLayout.horizontal },
  pageHeader: { marginBottom: profileSectionLayout.below },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center",
    paddingHorizontal: profileSectionLayout.horizontal, paddingTop: 5, paddingBottom: 38, gap: 13 },
  eyebrow: { color: "#BFB3ED", fontSize: 10, lineHeight: 16, fontWeight: "900", letterSpacing: 0.85 },
  lead: { gap: 5, paddingVertical: 4 },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: "900" },
  subtitle: { color: colors.textBody, fontSize: 13, lineHeight: 20 },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  error: { color: colors.error, fontSize: 13, lineHeight: 20 },
  journey: { padding: 13, borderRadius: 17, borderWidth: 1, borderColor: "#40435D", backgroundColor: "#1B2234", gap: 9 },
  journeyHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  journeyCount: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "900" },
  route: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "relative", minHeight: 26 },
  rail: { position: "absolute", height: 2, backgroundColor: "#454B64", left: "4%", right: "4%", top: 12 },
  stopSlot: { flex: 1, justifyContent: "center", alignItems: "center" },
  stop: { width: 22, height: 22, borderRadius: 12, backgroundColor: "#262D40",
    borderWidth: 1, borderColor: "#565C78", alignItems: "center", justifyContent: "center" },
  stopCurrent: { borderWidth: 2, borderColor: "#B1A5FF", backgroundColor: "#3A3655" },
  stopCorrect: { borderColor: "#83CBB3", backgroundColor: "#24473F" },
  stopWrong: { borderColor: "#DB98A8", backgroundColor: "#4B303C" },
  stopGlyph: { color: "#AEB3C5", fontSize: 14, lineHeight: 18, fontWeight: "900" },
  stopGlyphDone: { color: colors.text },
  stateCard: { padding: 18, gap: 13, borderWidth: 1, borderColor: "#464562",
    borderRadius: 21, backgroundColor: "#1B2033", alignItems: "stretch" },
  cardTitle: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: "900" },
  emptySeal: { width: 55, height: 55, backgroundColor: "#343252", borderRadius: 19,
    borderWidth: 1, borderColor: "#74699E", justifyContent: "center", alignItems: "center" },
  emptyStar: { color: "#DBCEFF", fontSize: 29 },
  scoreCard: { padding: 16, gap: 14, borderColor: "#4E4970", backgroundColor: "#1D2237", borderRadius: 21 },
  cardRim: { position: "absolute", top: 0, left: 20, right: 20, height: 2, backgroundColor: "#8576B9" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  scoreCopy: { flex: 1, minWidth: 0, gap: 6 },
  scoreHint: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  score: { color: colors.text, fontSize: 43, lineHeight: 52, fontWeight: "900" },
  scoreTotal: { color: colors.textMuted, fontSize: 18, fontWeight: "700" },
  scoreFooter: { paddingTop: 10, borderTopWidth: 1, borderColor: "#3C435B", gap: 10 },
  scoreFootLabel: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  reward: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  rewardValue: { color: colors.accentLight, fontSize: 19, lineHeight: 26, fontWeight: "900" },
  rewardLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 18 },
  correctionsToggle: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  togglePressed: { backgroundColor: "#292D45" },
  correctionsLabel: { color: "#CABDFF", fontSize: 13, lineHeight: 20, fontWeight: "800" },
  corrections: { gap: 9 },
  correction: { borderWidth: 1, borderColor: "#44445C", borderRadius: 15,
    backgroundColor: "#1A2030", gap: 8, padding: 13 },
  correctionQuestion: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "800" },
  correctAnswer: { color: "#9DD9C5", fontSize: 13, lineHeight: 21, fontWeight: "800" },
  questionContext: { gap: 3, paddingHorizontal: 1 },
  questionLesson: { color: colors.textBody, fontSize: 12, lineHeight: 19, fontWeight: "700" },
  feedback: { borderRadius: 17, padding: 15, gap: 11, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: "#193830", borderColor: "#407867" },
  feedbackWrong: { backgroundColor: "#342734", borderColor: "#775564" },
  feedbackTitle: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: "900" },
  flatAction: { marginTop: 0 },
});
