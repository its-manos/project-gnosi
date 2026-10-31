import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { useAthensDate } from "../hooks/useAthensDate";
import { shuffledIndices, weeklyPlan } from "../utils/weeklyReview";
import { mondayOf } from "../utils/learningActivity";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import ReportContentButton from "../components/ReportContentButton";
import { lessonReportTarget } from "../utils/contentReports";
import { colors } from "../theme";

export default function WeeklyReviewScreen({ onBack }: { onBack: () => void }) {
  const { store } = useLearningSession(), snapshot = useLearningSnapshot(), today = useAthensDate();
  const [initial] = useState(() => ({ week: mondayOf(today), userId: snapshot.userId, items: weeklyPlan(snapshot.activity, snapshot.weeklyReviews, today) }));
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const expired = initial.week !== mondayOf(today) || initial.userId !== snapshot.userId;
  const items = initial.items;
  const item = items.find(q => q.id === feedbackId) ?? items.find(q => !snapshot.weeklyReviews[q.id]);
  const question = item?.lesson.questions[item.questionIndex];
  const answer = item ? snapshot.weeklyReviews[item.id] : undefined;
  const done = items.filter(q => snapshot.weeklyReviews[q.id]).length;
  const correct = items.filter(q => snapshot.weeklyReviews[q.id]?.answerIndex === q.lesson.questions[q.questionIndex].correctIndex).length;
  const finished = items.length > 0 && !item;
  function choose(answerIndex: number) {
    if (!item || expired || !snapshot.ready) return;
    if (store.answerWeekly(item.id, answerIndex)) { setFeedbackId(item.id); setMessage(""); }
    else setMessage("Η διαθέσιμη προσπάθεια ενημερώθηκε. Επέστρεψε και άνοιξε ξανά τη δεύτερη ευκαιρία.");
  }
  return <ScrollView contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} backLabel="ΠΙΣΩ" />
    <SyncStatus quiet />
    <Text style={styles.eyebrow}>ΕΒΔΟΜΑΔΑ ΑΠΟ {initial.week.split("-").reverse().join("/")}</Text>
    <Text style={styles.title}>{finished ? "Ένα βήμα πιο κοντά στη γνώση" : "Θυμάσαι τώρα;"}</Text>
    <Text style={styles.body}>Παλιά λάθη, νέα ευκαιρία. Μία απάντηση ανά ερώτηση αυτή την εβδομάδα.</Text>
    {message ? <Text style={styles.body} accessibilityLiveRegion="polite">{message}</Text> : null}
    {expired ? <View style={styles.card}><Text style={styles.body}>Άλλαξε η εβδομάδα ή ο λογαριασμός. Άνοιξε ξανά το quiz για τα τωρινά δεδομένα.</Text><ActionButton label="Επιστροφή" onPress={onBack} /></View>
      : !snapshot.ready ? <Text style={styles.body}>Φόρτωση προόδου…</Text>
      : !items.length ? <View style={styles.card}><Text style={styles.heading}>Καμία εκκρεμής ερώτηση αυτή την εβδομάδα</Text><Text style={styles.body}>Έως 10 παλιά λάθη επιστρέφουν κάθε Δευτέρα. Προς το παρόν, συνέχισε την εξερεύνηση!</Text><ActionButton label="Επιστροφή στην εξερεύνηση" onPress={onBack} /></View>
      : finished ? <View style={styles.card} accessibilityLiveRegion="polite"><Text style={styles.heading}>{correct} / {items.length} διορθώθηκαν</Text><Text style={styles.body}>{correct === items.length ? "Έδωσες σε κάθε παλιό λάθος μια νέα, σωστή απάντηση!" : "Τα λάθη είναι αφετηρία. Δες τις εξηγήσεις και θα τα ξανασυναντήσεις σε επόμενη εβδομάδα."}</Text>
        {items.filter(q => snapshot.weeklyReviews[q.id]?.answerIndex !== q.lesson.questions[q.questionIndex].correctIndex).map(q => <View key={q.id} style={styles.card}><Text style={styles.heading}>{q.lesson.questions[q.questionIndex].question}</Text><Text style={styles.body}>Σωστή απάντηση: {q.lesson.questions[q.questionIndex].answers[q.lesson.questions[q.questionIndex].correctIndex]}</Text><Text style={styles.body}>{q.lesson.questions[q.questionIndex].explanation}</Text></View>)}
        <Text style={styles.body}>XP ολοκλήρωσης: {snapshot.rewards?.[`review:${initial.week}`] ?? 0}</Text><ActionButton label="Πίσω στην πρόοδο" onPress={onBack} /></View>
      : item && question ? <>
        <Text style={styles.eyebrow}>{done} / {items.length} ΑΠΑΝΤΗΘΗΚΑΝ · {item.lesson.title}</Text>
        <View style={styles.card}><Text style={styles.heading}>{question.question}</Text></View>
        <ReportContentButton key={item.id} target={lessonReportTarget(item.lesson, item.questionIndex)} />
        {shuffledIndices(question.answers.length, item.id).map((originalIndex, displayIndex) => <AnswerOption key={originalIndex} label={question.answers[originalIndex]} index={displayIndex} selected={answer?.answerIndex === originalIndex} correct={question.correctIndex === originalIndex} locked={Boolean(answer)} onPress={() => choose(originalIndex)} />)}
        {answer ? <View style={styles.card} accessibilityLiveRegion="polite"><Text style={styles.heading}>{answer.answerIndex === question.correctIndex ? "Το κράτησες στη μνήμη σου!" : "Ας το θυμηθούμε"}</Text><Text style={styles.body}>{question.explanation}</Text><Text style={styles.body}>{answer.answerIndex === question.correctIndex ? "Η ερώτηση κατακτήθηκε!" : "Θα έχεις άλλη ευκαιρία σε επόμενη εβδομάδα."}</Text><ActionButton label={done === items.length ? "Δες το αποτέλεσμα" : "Συνέχεια"} onPress={() => setFeedbackId(null)} /></View> : null}
      </> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 20, paddingBottom: 44, gap: 16 },
  eyebrow: { color: colors.accentLight, fontSize: 11, lineHeight: 19, fontWeight: "800" },
  title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  heading: { color: colors.text, fontSize: 21, lineHeight: 30, fontWeight: "700" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, padding: 20, gap: 14 },
});
