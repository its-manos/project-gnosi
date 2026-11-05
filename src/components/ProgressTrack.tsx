import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

export type ProgressTrackVariant = "destination" | "subject" | "accuracy";
export type ProgressTrackTone = "knowledge" | "reading";

type Props = ViewProps & {
  variant: ProgressTrackVariant;
  tone?: ProgressTrackTone;
  children?: ReactNode;
};

/**
 * Shared Midnight Atlas progress-track shells.
 * The caller keeps the existing fill: Reanimated ProgressBarFill for learning
 * or the static quiz-accuracy fill. No state, timing, or animation runs here.
 */
export default function ProgressTrack({
  variant, tone = "knowledge", style, children, ...rest
}: Props) {
  return <View {...rest}
    style={[styles[variant], variant === "subject" && tone === "reading" && styles.readingSubject, style]}>
    {children}
  </View>;
}

export const progressTrackStyles = StyleSheet.create({
  destination: {
    height: 5, backgroundColor: "#333951", borderRadius: 5, overflow: "hidden",
  },
  subject: {
    height: 7, borderRadius: 6, backgroundColor: "#363650",
    overflow: "hidden", borderWidth: 1, borderColor: "#4C466D",
  },
  readingSubject: { backgroundColor: "#2D4650", borderColor: "#49717A" },
  accuracy: {
    height: 7, overflow: "hidden", backgroundColor: "#282D40",
    borderRadius: 20, marginTop: 11,
  },
});

const styles = progressTrackStyles;
