/**
 * The Parthenon — small, engraved stone landmark for the Αρχαία Ελλάδα island.
 * Eight front columns (as on the real Parthenon), a low triangular pediment,
 * weathered limestone, and a three-step stylobate.
 *
 * Pure React Native SVG geometry: no image request, filters, timers or motion.
 * Placed over the island plateau; never captures touch or accessibility focus.
 */
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

type Props = { size?: number };

const columns = [17, 26.4, 35.8, 45.2, 54.6, 64, 73.4, 82.8];

export default function AncientGreeceIslandIcon({ size = 64 }: Props) {
  return (
    <Svg testID="ancient-greece-parthenon-svg" width={size} height={size}
      viewBox="0 0 100 100" accessible={false} pointerEvents="none">
      <Defs>
        <LinearGradient id="parthenon-pediment" x1="5%" y1="2%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor="#FBEBCC" />
          <Stop offset="55%" stopColor="#CEB99A" />
          <Stop offset="100%" stopColor="#8F8580" />
        </LinearGradient>
        <LinearGradient id="parthenon-limestone" x1="0%" y1="0%" x2="100%" y2="12%">
          <Stop offset="0%" stopColor="#F5E4C3" />
          <Stop offset="39%" stopColor="#D7C4A3" />
          <Stop offset="100%" stopColor="#978A80" />
        </LinearGradient>
        <LinearGradient id="parthenon-recess" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#56626A" />
          <Stop offset="100%" stopColor="#243B45" />
        </LinearGradient>
        <LinearGradient id="parthenon-steps" x1="0%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#D1B995" />
          <Stop offset="55%" stopColor="#AE977D" />
          <Stop offset="100%" stopColor="#746F6E" />
        </LinearGradient>
      </Defs>

      {/* A low, grounded shadow lets the temple sit on the island plateau. */}
      <Ellipse cx={50} cy={87} rx={45} ry={5.2} fill="#081B27" opacity={0.36} />

      {/* Deep inner cella creates volume between the lit columns. */}
      <Rect x={13} y={41} width={74} height={35} fill="url(#parthenon-recess)" />
      <Path d="M 20 43 V 75 M 80 43 V 75" stroke="#E9D2AC"
        strokeOpacity={0.2} strokeWidth={1.1} />

      {/* Weathered triangular pediment and cornice. */}
      <Path d="M 7.7 35.6 L 50 12.8 L 92.3 35.6 Z"
        fill="url(#parthenon-pediment)" stroke="#F7E2BD" strokeWidth={1.1}
        strokeLinejoin="round" />
      <Path d="M 16 32.1 L 50 17.8 L 84 32.1 Z"
        fill="#6B7777" fillOpacity={0.36} stroke="#D9C6A8"
        strokeOpacity={0.55} strokeWidth={0.7} />
      {/* Tiny reliefs imply the sculpted tympanum without noisy details. */}
      <G fill="none" stroke="#F3DEB8" strokeOpacity={0.63} strokeWidth={1.1}
        strokeLinecap="round" strokeLinejoin="round">
        <Path d="M 46 29.6 L 48 23 L 52 23 L 54 29.6 M 50 23 V 19.8" />
        <Path d="M 37 30 L 40 26.5 L 43 30 M 57 30 L 60 26.5 L 63 30" />
        <Path d="M 26 31.4 H 32 M 68 31.4 H 74" />
      </G>
      <Path d="M 7 36.1 L 93 36.1 L 91.8 41.9 L 8.2 41.9 Z"
        fill="#E2CCAA" stroke="#FBE9C8" strokeWidth={0.8} />
      <Path d="M 9 38.5 H 91" stroke="#8A7E70" strokeWidth={0.8} opacity={0.73} />
      {/* Triglyph rhythm is characteristic of the Doric entablature. */}
      <G stroke="#8C8172" strokeWidth={1.5} opacity={0.7}>
        {columns.map(x => <Path key={"triglyph-" + x}
          d={`M ${x - 1.4} 37 V 40 M ${x + 1.4} 37 V 40`} />)}
      </G>

      {/* Eight fluted front columns; warm faces and cooler recessed edges. */}
      {columns.map((x, i) => (
        <G key={"col-" + i}>
          <Rect x={x - 4} y={42.4} width={8} height={3.2} rx={0.35}
            fill="#F5DDB6" stroke="#8F8170" strokeWidth={0.35} />
          <Rect x={x - 3} y={45.4} width={6} height={28.5} rx={0.55}
            fill="url(#parthenon-limestone)" stroke="#F8E6C9" strokeWidth={0.42} />
          <Path d={`M ${x - 1.55} 46 V 73 M ${x + 0.6} 46 V 73`}
            fill="none" stroke="#9B8F7E" strokeWidth={0.49} opacity={0.72} />
          <Path d={`M ${x - 2.15} 46 V 73`} stroke="#FFF0D2"
            strokeWidth={0.48} opacity={0.7} />
          <Rect x={x - 4.2} y={73.4} width={8.4} height={2.4} rx={0.2}
            fill="#BAA78E" stroke="#E8D3B3" strokeWidth={0.42} />
        </G>
      ))}

      {/* Three projecting foundation steps with slight perspective. */}
      <Path d="M 11 76 H 89 L 92 79 H 8 Z"
        fill="#C6B097" stroke="#E7D1B0" strokeWidth={0.67} />
      <Path d="M 8 79 H 92 L 95 82.4 H 5 Z"
        fill="url(#parthenon-steps)" stroke="#DAC4A1" strokeWidth={0.72} />
      <Path d="M 5 82.4 H 95 L 98 86.4 H 2 Z"
        fill="#928373" stroke="#D9BF97" strokeWidth={0.75} />
      <Path d="M 6 83.5 H 94 M 11 79.8 H 89"
        fill="none" stroke="#F7E0BD" strokeOpacity={0.64} strokeWidth={0.65} />

      {/* Tiny stone chips: aged and crafted, not a clean cartoon temple. */}
      <G stroke="#6E6C66" strokeWidth={0.65} opacity={0.65} fill="none">
        <Path d="M 27 24 L 29 26 L 28 28 M 74 37 L 76 38" />
        <Path d="M 20 80 L 24 80.8 M 70 84 L 75 83.7" />
      </G>
      <G fill="#F9E8C9" opacity={0.65}>
        <Circle cx={28} cy={29} r={0.5} />
        <Circle cx={67} cy={33} r={0.45} />
        <Circle cx={43} cy={82.5} r={0.5} />
      </G>
    </Svg>
  );
}
