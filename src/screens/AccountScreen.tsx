import PlayFeedbackSettings from "../components/PlayFeedbackSettings";
import UsageSharing from "../components/UsageSharing";
import LearningDevTools, { type LearningDevControls } from "../components/LearningDevTools";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
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
  const [activeSection, setActiveSection] = useState<"account" | "experience" | "privacy" | "sync" | "dev" | null>(null);
  const goBack = () => activeSection ? setActiveSection(null) : onBack();
  return <ScrollView scrollEnabled={activeSection !== null} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, activeSection === null && styles.overviewContent]}>
    <AppHeader onBack={goBack} />
    {activeSection === null ? <View testID="account-settings-dashboard">
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>Ο ΧΩΡΟΣ ΣΟΥ</Text>
        <Text style={styles.title}>Ρυθμίσεις</Text>
        <Text style={styles.subtitle}>Διαχειρίσου την εμπειρία σου.</Text>
      </View>
      {([
        ["account", "Λογαριασμός", "Σύνδεση, εγγραφή και αντίγραφα"],
        ["experience", "Εμπειρία μάθησης", "Ήχος και κίνηση"],
        ["privacy", "Δεδομένα και απόρρητο", "Κοινοποίηση και αναφορές"],
        ...(store.userId ? [["sync", "Συγχρονισμός", "Κατάσταση προόδου"]] : []),
        ...(__DEV__ && devControls ? [["dev", "Εργαλεία δοκιμών", "Επιλογές ανάπτυξης"]] : []),
      ] as const).map(([id, title, detail]) => (
        <Pressable key={id} accessibilityRole="button" accessibilityLabel={title}
          style={styles.tile} onPress={() => setActiveSection(id)}>
          <View style={styles.tileCopy}>
            <Text style={styles.tileTitle}>{title}</Text>
            <Text style={styles.tileDetail}>{detail}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View> : <>
      <Text style={styles.eyebrow}>ΡΥΘΜΙΣΕΙΣ</Text>
      {activeSection === "account" ? <AccountPanel backupControls={backupControls} /> : null}
      {activeSection === "experience" ? <PlayFeedbackSettings /> : null}
      {activeSection === "privacy" ? <><UsageSharing /><PendingReportsPanel /></> : null}
      {activeSection === "sync" && store.userId ? <SyncStatus detailed /> : null}
      {activeSection === "dev" && __DEV__ && devControls ? <LearningDevTools {...devControls} /> : null}
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  overviewContent: { flexGrow: 1 },
  heading: { gap: 8, marginTop: 12, marginBottom: 18 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  subtitle: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  section: { marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "800", marginBottom: 2 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23, marginBottom: 16 },
  tile: { minHeight: 76, flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tileCopy: { flex: 1, gap: 5 },
  tileTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  tileDetail: { color: colors.textMuted, fontSize: 12 },
  chevron: { color: colors.accentLight, fontSize: 26 },
});
