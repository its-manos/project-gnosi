import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Lesson } from "../data/lessons";
import { MotionView } from "../components/HomeMotion";
import { ProgressBarFill } from "../components/ProgressMotion";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import ProgressTrack from "../components/ProgressTrack";
import AtlasContinueCard, { atlasContinueStyles } from "../components/AtlasContinueCard";
import { playerTitle } from "../gamification/rules";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import type { ReviewState } from "../utils/lessonReview";
import type { lessonScores as calculateLessonScores } from "../utils/weeklyReview";
import { colors } from "../theme";

type Props = {
  earnedXP?: number; highestCombo?: number;
  lesson: Lesson; score: number; onHome: () => void; onReadAgain: () => void;
  onOpenLesson: (id: string) => void; onBrowse: () => void; nextLesson?: Lesson | null;
  pathProgress?: { title: string; completed: number; total: number };
  lessonScores?: ReturnType<typeof calculateLessonScores>; onWeeklyReview?: () => void;
  review?: ReviewState; returning?: boolean; practiceComplete?: boolean; onReviewMistakes?: () => void;
};

/** One reward moment, two progression rails, one always-visible next step.
 * No XP writes or scoring changes: the existing stores are the source of truth.
 */
export default function ResultsScreen({
  earnedXP = 0, highestCombo = 0, lesson, score, onHome, onReadAgain,
  onOpenLesson, onBrowse, nextLesson, pathProgress, review, returning = false,
  practiceComplete = false, onReviewMistakes, lessonScores,
}: Props) {
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 950 || fontScale >= 1.18;
  const tight = height < 790 && fontScale < 1.18;
  // Scroll only when content genuinely overflows; flexGrow fills spare height.
  const allowScroll = true;
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const total = getInlineQuestionCount(lesson);
  // Older versions may not have comparable answers. Do not invent accuracy.
  const displayedScore = returning
    ? lessonScores?.best ?? (review?.status !== "changed" ? review?.result?.correctCount ?? null : null)
    : score;
  const count = displayedScore !== null && total > 0
    ? Math.max(0, Math.min(total, displayedScore)) : null;
  const accuracy = count === null ? null : Math.round(count / total * 100);
  const perfect = count !== null && count === total;
  const positive = count !== null && count / total >= 0.75;
  const heading = returning ? "Η επίδοσή σου" : perfect ? "Άψογα!" : positive ? "Πολύ καλά!" : "Συνεχίζεις!";
  const pathTotal = Math.max(0, pathProgress?.total ?? 0);
  const pathCompleted = Math.max(0, Math.min(pathTotal, pathProgress?.completed ?? 0));
  const pathPercent = pathTotal > 0 ? pathCompleted / pathTotal * 100 : 0;
  const pathComplete = pathTotal > 0 && pathCompleted === pathTotal;
  const required = Math.max(1, profile.required);
  const earned = Math.max(0, Math.min(required, profile.earned));
  const levelPercent = profileReady ? earned / required * 100 : 0;
  const canPractice = review?.status === "available" && !!onReviewMistakes;
  const awarded = !returning && earnedXP > 0;
  const nextAction = nextLesson ? () => onOpenLesson(nextLesson.id) : onBrowse;
  const nextLabel = nextLesson
    ? "Επόμενο μάθημα"
    : pathComplete ? "Νέα διαδρομή" : "Συνέχισε την εξερεύνηση";
  const nextTitle = nextLesson?.title ?? (pathComplete ? "Διάλεξε νέα θεματική" : "Εξερεύνησε τους κόσμους");

  return <View style={styles.root} testID="lesson-results-screen">
    <ProgressGradientBackground />
    <View style={styles.chrome}>
      <ProfileSectionHeader eyebrow="ΜΑΘΗΜΑ" title="Αποτελέσματα"
        actionLabel="Αρχική" actionAccessibilityLabel="Επιστροφή στην αρχική"
        onAction={onHome} style={styles.header} />
    </View>

    <ScrollView style={styles.viewport} contentContainerStyle={[styles.content, compact && styles.contentCompact, tight && styles.contentTight]}
      scrollEnabled={allowScroll} bounces={false} showsVerticalScrollIndicator={false}>
      <MotionView entranceDelay={45} testID="lesson-result-hero"
        style={[styles.hero, compact && styles.heroCompact, tight && styles.heroTight]}>
        <View style={[styles.medal, compact && styles.medalCompact, tight && styles.medalTight]} accessible
          accessibilityLabel={count === null ? "Ολοκληρωμένο μάθημα, χωρίς συγκρίσιμο παλιότερο σκορ"
            : count + " από " + total + " σωστές απαντήσεις"}>
          <View style={[styles.medalHalo, compact && styles.medalHaloCompact, tight && styles.medalHaloTight, perfect && styles.medalHaloPerfect]} pointerEvents="none" />
          <View style={[styles.medalCore, compact && styles.medalCoreCompact, tight && styles.medalCoreTight, perfect && styles.medalCorePerfect]}>
            <Text style={[styles.medalNumber, compact && styles.medalNumberCompact]}>{count ?? "✓"}</Text>
            {count !== null ? <Text style={styles.medalTotal}>/ {total}</Text> : null}
          </View>
          <View style={[styles.medalSpark, tight && styles.medalSparkTight]} pointerEvents="none"><Text style={styles.sparkGlyph}>✦</Text></View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{returning ? "ΟΛΟΚΛΗΡΩΜΕΝΟ ΜΑΘΗΜΑ" : "ΑΠΟΣΤΟΛΗ ΟΛΟΚΛΗΡΩΘΗΚΕ"}</Text>
          <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>{heading}</Text>
          <Text style={styles.lessonTitle} numberOfLines={3}>{lesson.title}</Text>
        </View>
      </MotionView>

      <MotionView entranceDelay={105} testID="lesson-result-score"
        style={[styles.rewardBar, compact && styles.rewardBarCompact, tight && styles.rewardBarTight]}>
        <View style={styles.rewardColumn}>
          <Text style={styles.rewardValue} numberOfLines={1}>
            <Text style={styles.xpSymbol}>✦ </Text>
            {awarded ? "+" + earnedXP : profileReady ? profile.totalXP.toLocaleString("el-GR") : "—"}
          </Text>
          <Text style={styles.rewardLabel}>{awarded ? "XP ΚΕΡΔΙΣΕΣ" : "ΣΥΝΟΛΙΚΑ XP"}</Text>
        </View>
        <View style={styles.rewardDivider} />
        {accuracy === null ?
          <View style={styles.rewardColumn}><Text style={styles.rewardValue}>—</Text>
            <Text style={styles.rewardLabel}>ΠΑΛΙΟ ΣΚΟΡ</Text></View> :
          <View style={styles.rewardColumn}>
            <Text style={styles.rewardValue}>{accuracy}%</Text>
            <Text style={styles.rewardLabel}>ΑΚΡΙΒΕΙΑ</Text>
          </View>}
        {!returning ? <>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardColumn}>
            <Text style={styles.rewardValue}>{highestCombo}</Text>
            <Text style={styles.rewardLabel}>ΣΕΡΙ ΣΩΣΤΩΝ</Text>
          </View>
        </> : null}
      </MotionView>

      <MotionView entranceDelay={160} testID="lesson-progression" style={[styles.progressCard, compact && styles.progressCardCompact, tight && styles.progressCardTight]}>
        <View style={styles.progressHeader}>
          <View style={styles.levelEmblem} accessible={false}>
            <Text style={styles.levelEmblemText}>{profileReady ? profile.level : "—"}</Text>
          </View>
          <View style={styles.progressHeadCopy}>
            <Text style={styles.eyebrow}>Ο ΕΞΕΡΕΥΝΗΤΗΣ ΣΟΥ</Text>
            <Text style={styles.progressTitle}>{profileReady ? "Επίπεδο " + profile.level : "Επίπεδο —"}</Text>
          </View>
          <Text style={styles.playerTitle} numberOfLines={1}>
            {profileReady ? playerTitle(profile.level) : "Φόρτωση…"}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressSmall}>ΠΡΟΣ ΕΠΟΜΕΝΟ ΕΠΙΠΕΔΟ</Text>
          <Text style={styles.progressNumber}>{profileReady
            ? profile.earned.toLocaleString("el-GR") + " / " + profile.required.toLocaleString("el-GR") + " XP"
            : "— XP"}</Text>
        </View>
        <ProgressTrack variant="subject" accessible accessibilityRole="progressbar"
          accessibilityLabel="Πρόοδος μέχρι το επόμενο επίπεδο"
          accessibilityValue={profileReady
            ? { min: 0, max: required, now: earned }
            : { text: "Φόρτωση επιπέδου" }}>
          <ProgressBarFill tone="knowledge" percent={levelPercent} />
        </ProgressTrack>
        {!tight ? <Text style={styles.remaining}>{profileReady
          ? profile.remaining + " XP για το επίπεδο " + (profile.level + 1)
          : "Φόρτωση προόδου…"}</Text> : null}

        {pathProgress && pathTotal > 0 ? <>
          <View style={[styles.progressSeparator, compact && styles.progressSeparatorCompact]} />
          <View style={styles.progressRow} testID="lesson-path-progress">
            <View style={styles.pathCopy}>
              <Text style={styles.progressSmall}>ΔΙΑΔΡΟΜΗ</Text>
              <Text style={styles.pathTitle} numberOfLines={2}>{pathProgress.title}</Text>
            </View>
            <Text style={styles.pathCount}>{pathCompleted} / {pathTotal}</Text>
          </View>
          <ProgressTrack variant="subject" tone="reading" accessible accessibilityRole="progressbar"
            accessibilityLabel={"Ολοκλήρωση διαδρομής " + pathProgress.title}
            accessibilityValue={{ min: 0, max: pathTotal, now: pathCompleted }}>
            <ProgressBarFill tone="reading" percent={pathPercent} />
          </ProgressTrack>
          {pathComplete ? <Text style={styles.pathComplete}>✓ Διαδρομή ολοκληρώθηκε</Text> : null}
        </> : null}
      </MotionView>

      {practiceComplete ? <Text style={styles.practiceDone} accessibilityLiveRegion="polite">
        ✓ Ολοκλήρωσες την εξάσκηση στα λάθη.
      </Text> : null}

      <View testID="lesson-result-tools" style={[styles.tools, compact && styles.toolsCompact]}>
        {canPractice && onReviewMistakes ? <Pressable testID="lesson-practice-action"
          accessibilityRole="button" accessibilityLabel={"Εξάσκηση στα λάθη (" + review.indices.length + ")"}
          onPress={onReviewMistakes}
          style={({ pressed }) => [styles.tool, styles.practiceTool, pressed && styles.toolPressed]}>
          <Text style={styles.toolText}>Εξάσκηση ({review.indices.length})</Text>
        </Pressable> : null}
        <Pressable testID="lesson-replay-action" accessibilityRole="button"
          accessibilityLabel="Ξαναδιάβασε το μάθημα" onPress={onReadAgain}
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}>
          <Text style={styles.toolText}>Ξαναδιάβασε</Text>
        </Pressable>
      </View>
    </ScrollView>

    <View style={[styles.footer, compact && styles.footerCompact]} testID="lesson-results-sticky-footer">
      <AtlasContinueCard entranceDelay={70}
        testID={nextLesson ? "lesson-next-action" : "lesson-browse-action"}
        accessibilityRole="button" accessibilityLabel={nextLesson
          ? "Συνέχισε στο επόμενο μάθημα: " + nextLesson.title
          : pathComplete ? "Διάλεξε νέα θεματική" : "Συνέχισε την εξερεύνηση"}
        onPress={nextAction} style={styles.atlasContinue}>
        <View style={atlasContinueStyles.body}>
          <View style={atlasContinueStyles.copy}>
            <Text style={atlasContinueStyles.eyebrow}>{nextLabel.toUpperCase()}</Text>
            <Text style={atlasContinueStyles.title} numberOfLines={2}>{nextTitle}</Text>
          </View>
          <View style={atlasContinueStyles.action} accessible={false}>
            <Text style={styles.continueGlyph}>{nextLesson ? "▶" : "›"}</Text>
          </View>
        </View>
      </AtlasContinueCard>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  chrome: { paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top },
  header: { marginBottom: 4 },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", flexGrow: 1,
    justifyContent: "space-evenly", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, gap: 10 },
  contentCompact: { paddingTop: 0, paddingBottom: 4, gap: 7 },
  contentTight: { gap: 4 },
  eyebrow: { color: "#C2B5F4", fontSize: 10, lineHeight: 15, fontWeight: "900", letterSpacing: 0.75 },
  hero: { flexDirection: "row", alignItems: "center", gap: 19, paddingVertical: 15, paddingHorizontal: 10 },
  heroCompact: { paddingVertical: 5, gap: 10 },
  heroTight: { paddingVertical: 2, gap: 8 },
  medalCompact: { width: 82, height: 82 },
  medalTight: { width: 68, height: 68 },
  medalHaloCompact: { width: 80, height: 80, borderRadius: 40 },
  medalHaloTight: { width: 66, height: 66, borderRadius: 33 },
  medalCoreCompact: { width: 68, height: 68, borderRadius: 34 },
  medalCoreTight: { width: 57, height: 57, borderRadius: 29 },
  medalSparkTight: { width: 21, height: 21, borderRadius: 11 },
  medal: { width: 112, height: 112, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  medalHalo: { position: "absolute", width: 106, height: 106, borderRadius: 53,
    borderWidth: 2, borderColor: "#8C7DBB", backgroundColor: "#26243E" },
  medalHaloPerfect: { borderColor: "#D1BB83" },
  medalCore: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "#7163A2",
    backgroundColor: "#343052", alignItems: "center", justifyContent: "center" },
  medalCorePerfect: { borderColor: "#C7AC70", backgroundColor: "#423A49" },
  medalNumber: { color: "#F6F0FF", fontSize: 37, lineHeight: 43, fontWeight: "900", includeFontPadding: false },
  medalNumberCompact: { fontSize: 34, lineHeight: 40 },
  medalTotal: { color: "#BAAEE1", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  medalSpark: { position: "absolute", top: 2, right: 0, width: 27, height: 27, borderRadius: 14,
    borderWidth: 1, borderColor: "#C4AFE8", alignItems: "center", justifyContent: "center", backgroundColor: "#302A4C" },
  sparkGlyph: { color: "#E4CFFF", fontSize: 16, lineHeight: 21 },
  heroCopy: { flex: 1, minWidth: 0, gap: 6 },
  heroTitle: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  heroTitleCompact: { fontSize: 23, lineHeight: 29 },
  lessonTitle: { color: colors.textBody, fontSize: 13, lineHeight: 20, fontWeight: "600" },
  rewardBar: { flexDirection: "row", alignItems: "center", borderRadius: 18,
    backgroundColor: "#24233D", borderWidth: 1, borderColor: "#605782",
    paddingHorizontal: 8, paddingVertical: 13, minHeight: 82 },
  rewardBarCompact: { paddingVertical: 7, minHeight: 62 },
  rewardBarTight: { paddingVertical: 5, minHeight: 56 },
  rewardColumn: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 4 },
  rewardValue: { color: "#F3E7BC", fontSize: 23, lineHeight: 30, fontWeight: "900",
    fontVariant: ["tabular-nums"], includeFontPadding: false },
  xpSymbol: { color: "#E9CB82", fontSize: 18 },
  rewardLabel: { color: "#C2B5E4", fontSize: 9, lineHeight: 14, fontWeight: "900", textAlign: "center", letterSpacing: 0.45 },
  rewardDivider: { width: 1, height: 33, backgroundColor: "#534C71" },
  progressCard: { paddingHorizontal: 15, paddingVertical: 14, gap: 9, borderRadius: 20,
    backgroundColor: "#1B2034", borderWidth: 1, borderColor: "#41415F" },
  progressCardCompact: { paddingVertical: 10, gap: 6 },
  progressCardTight: { paddingVertical: 7, gap: 4 },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelEmblem: { width: 41, height: 41, borderRadius: 14, backgroundColor: "#38305B",
    borderWidth: 1, borderColor: "#7967B7", alignItems: "center", justifyContent: "center" },
  levelEmblemText: { color: "#E4D8FF", fontSize: 21, lineHeight: 29, fontWeight: "900" },
  progressHeadCopy: { flex: 1, minWidth: 0, gap: 2 },
  progressTitle: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "900" },
  playerTitle: { color: "#BAAAE9", fontSize: 11, lineHeight: 18, fontWeight: "800", flexShrink: 1 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  progressSmall: { color: colors.textMuted, fontSize: 9, lineHeight: 15, letterSpacing: 0.35, fontWeight: "900" },
  progressNumber: { color: "#D4C7FF", fontSize: 12, lineHeight: 18, fontWeight: "900" },
  remaining: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  progressSeparator: { height: 1, backgroundColor: "#3D3F58", marginVertical: 2 },
  progressSeparatorCompact: { marginVertical: 0 },
  pathCopy: { flex: 1, minWidth: 0, gap: 2 },
  pathTitle: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "800" },
  pathCount: { color: "#A6DAD1", fontSize: 13, lineHeight: 19, fontWeight: "900", flexShrink: 0 },
  pathComplete: { color: "#A0D9C5", fontSize: 11, lineHeight: 17, fontWeight: "800" },
  practiceDone: { color: "#9FDFC8", fontSize: 12, lineHeight: 18, textAlign: "center", fontWeight: "700" },
  tools: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7 },
  toolsCompact: { gap: 5 },
  tool: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, justifyContent: "center",
    borderRadius: 12, borderWidth: 1, borderColor: "#46415E", backgroundColor: "#202338" },
  practiceTool: { borderColor: "#426F6F", backgroundColor: "#1D3037" },
  toolPressed: { backgroundColor: "#353150" },
  toolText: { color: "#D3C6FF", fontSize: 12, lineHeight: 19, fontWeight: "800" },
  atlasContinue: { width: "100%", maxWidth: 640, alignSelf: "center" },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10,
    backgroundColor: "transparent" },
  footerCompact: { paddingTop: 5, paddingBottom: 5 },
  continueGlyph: { color: "#FFFFFF", fontSize: 22, lineHeight: 29, fontWeight: "900", marginLeft: 2 },
});
