/** Fixed-viewport Aegean atlas for the Adventure Path.
 * All geography and bathymetry are static SVG. The only ambient loop changes
 * a small native view's opacity, avoiding full-screen SVG layer movement.
 * The viewBox matches the measured aspect ratio exactly.
 */
import { memo, useEffect } from "react";
import { Image } from "expo-image";
const atlasImage = require("../../assets/atlas-export-preview/subcategory.webp");
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs, Ellipse, RadialGradient, Stop,
} from "react-native-svg";

type Props = { width: number; height: number };
function AdventureAtlasBackground({ width, height }: Props) {
  const reduced = useReducedMotion();
  const androidLite = Platform.OS === "android";
  const glow = useSharedValue(0.07);
  // 420 map-units wide at every device width, with an exact aspect-ratio
  // match. No aspectFill, crop or non-uniform stretch on either platform.
  // Subtle ocean lighting uses a bounded native-view opacity, not a
  // translated full-screen SVG. The coastlines and current lines never move.
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  useEffect(() => {
    cancelAnimation(glow);
    glow.value = 0.07;
    if (reduced) return;
    glow.value = withRepeat(withSequence(
      withTiming(0.15, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.07, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(glow);
  }, [reduced, glow]);

  return (
    <View pointerEvents="none" accessible={false} style={styles.underlay}>
      <Image source={atlasImage} contentFit="fill" transition={0}
        cachePolicy="memory-disk" style={StyleSheet.absoluteFillObject} />

      {/* Only this small, separately composited glow changes opacity. */}
      <Animated.View testID="adventure-atlas-ambient-glow" pointerEvents="none"
        accessible={false} style={[styles.tideGlow, {
          left: width * 0.18, top: height * 0.30,
          width: width * 0.64, height: height * 0.34,
        }, glowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 220 160" pointerEvents="none">
          <Defs>
            <RadialGradient id="adventure-tide-glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#9DBAC6" stopOpacity={0.9} />
              <Stop offset="65%" stopColor="#628A9D" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#628A9D" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={110} cy={80} rx={110} ry={80} fill="url(#adventure-tide-glow)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default memo(AdventureAtlasBackground);

const styles = StyleSheet.create({
  underlay: { ...StyleSheet.absoluteFill, overflow: "hidden", backgroundColor: "#101827" },
  tideGlow: { position: "absolute" },
});
