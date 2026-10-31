import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDailySnapshot, useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { restoreKnowledgeQuiz } from "../knowledge/session";
import { MASTERY_LABELS } from "../knowledge/model";
import { calculateQuizResults, questionToken } from "../quiz/engine";
import type { ChoiceQuestion, QuizSession } from "../quiz/types";
import { shuffledIndices } from "../utils/weeklyReview";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import SourceLink from "../components/SourceLink";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

export default function KnowledgeReviewScreen({ onBack }: { onBack: () => void }) {
  const { store } = useLearningSession(), learning = useLearningSnapshot(), daily = useDailySnapshot();
  const { model, today, ready } = useKnowledgeModel();
  const [message, setMessage] = useState("");
  const saved = learning.knowledgeSession;
  let quiz: QuizSession | null = null;
  if (saved) { try { quiz = restoreKnowledgeQuiz(saved); } catch { /* Retain incompatible attempt until explicitly closed. */ } }
  const expired = saved && (saved.date !== today || !quiz);
  const q = quiz?.questions[quiz.currentIndex] as ChoiceQuestion | undefined;
  const answer = q && quiz?.answers[q.id]?.value as number | undefined;
  const item = q && model.items.find(i => i.question.id === q.id);
  const completed = quiz?.completed ? calculateQuizResults(quiz) : null;
  function start(mode: "scheduled" | "practice") {
    if (!store.startKnowledgeReview(mode, daily.doc)) setMessage("Δεν υπάρχουν διαθέσιμες ερωτήσεις. Ολοκλήρωσε πρώτα ένα μάθημα ή καθημερινό quiz.");
    else setMessage("");
  }
  function close() { store.closeKnowledgeReview(saved?.id); setMessage(""); }
  return <ScrollView contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} backLabel="ΠΙΣΩ" /><SyncStatus quiet />
    <Text style={styles.label}>ΜΙΚΡΗ ΕΠΑΝΑΛΗΨΗ · ΜΕΓΑΛΗ ΔΙΑΦΟΡΑ</Text>
    <Text style={styles.title}>{completed ? "Η γνώση σου δυναμώνει" : "Τι θυμάσαι σήμερα;"}</Text>
    {message ? <Text style={styles.body} accessibilityLiveRegion="polite">{message}</Text> : null}
    {!ready ? <Text style={styles.body}>Φόρτωση…</Text>
      : expired ? <View style={styles.card}><Text style={styles.body}>Άλλαξε η ημέρα ή ενημερώθηκαν οι ερωτήσεις. Οι απαντήσεις σου διατηρούνται στην πρόοδο. Κλείσε αυτή την προσπάθεια για να ξεκινήσεις ξανά.</Text><ActionButton label="Νέα επανάληψη" onPress={close} /></View>
      : !saved || !quiz ? <View style={styles.card}>
        <Text style={styles.heading}>{model.due.length ? `${model.due.length} ερωτήσεις σε περιμένουν` : "Είσαι εντάξει για σήμερα"}</Text>
        <Text style={styles.body}>Έως 5 ερωτήσεις από όσα έχεις ήδη συναντήσει. Οι παλιότερες και οι πιο αδύναμες επιστρέφουν πρώτες.</Text>
        {model.due.length ? <ActionButton label="Ξεκίνα την επανάληψη" onPress={() => start("scheduled")} /> : null}
        <Text style={styles.body}>10 XP για ολοκλήρωση προγραμματισμένης επανάληψης, μία φορά την ημέρα. Η ελεύθερη εξάσκηση δεν δίνει XP· οι πρόωρες σωστές απαντήσεις δεν ανεβάζουν την κατάκτηση.</Text>
        {model.practice.length ? <ActionButton label="Θέλω λίγη εξάσκηση" onPress={() => start("practice")} /> : <Text style={styles.body}>Ολοκλήρωσε ένα μάθημα ή καθημερινό quiz για να δημιουργήσεις την πρώτη σου επανάληψη.</Text>}
        <ActionButton label="Επιστροφή" onPress={onBack} />
      </View>
      : completed ? <View style={styles.card} accessibilityLiveRegion="polite">
        <Text style={styles.heading}>{completed.correctCount} / {completed.total} σωστές · +{saved.earnedXP} XP</Text>
        <Text style={styles.body}>Κάθε ανάκληση δείχνει τι έμεινε. Τα λάθη επιστρέφουν νωρίτερα· οι σωστές απαντήσεις στη σειρά ανοίγουν μεγαλύτερα διαστήματα.</Text>
        {saved.questionIds.map((id, i) => { const row = model.items.find(k => k.question.id === id); return row ? <View key={id} style={styles.row}><Text style={styles.heading}>{row.topicTitle}</Text><Text style={styles.body}>{row.question.prompt}</Text><Text style={styles.body}>{MASTERY_LABELS[saved.beforeStates[i]]} → {MASTERY_LABELS[row.state]} · {row.successes}/3 ανακλήσεις</Text><Text style={styles.body}>Επόμενη επανάληψη: {row.due?.split("-").reverse().join("/") ?? "—"}</Text></View> : null; })}
        <ActionButton label="Πίσω στην πρόοδο" onPress={onBack} /><ActionButton label="Άλλη μικρή επανάληψη" onPress={close} />
      </View>
      : q && item ? <>
        <Text style={styles.label}>{quiz.currentIndex + 1} / {quiz.questions.length} · {saved.mode === "practice" ? "ΕΞΑΣΚΗΣΗ" : "ΕΠΑΝΑΛΗΨΗ"}</Text>
        <Text style={styles.body}>{item.topicTitle} · {MASTERY_LABELS[item.state]}</Text>
        <View style={styles.card}><Text style={styles.heading}>{q.prompt}</Text></View>
        {shuffledIndices(q.content.answers.length, `${saved.id}:${q.id}`).map((index, display) => <AnswerOption key={index} label={q.content.answers[index]} index={display} selected={answer === index} correct={q.content.correctIndex === index} locked={answer !== undefined} onPress={() => { if (!store.answerKnowledgeReview(saved.id, questionToken(quiz!), index, daily.doc)) setMessage("Η προσπάθεια άλλαξε. Άνοιξε ξανά την επανάληψη."); }} />)}
        {answer !== undefined ? <View style={styles.card} accessibilityLiveRegion="polite">
          <Text style={styles.heading}>{answer === q.content.correctIndex ? "Το θυμήθηκες!" : "Ας το θυμηθούμε ξανά"}</Text>
          <Text style={styles.body}>Σωστή απάντηση: {q.content.answers[q.content.correctIndex]}</Text><Text style={styles.body}>{q.explanation}</Text>
          <Text style={styles.body}>{saved.qualifiedIndices.includes(quiz.currentIndex) ? `${MASTERY_LABELS[saved.beforeStates[quiz.currentIndex]]} → ${MASTERY_LABELS[item.state]} · ${item.successes}/3 ανακλήσεις` : "Οι πρόωρες σωστές απαντήσεις και οι επαναλήψεις της ίδιας ημέρας δεν αυξάνουν την κατάκτηση. Ένα νέο λάθος φέρνει την επόμενη επανάληψη νωρίτερα."}</Text>
          <Text style={styles.body}>Επόμενη επανάληψη: {item.due?.split("-").reverse().join("/") ?? "—"}</Text>
          {q.sources.map(source => <SourceLink key={source.url} source={{ ...source, publisher: source.publisher ?? "Πηγή τεκμηρίωσης" }} />)}
          <ActionButton label={quiz.currentIndex === quiz.questions.length - 1 ? "Δες το αποτέλεσμα" : "Συνέχεια"} onPress={() => { if (!store.advanceKnowledgeReview(saved.id, questionToken(quiz!))) setMessage("Η προσπάθεια άλλαξε. Άνοιξε ξανά την επανάληψη."); }} />
        </View> : null}
      </> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 20, paddingBottom: 44, gap: 16 },
  label: { color: colors.accentLight, fontSize: 11, lineHeight: 19, fontWeight: "800" }, title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  heading: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "700" }, body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, padding: 20, gap: 14 }, row: { gap: 8, paddingVertical: 10, borderTopWidth: 1, borderColor: colors.border },
});
