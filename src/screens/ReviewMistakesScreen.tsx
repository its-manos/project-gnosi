import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Lesson } from "../data/lessons";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import QuestionStageFooter from "../components/QuestionStageFooter";
import { useAdaptiveQuestionScroll } from "../hooks/useAdaptiveQuestionScroll";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
import { lessonReportTarget } from "../utils/contentReports";
import { colors } from "../theme";

type Props = {
  lesson: Lesson;
  indices: number[];
  index: number;
  selected: number | null;
  onChoose: (answer: number) => void;
  onNext: () => void;
  onRetry: () => void;
  onBack: () => void;
};

/** Reuses the lesson question and feedback system. The parent still owns
 * all answers, retries and completion; this screen never awards XP or changes
 * the original score.
 */
export default function ReviewMistakesScreen({
  lesson, indices, index, selected, onChoose, onNext, onRetry, onBack,
}: Props) {
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 760 || fontScale >= 1.2;
  const viewport = useAdaptiveQuestionScroll();
  const [retryRound, setRetryRound] = useState(0);
  const questionIndex = indices[index];
  const question = lesson.questions[questionIndex];
  const finished = indices.length > 0 && index >= indices.length;
  const correct = !!question && selected !== null && selected === question.correctIndex;
  const stageKey = lesson.id + ":" + String(questionIndex ?? "done") + ":" + retryRound;
  const stageAction = useQuestionStageAction(stageKey);
  const completed = finished ? indices.length : Math.min(index, indices.length);

  const retry = () => {
    // A retry must recreate the shared card's draft and confirmation guard.
    setRetryRound(round => round + 1);
    onRetry();
  };
  const footerAction = finished || !question
    ? { label: "Πίσω στα αποτελέσματα", disabled: false, onPress: onBack }
    : selected !== null
      ? { label: correct
          ? index === indices.length - 1 ? "Ολοκλήρωση εξάσκησης →" : "Επόμενη ερώτηση →"
          : "Δοκίμασε ξανά →",
          disabled: false, onPress: correct ? onNext : retry }
      : stageAction.action;

  return <View testID="mistake-practice-screen" style={styles.root}>
    <ProgressGradientBackground />
    <View style={styles.chrome}>
      <ProfileSectionHeader eyebrow="ΚΥΚΛΟΣ ΜΑΘΗΣΗΣ" title="Εξάσκηση στα λάθη"
        actionLabel="Αποτέλεσμα" actionAccessibilityLabel="Πίσω στο αποτέλεσμα"
        onAction={onBack} />
    </View>

    <ScrollView testID="mistake-practice-viewport" style={styles.viewport}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      onLayout={viewport.onLayout} onContentSizeChange={viewport.onContentSizeChange}
      scrollEnabled={viewport.scrollEnabled} bounces={viewport.scrollEnabled}
      showsVerticalScrollIndicator={false}>
      {question && !finished ? <>
        <View testID="mistake-practice-progress" style={styles.progress}>
          <View style={styles.progressHeading}>
            <View style={styles.progressCopy}>
              <Text style={styles.eyebrow}>ΔΕΥΤΕΡΗ ΕΥΚΑΙΡΙΑ</Text>
              <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
            </View>
            <Text style={styles.progressCount}>{index + 1} / {indices.length}</Text>
          </View>
          <View style={styles.route} accessible accessibilityRole="progressbar"
            accessibilityLabel={"Εξάσκηση στα λάθη: ολοκληρώθηκαν " + completed + " από " + indices.length + " ερωτήσεις"}
            accessibilityValue={{ min: 0, max: indices.length, now: completed }}>
            {indices.map((questionId, step) => <View key={questionId}
              style={[styles.stop, step < index && styles.stopComplete,
                step === index && styles.stopCurrent]} />)}
          </View>
        </View>
        <SingleChoiceQuestionCard key={stageKey} id={stageKey}
          testID="mistake-practice-question" testPrefix="mistake-practice-choice"
          question={question.question} answers={question.answers}
          correctIndex={question.correctIndex} explanation={question.explanation}
          questionNumber={index + 1} badgeLabel="ΔΙΟΡΘΩΣΕ ΤΟ ΛΑΘΟΣ"
          answer={selected === null ? undefined : selected}
          compactAnswered={selected !== null}
          onConfirm={onChoose} onActionChange={stageAction.onActionChange}
          reportTarget={lessonReportTarget(lesson, questionIndex)} />
        {selected === null ? <Text style={styles.note}>Το αρχικό σου σκορ παραμένει ίδιο.</Text> : null}
      </> : finished ? <View testID="mistake-practice-finished" style={styles.completion}>
        <View style={styles.medal} accessible accessibilityLabel={"Διορθώθηκαν " + indices.length + " από " + indices.length + " ερωτήσεις"}>
          <Text style={styles.medalText}>✓</Text>
        </View>
        <Text style={styles.eyebrow}>Η ΕΞΑΣΚΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
        <Text accessibilityRole="header" style={styles.completeTitle}>Τα διόρθωσες όλα!</Text>
        <Text style={styles.completeCount}>{indices.length} / {indices.length}</Text>
        <Text style={styles.completeDescription}>Έδωσες σωστή απάντηση σε κάθε λάθος που επανεξέτασες. Το αρχικό σκορ παραμένει ίδιο.</Text>
      </View> : <View testID="mistake-practice-empty" style={styles.completion}>
        <Text accessibilityRole="header" style={styles.completeTitle}>Δεν υπάρχουν λάθη για εξάσκηση.</Text>
        <Text style={styles.completeDescription}>Επίστρεψε στο αποτέλεσμα του μαθήματος.</Text>
      </View>}
    </ScrollView>
    <QuestionStageFooter action={footerAction} bottomInset={0} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  chrome: { paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top,
    paddingBottom: profileSectionLayout.below },
  viewport: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, width: "100%", maxWidth: 640, alignSelf: "center",
    justifyContent: "center", paddingHorizontal: 18, paddingTop: 7, paddingBottom: 14, gap: 10 },
  contentCompact: { paddingTop: 0, paddingBottom: 8, gap: 6 },
  progress: { gap: 11, paddingHorizontal: 2 },
  progressHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  progressCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { color: "#BBAEEC", fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8 },
  lessonTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  progressCount: { color: "#DDD2FF", fontSize: 14, lineHeight: 21, fontWeight: "900",
    fontVariant: ["tabular-nums"] },
  route: { flexDirection: "row", gap: 7, width: "100%" },
  stop: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "#3A4059" },
  stopComplete: { backgroundColor: colors.success },
  stopCurrent: { backgroundColor: "#A69AF2" },
  note: { color: colors.textMuted, textAlign: "center", fontSize: 12, lineHeight: 18 },
  completion: { flex: 1, justifyContent: "center", alignItems: "center", gap: 13,
    paddingVertical: 28, paddingHorizontal: 20 },
  medal: { width: 104, height: 104, borderRadius: 52,
    backgroundColor: "#2B3350", borderWidth: 2, borderColor: "#9C8BD8",
    alignItems: "center", justifyContent: "center", marginBottom: 6 },
  medalText: { color: "#D9F4E9", fontSize: 52, lineHeight: 65, fontWeight: "900" },
  completeTitle: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900", textAlign: "center" },
  completeCount: { color: "#CBBDF6", fontSize: 28, lineHeight: 35, fontWeight: "900", fontVariant: ["tabular-nums"] },
  completeDescription: { color: colors.textBody, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 345 },
});
