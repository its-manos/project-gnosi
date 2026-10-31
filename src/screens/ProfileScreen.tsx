import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLearningSession, useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { useAthensDate } from "../hooks/useAthensDate";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import KnowledgeProgress from "../components/KnowledgeProgress";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import { colors } from "../theme";

function ProfileLink({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  return <Pressable style={styles.linkRow} accessibilityRole="button" onPress={onPress}><View style={styles.copy}><Text style={styles.linkTitle}>{title}</Text><Text style={styles.detail}>{detail}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}
export default function ProfileScreen({ onBack, onStats, onAccount, onInterests, onGuide }: { onBack: () => void; onStats: () => void; onAccount: () => void; onInterests: () => void; onGuide: () => void }) {
  const { email } = useLearningSession(), learning = useLearningSnapshot(), daily = useDailySnapshot(), today = useAthensDate();
  const stats = useMemo(() => calculateDailyChallengeProgress(dailyHistory(daily.doc), today), [daily.doc, today]);
  return <ScrollView contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} /><SyncStatus quiet />
    <View style={styles.identity} testID="profile-identity"><View style={styles.avatar} accessible={false}><Text style={styles.glyph}>✦</Text></View><View style={styles.copy}><Text style={styles.title}>Το προφίλ σου</Text><Text style={styles.detail}>{learning.userId ? email ?? "Συνδεδεμένος παίκτης" : "Παίζεις ως επισκέπτης"}</Text></View></View>
    <KnowledgeProgress />
    <View style={styles.metrics} testID="profile-summary">
      <View style={styles.metric}><Text style={styles.value}>{learning.ready ? learning.backup.completedIds.length : "—"}</Text><Text style={styles.detail}>μαθήματα ολοκληρωμένα</Text></View>
      <View style={styles.metric}><Text style={styles.value}>{daily.ready ? stats.currentStreak : "—"}</Text><Text style={styles.detail}>ημέρες σερί στο quiz</Text></View>
    </View>
    <View style={styles.links} testID="profile-links">
      <ProfileLink title="Τα στατιστικά σου" detail="Δραστηριότητα και ιστορικό καθημερινών quiz" onPress={onStats} />
      <ProfileLink title={learning.userId ? "Λογαριασμός και ρυθμίσεις" : "Σύνδεση και ρυθμίσεις"} detail="Συγχρονισμός, αντίγραφα και απόρρητο" onPress={onAccount} />
      <ProfileLink title="Τα ενδιαφέροντά σου" detail="Προτάσεις μαθημάτων για εσένα" onPress={onInterests} />
      <ProfileLink title="Οδηγός εκκίνησης" detail="Γνώρισε ξανά τον κόσμο της Γνώσης" onPress={onGuide} />
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 20, paddingBottom: 40, gap: 16 }, identity: { flexDirection: "row", alignItems: "center", gap: 14 }, avatar: { width: 54, height: 54, borderRadius: 19, backgroundColor: colors.accentSurface, alignItems: "center", justifyContent: "center" }, glyph: { color: colors.accentLight, fontSize: 28 }, copy: { flex: 1, gap: 4 }, title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900" }, detail: { color: colors.textMuted, fontSize: 13, lineHeight: 22, flexShrink: 1 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { flexBasis: "45%", flexGrow: 1, padding: 16, borderRadius: 18, backgroundColor: colors.surface, gap: 6 }, value: { color: colors.accentLight, fontSize: 28, lineHeight: 36, fontWeight: "800" }, links: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, backgroundColor: colors.surface }, linkRow: { minHeight: 76, flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 12 }, linkTitle: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "700" }, arrow: { color: colors.accentLight, fontSize: 28 } });
