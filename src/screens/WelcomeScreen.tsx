import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Category } from "../data/lessons";
import { DAILY_CHALLENGE_TOPICS, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import type { WelcomePhase } from "../utils/firstRun";
import { colors } from "../theme";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { getCategoryWorldIcon } from "../components/worldIcons/categoryIconMap";
import UsageSharing from "../components/UsageSharing";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import OnboardingDailyQuestion from "./OnboardingDailyQuestion";
import { WelcomeLessonIcon, WelcomeQuizIcon } from "../components/WelcomeStepIcons";

type Props = {
  phase: WelcomePhase;
  replay: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  preferences: DailyChallengePreferences;
  preferencesLoaded: boolean;
  onAdvance: (phase: WelcomePhase, categoryId?: string) => Promise<boolean>;
  onBeginLesson: (preferences: DailyChallengePreferences) => Promise<boolean>;
  onSkip: (step?: number) => Promise<void>;
};

export default function WelcomeScreen({
  phase, replay, categories, selectedCategoryId, preferences, preferencesLoaded,
  onAdvance, onBeginLesson, onSkip,
}: Props) {
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategoryId);
  const [topics, setTopics] = useState<string[]>(() => {
    if (replay) return [...preferences.topicIds];
    const firstInterest = selectedCategoryId === "difficult-history" ? "history" : selectedCategoryId;
    return firstInterest && DAILY_CHALLENGE_TOPICS.some(topic => topic.id === firstInterest)
      ? [firstInterest] : [];
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const { height, fontScale } = useWindowDimensions();
  const { analytics, enabled: usageEnabled } = useBetaAnalytics();
  const compact = height < 750 || fontScale > 1.25;
  useEffect(() => () => { mounted.current = false; }, []);

  async function run(action: () => Promise<boolean | void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try { if (await action() === false && mounted.current) setError(true); }
    catch { if (mounted.current) setError(true); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }

  const step = phase === "welcome" ? 1 : phase === "question" ? 2 : phase === "choose" ? 3 : 4;
  function toggleTopic(id: string) {
    if (busy) return;
    setTopics(current => current.includes(id)
      ? current.filter(value => value !== id)
      : current.length < 5 ? [...current, id] : current);
    setError(false);
  }
  useEffect(() => {
    if (usageEnabled) void analytics.track("onboarding_step_viewed", { screen: "welcome", onboarding_step: step, replay });
  }, [analytics, usageEnabled, step, replay]);
  const selected = categories.find(category => category.id === categoryId);
  return <View testID="welcome-flow" style={styles.root}>
    <ProgressGradientBackground />
    <View style={styles.header}>
      <View style={styles.brand}><View style={styles.brandStar}><Text style={styles.brandGlyph}>✦</Text></View><Text style={styles.brandName}>ΓΝΩΣΗ</Text></View>
      <Text accessibilityLabel={`Βήμα ${step} από 4`} style={styles.counter}>{step} / 4</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Παράλειψη οδηγού"
        accessibilityState={{ disabled: busy }} disabled={busy} hitSlop={8}
        onPress={() => void run(() => onSkip(step))} style={styles.skip}>
        <Text style={styles.skipText}>Παράλειψη</Text>
      </Pressable>
    </View>
    <View accessibilityLabel="Πρόοδος γνωριμίας" style={styles.track}>
      {[1, 2, 3, 4].map(number => <View key={number} style={[styles.segment, number <= step && styles.segmentActive]} />)}
    </View>

    {phase === "question" ? <OnboardingDailyQuestion
      preferences={preferences} preferencesLoaded={preferencesLoaded}
      onContinue={() => onAdvance("choose")} /> :
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {phase === "welcome" ? <>
        <View style={styles.hero} accessible={false}>
          <View style={styles.heroRing} /><View style={styles.heroRingInner} />
          <Text style={styles.heroSymbol}>✦</Text>
          <View style={styles.heroSatellite} />
        </View>
        <Text style={styles.eyebrow}>ΕΝΑΣ ΚΟΣΜΟΣ ΠΕΡΙΕΡΓΕΙΑΣ</Text>
        <Text accessibilityRole="header" style={styles.title}>Κάθε μέρα, κάτι καινούργιο.</Text>
        <AtlasCard style={styles.experience}>
          <View style={styles.experienceRow}><View style={styles.experienceIcon} accessible={false}><WelcomeQuizIcon /></View><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>01  Δοκίμασε τις γνώσεις σου</Text><Text style={styles.small}>Η πρώτη ερώτηση της σημερινής πρόκλησης.</Text></View></View>
          <View style={styles.divider} />
          <View style={styles.experienceRow}><View style={styles.experienceIcon} accessible={false}><WelcomeLessonIcon /></View><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>02  Ξεκίνα μια περιπέτεια</Text><Text style={styles.small}>Ένα μάθημα γεμάτο ανακαλύψεις και ερωτήσεις.</Text></View></View>
        </AtlasCard>
        <Text style={styles.support}>Χωρίς λογαριασμό. Η πρόοδός σου αποθηκεύεται στη συσκευή σου.</Text>
        {!replay ? <UsageSharing /> : null}
        <ActionButton label={busy ? "Άνοιγμα…" : "Ξεκινάμε →"} disabled={busy}
          onPress={() => void run(() => onAdvance("question"))} />
      </> : phase === "choose" ? <>
        <Text style={styles.eyebrow}>ΔΙΑΛΕΞΕ ΤΟΝ ΚΟΣΜΟ ΣΟΥ</Text>
        <Text accessibilityRole="header" style={styles.title}>Ποιος κόσμος σε τραβάει περισσότερο;</Text>
        <Text style={styles.body}>Διάλεξε τον κόσμο που σε ενδιαφέρει περισσότερο. Μπορείς να εξερευνήσεις και τους υπόλοιπους όποτε θέλεις.</Text>
        <View style={styles.categoryGrid}>
          {categories.map(category => {
            const Icon = getCategoryWorldIcon(category.id);
            const active = categoryId === category.id;
            return <Pressable key={category.id} testID={`welcome-category-${category.id}`}
              accessibilityRole="radio" accessibilityLabel={category.title}
              accessibilityState={{ selected: active, disabled: busy }} disabled={busy}
              onPress={() => setCategoryId(category.id)}
              style={({ pressed }) => [styles.category, active && styles.categorySelected, pressed && styles.categoryPressed]}>
              <View style={styles.iconArea}>{Icon ? <Icon size={38} /> : <Text style={styles.fallbackIcon}>{category.emoji}</Text>}</View>
              <Text style={styles.categoryTitle} numberOfLines={2}>{category.title}</Text>
              <Text style={[styles.selectionMark, active && styles.selectionMarkActive]}>{active ? "✓" : "·"}</Text>
            </Pressable>;
          })}
        </View>
        <View style={styles.lessonPreview}>
          <Text style={styles.previewKicker}>Η ΠΡΩΤΗ ΣΟΥ ΔΙΑΔΡΟΜΗ</Text>
          <Text style={styles.previewTitle}>Αρχαία Ελλάδα</Text>
          <Text style={styles.small}>Για την πρώτη μας διαδρομή θα πάμε στην Αρχαία Ελλάδα. Προς το παρόν, αυτό είναι το εισαγωγικό μάθημα για όλους, όποιον κόσμο κι αν διαλέξεις.</Text>
          {selected ? <Text style={styles.selectedHint}>Ο κόσμος που διάλεξες: {selected.title}</Text> : null}
        </View>
        <ActionButton label={busy ? "Συνέχεια…" : "Συνέχεια →"}
          disabled={busy || !categoryId}
          onPress={() => {
            if (!categoryId) return;
            const firstInterest = categoryId === "difficult-history" ? "history" : categoryId;
            setTopics(current => current.length || !DAILY_CHALLENGE_TOPICS.some(topic => topic.id === firstInterest)
              ? current : [firstInterest]);
            void run(() => onAdvance("interests", categoryId));
          }} />
      </> : <>
        <Text style={styles.eyebrow}>Η ΓΝΩΣΗ ΣΤΑ ΜΕΤΡΑ ΣΟΥ</Text>
        <Text accessibilityRole="header" style={styles.title}>Τι σου αρέσει να ανακαλύπτεις;</Text>
        <Text style={styles.body}>Διάλεξε 3 έως 5 θέματα. Θα δίνουμε προτεραιότητα σε αυτά στο Γρήγορο Κουίζ, όπου υπάρχουν διαθέσιμες ερωτήσεις, και στις προτάσεις μαθημάτων.</Text>
        <View style={styles.topicCount}>
          <Text style={styles.topicCountText}>ΤΑ ΕΝΔΙΑΦΕΡΟΝΤΑ ΣΟΥ</Text>
          <Text style={styles.topicCounter} accessibilityLiveRegion="polite">{topics.length} / 5 · τουλάχιστον 3</Text>
        </View>
        <View style={styles.topicGrid}>
          {DAILY_CHALLENGE_TOPICS.map(topic => {
            const active = topics.includes(topic.id);
            const disabled = busy || (!active && topics.length >= 5);
            const Icon = getCategoryWorldIcon(topic.id);
            return <Pressable key={topic.id} testID={`welcome-interest-${topic.id}`}
              accessibilityRole="checkbox" accessibilityLabel={topic.title}
              accessibilityState={{ checked: active, disabled }}
              disabled={disabled} onPress={() => toggleTopic(topic.id)}
              style={({ pressed }) => [styles.topic, active && styles.topicActive,
                disabled && !active && styles.topicDisabled, pressed && styles.categoryPressed]}>
              <View style={styles.topicIcon} accessible={false}>
                {Icon ? <Icon size={29} /> : <Text style={styles.topicEmoji}>{topic.emoji}</Text>}
              </View>
              <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
              <View style={[styles.topicCheck, active && styles.topicCheckActive]}>
                {active ? <Text style={styles.topicCheckText}>✓</Text> : null}
              </View>
            </Pressable>;
          })}
        </View>
        <Text style={styles.interestsNote}>Η καθημερινή πρόκληση έχει τις ίδιες 7 ερωτήσεις για όλους. Μπορείς να αλλάξεις τα ενδιαφέροντά σου από το Προφίλ.</Text>
        <ActionButton label={busy ? "Αποθήκευση…" : "Ξεκίνα το πρώτο μάθημα →"}
          disabled={busy || !preferencesLoaded || topics.length < 3 || topics.length > 5}
          onPress={() => void run(() => onBeginLesson({ topicIds: topics, difficulty: preferences.difficulty }))} />
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
  content: { width: "100%", maxWidth: 640, flexGrow: 1, alignSelf: "center", paddingHorizontal: 20,
    justifyContent: "center", paddingTop: 16, paddingBottom: 32 },
  contentCompact: { justifyContent: "flex-start", paddingTop: 14 },
  hero: { width: 110, height: 110, alignSelf: "center", alignItems: "center",
    justifyContent: "center", marginVertical: 16 },
  heroRing: { position: "absolute", width: 106, height: 106, borderWidth: 1,
    borderColor: "#66608B", borderRadius: 53, transform: [{ rotate: "22deg" }] },
  heroRingInner: { position: "absolute", width: 80, height: 80, borderWidth: 1,
    borderColor: "#8D7EB0", borderRadius: 40 },
  heroSymbol: { color: "#DCD0FF", fontSize: 57, fontWeight: "800" },
  heroSatellite: { position: "absolute", width: 10, height: 10, borderRadius: 5,
    right: 7, top: 15, backgroundColor: "#83D0C4" },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 17, fontWeight: "900",
    letterSpacing: 1.2, textAlign: "center", marginBottom: 10 },
  title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: "900",
    textAlign: "center", marginBottom: 14 },
  body: { color: colors.textBody, fontSize: 15, lineHeight: 24,
    textAlign: "center", marginBottom: 22 },
  experience: { padding: 18, gap: 13 },
  experienceRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  experienceIcon: { width: 51, height: 51, borderRadius: 15, borderWidth: 1,
    borderColor: "#5A527B", backgroundColor: "#2D304C", justifyContent: "center", alignItems: "center" },
  experienceCopy: { flex: 1, gap: 3 },
  experienceTitle: { color: colors.text, fontSize: 14, fontWeight: "800", lineHeight: 21 },
  small: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  divider: { height: 1, backgroundColor: "#45435F", marginLeft: 64 },
  support: { color: colors.textMuted, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 17 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 17 },
  category: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
    borderRadius: 17, padding: 10, minWidth: 132, flexBasis: "46%", flexGrow: 1,
    minHeight: 91, flexDirection: "row", alignItems: "center", gap: 8 },
  categorySelected: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  categoryPressed: { opacity: .8 },
  iconArea: { width: 40, alignItems: "center", justifyContent: "center" },
  fallbackIcon: { fontSize: 24 },
  categoryTitle: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: "800", flex: 1 },
  selectionMark: { color: colors.textMuted, fontSize: 16 },
  selectionMarkActive: { color: colors.accentLight, fontSize: 17, fontWeight: "900" },
  lessonPreview: { borderWidth: 1, borderColor: "#514C71", backgroundColor: "#20243B",
    borderRadius: 18, padding: 16, gap: 7 },
  previewKicker: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  previewTitle: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: "900" },
  selectedHint: { color: colors.accentLight, fontSize: 12, lineHeight: 19 },
  topicCount: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap",
    alignItems: "center", gap: 6, marginBottom: 12 },
  topicCountText: { color: colors.text, fontSize: 12, fontWeight: "900", letterSpacing: .5 },
  topicCounter: { color: colors.accentLight, fontSize: 12, fontWeight: "800" },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  topic: { flexBasis: "46%", flexGrow: 1, minWidth: 128, minHeight: 79,
    flexDirection: "row", alignItems: "center", padding: 10, gap: 8,
    borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  topicActive: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  topicDisabled: { opacity: .42 },
  topicIcon: { width: 31, height: 38, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  topicEmoji: { fontSize: 25 },
  topicTitle: { color: colors.text, fontSize: 12, fontWeight: "800", lineHeight: 17, flex: 1 },
  topicCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 1,
    borderColor: "#77778C", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  topicCheckActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  topicCheckText: { color: colors.background, fontSize: 12, fontWeight: "900" },
  interestsNote: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 14, marginBottom: 3 },
  error: { color: colors.error, fontSize: 12, lineHeight: 20, marginTop: 12 },
});
