/**
 * Progress uses a calm Midnight Atlas palette without the Home cartographic
 * map. This is a single static gradient surface, not animated SVG scenery.
 * It is ready at mount (no layout-dependent map loading or network request).
 */
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

function ProgressGradientBackground() {
  return (
    <View testID="progress-gradient-background" pointerEvents="none"
      accessible={false} style={styles.background}>
      <Svg width="100%" height="100%" viewBox="0 0 420 840"
        preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="progress-night" x1="0%" y1="0%" x2="72%" y2="100%">
            <Stop offset="0%" stopColor="#0D1827" />
            <Stop offset="37%" stopColor="#161C30" />
            <Stop offset="72%" stopColor="#19192F" />
            <Stop offset="100%" stopColor="#0C101D" />
          </LinearGradient>
          <RadialGradient id="progress-teal" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#53838C" stopOpacity={0.17} />
            <Stop offset="100%" stopColor="#53838C" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="progress-violet" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#8170B8" stopOpacity={0.17} />
            <Stop offset="100%" stopColor="#8170B8" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={420} height={840} fill="url(#progress-night)" />
        <Ellipse cx={42} cy={160} rx={220} ry={310} fill="url(#progress-teal)" />
        <Ellipse cx={370} cy={510} rx={310} ry={380} fill="url(#progress-violet)" />
      </Svg>
    </View>
  );
}

export default memo(ProgressGradientBackground);

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#0D1827",
  },
});
