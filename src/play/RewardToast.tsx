import { createContext, useContext, useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playerTitle } from "../gamification/rules";
import { colors } from "../theme";
import type { FeedbackEvent } from "./events";

type Presentation = { event: FeedbackEvent | null; reveal: Animated.Value; drift: Animated.Value; motion: boolean };
type Overlay = Presentation & { registerModal: () => () => void };
export const RewardToastContext = createContext<Overlay | null>(null);

/** A native Modal has its own window above the app's root overlay. Render the
 * same transient reward there, without another event subscription or sound. */
export function RewardToastHost() {
  const overlay = useContext(RewardToastContext);
  const insets = useSafeAreaInsets();
  useEffect(() => overlay?.registerModal(), [overlay?.registerModal]);
  return overlay ? renderRewardToast(overlay, insets.bottom) : null;
}

// Stable per event: remounting inside a native modal never moves the same reward.
const positions = [
  { alignItems: "flex-start", lift: 16 }, { alignItems: "center", lift: 64 },
  { alignItems: "flex-end", lift: 32 }, { alignItems: "flex-start", lift: 88 },
  { alignItems: "flex-end", lift: 104 }, { alignItems: "center", lift: 0 },
] as const;
export function rewardToastPosition(id: string, motion: boolean) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619) >>> 0;
  return motion ? positions[hash % positions.length] : { alignItems: "center" as const, lift: 24 };
}

/** Shared presentation for the root host and the active lesson-question Modal. */
export function renderRewardToast({ event, reveal, drift, motion }: Presentation, bottomInset: number) {
  if (!event) return null;
  const xp = event.answerXP ?? event.xp ?? 0;
  const heading = event.kind === "level-up" ? `Επίπεδο ${event.level} · ${playerTitle(event.level!)}`
    : event.kind === "mastered" ? "Νέα έννοια κατακτημένη!"
    : event.kind === "complete" ? "Ολοκληρώθηκε!"
    : event.kind === "correct" ? "Σωστή απάντηση!" : "Κέρδισες XP!";
  const detail = event.pendingXP ? "Πιστώνονται στην ολοκλήρωση" : event.label;
  const description = `${heading}. +${xp} XP${detail ? `. ${detail}` : ""}`;
  const milestone = event.kind === "level-up" || event.kind === "mastered";
  const position = rewardToastPosition(event.id, motion);
  return <Animated.View pointerEvents="none" testID="play-celebration" accessible
    accessibilityLiveRegion="polite" accessibilityLabel={description}
    style={[styles.overlay, { alignItems: position.alignItems,
      bottom: Math.max(bottomInset, 8) + 112 + position.lift, opacity: reveal,
      transform: motion ? [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [8, -28] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, position.alignItems === "flex-end" ? -10 : 10] }) },
        { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
      ] : [] }]}>
    <View style={styles.burst}>
      {milestone ? <Text style={styles.heading}>{heading}</Text> : null}
      <View style={styles.reward}>
        <Text style={styles.sparkle} accessible={false}>✦</Text>
        <Text style={styles.amount}>+{xp}<Text style={styles.unit}> XP</Text></Text>
        {motion ? <Text style={styles.smallSparkle} accessible={false}>✧</Text> : null}
      </View>
      {event.pendingXP ? <Text style={styles.detail}>Πιστώνονται στην ολοκλήρωση</Text> : null}
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 24, right: 24, zIndex: 40, elevation: 12 },
  burst: { maxWidth: 240, alignItems: "center", gap: 2 },
  heading: { color: colors.accentLight, fontSize: 12, lineHeight: 18, fontWeight: "800", textAlign: "center",
    textShadowColor: "#0B0D15", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  reward: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  amount: { color: "#E6CEA2", fontSize: 25, lineHeight: 33, fontWeight: "900", fontVariant: ["tabular-nums"],
    textShadowColor: "#0B0D15", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  unit: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
  sparkle: { color: "#D5B785", fontSize: 12, lineHeight: 18 },
  smallSparkle: { color: colors.accentLight, fontSize: 9, lineHeight: 14, alignSelf: "flex-start", marginTop: 2 },
  detail: { color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: "center",
    textShadowColor: "#0B0D15", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
