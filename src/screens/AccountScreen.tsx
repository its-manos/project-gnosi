import PlayFeedbackSettings from "../components/PlayFeedbackSettings";
import UsageSharing from "../components/UsageSharing";
import LearningDevTools, { type LearningDevControls } from "../components/LearningDevTools";
import QuizTypesPreviewScreen from "./QuizTypesPreviewScreen";
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { useRef, useState } from "react";
import Svg, { Circle, Path } from "react-native-svg";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import NavigationTile from "../components/NavigationTile";
import AccountPanel from "../components/AccountPanel";
import SyncStatus from "../components/SyncStatus";
import PendingReportsPanel from "../components/PendingReportsPanel";
import type { BackupControls } from "../components/CloudBackupPanel";
import { useLearningSession } from "../state/LearningSession";

type SettingsSection = "account" | "experience" | "privacy" | "sync" | "dev";

function SettingIcon({ id, color }: { id: string; color: string }) {
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" accessible={false}>
    {id === "account" ? <>
      <Circle cx={12} cy={8} r={3.3} stroke={color} strokeWidth={1.8} />
      <Path d="M5 20v-1.5c0-3.3 2.7-5.2 7-5.2s7 1.9 7 5.2V20" stroke={color} strokeWidth={1.8} fill="none" />
    </> : id === "experience" ? <Path d="M12 2.5 14.6 9.4 21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-2.6L12 2.5Z" stroke={color} strokeWidth={1.8} fill="none" />
    : id === "privacy" ? <Path d="M12 2.5 20 6v5.5c0 4.8-3.3 8-8 10-4.7-2-8-5.2-8-10V6l8-3.5Zm-3.5 9.5 2.3 2.3 4.8-5" stroke={color} strokeWidth={1.8} fill="none" />
    : id === "sync" ? <Path d="M19 9a7.5 7.5 0 0 0-13-2.5L4 9m0-5v5h5M5 15a7.5 7.5 0 0 0 13 2.5l2-2.5m0 5v-5h-5" stroke={color} strokeWidth={1.8} fill="none" />
    : <><Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8}/><Path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3m0-14-3 3m-8 8-3 3" stroke={color} strokeWidth={1.8}/></>}
  </Svg>;
}

export default function AccountScreen({ onBack, backupControls, devControls, devPreviewOpen = false, onCloseDevPreview }: { onBack: () => void; backupControls?: BackupControls; devControls?: LearningDevControls; devPreviewOpen?: boolean; onCloseDevPreview?: () => void }) {
  // Account identity does not change during background progress synchronization.
  const { store } = useLearningSession();
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const openSection = (section: SettingsSection) => {
    setActiveSection(section);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const goBack = () => {
    if (activeSection) {
      setActiveSection(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } else onBack();
  };
  const sectionTitle = activeSection === "account" ? "Λογαριασμός"
    : activeSection === "experience" ? "Εμπειρία μάθησης"
    : activeSection === "privacy" ? "Δεδομένα και απόρρητο"
    : activeSection === "sync" ? "Συγχρονισμός"
    : activeSection === "dev" ? "Εργαλεία δοκιμών" : "Λογαριασμός";
  // Keep this screen mounted so closing the preview returns to the same dev section.
  if (__DEV__ && devPreviewOpen && onCloseDevPreview) return <QuizTypesPreviewScreen onBack={onCloseDevPreview} />;
  return <View style={styles.screen}><ProgressGradientBackground /><ScrollView ref={scrollRef} style={styles.scroll} scrollEnabled={activeSection !== null || (viewportHeight > 0 && contentHeight > viewportHeight + 1)} onLayout={event => setViewportHeight(Math.round(event.nativeEvent.layout.height))} onContentSizeChange={(_width, height) => setContentHeight(Math.round(height))} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, activeSection === null && styles.overviewContent]}>
    <ProfileSectionHeader
      eyebrow={activeSection ? "ΟΙ ΡΥΘΜΙΣΕΙΣ ΣΟΥ" : "Ο ΧΩΡΟΣ ΣΟΥ"}
      title={sectionTitle}
      actionLabel={activeSection ? "‹ Ρυθμίσεις" : "‹ Προφίλ"}
      actionAccessibilityLabel={activeSection ? "Πίσω στις ρυθμίσεις" : "Πίσω στο προφίλ"}
      onAction={goBack} style={styles.headerSpacing}
    />
    {activeSection === null ? <View testID="account-settings-dashboard">
      {([
        ["account", "Λογαριασμός", "Σύνδεση, εγγραφή και αντίγραφα", "#B7A5FF"],
        ["experience", "Εμπειρία μάθησης", "Ήχος και κίνηση", "#82C4C7"],
        ["privacy", "Δεδομένα και απόρρητο", "Κοινοποίηση και αναφορές", "#D9B77D"],
        ...(store.userId ? [["sync", "Συγχρονισμός", "Κατάσταση προόδου", "#91B7FF"] as const] : []),
        ...(__DEV__ && devControls ? [["dev", "Εργαλεία δοκιμών", "Επιλογές ανάπτυξης", "#B7A5FF"] as const] : []),
      ] as const).map(([id, title, detail, accent]) => (
        <NavigationTile key={id} variant="settings" title={title} subtitle={detail}
          icon={<SettingIcon id={id} color={accent} />} iconBackground={accent + "16"}
          entranceDelay={65 + (id === "account" ? 0 : id === "experience" ? 45 : id === "privacy" ? 90 : id === "sync" ? 135 : 180)}
          onPress={() => openSection(id)} />
      ))}
    </View> : <>
      {activeSection === "account" ? <AccountPanel backupControls={backupControls} /> : null}
      {activeSection === "experience" ? <PlayFeedbackSettings /> : null}
      {activeSection === "privacy" ? <><UsageSharing /><PendingReportsPanel /></> : null}
      {activeSection === "sync" && store.userId ? <SyncStatus detailed /> : null}
      {activeSection === "dev" && __DEV__ && devControls ? <LearningDevTools {...devControls} /> : null}
    </>}
  </ScrollView></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D1827" },
  scroll: { flex: 1 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top, paddingBottom: 20 },
  headerSpacing: { marginBottom: profileSectionLayout.below },
  overviewContent: { flexGrow: 1 },
});
