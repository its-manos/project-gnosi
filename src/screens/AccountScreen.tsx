import UsageSharing from "../components/UsageSharing";
import LearningDevTools, { type LearningDevControls } from "../components/LearningDevTools";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AccountPanel from "../components/AccountPanel";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import PendingReportsPanel from "../components/PendingReportsPanel";
import type { BackupControls } from "../components/CloudBackupPanel";
import { useLearningSnapshot } from "../state/LearningSession";
import { colors } from "../theme";

export default function AccountScreen({ onBack, backupControls, devControls }: { onBack: () => void; backupControls?: BackupControls; devControls?: LearningDevControls }) {
  const snapshot = useLearningSnapshot();
  return <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} />
    <View style={styles.mark} accessible={false}><Text style={styles.glyph}>✦</Text></View>
    <Text style={styles.title}>Λογαριασμός και ρυθμίσεις</Text>
    <AccountPanel backupControls={backupControls} />
    <PendingReportsPanel />
    <UsageSharing />
    {__DEV__ && devControls ? <LearningDevTools {...devControls} /> : null}
    {snapshot.userId ? <>
      <Text style={styles.title}>Η πρόοδός σου</Text>
      <Text style={styles.body}>Πρόσθεσε την πρόοδο επισκέπτη από την προεπισκόπηση παρακάτω.</Text>
      <SyncStatus detailed />
    </> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  mark: { width: 56, height: 56, borderRadius: 19, backgroundColor: colors.accentSurface, alignItems: "center", justifyContent: "center", marginTop: 4 },
  glyph: { color: colors.accentLight, fontSize: 30 },
  title: { color: colors.text, fontSize: 21, fontWeight: "800", marginVertical: 12 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginBottom: 16 },
});
