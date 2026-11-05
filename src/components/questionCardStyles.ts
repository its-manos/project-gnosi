import { StyleSheet } from "react-native";
import { colors } from "../theme";

/** Midnight Atlas question surfaces: one calm, compact system for all six
 * formats, shared by lesson checkpoints, daily quiz and the preview pilot. */
export const questionCardStyles = StyleSheet.create({
  card: { backgroundColor: "#1B2235", borderColor: "#4E4B70", borderWidth: 1,
    borderRadius: 23, padding: 16, marginTop: 9, marginBottom: 12, overflow: "hidden" },
  // A restrained illuminated horizon; no animated SVG or expensive blur layer.
  rim: { position: "absolute", top: 0, left: 24, right: 24, height: 2,
    backgroundColor: "#8F85CE", opacity: 0.6 },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    gap: 8, marginBottom: 13 },
  typeBadge: { backgroundColor: "#302F4B", borderRadius: 10, borderWidth: 1,
    borderColor: "#56517A", paddingHorizontal: 10, paddingVertical: 7, flexShrink: 1 },
  typeLabel: { color: "#C2B8FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  counter: { color: "#B8B2CF", fontSize: 12, fontWeight: "900" },
  question: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: "800", marginBottom: 8 },
  hint: { color: colors.textBody, fontSize: 12, lineHeight: 19, marginBottom: 14 },
  answers: { gap: 8 },
  answer: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: "#222A41", borderRadius: 14, borderColor: "#39415A",
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  selected: { borderColor: colors.accent, backgroundColor: "#353052" },
  pressed: { opacity: 0.85 },
  answerCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  answerWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  answerText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  feedback: { marginTop: 13, padding: 14, borderRadius: 15, gap: 9, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  feedbackWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  feedbackText: { color: colors.textBody, fontSize: 14, lineHeight: 22 },
  confirm: { marginTop: 15, minHeight: 50, padding: 12, justifyContent: "center",
    alignItems: "center", backgroundColor: colors.accent, borderRadius: 14 },
  confirmDisabled: { opacity: 0.38 },
  confirmPressed: { opacity: 0.85 },
  confirmText: { color: colors.background, fontSize: 15, fontWeight: "900" },
});
