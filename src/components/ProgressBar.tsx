import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { usePlayMotion } from "../play/motion";
import { colors } from "../theme";

type Props = { progress: number; label?: string };
export default function ProgressBar({ progress, label = "Πρόοδος" }: Props) {
  const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  const enabled = usePlayMotion(), [fill] = useState(() => new Animated.Value(safeProgress));
  useEffect(() => {
    if (!enabled) { fill.setValue(safeProgress); return; }
    const animation = Animated.timing(fill, { toValue: safeProgress, duration: 220, useNativeDriver: false, isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [enabled, fill, safeProgress]);
  return <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: safeProgress }}>
    <Animated.View style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]} />
  </View>;
}
const styles = StyleSheet.create({ track: { height: 6, borderRadius: 4, backgroundColor: "#292D41", overflow: "hidden" }, fill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 } });
