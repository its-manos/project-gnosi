import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useBetaAnalytics } from '../state/BetaAnalytics';
import { colors } from '../theme';
export default function UsageSharing() {
  const { analytics, enabled, ready, error } = useBetaAnalytics();
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState(false);
  return <View style={styles.card} testID="usage-sharing">
    <View style={styles.row}>
      <Text style={styles.title}>Βοήθησε να βελτιώσουμε τη ΓΝΩΣΗ</Text>
      <Switch value={enabled} disabled={!ready || busy} accessibilityLabel="Προαιρετική κοινοποίηση στοιχείων χρήσης"
        trackColor={{ false: colors.border, true: colors.accentLight }}
        onValueChange={value => { setBusy(true); void analytics.setEnabled(value).finally(() => setBusy(false)); }} />
    </View>
    <Text style={styles.body}>Προαιρετικά στοιχεία για την πλοήγηση και την πρόοδό σου. Χωρίς όνομα, email ή απαντήσεις.</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} accessibilityLabel="Τι κοινοποιείται στη ΓΝΩΣΗ"
      onPress={() => setDetails(value => !value)} style={styles.details}>
      <Text style={styles.link}>{details ? "Λιγότερα −" : "Τι κοινοποιείται; +"}</Text>
    </Pressable>
    {details ? <Text style={styles.note}>Στέλνουμε στη ΓΝΩΣΗ τις οθόνες και τα μαθήματα που ανοίγεις, πού σταματάς και πότε επιστρέφεις, με έναν τυχαίο κωδικό εγκατάστασης. Η επιλογή αλλάζει από την Πρόοδο. Η απενεργοποίηση σταματά τις νέες αποστολές· δεν διαγράφει όσα έχουν ήδη σταλεί.</Text> : null}
    {error ? <Text style={styles.error} accessibilityLiveRegion="polite">Η επιλογή δεν αποθηκεύτηκε. Δοκίμασε ξανά.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 16, gap: 9, marginVertical: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  body: { color: colors.textBody, fontSize: 12, lineHeight: 19 },
  details: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: colors.accentLight, fontSize: 12, lineHeight: 19 },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 18 },
  error: { color: colors.error, fontSize: 12, lineHeight: 19 },
});
