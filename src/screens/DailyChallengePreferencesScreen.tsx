import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ActionButton from "../components/ActionButton";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
import AtlasCard from "../components/AtlasCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import { MotionView, MotionPressable } from "../components/HomeMotion";
import {
  DAILY_CHALLENGE_TOPICS,
  type DailyChallengePreferences,
} from "../data/dailyChallengeTopics";
import { colors } from "../theme";

type Props = {
  initialPreferences: DailyChallengePreferences;
  isLoading: boolean;
  onSave: (preferences: DailyChallengePreferences) => Promise<boolean>;
  onCancel: () => void;
};

export default function DailyChallengePreferencesScreen({
  initialPreferences,
  isLoading,
  onSave,
  onCancel,
}: Props) {
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 780 || fontScale > 1.1;
  const veryCompact = height < 690;
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const needsScroll = viewportHeight > 0 && contentHeight > viewportHeight + 1;
  const [topicIds, setTopicIds] = useState<string[]>(initialPreferences.topicIds);
  const difficulty = initialPreferences.difficulty;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [savedTopicIds, setSavedTopicIds] = useState<string[]>(initialPreferences.topicIds);
  const hasChanges = topicIds.length !== savedTopicIds.length || topicIds.some(id => !savedTopicIds.includes(id));


  function toggleTopic(topicId: string) {
    setSaveError(false);
    setSaveConfirmed(false);
    setTopicIds((current) => {
      if (current.includes(topicId)) {
        return current.length > 3 ? current.filter((id) => id !== topicId) : current;
      }
      return current.length < 5 ? [...current, topicId] : current;
    });
  }

  async function handleSave() {
    if (topicIds.length < 3 || topicIds.length > 5 || isSaving || isLoading) return;
    setIsSaving(true);
    setSaveError(false);
    setSaveConfirmed(false);
    try {
      const saved = await onSave({ topicIds, difficulty });
      if (!saved) setSaveError(true);
      else {
        setSavedTopicIds([...topicIds]);
        setSaveConfirmed(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}><ProgressGradientBackground /><ScrollView style={styles.scroll} onLayout={event => setViewportHeight(Math.round(event.nativeEvent.layout.height))} onContentSizeChange={(_width, nextHeight) => setContentHeight(Math.round(nextHeight))} scrollEnabled={needsScroll || veryCompact || fontScale > 1.2 || isLoading || saveError} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <ProfileSectionHeader title="Ενδιαφέροντα"
        actionLabel="‹ Προφίλ" actionAccessibilityLabel="Πίσω στο προφίλ"
        onAction={onCancel} style={styles.headerSpacing} />
      <AtlasCard entranceDelay={0} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroEyebrow}>✦  ΟΙ ΕΠΙΛΟΓΕΣ ΣΟΥ</Text>
        <Text style={styles.heroTitle}>Τι σε συναρπάζει;</Text>
      </AtlasCard>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLight} size="large" />
          <Text style={styles.helper}>Φόρτωση προτιμήσεων…</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Τα ενδιαφέροντά σου</Text>
            <Text style={styles.counter}>{topicIds.length} / 5</Text>
          </View>

          <View style={[styles.topicGrid, compact && styles.topicGridCompact]}>
            {DAILY_CHALLENGE_TOPICS.map((topic) => {
              const selected = topicIds.includes(topic.id);
              const disabled = !selected && topicIds.length >= 5;
              return (
                <MotionPressable
                  key={topic.id}
                  entranceDelay={55 + DAILY_CHALLENGE_TOPICS.indexOf(topic) * 32}
                  pressScale={0.975}
                  style={[styles.topicCard, compact && styles.topicCardCompact, selected && styles.topicCardSelected, selected && styles.topicCardGlow, disabled && styles.topicCardDisabled]}
                  onPress={() => toggleTopic(topic.id)}
                  disabled={disabled || isSaving}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: disabled || isSaving }}
                  accessibilityLabel={`${topic.title}. ${topic.description}`}
                >
                  {selected ? <View pointerEvents="none" style={styles.selectionAccent} /> : null}
                  <View style={styles.topicTopRow}>
                    <Text style={[styles.topicEmoji, compact && styles.topicEmojiCompact]}>{topic.emoji}</Text>
                    <View style={[styles.checkmark, selected && styles.checkmarkSelected]}>
                      {selected ? <Text style={styles.checkmarkText}>✓</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                </MotionPressable>
              );
            })}
          </View>
          <Text style={styles.helper}>Διάλεξε 3–5 θέματα για το Γρήγορο Κουίζ και τις προτάσεις μαθημάτων. Η καθημερινή πρόκληση παραμένει ίδια για όλους.</Text>

          {saveError ? (
            <Text style={styles.errorText}>Δεν αποθηκεύτηκαν οι αλλαγές. Έλεγξε τον διαθέσιμο χώρο στη συσκευή και δοκίμασε ξανά.</Text>
          ) : null}

          {saveConfirmed && !hasChanges ? <MotionView entranceDelay={0} style={styles.savedNotice} accessibilityLiveRegion="polite"><Text style={styles.savedNoticeText}>✓  Οι αλλαγές αποθηκεύτηκαν</Text></MotionView> : null}
          <ActionButton
            label={isSaving ? "Αποθήκευση…" : hasChanges ? "Αποθήκευση αλλαγών" : "Οι επιλογές σου αποθηκεύτηκαν"}
            onPress={() => { void handleSave(); }}
            disabled={isSaving || isLoading || !hasChanges || topicIds.length < 3 || topicIds.length > 5}
          />

        </>
      )}
    </ScrollView></View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D1827" },
  savedNotice: { alignItems: "center", marginBottom: 5 },
  savedNoticeText: { color: "#B8E1D5", fontSize: 12, fontWeight: "800" },
  scroll: { flex: 1 },
  contentCompact: { paddingBottom: 8 },
  heroCompact: { padding: 12, gap: 3, marginBottom: 8 },
  heroBodyCompact: { lineHeight: 16 },
  topicGridCompact: { gap: 6, marginBottom: 8 },
  topicCardCompact: { minHeight: 66, padding: 8 },
  topicEmojiCompact: { fontSize: 19 },
  headerSpacing: { marginBottom: profileSectionLayout.below },
  hero: { padding: 16, gap: 6, marginBottom: 13 },
  heroAccent: { position: "absolute", top: 0, left: 20, width: 86, height: 3, backgroundColor: "#B2A3FF", borderRadius: 3 },
  heroEyebrow: { color: "#B2A3FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: "900" },
  heroBody: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: profileSectionLayout.horizontal, paddingTop: profileSectionLayout.top, paddingBottom: 20 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 10 },
  title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: "900", marginBottom: 12 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 4, marginBottom: 5 },
  counter: { color: colors.accentLight, fontSize: 12, fontWeight: "900" },
  helper: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  topicCard: { flexBasis: "46%", minHeight: 80, flexGrow: 1, backgroundColor: "#1A2538", borderColor: "#38435C", borderWidth: 1, borderRadius: 15, padding: 10 },
  topicCardSelected: { backgroundColor: "#2A2948", borderColor: "#B2A3FF", borderWidth: 1.5 },
  topicCardGlow: { shadowColor: "#A99AFF", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  selectionAccent: { position: "absolute", top: 0, left: 14, width: 42, height: 2, backgroundColor: "#B2A3FF", borderRadius: 2 },
  topicCardDisabled: { opacity: 0.45 },
  topicTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  topicEmoji: { fontSize: 23 },
  checkmark: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  checkmarkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmarkText: { color: colors.background, fontSize: 12, fontWeight: "900" },
  topicTitle: { color: colors.text, fontSize: 13, fontWeight: "900", marginBottom: 5 },
  topicDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  difficultyList: { gap: 9, marginBottom: 16 },
  difficultyOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 15, padding: 15, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 15 },
  difficultyOptionSelected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  difficultyCopy: { flex: 1, gap: 4 },
  difficultyTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  radioOuter: { width: 21, height: 21, borderWidth: 1.5, borderColor: colors.textMuted, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: colors.accentLight },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accentLight },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 12 },
  footerNote: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 16 },
  loading: { paddingVertical: 80, alignItems: "center", gap: 14 },
});
