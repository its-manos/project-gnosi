import Svg, {
  Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop,
} from "react-native-svg";

export type WorldIconProps = { size?: number; displayScale?: number };

// All worlds use the same engraved 52-unit canvas as History. The scale is
// purely visual: the 32pt Home card layout and tap target do not expand.
function canvas(size: number, displayScale: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 52 52",
    accessible: false,
    pointerEvents: "none" as const,
    style: { transform: [{ scale: displayScale }] },
  };
}

/** Science & space: a brass astronomical orrery with three orbiting bodies. */
export function ScienceWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-science">
      <Defs>
        <LinearGradient id="science-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE3AE" />
          <Stop offset="52%" stopColor="#C6A16D" />
          <Stop offset="100%" stopColor="#826C5C" />
        </LinearGradient>
        <LinearGradient id="science-blue" x1="15%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#C1D9F6" />
          <Stop offset="51%" stopColor="#718EB6" />
          <Stop offset="100%" stopColor="#394D81" />
        </LinearGradient>
        <LinearGradient id="science-star" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF2C9" />
          <Stop offset="58%" stopColor="#E8BA78" />
          <Stop offset="100%" stopColor="#A86C56" />
        </LinearGradient>
      </Defs>
      {/* Open orbital construction: fine engraved rings with visible inclination. */}
      <Ellipse cx={26} cy={23.5} rx={18.4} ry={8.6}
        fill="none" stroke="#D3BD98" strokeWidth={0.93}
        strokeOpacity={0.84} transform="rotate(-32 26 23.5)" />
      <Ellipse cx={26} cy={23.5} rx={17.8} ry={9.1}
        fill="none" stroke="#7E9EBC" strokeWidth={0.75}
        strokeOpacity={0.85} transform="rotate(37 26 23.5)" />
      <Ellipse cx={26} cy={23.5} rx={21} ry={13.6}
        fill="none" stroke="#D0B18C" strokeWidth={0.5}
        strokeOpacity={0.48} transform="rotate(-10 26 23.5)" />
      <Path d="M26 7.3 V40.8 M7.1 23.5 H44.9" stroke="#C4B391"
        strokeWidth={0.44} strokeOpacity={0.34} />
      {/* Three materials, three planetary sizes. */}
      <Circle cx={26} cy={23.5} r={5.35} fill="url(#science-star)"
        stroke="#FFF2C7" strokeWidth={0.68} />
      <Path d="M22.4 21.2 C23.6 19.2 25.4 18.4 27.2 18.7"
        stroke="#FFF5D9" strokeWidth={0.95} strokeLinecap="round" fill="none" opacity={0.8} />
      <Circle cx={12.2} cy={15.5} r={3.65} fill="url(#science-blue)"
        stroke="#DBE9F6" strokeWidth={0.68} />
      <Path d="M10.4 14.2 Q12.4 12.6 14.1 14.4"
        fill="none" stroke="#EFF4FF" strokeWidth={0.63} opacity={0.75} />
      <Circle cx={39.2} cy={30.2} r={2.55} fill="#A8C3BD"
        stroke="#E5E5C8" strokeWidth={0.7} />
      <Circle cx={39.8} cy={29.5} r={0.62} fill="#F6E7C6" opacity={0.8} />
      {/* Instrument pedestal connects the celestial mechanism to a real object. */}
      <Path d="M25.5 28.8 V39.5 M27.3 28.8 V39.5"
        stroke="#A18A72" strokeWidth={1.75} strokeLinecap="round" />
      <Path d="M26.4 32.4 L18 38.5 M26.4 32.4 L34.6 38.5"
        stroke="#E0C297" strokeWidth={1.05} strokeLinecap="round" />
      <Path d="M20 39.2 H32 L35 42.2 H17 Z"
        fill="url(#science-brass)" stroke="#FFE0B0" strokeWidth={0.65} />
      <Rect x={13.7} y={42.2} width={24.6} height={2.1} rx={0.5}
        fill="#AA8C6A" stroke="#F6DCB0" strokeWidth={0.55} />
      <Path d="M17.4 43.2 H34.4" stroke="#FFEACA" strokeWidth={0.52} opacity={0.65} />
      <Path d="M8.4 8.2 V12.4 M6.3 10.3 H10.5"
        stroke="#C8D6E2" strokeWidth={0.68} opacity={0.63} />
    </Svg>
  );
}

/** Nature & animals: a branching fern and a small copper-toned moth. */
export function NatureWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-nature">
      <Defs>
        <LinearGradient id="nature-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A8CBA5" />
          <Stop offset="55%" stopColor="#548F79" />
          <Stop offset="100%" stopColor="#2E6059" />
        </LinearGradient>
        <LinearGradient id="nature-moth" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F1DFC3" />
          <Stop offset="55%" stopColor="#BEA482" />
          <Stop offset="100%" stopColor="#816D68" />
        </LinearGradient>
      </Defs>
      {/* One coherent, curved leaf spine keeps the fern legible at icon size. */}
      <Path d="M21.2 43.4 C24.5 36.4 25.2 25.4 26.7 10.3"
        stroke="#C6DBAC" strokeWidth={1.36} fill="none" strokeLinecap="round" />
      <Path d="M25.8 13.5 Q17 9.4 15.9 5.6 Q24.5 6.7 26.5 11.2 Z"
        fill="url(#nature-leaf)" stroke="#C5D9B5" strokeWidth={0.65} />
      <Path d="M24.8 19 Q15.4 16.5 11.3 11.1 Q20 10.8 25.1 16.2 Z"
        fill="url(#nature-leaf)" stroke="#BED9AB" strokeWidth={0.68} />
      <Path d="M24.4 24.7 Q14.1 23.4 8.1 18.1 Q17.8 16.7 24.6 22 Z"
        fill="url(#nature-leaf)" stroke="#C8DCB5" strokeWidth={0.66} />
      <Path d="M24 30.8 Q13.4 30.7 6.7 25.4 Q17.8 24.6 24.4 28 Z"
        fill="url(#nature-leaf)" stroke="#B2D2A9" strokeWidth={0.68} />
      <Path d="M23.5 36.6 Q14.7 36.9 9.5 33.9 Q17.4 32.1 23.8 33.8 Z"
        fill="url(#nature-leaf)" stroke="#BED3A6" strokeWidth={0.65} />
      <Path d="M26.2 16.9 Q32 10.3 34.2 9.5 Q33.9 17.4 25.5 20.7 Z"
        fill="#629C7D" stroke="#B7D7AA" strokeWidth={0.65} />
      <Path d="M25.2 23 Q34.2 16.1 37.6 16.2 Q36 24 24.8 26.6 Z"
        fill="#4D8874" stroke="#BBCE9D" strokeWidth={0.65} />
      <Path d="M24.5 28.8 Q33.4 23 39.1 23.2 Q35.3 30.3 24.1 32 Z"
        fill="#4E8877" stroke="#B4CEAC" strokeWidth={0.67} />
      <Path d="M23.6 34.5 Q31.8 30.8 37.2 31.5 Q32.6 37.2 22.9 38.1 Z"
        fill="#3C796B" stroke="#A9C79D" strokeWidth={0.62} />
      {/* Short vein engravings carry the same handcrafted detail as the temple. */}
      <Path d="M25 18 L15.9 13.3 M24.4 24 L12.5 20.1 M23.9 30.1 L11.6 27.7
               M25.3 23.6 L34.1 18.7 M24.6 29.3 L35.1 25.9 M23.6 35.2 L32.5 33.1"
        stroke="#D5E9BA" strokeWidth={0.52} opacity={0.75} fill="none" />
      {/* A delicate moth silhouette signals wildlife, not just botany. */}
      <Path d="M37.6 10.6 C35.1 8.2 34.8 4.8 36 3.5 C40.1 4 42.6 6.6 41 11.9 Z"
        fill="url(#nature-moth)" stroke="#F1DEBC" strokeWidth={0.63} />
      <Path d="M39.8 11.4 Q44.7 7.6 47.4 10.5 Q47.2 15.6 40.3 14.9 Z"
        fill="#B9A88A" stroke="#F1DEBC" strokeWidth={0.65} />
      <Path d="M38.6 11.7 Q34.5 12.1 35.1 16.2 Q39.2 17.6 40 13.5 Z"
        fill="#9A816B" stroke="#E2C9A5" strokeWidth={0.5} />
      <Path d="M39.5 8.5 Q41.3 5 43.2 5.1 M39.5 9.2 Q38.2 6.6 37.5 6.5"
        stroke="#E6D3AC" strokeWidth={0.52} fill="none" />
      <Path d="M39 10.3 L40 16.4" stroke="#624F4F" strokeWidth={0.9} strokeLinecap="round" />
      <Circle cx={37.8} cy={8.3} r={0.95} fill="#E7D4B6" opacity={0.85} />
      <Path d="M18.2 43.8 Q25.2 42 30 44.5"
        stroke="#C5AA84" strokeWidth={0.85} fill="none" opacity={0.64} />
    </Svg>
  );
}

/** Technology: a perspective-finished ceramic chip with gold circuit traces. */
export function TechnologyWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-technology">
      <Defs>
        <LinearGradient id="technology-chip" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#80AAB8" />
          <Stop offset="46%" stopColor="#476D83" />
          <Stop offset="100%" stopColor="#243C59" />
        </LinearGradient>
        <LinearGradient id="technology-metal" x1="0%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#E7DFCC" />
          <Stop offset="55%" stopColor="#B0B8BB" />
          <Stop offset="100%" stopColor="#707D90" />
        </LinearGradient>
      </Defs>
      {/* Fine conductive paths are deliberately behind the central core. */}
      <G stroke="#CEAC79" strokeWidth={1.12} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 19 H8 L5.6 15.6 H3.3" />
        <Path d="M15 26 H4.1" />
        <Path d="M15 33 H9 L5.5 37 H3" />
        <Path d="M37 19 H43 L46.2 15.4 H49" />
        <Path d="M37 26 H48.7" />
        <Path d="M37 33 H43 L46.4 37.1 H49" />
        <Path d="M20 15 V7.3 L17.1 4.5" />
        <Path d="M26 15 V3.4" />
        <Path d="M32 15 V7.3 L35.2 4.5" />
        <Path d="M20 37 V44.5 L17.1 47.7" />
        <Path d="M26 37 V48.4" />
        <Path d="M32 37 V44.5 L35.1 47.7" />
      </G>
      <G fill="#EAD0A0" stroke="#FFF0C4" strokeWidth={0.3}>
        <Circle cx={3.3} cy={15.6} r={1.35} />
        <Circle cx={4.1} cy={26} r={1.2} />
        <Circle cx={3} cy={37} r={1.2} />
        <Circle cx={49} cy={15.4} r={1.3} />
        <Circle cx={48.7} cy={26} r={1.15} />
        <Circle cx={49} cy={37.1} r={1.25} />
        <Circle cx={17.1} cy={4.5} r={1.05} />
        <Circle cx={26} cy={3.4} r={1.2} />
        <Circle cx={35.2} cy={4.5} r={1.05} />
        <Circle cx={17.1} cy={47.7} r={1.05} />
        <Circle cx={26} cy={48.4} r={1.2} />
        <Circle cx={35.1} cy={47.7} r={1.05} />
      </G>
      {/* Beveled ceramic package; no flat emoji-like silhouette. */}
      <Path d="M17.2 13.5 H34.8 L40 18.8 V34 L34.8 39.4 H17.2 L12 34 V18.8 Z"
        fill="#1B3245" stroke="#E4C99C" strokeWidth={1.15} />
      <Path d="M17.7 15.6 H34.2 L37.6 19.2 V33.6 L34.2 37.3 H17.7 L14.3 33.6 V19.2 Z"
        fill="url(#technology-chip)" stroke="url(#technology-metal)" strokeWidth={1.07} />
      <Path d="M18.7 18 H33.3 L35.1 19.8 V32.8 L33.3 34.8 H18.7 L16.8 32.8 V19.8 Z"
        fill="#1B2D49" stroke="#A6D4D2" strokeWidth={0.67} />
      <Path d="M19 20.4 H33 M19 31.9 H33"
        stroke="#7CB5BB" strokeWidth={0.6} strokeOpacity={0.7} />
      {/* Miniature processor die and pathways under a bright protective lens. */}
      <Rect x={21.2} y={21.3} width={9.7} height={9.7} rx={1.15}
        fill="#3D768C" stroke="#DBE6DC" strokeWidth={0.87} />
      <Rect x={23.9} y={23.9} width={4.4} height={4.4} rx={0.45}
        fill="#B8D6C3" stroke="#F4EFCF" strokeWidth={0.42} />
      <Path d="M26.1 22.3 V19.3 M22.2 26.2 H18.6 M30 26.2 H33.6 M26.1 30.1 V33.2"
        stroke="#E2CC9E" strokeWidth={0.67} />
      <Path d="M17.2 15.9 L19.4 14.2 M32.7 37.7 L35.4 35"
        stroke="#FFEDD1" strokeWidth={0.7} opacity={0.64} />
    </Svg>
  );
}

/** Arts & culture: a carved marble bust and a gold-ferruled paintbrush. */
export function CultureWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-culture">
      <Defs>
        <LinearGradient id="culture-marble" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F7E8D9" />
          <Stop offset="49%" stopColor="#C6BED0" />
          <Stop offset="100%" stopColor="#857E9F" />
        </LinearGradient>
        <LinearGradient id="culture-cloth" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C4B7CB" />
          <Stop offset="65%" stopColor="#7E788E" />
          <Stop offset="100%" stopColor="#565471" />
        </LinearGradient>
        <LinearGradient id="culture-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE4BC" />
          <Stop offset="100%" stopColor="#B58963" />
        </LinearGradient>
      </Defs>
      {/* A sculpted profile has face, hairline, neck and a draped torso. */}
      <Path d="M17.9 36 C17.1 32.9 18.2 29.4 21.9 27.7 L21.9 24.9
               C18.9 23.7 17.9 20.8 17.9 16.3
               C17.9 10 22.4 6.5 28.1 7
               C34.3 7.7 36.5 13.1 35 18.6
               C34.7 20.2 34.4 21.2 33.1 22.2
               C30.9 23.5 29.7 25.2 29.8 27.3
               C34.2 29.4 37.2 31.6 38.1 36.8 Z"
        fill="url(#culture-marble)" stroke="#FFEAD9" strokeWidth={0.8} />
      <Path d="M16.4 37.2 C17.1 32.3 21.1 29.9 23 28.5
               C25.2 31.2 28.6 31.9 32.2 29.1
               C36.5 31.4 39 33.5 40.1 37.2 Z"
        fill="url(#culture-cloth)" stroke="#EBDBD3" strokeWidth={0.68} />
      <Path d="M22.5 29.4 Q27.1 33.9 32.7 29.4 M20.4 34.5 L24 37.2 M33 33.2 L29.8 37.1"
        stroke="#E8DAD7" strokeWidth={0.64} strokeOpacity={0.67} fill="none" />
      {/* Uneven curls, brow, temple and nose highlight. */}
      <Path d="M18.4 18.3 C17.8 13.1 21.2 7.3 25.7 6.3
               C30.8 5.1 36.3 9.4 35.6 15.3
               C34.7 13.7 33.1 13.7 32.4 11.3
               C28.4 15 23.7 13.4 21.3 17.3 Z"
        fill="#9A8F9F" stroke="#E5D9DD" strokeWidth={0.64} />
      <Path d="M20 11.9 Q23 7.9 26.6 9.7 M26 8.5 Q30.6 8.6 32.1 12.7
               M20.1 15.1 L19 19.2 M34.2 14.7 Q34.9 17.2 34 19.4"
        fill="none" stroke="#F0E4E4" strokeWidth={0.68} opacity={0.65} />
      <Path d="M29.3 17.7 L32.2 17.3 M31.3 19.2 L33.2 21.5 L31 21.7 M29.8 23.4 Q31.9 24.2 33 23.3"
        stroke="#7D7689" strokeWidth={0.57} fill="none" strokeLinecap="round" />
      <Circle cx={30.8} cy={17.9} r={0.42} fill="#716E81" />
      {/* Museum pedestal and small carved inscriptions. */}
      <Path d="M15 37.3 H41.5 L43.1 40.5 H13.4 Z"
        fill="#A69BA5" stroke="#F1E2D5" strokeWidth={0.7} />
      <Rect x={13.2} y={40.5} width={30} height={3.1} rx={0.4}
        fill="#8C8398" stroke="#E6D6D7" strokeWidth={0.75} />
      <Rect x={10.8} y={43.7} width={34} height={2.4} rx={0.35}
        fill="#5D5974" stroke="#C9B9B7" strokeWidth={0.63} />
      <Path d="M18 42 H38" stroke="#EDE1DC" strokeWidth={0.46} opacity={0.7} />
      {/* Brush held diagonally beside the sculpture; warm pigment at its tip. */}
      <Path d="M6.8 36.1 L14.4 24.4 L16.4 25.8 L9.2 37.8 Z"
        fill="#A46E59" stroke="#FFE4B4" strokeWidth={0.6} />
      <Path d="M13.4 23.1 L16.4 25.3 L18.1 22.8 L15.4 20.8 Z"
        fill="url(#culture-brass)" stroke="#FFF0C8" strokeWidth={0.52} />
      <Path d="M15.6 21.1 Q15 17.9 18 15.4 Q20.1 18.8 18.1 22.2 Z"
        fill="#946183" stroke="#D5A5B5" strokeWidth={0.48} />
      <Path d="M7.8 35.9 L13.9 26.7" stroke="#E2AE87" strokeWidth={0.5} opacity={0.69} />
    </Svg>
  );
}

/** Geography & society: a tilted terrestrial globe on a brass meridian. */
export function GeographyWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-geography">
      <Defs>
        <LinearGradient id="geography-sea" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8ABDC0" />
          <Stop offset="50%" stopColor="#386F85" />
          <Stop offset="100%" stopColor="#203F68" />
        </LinearGradient>
        <LinearGradient id="geography-land" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4D7A4" />
          <Stop offset="62%" stopColor="#95A986" />
          <Stop offset="100%" stopColor="#587D79" />
        </LinearGradient>
        <LinearGradient id="geography-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE3A9" />
          <Stop offset="60%" stopColor="#C4A47A" />
          <Stop offset="100%" stopColor="#8D725C" />
        </LinearGradient>
      </Defs>
      {/* Meridian ring, with a clear metallic rim behind the sphere. */}
      <Ellipse cx={25.6} cy={22.7} rx={19.5} ry={21.3} transform="rotate(23 25.6 22.7)"
        stroke="#D6B383" strokeWidth={1.8} fill="none" opacity={0.86} />
      <Ellipse cx={25.6} cy={22.7} rx={17.9} ry={19.8} transform="rotate(23 25.6 22.7)"
        stroke="#FFF0CB" strokeWidth={0.58} fill="none" opacity={0.68} />
      {/* Sphere is an ocean disc with geographic relief rather than an emoji. */}
      <Circle cx={26} cy={22.6} r={15.65} fill="url(#geography-sea)"
        stroke="#DDE6DA" strokeWidth={0.9} />
      <Path d="M15.3 12.4 C17.8 9.1 21.1 8.5 25.2 9.2
               L26.5 12.3 L23.6 14.4 L22.7 18.5
               L18.3 19.2 L17.1 23.9 L13.7 23.5
               L11.5 19.7 Z"
        fill="url(#geography-land)" stroke="#C5D7A8" strokeWidth={0.55} />
      <Path d="M27.1 16.2 L32.4 13.1 L37.4 15.1 L40.4 20.1
               L37 22.9 L34.7 26.8 L30.7 26 L28.1 22.7
               L25.4 20.6 Z"
        fill="#8EA992" stroke="#D6DCB6" strokeWidth={0.48} />
      <Path d="M22.9 25.9 L28.4 26.6 L30 30 L27.7 36.2
               L24.5 36.7 L22.5 31.7 L19.4 29.4 Z"
        fill="#82A188" stroke="#C4D0AC" strokeWidth={0.48} />
      <Path d="M12.5 22.6 H39.5 M26 7 V38.2"
        stroke="#D1EBE3" strokeWidth={0.4} strokeOpacity={0.48} fill="none" />
      <Path d="M17.4 10.7 C12.3 20.4 17.1 32.2 24.2 38
               M32.2 8.9 C40.8 15.4 39.3 30 31.7 36.5"
        stroke="#C9E3DF" strokeWidth={0.45} strokeOpacity={0.5} fill="none" />
      <Path d="M13.4 15.3 Q26 20.2 38.5 14.7 M11.6 28.5 Q25 23.6 39 29.1"
        stroke="#D2E4E1" strokeWidth={0.43} strokeOpacity={0.46} fill="none" />
      <Path d="M13.5 13.1 Q15.4 10.3 18.2 9.9"
        stroke="#F5F7E1" strokeWidth={0.9} opacity={0.76} fill="none" />
      {/* Turned base and compass axis echo antique cartography instruments. */}
      <Path d="M26 39.1 V43.1 M17.6 43.5 H34.4 L36.2 45.7 H15.8 Z"
        fill="url(#geography-brass)" stroke="#EFD8B0" strokeWidth={0.85} />
      <Rect x={12.7} y={45.7} width={26.6} height={2} rx={0.4}
        fill="#AA8C6F" stroke="#EFD9B3" strokeWidth={0.53} />
      <Path d="M25.6 1.6 V5.4 M25.6 39.8 V42.6"
        stroke="#F4D4A6" strokeWidth={1.15} strokeLinecap="round" />
      <Circle cx={25.6} cy={3.4} r={1.2} fill="#FFE6B6" />
    </Svg>
  );
}

/** Difficult history: an archival lantern illuminating documented testimony. */
export function DifficultHistoryWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-difficult-history">
      <Defs>
        <LinearGradient id="difficult-history-copper" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E6D1AE" />
          <Stop offset="53%" stopColor="#AD8E78" />
          <Stop offset="100%" stopColor="#635C65" />
        </LinearGradient>
        <LinearGradient id="difficult-history-glass" x1="0%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0%" stopColor="#F8DCA0" stopOpacity={0.83} />
          <Stop offset="54%" stopColor="#C0A77A" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#625C60" stopOpacity={0.88} />
        </LinearGradient>
        <LinearGradient id="difficult-history-paper" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F0E5CD" />
          <Stop offset="100%" stopColor="#BCA98F" />
        </LinearGradient>
      </Defs>
      {/* Closed book and evidence notes keep the theme human and respectful. */}
      <Path d="M8 35.9 Q16.4 33.6 25.2 37.3 L25.2 45
               Q16.5 42.3 8 44.6 Z"
        fill="url(#difficult-history-paper)" stroke="#F5E6CC" strokeWidth={0.72} />
      <Path d="M25.2 37.3 Q34.2 33.6 43.3 35.9 V44.6
               Q34.5 42.4 25.2 45 Z"
        fill="#B3A58F" stroke="#EBDCC3" strokeWidth={0.72} />
      <Path d="M7 37 V46.7 Q16.7 44.1 25.2 47.1 Q35 44.3 44.6 46.7 V37"
        stroke="#A7866C" strokeWidth={1.13} fill="none" strokeLinejoin="round" />
      <Path d="M11.3 39.2 L19.1 40.6 M10.7 41.8 L20.9 43.2
               M30.4 40.3 L40.3 38.9 M30.1 43.3 L40 41.6"
        stroke="#766E66" strokeWidth={0.59} strokeOpacity={0.69} fill="none" />
      {/* Lantern: modest warm light, not flames or sensational symbolism. */}
      <Path d="M21.7 14.7 C21.7 12.5 23.5 10.5 26 10.5
               C28.5 10.5 30.3 12.5 30.3 14.7"
        fill="none" stroke="#D9BD93" strokeWidth={1.65} strokeLinecap="round" />
      <Path d="M23.8 10.5 V8.3 C23.8 5.3 28.2 5.3 28.2 8.3 V10.5"
        stroke="#C7A889" strokeWidth={1.2} fill="none" />
      <Path d="M20.5 16.5 L23.2 12.9 H28.8 L31.5 16.5 Z"
        fill="url(#difficult-history-copper)" stroke="#FFE4BD" strokeWidth={0.75} />
      <Path d="M22 16.9 H30 L31.7 32.7 H20.3 Z"
        fill="url(#difficult-history-glass)" stroke="#E0C5A2" strokeWidth={1.2} />
      <Path d="M23.5 17.7 L22.3 31.5 M28.5 17.7 L29.7 31.5"
        stroke="#FFF0C6" strokeWidth={0.57} opacity={0.69} />
      <Path d="M20.6 17 H31.4 M20.9 30.9 H31.1"
        stroke="#6D5B61" strokeWidth={0.75} />
      <Path d="M25.9 19.6 V28.1 M22.8 25.7 Q25.8 21.3 29.3 25.7"
        fill="none" stroke="#F2D79D" strokeWidth={0.64} opacity={0.83} />
      <Path d="M26 19.4 Q28.9 23.2 27.3 26.5 Q26.3 28 24.7 26.7
               Q23.3 24.4 26 19.4 Z"
        fill="#F5D493" stroke="#FFF1C7" strokeWidth={0.52} opacity={0.8} />
      <Path d="M19.6 32.8 H32.4 L34.1 35.1 H17.9 Z"
        fill="url(#difficult-history-copper)" stroke="#E6D0A9" strokeWidth={0.75} />
      <Rect x={19.5} y={35.1} width={13} height={1.5} rx={0.25}
        fill="#8B7770" stroke="#DECBAA" strokeWidth={0.5} />
      {/* Faint archival seal; deliberate, low-contrast engraved detail. */}
      <Circle cx={37.5} cy={30} r={3.3} fill="none" stroke="#B9A38B"
        strokeWidth={0.72} strokeOpacity={0.5} />
      <Path d="M36.1 30.1 L37.4 31.2 L39.4 28.9"
        stroke="#B9A38B" strokeWidth={0.72} fill="none" opacity={0.65} />
      <Path d="M14.1 12.5 L12.4 10.7 M38.5 12.5 L40.2 10.7"
        stroke="#D5BB97" strokeWidth={0.62} opacity={0.5} />
    </Svg>
  );
}
