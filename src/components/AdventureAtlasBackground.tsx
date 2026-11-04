/** A uniform, bounded cartographic underlay for long lesson maps.
 * A few deterministic paths are drawn once; only one translucent SVG layer
 * drifts on the UI thread. No asset downloads, scroll listeners or redraw loops.
 */
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

type Props = { width: number; height: number };
type Band = { x: number; y: number; direction: number; index: number };
const BAND_STEP = 460;

function coastline(band: Band) {
  const { x, y, direction: d } = band;
  return "M " + x + " " + (y - 240) +
    " C " + (x + d * 52) + " " + (y - 165) +
    " " + (x - d * 12) + " " + (y - 108) +
    " " + (x + d * 38) + " " + (y - 28) +
    " S " + (x + d * 4) + " " + (y + 130) +
    " " + (x + d * 42) + " " + (y + 235);
}

function contour(band: Band, inset: number) {
  const { x, y, direction: d } = band;
  const start = x + d * inset;
  return "M " + start + " " + (y - 245) +
    " C " + (start + d * 48) + " " + (y - 152) +
    " " + (start + d * 5) + " " + (y - 90) +
    " " + (start + d * 48) + " " + (y - 10) +
    " S " + (start + d * 12) + " " + (y + 135) +
    " " + (start + d * 39) + " " + (y + 230);
}

export default function AdventureAtlasBackground({ width, height }: Props) {
  const reduced = useReducedMotion();
  const wave = useSharedValue(-4);
  const bands = useMemo<Band[]>(() => Array.from(
    { length: Math.ceil(height / BAND_STEP) + 1 },
    (_, index) => ({
      index, y: 80 + index * BAND_STEP,
      x: Math.round(width * (index % 2 === 0 ? 0.05 : 0.95)),
      direction: index % 2 === 0 ? 1 : -1,
    }),
  ), [width, height]);
  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.52 + (wave.value + 4) * 0.012,
    transform: [{ translateX: wave.value }],
  }));

  useEffect(() => {
    cancelAnimation(wave);
    if (reduced) { wave.value = 0; return; }
    wave.value = withRepeat(withSequence(
      withTiming(4, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-4, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(wave);
  }, [reduced, wave]);

  return (
    <View pointerEvents="none" accessible={false} style={styles.underlay}>
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          <LinearGradient id="adventure-atlas-ground" x1="0%" x2="100%" y1="0%" y2="0%">
            <Stop offset="0%" stopColor="#111A29" />
            <Stop offset="50%" stopColor="#111625" />
            <Stop offset="100%" stopColor="#171828" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#adventure-atlas-ground)" />
        {bands.map(band => {
          const compassX = Math.round(width * (band.direction === 1 ? 0.85 : 0.15));
          const compassY = band.y + 105;
          return <G key={"atlas-" + band.index}>
            <Path d={coastline(band)} fill="none" stroke="#A59BB4" strokeWidth={1.4} opacity={0.19} />
            {[18, 42, 67].map(inset =>
              <Path key={inset} d={contour(band, inset)} fill="none"
                stroke="#7786A0" strokeWidth={1} opacity={0.17 - inset * 0.0007} />)}
            <Circle cx={compassX} cy={compassY} r={20} fill="none"
              stroke="#9A8FAE" strokeWidth={0.8} opacity={0.15} />
            <Circle cx={compassX} cy={compassY} r={3} fill="none"
              stroke="#9A8FAE" strokeWidth={0.8} opacity={0.2} />
            <Path d={"M " + compassX + " " + (compassY - 26) +
              " V " + (compassY + 26) + " M " + (compassX - 26) + " " + compassY +
              " H " + (compassX + 26)} stroke="#9A8FAE" opacity={0.13}
              strokeWidth={0.7} fill="none" />
          </G>;
        })}
      </Svg>
      {/* One UI-thread composited layer, not dozens of individually animated paths. */}
      <Animated.View pointerEvents="none" style={[styles.waveLayer, waveStyle]}>
        <Svg width={width + 16} height={height} pointerEvents="none">
          {bands.map(band =>
            <Path key={"atlas-wave-" + band.index}
              d={contour({ ...band, x: band.x + 8 }, 29)} fill="none"
              stroke="#AEA7CD" opacity={0.3} strokeWidth={1.15} />)}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  underlay: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  waveLayer: { position: "absolute", top: 0, left: -8 },
});
