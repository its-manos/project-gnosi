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
import { MotionCounter, MotionPressable, MotionView, MotionXpCircle } from "../components/HomeMotion";
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

// Only grow interior content when a card really has extra room. Caps keep
// long Greek titles and system font scaling readable on smaller screens.
const cardScale = (height: number, baseline: number, max: number, range: number) =>
  Math.min(max, 1 + Math.max(0, height - baseline) / range);

const scaled = (value: number, scale: number) => Math.round(value * scale * 10) / 10;

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
  const { height, fontScale } = useWindowDimensions();
  // Development-only A/B switch for isolating Android native SVG paint from
  // its four twinkles + ambient glow. Release builds always use the full atlas.
  const atlasDebugMode = __DEV__ ? process.env.EXPO_PUBLIC_GNOSI_HOME_ATLAS_MODE : undefined;
  // The available Home viewport excludes the top safe area and bottom tabs.
  // Window height alone made some iPhones use the spacious layout and scroll
  // by a few points after the lesson breadcrumb was added.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [cardHeights, setCardHeights] = useState({ hero: 0, quiz: 0 });
  const availableHeight = availableScreenHeight(viewportHeight, height);
  const density = availableHeight < 610 ? 2 : availableHeight < 740 ? 1 : 0;
  const compact = density >= 1;
  const tight = density >= 2;
  // Measurements influence only interior decoration: never the viewport
  // density, flex allocation, or scrolling contract. Ignore subpixel jitter.
  const allowCardGrowth = !compact && (fontScale ?? 1) <= 1.1;
  const heroScale = allowCardGrowth ? cardScale(cardHeights.hero, 225, 1.18, 400) : 1;
  const quizScale = allowCardGrowth ? cardScale(cardHeights.quiz, 100, 1.2, 350) : 1;
  const updateCardHeight = (card: "hero" | "quiz", next: number) => {
    if (next <= 0) return;
    setCardHeights(current => Math.abs(current[card] - next) < 3 ? current : { ...current, [card]: next });
  };
  // Content measurements must never change density: startup hydration and old
  // layout callbacks can otherwise latch Home into a tighter mode until remount.
  // Long titles and accessibility text remain scrollable at every density.
  const canScroll = viewportHeight > 0 && contentHeight > viewportHeight + 1;
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
  const dailySegments = Array.from({ length: DAILY_CHALLENGE_SIZE }, (_, index) =>
    daily.ready && index < dailyAnsweredCount);
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
        }
      }}
      onContentSizeChange={(_width, nextHeight) => {
        setContentHeight(previous => Math.abs(previous - nextHeight) < 1 ? previous : nextHeight);
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
          </MotionPressable> : null}
        </View>
      </MotionView>

      <MotionPressable entranceDelay={60} testID="home-primary-action" style={({ pressed }) => [styles.hero, compact && styles.compactHero, tight && styles.tightHero, { gap: scaled(tight ? 4 : compact ? 8 : 14, heroScale) }, pressed && styles.pressed]}
        onLayout={event => updateCardHeight("hero", event.nativeEvent.layout.height)}
        onPress={startHero} disabled={!progressLoaded}
        accessibilityRole="button"
        accessibilityLabel={hero
          ? (heroIsResume ? "Συνέχισε το μάθημα " : "Ξεκίνα το μάθημα ") + hero.title
            + (heroLocation ? ". " + heroLocation : "")
          : "Εξερεύνησε τους κόσμους γνώσης"}>
        <HomeLessonBackdrop subcategoryId={heroSubcategory?.id} scale={heroScale} />
        <View style={[styles.heroCopy, compact && styles.compactHeroGroup, tight && styles.tightHeroGroup,
          { gap: scaled(tight ? 4 : compact ? 8 : 12, heroScale) }]}>
          <View style={[styles.heroIntro, { paddingRight: scaled(112, heroScale) }]}>
            <Text style={[styles.eyebrow, { fontSize: scaled(11, heroScale), lineHeight: scaled(15, heroScale) }]}>{heroIsResume ? "ΣΥΝΕΧΙΣΕ" : "ΕΠΟΜΕΝΟ ΜΑΘΗΜΑ"}</Text>
            {heroLocation ? <Text testID="home-hero-location" style={[styles.heroLocation, { fontSize: scaled(12, heroScale), lineHeight: scaled(17, heroScale) }]}>
              {heroLocation}</Text> : null}
            {heroIsResume ? <Text style={[styles.heroCount, { fontSize: scaled(11, heroScale), lineHeight: scaled(16, heroScale) }]}>
              {String(inProgressAnsweredCount) + " / " + String(inProgressQuestionCount) + " ερωτήσεις"}
            </Text> : null}
          </View>
          <Text style={[styles.heroTitle, tight && styles.tightHeroTitle,
            { fontSize: scaled(tight ? 18 : 21, heroScale), lineHeight: scaled(tight ? 23 : 28, heroScale) }]}>
            {hero?.title ?? "Ανακάλυψε έναν νέο κόσμο"}
          </Text>
        </View>
        <View style={[styles.heroFooter, compact && styles.compactHeroGroup, tight && styles.tightHeroGroup,
          { gap: scaled(tight ? 4 : compact ? 8 : 12, heroScale) }]}>
          {heroIsResume && inProgressQuestionCount > 0 ?
            <View style={[styles.track, { height: scaled(5, heroScale) }]}>
              <View style={[styles.trackFill, { width: String(progress) + "%" }]}>
                <View pointerEvents="none" style={styles.trackSheen} />
              </View>
            </View>
            : null}
          <View style={[styles.heroButton, { minHeight: scaled(44, heroScale) }]}>
            <Text style={[styles.heroButtonLabel, { fontSize: scaled(14, heroScale) }]}>{heroIsResume ? "Συνέχισε" : hero ? "Ξεκίνα" : "Εξερεύνησε"}</Text>
            <Text style={[styles.heroButtonLabel, { fontSize: scaled(14, heroScale) }]}>→</Text>
          </View>
        </View>
      </MotionPressable>

      <MotionView entranceDelay={130} style={styles.actions}
        onLayout={event => updateCardHeight("quiz", event.nativeEvent.layout.height)}>
        <MotionPressable testID="home-daily-quiz" style={({ pressed }) => [styles.actionCard, styles.quizCard, compact && styles.compactActionCard, tight && styles.tightActionCard, { gap: scaled(tight ? 2 : 10, quizScale) }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={daily.ready
            ? "Καθημερινό quiz, " + dailyAnsweredCount + " από " + DAILY_CHALLENGE_SIZE + " απαντημένες ερωτήσεις"
            : "Καθημερινό quiz, φόρτωση προόδου"}
          onPress={onStartDailyChallenge}>
          <View pointerEvents="none" accessible={false} style={[styles.actionHalo, styles.quizHalo]} />
          <View style={styles.quizTop}>
            <Text style={[styles.actionIcon, { fontSize: scaled(23, quizScale), lineHeight: scaled(26, quizScale) }]}>✦</Text>
            <View style={styles.dailySegments} pointerEvents="none" accessible={false}>
              {dailySegments.map((filled, index) => <View key={index}
                testID={filled ? "home-daily-segment-filled" : "home-daily-segment-empty"}
                style={[styles.dailySegment, filled && styles.dailySegmentFilled]} />)}
            </View>
            <MotionCounter progressKey={today + "-" + dailyProgress} testID="home-daily-answered"
              style={[styles.quizAnswered, { fontSize: scaled(18, quizScale), lineHeight: scaled(26, quizScale) }]}
              accessible={false} numberOfLines={1} adjustsFontSizeToFit>{dailyProgress}</MotionCounter>
          </View>
          <View style={[styles.actionLabels, tight && styles.tightActionLabels]}>
            <Text style={[styles.actionTitle, { fontSize: scaled(14, quizScale), lineHeight: scaled(19, quizScale) }]}>Καθημερινό Quiz</Text>
            <Text style={[styles.actionMeta, { fontSize: scaled(11, quizScale), lineHeight: scaled(15, quizScale) }]}>{todayCompleted ? "Ολοκληρώθηκε ✓" : dailyAnsweredCount > 0 ? "Συνέχισε σήμερα" : "Ξεκίνα σήμερα"}</Text>
          </View>
        </MotionPressable>
        <MotionPressable testID="home-quick-quiz" style={({ pressed }) => [styles.actionCard, styles.quickQuizCard, compact && styles.compactActionCard, tight && styles.tightActionCard, { gap: scaled(tight ? 2 : 10, quizScale) }, pressed && styles.pressed]}
          accessibilityRole="button" accessibilityLabel={quickQuizInProgress ? "Συνέχισε το γρήγορο κουίζ" : "Γρήγορο κουίζ, 5 ερωτήσεις"}
          onPress={onOpenQuickQuiz}>
          <View pointerEvents="none" accessible={false} style={[styles.actionHalo, styles.quickQuizHalo]} />
          <View style={styles.quizTop}>
            <Text style={[styles.actionIcon, styles.quickQuizIcon, { fontSize: scaled(23, quizScale), lineHeight: scaled(26, quizScale) }]}>ϟ</Text>
            <Text accessible={false} style={[styles.quickQuizCue, { fontSize: scaled(19, quizScale), lineHeight: scaled(26, quizScale) }]}>{quickQuizInProgress ? "→" : "▸"}</Text>
          </View>
          <View style={[styles.actionLabels, tight && styles.tightActionLabels]}>
            <Text style={[styles.actionTitle, { fontSize: scaled(14, quizScale), lineHeight: scaled(19, quizScale) }]}>Γρήγορο Κουίζ</Text>
            <Text style={[styles.actionMeta, { fontSize: scaled(11, quizScale), lineHeight: scaled(15, quizScale) }]}>{quickQuizInProgress ? "Συνέχισε τον γύρο" : "5 ερωτήσεις"}</Text>
          </View>
        </MotionPressable>
      </MotionView>

      <MotionView entranceDelay={200} testID="home-exploration" style={[styles.worlds, compact && styles.compactWorlds, tight && styles.tightWorlds]}>
        <View style={styles.sectionRow}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, tight && styles.tightSectionTitle]}>Κόσμοι γνώσης</Text>
          <View accessible={false} pointerEvents="none" style={styles.sectionRule} />
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
  // Fill spare viewport height inside the three playable cards, not in gaps
  // between sections. The worlds grid retains its natural height; real
  // overflow remains scrollable on shorter screens and with large text.
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 16,
    paddingTop: 6, paddingBottom: 8, gap: 12, flexGrow: 1, justifyContent: "flex-start" },
  // Compact screens save vertical room in spacing, not by shrinking artwork.
  compactContent: { gap: 8, paddingTop: 4, paddingBottom: 4 },
  tightContent: { gap: 5, paddingTop: 4, paddingBottom: 2 },
  compactHero: { padding: 14, gap: 8 },
  tightHero: { padding: 10, gap: 4 },
  heroCopy: { gap: 10 },
  heroFooter: { gap: 10 },
  compactHeroGroup: { gap: 8 },
  tightHeroGroup: { gap: 4 },
  tightHeroTitle: { fontSize: 18, lineHeight: 23 },
  compactActionCard: { minHeight: 90, padding: 10 },
  tightActionCard: { minHeight: 80, padding: 8, gap: 2 },
  // A 62pt icon plus its label already exceeds minHeight: 70. Trim the
  // surrounding padding/gap so both icon rows fit without losing artwork.
  compactCategory: { minHeight: 70, paddingVertical: 4, gap: 4 },
  tightCategory: { minHeight: 67, paddingVertical: 4, gap: 2 },
  tightCategoryLabel: { fontSize: 10, lineHeight: 12 },
  tightWorlds: { gap: 4, paddingTop: 2 },
  tightSectionTitle: { fontSize: 16, lineHeight: 20 },
  tightCategoryGrid: { rowGap: 6 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 },
  logo: { color: colors.accentLight, fontSize: 19, lineHeight: 25, fontWeight: "900", letterSpacing: 2.4 },
  headerStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { width: 50, height: 50 },
  levelRing: { position: "absolute", top: 0, left: 0 },
  levelCenter: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  levelNumber: { color: colors.accentLight, fontSize: 18, lineHeight: 21, fontWeight: "900" },
  hero: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: "#595375",
    overflow: "hidden", backgroundColor: "#1B2434", gap: 10,
    flexGrow: 2, justifyContent: "center" },
  heroIntro: { paddingRight: 112, gap: 3 },
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
    padding: 12, justifyContent: "center", gap: 4, overflow: "hidden" },
  actionLabels: { gap: 4 },
  tightActionLabels: { gap: 2 },
  quizCard: { backgroundColor: "#201D30", borderColor: "#514463" },
  actionHalo: { position: "absolute", width: 88, height: 88, borderRadius: 44, right: -37, top: -44 },
  quizHalo: { backgroundColor: "rgba(177,165,255,0.07)" },
  quickQuizHalo: { backgroundColor: "rgba(108,224,182,0.06)" },
  dailySegments: { flex: 1, flexDirection: "row", gap: 2, marginHorizontal: 7, maxWidth: 58 },
  dailySegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#4A405D" },
  dailySegmentFilled: { backgroundColor: colors.accentLight },
  quizTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quizAnswered: { color: colors.accentLight, fontSize: 18, lineHeight: 26,
    fontWeight: "900", letterSpacing: -0.6, fontVariant: ["tabular-nums"] },
  quickQuizCard: { backgroundColor: "#192B2A", borderColor: "#395D54" },
  actionIcon: { color: colors.accentLight, fontSize: 23, lineHeight: 26 },
  quickQuizCue: { color: "#6CE0B6", fontSize: 19, lineHeight: 26, fontWeight: "700" },
  quickQuizIcon: { color: "#6CE0B6" },
  actionTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  actionMeta: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  worlds: { gap: 6, paddingTop: 6 },
  compactWorlds: { gap: 5, paddingTop: 4 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(177,165,255,0.32)" },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  // Four equal columns; the last three cards are centered, not stretched across the row.
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
    alignContent: "flex-start", columnGap: 8, rowGap: 8 },
  category: { width: "22.7%", minHeight: 96, borderRadius: 14,
    alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 3, paddingVertical: 6, gap: 7 },
  categoryPlatform: { width: 62, height: 62, borderRadius: 31,
    backgroundColor: "rgba(177,165,255,0.07)", borderWidth: 1, borderColor: "rgba(177,165,255,0.13)",
    alignItems: "center", justifyContent: "center" },
  tightCategoryPlatform: { width: 48, height: 48, borderRadius: 24 },
  categoryEmoji: { fontSize: 23, lineHeight: 29 },
  categoryLabel: { color: colors.textBody, fontSize: 11, lineHeight: 14, textAlign: "center", fontWeight: "700" },
  pressed: { opacity: 0.76 },
});
