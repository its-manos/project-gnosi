import { useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import type { Lesson } from "../data/lessons";

type Props = {
  lesson: Lesson;
  subcategoryTitle?: string;
  actionLabel: string;
  onDismiss: () => void;
  onStart: () => Promise<boolean>;
};

export default function LessonIntroductionModal({ lesson, subcategoryTitle, actionLabel, onDismiss, onStart }: Props) {
  const reduced = useReducedMotion();
  const motion = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const acting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { height } = useWindowDimensions();
  function animate(toValue: number, done?: () => void) {
    Animated.timing(motion, { toValue, duration: reduced ? 0 : toValue ? 260 : 160,
      easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished) done?.(); });
  }
  function dismiss() {
    if (acting.current) return;
    acting.current = true;
    animate(0, onDismiss);
  }
  function start() {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    setFailed(false);
    animate(0, () => {
      void onStart().then(ok => { if (!ok) recover(); }).catch(recover);
    });
  }
  function recover() {
    acting.current = false;
    setBusy(false);
    setFailed(true);
    animate(1);
  }
  return <Modal transparent visible animationType="none" statusBarTranslucent onShow={() => animate(1)} onRequestClose={dismiss}>
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: motion }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Κλείσιμο εισαγωγής" accessibilityRole="button" />
      <SafeAreaView pointerEvents="box-none" style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={dismiss} testID="lesson-introduction"
          style={[styles.card, { maxHeight: Math.max(160, height - 100), opacity: motion,
            transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 18, 0] }) },
              { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.97, 1] }) }] }]}>
          <View style={styles.top}>
            <View style={styles.kicker}><View style={styles.dot} /><Text style={styles.eyebrow}>ΠΡΙΝ ΞΕΚΙΝΗΣΕΙΣ</Text></View>
            <Pressable onPress={dismiss} disabled={busy} accessibilityRole="button" accessibilityLabel="Κλείσιμο εισαγωγής" style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {subcategoryTitle ? <Text style={styles.category}>{subcategoryTitle}</Text> : null}
            <Text accessibilityRole="header" style={styles.title}>{lesson.title}</Text>
            <Text style={styles.metadata}>{lesson.readingMinutes}′ ανάγνωση</Text>
            <View style={styles.rule} />
            <Text style={styles.intro}>{lesson.intro}</Text>
          </ScrollView>
          {failed ? <Text accessibilityLiveRegion="polite" style={styles.error}>Δεν ήταν δυνατή η έναρξη. Δοκίμασε ξανά.</Text> : null}
          <Pressable onPress={start} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
            style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
            <Text style={styles.startText}>{busy ? "Άνοιγμα…" : actionLabel}</Text><Text style={styles.arrow} accessible={false}>→</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, backdrop: { backgroundColor: "rgba(3,5,13,0.82)" },
  safe: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 460, flexShrink: 1, borderRadius: 26, borderWidth: 1, borderColor: "#45425F", backgroundColor: "#151827", padding: 22, overflow: "hidden" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  kicker: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#B9ACF3" },
  eyebrow: { color: "#B9ACF3", fontSize: 10, letterSpacing: 1.4, fontWeight: "700", flexShrink: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#AEB4C9", fontSize: 28 }, scroll: { flexShrink: 1 }, content: { paddingBottom: 8 },
  category: { color: "#AEB4C9", fontSize: 12, marginBottom: 8 },
  title: { color: "#F2EFFB", fontSize: 25, lineHeight: 33, fontWeight: "700" },
  metadata: { color: "#AEB4C9", fontSize: 12, marginTop: 12 },
  rule: { width: 40, height: 2, borderRadius: 1, backgroundColor: "#8274B5", marginVertical: 20 },
  intro: { color: "#D9DCE9", fontSize: 16, lineHeight: 26 },
  start: { marginTop: 20, borderRadius: 16, minHeight: 52, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: "#B8AAF2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  startText: { color: "#171426", fontSize: 15, fontWeight: "700", flexShrink: 1, textAlign: "center" }, arrow: { color: "#171426", fontSize: 20 },
  error: { color: "#F1BCC8", fontSize: 13, marginTop: 12 },
});
