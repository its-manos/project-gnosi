import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

type Props = { size?: number };

/**
 * A miniature architectural engraving for the whole History knowledge world.
 * The weathered arch and hourglass represent civilizations and the passage
 * of time without tying the category to one period or culture.
 *
 * Original local vector artwork. Designed for the 32-point Home 2.0 grid;
 * it adds no network requests, asset loading, animation or touch targets.
 */
export default function HistoryWorldIcon({ size = 32 }: Props) {
  return (
    <Svg testID="home-history-world-illustration" width={size} height={size}
      viewBox="0 0 52 52" accessible={false} pointerEvents="none">
      <Defs>
        <LinearGradient id="history-arch-stone" x1="0%" y1="0%" x2="100%" y2="95%">
          <Stop offset="0%" stopColor="#F0E0C0" />
          <Stop offset="49%" stopColor="#CDBD9C" />
          <Stop offset="100%" stopColor="#887E72" />
        </LinearGradient>
        <LinearGradient id="history-hourglass" x1="0%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#A9D6D0" stopOpacity={0.63} />
          <Stop offset="52%" stopColor="#406E78" stopOpacity={0.34} />
          <Stop offset="100%" stopColor="#223D4B" stopOpacity={0.8} />
        </LinearGradient>
        <LinearGradient id="history-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFDBA0" />
          <Stop offset="60%" stopColor="#CDA16A" />
          <Stop offset="100%" stopColor="#886447" />
        </LinearGradient>
      </Defs>

      {/* A recessed opening establishes silhouette even at small sizes. */}
      <Ellipse cx={26} cy={46.3} rx={20.3} ry={2.1} fill="#090F19" opacity={0.43} />
      <Path d="M12 41 V19.6 C12 10.8 17.2 7.3 26 7.3 C34.8 7.3 40 10.8 40 19.6 V41 Z"
        fill="#15252F" stroke="#6D756F" strokeWidth={0.55} opacity={0.9} />
      <Path
        d="M6.4 39.8 V19.6 C6.4 9.3 14.8 3.4 26 3.4 C37.2 3.4 45.6 9.3 45.6 19.6 V39.8
           H37.5 V19.6 C37.5 12.9 33.2 10.3 26 10.3 C18.8 10.3 14.5 12.9 14.5 19.6 V39.8 Z"
        fill="url(#history-arch-stone)" stroke="#F6E4C4" strokeWidth={0.82}
        strokeLinejoin="round" />

      {/* Inner bevels, vault masonry, joint seams and central keystone. */}
      <Path d="M8.5 38.3 V19.8 C8.5 10.4 16 5.6 26 5.6 C36 5.6 43.5 10.4 43.5 19.8 V38.3"
        fill="none" stroke="#FFF1D2" strokeWidth={0.65} opacity={0.7} />
      <Path d="M14.5 24 V19.6 C14.5 12.9 18.8 10.3 26 10.3 C33.2 10.3 37.5 12.9 37.5 19.6 V24"
        fill="none" stroke="#625D59" strokeWidth={0.7} opacity={0.8} />
      <Path d="M11.3 11.5 L16.6 15.2 M17.6 5.8 L20.1 11.3 M34.4 5.8 L31.9 11.3 M40.7 11.5 L35.4 15.2"
        stroke="#746E64" strokeWidth={0.72} fill="none" opacity={0.8} />
      <Path d="M22.4 3.7 H29.6 L28.5 10.7 H23.5 Z"
        fill="#E3CCA7" stroke="#FFF1CF" strokeWidth={0.5} />
      <Path d="M26 5.6 V8.5" stroke="#A88E70" strokeWidth={0.72} />
      <Rect x={9.5} y={21.4} width={2.5} height={16.8} fill="#887A67" opacity={0.46} />
      <Rect x={40} y={21.4} width={2.5} height={16.8} fill="#564F50" opacity={0.5} />
      <Path d="M9.6 28.4 H12 M9.6 34.5 H12 M40 28.4 H42.4 M40 34.5 H42.4"
        stroke="#FFF0D0" strokeWidth={0.45} opacity={0.53} />

      {/* Bronze-framed glass, two sand chambers and a narrow falling stream. */}
      <Path d="M20.2 19.1 C20.5 22.8 22.2 25.3 26 27.1
               C22.2 28.9 20.5 31.4 20.2 35 H31.8
               C31.5 31.4 29.8 28.9 26 27.1
               C29.8 25.3 31.5 22.8 31.8 19.1 Z"
        fill="url(#history-hourglass)" stroke="#B7D0C5" strokeWidth={0.72} />
      <Path d="M21.9 20.5 C22.5 23.3 24.1 25.3 26 26.2 C27.9 25.3 29.5 23.3 30.1 20.5 Z"
        fill="#E2C085" opacity={0.68} />
      <Path d="M22 33.5 Q26 29.6 30 33.5 Z" fill="#EBC68B" opacity={0.88} />
      <Path d="M26 26.5 V30.1" stroke="#F9D59A" strokeWidth={0.76} opacity={0.88} />
      <Path d="M22.1 21.4 C22.7 23.6 23.6 24.6 24.1 25.1 M22 32.3 L23.2 30.7"
        fill="none" stroke="#E2FCF0" strokeWidth={0.58} opacity={0.62} />
      <Path d="M18.7 17.9 H33.3 L34.2 19.6 H17.8 Z"
        fill="url(#history-bronze)" stroke="#FFE4B0" strokeWidth={0.55} />
      <Path d="M18.7 34.3 H33.3 L34.2 36 H17.8 Z"
        fill="url(#history-bronze)" stroke="#FFE4B0" strokeWidth={0.55} />
      <Path d="M19.5 19.5 V34.1 M32.5 19.5 V34.1"
        fill="none" stroke="#B78C59" strokeWidth={0.62} opacity={0.84} />

      {/* Weathered foundations echo the Ancient Greece landmark's masonry. */}
      <Path d="M5.9 39 H46.1 L47.6 42 H4.4 Z"
        fill="#9F927C" stroke="#E9D3B0" strokeWidth={0.7} />
      <Rect x={2.8} y={42} width={46.4} height={2.1} rx={0.34}
        fill="#D0BC99" stroke="#F8DFC0" strokeWidth={0.4} />
      <Rect x={1.5} y={44.3} width={49} height={1.6} rx={0.3}
        fill="#7C796D" />
      <Path d="M8.7 43 H17 M20 43 H32 M35 43 H43.2"
        fill="none" stroke="#FFF0CE" strokeWidth={0.56} opacity={0.72} />
      <Path d="M14 39.3 L16.5 40 M37 40.3 L39.3 39.7"
        stroke="#544D4A" strokeWidth={0.47} opacity={0.47} />
    </Svg>
  );
}
