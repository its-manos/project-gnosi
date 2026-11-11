import ProgressBar from "./ProgressBar";
import XpRules from "./XpRules";
import { playerTitle } from "../gamification/rules";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { colors } from "../theme";

export default function KnowledgeProgress({ compact = false }: { compact?: boolean }) {
  const { profile: p, ready } = useKnowledgeProfile();
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.card} testID="knowledge-progress">
    <View style={styles.heading}>
      <Text style={styles.label}>ΤΟ ΤΑΞΙΔΙ ΤΗΣ ΓΝΩΣΗΣ</Text>
      <Text style={styles.level}>{ready ? `Επίπεδο ${p.level}` : "Φόρτωση…"}</Text>
    </View>
    {ready ? <Text key={`player-title-${p.level}`} testID="player-title" style={styles.playerTitle} accessibilityLiveRegion="polite">{playerTitle(p.level)}</Text> : null}
    <Text style={styles.value}>{ready ? p.totalXP.toLocaleString("el-GR") : "—"} XP</Text>
    {ready ? <>
      <ProgressBar progress={p.earned / p.required * 100} label={`Πρόοδος επιπέδου: ${p.earned} από ${p.required} XP`} />
      <Text style={styles.body}>{p.remaining} XP μέχρι το επόμενο επίπεδο</Text>
      {!compact ? <>
        <View style={styles.metrics}>
          <Text style={styles.metric}>{p.explored} κατηγορίες εξερευνήθηκαν</Text>
          <Text style={styles.metric}>{p.recalled} έννοιες με διαφορετικές επιτυχημένες δοκιμές</Text>
        </View>
        <Text style={styles.body}>Μαθαίνεις, προχωράς. Θυμάσαι, κατακτάς. Εξερευνάς, κερδίζεις.</Text>
        <View style={styles.badges}>{p.badges.map(b => <View key={b.id} style={[styles.badge, b.unlocked && styles.unlocked]}>
          <Text style={styles.badgeTitle}>{b.unlocked ? "✦ " : ""}{b.title}</Text>
          <Text style={styles.body}>{b.unlocked ? "Κατακτήθηκε" : `${Math.min(b.current, b.target)} / ${b.target}`}</Text>
        </View>)}</View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)} style={styles.button}>
          <Text style={styles.link}>{expanded ? "Λιγότερα −" : "Πώς κερδίζω XP; +"}</Text>
        </Pressable>
        {expanded ? <XpRules learningXP={p.learningXP} challengeXP={p.challengeXP}
          recallXP={p.recallXP} explorationXP={p.explorationXP} gameXP={p.gameXP} /> : null}
      </> : null}
    </> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { alignSelf: "stretch", padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.accentSurface, gap: 10, marginVertical: 12 },
  heading: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  label: { color: colors.textMuted, fontSize: 10, lineHeight: 18, fontWeight: "800" },
  level: { color: colors.accentLight, fontSize: 14, fontWeight: "800" },
  playerTitle: { color: colors.accentLight, fontSize: 20, lineHeight: 28, fontWeight: "800", flexShrink: 1, maxWidth: "100%" },
  value: { color: colors.text, fontSize: 32, fontWeight: "900" },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { color: colors.textBody, fontSize: 12, lineHeight: 20, fontWeight: "700" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { flexBasis: "46%", flexGrow: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 },
  unlocked: { borderColor: colors.accent },
  badgeTitle: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: "700" },
  button: { minHeight: 44, justifyContent: "center" },
  link: { color: colors.accentLight, fontSize: 13, fontWeight: "700" },
});
