import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useReportOutbox } from "../hooks/useReportOutbox";
import { REPORT_REASONS, reportTargetKey, type ReportReason, type ReportTarget } from "../utils/contentReports";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

export default function ReportContentButton({ target, iconOnly = false }: { target: ReportTarget; iconOnly?: boolean }) {
  const outbox = useReportOutbox();
  const [open, setOpen] = useState(false), [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState(""), [sent, setSent] = useState(false), [message, setMessage] = useState("");
  const alive = useRef(false), submitting = useRef(false), completed = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const pending = outbox.items.find(item => reportTargetKey(item.target) === reportTargetKey(target));
  const selected = pending?.reason ?? reason;
  function close() { if (!submitting.current && !outbox.busy) setOpen(false); }
  async function submit() {
    if (completed.current || submitting.current || outbox.busy || !outbox.ready || (!pending && (!reason || (reason === "other" && !note.trim())))) return;
    submitting.current = true; setMessage("");
    try {
      const delivered = pending ? await outbox.store.retry(pending.id) : await outbox.store.submit(target, reason!, note);
      if (alive.current && delivered) { completed.current = true; setSent(true); setReason(null); setNote(""); }
    } catch { if (alive.current) setMessage("Δεν ολοκληρώθηκε η αναφορά. Το κείμενο παραμένει εδώ· δοκίμασε ξανά."); }
    finally { submitting.current = false; }
  }
  return <>
    <Pressable style={({ pressed }) => [iconOnly ? styles.iconButton : styles.reportLink, pressed && styles.pressed]} accessibilityRole="button"
      accessibilityLabel={target.questionText ? "Αναφορά προβλήματος σε αυτή την ερώτηση" : "Αναφορά προβλήματος στο μάθημα"} onPress={() => { completed.current = false; setSent(false); setMessage(""); setOpen(true); }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}><Path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0" stroke={colors.textMuted} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>
      {!iconOnly ? <Text style={styles.linkText}>{target.questionText ? "Αναφορά ερώτησης" : "Αναφορά προβλήματος"}</Text> : null}
    </Pressable>
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaProvider style={styles.root}>
      <SafeAreaView style={styles.root} edges={["top", "right", "bottom", "left"]}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.header}><Text style={styles.brand}>ΓΝΩΣΗ</Text><Pressable accessibilityRole="button" accessibilityLabel="Κλείσιμο αναφοράς" disabled={outbox.busy} onPress={close} style={styles.close}><Text style={styles.linkText}>Κλείσιμο ×</Text></Pressable></View>
          <ScrollView style={styles.viewport} contentInsetAdjustmentBehavior="never" automaticallyAdjustKeyboardInsets={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{sent ? "Ευχαριστούμε που βοηθάς!" : "Τι χρειάζεται μια δεύτερη ματιά;"}</Text>
            {sent ? <><Text style={styles.body}>Η αναφορά παραδόθηκε για έλεγχο. Ευχαριστούμε!</Text><ActionButton label="Πίσω στη μάθηση" onPress={close} /></> : <>
              <View style={styles.context}><Text style={styles.contextTitle}>{target.title}</Text>{target.questionText ? <Text style={styles.body}>{target.questionIndex !== null ? `Ερώτηση ${target.questionIndex + 1}: ` : ""}{target.questionText}</Text> : <Text style={styles.body}>Αναφορά για το κείμενο, τις πηγές ή τις εικόνες του μαθήματος.</Text>}</View>
              <Text style={styles.body}>{pending ? "Αυτή η αναφορά φυλάχτηκε σε αναμονή. Θα ξαναστείλουμε την ίδια, χωρίς διπλή καταχώριση." : "Διάλεξε τι παρατήρησες."}</Text>
              <View style={styles.reasons}>{REPORT_REASONS.map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ selected: selected === option.id, disabled: Boolean(pending) || outbox.busy }} disabled={Boolean(pending) || outbox.busy}
                onPress={() => setReason(option.id)} style={[styles.reason, selected === option.id && styles.selected]}><Text style={styles.reasonText}>{selected === option.id ? "● " : "○ "}{option.label}</Text></Pressable>)}</View>
              <Text style={styles.contextTitle}>Τι να κοιτάξουμε; {selected === "other" ? "(απαραίτητο)" : "(προαιρετικό)"}</Text>
              <TextInput accessibilityLabel="Σχόλιο αναφοράς" placeholder="Πες μας τι σε μπέρδεψε ή πρόσθεσε μια πηγή…" placeholderTextColor={colors.textMuted} value={pending?.note ?? note} onChangeText={setNote} multiline maxLength={2000} textAlignVertical="top" editable={!pending && !outbox.busy} style={styles.input} />
              <Text style={styles.small}>{(pending?.note ?? note).length} / 2000 χαρακτήρες</Text>
              <Text style={styles.small}>Στέλνονται το σημείο του περιεχομένου, ο λόγος και το σχόλιό σου. Αν είσαι συνδεδεμένος, η αναφορά συνδέεται με τον λογαριασμό σου. Μην γράψεις κωδικούς ή προσωπικά στοιχεία.</Text>
              {!outbox.ready || outbox.error || message ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message || outbox.error || "Φόρτωση αναφορών…"}</Text> : null}
              {!outbox.ready ? <ActionButton label="Δοκίμασε τη φόρτωση ξανά" onPress={() => void outbox.store.start()} secondary /> : <ActionButton label={outbox.busy ? "Αποστολή…" : pending ? "Ξαναστείλε την αναφορά" : "Στείλε την αναφορά"} disabled={outbox.busy || (!pending && (!reason || (reason === "other" && !note.trim())))} onPress={() => void submit()} />}
            </>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  viewport: { flex: 1 },
  reportLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 10 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.65 },
  linkText: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20 },
  brand: { color: colors.accentLight, fontSize: 18, fontWeight: "900", letterSpacing: 3 },
  close: { minHeight: 48, justifyContent: "center", paddingHorizontal: 8 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", padding: 20, paddingBottom: 44, gap: 16 },
  title: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  small: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  context: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  contextTitle: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "700" },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reason: { flexBasis: "46%", flexGrow: 1, minHeight: 56, justifyContent: "center", padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  reasonText: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  selected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  input: { minHeight: 130, color: colors.text, fontSize: 16, lineHeight: 25, padding: 16, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, backgroundColor: colors.surface },
  notice: { color: colors.accentLight, fontSize: 13, lineHeight: 22 },
});
