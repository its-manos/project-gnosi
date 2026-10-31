import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DailySyncControls from "./DailySyncControls";
import { useLearningSession, useLearningSnapshot, useDailySnapshot } from "../state/LearningSession";
import { getLearningStore } from "../lib/learningSync";
import { describeLearningBackup, type LearningBackup } from "../utils/learningBackup";
import type { CompletionEvents } from "../utils/learningActivity";
import type { WeeklyAnswers } from "../utils/weeklyReview";
import { colors } from "../theme";
const labels = {
  loading: "Φόρτωση προόδου…", local: "Αποθηκευμένα στη συσκευή · Επισκέπτης", queued: "Αλλαγές σε αναμονή συγχρονισμού", syncing: "Συγχρονισμός…", saved: "Συγχρονισμένα στον λογαριασμό", waiting: "Αναμονή σύνδεσης", error: "Ο συγχρονισμός χρειάζεται έλεγχο", "local-error": "Πρόβλημα αποθήκευσης στη συσκευή",
};
export default function SyncStatus({ detailed = false, quiet = false }: { detailed?: boolean; quiet?: boolean }) {
  const { store, dailyStore, email } = useLearningSession();
  const snapshot = useLearningSnapshot();
  const daily = useDailySnapshot();
  const priority = ["local-error", "error", "waiting", "syncing", "queued", "loading", "saved", "local"];
  const combined = priority.indexOf(daily.status) < priority.indexOf(snapshot.status) ? daily : snapshot;
  const [guest, setGuest] = useState<{ backup: LearningBackup; activity: CompletionEvents; weeklyReviews: WeeklyAnswers } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const needsRetry = ["waiting", "error", "local-error"].includes(combined.status);
  async function prepareImport() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const guestStore = getLearningStore(null); await guestStore.start();
      const state = guestStore.getSnapshot();
      if (!state.ready) throw new Error("local_guest");
      setGuest({ backup: state.backup, activity: state.activity, weeklyReviews: state.weeklyReviews });
    } catch { setMessage("Δεν φορτώθηκε η πρόοδος επισκέπτη. Δοκίμασε ξανά."); }
    finally { setBusy(false); }
  }
  if (quiet && !detailed && ["local", "saved"].includes(combined.status)) return null;
  return <View style={detailed ? styles.panel : styles.bar}>
    <View style={styles.row}>
      <Text style={styles.label} accessibilityLiveRegion="polite">{labels[combined.status]}</Text>
      {needsRetry ? <Pressable style={styles.retry} accessibilityRole="button" onPress={() => { void store.retry(); void dailyStore.retry(); }}><Text style={styles.link}>Επανάληψη</Text></Pressable> : null}
    </View>
    {detailed ? <>
      {combined.error ? <Text style={styles.body}>{combined.error}</Text> : null}
      <Text style={styles.note}>Άρθρα: {labels[snapshot.status]} · Ημερήσια: {labels[daily.status]}</Text>
      <Text style={styles.body}>{snapshot.userId ? `Λογαριασμός: ${email ?? "Συνδεδεμένος χρήστης"}. Αυτόματος συγχρονισμός όσο η εφαρμογή είναι ανοιχτή.` : "Ως επισκέπτης, κρατάς την πρόοδό σου σε αυτή τη συσκευή."}</Text>
      {snapshot.userId ? guest ? <View style={styles.importBox}>
        <Text style={styles.body}>Πρόοδος επισκέπτη: {describeLearningBackup(guest.backup)}</Text>
        <Text style={styles.body}>Χρονολογημένες ολοκληρώσεις μαθημάτων: {Object.keys(guest.activity).length}</Text>
        <Text style={styles.body}>Απαντήσεις δεύτερης ευκαιρίας: {Object.keys(guest.weeklyReviews).length}</Text>
        <Text style={styles.note}>Θα προστεθεί στον λογαριασμό {email ?? "που χρησιμοποιείς"} και θα συγχρονιστεί. Το αντίγραφο επισκέπτη παραμένει στη συσκευή. Η εισαγωγή μπορεί να επαναφέρει παλιούς σελιδοδείκτες.</Text>
        <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" accessibilityState={{ disabled: busy }} onPress={() => {
          if (busy) return;
          setBusy(true);
          void store.importGuest(guest.backup, guest.activity, guest.weeklyReviews).then(() => { setGuest(null); setMessage("Η πρόοδος και η δραστηριότητα επισκέπτη προστέθηκαν. Οι αλλαγές θα συγχρονιστούν αυτόματα."); }).catch(() => setMessage("Η εισαγωγή δεν αποθηκεύτηκε πλήρως. Δοκίμασε ξανά.")).finally(() => setBusy(false));
        }}><Text style={styles.link}>Προσθήκη στον λογαριασμό</Text></Pressable>
        <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" onPress={() => setGuest(null)}><Text style={styles.link}>Ακύρωση εισαγωγής</Text></Pressable>
      </View> : <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" onPress={() => void prepareImport()}><Text style={styles.link}>Προεπισκόπηση εισαγωγής προόδου επισκέπτη</Text></Pressable> : null}
      <DailySyncControls />
      {message ? <Text style={styles.body} accessibilityLiveRegion="polite">{message}</Text> : null}
    </> : null}
  </View>;
}
const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingVertical: 4, backgroundColor: colors.background },
  panel: { marginBottom: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { color: colors.textMuted, fontSize: 11, lineHeight: 18, flexShrink: 1 },
  link: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: "center", paddingVertical: 8, paddingHorizontal: 4 },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  importBox: { padding: 12, borderRadius: 12, backgroundColor: colors.background, gap: 10 },
});
