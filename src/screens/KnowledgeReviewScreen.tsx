import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import QuestionStageFooter from "../components/QuestionStageFooter";
import QuestionStageProgress from "../components/QuestionStageProgress";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import SourceLink from "../components/SourceLink";
import SyncStatus from "../components/SyncStatus";
import { lessons } from "../data/lessons";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { conceptById } from "../knowledge/concepts";
import { MASTERY_LABELS } from "../knowledge/model";
import { isCurrentKnowledgeSession, restoreKnowledgeQuiz } from "../knowledge/session";
import { calculateQuizResults, questionToken } from "../quiz/engine";
import type { ChoiceQuestion, QuizSession } from "../quiz/types";
import { useDailySnapshot, useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { colors } from "../theme";
import { getParagraphText } from "../utils/lessonProgress";
import { shuffledIndices } from "../utils/weeklyReview";

export default function KnowledgeReviewScreen({ onBack }: { onBack: () => void }) {
  const { store } = useLearningSession(), learning = useLearningSnapshot(), daily = useDailySnapshot();
  const { model, today, ready } = useKnowledgeModel();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [sectionFor, setSectionFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showResultsDetail, setShowResultsDetail] = useState(false);
  const saved = learning.knowledgeSession;
  let restoredQuiz: QuizSession | null = null;
  if (saved) {
    try { restoredQuiz = restoreKnowledgeQuiz(saved); } catch { /* Keep incompatible attempts until explicitly closed. */ }
  }
  const quiz = restoredQuiz;
  const expired = !!saved && (saved.date !== today || !quiz || !isCurrentKnowledgeSession(saved));
  const q = quiz?.questions[quiz.currentIndex] as ChoiceQuestion | undefined;
  const answer = q && quiz?.answers[q.id]?.value as number | undefined;
  const item = q && model.items.find(i => i.question.id === q.id);
  const concept = item?.conceptId ? conceptById.get(item.conceptId) : undefined;
  const teachingLesson = concept ? lessons.find(l => l.id === concept.lessonIds[0]) : undefined;
  const variantIndex = concept?.variants.findIndex(v => v.id === q?.id) ?? -1;
  const section = concept && variantIndex >= 0 ? teachingLesson?.sections[concept.teachingSections[variantIndex]] : undefined;
  const completed = quiz?.completed ? calculateQuizResults(quiz) : null;
  const active = ready && !expired && saved && quiz && q && item && !completed;
  const pageKey = `${saved?.id}:${quiz?.currentIndex}:${!!completed}:${answer !== undefined}:${expired}`;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [pageKey]);

  function nextReview(row: NonNullable<typeof item>) {
    if (row.state === "mastered") return "Η έννοια κατακτήθηκε.";
    if (row.evidenceStatus === "needs-evidence") return "Χρειάζονται περισσότερες διαφορετικές δοκιμές.";
    if (row.due) return `Επόμενη επανάληψη: ${row.due.split("-").reverse().join("/")}`;
    return "Χρειάζονται νέες, διαφορετικές δοκιμές.";
  }

  function start(mode: "scheduled" | "practice") {
    if (store.startKnowledgeReview(mode, daily.doc)) setMessage("");
    else setMessage("Δεν υπάρχουν άλλες διαθέσιμες δοκιμές.");
  }

  function close() {
    store.closeKnowledgeReview(saved?.id);
    setShowResultsDetail(false);
    setSectionFor(null);
    setMessage("");
  }

  function staleAttempt() {
    setMessage("Η προσπάθεια άλλαξε. Άνοιξε ξανά την επανάληψη.");
  }

  const order = saved && q ? shuffledIndices(q.content.answers.length, `${saved.id}:${q.id}`) : [];
  const practice = saved?.mode === "practice";
  const last = quiz?.currentIndex === (quiz?.questions.length ?? 0) - 1;
  return <View style={styles.screen} testID="knowledge-review-screen">
    <ProgressGradientBackground />
    <ProfileSectionHeader
      title={completed && !expired ? "Αποτελέσματα" : active && practice ? "Εξάσκηση" : "Επανάληψη"}
      actionLabel="‹ Πίσω" actionAccessibilityLabel="Επιστροφή στην προηγούμενη οθόνη"
      onAction={onBack} style={styles.header} />
    <ScrollView ref={scroll} style={styles.viewport} contentContainerStyle={styles.content}
      bounces={false} keyboardShouldPersistTaps="handled">
      <SyncStatus quiet />
      {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}
      {!ready ? <ActivityIndicator color={colors.accentLight} accessibilityLabel="Φόρτωση επανάληψης" />
        : expired ? <AtlasCard style={styles.card}>
          <Text style={styles.heading}>Η προσπάθεια ενημερώθηκε</Text>
          <Text style={styles.body}>Άλλαξε η ημέρα ή ενημερώθηκαν οι ερωτήσεις. Οι απαντήσεις σου έχουν αποθηκευτεί.</Text>
          <ActionButton label="Νέα επανάληψη" onPress={close} />
        </AtlasCard>
        : !saved || !quiz ? <AtlasCard style={styles.card}>
          <Text style={styles.heading}>{model.due.length ? `${model.due.length} ερωτήσεις σε περιμένουν` : "Είσαι εντάξει για σήμερα"}</Text>
          {model.due.length > 0 ? <>
            <Text style={styles.body}>Έως 5 ερωτήσεις ανά γύρο. Κέρδισε έως 10 XP την ημέρα με προγραμματισμένη επανάληψη.</Text>
            <ActionButton label="Ξεκίνα την επανάληψη" onPress={() => start("scheduled")} />
          </> : null}
          {model.practice.length ? model.due.length ? <Pressable style={styles.linkButton} accessibilityRole="button" onPress={() => start("practice")}>
            <Text style={styles.link}>Ελεύθερη εξάσκηση · χωρίς XP</Text>
          </Pressable> : <>
            <Text style={styles.body}>Η ελεύθερη εξάσκηση δεν δίνει XP ή πρόοδο κατάκτησης.</Text>
            <ActionButton label="Θέλω λίγη εξάσκηση" onPress={() => start("practice")} />
          </> : !model.due.length ? <Text style={styles.body}>Ολοκλήρωσε ένα μάθημα ή ένα καθημερινό κουίζ για την πρώτη σου επανάληψη.</Text> : null}
        </AtlasCard>
        : completed ? <>
          <AtlasCard style={[styles.card, styles.scoreCard]} testID="knowledge-review-result">
            <Text style={styles.label}>{completed.correctCount === completed.total ? "ΟΛΕΣ ΣΩΣΤΕΣ" : "ΣΩΣΤΕΣ ΑΠΑΝΤΗΣΕΙΣ"}</Text>
            <Text style={styles.score} accessibilityLabel={`${completed.correctCount} από ${completed.total} σωστές`}>
              {completed.correctCount}<Text style={styles.scoreTotal}> / {completed.total}</Text>
            </Text>
            <Text style={styles.link}>+{saved.earnedXP} XP</Text>
          </AtlasCard>
          <Pressable style={styles.linkButton} accessibilityRole="button" onPress={close}>
            <Text style={styles.link}>Άλλη μικρή επανάληψη</Text>
          </Pressable>
          <Pressable style={styles.linkButton} accessibilityRole="button" accessibilityState={{ expanded: showResultsDetail }}
            onPress={() => setShowResultsDetail(value => !value)}>
            <Text style={styles.link}>{showResultsDetail ? "Απόκρυψη προόδου ↑" : "Πρόοδος εννοιών ↓"}</Text>
          </Pressable>
          {showResultsDetail ? saved.questionIds.map((id, i) => {
            const row = model.items.find(k => k.question.id === id);
            return row ? <AtlasCard key={id} style={styles.card}>
              <Text style={styles.heading}>{row.topicTitle}</Text>
              <Text style={styles.body}>{row.question.prompt}</Text>
              <Text style={styles.body}>{MASTERY_LABELS[saved.beforeStates[i]]} → {MASTERY_LABELS[row.state]} · {row.successes}/3 διαφορετικές δοκιμές</Text>
              <Text style={styles.body}>{nextReview(row)}</Text>
            </AtlasCard> : null;
          }) : null}
        </>
        : active ? <>
          <QuestionStageProgress current={quiz.currentIndex + 1} total={quiz.questions.length} />
          <SingleChoiceQuestionCard key={`${saved.id}:${q.id}`} id={q.id} question={q.prompt}
            answers={order.map(index => q.content.answers[index])} correctIndex={order.indexOf(q.content.correctIndex)}
            explanation={q.explanation} badgeLabel={item.topicTitle}
            answer={answer === undefined ? undefined : order.indexOf(answer)}
            compactAnswered commitOnSelect
            onConfirm={displayIndex => {
              if (store.answerKnowledgeReview(saved.id, questionToken(quiz), order[displayIndex], daily.doc)) {
                setMessage("");
              } else {
                staleAttempt();
                throw new Error("knowledge_review_answer_not_saved");
              }
            }}
            feedbackExtra={<>
              {saved.qualifiedIndices.includes(quiz.currentIndex) ? <Text style={styles.body}>
                {MASTERY_LABELS[item.state]} · {item.successes}/3 διαφορετικές δοκιμές
              </Text> : null}
              {(section || q.sources.length > 0) ? <>
                <Pressable style={styles.linkButton} accessibilityRole="button" accessibilityState={{ expanded: sectionFor === q.id }}
                  onPress={() => setSectionFor(value => value === q.id ? null : q.id)}>
                  <Text style={styles.link}>{sectionFor === q.id ? "Λιγότερα ↑" : section ? "Σχετική ενότητα και πηγές ↓" : "Πηγές ↓"}</Text>
                </Pressable>
                {sectionFor === q.id ? <>
                  {section ? <View style={styles.excerpt} testID="review-teaching-section">
                    <Text style={styles.heading}>{section.title}</Text>
                    {section.paragraphs.map((p, i) => <Text key={i} style={styles.body}>{getParagraphText(p)}</Text>)}
                  </View> : null}
                  {q.sources.map(source => <SourceLink key={source.url} source={{ ...source, publisher: source.publisher ?? "Πηγή τεκμηρίωσης" }} />)}
                </> : null}
              </> : null}
            </>} />
        </> : null}
    </ScrollView>
    {active && answer !== undefined ? <QuestionStageFooter action={{
      label: last ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →", disabled: false,
      onPress: () => {
        if (store.advanceKnowledgeReview(saved.id, questionToken(quiz))) setMessage("");
        else staleAttempt();
      },
    }} /> : ready && !expired && completed ? <QuestionStageFooter action={{
      label: "Πίσω στην πρόοδο", disabled: false, onPress: onBack,
    }} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: profileSectionLayout.horizontal, marginTop: profileSectionLayout.top },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 10,
    paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.below, paddingBottom: 12 },
  card: { padding: 16, gap: 8 },
  scoreCard: { alignItems: "center", paddingVertical: 22 },
  score: { color: colors.text, fontSize: 48, fontWeight: "900" },
  scoreTotal: { color: colors.accentLight, fontSize: 24 },
  label: { color: colors.accentLight, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  heading: { color: colors.text, fontSize: 18, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22 },
  error: { color: colors.error, fontWeight: "700" },
  linkButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
  excerpt: { gap: 8 },
});
