import PlayFeedbackSettings from "../components/PlayFeedbackSettings";
import UsageSharing from "../components/UsageSharing";
import LearningDevTools, { type LearningDevControls } from "../components/LearningDevTools";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AccountPanel from "../components/AccountPanel";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import PendingReportsPanel from "../components/PendingReportsPanel";
import type { BackupControls } from "../components/CloudBackupPanel";
import { useLearningSession } from "../state/LearningSession";
import { colors } from "../theme";

export default function AccountScreen({ onBack, backupControls, devControls }: { onBack: () => void; backupControls?: BackupControls; devControls?: LearningDevControls }) {
  // Account identity does not change during background progress synchronization.
  const { store } = useLearningSession();
  return <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} />
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>Ο ΧΩΡΟΣ ΣΟΥ</Text>
      <Text style={styles.title}>Λογαριασμός και ρυθμίσεις</Text>
      <Text style={styles.subtitle}>Διαχειρίσου τη σύνδεσή σου, την εμπειρία μάθησης και τα δεδομένα σου.</Text>
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Λογαριασμός</Text>
      <AccountPanel backupControls={backupControls} />
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Εμπειρία μάθησης</Text>
      <PlayFeedbackSettings />
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Δεδομένα και απόρρητο</Text>
      <UsageSharing />
      <PendingReportsPanel />
    </View>
    {__DEV__ && devControls ? <LearningDevTools {...devControls} /> : null}
    {store.userId ? <>
      <Text style={styles.sectionTitle}>Συγχρονισμός προόδου</Text>
      <Text style={styles.body}>Πρόσθεσε την πρόοδο επισκέπτη από την προεπισκόπηση παρακάτω.</Text>
      <SyncStatus detailed />
    </> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  heading: { gap: 8, marginTop: 12, marginBottom: 18 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  subtitle: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  section: { marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "800", marginBottom: 2 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginBottom: 16 },
});
