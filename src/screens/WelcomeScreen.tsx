import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import { CHALLENGE_DIFFICULTIES, DAILY_CHALLENGE_TOPICS, type ChallengeDifficulty, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { colors } from "../theme";
type Props = {
  initialPreferences: DailyChallengePreferences;
  replay: boolean;
  hasStartedChallenge: boolean;
  onFinish: (preferences: DailyChallengePreferences, destination: "daily" | "home") => Promise<boolean>;
  onSkip: () => Promise<void>;
};
export default function WelcomeScreen({ initialPreferences, replay, hasStartedChallenge, onFinish, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [topics, setTopics] = useState<string[]>(() => replay ? [...initialPreferences.topicIds] : []);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>(initialPreferences.difficulty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false), mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(action: () => Promise<boolean | void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try { if (await action() === false && mounted.current) setError(true); }
    catch { if (mounted.current) setError(true); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  function advance(next: number) { setStep(next); setError(false); }
  function finish(destination: "daily" | "home") {
    if (topics.length < 3 || topics.length > 5) return;
    void run(() => onFinish({ topicIds: topics, difficulty }, destination));
  }
  return <View style={styles.root} testID="welcome-flow">
    <View style={styles.header}>
      {step > 0 ? <Pressable style={styles.headerControl} disabled={busy} accessibilityRole="button" accessibilityLabel="Προηγούμενο βήμα" onPress={() => advance(step - 1)}><Text style={styles.link}>‹ Πίσω</Text></Pressable> : <Text style={styles.logo}>ΓΝΩΣΗ</Text>}
      <Text style={styles.step} accessibilityLabel={`Βήμα ${step + 1} από 3`}>{step + 1} / 3</Text>
      <Pressable style={styles.headerControl} disabled={busy} accessibilityRole="button" accessibilityLabel="Παράλειψη οδηγού" accessibilityState={{ disabled: busy }} onPress={() => void run(onSkip)}><Text style={styles.link}>Παράλειψη</Text></Pressable>
    </View>
    <ScrollView key={step} style={styles.viewport} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {step === 0 ? <>
        <View style={styles.heroMark} accessible={false}><Text style={styles.heroGlyph}>✦</Text></View>
        <Text style={styles.eyebrow}>ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΗ ΓΝΩΣΗ</Text>
        <Text accessibilityRole="header" style={styles.title}>Μια μικρή ανακάλυψη, κάθε μέρα.</Text>
        <Text style={styles.body}>Ακολούθησε την περιέργειά σου. Διάβασε μια ιστορία που δεν ήξερες και δες τι θα θυμάσαι μετά.</Text>
        <View style={styles.steps}>
          <View style={styles.feature}><Text style={styles.featureNumber}>01</Text><View style={styles.featureCopy}><Text style={styles.featureTitle}>Διάβασε</Text><Text style={styles.small}>Μικρά άρθρα με πηγές και ερωτήσεις στη διαδρομή.</Text></View></View>
          <View style={styles.feature}><Text style={styles.featureNumber}>02</Text><View style={styles.featureCopy}><Text style={styles.featureTitle}>Δοκίμασε</Text><Text style={styles.small}>7 ερωτήσεις κάθε μέρα, με εξήγηση σε κάθε απάντηση.</Text></View></View>
          <View style={styles.feature}><Text style={styles.featureNumber}>03</Text><View style={styles.featureCopy}><Text style={styles.featureTitle}>Συνέχισε</Text><Text style={styles.small}>Η πρόοδός σου σε περιμένει όταν επιστρέψεις.</Text></View></View>
        </View>
        <Text style={styles.note}>Ξεκινάς χωρίς λογαριασμό. Η σύνδεση για συγχρονισμό είναι προαιρετική, από την Πρόοδο.</Text>
        <ActionButton label={replay ? "Ρύθμισε την πρόκλησή σου →" : "Φτιάξε την πρώτη σου πρόκληση →"} onPress={() => advance(1)} disabled={busy} />
        <ActionButton label="Εξερεύνησε τα άρθρα τώρα" onPress={() => void run(onSkip)} secondary disabled={busy} />
      </> : step === 1 ? <>
        <Text style={styles.eyebrow}>ΤΑ ΔΙΚΑ ΣΟΥ ΕΝΔΙΑΦΕΡΟΝΤΑ</Text>
        <Text accessibilityRole="header" style={styles.title}>Τι σου κινεί την περιέργεια;</Text>
        <Text style={styles.body}>Διάλεξε 3 έως 5 θέματα για την καθημερινή σου πρόκληση. Μπορείς να τα αλλάξεις αργότερα.</Text>
        <Text style={styles.count} accessibilityLiveRegion="polite">{topics.length} / 5 επιλεγμένα · τουλάχιστον 3</Text>
        <View style={styles.grid}>
          {DAILY_CHALLENGE_TOPICS.map(topic => {
            const selected = topics.includes(topic.id); const disabled = busy || (!selected && topics.length >= 5);
            return <Pressable key={topic.id} accessibilityRole="checkbox" accessibilityLabel={topic.title} accessibilityState={{ checked: selected, disabled }} disabled={disabled}
              style={[styles.topic, selected && styles.selected, disabled && !selected && styles.disabled]} onPress={() => {
                setTopics(current => current.includes(topic.id) ? current.filter(id => id !== topic.id) : current.length < 5 ? [...current, topic.id] : current); setError(false);
              }}>
              <View style={styles.topicHeader}><Text style={styles.emoji}>{topic.emoji}</Text><Text style={styles.check}>{selected ? "✓" : "+"}</Text></View>
              <Text style={styles.featureTitle}>{topic.title}</Text><Text style={styles.small}>{topic.description}</Text>
            </Pressable>;
          })}
        </View>
        <ActionButton label="Συνέχεια →" disabled={busy || topics.length < 3 || topics.length > 5} onPress={() => advance(2)} />
      </> : <>
        <Text style={styles.eyebrow}>ΕΤΟΙΜΟΣ ΓΙΑ ΤΗΝ ΠΡΩΤΗ ΑΝΑΚΑΛΥΨΗ;</Text>
        <Text accessibilityRole="header" style={styles.title}>Με τι ρυθμό ξεκινάμε;</Text>
        <Text style={styles.body}>7 ερωτήσεις, με τον δικό σου ρυθμό. Κάθε επιλογή συνοδεύεται από μια εξήγηση για να μάθεις κάτι νέο.</Text>
        <View style={styles.levels}>
          {CHALLENGE_DIFFICULTIES.map(level => <Pressable key={level.id} accessibilityRole="radio" accessibilityLabel={`${level.title}. ${level.description}`} accessibilityState={{ selected: difficulty === level.id, disabled: busy }} disabled={busy} style={[styles.level, difficulty === level.id && styles.selected]} onPress={() => { setDifficulty(level.id); setError(false); }}>
            <View style={styles.featureCopy}><Text style={styles.featureTitle}>{level.title}</Text><Text style={styles.small}>{level.description}</Text></View><Text style={styles.check}>{difficulty === level.id ? "●" : "○"}</Text>
          </Pressable>)}
        </View>
        <View style={styles.summary}><Text style={styles.eyebrow}>Η ΠΡΟΚΛΗΣΗ ΣΟΥ</Text><Text style={styles.small}>{DAILY_CHALLENGE_TOPICS.filter(topic => topics.includes(topic.id)).map(topic => topic.title).join(" · ")}</Text></View>
        <Text style={styles.note}>Αν δεν υπάρχουν αρκετές ερωτήσεις στα θέματα και στη δυσκολία σου, συμπληρώνουμε την επτάδα με άλλα θέματα ή επίπεδα.</Text>
        {hasStartedChallenge ? <Text style={styles.note}>Η σημερινή σου πρόκληση διατηρείται. Οι νέες επιλογές θα ισχύσουν στην επόμενη που θα ξεκινήσεις.</Text> : null}
        <ActionButton label={busy ? "Αποθήκευση…" : hasStartedChallenge ? "Δες τη σημερινή πρόκληση →" : "Πάμε στις 7 ερωτήσεις →"} disabled={busy} onPress={() => finish("daily")} />
        <ActionButton label="Αποθήκευση & εξερεύνηση άρθρων" disabled={busy} secondary onPress={() => finish("home")} />
      </>}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">Δεν ολοκληρώθηκε η αποθήκευση. Ξαναδοκίμασε ή παράλειψε τον οδηγό. Οι επιλογές που αποθηκεύτηκαν διατηρούνται.</Text> : null}
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
  heroMark: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.accentSurface, justifyContent: "center", alignItems: "center", marginBottom: 28 },
  heroGlyph: { color: colors.accentLight, fontSize: 42 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 18, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
  title: { color: colors.text, fontSize: 32, lineHeight: 42, fontWeight: "700", marginBottom: 16 },
  body: { color: colors.textBody, fontSize: 17, lineHeight: 28, marginBottom: 24 },
  steps: { gap: 20, marginBottom: 24 },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  featureNumber: { color: colors.accentLight, fontSize: 12, fontWeight: "800", lineHeight: 24 },
  featureCopy: { flex: 1, gap: 4 },
  featureTitle: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  small: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 12 },
  count: { color: colors.accentLight, fontSize: 13, lineHeight: 21, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topic: { flexBasis: "47%", flexGrow: 1, minWidth: 125, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, gap: 6 },
  topicHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  emoji: { fontSize: 24 },
  check: { color: colors.accentLight, fontSize: 19, fontWeight: "700" },
  selected: { backgroundColor: colors.accentSurface, borderColor: colors.accentLight },
  disabled: { opacity: 0.45 },
  levels: { gap: 10, marginBottom: 22 },
  level: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 74, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 16 },
  summary: { padding: 16, backgroundColor: colors.surface, borderRadius: 14, marginBottom: 16 },
  error: { color: colors.error, fontSize: 13, lineHeight: 22, marginTop: 18 },
});
