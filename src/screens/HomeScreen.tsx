import { availableScreenHeight } from "../utils/screenLayout";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import { DAILY_CHALLENGE_SIZE } from "../data/questions";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { useAthensDate } from "../hooks/useAthensDate";
import { useDailySnapshot } from "../state/LearningSession";
import { getCategoryWorldIcon } from "../components/worldIcons/categoryIconMap";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { colors } from "../theme";
import { MotionCounter, MotionPressable, MotionQuizGlow, MotionView, MotionXpCircle } from "../components/HomeMotion";
import HomeAtlasBackground from "../components/HomeAtlasBackground";
import HomeLessonBackdrop from "../components/HomeLessonBackdrop";
import HomeStreakBadge from "../components/HomeStreakBadge";

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
  onOpenQuickQuiz: () => void;
  quickQuizInProgress?: boolean;
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
  categories, subcategories, featuredLesson, progressLoaded,
  inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount,
  onResumeLesson, onOpenCategory, onOpenLesson, onStartDailyChallenge,
  onOpenQuickQuiz, quickQuizInProgress, onOpenProfile,
}: Props) {
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const daily = useDailySnapshot();
  const { height } = useWindowDimensions();
  // Development-only A/B switch for isolating Android native SVG paint from
  // its four twinkles + ambient glow. Release builds always use the full atlas.
  const atlasDebugMode = __DEV__ ? process.env.EXPO_PUBLIC_GNOSI_HOME_ATLAS_MODE : undefined;
  // The available Home viewport excludes the top safe area and bottom tabs.
  // Window height alone made some iPhones use the spacious layout and scroll
  // by a few points after the lesson breadcrumb was added.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [extraDensity, setExtraDensity] = useState(0);
  const availableHeight = availableScreenHeight(viewportHeight, height);
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
    <View testID="home-atlas-screen" style={styles.screen}>
      {atlasDebugMode === "off" ? null
        : <HomeAtlasBackground showAmbientMotion={atlasDebugMode !== "static"} />}
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
      <MotionView entranceDelay={0} style={styles.topBar}>
        <Text style={styles.logo}>ΓΝΩΣΗ</Text>
        <View style={styles.headerStats}>
          <HomeStreakBadge streak={daily.ready ? quizStreak : null} />
          {onOpenProfile ? <MotionPressable entranceDelay={0} testID="home-level-profile" style={styles.levelBadge}
            onPress={onOpenProfile} accessibilityRole="button"
            accessibilityLabel={profileReady ? "Το προφίλ μου. Επίπεδο " + profile.level + ". " + profile.earned + " από " + profile.required + " XP για το επόμενο επίπεδο." : "Το προφίλ μου. Φόρτωση επιπέδου."}>
            <Svg width={50} height={50} viewBox="0 0 50 50" style={styles.levelRing} accessible={false} pointerEvents="none">
              <Circle cx={25} cy={25} r={21} fill="none" stroke={colors.borderStrong} strokeWidth={3.5} />
              {fraction > 0 ? <MotionXpCircle progress={fraction} circumference={ringLength} testID="home-xp-ring" cx={25} cy={25} r={21}
                fill="none" stroke={colors.accentLight} strokeWidth={3.5} strokeLinecap="round"
                strokeDasharray={String(ringLength * fraction) + " " + String(ringLength)}
                rotation={-90} origin="25, 25" /> : null}
            </Svg>
            <View pointerEvents="none" style={styles.levelCenter}>
              <Text testID="home-level" style={styles.levelNumber} numberOfLines={1}
                adjustsFontSizeToFit>{profileReady ? profile.level : "—"}</Text>
            </View>
            <Text style={styles.levelCaption}>Επίπεδο</Text>
          </MotionPressable> : null}
        </View>
      </MotionView>

      <MotionPressable entranceDelay={60} testID="home-primary-action" style={({ pressed }) => [styles.hero, compact && styles.compactHero, tight && styles.tightHero, pressed && styles.pressed]}
        onPress={startHero} disabled={!progressLoaded}
        accessibilityRole="button"
        accessibilityLabel={hero
          ? (heroIsResume ? "Συνέχισε το μάθημα " : "Ξεκίνα το μάθημα ") + hero.title
            + (heroLocation ? ". " + heroLocation : "")
          : "Εξερεύνησε τους κόσμους γνώσης"}>
        <HomeLessonBackdrop subcategoryId={heroSubcategory?.id} />
        <View style={styles.heroIntro}>
          <Text style={styles.eyebrow}>{heroIsResume ? "ΣΥΝΕΧΙΣΕ" : "ΕΠΟΜΕΝΟ ΜΑΘΗΜΑ"}</Text>
          {heroLocation ? <Text testID="home-hero-location" style={styles.heroLocation}>
            {heroLocation}</Text> : null}
          {heroIsResume ? <Text style={styles.heroCount}>
            {String(inProgressAnsweredCount) + " / " + String(inProgressQuestionCount) + " ερωτήσεις"}
          </Text> : null}
        </View>
        <Text style={[styles.heroTitle, tight && styles.tightHeroTitle]}>
          {hero?.title ?? "Ανακάλυψε έναν νέο κόσμο"}
        </Text>
        {heroIsResume && inProgressQuestionCount > 0 ?
          <View style={styles.track}><View style={[styles.trackFill, { width: String(progress) + "%" }]}>
              <View pointerEvents="none" style={styles.trackSheen} />
            </View></View>
          : null}
        <View style={styles.heroButton}>
          <Text style={styles.heroButtonLabel}>{heroIsResume ? "Συνέχισε" : hero ? "Ξεκίνα" : "Εξερεύνησε"}</Text>
          <Text style={styles.heroButtonLabel}>→</Text>
        </View>
      </MotionPressable>

      <MotionView entranceDelay={130} style={styles.actions}>
        <MotionPressable testID="home-daily-quiz" style={({ pressed }) => [styles.actionCard, styles.quizCard, compact && styles.compactActionCard, tight && styles.tightActionCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={daily.ready
            ? "Καθημερινό quiz, " + dailyAnsweredCount + " από " + DAILY_CHALLENGE_SIZE + " απαντημένες ερωτήσεις"
            : "Καθημερινό quiz, φόρτωση προόδου"}
          onPress={onStartDailyChallenge}>
          <MotionQuizGlow active={daily.ready && !todayCompleted} />
          <View pointerEvents="none" accessible={false} style={[styles.cardLip, styles.quizLip]} />
          <View style={styles.quizTop}>
            <Text style={styles.actionIcon}>✦</Text>
            <MotionCounter progressKey={today + "-" + dailyProgress} testID="home-daily-answered" style={styles.quizAnswered}
              accessible={false} numberOfLines={1} adjustsFontSizeToFit>{dailyProgress}</MotionCounter>
          </View>
          <Text style={styles.actionTitle}>Καθημερινό Quiz</Text>
          <Text style={styles.actionMeta}>{todayCompleted ? "Ολοκληρώθηκε ✓" : dailyAnsweredCount > 0 ? "Συνέχισε σήμερα" : "Ξεκίνα σήμερα"}</Text>
        </MotionPressable>
        <MotionPressable testID="home-quick-quiz" style={({ pressed }) => [styles.actionCard, styles.quickQuizCard, compact && styles.compactActionCard, tight && styles.tightActionCard, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel={quickQuizInProgress ? "Συνέχισε το γρήγορο κουίζ" : "Γρήγορο κουίζ, 5 ερωτήσεις"}
          onPress={onOpenQuickQuiz}>
          <View pointerEvents="none" accessible={false} style={[styles.cardLip, styles.quickQuizLip]} />
          <Text style={[styles.actionIcon, styles.quickQuizIcon]}>ϟ</Text>
          <Text style={styles.actionTitle}>Γρήγορο Κουίζ</Text>
          <Text style={styles.actionMeta}>{quickQuizInProgress ? "Συνέχισε τον γύρο" : "5 ερωτήσεις"}</Text>
        </MotionPressable>
      </MotionView>

      <MotionView entranceDelay={200} testID="home-exploration" style={[styles.worlds, tight && styles.tightWorlds]}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, tight && styles.tightSectionTitle]}>Κόσμοι γνώσης</Text>
        </View>
        <View style={[styles.categoryGrid, tight && styles.tightCategoryGrid]}>
          {categories.map(category => {
            const WorldIllustration = getCategoryWorldIcon(category.id);
            return (
              <MotionPressable key={category.id} testID={"home-category-" + category.id}
                accessibilityRole="button" accessibilityLabel={"Άνοιξε τη θεματική " + category.title}
                onPress={() => onOpenCategory(category.id)}
                style={({ pressed }) => [styles.category, compact && styles.compactCategory, tight && styles.tightCategory, pressed && styles.pressed]}>
                <View style={[styles.categoryPlatform, tight && styles.tightCategoryPlatform]} accessible={false} pointerEvents="none">
                  {WorldIllustration
                    ? <WorldIllustration size={tight ? 38 : 46} displayScale={1.18} />
                    : <Text style={styles.categoryEmoji}>{category.emoji}</Text>}
                </View>
                <Text style={[styles.categoryLabel, tight && styles.tightCategoryLabel]} numberOfLines={2} adjustsFontSizeToFit>
                  {shortLabels[category.id] ?? category.title}
                </Text>
              </MotionPressable>
            );
          })}
        </View>
      </MotionView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden", backgroundColor: "#101827" },
  viewport: { flex: 1 },
  // Fill the available viewport by growing the cards and knowledge-world
  // tiles, not the gaps between sections. Minimum card sizes remain intact;
  // on genuinely small screens content can overflow and become scrollable.
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 16,
    paddingTop: 6, paddingBottom: 8, gap: 12, flexGrow: 1, justifyContent: "flex-start" },
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
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 },
  logo: { color: colors.accentLight, fontSize: 19, lineHeight: 25, fontWeight: "900", letterSpacing: 2.4 },
  headerStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { height: 50, flexDirection: "row", alignItems: "center", gap: 5 },
  levelRing: { position: "absolute", top: 0, left: 0 },
  levelCenter: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  levelCaption: { color: colors.textMuted, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  levelNumber: { color: colors.accentLight, fontSize: 18, lineHeight: 21, fontWeight: "900" },
  hero: { flexGrow: 2, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#595375",
    overflow: "hidden", backgroundColor: "#1B2434", gap: 12, justifyContent: "space-between" },
  heroIntro: { minHeight: 86, paddingRight: 96, gap: 6, justifyContent: "center" },
  eyebrow: { color: colors.accentLight, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.7 },
  heroCount: { color: colors.textMuted, fontSize: 11, lineHeight: 16, flexShrink: 1 },
  heroTitle: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: "700" },
  heroLocation: { color: "#D1C9EB", fontSize: 12, lineHeight: 17,
    fontWeight: "700" },
  track: { height: 5, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden", marginTop: 2 },
  trackFill: { height: "100%", borderRadius: 4, backgroundColor: colors.accentLight },
  trackSheen: { position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: "#F3EDFF", opacity: 0.47 },
  heroButton: { flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, backgroundColor: colors.accent, borderRadius: 12, minHeight: 44, marginTop: 2, overflow: "hidden" },
  heroButtonLabel: { color: "#111421", fontSize: 14, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10, flexGrow: 1 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1, minHeight: 96,
    padding: 12, justifyContent: "center", gap: 4 },
  quizCard: { backgroundColor: "#252139", borderColor: "#564A6B" },
  cardLip: { position: "absolute", top: 1, left: 16, right: 16, height: 1 },
  quizLip: { backgroundColor: "#D8C5F2", opacity: 0.34 },
  quickQuizLip: { backgroundColor: "#9CE4C5", opacity: 0.30 },
  quizTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quizAnswered: { color: colors.accentLight, fontSize: 24, lineHeight: 27,
    fontWeight: "900", letterSpacing: -0.6, fontVariant: ["tabular-nums"] },
  quickQuizCard: { backgroundColor: "#1D352F", borderColor: "#426B5E" },
  actionIcon: { color: colors.accentLight, fontSize: 23, lineHeight: 26 },
  quickQuizIcon: { color: "#6CE0B6" },
  actionTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  actionMeta: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  worlds: { gap: 9, flexGrow: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  // Four equal columns; the last three cards are centered, not stretched across the row.
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
    alignContent: "stretch", flexGrow: 1, columnGap: 8, rowGap: 8 },
  category: { width: "22.7%", minHeight: 96, borderRadius: 14,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3, paddingVertical: 6, gap: 7 },
  categoryPlatform: { width: 62, height: 62, borderRadius: 31,
    backgroundColor: "rgba(177,165,255,0.07)", borderWidth: 1, borderColor: "rgba(177,165,255,0.13)",
    alignItems: "center", justifyContent: "center" },
  tightCategoryPlatform: { width: 48, height: 48, borderRadius: 24 },
  categoryEmoji: { fontSize: 23, lineHeight: 29 },
  categoryLabel: { color: colors.textBody, fontSize: 11, lineHeight: 14, textAlign: "center", fontWeight: "700" },
  pressed: { opacity: 0.76 },
});
