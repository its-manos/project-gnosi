import PlayFeedbackSettings from "../components/PlayFeedbackSettings";
import UsageSharing from "../components/UsageSharing";
import LearningDevTools, { type LearningDevControls } from "../components/LearningDevTools";
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { useRef, useState } from "react";
import Svg, { Circle, Path } from "react-native-svg";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import { MotionPressable } from "../components/HomeMotion";
import AccountPanel from "../components/AccountPanel";
import SyncStatus from "../components/SyncStatus";
import PendingReportsPanel from "../components/PendingReportsPanel";
import type { BackupControls } from "../components/CloudBackupPanel";
import { useLearningSession } from "../state/LearningSession";
import { colors } from "../theme";

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

export default function AccountScreen({ onBack, backupControls, devControls }: { onBack: () => void; backupControls?: BackupControls; devControls?: LearningDevControls }) {
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
  return <View style={styles.screen}><ProgressGradientBackground /><ScrollView ref={scrollRef} style={styles.scroll} scrollEnabled={activeSection !== null || (viewportHeight > 0 && contentHeight > viewportHeight + 1)} onLayout={event => setViewportHeight(Math.round(event.nativeEvent.layout.height))} onContentSizeChange={(_width, height) => setContentHeight(Math.round(height))} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, activeSection === null && styles.overviewContent]}>
    <View style={styles.top}>
      <View style={styles.topCopy}>
        <Text style={styles.eyebrow}>{activeSection ? "ΟΙ ΡΥΘΜΙΣΕΙΣ ΣΟΥ" : "Ο ΧΩΡΟΣ ΣΟΥ"}</Text>
        <Text style={styles.topTitle}>{sectionTitle}</Text>
      </View>
      <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel={activeSection ? "Πίσω στις ρυθμίσεις" : "Πίσω στο προφίλ"} style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
        <Text style={styles.backText}>‹ {activeSection ? "Ρυθμίσεις" : "Προφίλ"}</Text>
      </Pressable>
    </View>
    {activeSection === null ? <View testID="account-settings-dashboard">
      {([
        ["account", "Λογαριασμός", "Σύνδεση, εγγραφή και αντίγραφα", "#B7A5FF"],
        ["experience", "Εμπειρία μάθησης", "Ήχος και κίνηση", "#82C4C7"],
        ["privacy", "Δεδομένα και απόρρητο", "Κοινοποίηση και αναφορές", "#D9B77D"],
        ...(store.userId ? [["sync", "Συγχρονισμός", "Κατάσταση προόδου", "#91B7FF"] as const] : []),
        ...(__DEV__ && devControls ? [["dev", "Εργαλεία δοκιμών", "Επιλογές ανάπτυξης", "#B7A5FF"] as const] : []),
      ] as const).map(([id, title, detail, accent]) => (
        <MotionPressable key={id} entranceDelay={65 + (id === "account" ? 0 : id === "experience" ? 45 : id === "privacy" ? 90 : id === "sync" ? 135 : 180)} pressScale={0.983} accessibilityRole="button" accessibilityLabel={title}
          style={styles.tile} onPress={() => openSection(id)}>
          <View style={[styles.iconShell, { backgroundColor: accent + "16" }]}><SettingIcon id={id} color={accent} /></View>
          <View style={styles.tileCopy}>
            <Text style={styles.tileTitle}>{title}</Text>
            <Text style={styles.tileDetail}>{detail}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </MotionPressable>
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
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  top: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 13 },
  topCopy: { flex: 1, gap: 1 },
  topTitle: { color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: "900" },
  backButton: { minHeight: 44, paddingHorizontal: 11, borderRadius: 13, justifyContent: "center", backgroundColor: "#1D2538", borderColor: "#3D405C", borderWidth: 1 },
  backPressed: { backgroundColor: "#2D304A" },
  backText: { color: "#C2B4FF", fontSize: 12, fontWeight: "800" },
  overviewContent: { flexGrow: 1 },
  eyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  tile: { minHeight: 75, flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 9, borderRadius: 17, borderWidth: 1, borderColor: "#38435C", backgroundColor: "#1A2538" },
  iconShell: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 13 },
  tileCopy: { flex: 1, gap: 5 },
  tileTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  tileDetail: { color: colors.textMuted, fontSize: 12 },
  chevron: { color: colors.accentLight, fontSize: 26 },
});
