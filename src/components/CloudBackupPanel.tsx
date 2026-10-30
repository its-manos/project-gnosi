import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import ActionButton from "./ActionButton";
import { supabase } from "../lib/supabase";
import { readAccountBackup, saveAccountBackup } from "../lib/learningBackup";
import { describeLearningBackup, mergeLearningBackups, type LearningBackup } from "../utils/learningBackup";
import { colors } from "../theme";

export type BackupControls = { deviceBackup: LearningBackup; onRestoreBackup: (backup: LearningBackup) => Promise<void> };
type Preview = { kind: "save" | "restore"; payload: LearningBackup; revision: number; cloudSummary: string; date: string | null };
function backupError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const message = (error as Error)?.message;
  if (code === "PGRST205" || code === "42P01" || code === "PGRST202") return "Τα αντίγραφα λογαριασμού δεν είναι διαθέσιμα ακόμη. Δοκίμασε ξανά αργότερα.";
  if (code === "40001") return "Το αντίγραφο άλλαξε από άλλη συσκευή. Κάνε νέα προεπισκόπηση πριν αποθηκεύσεις.";
  if (code === "42501" || message === "account_changed") return "Η σύνδεση λογαριασμού άλλαξε ή έληξε. Συνδέσου ξανά και δοκίμασε πάλι.";
  if (message === "unknown_catalogue") return "Το αντίγραφο περιέχει άρθρα από διαφορετική έκδοση. Ενημέρωσε την εφαρμογή πριν συνεχίσεις. Δεν έγινε μεταφορά.";
  if (message === "invalid_backup") return "Το αντίγραφο δεν είναι συμβατό ή περιέχει μη έγκυρα δεδομένα. Η συσκευή σου δεν άλλαξε.";
  return "Η μεταφορά δεν ολοκληρώθηκε. Έλεγξε τη σύνδεση και τον διαθέσιμο χώρο στη συσκευή και δοκίμασε ξανά. Η επαναφορά μπορεί να επαναληφθεί χωρίς διπλές εγγραφές.";
}
export default function CloudBackupPanel({ userId, deviceBackup, onRestoreBackup, onBusyChange }: BackupControls & { userId: string; onBusyChange: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onBusyChange(false); };
  }, [onBusyChange]);
  async function run(action: () => Promise<void>) {
    if (locked.current || !supabase) return;
    locked.current = true;
    setBusy(true); onBusyChange(true); setError(""); setMessage("");
    try { await action(); }
    catch (reason) { if (mounted.current) { setPreview(null); setError(backupError(reason)); } }
    finally { locked.current = false; if (mounted.current) { setBusy(false); onBusyChange(false); } }
  }
  function prepare(kind: Preview["kind"]) {
    void run(async () => {
      const cloud = await readAccountBackup(supabase!, userId);
      if (!mounted.current) return;
      if (kind === "restore" && !cloud) { setMessage("Δεν υπάρχει ακόμη αντίγραφο σε αυτόν τον λογαριασμό. Αποθήκευσε ένα από τη συσκευή όπου διαβάζεις."); return; }
      const payload = cloud ? mergeLearningBackups(deviceBackup, cloud.payload) : deviceBackup;
      setPreview({ kind, payload, revision: cloud?.revision ?? 0, cloudSummary: cloud ? describeLearningBackup(cloud.payload) : "Δεν υπάρχει ακόμη αντίγραφο", date: cloud?.updatedAt ?? null });
    });
  }
  return <View style={styles.panel}>
    <Text style={styles.title}>Αντίγραφο προόδου</Text>
    <Text style={styles.body}>Πρόσθετο χειροκίνητο αντίγραφο για επαναφορά. Ο αυτόματος συγχρονισμός λειτουργεί ξεχωριστά.</Text>
    <Text style={styles.body}>Σε αυτή τη συσκευή: {describeLearningBackup(deviceBackup)}</Text>
    <Text style={styles.note}>Η επαναφορά προσθέτει ολοκληρωμένα και αποθηκευμένα άρθρα. Για κάθε άρθρο κρατά την προσπάθεια με τις περισσότερες απαντήσεις· σε ισοπαλία, τη νεότερη. Δεν μεταφέρει αφαιρέσεις σελιδοδεικτών ή ημερήσια quiz. Μετά την αποσύνδεση βλέπεις την ξεχωριστή πρόοδο επισκέπτη.</Text>
    {!preview ? <>
      <ActionButton label="Προεπισκόπηση αποθήκευσης στον λογαριασμό" disabled={busy} secondary onPress={() => prepare("save")} />
      <ActionButton label="Προεπισκόπηση επαναφοράς στη συσκευή" disabled={busy} secondary onPress={() => prepare("restore")} />
    </> : <View style={styles.preview}>
      <Text style={styles.title}>{preview.kind === "save" ? "Αποθήκευση στον λογαριασμό" : "Επαναφορά στη συσκευή"}</Text>
      <Text style={styles.body}>Στον λογαριασμό: {preview.cloudSummary}</Text>
      {preview.date ? <Text style={styles.note}>Τελευταία αποθήκευση: {new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" }).format(new Date(preview.date))}</Text> : null}
      <Text style={styles.body}>Μετά τη μεταφορά: {describeLearningBackup(preview.payload)}</Text>
      <Text style={styles.note}>{preview.kind === "save" ? "Θα ενωθούν το αντίγραφο λογαριασμού και τα δεδομένα αυτής της συσκευής. Η συσκευή δεν θα αλλάξει." : "Θα προστεθούν δεδομένα σε αυτή τη συσκευή. Το χειροκίνητο αντίγραφο δεν θα αλλάξει. Οι προσθήκες θα συγχρονιστούν αυτόματα."}</Text>
      <ActionButton label={preview.kind === "save" ? "Επιβεβαίωση αποθήκευσης" : "Επιβεβαίωση επαναφοράς"} disabled={busy} onPress={() => {
        void run(async () => {
          if (preview.kind === "save") await saveAccountBackup(supabase!, userId, preview.payload, preview.revision);
          else {
            // Recheck identity before applying a previously previewed account's data.
            const { data, error: sessionError } = await supabase!.auth.getSession();
            if (sessionError) throw sessionError;
            if (data.session?.user.id !== userId) throw new Error("account_changed");
            if (!mounted.current) return;
            await onRestoreBackup(preview.payload);
          }
          if (mounted.current) { setPreview(null); setMessage(preview.kind === "save" ? "Το αντίγραφο αποθηκεύτηκε στον λογαριασμό σου. Στην άλλη συσκευή, συνδέσου και επίλεξε επαναφορά." : "Η επαναφορά ολοκληρώθηκε. Η πρόοδος και τα αποθηκευμένα ενημερώθηκαν."); }
        });
      }} />
      <ActionButton label="Ακύρωση μεταφοράς" disabled={busy} secondary onPress={() => setPreview(null)} />
    </View>}
    <View accessibilityLiveRegion="polite">
      {busy ? <ActivityIndicator color={colors.accentLight} accessibilityLabel="Μεταφορά αντιγράφου" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.body}>{message}</Text> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  panel: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 18, gap: 10 },
  title: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "700" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  preview: { backgroundColor: colors.background, padding: 14, borderRadius: 14, gap: 10 },
  error: { color: colors.error, fontSize: 13, lineHeight: 21 },
});
