import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

type Props = { progress: number };

export default function ProgressBar({ progress }: Props) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${safeProgress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 4, backgroundColor: "#292D41", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
});
