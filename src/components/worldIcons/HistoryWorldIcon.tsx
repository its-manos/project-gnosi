import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

type Props = { size?: number; displayScale?: number };

/**
 * A weathered stone sarcophagus with a sculpted narrative frieze.
 * The recessed relief, heavy lid, and side face make it recognizable
 * at Home's 32pt footprint without changing the parent card.
 */
export default function HistoryWorldIcon({ size = 32, displayScale = 1 }: Props) {
  return (
    <Svg testID="home-history-world-illustration" width={size} height={size}
      viewBox="0 0 52 52" accessible={false} pointerEvents="none"
      style={{ transform: [{ scale: displayScale }] }}>
      <Defs>
        <LinearGradient id="history-sarcophagus-lid" x1="5%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#F0E2C7" />
          <Stop offset="48%" stopColor="#BEAE93" />
          <Stop offset="100%" stopColor="#716C65" />
        </LinearGradient>
        <LinearGradient id="history-sarcophagus-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DFCEB2" />
          <Stop offset="48%" stopColor="#AB9C88" />
          <Stop offset="100%" stopColor="#706C64" />
        </LinearGradient>
        <LinearGradient id="history-sarcophagus-side" x1="0%" y1="0%" x2="100%" y2="90%">
          <Stop offset="0%" stopColor="#958A79" />
          <Stop offset="100%" stopColor="#504F4C" />
        </LinearGradient>
        <LinearGradient id="history-sarcophagus-relief" x1="0%" y1="0%" x2="60%" y2="100%">
          <Stop offset="0%" stopColor="#F3E4C8" />
          <Stop offset="100%" stopColor="#A79782" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={25.6} cy={45.8} rx={22.4} ry={3.1} fill="#071018" opacity={0.38} />
      {/* The coffin has a visible right-hand side, not just a flat tablet. */}
      <Path d="M43.1 20.5 L48.1 16.9 V39.8 L43.1 44 Z"
        fill="url(#history-sarcophagus-side)" stroke="#C7B49A" strokeWidth={0.7} />
      <Path d="M6.4 20.7 L43.2 20.7 V43.6 L6.4 43.6 Z"
        fill="url(#history-sarcophagus-front)" stroke="#F4DDBB" strokeWidth={0.84} />
      <Rect x={8.7} y={24.1} width={32.5} height={16.3} rx={0.7}
        fill="#887D6D" stroke="#E5D1B1" strokeWidth={0.68} />
      <Rect x={10} y={25.5} width={29.8} height={13.4} rx={0.35}
        fill="#A99B85" stroke="#554E49" strokeWidth={0.42} />
      {/* Three small, genuinely carved figures; relief depth comes from paired highlights/shadows. */}
      <G fill="url(#history-sarcophagus-relief)" stroke="#6E675D" strokeWidth={0.43} strokeLinejoin="round">
        <Path d="M13.5 35.9 L13.9 30.4 L16.1 28.7 L18.2 30.5 L18.5 35.9 L20 37.5 H12 Z" />
        <Path d="M22.5 36.5 L22.3 31.5 L24.4 28.8 L27.1 30.8 L28.7 36.4 L30 37.3 H21.1 Z" />
        <Path d="M32.3 36 L32.4 30.5 L34.4 28.8 L36.8 30.8 L37.3 36.4 L38.6 37.4 H30.9 Z" />
      </G>
      <G fill="#E9D9BC" stroke="#766D60" strokeWidth={0.5}>
        <Circle cx={16} cy={28.5} r={1.45} />
        <Circle cx={24.6} cy={28.8} r={1.5} />
        <Circle cx={34.4} cy={28.7} r={1.4} />
      </G>
      <Path d="M15.9 30.7 V35.2 M24.7 31.2 L23.8 35.8 M34.5 31.1 L35.5 35.7
               M12.4 37 H19.5 M21 37.2 H29.5 M31 37.2 H38.4"
        stroke="#FFF0D4" strokeWidth={0.6} opacity={0.68} fill="none" />
      <Path d="M11.1 26.3 H38.5 M11.1 39.2 H38.5"
        stroke="#F1DFC0" strokeWidth={0.5} opacity={0.63} />
      {/* Lid overhang and raised end blocks are a sarcophagus-specific silhouette. */}
      <Path d="M4.9 19.7 L10.6 12.6 L42 12.6 L48.7 19.7 L43.6 22.4 H7.1 Z"
        fill="url(#history-sarcophagus-lid)" stroke="#F4DFC1" strokeWidth={0.83}
        strokeLinejoin="round" />
      <Path d="M10.6 12.6 L8.1 9.5 L13.8 9.1 L15.5 12.6 M36.6 12.6 L38.8 9.1 L44 9.6 L42 12.6"
        fill="#C5B397" stroke="#F1DEC0" strokeWidth={0.7} />
      <Path d="M7 19.7 H47.8 M11.3 15.2 H41.2 M10.4 17.7 H43.8"
        stroke="#FFF1D6" strokeWidth={0.56} fill="none" opacity={0.72} />
      <Path d="M15.1 15.1 Q18.7 13.1 22.3 15.1 Q26 17.2 29.7 15.1 Q33.5 13.1 37.8 15.1"
        stroke="#7D756A" strokeWidth={0.66} fill="none" opacity={0.65} />
      <Path d="M43.6 22.4 L48.7 19.7 M43.2 40 L47.6 36.4 M6.6 22.8 H43"
        stroke="#716B60" strokeWidth={0.6} opacity={0.73} />
      {/* Fine cracks, pits and uneven mineral deposits convey age without noise. */}
      <Path d="M7.8 27.6 L9 29.1 L8.4 32.5 M40.8 32 L39.4 33.6 L40.7 35.7
               M17 20.1 L18.4 21.4 L18.1 23.3 M33.3 17.2 L34.7 18"
        fill="none" stroke="#5B5D58" strokeWidth={0.5} opacity={0.5} />
      <G fill="#F9ECD3" opacity={0.5}>
        <Circle cx={8.7} cy={35.1} r={0.48} />
        <Circle cx={39.9} cy={27.6} r={0.52} />
        <Circle cx={29.9} cy={21.3} r={0.35} />
        <Circle cx={11.7} cy={16.8} r={0.4} />
      </G>
      <Path d="M5.2 43.3 H43.8 L49.1 40.3 L49.2 43.2 L43.8 46 H5.2 Z"
        fill="#786F63" stroke="#CBB79A" strokeWidth={0.65} />
      <Path d="M6 43.4 H43.5 M43.8 43.4 L48.8 40.6"
        fill="none" stroke="#F2DEBD" strokeWidth={0.62} opacity={0.78} />
    </Svg>
  );
}
