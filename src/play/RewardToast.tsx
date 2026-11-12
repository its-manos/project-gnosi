import { createContext, useContext, useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playerTitle } from "../gamification/rules";
import { colors } from "../theme";
import type { FeedbackEvent } from "./events";

type Presentation = { event: FeedbackEvent | null; reveal: Animated.Value; motion: boolean };
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

/** Shared presentation for the root host and the active lesson-question Modal. */
export function renderRewardToast({ event, reveal, motion }: Presentation, bottomInset: number) {
  if (!event) return null;
  const xp = event.answerXP ?? event.xp ?? 0;
  const heading = event.kind === "level-up" ? `Επίπεδο ${event.level} · ${playerTitle(event.level!)}`
    : event.kind === "mastered" ? "Νέα έννοια κατακτημένη!"
    : event.kind === "complete" ? "Ολοκληρώθηκε!" : "Σωστή απάντηση!";
  const detail = event.pendingXP ? "Πιστώνονται στην ολοκλήρωση" : event.label;
  const description = `${heading}. +${xp} XP${detail ? `. ${detail}` : ""}`;
  return <Animated.View pointerEvents="none" testID="play-celebration" accessible
    accessibilityLiveRegion="polite" accessibilityLabel={description}
    style={[styles.overlay, { bottom: Math.max(bottomInset, 8) + 76, opacity: reveal,
      transform: motion ? [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] : [] }]}>
    <View style={[styles.card, event.kind === "level-up" && styles.levelCard]}>
      <View style={styles.medallion} accessible={false}>
        <Text style={styles.symbol}>{event.kind === "level-up" ? "↑" : "✦"}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{event.pendingXP ? "XP ΜΑΘΗΣΗΣ" : "XP ΚΕΡΔΙΣΜΕΝΑ"}</Text>
        <Text style={styles.heading}>{heading}</Text>
        {detail ? <Text style={styles.detail} numberOfLines={2}>{detail}</Text> : null}
      </View>
      <View style={styles.reward}>
        <Text style={styles.amount}>+{xp}<Text style={styles.unit}> XP</Text></Text>
      </View>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 40, elevation: 12 },
  card: { width: "100%", maxWidth: 460, flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: "#1B2034", borderWidth: 1, borderColor: "#6A618C", borderLeftWidth: 3,
    borderLeftColor: "#D5B785", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13,
    shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  levelCard: { borderColor: "#A08A65" },
  medallion: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#796B85",
    backgroundColor: "#302B4A", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  symbol: { color: "#D5B785", fontSize: 20, lineHeight: 25, fontWeight: "700" },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { color: "#D5B785", fontSize: 9, lineHeight: 13, fontWeight: "800", letterSpacing: 0.8 },
  heading: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  detail: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  reward: { alignItems: "center", flexShrink: 0, gap: 1 },
  amount: { color: "#E6CEA2", fontSize: 23, lineHeight: 29, fontWeight: "900", fontVariant: ["tabular-nums"] },
  unit: { color: colors.accentLight, fontSize: 10, lineHeight: 14, fontWeight: "800", letterSpacing: 1 },
});
