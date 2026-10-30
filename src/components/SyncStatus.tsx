import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
import { getLearningStore } from "../lib/learningSync";
import { describeLearningBackup, type LearningBackup } from "../utils/learningBackup";
import { colors } from "../theme";
const labels = {
  loading: "Φόρτωση προόδου…", local: "Αποθηκευμένα στη συσκευή · Επισκέπτης", queued: "Αλλαγές σε αναμονή συγχρονισμού", syncing: "Συγχρονισμός…", saved: "Συγχρονισμένα στον λογαριασμό", waiting: "Αναμονή σύνδεσης", error: "Ο συγχρονισμός χρειάζεται έλεγχο", "local-error": "Πρόβλημα αποθήκευσης στη συσκευή",
};
export default function SyncStatus({ detailed = false }: { detailed?: boolean }) {
  const { store, email } = useLearningSession();
  const snapshot = useLearningSnapshot();
  const [guest, setGuest] = useState<LearningBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const needsRetry = ["waiting", "error", "local-error"].includes(snapshot.status);
  async function prepareImport() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const guestStore = getLearningStore(null); await guestStore.start();
      const state = guestStore.getSnapshot();
      if (!state.ready) throw new Error("local_guest");
      setGuest(state.backup);
    } catch { setMessage("Δεν φορτώθηκε η πρόοδος επισκέπτη. Δοκίμασε ξανά."); }
    finally { setBusy(false); }
  }
  return <View style={detailed ? styles.panel : styles.bar}>
    <View style={styles.row}>
      <Text style={styles.label} accessibilityLiveRegion="polite">{labels[snapshot.status]}</Text>
      {needsRetry ? <Pressable style={styles.retry} accessibilityRole="button" onPress={() => void store.retry()}><Text style={styles.link}>Επανάληψη</Text></Pressable> : null}
    </View>
    {detailed ? <>
      {snapshot.error ? <Text style={styles.body}>{snapshot.error}</Text> : null}
      <Text style={styles.body}>{snapshot.userId ? `Λογαριασμός: ${email ?? "Συνδεδεμένος χρήστης"}. Η πρόοδος άρθρων και οι σελιδοδείκτες συγχρονίζονται αυτόματα όσο η εφαρμογή είναι ανοιχτή. Κάθε λογαριασμός έχει ξεχωριστά τοπικά δεδομένα.` : "Διαβάζεις ως επισκέπτης. Η πρόοδος άρθρων παραμένει σε αυτή τη συσκευή."}</Text>
      <Text style={styles.note}>Ημερήσια quiz, ιστορικό και προτιμήσεις παραμένουν στη συσκευή και δεν περιλαμβάνονται στον συγχρονισμό.</Text>
      {snapshot.userId ? guest ? <View style={styles.importBox}>
        <Text style={styles.body}>Πρόοδος επισκέπτη: {describeLearningBackup(guest)}</Text>
        <Text style={styles.note}>Θα προστεθεί στον λογαριασμό {email ?? "που χρησιμοποιείς"} και θα συγχρονιστεί. Το αντίγραφο επισκέπτη παραμένει στη συσκευή. Η εισαγωγή μπορεί να επαναφέρει παλιούς σελιδοδείκτες.</Text>
        <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" accessibilityState={{ disabled: busy }} onPress={() => {
          if (busy) return;
          setBusy(true);
          void Promise.all([store.restoreProgress(guest), store.restoreBookmarks(guest.savedIds)]).then(() => { setGuest(null); setMessage("Η πρόοδος επισκέπτη προστέθηκε. Οι αλλαγές θα συγχρονιστούν αυτόματα."); }).catch(() => setMessage("Η εισαγωγή δεν αποθηκεύτηκε πλήρως. Δοκίμασε ξανά.")).finally(() => setBusy(false));
        }}><Text style={styles.link}>Προσθήκη στον λογαριασμό</Text></Pressable>
        <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" onPress={() => setGuest(null)}><Text style={styles.link}>Ακύρωση εισαγωγής</Text></Pressable>
      </View> : <Pressable disabled={busy} style={styles.retry} accessibilityRole="button" onPress={() => void prepareImport()}><Text style={styles.link}>Προεπισκόπηση εισαγωγής προόδου επισκέπτη</Text></Pressable> : null}
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
