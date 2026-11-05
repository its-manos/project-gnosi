import type { ViewProps } from "react-native";
import { StyleSheet, View } from "react-native";
import { MotionView } from "./HomeMotion";
import { colors } from "../theme";

type Variant = "profile" | "dashboard" | "streak" | "standard";
type Props = ViewProps & { variant: Variant; entranceDelay?: number };

/** Reuse card surfaces while each screen owns its values, labels and visual accents. */
export default function MetricCard({ variant, entranceDelay, style, ...props }: Props) {
  const cardStyle = [styles.card, styles[variant], style];
  return entranceDelay !== undefined
    ? <MotionView {...props} entranceDelay={entranceDelay} style={cardStyle} />
    : <View {...props} style={cardStyle} />;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, minWidth: 0 },
  profile: {
    flex: 1, minHeight: 85, paddingHorizontal: 14, paddingVertical: 11,
    justifyContent: "space-between", borderRadius: 18,
    backgroundColor: "#192A3B", borderColor: "#3A5360",
  },
  dashboard: {
    flexGrow: 1, flexShrink: 1, flexBasis: "30%", minWidth: 88, minHeight: 62,
    paddingHorizontal: 11, paddingVertical: 8, justifyContent: "center", gap: 1,
    borderColor: "#4A4566", borderRadius: 15, backgroundColor: "#20243C",
  },
  streak: {
    flex: 1, minHeight: 83, padding: 13, justifyContent: "space-between",
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15,
  },
  standard: {
    flexGrow: 1, flexBasis: "46%", padding: 15, gap: 6,
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17,
  },
});
