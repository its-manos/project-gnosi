import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import QuestionStageFooter from "../components/QuestionStageFooter";
import QuestionStageProgress from "../components/QuestionStageProgress";
import QuizQuestionRenderer from "../components/QuizQuestionRenderer";
import QuizReveal from "../components/QuizReveal";
import SourceLink from "../components/SourceLink";
import SyncStatus from "../components/SyncStatus";
import { useMistakesModel } from "../hooks/useMistakesModel";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
import { asBuiltinQuestion, currentMistakeSession, mistakeKey } from "../knowledge/mistakes";
import { requestPracticeCue } from "../play/soundStatus";
import { calculateQuizResults, questionToken } from "../quiz/engine";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { colors } from "../theme";

export default function KnowledgeReviewScreen({ onBack }: { onBack: () => void }) {
  const { store } = useLearningSession(), learning = useLearningSnapshot();
  const { model } = useMistakesModel();
  const saved = learning.mistakeSession, quiz = saved?.quiz;
  const current = saved ? currentMistakeSession(saved) : true;
  const q = quiz?.questions[quiz.currentIndex], answer = q && quiz?.answers[q.id];
  const results = quiz?.completed ? calculateQuizResults(quiz) : null;
  const active = current && q && quiz && !results;
  const key = `${quiz?.id}:${q?.id}`;
  const { action, onActionChange } = useQuestionStageAction(key);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [message, setMessage] = useState("");
  const [sources, setSources] = useState(false);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); setSources(false); }, [key, !!results]);
  const opening = active && !answer ? key : null;
  useEffect(() => { if (opening) requestPracticeCue("question-open"); }, [opening]);
  const close = () => { store.closeMistakeReview(quiz?.id); setMessage(""); };
  const start = () => { if (!store.startMistakeReview()) setMessage("Δεν υπάρχουν άλλα διαθέσιμα λάθη για επανάληψη."); };
  const row = q && learning.mistakes[mistakeKey(q)];
  const corrected = !!row?.wrong && row.correctAt > row.wrong.at;
  return <View style={styles.screen} testID="knowledge-review-screen">
    <ProgressGradientBackground />
    <ProfileSectionHeader title={results ? "Αποτελέσματα" : "Επανάληψη λαθών"}
      actionLabel="‹ Πίσω" actionAccessibilityLabel="Επιστροφή στην προηγούμενη οθόνη" onAction={onBack} style={styles.header} />
    <ScrollView ref={scroll} style={styles.viewport} contentContainerStyle={styles.content}>
      <SyncStatus quiet />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
      {!current ? <AtlasCard style={styles.card}>
        <Text style={styles.heading}>Οι ερωτήσεις ενημερώθηκαν</Text>
        <Text style={styles.body}>Οι απαντήσεις σου διατηρήθηκαν. Ξεκίνα νέο γύρο με τις διαθέσιμες ερωτήσεις.</Text>
        <ActionButton label="Νέος γύρος" onPress={close} />
      </AtlasCard> : !quiz ? <AtlasCard style={styles.card}>
        <Text style={styles.heading}>{model.pending.length ? `${model.pending.length} λάθη για επανάληψη` : "Δεν έχεις εκκρεμή λάθη"}</Text>
        <Text style={styles.body}>Μία σωστή απάντηση αρκεί. Έως 5 ερωτήσεις ανά γύρο, χωρίς επανάληψη της ίδιας ερώτησης μέσα στον γύρο.</Text>
        <Text style={styles.body}>+10 XP την ημέρα όταν ολοκληρώνεις γύρο και διορθώνεις τουλάχιστον ένα λάθος που δεν έχει δώσει ξανά αυτό το μπόνους.</Text>
        {model.pending.length ? <ActionButton label="Ξεκίνα την επανάληψη →" onPress={start} /> : <Text style={styles.body}>Τα επόμενα λάθη από μαθήματα και κουίζ θα εμφανιστούν αυτόματα εδώ.</Text>}
      </AtlasCard> : results ? <>
        <AtlasCard style={styles.card} testID="knowledge-review-result">
          <Text style={styles.heading}>{results.correctCount} / {results.total} σωστές</Text>
          <Text style={styles.body}>{model.pending.length ? `${model.pending.length} λάθη απομένουν. Όσα έχασες μένουν για άλλον γύρο, όποτε θέλεις.` : "Διόρθωσες όλα τα διαθέσιμα λάθη σου."}</Text>
          <Text style={styles.link}>+{saved!.earnedXP} XP</Text>
          <Text style={styles.body}>Οι διορθώσεις έχουν ήδη αποθηκευτεί.</Text>
        </AtlasCard>
        {model.pending.length ? <ActionButton label="Άλλος ένας γύρος" onPress={() => { close(); start(); }} /> : null}
      </> : active ? <>
        <QuestionStageProgress current={quiz.currentIndex + 1} total={quiz.questions.length} />
        <QuizReveal key={key}><QuizQuestionRenderer question={asBuiltinQuestion(q)} answer={answer?.value}
          compactAnswered onActionChange={onActionChange} onSubmit={value => {
            if (!store.answerMistakeReview(quiz.id, questionToken(quiz), value)) {
              setMessage("Η προσπάθεια άλλαξε. Άνοιξε ξανά την επανάληψη.");
              throw new Error("mistake_answer_not_saved");
            }
          }} /></QuizReveal>
        {answer ? <Text style={styles.body} accessibilityLiveRegion="polite">{corrected ? "Διορθώθηκε ✓ Δεν χρειάζεται άλλη σωστή απάντηση." : "Μένει για έναν επόμενο γύρο, όποτε θελήσεις."}</Text> : null}
        {answer && q.sources.length ? <>
          <Pressable style={styles.button} accessibilityRole="button" accessibilityState={{ expanded: sources }} onPress={() => setSources(v => !v)}><Text style={styles.link}>{sources ? "Κλείσιμο πηγών ↑" : "Πηγές ↓"}</Text></Pressable>
          {sources ? q.sources.map(source => <SourceLink key={source.url} source={{ ...source, publisher: source.publisher ?? "Πηγή τεκμηρίωσης" }} />) : null}
        </> : null}
      </> : null}
    </ScrollView>
    {active ? <QuestionStageFooter action={answer ? {
      label: quiz.currentIndex === quiz.questions.length - 1 ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →", disabled: false,
      onPress: () => { if (!store.advanceMistakeReview(quiz.id, questionToken(quiz))) setMessage("Η προσπάθεια άλλαξε. Άνοιξε ξανά την επανάληψη."); },
    } : action} /> : results ? <QuestionStageFooter action={{ label: "Πίσω στην πρόοδο", disabled: false, onPress: onBack }} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: profileSectionLayout.horizontal, marginTop: profileSectionLayout.top },
  viewport: { flex: 1 }, content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 12, paddingHorizontal: profileSectionLayout.horizontal, paddingVertical: 16 },
  card: { padding: 18, gap: 12 }, heading: { color: colors.text, fontSize: 21, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22 }, link: { color: colors.accentLight, fontSize: 14, fontWeight: "800" }, button: { minHeight: 44, justifyContent: "center" },
});
