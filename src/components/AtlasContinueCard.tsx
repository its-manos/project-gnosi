import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";
import { MotionPressable } from "./HomeMotion";
import { colors } from "../theme";

// Shared Continue card chrome; maps own copy, progress semantics and effects.
export const atlasContinueStyles = StyleSheet.create({
  card: {
    paddingHorizontal: 15, paddingTop: 12, paddingBottom: 13,
    backgroundColor: "#1B2034", borderColor: "#6A618C",
    borderWidth: 1, borderRadius: 18, gap: 8,
  },
  heading: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  body: { flexDirection: "row", alignItems: "center", gap: 10 },
  copy: { flex: 1, gap: 3 },
  eyebrow: {
    color: "#ABA1D4", fontSize: 9, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8,
  },
  title: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  action: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
    borderWidth: 1, borderColor: "#C9BFFF", alignItems: "center", justifyContent: "center",
  },
  progressTrack: {
    height: 8, borderRadius: 5, backgroundColor: "#302F4B", overflow: "hidden",
    borderWidth: 1, borderColor: "#62597D",
  },
});

// Keeps the existing native Reanimated press and entrance behavior.
export default function AtlasContinueCard({ style, ...props }: ComponentProps<typeof MotionPressable>) {
  // Pressable style may also be a state callback; preserve both supported forms.
  const combinedStyle: ComponentProps<typeof MotionPressable>["style"] =
    typeof style === "function"
      ? state => [atlasContinueStyles.card, style(state)]
      : [atlasContinueStyles.card, style];
  return <MotionPressable {...props} style={combinedStyle} />;
}
