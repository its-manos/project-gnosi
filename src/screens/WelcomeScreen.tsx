import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Category } from "../data/lessons";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import type { WelcomePhase } from "../utils/firstRun";
import { colors } from "../theme";
import ActionButton from "../components/ActionButton";
import AtlasCard from "../components/AtlasCard";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { getCategoryWorldIcon } from "../components/worldIcons/categoryIconMap";
import UsageSharing from "../components/UsageSharing";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import OnboardingDailyQuestion from "./OnboardingDailyQuestion";

type Props = {
  phase: WelcomePhase;
  replay: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  preferences: DailyChallengePreferences;
  preferencesLoaded: boolean;
  onAdvance: (phase: WelcomePhase) => Promise<boolean>;
  onBeginLesson: (categoryId: string) => Promise<boolean>;
  onSkip: (step?: number) => Promise<void>;
};

export default function WelcomeScreen({
  phase, replay, categories, selectedCategoryId, preferences, preferencesLoaded,
  onAdvance, onBeginLesson, onSkip,
}: Props) {
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategoryId);
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

  const step = phase === "welcome" ? 1 : phase === "question" ? 2 : 3;
  useEffect(() => {
    if (usageEnabled) void analytics.track("onboarding_step_viewed", { screen: "welcome", onboarding_step: step, replay });
  }, [analytics, usageEnabled, step, replay]);
  const selected = categories.find(category => category.id === categoryId);
  return <View testID="welcome-flow" style={styles.root}>
    <ProgressGradientBackground />
    <View style={styles.header}>
      <View style={styles.brand}><View style={styles.brandStar}><Text style={styles.brandGlyph}>✦</Text></View><Text style={styles.brandName}>ΓΝΩΣΗ</Text></View>
      <Text accessibilityLabel={`Βήμα ${step} από 3`} style={styles.counter}>{step} / 3</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Παράλειψη οδηγού"
        accessibilityState={{ disabled: busy }} disabled={busy} hitSlop={8}
        onPress={() => void run(() => onSkip(step))} style={styles.skip}>
        <Text style={styles.skipText}>Παράλειψη</Text>
      </Pressable>
    </View>
    <View accessibilityLabel="Πρόοδος γνωριμίας" style={styles.track}>
      {[1, 2, 3].map(number => <View key={number} style={[styles.segment, number <= step && styles.segmentActive]} />)}
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
        <Text style={styles.body}>Μικρές προκλήσεις, μεγάλες ιστορίες. Πρώτα μια ερώτηση· μετά η πρώτη σου διαδρομή γνώσης.</Text>
        <AtlasCard style={styles.experience}>
          <View style={styles.experienceRow}><Text style={styles.experienceIcon}>✧</Text><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>01  Δοκίμασε τις γνώσεις σου</Text><Text style={styles.small}>Μια πραγματική ερώτηση από το ημερήσιο quiz.</Text></View></View>
          <View style={styles.divider} />
          <View style={styles.experienceRow}><Text style={styles.experienceIcon}>⌁</Text><View style={styles.experienceCopy}>
            <Text style={styles.experienceTitle}>02  Ξεκίνα μια περιπέτεια</Text><Text style={styles.small}>Ένα σύντομο μάθημα με διαδραστικές στάσεις.</Text></View></View>
        </AtlasCard>
        <Text style={styles.support}>Χωρίς λογαριασμό. Η πρόοδός σου αποθηκεύεται στη συσκευή σου.</Text>
        {!replay ? <UsageSharing /> : null}
        <ActionButton label={busy ? "Άνοιγμα…" : "Ξεκινάμε →"} disabled={busy}
          onPress={() => void run(() => onAdvance("question"))} />
      </> : <>
        <Text style={styles.eyebrow}>ΔΙΑΛΕΞΕ ΤΟΝ ΚΟΣΜΟ ΣΟΥ</Text>
        <Text accessibilityRole="header" style={styles.title}>Τι σε κάνει να αναρωτιέσαι;</Text>
        <Text style={styles.body}>Διάλεξε μια θεματική που θα ήθελες να εξερευνήσεις. Η επιλογή σου θα κρατηθεί για τις επόμενες διαδρομές.</Text>
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
          <Text style={styles.previewKicker}>Η ΠΡΩΤΗ ΔΙΑΔΡΟΜΗ · ΠΡΟΣ ΤΟ ΠΑΡΟΝ</Text>
          <Text style={styles.previewTitle}>Αρχαία Ελλάδα</Text>
          <Text style={styles.small}>Προς το παρόν, όλοι ξεκινούν με τη γνωριμία με την Αρχαία Ελλάδα, όποια θεματική κι αν διαλέξουν.</Text>
          {selected ? <Text style={styles.selectedHint}>Η επιλογή σου: {selected.title}</Text> : null}
        </View>
        <ActionButton label={busy ? "Άνοιγμα…" : "Άνοιξε το πρώτο μάθημα →"}
          disabled={busy || !categoryId} onPress={() => { if (categoryId) void run(() => onBeginLesson(categoryId)); }} />
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
  experienceIcon: { width: 27, color: colors.accentLight, fontSize: 28, textAlign: "center" },
  experienceCopy: { flex: 1, gap: 3 },
  experienceTitle: { color: colors.text, fontSize: 14, fontWeight: "800", lineHeight: 21 },
  small: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  divider: { height: 1, backgroundColor: "#45435F", marginLeft: 40 },
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
  error: { color: colors.error, fontSize: 12, lineHeight: 20, marginTop: 12 },
});
