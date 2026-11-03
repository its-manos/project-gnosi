import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import { DAILY_CHALLENGE_SIZE } from "../data/questions";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { useAthensDate } from "../hooks/useAthensDate";
import { useDailySnapshot } from "../state/LearningSession";
import HistoryWorldIcon from "../components/worldIcons/HistoryWorldIcon";
import {
  CultureWorldIcon, DifficultHistoryWorldIcon, GeographyWorldIcon,
  NatureWorldIcon, ScienceWorldIcon, TechnologyWorldIcon,
} from "../components/worldIcons/OtherWorldIcons";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { colors } from "../theme";

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
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

// Locally rendered, purely decorative artwork. All cards retain their
// existing 32-point layout footprint and 18% visual enlargement.
const worldIllustrations: Record<string, typeof HistoryWorldIcon> = {
  history: HistoryWorldIcon,
  science: ScienceWorldIcon,
  nature: NatureWorldIcon,
  technology: TechnologyWorldIcon,
  culture: CultureWorldIcon,
  geography: GeographyWorldIcon,
  "difficult-history": DifficultHistoryWorldIcon,
};

// Visual previews only. Game routes and persistence arrive in a later phase.
const upcomingMiniGames = [
  { id: "sudoku", title: "Sudoku", symbol: "▦" },
  { id: "hangman", title: "Κρεμάλα", symbol: "Α _" },
] as const;

export default function HomeScreen({
  categories, subcategories, featuredLesson, progressLoaded, completedCount,
  inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  onResumeLesson, onOpenCategory, onOpenLesson, onStartDailyChallenge,
  onKnowledgeReview, onOpenProfile,
}: Props) {
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const daily = useDailySnapshot();
  const { height } = useWindowDimensions();
  // The available Home viewport excludes the top safe area and bottom tabs.
  // Window height alone made some iPhones use the spacious layout and scroll
  // by a few points after the lesson breadcrumb was added.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [extraDensity, setExtraDensity] = useState(0);
  const availableHeight = viewportHeight || Math.max(0, height - 130);
  const baseDensity = availableHeight < 610 ? 2 : availableHeight < 740 ? 1 : 0;
  const density = Math.max(baseDensity, extraDensity);
  const compact = density >= 1;
  const tight = density >= 2;
  // A genuine overflow first switches to a denser layout. Scrolling remains
  // available only when the most compact layout cannot fit the content (e.g.
  // accessibility text, small landscape viewports, unusually tall headings).
  const canScroll = viewportHeight > 0 && contentHeight > viewportHeight + 1 && tight;
  const today = useAthensDate();
  // This existing metric counts completed daily quizzes, not app logins.
  // A separate login streak requires account-scoped, synchronised visit records.
  const quizStreak = useMemo(
    () => calculateDailyChallengeProgress(dailyHistory(daily.doc), today).currentStreak,
    [daily.doc, today],
  );
  const todayRecord = daily.doc.days[today]?.record;
  const todayCompleted = todayRecord?.completed === true;
  // The daily quiz stores one answer per completed question, including wrong
  // answers and the current question before the Next button is pressed.
  const dailyAnsweredCount = todayRecord ? Object.keys(todayRecord.answers).length : 0;
  const dailyProgress = daily.ready
    ? String(dailyAnsweredCount) + "/" + String(DAILY_CHALLENGE_SIZE)
    : "—/" + String(DAILY_CHALLENGE_SIZE);
  const fraction = profileReady ? Math.max(0, Math.min(1, profile.earned / Math.max(1, profile.required))) : 0;
  const ringLength = 2 * Math.PI * 21;
  const hero = inProgressLesson ?? (progressLoaded ? featuredLesson : null);
  const heroIsResume = Boolean(inProgressLesson);
  const heroCategory = categories.find(category => category.id === hero?.categoryId);
  const heroSubcategory = subcategories.find(subcategory =>
    subcategory.id === hero?.subcategoryId && subcategory.categoryId === hero?.categoryId);
  const heroLocation = [heroCategory?.title, heroSubcategory?.title].filter(Boolean).join(" · ");
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
      contentContainerStyle={[styles.content, compact && styles.compactContent, tight && styles.tightContent]}
      scrollEnabled={canScroll} bounces={false} alwaysBounceVertical={false}
      overScrollMode="never" showsVerticalScrollIndicator={false}
      onLayout={event => {
        const nextHeight = event.nativeEvent.layout.height;
        if (Math.abs(viewportHeight - nextHeight) >= 1) {
          setViewportHeight(nextHeight);
          // Re-evaluate density after a resize, rotation or navigation change.
          setExtraDensity(0);
          if (contentHeight > nextHeight + 1) {
            const nextBase = nextHeight < 610 ? 2 : nextHeight < 740 ? 1 : 0;
            if (nextBase < 2) setExtraDensity(nextBase + 1);
          }
        }
      }}
      onContentSizeChange={(_width, nextHeight) => {
        setContentHeight(previous => Math.abs(previous - nextHeight) < 1 ? previous : nextHeight);
        if (viewportHeight > 0 && nextHeight > viewportHeight + 1 && density < 2) {
          setExtraDensity(density + 1);
        }
      }}>
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

      <Pressable testID="home-primary-action" style={({ pressed }) => [styles.hero, compact && styles.compactHero, tight && styles.tightHero, pressed && styles.pressed]}
        onPress={startHero} disabled={!progressLoaded}
        accessibilityRole="button"
        accessibilityLabel={hero
          ? (heroIsResume ? "Συνέχισε το μάθημα " : "Ξεκίνα το μάθημα ") + hero.title
            + (heroLocation ? ". " + heroLocation : "")
          : "Εξερεύνησε τους κόσμους γνώσης"}>
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>{heroIsResume ? "ΣΥΝΕΧΙΣΕ" : "ΕΠΟΜΕΝΟ ΜΑΘΗΜΑ"}</Text>
          <Text style={styles.heroCount}>{heroIsResume
            ? String(inProgressAnsweredCount) + " / " + String(inProgressQuestionCount) + " ερωτήσεις"
            : completedCount + " ολοκληρωμένα"}</Text>
        </View>
        <Text style={[styles.heroTitle, tight && styles.tightHeroTitle]} numberOfLines={2}>
          {hero?.title ?? "Ανακάλυψε έναν νέο κόσμο"}
        </Text>
        {heroLocation ? <Text testID="home-hero-location" style={styles.heroLocation}
          numberOfLines={1} ellipsizeMode="tail">{heroLocation}</Text>
          : !heroIsResume ? <Text style={styles.heroDescription} numberOfLines={1}>
            {hero ? "Ένα νέο μάθημα σε περιμένει" : "Επίλεξε μια θεματική για να ξεκινήσεις"}
          </Text> : null}
        {heroIsResume && inProgressQuestionCount > 0 ?
          <View style={styles.track}><View style={[styles.trackFill, { width: String(progress) + "%" }]} /></View>
          : null}
        <View style={styles.heroButton}>
          <Text style={styles.heroButtonLabel}>{heroIsResume ? "Συνέχισε" : hero ? "Ξεκίνα" : "Εξερεύνησε"}</Text>
          <Text style={styles.heroButtonLabel}>→</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable testID="home-daily-quiz" style={({ pressed }) => [styles.actionCard, styles.quizCard, compact && styles.compactActionCard, tight && styles.tightActionCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={daily.ready
            ? "Καθημερινό quiz, " + dailyAnsweredCount + " από " + DAILY_CHALLENGE_SIZE + " απαντημένες ερωτήσεις"
            : "Καθημερινό quiz, φόρτωση προόδου"}
          onPress={onStartDailyChallenge}>
          <View style={styles.quizTop}>
            <Text style={styles.actionIcon}>✦</Text>
            <Text testID="home-daily-answered" style={styles.quizAnswered}
              accessible={false} numberOfLines={1} adjustsFontSizeToFit>{dailyProgress}</Text>
          </View>
          <Text style={styles.actionTitle}>Καθημερινό Quiz</Text>
          <Text style={styles.actionMeta}>{todayCompleted ? "Ολοκληρώθηκε ✓" : dailyAnsweredCount > 0 ? "Συνέχισε σήμερα" : "Ξεκίνα σήμερα"}</Text>
        </Pressable>
        <Pressable testID="home-knowledge-review" style={({ pressed }) => [styles.actionCard, styles.reviewCard, compact && styles.compactActionCard, tight && styles.tightActionCard, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel="Επανάληψη γνώσεων"
          onPress={onKnowledgeReview} disabled={!onKnowledgeReview}>
          <Text style={[styles.actionIcon, styles.reviewIcon]}>◎</Text>
          <Text style={styles.actionTitle}>Επανάληψη</Text>
          <Text style={styles.actionMeta}>Εξάσκησε τις γνώσεις σου</Text>
        </Pressable>
      </View>

      <View testID="home-exploration" style={[styles.worlds, tight && styles.tightWorlds]}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, tight && styles.tightSectionTitle]}>Κόσμοι γνώσης</Text>
          <Text style={styles.worldCount}>{categories.length} κόσμοι</Text>
        </View>
        <View style={[styles.categoryGrid, tight && styles.tightCategoryGrid]}>
          {categories.map(category => {
            const WorldIllustration = worldIllustrations[category.id];
            return (
              <Pressable key={category.id} testID={"home-category-" + category.id}
                accessibilityRole="button" accessibilityLabel={"Άνοιξε τη θεματική " + category.title}
                onPress={() => onOpenCategory(category.id)}
                style={({ pressed }) => [styles.category, compact && styles.compactCategory, tight && styles.tightCategory, pressed && styles.pressed]}>
                {WorldIllustration
                  ? <WorldIllustration size={32} displayScale={1.18} />
                  : <Text style={styles.categoryEmoji}>{category.emoji}</Text>}
                <Text style={[styles.categoryLabel, tight && styles.tightCategoryLabel]} numberOfLines={2} adjustsFontSizeToFit>
                  {shortLabels[category.id] ?? category.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View testID="home-mini-games" style={[styles.miniGames, tight && styles.tightMiniGames]}>
        <Text style={[styles.miniGamesHeading, tight && styles.tightMiniGamesHeading]}>Μίνι παιχνίδια</Text>
        <View style={styles.miniGamesRow}>
          {upcomingMiniGames.map(game =>
            <View key={game.id} testID={"home-mini-game-" + game.id}
              style={[styles.miniGameCard, tight && styles.tightMiniGameCard]}
              accessible accessibilityLabel={game.title + ", σύντομα διαθέσιμο"}
              accessibilityState={{ disabled: true }}>
              <View style={[styles.miniGameIcon, tight && styles.tightMiniGameIcon]} accessible={false}>
                <Text style={styles.miniGameSymbol}>{game.symbol}</Text>
              </View>
              <View style={styles.miniGameCopy}>
                <Text style={styles.miniGameTitle} numberOfLines={1} adjustsFontSizeToFit>{game.title}</Text>
                <Text style={styles.miniGameSoon}>Σύντομα</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 16,
    paddingTop: 6, paddingBottom: 8, gap: 12, flexGrow: 1 },
  compactContent: { gap: 8, paddingBottom: 5 },
  tightContent: { gap: 5, paddingTop: 4, paddingBottom: 2 },
  compactHero: { padding: 12, gap: 5 },
  tightHero: { padding: 10, gap: 4 },
  tightHeroTitle: { fontSize: 18, lineHeight: 23 },
  compactActionCard: { minHeight: 90, padding: 10 },
  tightActionCard: { minHeight: 80, padding: 8, gap: 2 },
  compactCategory: { minHeight: 70 },
  tightCategory: { minHeight: 67, paddingVertical: 4, gap: 2 },
  tightCategoryLabel: { fontSize: 10, lineHeight: 12 },
  tightWorlds: { gap: 6 },
  tightSectionTitle: { fontSize: 16, lineHeight: 20 },
  tightCategoryGrid: { rowGap: 6 },
  tightMiniGames: { gap: 5 },
  tightMiniGamesHeading: { fontSize: 14, lineHeight: 19 },
  tightMiniGameCard: { minHeight: 56, paddingVertical: 6 },
  tightMiniGameIcon: { width: 32, height: 32 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 },
  logo: { color: colors.accentLight, fontSize: 21, lineHeight: 27, fontWeight: "900", letterSpacing: 2.4 },
  headerStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  streak: { flexDirection: "row", alignItems: "center", gap: 5 },
  flame: { fontSize: 19, lineHeight: 24 },
  streakCount: { color: colors.text, fontSize: 17, fontWeight: "900", lineHeight: 20 },
  streakLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 13 },
  levelBadge: { width: 50, height: 50, alignItems: "center", justifyContent: "center",
    borderRadius: 25, backgroundColor: colors.surface },
  levelRing: { position: "absolute", top: 0, left: 0 },
  levelCenter: { alignItems: "center", justifyContent: "center" },
  levelCaption: { color: colors.textMuted, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  levelNumber: { color: colors.accentLight, fontSize: 18, lineHeight: 21, fontWeight: "900" },
  hero: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#474160",
    backgroundColor: "#1B2032", gap: 6 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  eyebrow: { color: colors.accentLight, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.7 },
  heroCount: { color: colors.textMuted, fontSize: 11, lineHeight: 16, flexShrink: 1, textAlign: "right" },
  heroTitle: { color: colors.text, fontSize: 19, lineHeight: 25, fontWeight: "800" },
  heroDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  heroLocation: { color: colors.accentLight, fontSize: 11, lineHeight: 15,
    fontWeight: "700" },
  track: { height: 5, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden", marginTop: 2 },
  trackFill: { height: "100%", borderRadius: 4, backgroundColor: colors.accentLight },
  heroButton: { flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, backgroundColor: colors.accent, borderRadius: 12, minHeight: 44, marginTop: 2 },
  heroButtonLabel: { color: "#111421", fontSize: 14, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1, minHeight: 96,
    padding: 12, justifyContent: "center", gap: 4 },
  quizCard: { backgroundColor: "#242039", borderColor: "#39344F" },
  quizTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quizAnswered: { color: colors.accentLight, fontSize: 24, lineHeight: 27,
    fontWeight: "900", letterSpacing: -0.6, fontVariant: ["tabular-nums"] },
  reviewCard: { backgroundColor: "#19332E", borderColor: "#30554B" },
  actionIcon: { color: colors.accentLight, fontSize: 23, lineHeight: 26 },
  reviewIcon: { color: "#6CE0B6" },
  actionTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  actionMeta: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  worlds: { gap: 9 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  worldCount: { color: colors.textMuted, fontSize: 11 },
  // Four equal columns; the last three cards are centered, not stretched across the row.
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 8, rowGap: 8 },
  category: { width: "22.7%", minHeight: 78, backgroundColor: colors.surface,
    borderColor: colors.border, borderWidth: 1, borderRadius: 14,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3, paddingVertical: 6, gap: 4 },
  categoryEmoji: { fontSize: 23, lineHeight: 29 },
  categoryLabel: { color: colors.textBody, fontSize: 11, lineHeight: 14, textAlign: "center", fontWeight: "700" },
  miniGames: { gap: 8 },
  miniGamesHeading: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  miniGamesRow: { flexDirection: "row", gap: 10 },
  miniGameCard: { flex: 1, minHeight: 62, paddingHorizontal: 10, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  miniGameIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center",
    justifyContent: "center", backgroundColor: colors.accentSurface },
  miniGameSymbol: { color: colors.accentLight, fontSize: 18, lineHeight: 23, fontWeight: "800" },
  miniGameCopy: { flex: 1, gap: 1 },
  miniGameTitle: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  miniGameSoon: { color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  pressed: { opacity: 0.76 },
});
