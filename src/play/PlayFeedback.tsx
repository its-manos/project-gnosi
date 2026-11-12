import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, AppState, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLearningSession } from "../state/LearningSession";
import { mergeRewardLedgers, totalRewardXP } from "../gamification/rewards";
import { levelProgress } from "../utils/knowledgeScoring";
import { RewardToastContext, renderRewardToast } from "./RewardToast";
import { SoundFeedbackQueue } from "./SoundFeedbackQueue";
import { FeedbackAudio } from "./audio";
import { FeedbackGate, feedbackPriority, subscribePlayFeedback, type FeedbackEvent } from "./events";
import { playPreferences } from "./preferences";
import { usePlayMotion } from "./motion";
import { subscribePracticeCue, subscribeSoundPreview } from "./soundStatus";

/** Mounted inside the existing account-keyed boundary. Nothing is replayed from
 * persisted data, even when a historical completion or level is restored. */
export default function PlayFeedback({ children }: { children: ReactNode }) {
  const { store, dailyStore } = useLearningSession();
  const [toast, setToast] = useState<FeedbackEvent | null>(null), [reveal] = useState(() => new Animated.Value(1));
  const [modalHosts, setModalHosts] = useState(0);
  const registerModal = useRef(() => {
    setModalHosts(count => count + 1);
    return () => setModalHosts(count => Math.max(0, count - 1));
  }).current;
  const foreground = useRef(AppState.currentState === "active");
  const motion = usePlayMotion(), insets = useSafeAreaInsets();
  useEffect(() => {
    const audio = new FeedbackAudio(), gate = new FeedbackGate();
    let alive = true, motionChanged = false;
    // Accepted answers can arrive before the device's saved sound setting loads.
    // Keep one short-lived cue instead of silently losing the first answer.
    let pendingPreferenceCue: { kind: FeedbackEvent["kind"]; at: number } | null = null;
    const allowed = () => { const p = playPreferences.getSnapshot(); return alive && foreground.current && p.ready && p.sound; };
    const sounds = new SoundFeedbackQueue(kind => audio.play(kind, allowed));
    const rememberCue = (kind: FeedbackEvent["kind"]) => {
      if (!pendingPreferenceCue || Date.now() - pendingPreferenceCue.at >= 500 ||
          feedbackPriority[kind] >= feedbackPriority[pendingPreferenceCue.kind]) pendingPreferenceCue = { kind, at: Date.now() };
    };
    const requestCue = (kind: FeedbackEvent["kind"]) => {
      if (!playPreferences.getSnapshot().ready) rememberCue(kind);
      else if (allowed()) sounds.enqueue(kind);
    };
    void playPreferences.load(AsyncStorage); void audio.start();
    const reduced = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { motionChanged = true; playPreferences.setMotion(value); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive && !motionChanged) playPreferences.setMotion(value); }).catch(() => { if (alive && !motionChanged) playPreferences.setMotion(true); });
    const state = AppState.addEventListener("change", value => {
      foreground.current = value === "active";
      if (!foreground.current) { pendingPreferenceCue = null; sounds.clear(); audio.stop(); gate.reset(); setToast(null); }
    });
    const unsubscribePrefs = playPreferences.subscribe(() => {
      const p = playPreferences.getSnapshot();
      if (!p.ready) return;
      if (!p.sound) { pendingPreferenceCue = null; sounds.clear(); audio.stop(); return; }
      const pending = pendingPreferenceCue;
      pendingPreferenceCue = null;
      // Don't let an old cue play after leaving the app or navigating away.
      if (pending && alive && foreground.current && Date.now() - pending.at < 500) sounds.enqueue(pending.kind);
    });
    const unsubscribePreview = subscribeSoundPreview(() => { if (allowed()) { sounds.clear(); audio.preview(allowed); } });
    const unsubscribePractice = subscribePracticeCue(kind => {
      // Match rewarded answers: a first tap during preference hydration must
      // not silently lose its cue, and disabled sound must remain silent.
      requestCue(kind);
    });
    const unsubscribe = subscribePlayFeedback(incoming => {
      const total = totalRewardXP(mergeRewardLedgers(store.getSnapshot().rewards, dailyStore.getSnapshot().doc.rewards));
      const level = levelProgress(total).level;
      const event: FeedbackEvent = (incoming.xp ?? 0) > 0 && level > levelProgress(Math.max(0, total - incoming.xp!)).level ? { ...incoming, kind: "level-up", level } : incoming;
      if (!alive || !gate.accept(event, store.userId ?? "guest", foreground.current, Date.now())) return;
      requestCue(event.kind);
      // Navigation and zero-XP completion events must not erase an accepted
      // reward. An actual zero-XP answer still clears an older answer's popup.
      const earnedXP = event.answerXP ?? event.xp ?? 0;
      if (earnedXP > 0) setToast(event);
      else if (event.answerXP !== undefined) setToast(null);
    });
    return () => { alive = false; pendingPreferenceCue = null; unsubscribe(); unsubscribePrefs(); unsubscribePreview(); unsubscribePractice(); reduced.remove(); state.remove(); sounds.clear(); audio.dispose(); };
  }, [store, dailyStore]);
  useEffect(() => {
    if (!toast) return;
    reveal.setValue(motion ? 0 : 1);
    const hold = toast.kind === "level-up" || toast.kind === "mastered" ? 2200 : toast.answerXP !== undefined ? 1400 : 1800;
    const animation = motion ? Animated.sequence([
      Animated.timing(reveal, { toValue: 1, duration: 180, useNativeDriver: true, isInteraction: false }),
      Animated.timing(reveal, { toValue: 1, duration: 0, delay: hold, useNativeDriver: true, isInteraction: false }), Animated.timing(reveal, { toValue: 0, duration: 220, useNativeDriver: true, isInteraction: false }),
    ]) : undefined;
    animation?.start();
    const id = toast.id, timer = setTimeout(() => setToast(current => current?.id === id ? null : current), hold + 500);
    return () => { clearTimeout(timer); animation?.stop(); reveal.setValue(1); };
  }, [toast, motion, reveal]);
  const presentation = { event: toast, reveal, motion };
  return <RewardToastContext.Provider value={{ ...presentation, registerModal }}>
    <View style={styles.root}>{children}{modalHosts === 0 ? renderRewardToast(presentation, insets.bottom) : null}</View>
  </RewardToastContext.Provider>;
}
const styles = StyleSheet.create({ root: { flex: 1 } });
