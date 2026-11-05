/**
 * Παγκόσμια Ιστορία — antique globe engraved in bronze and midnight teal.
 * The cartographic globe is an illustration, not a geographic basemap.
 * Light, deterministic paths only; no filters, animation or network images.
 */
import Svg, {
  Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path,
  RadialGradient, Rect, Stop,
} from "react-native-svg";

type Props = { size?: number };

export default function WorldHistoryIslandIcon({ size = 64 }: Props) {
  return (
    <Svg testID="world-history-earth-svg" width={size} height={size}
      viewBox="0 0 100 100" accessible={false} pointerEvents="none">
      <Defs>
        <RadialGradient id="world-globe-ocean" cx="37%" cy="27%" rx="75%" ry="75%">
          <Stop offset="0%" stopColor="#86ADAE" />
          <Stop offset="45%" stopColor="#4C7B83" />
          <Stop offset="100%" stopColor="#254451" />
        </RadialGradient>
        <LinearGradient id="world-globe-land" x1="0%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#EEE0BD" />
          <Stop offset="50%" stopColor="#BAA987" />
          <Stop offset="100%" stopColor="#7C8B82" />
        </LinearGradient>
        <LinearGradient id="world-globe-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E7CFA4" />
          <Stop offset="50%" stopColor="#BCA17B" />
          <Stop offset="100%" stopColor="#736D69" />
        </LinearGradient>
        <ClipPath id="world-globe-clip">
          <Circle cx={50} cy={43} r={31} />
        </ClipPath>
      </Defs>

      {/* Supporting axis, circular meridian ring and engraved armillary mount. */}
      <Ellipse cx={50} cy={84.5} rx={30} ry={4.7} fill="#09212C" opacity={0.45} />
      <Path d="M 31 17 L 70 69" fill="none" stroke="#B7AE9A"
        strokeWidth={3.1} strokeLinecap="round" opacity={0.65} />
      <Circle cx={50} cy={43} r={34.3} stroke="#CAB79A"
        strokeWidth={2.1} fill="none" strokeOpacity={0.78} />
      <Circle cx={50} cy={43} r={31} fill="url(#world-globe-ocean)"
        stroke="#D4C7AD" strokeWidth={1.1} />
      <G clipPath="url(#world-globe-clip)">
        {/* Globe-facing landforms: Atlantic and European/African hemisphere.
            They are decorative outlines, deliberately simpler than the
            high-fidelity Natural Earth world background below the islands. */}
        <G fill="url(#world-globe-land)" stroke="#DDE0C6" strokeWidth={0.65}
          strokeOpacity={0.62} strokeLinejoin="round">
          <Path d="M 20 26 L 27 19 L 32 22 L 37 20 L 41 24 L 39 29 L 34 33 L 31 37 L 34 41 L 30 46 L 26 43 L 25 38 L 20 35 Z" />
          <Path d="M 31 43 L 36 42 L 43 47 L 44 54 L 40 60 L 39 69 L 34 73 L 32 64 L 28 57 L 29 49 Z" />
          <Path d="M 54 24 L 60 21 L 65 23 L 71 22 L 79 25 L 80 33 L 75 37 L 69 37 L 66 33 L 59 34 L 56 31 L 51 32 Z" />
          <Path d="M 55 36 L 63 34 L 72 39 L 72 48 L 67 55 L 64 63 L 60 68 L 57 62 L 55 56 L 51 49 L 51 42 Z" />
          <Path d="M 73 44 L 79 44 L 81 49 L 77 54 L 75 51 Z" />
          <Path d="M 76 61 L 82 59 L 87 65 L 81 69 L 75 66 Z" />
        </G>
        <G fill="none" stroke="#E2E6D5" strokeOpacity={0.23} strokeWidth={0.65}>
          <Path d="M 19 30 Q 50 24 81 30 M 19 43 Q 50 39 81 43 M 19 56 Q 50 61 81 56" />
          <Path d="M 50 12 C 31 29 31 56 50 74 M 50 12 C 69 29 69 56 50 74 M 50 12 V 74" />
        </G>
      </G>
      <Path d="M 28 24 Q 41 13 55 15" fill="none" stroke="#FAEED4"
        strokeWidth={1.8} strokeLinecap="round" opacity={0.4} />
      {/* Axis pivot, neck and a low circular brass foot anchor the globe. */}
      <Circle cx={50} cy={77} r={2.3} fill="#D3BB93" stroke="#F5E2BD" strokeWidth={0.5} />
      <Path d="M 49 76 V 82 M 51 76 V 82" stroke="#D6BC95" strokeWidth={1.7} />
      <Path d="M 38 82.2 L 62 82.2 L 69 86 H 31 Z"
        fill="url(#world-globe-brass)" stroke="#ECD5B0" strokeWidth={0.8} />
      <Rect x={29} y={86} width={42} height={2.8} rx={1.1}
        fill="#857D70" stroke="#CFB58E" strokeWidth={0.75} />
      <Path d="M 37 86.9 H 63" stroke="#F4E0C2" opacity={0.58} strokeWidth={0.6} />
    </Svg>
  );
}
