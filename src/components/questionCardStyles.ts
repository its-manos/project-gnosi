import { StyleSheet } from "react-native";
import { colors } from "../theme";

/** Shared look for all interactive lesson and quiz cards. Edit once, apply to
 * legacy single-choice and multi-select instead of approximating the styles. */
export const questionCardStyles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1,
    borderRadius: 22, padding: 18, marginTop: 12, marginBottom: 22 },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    gap: 8, marginBottom: 18 },
  typeBadge: { backgroundColor: colors.accentSurface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  typeLabel: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  question: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800", marginBottom: 9 },
  hint: { color: colors.textBody, fontSize: 13, lineHeight: 21, marginBottom: 18 },
  answers: { gap: 10 },
  answer: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 13,
    backgroundColor: colors.surfaceRaised, borderRadius: 14, borderColor: colors.border,
    borderWidth: 1, paddingHorizontal: 13, paddingVertical: 12 },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  pressed: { opacity: 0.85 },
  answerCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  answerWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  answerText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "600" },
  feedback: { marginTop: 18, padding: 16, borderRadius: 16, gap: 10, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: colors.successSurface, borderColor: colors.success },
  feedbackWrong: { backgroundColor: colors.errorSurface, borderColor: colors.error },
  feedbackText: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  confirm: { marginTop: 20, minHeight: 54, padding: 13, justifyContent: "center",
    alignItems: "center", backgroundColor: colors.accent, borderRadius: 14 },
  confirmDisabled: { opacity: 0.38 },
  confirmPressed: { opacity: 0.85 },
  confirmText: { color: colors.background, fontSize: 15, fontWeight: "900" },
});
