import UsageSharing from "../components/UsageSharing";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import { DAILY_CHALLENGE_TOPICS, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import type { Lesson } from "../data/lessons";
import type { WelcomeDestination } from "../utils/firstRun";
import { colors } from "../theme";

type Props = {
  initialPreferences: DailyChallengePreferences;
  replay: boolean;
  hasStartedChallenge: boolean;
  lessonCandidates?: Lesson[];
  onFinish: (preferences: DailyChallengePreferences, destination: WelcomeDestination, lessonId?: string) => Promise<boolean>;
  onSkip: (step?: number) => Promise<void>;
};

export default function WelcomeScreen({ initialPreferences, replay, hasStartedChallenge, onFinish, onSkip }: Props) {
  const { analytics, enabled: usageEnabled } = useBetaAnalytics();
  const [step, setStep] = useState(0);
  const [topics, setTopics] = useState<string[]>(() => replay ? [...initialPreferences.topicIds] : []);
  const [difficulty] = useState(initialPreferences.difficulty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false), mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (usageEnabled) void analytics.track("onboarding_step_viewed", { screen: "welcome", onboarding_step: step + 1, replay });
  }, [analytics, usageEnabled, step, replay]);


  async function run(action: () => Promise<boolean | void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try { if (await action() === false && mounted.current) setError(true); }
    catch { if (mounted.current) setError(true); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  function advance(next: number) { if (!locked.current) { setStep(next); setError(false); } }
  function finish() {
    if (topics.length < 3 || topics.length > 5) return;
    void run(() => onFinish({ topicIds: topics, difficulty }, "home"));
  }

  return <View style={styles.root} testID="welcome-flow">
    <View style={styles.header}>
      {step > 0 ? <Pressable style={styles.headerControl} disabled={busy} accessibilityRole="button" accessibilityLabel="Προηγούμενο βήμα" onPress={() => advance(step - 1)}><Text style={styles.link}>‹ Πίσω</Text></Pressable> : <Text style={styles.logo}>ΓΝΩΣΗ</Text>}
      <Text style={styles.step} accessibilityLabel={`Βήμα ${step + 1} από 4`}>{step + 1} / 4</Text>
      <Pressable style={styles.headerControl} disabled={busy} accessibilityRole="button" accessibilityLabel="Παράλειψη οδηγού" accessibilityState={{ disabled: busy }} onPress={() => void run(() => onSkip(step + 1))}><Text style={styles.link}>Παράλειψη</Text></Pressable>
    </View>
    <ScrollView key={step} style={styles.viewport} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {step === 0 ? <>
        <View style={styles.heroMark} accessible={false}><Text style={styles.heroGlyph}>✦</Text></View>
        <Text style={styles.eyebrow}>ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΗ ΓΝΩΣΗ</Text>
        <Text accessibilityRole="header" style={styles.title}>Μια μικρή ανακάλυψη, κάθε μέρα.</Text>
        <Text style={styles.body}>Για όσα πάντα αναρωτιόσουν και για όσα δεν είχες σκεφτεί να ρωτήσεις. Λίγη περιέργεια αρκεί για να ξεκινήσεις.</Text>
        <Text style={styles.note}>Παίζεις χωρίς λογαριασμό. Αν θέλεις συγχρονισμό της προόδου σου, μπορείς να συνδεθείς αργότερα.</Text>
        <UsageSharing />
        <ActionButton label="Ας ξεκινήσουμε →" onPress={() => advance(1)} disabled={busy} />
        <ActionButton label="Πήγαινε στην αρχική" onPress={() => void run(() => onSkip(step + 1))} secondary disabled={busy} />
      </> : step === 1 ? <>
        <Text style={styles.eyebrow}>ΒΡΕΣ ΤΟΝ ΡΥΘΜΟ ΣΟΥ</Text>
        <Text accessibilityRole="header" style={styles.title}>Δύο τρόποι να παίξεις.</Text>
        <Text style={styles.body}>Μια γρήγορη πρόκληση ή μια διαδρομή με περισσότερες ανακαλύψεις; Μπορείς να απολαμβάνεις και τα δύο.</Text>
        <View style={styles.modeCard} testID="welcome-daily-mode">
          <View style={styles.modeHeading}><Text style={styles.modeGlyph} accessible={false}>⚡</Text><Text style={styles.modeTitle}>Καθημερινή πρόκληση</Text></View>
          <Text style={styles.small}>7 κοινές ερωτήσεις κάθε μέρα, από διαφορετικά θέματα. Μετά από κάθε απάντηση, μια εξήγηση σε βοηθά να μάθεις κάτι νέο.</Text>
          <Text style={styles.modeMeta}>Μια μικρή καθημερινή συνήθεια.</Text>
        </View>
        <View style={styles.modeCard} testID="welcome-guided-mode">
          <View style={styles.modeHeading}><Text style={styles.modeGlyph} accessible={false}>🧭</Text><Text style={styles.modeTitle}>Διαδρομές γνώσης</Text></View>
          <Text style={styles.small}>Διάβασε ένα μάθημα και απάντησε στις ερωτήσεις του. Κάθε ολοκλήρωση ξεκλειδώνει το επόμενο μάθημα στην ίδια θεματική.</Text>
          <Text style={styles.modeMeta}>Προχωράς με τον ρυθμό σου. Δεν χρειάζεται τέλειο σκορ.</Text>
        </View>
        <ActionButton label="Συνέχεια →" onPress={() => advance(2)} disabled={busy} />
      </> : step === 2 ? <>
        <Text style={styles.eyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ ΣΟΥ</Text>
        <Text accessibilityRole="header" style={styles.title}>Τι σου κινεί την περιέργεια;</Text>
        <Text style={styles.body}>Διάλεξε 3 έως 5 θέματα για τις προτάσεις μαθημάτων μετά το quiz. Μπορείς να τα αλλάξεις όποτε θέλεις.</Text>
        <Text style={styles.count} accessibilityLiveRegion="polite">{topics.length} / 5 επιλεγμένα · τουλάχιστον 3</Text>
        <View style={styles.grid}>
          {DAILY_CHALLENGE_TOPICS.map(topic => {
            const selected = topics.includes(topic.id), disabled = busy || (!selected && topics.length >= 5);
            return <Pressable key={topic.id} accessibilityRole="checkbox" accessibilityLabel={topic.title} accessibilityState={{ checked: selected, disabled }} disabled={disabled}
              style={[styles.topic, selected && styles.selected, disabled && !selected && styles.disabled]} onPress={() => {
                setTopics(current => current.includes(topic.id) ? current.filter(id => id !== topic.id) : current.length < 5 ? [...current, topic.id] : current); setError(false);
              }}>
              <View style={styles.topicHeader}><Text style={styles.emoji} accessible={false}>{topic.emoji}</Text><Text style={styles.check}>{selected ? "✓" : "+"}</Text></View>
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </Pressable>;
          })}
        </View>
        <Text style={styles.note}>Η κοινή πρόκληση περιέχει εύκολες, μεσαίες και δύσκολες ερωτήσεις.</Text>
        <ActionButton label="Συνέχεια →" disabled={busy || topics.length < 3 || topics.length > 5} onPress={() => advance(3)} />
      </> : <>
        <View style={styles.heroMark} accessible={false}><Text style={styles.heroGlyph}>✓</Text></View>
        <Text style={styles.eyebrow}>ΟΛΑ ΕΤΟΙΜΑ</Text>
        <Text accessibilityRole="header" style={styles.title}>Καλή διασκέδαση!</Text>
        <Text style={styles.body}>Διάλεξε μια διαδρομή, δοκίμασε όσα ξέρεις και ανακάλυψε κάτι καινούργιο. Ελπίζουμε να βρεις πολλά που θα σου μείνουν.</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Τα ενδιαφέροντά σου</Text>
          <Text style={styles.small}>{DAILY_CHALLENGE_TOPICS.filter(topic => topics.includes(topic.id)).map(topic => topic.title).join(" · ")}</Text>
        </View>
        {hasStartedChallenge ? <Text style={styles.note}>Η σημερινή πρόκληση διατηρείται. Οι επιλογές σου βοηθούν στις προτάσεις μαθημάτων.</Text> : null}
        <ActionButton label={busy ? "Αποθήκευση…" : "Πάμε στη ΓΝΩΣΗ →"} disabled={busy || topics.length < 3 || topics.length > 5} onPress={finish} />
      </>}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">Δεν ολοκληρώθηκε η αποθήκευση. Οι επιλογές σου παραμένουν εδώ. Δοκίμασε ξανά ή παράλειψε τον οδηγό.</Text> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, paddingHorizontal: 20, paddingVertical: 6 },
  headerControl: { minHeight: 44, justifyContent: "center", paddingVertical: 10, paddingHorizontal: 4 },
  logo: { color: colors.accentLight, fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  link: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  step: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  viewport: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 22, paddingTop: 22, paddingBottom: 40 },
  heroMark: { width: 72, height: 72, borderRadius: 23, backgroundColor: colors.accentSurface, justifyContent: "center", alignItems: "center", marginBottom: 26 },
  heroGlyph: { color: colors.accentLight, fontSize: 38 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 18, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
  title: { color: colors.text, fontSize: 30, lineHeight: 40, fontWeight: "700", marginBottom: 16 },
  body: { color: colors.textBody, fontSize: 16, lineHeight: 26, marginBottom: 24 },
  small: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 12, marginBottom: 6 },
  modeCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 12, marginBottom: 14 },
  modeHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  modeGlyph: { fontSize: 26 },
  modeTitle: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: "700", flex: 1 },
  modeMeta: { color: colors.accentLight, fontSize: 12, lineHeight: 20 },
  count: { color: colors.accentLight, fontSize: 13, lineHeight: 21, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topic: { flexBasis: "47%", flexGrow: 1, minWidth: 125, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, gap: 8 },
  topicHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emoji: { fontSize: 25 },
  topicTitle: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "600" },
  check: { color: colors.accentLight, fontSize: 19, fontWeight: "700" },
  selected: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  disabled: { opacity: 0.45 },
  summary: { padding: 18, gap: 10, backgroundColor: colors.surface, borderRadius: 16, marginBottom: 16 },
  summaryTitle: { color: colors.textMuted, fontSize: 12, lineHeight: 20, fontWeight: "600" },
  error: { color: colors.error, fontSize: 13, lineHeight: 22, marginTop: 18 },
});
