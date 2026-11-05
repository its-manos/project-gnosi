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
      <Path d="m27 4.8 21 36-17.5 3.4Z"
        fill="url(#history-pyramid-shaded)" stroke="#B8A88F" strokeWidth={0.82}
        strokeLinejoin="round" />
      <Path d="m27 4.8 3.5 39.4-25.3-2Z"
        fill="url(#history-pyramid-sunlit)" stroke="#F4DEC0" strokeWidth={0.85}
        strokeLinejoin="round" />
      <Path d="m27 4.8 3.5 39.4"
        stroke="#F4D7AC" strokeWidth={0.6} opacity={0.8} />

      {/* Slightly uneven, stacked courses define ancient cut limestone. */}
      <G fill="none" stroke="#786F62" strokeWidth={0.62} opacity={0.66}>
        <Path d="m22.4 12.8 5.3.1 4.2.3" />
        <Path d="m19.6 17.7 8.5.2 6.5.2" />
        <Path d="m16.8 22.5 11.7.3 8.9.2" />
        <Path d="m14 27.3 14.9.4 11.3.1" />
        <Path d="m11 32.3 18.4.4 13.7.1" />
        <Path d="m8.2 37.1 21.7.4 15.9-.1" />
        <Path d="m5.9 41 24.4.5 17.7-.7" />
      </G>
      <G fill="none" stroke="#FFF0D3" strokeWidth={0.46} opacity={0.7}>
        <Path d="m22.9 12.2 4.7.2M20 17.1l7.9.2" />
        <Path d="m17.2 21.9 11.2.3m-14.1 4.5 14.5.4" />
        <Path d="m11.4 31.7 17.9.4M8.5 36.5l21.3.4" />
      </G>
      {/* Alternating block joints, with most texture concentrated on lit face. */}
      <G stroke="#827462" strokeWidth={0.62} opacity={0.66} fill="none">
        <Path d="M25.7 12.9v4.9m-3.6 0v4.8m4.2.1v4.9m-8-5.1v4.9m-2-.1v5.1m7.5-4.9v5m-11-.1v4.7m7.3-4.6v4.8m6.7-4.6v4.8m-16.4-.2v4.1m5.7-4.2v4.4m7.4-4.2v6.1" />
      </G>
      <G stroke="#5C5D56" strokeWidth={0.55} opacity={0.57} fill="none">
        <Path d="m30.5 18 2.6-.1m-.5 5v4.8m2.6.1v4.9m4.3 0v4.7m-5.2.2v5.2m8.4-5.4v4.3" />
      </G>
      {/* Edge chips, mineral specks and hairline fractures keep it weathered. */}
      <Path d="m16.8 22.6.8 1.5-.7 2m6.5 6.6.9 1.5-.7 1.2m16.5-7.6-.6 1.9"
        fill="none" stroke="#685F57" strokeWidth={0.48} opacity={0.68} />
      <Path d="m7.4 40.5 1.8-.6 1.9.6m8.4 2.2 1.8-.6 2 .8"
        fill="none" stroke="url(#history-pyramid-stone)" strokeWidth={1.05} opacity={0.83} />
      <G fill="#F8E7C6" opacity={0.68}>
        <Circle cx={23.5} cy={19.9} r={0.48} />
        <Circle cx={12.3} cy={34.2} r={0.54} />
        <Circle cx={26.9} cy={39.3} r={0.38} />
        <Circle cx={35.1} cy={30.2} r={0.42} />
        <Circle cx={40} cy={37} r={0.4} />
      </G>
      {/* Low desert ridge gives scale without introducing another subject. */}
      <Path d="M2.4 46.3c7.5-2 12.1-1.1 17.3-.3 7.8 1.1 17.1-1.8 29.9-.4l.7 2.2c-17-1.2-36.2 1.7-47.9-.1Z"
        fill="url(#history-pyramid-sand)" opacity={0.76} />
      <Path d="M4.3 46.4q8.7-1.1 16.1.2m13.4-.4q7.6-1.4 14.3-.2"
        stroke="#F0D2A4" strokeWidth={0.55} opacity={0.73} fill="none" />
    </Svg>
  );
}
