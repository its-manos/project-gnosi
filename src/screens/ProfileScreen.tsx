import { PLAYER_CLASSES } from "../gamification/trophies";
import PlayerCollection from "../components/PlayerCollection";
import { availableScreenHeight, stableLayoutHeight } from "../utils/screenLayout";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useLearningSession, useDailyDataSnapshot, useLearningDataSnapshot } from "../state/LearningSession";
import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { dailyHistory } from "../utils/dailySyncDocument";
import { calculateDailyChallengeProgress } from "../utils/progressStats";
import { playerTitle } from "../gamification/rules";
import { MotionView } from "../components/HomeMotion";
import AppBackground from "../components/AppBackground";
import AtlasCard from "../components/AtlasCard";
import NavigationTile from "../components/NavigationTile";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
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
  onSaved: () => void;
  onGuide: () => void;
};


function StreakFlame() {
  return <Svg width={17} height={19} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d="M12.5 2.5c.6 3.6-1.4 5.4-3.2 7.4-.4-1.6-.4-2.9-.1-4.2C5.4 8.9 4.5 12 5 15c.6 4.2 3.4 6.5 7 6.5s6.6-2.7 7-6.6c.3-3.2-1.3-6.1-4.2-8.8.2 2.5-.4 3.9-1.3 5.1-.2-3.2-.4-5.6-1-8.7Z"
      stroke="#A9A4FF" strokeWidth={1.6} strokeLinejoin="round" fill="#7068BA" />
    <Path d="M12 13.1c.4 1.7-2.1 3-2.1 4.6a2.1 2.1 0 0 0 4.2 0c0-1.3-.6-2.5-2.1-4.6Z" fill="#D4CAFF" />
  </Svg>;
}

type QuickIconName = "activity" | "saved" | "interests" | "guide";

function QuickIcon({ name }: { name: QuickIconName }) {
  const common = { stroke: "#B8A9F5", strokeWidth: 1.8, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, fill: "none" };
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" accessible={false}>
    {name === "activity" ? <>
      <Circle cx={12} cy={12} r={9} {...common} />
      <Path d="M12 6.5V12l4 2.5" {...common} />
    </> : name === "saved" ? <>
      <Path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z" {...common} />
    </> : name === "interests" ? <>
      <Path d="M12 2.5 14.6 9.4 21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-2.6L12 2.5Z" {...common} />
    </> : <>
      <Path d="M4 5.5h6c1.4 0 2.5.5 3 1.4.5-.9 1.6-1.4 3-1.4h4v13h-4c-1.4 0-2.5.5-3 1.4-.5-.9-1.6-1.4-3-1.4H4v-13Z" {...common} />
      <Path d="M13 7v12.9" {...common} />
    </>}
  </Svg>;
}

function QuickLink({ title, icon, onPress }: {
  title: string; icon: QuickIconName; onPress: () => void;
}) {
  return <NavigationTile title={title} icon={<QuickIcon name={icon} />}
    testID={title === "Δραστηριότητα" ? "profile-activity-link"
      : title === "Αποθηκευμένα" ? "profile-saved-link" : undefined}
    onPress={onPress} />;
}

export default function ProfileScreen({ onStats, onAccount, onInterests, onGuide, onSaved }: Props) {
  const { email } = useLearningSession();
  const learning = useLearningDataSnapshot();
  const daily = useDailyDataSnapshot();
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
  const availableHeight = availableScreenHeight(viewportHeight, windowHeight);
  const dense = availableHeight < 700;
  const veryDense = availableHeight < 585;
  const compact = width < 365;
  // A normal phone uses a screen-fitting dashboard. Allow real scrolling only
  // when the available safe-area viewport or accessibility text requires it.
  const canScroll = availableHeight < 525 || fontScale >= 1.35 ||
    (viewportHeight > 0 && contentHeight > viewportHeight + 1);
  const progress = profileReady
    ? Math.max(0, Math.min(1, profile.earned / Math.max(1, profile.required))) : 0;
  const nextClass = PLAYER_CLASSES.find(item => item.level > profile.level);
  const identity = learning.userId ? email ?? "Συνδεδεμένος παίκτης" : "Παίζεις ως επισκέπτης";

  return <View style={styles.screen} testID="profile-screen"
    onLayout={event => {
      const next = event.nativeEvent.layout.height;
      if (next > 0) setViewportHeight(old => stableLayoutHeight(old, next));
    }}>
    <AppBackground />
    <ScrollView style={styles.viewport} bounces={false} overScrollMode="never"
      showsVerticalScrollIndicator={false} scrollEnabled={canScroll}
      contentContainerStyle={[styles.content, dense && styles.contentDense,
        veryDense && styles.contentVeryDense]}
      onContentSizeChange={(_, next) => {
        setContentHeight(old => stableLayoutHeight(old, next));
      }}>
      <MotionView entranceDelay={0}>
        <ProfileSectionHeader title="Το προφίλ σου"
          actionLabel="Ρυθμίσεις ›" actionAccessibilityLabel="Λογαριασμός και ρυθμίσεις"
          onAction={onAccount} />
      </MotionView>
      <SyncStatus quiet />

      <AtlasCard entranceDelay={65} style={[styles.hero, dense && styles.heroDense]}
        testID="profile-identity">
        <View pointerEvents="none" style={styles.heroAccent} />
        <PlayerCollection mode="classes" trophies={profile.trophies} ready={profileReady} level={profile.level} dense={dense} />
        <View style={styles.heroCopy}>
          <Text style={styles.playerTitle} testID="player-title" numberOfLines={1}
            adjustsFontSizeToFit>{profileReady ? playerTitle(profile.level) : "Ο παίκτης"}</Text>
          <Text style={styles.levelLabel}>{profileReady ? `Επίπεδο ${profile.level} · ${profile.totalXP.toLocaleString("el-GR")} XP` : "—"}</Text>
          <Text style={styles.identity} numberOfLines={1}>{identity}</Text>
          <View style={styles.xpCaptionRow}>
            <Text style={styles.xpCaption}>{profileReady ? `${profile.earned} / ${profile.required} XP` : "—"}</Text>
            <Text style={styles.xpCaption}>→ {profileReady ? profile.level + 1 : "—"}</Text>
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
      </AtlasCard>
      {xpExpanded ? <View style={styles.xpPanel} testID="profile-xp-rules">
        <XpRules learningXP={profile.learningXP} challengeXP={profile.challengeXP}
          recallXP={profile.recallXP} explorationXP={profile.explorationXP} gameXP={profile.gameXP} />
      </View> : null}

      <MotionView entranceDelay={115} style={styles.summaryStrip} testID="profile-summary">
        <View style={styles.metricLabelRow}><StreakFlame /><Text style={styles.summaryText}>
          {daily.ready ? `${quizStats.currentStreak} ${quizStats.currentStreak === 1 ? "ημέρα" : "ημέρες"} σερί` : "—"}
        </Text></View>
        <Text style={styles.summaryText}>{profileReady ? nextClass
          ? `Νέα κλάση στο επίπεδο ${nextClass.level}` : "Τελική κλάση · Σοφός" : "—"}</Text>
      </MotionView>

      <MotionView entranceDelay={160}>
        <PlayerCollection trophies={profile.trophies} ready={profileReady} level={profile.level} dense={dense} />
      </MotionView>

      <MotionView entranceDelay={205} style={styles.actions} testID="profile-links">
        <Text style={styles.sectionTitle}>Ο χώρος σου</Text>
        <View style={[styles.linksGrid, compact && styles.linksGridCompact]}>
          <QuickLink title="Δραστηριότητα"
            icon="activity" onPress={onStats} />
          <QuickLink title="Αποθηκευμένα"
            icon="saved" onPress={onSaved} />
          <QuickLink title="Ενδιαφέροντα"
            icon="interests" onPress={onInterests} />
          <QuickLink title="Οδηγός"
            icon="guide" onPress={onGuide} />
        </View>
      </MotionView>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, width: "100%", maxWidth: 720,
    alignSelf: "center", backgroundColor: "#0D1827", overflow: "hidden" },
  viewport: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top, paddingBottom: 14, gap: profileSectionLayout.below },
  contentDense: { paddingBottom: 9, gap: 9 },
  contentVeryDense: { gap: 6 },
  hero: { minHeight: 158, flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 15 },
  heroDense: { minHeight: 144, paddingVertical: 10, gap: 9 },
  heroAccent: { position: "absolute", left: 22, top: -1, width: 88, height: 3,
    backgroundColor: "#B2A3FF", borderRadius: 3 },
  heroCopy: { flex: 1, minWidth: 0, gap: 3 },
  playerTitle: { color: colors.text, fontSize: 19, lineHeight: 25, fontWeight: "900" },
  levelLabel: { color: "#D4C8FF", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  identity: { color: "#C6C6D8", fontSize: 11, lineHeight: 17 },
  xpCaptionRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 5 },
  xpCaption: { color: "#C8BDFF", fontSize: 10, lineHeight: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  xpTrack: { height: 6, borderRadius: 6, backgroundColor: "#3D3D5C", overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 6, backgroundColor: "#B1A5FF" },
  xpHelp: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  xpHelpText: { color: "#C6B9FF", fontSize: 10, lineHeight: 16, fontWeight: "800" },
  xpPanel: { padding: 15, borderRadius: 17, borderColor: "#45415F", borderWidth: 1,
    backgroundColor: "#1B2234" },
  summaryStrip: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 6 },
  summaryText: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "900" },
  actions: { gap: 8 },
  linksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linksGridCompact: { gap: 6 },
});
