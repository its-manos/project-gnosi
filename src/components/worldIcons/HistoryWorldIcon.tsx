import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from "react-native-svg";

type Props = { size?: number; displayScale?: number };

/**
 * A miniature weathered Egyptian limestone pyramid. Two distinct stone faces,
 * fitted courses and irregular masonry convey real volume at the Home 32pt size.
 * Purely decorative artwork: its enclosing card retains all interaction.
 */
export default function HistoryWorldIcon({ size = 32, displayScale = 1 }: Props) {
  return (
    <Svg testID="home-history-world-illustration" width={size} height={size}
      viewBox="0 0 52 52" accessible={false} pointerEvents="none"
      style={{ transform: [{ scale: displayScale }] }}>
      <Defs>
        <LinearGradient id="history-pyramid-sunlit" x1="8%" y1="2%" x2="92%" y2="95%">
          <Stop offset="0%" stopColor="#F5E7CB" />
          <Stop offset="44%" stopColor="#D5BE98" />
          <Stop offset="100%" stopColor="#9D8770" />
        </LinearGradient>
        <LinearGradient id="history-pyramid-shaded" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C6B296" />
          <Stop offset="54%" stopColor="#958370" />
          <Stop offset="100%" stopColor="#5D5E59" />
        </LinearGradient>
        <LinearGradient id="history-pyramid-stone" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EEDABA" />
          <Stop offset="100%" stopColor="#98836D" />
        </LinearGradient>
        <LinearGradient id="history-pyramid-sand" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C8A67A" />
          <Stop offset="100%" stopColor="#806A60" />
        </LinearGradient>
      </Defs>

      {/* The broad base and sharp apex must read as a pyramid even at 32pt. */}
      <Ellipse cx={27} cy={44.2} rx={23.2} ry={3.25} fill="#0B111B" opacity={0.35} />
      <Path d="M27 4.8 L48 40.8 L30.5 44.2 Z"
        fill="url(#history-pyramid-shaded)" stroke="#B8A88F" strokeWidth={0.82}
        strokeLinejoin="round" />
      <Path d="M27 4.8 L30.5 44.2 L5.2 42.2 Z"
        fill="url(#history-pyramid-sunlit)" stroke="#F4DEC0" strokeWidth={0.85}
        strokeLinejoin="round" />
      <Path d="M27 4.8 L30.5 44.2"
        stroke="#F4D7AC" strokeWidth={0.6} opacity={0.8} />

      {/* Slightly uneven, stacked courses define ancient cut limestone. */}
      <G fill="none" stroke="#786F62" strokeWidth={0.62} opacity={0.66}>
        <Path d="M22.4 12.8 L27.7 12.9 L31.9 13.2" />
        <Path d="M19.6 17.7 L28.1 17.9 L34.6 18.1" />
        <Path d="M16.8 22.5 L28.5 22.8 L37.4 23" />
        <Path d="M14 27.3 L28.9 27.7 L40.2 27.8" />
        <Path d="M11 32.3 L29.4 32.7 L43.1 32.8" />
        <Path d="M8.2 37.1 L29.9 37.5 L45.8 37.4" />
        <Path d="M5.9 41 L30.3 41.5 L48 40.8" />
      </G>
      <G fill="none" stroke="#FFF0D3" strokeWidth={0.46} opacity={0.7}>
        <Path d="M22.9 12.2 L27.6 12.4 M20 17.1 L27.9 17.3" />
        <Path d="M17.2 21.9 L28.4 22.2 M14.3 26.7 L28.8 27.1" />
        <Path d="M11.4 31.7 L29.3 32.1 M8.5 36.5 L29.8 36.9" />
      </G>
      {/* Alternating block joints, with most texture concentrated on lit face. */}
      <G stroke="#827462" strokeWidth={0.62} opacity={0.66} fill="none">
        <Path d="M25.7 12.9 L25.7 17.8 M22.1 17.8 L22.1 22.6
                 M26.3 22.7 L26.3 27.6 M18.3 22.5 L18.3 27.4
                 M16.3 27.3 L16.3 32.4 M23.8 27.5 L23.8 32.5
                 M12.8 32.4 L12.8 37.1 M20.1 32.5 L20.1 37.3
                 M26.8 32.7 L26.8 37.5 M10.4 37.3 L10.4 41.4
                 M16.1 37.2 L16.1 41.6 M23.5 37.4 L23.5 43.5" />
      </G>
      <G stroke="#5C5D56" strokeWidth={0.55} opacity={0.57} fill="none">
        <Path d="M30.5 18 L33.1 17.9 M32.6 22.9 L32.6 27.7
                 M35.2 27.8 L35.2 32.7 M39.5 32.7 L39.5 37.4
                 M34.3 37.6 L34.3 42.8 M42.7 37.4 L42.7 41.7" />
      </G>
      {/* Edge chips, mineral specks and hairline fractures keep it weathered. */}
      <Path d="M16.8 22.6 L17.6 24.1 L16.9 26.1 M23.4 32.7
               L24.3 34.2 L23.6 35.4 M40.1 27.8 L39.5 29.7"
        fill="none" stroke="#685F57" strokeWidth={0.48} opacity={0.68} />
      <Path d="M7.4 40.5 L9.2 39.9 L11.1 40.5 M19.5 42.7 L21.3 42.1 L23.3 42.9"
        fill="none" stroke="url(#history-pyramid-stone)" strokeWidth={1.05} opacity={0.83} />
      <G fill="#F8E7C6" opacity={0.68}>
        <Circle cx={23.5} cy={19.9} r={0.48} />
        <Circle cx={12.3} cy={34.2} r={0.54} />
        <Circle cx={26.9} cy={39.3} r={0.38} />
        <Circle cx={35.1} cy={30.2} r={0.42} />
        <Circle cx={40} cy={37} r={0.4} />
      </G>
      {/* Low desert ridge gives scale without introducing another subject. */}
      <Path d="M2.4 46.3 C9.9 44.3 14.5 45.2 19.7 46
               C27.5 47.1 36.8 44.2 49.6 45.6 L50.3 47.8
               C33.3 46.6 14.1 49.5 2.4 47.7 Z"
        fill="url(#history-pyramid-sand)" opacity={0.76} />
      <Path d="M4.3 46.4 Q13 45.3 20.4 46.6 M33.8 46.2 Q41.4 44.8 48.1 46"
        stroke="#F0D2A4" strokeWidth={0.55} opacity={0.73} fill="none" />
    </Svg>
  );
}
