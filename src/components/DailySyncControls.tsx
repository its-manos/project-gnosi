import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLearningSession } from "../state/LearningSession";
import { getDailyStore } from "../lib/dailySync";
import { dailyHistory, type DailyDocument } from "../utils/dailySyncDocument";
import { DAILY_CHALLENGE_TOPICS, CHALLENGE_DIFFICULTIES } from "../data/dailyChallengeTopics";
import { colors } from "../theme";
export default function DailySyncControls() {
  const { dailyStore, email } = useLearningSession();
  const [preview, setPreview] = useState<DailyDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false), mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try { await action(); }
    catch { if (mounted.current) setMessage("Η εισαγωγή δεν ολοκληρώθηκε. Έλεγξε τον χώρο στη συσκευή και δοκίμασε ξανά."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  if (!dailyStore.userId) return null;
  const prefs = preview?.preferences?.value ?? null;
  return <View style={styles.panel}>
    <Text style={styles.body}>Οι ημερήσιες προκλήσεις, το ιστορικό και οι προτιμήσεις ανήκουν πλέον στον λογαριασμό σου. Η παλιά κοινή πρόοδος παραμένει ως επισκέπτη.</Text>
    {preview ? <>
      <Text style={styles.body}>Προς εισαγωγή: {dailyHistory(preview).length} ολοκληρωμένες ημέρες · {Object.values(preview.days).filter(day => !day.record.completed).length} ημιτελείς προσπάθειες.</Text>
      <Text style={styles.note}>Θα προστεθούν στον λογαριασμό {email ?? "που χρησιμοποιείς"}. Κρατάμε ένα αποτέλεσμα ανά ημερομηνία. {prefs ? "Οι προτιμήσεις επισκέπτη θα αντικαταστήσουν τις τρέχουσες, χωρίς να αλλάξουν τις ερωτήσεις μιας ενεργής πρόκλησης." : "Δεν υπάρχουν αποθηκευμένες προτιμήσεις επισκέπτη· οι δικές σου παραμένουν."}</Text>
      {prefs ? <Text style={styles.note}>{prefs.topicIds.map(id => DAILY_CHALLENGE_TOPICS.find(topic => topic.id === id)?.title).join(" · ")} · {CHALLENGE_DIFFICULTIES.find(level => level.id === prefs.difficulty)?.title}</Text> : null}
      <Pressable disabled={busy} style={styles.button} accessibilityRole="button" accessibilityState={{ disabled: busy }} onPress={() => void run(async () => {
        await dailyStore.importGuest(preview);
        if (mounted.current) { setPreview(null); setMessage("Οι ημερήσιες γνώσεις προστέθηκαν και θα συγχρονιστούν. Το αντίγραφο επισκέπτη παραμένει στη συσκευή."); }
      })}><Text style={styles.link}>Εισαγωγή ημερήσιων δεδομένων και προτιμήσεων</Text></Pressable>
      <Pressable disabled={busy} style={styles.button} accessibilityRole="button" onPress={() => setPreview(null)}><Text style={styles.link}>Ακύρωση εισαγωγής ημερήσιων δεδομένων</Text></Pressable>
    </> : <Pressable disabled={busy} style={styles.button} accessibilityRole="button" onPress={() => void run(async () => {
      const guest = getDailyStore(null); await guest.start();
      const state = guest.getSnapshot(); if (!state.ready) throw new Error("guest_unavailable");
      if (mounted.current) setPreview(state.doc);
    })}><Text style={styles.link}>Προεπισκόπηση παλιών ημερήσιων δεδομένων</Text></Pressable>}
    {message ? <Text style={styles.body} accessibilityLiveRegion="polite">{message}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  panel: { paddingTop: 12, gap: 10, borderTopWidth: 1, borderColor: colors.border },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  link: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  button: { minHeight: 44, paddingVertical: 10, justifyContent: "center" },
});
