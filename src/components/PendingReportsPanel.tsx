import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useReportOutbox } from "../hooks/useReportOutbox";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

export default function PendingReportsPanel() {
  const outbox = useReportOutbox(), [sent, setSent] = useState(false);
  if (!outbox.items.length && !outbox.error && !sent) return null;
  return <View style={styles.card}>
    <Text style={styles.title}>Αναφορές σε αναμονή ({outbox.items.length})</Text>
    <Text style={styles.body}>Αφορούν τον τωρινό λογαριασμό ή τον επισκέπτη που χρησιμοποιείς. Θα σταλούν μόνο όταν πατήσεις αποστολή.</Text>
    {outbox.items.map(report => <Text key={report.id} style={styles.body}>• {report.target.title}{report.target.questionIndex !== null ? ` · Ερώτηση ${report.target.questionIndex + 1}` : ""}</Text>)}
    {sent && !outbox.items.length ? <Text style={styles.body} accessibilityLiveRegion="polite">Όλες οι αναφορές παραδόθηκαν. Ευχαριστούμε!</Text> : null}
    {outbox.error ? <Text style={styles.body} accessibilityLiveRegion="polite">{outbox.error}</Text> : null}
    {outbox.items.length || !outbox.ready ? <ActionButton secondary label={outbox.busy ? "Αποστολή…" : outbox.ready ? "Στείλε τις αναφορές σε αναμονή" : "Δοκίμασε τη φόρτωση ξανά"} disabled={outbox.busy} onPress={() => { if (outbox.ready) void outbox.store.retry().then(setSent); else void outbox.store.start(); }} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 12, marginVertical: 16, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 22 },
});
