import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useLearningSession, useDailySnapshot, useLearningSnapshot } from "../state/LearningSession";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { playerTitle } from "../gamification/rules";
import { MotionView, MotionXpCircle } from "../components/HomeMotion";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import SyncStatus from "../components/SyncStatus";
import XpRules from "../components/XpRules";
import { colors } from "../theme";

type Props = {
  // Retained for compatibility with the earlier secondary-screen route;
  // Profile is now also directly accessible as a bottom-tab destination.
  onBack: () => void;
  onStats: () => void;
  onAccount: () => void;
  onInterests: () => void;
  onGuide: () => void;
};

const XP_RING_LENGTH = 2 * Math.PI * 38;
const badgeGlyphs: Record<string, string> = {
  first: "✦",
  curious: "◇",
  explorer: "✧",
  recall: "◈",
};

function QuickLink({ title, subtitle, symbol, onPress }: {
  title: string; subtitle: string; symbol: string; onPress: () => void;
}) {
  return <Pressable testID={title === "Δραστηριότητα" ? "profile-activity-link" : undefined}
    style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}
    accessibilityRole="button" accessibilityLabel={title + ". " + subtitle} onPress={onPress}>
    <Text style={styles.quickSymbol} accessible={false}>{symbol}</Text>
    <View style={styles.quickCopy}>
      <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      <Text style={styles.quickSubtitle} numberOfLines={1}>{subtitle}</Text>
    </View>
    <Text style={styles.quickArrow} accessible={false}>›</Text>
  </Pressable>;
}

export default function ProfileScreen({ onStats, onAccount, onInterests, onGuide }: Props) {
  const { email } = useLearningSession();
  const learning = useLearningSnapshot();
  const daily = useDailySnapshot();
  // useKnowledgeProfile already subscribes to the Athens day boundary.
  // Avoid another AppState listener and minute interval on this screen.
  const today = getAthensDateKey();
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const quizStats = useMemo(
    () => calculateDailyChallengeProgress(dailyHistory(daily.doc), today),
    [daily.doc, today],
  );
  const { height: windowHeight, width, fontScale } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [xpExpanded, setXpExpanded] = useState(false);
  const availableHeight = viewportHeight || windowHeight - 130;
  const dense = availableHeight < 700;
  const veryDense = availableHeight < 585;
  const compact = width < 365;
  // A normal phone uses a screen-fitting dashboard. Allow real scrolling only
  // when the available safe-area viewport or accessibility text requires it.
  const canScroll = availableHeight < 525 || fontScale >= 1.35 ||
    (viewportHeight > 0 && contentHeight > viewportHeight + 1);
  const progress = profileReady
    ? Math.max(0, Math.min(1, profile.earned / Math.max(1, profile.required))) : 0;
  const earnedBadgeCount = profileReady ? profile.badges.filter(b => b.unlocked).length : null;
  const identity = learning.userId ? email ?? "Συνδεδεμένος παίκτης" : "Παίζεις ως επισκέπτης";

  return <View style={styles.screen} testID="profile-screen"
    onLayout={event => {
      const next = event.nativeEvent.layout.height;
      if (next > 0) setViewportHeight(old => Math.abs(old - next) < 1 ? old : next);
    }}>
    <ProgressGradientBackground />
    <ScrollView style={styles.viewport} bounces={false} overScrollMode="never"
      showsVerticalScrollIndicator={false} scrollEnabled={canScroll}
      contentContainerStyle={[styles.content, dense && styles.contentDense,
        veryDense && styles.contentVeryDense]}
      onContentSizeChange={(_, next) => {
        setContentHeight(old => Math.abs(old - next) < 1 ? old : next);
      }}>
      <SyncStatus quiet />
      <MotionView entranceDelay={0} style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>Η ΤΑΥΤΟΤΗΤΑ ΣΟΥ</Text>
          <Text style={[styles.heading, veryDense && styles.headingSmall]}>Το προφίλ σου</Text>
        </View>
        <Pressable onPress={onAccount} accessibilityRole="button"
          accessibilityLabel="Λογαριασμός και ρυθμίσεις"
          style={({ pressed }) => [styles.settingsButton, pressed && styles.quickLinkPressed]}>
          <Text style={styles.settingsText}>Ρυθμίσεις ›</Text>
        </Pressable>
      </MotionView>

      <MotionView entranceDelay={65} style={[styles.hero, dense && styles.heroDense]}
        testID="profile-identity">
        <View pointerEvents="none" style={styles.heroAccent} />
        <View style={[styles.avatar, dense && styles.avatarDense]} accessible={false}>
          <Text style={styles.avatarGlyph}>✦</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.playerTitle} testID="player-title" numberOfLines={1}
            adjustsFontSizeToFit>{profileReady ? playerTitle(profile.level) : "Ο παίκτης"}</Text>
          <Text style={styles.identity} numberOfLines={1}>{identity}</Text>
          <View style={styles.xpCaptionRow}>
            <Text style={styles.xpCaption}>{profileReady ? profile.totalXP.toLocaleString("el-GR") + " XP συνολικά" : "Φόρτωση XP…"}</Text>
            <Text style={styles.xpCaption}>{profileReady ? profile.earned + " / " + profile.required : "—"}</Text>
          </View>
          <View style={styles.xpTrack} accessible accessibilityRole="progressbar"
            accessibilityLabel="Πρόοδος στο επόμενο επίπεδο"
            accessibilityValue={profileReady
              ? { min: 0, max: profile.required, now: profile.earned }
              : { text: "Φόρτωση" }}>
            <View style={[styles.xpFill, { width: (progress * 100) + "%" }]} />
          </View>
          <Pressable onPress={() => setXpExpanded(value => !value)}
            disabled={!profileReady} accessibilityRole="button"
            accessibilityLabel="Πώς κερδίζω XP;"
            accessibilityState={{ expanded: xpExpanded, disabled: !profileReady }}
            style={styles.xpHelp}>
            <Text style={styles.xpHelpText}>{xpExpanded ? "Λιγότερα −" : "Πώς κερδίζω XP; +"}</Text>
          </Pressable>
        </View>
        <View style={[styles.levelRing, dense && styles.levelRingDense]} accessible
          accessibilityLabel={profileReady ? "Επίπεδο " + profile.level : "Φόρτωση επιπέδου"}>
          <Svg viewBox="0 0 96 96" width="100%" height="100%" pointerEvents="none">
            <Circle cx={48} cy={48} r={38} stroke="#3D405A" strokeWidth={6} fill="none" />
            {profileReady && progress > 0 ? <MotionXpCircle
              cx={48} cy={48} r={38} fill="none" stroke={colors.accentLight}
              strokeWidth={6} strokeLinecap="round"
              transform="rotate(-90 48 48)" circumference={XP_RING_LENGTH}
              progress={progress} strokeDasharray={`${XP_RING_LENGTH * progress} ${XP_RING_LENGTH}`} /> : null}
          </Svg>
          <View pointerEvents="none" style={styles.levelCenter}>
            <Text style={styles.levelCaption}>ΕΠ.</Text>
            <Text style={styles.levelValue}>{profileReady ? profile.level : "—"}</Text>
          </View>
        </View>
      </MotionView>
      {xpExpanded ? <View style={styles.xpPanel} testID="profile-xp-rules">
        <XpRules learningXP={profile.learningXP} challengeXP={profile.challengeXP}
          recallXP={profile.recallXP} explorationXP={profile.explorationXP} />
      </View> : null}

      <MotionView entranceDelay={115} style={styles.metrics} testID="profile-summary">
        <View style={[styles.metric, dense && styles.metricDense]}>
          <Text style={styles.metricEyebrow}>◇  ΣΕΡΙ QUIZ</Text>
          <Text style={styles.metricValue}>{daily.ready ? quizStats.currentStreak : "—"}
            <Text style={styles.metricUnit}> ημέρες</Text>
          </Text>
        </View>
        <View style={[styles.metric, styles.badgeMetric, dense && styles.metricDense]}>
          <Text style={[styles.metricEyebrow, styles.gold]}>✦  ΔΙΑΚΡΙΣΕΙΣ</Text>
          <Text style={styles.metricValue}>{earnedBadgeCount ?? "—"}
            <Text style={styles.metricUnit}> / {profile.badges.length}</Text>
          </Text>
        </View>
      </MotionView>

      <MotionView entranceDelay={160} style={styles.achievements} testID="profile-achievements">
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Οι διακρίσεις σου</Text>
          <Text style={styles.sectionHint}>Κερδίζονται με τη μάθηση</Text>
        </View>
        <View style={styles.badgeRow}>
          {profile.badges.map(badge => <View key={badge.id}
            style={[styles.badge, dense && styles.badgeDense,
              !badge.unlocked && styles.badgeLocked]}>
            <Text style={[styles.badgeSymbol, !badge.unlocked && styles.badgeSymbolLocked]}
              accessible={false}>{badgeGlyphs[badge.id] ?? "✦"}</Text>
            <Text style={styles.badgeName} numberOfLines={2}>{badge.title}</Text>
            <Text style={styles.badgeProgress}>{profileReady
              ? badge.unlocked ? "✓" : Math.min(badge.current, badge.target) + "/" + badge.target
              : "—"}</Text>
          </View>)}
        </View>
      </MotionView>

      <MotionView entranceDelay={205} style={styles.actions} testID="profile-links">
        <Text style={styles.sectionTitle}>Ο χώρος σου</Text>
        <View style={[styles.linksGrid, compact && styles.linksGridCompact]}>
          <QuickLink title="Δραστηριότητα" subtitle="Στατιστικά & ημερήσια quiz"
            symbol="◷" onPress={onStats} />
          <QuickLink title="Λογαριασμός" subtitle="Ασφάλεια & συγχρονισμός"
            symbol="⚙" onPress={onAccount} />
          <QuickLink title="Ενδιαφέροντα" subtitle="Προσωπικές προτιμήσεις"
            symbol="✧" onPress={onInterests} />
          <QuickLink title="Οδηγός" subtitle="Γνώρισε ξανά τη Γνώση"
            symbol="⌁" onPress={onGuide} />
        </View>
      </MotionView>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, width: "100%", maxWidth: 720,
    alignSelf: "center", backgroundColor: "#0D1827", overflow: "hidden" },
  viewport: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, gap: 13 },
  contentDense: { paddingTop: 6, paddingBottom: 9, gap: 9 },
  contentVeryDense: { gap: 6 },
  top: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  topCopy: { flex: 1, minWidth: 0, gap: 1 },
  eyebrow: { color: "#AD9FEB", fontSize: 10, lineHeight: 15, letterSpacing: 1.1, fontWeight: "900" },
  heading: { color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: "900" },
  headingSmall: { fontSize: 21, lineHeight: 27 },
  settingsButton: { minHeight: 44, paddingHorizontal: 11, borderRadius: 13, justifyContent: "center",
    backgroundColor: "#1D2538", borderColor: "#3D405C", borderWidth: 1 },
  settingsText: { color: "#C2B4FF", fontSize: 12, fontWeight: "800" },
  hero: { minHeight: 154, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 15, borderRadius: 22, overflow: "hidden",
    backgroundColor: "#20243C", borderColor: "#555078", borderWidth: 1 },
  heroDense: { minHeight: 124, paddingVertical: 10, gap: 9 },
  heroAccent: { position: "absolute", left: 22, top: -1, width: 88, height: 3,
    backgroundColor: "#B2A3FF", borderRadius: 3 },
  avatar: { width: 52, height: 52, borderRadius: 17, borderColor: "#62598A", borderWidth: 1,
    backgroundColor: "#373455", alignItems: "center", justifyContent: "center" },
  avatarDense: { width: 42, height: 42, borderRadius: 14 },
  avatarGlyph: { color: "#D4C9FF", fontSize: 26 },
  heroCopy: { flex: 1, minWidth: 0, gap: 6 },
  playerTitle: { color: colors.text, fontSize: 19, lineHeight: 25, fontWeight: "900" },
  identity: { color: "#C6C6D8", fontSize: 11, lineHeight: 17 },
  xpCaptionRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 3 },
  xpCaption: { color: "#C8BDFF", fontSize: 10, lineHeight: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  xpTrack: { height: 6, borderRadius: 6, backgroundColor: "#3D3D5C", overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 6, backgroundColor: "#B1A5FF" },
  xpHelp: { alignSelf: "flex-start", minHeight: 24, justifyContent: "center" },
  xpHelpText: { color: "#C6B9FF", fontSize: 10, lineHeight: 16, fontWeight: "800" },
  xpPanel: { padding: 15, borderRadius: 17, borderColor: "#45415F", borderWidth: 1,
    backgroundColor: "#1B2234" },
  levelRing: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  levelRingDense: { width: 68, height: 68 },
  levelCenter: { position: "absolute", alignItems: "center" },
  levelCaption: { color: "#AAA4D2", fontSize: 9, fontWeight: "900" },
  levelValue: { color: colors.text, fontSize: 24, lineHeight: 28, fontWeight: "900", fontVariant: ["tabular-nums"] },
  metrics: { flexDirection: "row", gap: 9 },
  metric: { flex: 1, minWidth: 0, minHeight: 85, paddingHorizontal: 14, paddingVertical: 11,
    justifyContent: "space-between", borderRadius: 18, backgroundColor: "#192A3B",
    borderColor: "#3A5360", borderWidth: 1 },
  metricDense: { minHeight: 70, paddingVertical: 8 },
  badgeMetric: { backgroundColor: "#25263B", borderColor: "#53475E" },
  metricEyebrow: { color: "#9DC7D0", fontSize: 10, lineHeight: 16,
    fontWeight: "900", letterSpacing: 0.5 },
  gold: { color: "#DBC495" },
  metricValue: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: "900",
    fontVariant: ["tabular-nums"] },
  metricUnit: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  achievements: { gap: 8 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "900" },
  sectionHint: { color: colors.textMuted, fontSize: 10, lineHeight: 15, flexShrink: 1 },
  badgeRow: { flexDirection: "row", gap: 7 },
  badge: { flex: 1, minWidth: 0, minHeight: 96, paddingHorizontal: 5, paddingVertical: 7,
    alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 14,
    backgroundColor: "#272B43", borderWidth: 1, borderColor: "#595176" },
  badgeDense: { minHeight: 80, paddingVertical: 4 },
  badgeLocked: { backgroundColor: "#1C2535", borderColor: "#384052" },
  badgeSymbol: { color: "#CFC1FF", fontSize: 23, lineHeight: 28 },
  badgeSymbolLocked: { color: "#757C97" },
  badgeName: { color: colors.textBody, fontSize: 10, lineHeight: 13, fontWeight: "700",
    textAlign: "center" },
  badgeProgress: { color: "#B9AAFF", fontSize: 10, fontWeight: "900", fontVariant: ["tabular-nums"] },
  actions: { gap: 8 },
  linksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linksGridCompact: { gap: 6 },
  quickLink: { width: "48.5%", flexGrow: 1, minHeight: 58, paddingHorizontal: 9,
    flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#38435C",
    borderRadius: 15, backgroundColor: "#1A2538" },
  quickLinkPressed: { backgroundColor: "#2D304A" },
  quickSymbol: { color: "#BCB0F3", fontSize: 19, width: 19, textAlign: "center" },
  quickCopy: { flex: 1, minWidth: 0, gap: 2 },
  quickTitle: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  quickSubtitle: { color: colors.textMuted, fontSize: 9, lineHeight: 14 },
  quickArrow: { color: "#ACA0E7", fontSize: 19 },
});
