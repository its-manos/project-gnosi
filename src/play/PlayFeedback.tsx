import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, AppState, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLearningSession } from "../state/LearningSession";
import { mergeRewardLedgers, totalRewardXP } from "../gamification/rewards";
import { playerTitle } from "../gamification/rules";
import { levelProgress } from "../utils/knowledgeScoring";
import { colors } from "../theme";
import { FeedbackAudio } from "./audio";
import { FeedbackGate, subscribePlayFeedback, type FeedbackEvent } from "./events";
import { playPreferences } from "./preferences";
import { usePlayMotion } from "./motion";
import { subscribeSoundPreview } from "./soundStatus";

/** Mounted inside the existing account-keyed boundary. Nothing is replayed from
 * persisted data, even when a historical completion or level is restored. */
export default function PlayFeedback({ children }: { children: ReactNode }) {
  const { store, dailyStore } = useLearningSession();
  const [toast, setToast] = useState<FeedbackEvent | null>(null), [reveal] = useState(() => new Animated.Value(1));
  const foreground = useRef(AppState.currentState === "active");
  const motion = usePlayMotion(), insets = useSafeAreaInsets();
  useEffect(() => {
    const audio = new FeedbackAudio(), gate = new FeedbackGate();
    let alive = true, motionChanged = false;
    // Accepted answers can arrive before the device's saved sound setting loads.
    // Keep one short-lived cue instead of silently losing the first answer.
    let pendingPreferenceCue: { kind: FeedbackEvent["kind"]; at: number } | null = null;
    void playPreferences.load(AsyncStorage); void audio.start();
    const reduced = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { motionChanged = true; playPreferences.setMotion(value); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive && !motionChanged) playPreferences.setMotion(value); }).catch(() => { if (alive && !motionChanged) playPreferences.setMotion(true); });
    const state = AppState.addEventListener("change", value => {
      foreground.current = value === "active";
      if (!foreground.current) { pendingPreferenceCue = null; audio.stop(); gate.reset(); setToast(null); }
    });
    const allowed = () => { const p = playPreferences.getSnapshot(); return alive && foreground.current && p.ready && p.sound; };
    const unsubscribePrefs = playPreferences.subscribe(() => {
      const p = playPreferences.getSnapshot();
      if (!p.ready) return;
      if (!p.sound) { pendingPreferenceCue = null; audio.stop(); return; }
      const pending = pendingPreferenceCue;
      pendingPreferenceCue = null;
      // Don't let an old cue play after leaving the app or navigating away.
      if (pending && alive && foreground.current && Date.now() - pending.at < 2500) audio.play(pending.kind, allowed);
    });
    const unsubscribePreview = subscribeSoundPreview(() => { if (allowed()) audio.preview(allowed); });
    const unsubscribe = subscribePlayFeedback(incoming => {
      const total = totalRewardXP(mergeRewardLedgers(store.getSnapshot().rewards, dailyStore.getSnapshot().doc.rewards));
      const level = levelProgress(total).level;
      const event: FeedbackEvent = (incoming.xp ?? 0) > 0 && level > levelProgress(Math.max(0, total - incoming.xp!)).level ? { ...incoming, kind: "level-up", level } : incoming;
      if (!alive || !gate.accept(event, store.userId ?? "guest", foreground.current, Date.now())) return;
      if (!playPreferences.getSnapshot().ready) pendingPreferenceCue = { kind: event.kind, at: Date.now() };
      else audio.play(event.kind, allowed);
      // Show reward popups only when XP was actually earned (or is pending).
      // A zero-XP answer/replay still plays its sound, but must also dismiss any
      // previous toast so an old +XP popup is not mistaken for the new answer.
      const earnedXP = event.answerXP ?? event.xp ?? 0;
      const showReward = earnedXP > 0 && (event.answerXP !== undefined || event.kind === "level-up" || event.kind === "mastered");
      setToast(showReward ? event : null);
    });
    return () => { alive = false; pendingPreferenceCue = null; unsubscribe(); unsubscribePrefs(); unsubscribePreview(); reduced.remove(); state.remove(); audio.dispose(); };
  }, [store, dailyStore]);
  useEffect(() => {
    if (!toast) return;
    reveal.setValue(motion ? 0 : 1);
    const hold = toast.answerXP !== undefined && toast.kind !== "level-up" && toast.kind !== "mastered" ? 900 : 1500;
    const animation = motion ? Animated.sequence([
      Animated.timing(reveal, { toValue: 1, duration: 180, useNativeDriver: true, isInteraction: false }),
      Animated.timing(reveal, { toValue: 1, duration: 0, delay: hold, useNativeDriver: true, isInteraction: false }), Animated.timing(reveal, { toValue: 0, duration: 220, useNativeDriver: true, isInteraction: false }),
    ]) : undefined;
    animation?.start();
    const id = toast.id, timer = setTimeout(() => setToast(current => current?.id === id ? null : current), hold + 500);
    return () => { clearTimeout(timer); animation?.stop(); reveal.setValue(1); };
  }, [toast, motion, reveal]);
  const heading = toast?.kind === "level-up" ? `Επίπεδο ${toast.level} · ${playerTitle(toast.level!)}` : toast?.kind === "mastered" ? "Νέα έννοια κατακτημένη!" : toast?.kind === "correct" ? "Σωστή απάντηση!" : "Συνέχισε την προσπάθεια";
  return <View style={styles.root}>{children}{toast ? <Animated.View pointerEvents="none" testID="play-celebration" style={[styles.toast, { bottom: Math.max(insets.bottom, 8) + 76, opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
    {motion && toast.kind !== "complete" ? <View style={styles.sparkles} accessible={false}><Text style={styles.sparkle}>✦</Text><Text style={styles.sparkle}>✧</Text><Text style={styles.sparkle}>✦</Text></View> : null}
    <Text style={styles.heading} accessibilityLiveRegion="polite">{heading}</Text>
    {toast.label ? <Text style={styles.label}>{toast.label}</Text> : null}
    {toast.answerXP !== undefined ? <Text style={styles.xp}>+{toast.answerXP} XP</Text> : null}
    {toast.pendingXP ? <Text style={styles.label}>Πιστώνονται στην ολοκλήρωση</Text> : null}
  </Animated.View> : null}</View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, toast: { position: "absolute", left: 24, right: 24, maxWidth: 640, alignSelf: "center", borderWidth: 1, borderColor: colors.accent, borderRadius: 22, backgroundColor: colors.surface, padding: 18, gap: 6, zIndex: 20, elevation: 8 }, heading: { color: colors.accentLight, fontSize: 19, lineHeight: 27, fontWeight: "900", textAlign: "center" }, label: { color: colors.textBody, fontSize: 13, lineHeight: 21, textAlign: "center" }, xp: { color: colors.success, fontSize: 22, lineHeight: 30, fontWeight: "900", textAlign: "center" }, sparkles: { flexDirection: "row", justifyContent: "space-around" }, sparkle: { color: colors.accentLight, fontSize: 21 } });
