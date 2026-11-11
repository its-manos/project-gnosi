import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayMotion } from "../play/motion";
import type { Lesson } from "../data/lessons";
import { WelcomeLessonIcon } from "./WelcomeStepIcons";
import { lessonIntroductionStyles as styles } from "./lessonIntroductionStyles";

const REVEAL_MS = 320;
const CLOSE_MS = 150;

type Props = {
  lesson: Lesson;
  subcategoryTitle?: string;
  actionLabel: string;
  onDismiss: () => void;
  onStart: () => Promise<boolean>;
};

export default function LessonIntroductionModal({ lesson, subcategoryTitle, actionLabel, onDismiss, onStart }: Props) {
  const reduced = !usePlayMotion();
  const [motion] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const shown = useRef(false);
  const acting = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 680 || width < 370;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; motion.stopAnimation(); };
  }, [motion]);

  // Reuse interpolation nodes when an action updates the popup's state.
  const cardMotion = useMemo(() => ({
    opacity: motion,
    transform: [
      { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 24, 0] }) },
      { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.96, 1] }) },
    ],
  }), [motion, reduced]);
  const introMotion = useMemo(() => ({
    opacity: reduced ? 1 : motion.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, 1] }),
    transform: [{ translateY: reduced ? 0 : motion.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  }), [motion, reduced]);
  const actionMotion = useMemo(() => ({
    opacity: reduced ? 1 : motion.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] }),
  }), [motion, reduced]);

  function animate(toValue: 0 | 1, done?: () => void) {
    const duration = reduced ? 0 : toValue === 1 ? REVEAL_MS : CLOSE_MS;
    Animated.timing(motion, {
      toValue, duration, easing: Easing.out(Easing.cubic),
      useNativeDriver: true, isInteraction: false,
    }).start(({ finished }) => { if (finished && mounted.current) done?.(); });
  }
  function show() {
    if (shown.current) return;
    shown.current = true;
    animate(1);
  }
  function dismiss() {
    if (acting.current) return;
    acting.current = true;
    animate(0, onDismiss);
  }
  function recover() {
    if (!mounted.current) return;
    acting.current = false;
    setBusy(false);
    setFailed(true);
    animate(1);
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

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onShow={show} onRequestClose={dismiss}>
      <View style={styles.root}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: motion }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}
          accessibilityLabel="Κλείσιμο εισαγωγής" accessibilityRole="button" />
        <SafeAreaView pointerEvents="box-none" style={styles.safe} edges={["top", "bottom", "left", "right"]}>
          <Animated.View accessibilityViewIsModal onAccessibilityEscape={dismiss} testID="lesson-introduction"
            style={[styles.card, compact && styles.cardCompact, { maxHeight: Math.max(160, height - 100) }, cardMotion]}>
            <View pointerEvents="none" style={styles.halo} accessible={false} />
            <View pointerEvents="none" style={styles.edge} accessible={false} />
            <View style={styles.top}>
              <View style={styles.kicker}>
                <View style={styles.emblem}><WelcomeLessonIcon size={compact ? 36 : 44} /></View>
                <Text style={styles.eyebrow}>ΠΡΙΝ ΞΕΚΙΝΗΣΕΙΣ</Text>
              </View>
              <Pressable onPress={dismiss} disabled={busy} accessibilityRole="button"
                accessibilityLabel="Κλείσιμο εισαγωγής" style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {subcategoryTitle ? <Text style={styles.category}>{subcategoryTitle}</Text> : null}
              <Text accessibilityRole="header" style={[styles.title, compact && fontScale < 1.4 && styles.titleCompact]}>
                {lesson.title}
              </Text>
              <View style={styles.metadataPill}>
                <View style={styles.dot} />
                <Text style={styles.metadata}>{lesson.readingMinutes}′ ανάγνωση</Text>
              </View>
              <View style={styles.rule} />
              <Animated.View style={introMotion}><Text style={styles.intro}>{lesson.intro}</Text></Animated.View>
            </ScrollView>
            {failed ? <Text accessibilityLiveRegion="polite" style={styles.error}>Δεν ήταν δυνατή η έναρξη. Δοκίμασε ξανά.</Text> : null}
            <Animated.View style={actionMotion}>
              <Pressable onPress={start} disabled={busy} accessibilityRole="button"
                accessibilityState={{ disabled: busy, busy }}
                style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
                <Text style={styles.startText}>{busy ? "Άνοιγμα…" : actionLabel}</Text>
                <View style={styles.arrowBadge} accessible={false}><Text style={styles.arrow}>→</Text></View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
