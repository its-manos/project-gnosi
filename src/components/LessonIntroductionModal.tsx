import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayMotion } from "../play/motion";
import { requestPracticeCue } from "../play/soundStatus";
import { WelcomeLessonIcon } from "./WelcomeStepIcons";
import type { Lesson } from "../data/lessons";

type Props = {
  lesson: Lesson;
  subcategoryTitle?: string;
  actionLabel: string;
  onDismiss: () => void;
  onStart: () => Promise<boolean>;
};

export default function LessonIntroductionModal({ lesson, subcategoryTitle, actionLabel, onDismiss, onStart }: Props) {
  const enabled = usePlayMotion();
  const reduced = !enabled;
  const shown = useRef(false);
  const motion = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const acting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 680 || width < 370;
  useEffect(() => () => motion.stopAnimation(), [motion]);
  function show() {
    if (shown.current) return;
    shown.current = true;
    requestPracticeCue("lesson-preview");
    animate(1);
  }
  function animate(toValue: number, done?: () => void) {
    Animated.timing(motion, { toValue, duration: reduced ? 0 : toValue ? 320 : 150,
      easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }).start(({ finished }) => { if (finished) done?.(); });
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
  return <Modal transparent visible animationType="none" statusBarTranslucent onShow={show} onRequestClose={dismiss}>
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: motion }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Κλείσιμο εισαγωγής" accessibilityRole="button" />
      <SafeAreaView pointerEvents="box-none" style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={dismiss} testID="lesson-introduction"
          style={[styles.card, compact && styles.cardCompact, { maxHeight: Math.max(160, height - 100), opacity: motion,
            transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 24, 0] }) },
              { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.96, 1] }) }] }]}>
          <View pointerEvents="none" style={styles.halo} accessible={false} />
          <View pointerEvents="none" style={styles.edge} accessible={false} />
          <View style={styles.top}>
            <View style={styles.kicker}><View style={styles.emblem}><WelcomeLessonIcon size={compact ? 36 : 44} /></View><Text style={styles.eyebrow}>ΠΡΙΝ ΞΕΚΙΝΗΣΕΙΣ</Text></View>
            <Pressable onPress={dismiss} disabled={busy} accessibilityRole="button" accessibilityLabel="Κλείσιμο εισαγωγής" style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {subcategoryTitle ? <Text style={styles.category}>{subcategoryTitle}</Text> : null}
            <Text accessibilityRole="header" style={[styles.title, compact && fontScale < 1.4 && styles.titleCompact]}>{lesson.title}</Text>
            <View style={styles.metadataPill}><View style={styles.dot} /><Text style={styles.metadata}>{lesson.readingMinutes}′ ανάγνωση</Text></View>
            <View style={styles.rule} />
            <Animated.View style={{ opacity: reduced ? 1 : motion.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, 1] }),
              transform: [{ translateY: reduced ? 0 : motion.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
              <Text style={styles.intro}>{lesson.intro}</Text>
            </Animated.View>
          </ScrollView>
          {failed ? <Text accessibilityLiveRegion="polite" style={styles.error}>Δεν ήταν δυνατή η έναρξη. Δοκίμασε ξανά.</Text> : null}
          <Animated.View style={{ opacity: reduced ? 1 : motion.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] }) }}>
            <Pressable onPress={start} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
              style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
              <Text style={styles.startText}>{busy ? "Άνοιγμα…" : actionLabel}</Text><View style={styles.arrowBadge} accessible={false}><Text style={styles.arrow}>→</Text></View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, backdrop: { backgroundColor: "rgba(3,5,13,0.84)" },
  safe: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 460, flexShrink: 1, borderRadius: 28, borderWidth: 1, borderColor: "#555078", backgroundColor: "#191E32", padding: 24, overflow: "hidden" },
  cardCompact: { padding: 18, borderRadius: 24 },
  halo: { position: "absolute", width: 250, height: 250, borderRadius: 125, top: -165, right: -65, backgroundColor: "#353352", opacity: 0.6 },
  edge: { position: "absolute", top: 0, left: 44, right: 44, height: 1, backgroundColor: "#A99AC9", opacity: 0.55 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 20 },
  kicker: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  emblem: { alignItems: "center", justifyContent: "center" },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C6B391" },
  eyebrow: { color: "#D6C0A6", fontSize: 10, letterSpacing: 1.3, fontWeight: "700", flexShrink: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#24293D" },
  closeText: { color: "#BCC2D4", fontSize: 26 }, scroll: { flexShrink: 1 }, content: { paddingBottom: 4 },
  category: { color: "#B7A9E0", fontSize: 12, marginBottom: 8, fontWeight: "600" },
  title: { color: "#F6F0E7", fontSize: 27, lineHeight: 35, fontWeight: "700" },
  titleCompact: { fontSize: 23, lineHeight: 31 },
  metadataPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#242A40", marginTop: 14 },
  metadata: { color: "#C3C9D9", fontSize: 12 },
  rule: { width: 40, height: 2, borderRadius: 1, backgroundColor: "#817499", marginVertical: 18 },
  intro: { color: "#DFE1EA", fontSize: 16, lineHeight: 26 },
  start: { marginTop: 22, borderRadius: 17, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#B8AAF2", borderTopWidth: 1, borderTopColor: "#D8CEFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  startText: { color: "#171426", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  arrowBadge: { borderRadius: 16, width: 32, height: 32, backgroundColor: "#CEC2F8", alignItems: "center", justifyContent: "center" },
  arrow: { color: "#302748", fontSize: 20 },
  error: { color: "#F1BCC8", fontSize: 13, marginTop: 12 },
});
