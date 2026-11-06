import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Category } from "../data/lessons";
import { DAILY_CHALLENGE_TOPICS, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { WELCOME_GUIDE_STAGES, previousWelcomePhase, welcomeStepNumber, type WelcomePhase } from "../utils/firstRun";
import { colors } from "../theme";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { getCategoryWorldIcon } from "../components/worldIcons/categoryIconMap";
import UsageSharing from "../components/UsageSharing";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import OnboardingDailyQuestion from "./OnboardingDailyQuestion";
import { WelcomeAtlasIcon, WelcomeLessonIcon, WelcomeQuizIcon } from "../components/WelcomeStepIcons";
import { MotionCounter, MotionPressable, MotionView } from "../components/HomeMotion";
import { onboardingLayout } from "./onboardingLayout";

type Props = {
  phase: WelcomePhase;
  replay: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  preferences: DailyChallengePreferences;
  preferencesLoaded: boolean;
  onAdvance: (phase: WelcomePhase, categoryId?: string) => Promise<boolean>;
  onSaveInterests: (preferences: DailyChallengePreferences) => Promise<boolean>;
  onBeginLesson: (categoryId: string) => Promise<boolean>;
  onSkip: (step?: number) => Promise<void>;
};

export default function WelcomeScreen({
  phase, replay, categories, selectedCategoryId, preferences, preferencesLoaded,
  onAdvance, onSaveInterests, onBeginLesson, onSkip,
}: Props) {
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategoryId);
  const [topics, setTopics] = useState<string[]>(() =>
    replay || phase === "choose" ? [...preferences.topicIds] : []);
  const interestsTouched = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const { height, width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { analytics, enabled: usageEnabled } = useBetaAnalytics();
  const compact = height < 790 || fontScale > 1.15;
  const narrow = width < 350 || fontScale > 1.3;
  useEffect(() => () => { mounted.current = false; }, []);
  // Restore preferences when returning to Interests from a saved category
  // stage, including after a process restart. Never overwrite a user edit.
  const savedTopicSignature = preferences.topicIds.join("|");
  useEffect(() => {
    if (preferencesLoaded && (replay || phase === "choose") && !interestsTouched.current) {
      setTopics([...preferences.topicIds]);
    }
    // Use a primitive dependency so reconstructed preference arrays do not
    // trigger repeated hydration while the player is looking at the guide.
  }, [preferencesLoaded, replay, phase, savedTopicSignature]);

  async function run(action: () => Promise<boolean | void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try { if (await action() === false && mounted.current) setError(true); }
    catch { if (mounted.current) setError(true); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }

  const step = welcomeStepNumber(phase);
  function toggleTopic(id: string) {
    if (busy) return;
    interestsTouched.current = true;
    setTopics(current => current.includes(id)
      ? current.filter(value => value !== id)
      : current.length < 5 ? [...current, id] : current);
    setError(false);
  }
  useEffect(() => {
    if (usageEnabled) void analytics.track("onboarding_step_viewed", { screen: "welcome", onboarding_step: step, replay });
  }, [analytics, usageEnabled, step, replay]);
  return <View testID="welcome-flow" style={styles.root}>
    <ProgressGradientBackground />
    <View style={styles.header}>
      {phase === "welcome"
        ? <View style={styles.brand}><View style={styles.brandStar}><Text style={styles.brandGlyph}>✦</Text></View><Text style={styles.brandName}>ΓΝΩΣΗ</Text></View>
        : <Pressable style={styles.back} disabled={busy} accessibilityRole="button"
            accessibilityLabel="Προηγούμενο βήμα" accessibilityState={{ disabled: busy }}
            onPress={() => {
              const previous = previousWelcomePhase(phase);
              if (previous) void run(() => onAdvance(previous));
            }}>
            <Text style={styles.backText}>‹ Πίσω</Text>
          </Pressable>}
      <MotionCounter progressKey={String(step)} accessibilityLabel={`Βήμα ${step} από ${WELCOME_GUIDE_STAGES.length}`}
        style={styles.counter}>{step} / {WELCOME_GUIDE_STAGES.length}</MotionCounter>
      <Pressable accessibilityRole="button" accessibilityLabel="Παράλειψη οδηγού"
        accessibilityState={{ disabled: busy }} disabled={busy} hitSlop={8}
        onPress={() => void run(() => onSkip(step))} style={styles.skip}>
        <Text style={styles.skipText}>Παράλειψη</Text>
      </Pressable>
    </View>
    <View accessibilityLabel="Πρόοδος γνωριμίας" style={styles.track}>
      {WELCOME_GUIDE_STAGES.map((stage, index) => <View key={stage}
        style={[styles.segment, index < step && styles.segmentActive]} />)}
    </View>

    {phase === "question" ? <OnboardingDailyQuestion
      preferences={preferences} preferencesLoaded={preferencesLoaded}
      onContinue={() => onAdvance("interests")} /> :
    <ScrollView contentContainerStyle={[styles.content,
      phase !== "welcome" && styles.selectionContent,
      compact && styles.contentCompact,
      { paddingBottom: Math.max(onboardingLayout.minBottomPadding, insets.bottom + 18) } ]}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {phase === "welcome" ? <>
        <MotionView key="welcome-hero" entranceDelay={20} style={[styles.hero, compact && styles.heroCompact]} accessible={false}>
          <WelcomeAtlasIcon size={108} />
        </MotionView>
        <MotionView entranceDelay={70}>
          <Text style={styles.eyebrow}>ΕΝΑΣ ΚΟΣΜΟΣ ΠΕΡΙΕΡΓΕΙΑΣ</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Κάθε μέρα, κάτι καινούργιο.</Text>
        </MotionView>
        <AtlasCard entranceDelay={125} style={styles.experience}>
          <View style={styles.experienceRow}><View style={styles.experienceIcon} accessible={false}><WelcomeQuizIcon /></View><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>01  Δοκίμασε τις γνώσεις σου</Text><Text style={styles.small}>Η πρώτη ερώτηση της σημερινής πρόκλησης.</Text></View></View>
          <View style={styles.divider} />
          <View style={styles.experienceRow}><View style={styles.experienceIcon} accessible={false}><WelcomeLessonIcon /></View><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>02  Ξεκίνα μια περιπέτεια</Text><Text style={styles.small}>Ένα μάθημα γεμάτο ανακαλύψεις και ερωτήσεις.</Text></View></View>
        </AtlasCard>
        <MotionView entranceDelay={165}>
          <Text style={styles.support}>Χωρίς λογαριασμό. Η πρόοδός σου αποθηκεύεται στη συσκευή σου.</Text>
          {!replay ? <UsageSharing /> : null}
        </MotionView>
        <MotionView entranceDelay={210}>
          <ActionButton label={busy ? "Άνοιγμα…" : "Ξεκινάμε →"} disabled={busy}
            onPress={() => void run(() => onAdvance("question"))} />
        </MotionView>
      </> : phase === "choose" ? <>
        <MotionView key="choose-heading" entranceDelay={25}>
          <Text style={styles.eyebrow}>ΔΙΑΛΕΞΕ ΤΟΝ ΚΟΣΜΟ ΣΟΥ</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Ποιος κόσμος σε τραβάει περισσότερο;</Text>
        </MotionView>
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => {
            const Icon = getCategoryWorldIcon(category.id);
            const active = categoryId === category.id;
            return <MotionPressable key={category.id} testID={`welcome-category-${category.id}`}
              entranceDelay={80 + index * 32} pressScale={0.975}
              accessibilityRole="radio" accessibilityLabel={category.title}
              accessibilityState={{ selected: active, disabled: busy }} disabled={busy}
              onPress={() => setCategoryId(category.id)}
              style={[styles.category, compact && styles.categoryCompact, narrow && styles.optionNarrow, active && styles.categorySelected]}>
              <View style={styles.iconArea}>{Icon ? <Icon size={narrow ? 32 : 38} /> : <Text style={styles.fallbackIcon}>{category.emoji}</Text>}</View>
              <Text style={styles.categoryTitle} numberOfLines={2}>{category.title}</Text>
              <View style={[styles.topicCheck, narrow && styles.narrowCheck, active && styles.topicCheckActive]}>
                {active ? <Text style={styles.topicCheckText}>✓</Text> : null}
              </View>
            </MotionPressable>;
          })}
        </View>
        <MotionView entranceDelay={230}>
          <ActionButton label={busy ? "Άνοιγμα…" : "Ξεκίνα το πρώτο μάθημα →"}
            disabled={busy || !categoryId}
            onPress={() => { if (categoryId) void run(() => onBeginLesson(categoryId)); }} />
        </MotionView>
      </> : <>
        <MotionView key="interests-heading" entranceDelay={25}>
          <Text style={styles.eyebrow}>Η ΓΝΩΣΗ ΣΤΑ ΜΕΤΡΑ ΣΟΥ</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Τι σου αρέσει να ανακαλύπτεις;</Text>
          <Text style={[styles.body, compact && styles.bodyCompact]}>Διάλεξε 3–5 θέματα για να βλέπεις περισσότερες σχετικές ερωτήσεις στο Γρήγορο Κουίζ και προτάσεις μαθημάτων.</Text>
        </MotionView>
        <MotionView entranceDelay={55} style={styles.topicCount}>
          <Text style={styles.topicCountText}>ΤΑ ΕΝΔΙΑΦΕΡΟΝΤΑ ΣΟΥ</Text>
          <Text style={styles.topicCounter} accessibilityLiveRegion="polite">{topics.length} / 5 · τουλάχιστον 3</Text>
        </MotionView>
        <View style={styles.topicGrid}>
          {DAILY_CHALLENGE_TOPICS.map((topic, index) => {
            const active = topics.includes(topic.id);
            const disabled = busy || (!active && topics.length >= 5);
            const Icon = getCategoryWorldIcon(topic.id);
            return <MotionPressable key={topic.id} testID={`welcome-interest-${topic.id}`}
              entranceDelay={80 + index * 28} pressScale={0.975}
              accessibilityRole="checkbox" accessibilityLabel={topic.title}
              accessibilityState={{ checked: active, disabled }}
              disabled={disabled} onPress={() => toggleTopic(topic.id)}
              style={[styles.topic, compact && styles.topicCompact, narrow && styles.optionNarrow, active && styles.topicActive,
                disabled && !active && styles.topicDisabled]}>
              <View style={styles.topicIcon} accessible={false}>
                {Icon ? <Icon size={narrow ? 26 : 29} /> : <Text style={styles.topicEmoji}>{topic.emoji}</Text>}
              </View>
              <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
              <View style={[styles.topicCheck, narrow && styles.narrowCheck, active && styles.topicCheckActive]}>
                {active ? <Text style={styles.topicCheckText}>✓</Text> : null}
              </View>
            </MotionPressable>;
          })}
        </View>
        <MotionView entranceDelay={205}>
          <ActionButton label={busy ? "Αποθήκευση…" : "Συνέχεια →"}
            disabled={busy || !preferencesLoaded || topics.length < 3 || topics.length > 5}
            onPress={() => void run(() => onSaveInterests({ topicIds: topics, difficulty: preferences.difficulty }))} />
        </MotionView>
      </>}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">Δεν αποθηκεύτηκε το βήμα. Δοκίμασε ξανά ή παράλειψε τον οδηγό.</Text> : null}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 7, paddingBottom: 10, gap: 8 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  back: { minHeight: 44, flex: 1, justifyContent: "center" },
  backText: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
  brandStar: { width: 28, height: 28, alignItems: "center", justifyContent: "center",
    borderRadius: 10, backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong },
  brandGlyph: { color: colors.accentLight, fontSize: 19 },
  brandName: { color: colors.text, fontWeight: "900", fontSize: 15, letterSpacing: 2 },
  counter: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  skip: { flex: 1, alignItems: "flex-end", justifyContent: "center", minHeight: 44 },
  skipText: { color: colors.accentLight, fontSize: 12, fontWeight: "700" },
  track: { flexDirection: "row", gap: 5, paddingHorizontal: 20, paddingBottom: 7 },
  segment: { height: 3, flex: 1, backgroundColor: colors.border, borderRadius: 3 },
  segmentActive: { backgroundColor: colors.accentLight },
  content: { width: "100%", maxWidth: onboardingLayout.maxWidth, flexGrow: 1,
    alignSelf: "center", paddingHorizontal: onboardingLayout.horizontal,
    justifyContent: "center", paddingTop: 18 },
  selectionContent: { justifyContent: "flex-start", paddingTop: 18 },
  contentCompact: { justifyContent: "flex-start", paddingTop: 12 },
  heroCompact: { height: 108, marginVertical: 4 },
  hero: { width: 118, height: 118, alignSelf: "center", alignItems: "center",
    justifyContent: "center", marginVertical: 12 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 17, fontWeight: "900",
    letterSpacing: 1.2, textAlign: "center", marginBottom: 10 },
  title: { color: colors.text, fontSize: onboardingLayout.titleSize,
    lineHeight: onboardingLayout.titleLineHeight, fontWeight: "900",
    textAlign: "center", marginBottom: 12 },
  titleCompact: { fontSize: 25, lineHeight: 32, marginBottom: 9 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22,
    textAlign: "center", marginBottom: 18 },
  bodyCompact: { marginBottom: 12, lineHeight: 21 },
  experience: { padding: 16, gap: 12 },
  experienceRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  experienceIcon: { width: 51, height: 51, borderRadius: 15, borderWidth: 1,
    borderColor: "#5A527B", backgroundColor: "#2D304C", justifyContent: "center", alignItems: "center" },
  experienceCopy: { flex: 1, gap: 3 },
  experienceTitle: { color: colors.text, fontSize: 14, fontWeight: "800", lineHeight: 21 },
  small: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  divider: { height: 1, backgroundColor: "#45435F", marginLeft: 64 },
  support: { color: colors.textMuted, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 14 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  category: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 10, minWidth: 125, flexBasis: "46%", flexGrow: 1,
    minHeight: 80, flexDirection: "row", alignItems: "center", gap: 8 },
  categoryCompact: { minHeight: 72, paddingVertical: 7 },
  // Narrow phones get a stacked icon/title card rather than truncating long
  // Greek topic names beside an icon and a checkmark in one short row.
  optionNarrow: { paddingHorizontal: 10, minHeight: 94, paddingVertical: 9,
    flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", gap: 3 },
  narrowCheck: { position: "absolute", right: 9, top: 9 },
  categorySelected: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  iconArea: { width: 40, alignItems: "center", justifyContent: "center" },
  fallbackIcon: { fontSize: 24 },
  categoryTitle: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: "800", flex: 1 },
  topicCount: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap",
    alignItems: "center", gap: 6, marginBottom: 12 },
  topicCountText: { color: colors.text, fontSize: 12, fontWeight: "900", letterSpacing: .5 },
  topicCounter: { color: colors.accentLight, fontSize: 12, fontWeight: "800" },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  topic: { flexBasis: "46%", flexGrow: 1, minWidth: 125, minHeight: 76,
    flexDirection: "row", alignItems: "center", padding: 10, gap: 8,
    borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  topicCompact: { minHeight: 70, paddingVertical: 7 },
  topicActive: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  topicDisabled: { opacity: .42 },
  topicIcon: { width: 31, height: 38, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  topicEmoji: { fontSize: 25 },
  topicTitle: { color: colors.text, fontSize: 12, fontWeight: "800", lineHeight: 17, flex: 1 },
  topicCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 1,
    borderColor: "#77778C", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  topicCheckActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  topicCheckText: { color: colors.background, fontSize: 12, fontWeight: "900" },
  error: { color: colors.error, fontSize: 12, lineHeight: 20, marginTop: 12 },
});
