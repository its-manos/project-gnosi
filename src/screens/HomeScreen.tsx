import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { Category, Lesson } from "../data/lessons";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { useAthensDate } from "../hooks/useAthensDate";
import { useDailySnapshot } from "../state/LearningSession";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { colors } from "../theme";

type Props = {
  categories: Category[];
  featuredLesson: Lesson | null;
  progressLoaded: boolean;
  completedCount: number;
  inProgressLesson: Lesson | null;
  inProgressAnsweredCount: number;
  inProgressQuestionCount: number;
  onResumeLesson: (lessonId: string) => void;
  onOpenCategory: (categoryId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onStartDailyChallenge: () => void;
  onKnowledgeReview?: () => void;
  onOpenProfile?: () => void;
};

const shortLabels: Record<string, string> = {
  history: "Ιστορία",
  science: "Επιστήμη",
  nature: "Φύση",
  technology: "Τεχνολογία",
  culture: "Τέχνες",
  geography: "Γεωγραφία",
  "difficult-history": "Δύσκολη ιστορία",
};

export default function HomeScreen({
  categories, featuredLesson, progressLoaded, completedCount,
  inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  onResumeLesson, onOpenCategory, onOpenLesson, onStartDailyChallenge,
  onKnowledgeReview, onOpenProfile,
}: Props) {
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const daily = useDailySnapshot();
  const today = useAthensDate();
  // This existing metric counts completed daily quizzes, not app logins.
  // A separate login streak requires account-scoped, synchronised visit records.
  const quizStreak = useMemo(
    () => calculateDailyChallengeProgress(dailyHistory(daily.doc), today).currentStreak,
    [daily.doc, today],
  );
  const todayCompleted = daily.doc.days[today]?.record.completed === true;
  const fraction = profileReady ? Math.max(0, Math.min(1, profile.earned / Math.max(1, profile.required))) : 0;
  const ringLength = 2 * Math.PI * 21;
  const hero = inProgressLesson ?? (progressLoaded ? featuredLesson : null);
  const heroIsResume = Boolean(inProgressLesson);
  const progress = inProgressQuestionCount > 0
    ? Math.max(0, Math.min(100, inProgressAnsweredCount / inProgressQuestionCount * 100))
    : 0;

  const startHero = () => {
    if (inProgressLesson) onResumeLesson(inProgressLesson.id);
    else if (hero) onOpenLesson(hero.id);
    else if (categories[0]) onOpenCategory(categories[0].id);
  };

  return (
    <ScrollView testID="home-game-dashboard" style={styles.viewport}
      contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>ΓΝΩΣΗ</Text>
        <View style={styles.headerStats}>
          <View testID="home-quiz-streak" style={styles.streak} accessible
            accessibilityLabel={daily.ready ? String(quizStreak) + " συνεχόμενες ημέρες ολοκληρωμένου καθημερινού quiz" : "Φόρτωση σερί καθημερινού quiz"}>
            <Text style={styles.flame}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{daily.ready ? quizStreak : "—"}</Text>
              <Text style={styles.streakLabel}>σερί quiz</Text>
            </View>
          </View>
          {onOpenProfile ? <Pressable testID="home-level-profile" style={styles.levelBadge}
            onPress={onOpenProfile} accessibilityRole="button"
            accessibilityLabel={profileReady ? "Το προφίλ μου. Επίπεδο " + profile.level + ". " + profile.earned + " από " + profile.required + " XP για το επόμενο επίπεδο." : "Το προφίλ μου. Φόρτωση επιπέδου."}>
            <Svg width={50} height={50} viewBox="0 0 50 50" style={styles.levelRing} accessible={false} pointerEvents="none">
              <Circle cx={25} cy={25} r={21} fill="none" stroke={colors.borderStrong} strokeWidth={3.5} />
              {fraction > 0 ? <Circle testID="home-xp-ring" cx={25} cy={25} r={21}
                fill="none" stroke={colors.accentLight} strokeWidth={3.5} strokeLinecap="round"
                strokeDasharray={String(ringLength * fraction) + " " + String(ringLength)}
                rotation={-90} origin="25, 25" /> : null}
            </Svg>
            <View pointerEvents="none" style={styles.levelCenter}>
              <Text style={styles.levelCaption}>ΕΠ.</Text>
              <Text testID="home-level" style={styles.levelNumber} numberOfLines={1}
                adjustsFontSizeToFit>{profileReady ? profile.level : "—"}</Text>
            </View>
          </Pressable> : null}
        </View>
      </View>

      <Pressable testID="home-primary-action" style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
        onPress={startHero} disabled={!progressLoaded}
        accessibilityRole="button"
        accessibilityLabel={hero
          ? (heroIsResume ? "Συνέχισε το μάθημα " : "Ξεκίνα το μάθημα ") + hero.title
          : "Εξερεύνησε τους κόσμους γνώσης"}>
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>{heroIsResume ? "Η ΠΟΡΕΙΑ ΣΟΥ" : "Η ΕΠΟΜΕΝΗ ΑΠΟΣΤΟΛΗ"}</Text>
          <Text style={styles.heroCount}>{completedCount} ολοκληρωμένα</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {hero?.title ?? "Ανακάλυψε έναν νέο κόσμο"}
        </Text>
        <Text style={styles.heroDescription} numberOfLines={1}>
          {heroIsResume ? String(inProgressAnsweredCount) + " / " + String(inProgressQuestionCount) + " ερωτήσεις"
            : hero ? "Ένα νέο μάθημα σε περιμένει" : "Επίλεξε μια θεματική για να ξεκινήσεις"}
        </Text>
        {heroIsResume && inProgressQuestionCount > 0 ?
          <View style={styles.track}><View style={[styles.trackFill, { width: String(progress) + "%" }]} /></View>
          : null}
        <View style={styles.heroButton}>
          <Text style={styles.heroButtonLabel}>{heroIsResume ? "Συνέχισε" : hero ? "Ξεκίνα" : "Εξερεύνησε"}</Text>
          <Text style={styles.heroButtonLabel}>→</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable testID="home-daily-quiz" style={({ pressed }) => [styles.actionCard, styles.quizCard, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Καθημερινό quiz, 7 ερωτήσεις"
          onPress={onStartDailyChallenge}>
          <Text style={styles.actionIcon}>✦</Text>
          <Text style={styles.actionTitle}>Καθημερινό Quiz</Text>
          <Text style={styles.actionMeta}>{todayCompleted ? "Ολοκληρώθηκε ✓" : "7 ερωτήσεις"}</Text>
        </Pressable>
        <Pressable testID="home-knowledge-review" style={({ pressed }) => [styles.actionCard, styles.reviewCard, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Επανάληψη γνώσεων"
          onPress={onKnowledgeReview} disabled={!onKnowledgeReview}>
          <Text style={[styles.actionIcon, styles.reviewIcon]}>◎</Text>
          <Text style={styles.actionTitle}>Επανάληψη</Text>
          <Text style={styles.actionMeta}>Εξάσκησε τις γνώσεις σου</Text>
        </Pressable>
      </View>

      <View testID="home-exploration" style={styles.worlds}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Κόσμοι γνώσης</Text>
          <Text style={styles.worldCount}>{categories.length} κόσμοι</Text>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map(category =>
            <Pressable key={category.id} testID={"home-category-" + category.id}
              accessibilityRole="button" accessibilityLabel={"Άνοιξε τη θεματική " + category.title}
              onPress={() => onOpenCategory(category.id)}
              style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryLabel} numberOfLines={2} adjustsFontSizeToFit>
                {shortLabels[category.id] ?? category.title}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 16,
    paddingTop: 4, paddingBottom: 18, gap: 12, flexGrow: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54 },
  logo: { color: colors.accentLight, fontSize: 22, lineHeight: 29, fontWeight: "900", letterSpacing: 3 },
  headerStats: { flexDirection: "row", alignItems: "center", gap: 12 },
  streak: { flexDirection: "row", alignItems: "center", gap: 4 },
  flame: { fontSize: 19 },
  streakCount: { color: colors.text, fontSize: 17, fontWeight: "900", lineHeight: 20 },
  streakLabel: { color: colors.textMuted, fontSize: 9, lineHeight: 12 },
  levelBadge: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 25, backgroundColor: colors.surface },
  levelRing: { position: "absolute", top: 0, left: 0 },
  levelCenter: { alignItems: "center", justifyContent: "center" },
  levelCaption: { color: colors.textMuted, fontSize: 7, lineHeight: 9, fontWeight: "900" },
  levelNumber: { color: colors.accentLight, fontSize: 18, lineHeight: 22, fontWeight: "900" },
  hero: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#514B6A", backgroundColor: "#1B2032", gap: 7 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8 },
  heroCount: { color: colors.textMuted, fontSize: 10 },
  heroTitle: { color: colors.text, fontSize: 19, lineHeight: 25, fontWeight: "800" },
  heroDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  track: { height: 5, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 4, backgroundColor: colors.success },
  heroButton: { flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: colors.accent, borderRadius: 10, minHeight: 37, marginTop: 3 },
  heroButtonLabel: { color: "#111421", fontSize: 13, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1, minHeight: 105,
    padding: 13, justifyContent: "center", gap: 5 },
  quizCard: { backgroundColor: "#242039", borderColor: "#3B3454" },
  reviewCard: { backgroundColor: "#19332E", borderColor: "#30554B" },
  actionIcon: { color: colors.accentLight, fontSize: 23, lineHeight: 26 },
  reviewIcon: { color: "#6CE0B6" },
  actionTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  actionMeta: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  worlds: { gap: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "800" },
  worldCount: { color: colors.textMuted, fontSize: 11 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 6 },
  category: { width: "23.3%", minHeight: 78, backgroundColor: colors.surface,
    borderColor: colors.border, borderWidth: 1, borderRadius: 13,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3, paddingVertical: 6, gap: 5 },
  categoryEmoji: { fontSize: 23, lineHeight: 29 },
  categoryLabel: { color: colors.textBody, fontSize: 10, lineHeight: 13, textAlign: "center", fontWeight: "700" },
  pressed: { opacity: 0.76 },
});
