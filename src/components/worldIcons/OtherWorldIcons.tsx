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

/** Nature & wildlife: an engraved, bilaterally symmetric hawk moth. */
export function NatureWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  // Drawing one wing pair and mirroring it keeps the pattern truly symmetric.
  const leftWing = (
    <G>
      <Path d="M24.5 18.4 C21.7 11.4 15.7 6.5 9.8 7.3
               C4.7 8 2.6 13.1 3.4 19.5 C4.3 25.4 11.4 29 23.2 30.4 Z"
        fill="url(#nature-moth-forewing)" stroke="#E9D4AE" strokeWidth={0.9} />
      <Path d="M23.4 26.9 C16 25 10.1 27.4 8.2 32.1
               C7.7 37 13.2 44.1 19.4 44.2 C23.4 42.1 25 36.5 25.1 29.6 Z"
        fill="url(#nature-moth-hindwing)" stroke="#E7D0AA" strokeWidth={0.83} />
      {/* Wing margins and scalloping echo biological field-guide engravings. */}
      <Path d="M5.4 13 Q10 11.5 14 15.1 Q18.1 18.5 23.8 21.5
               M5.5 20.9 Q13.7 22.3 23.5 27.9
               M9.6 31.1 Q15 31.1 23.9 32.5
               M12.8 39.4 Q18.1 38.8 23 35.6"
        fill="none" stroke="#F5E5C8" strokeWidth={0.7} opacity={0.8} />
      <Path d="M7.5 10.1 C13.1 9.2 18 14.7 21.3 20.7
               M6.2 17.7 C12.5 17.7 19 23 22.6 27.1
               M10.1 35.2 C15.9 34.1 21.6 36.4 23.8 38.5"
        fill="none" stroke="#5B7069" strokeWidth={1.2} opacity={0.72} />
      <Path d="M9.2 15.1 Q13 12.9 17.7 18.2 Q14.5 21.3 10.3 19.1 Z"
        fill="#BC8D62" opacity={0.78} />
      <Path d="M10.4 24.1 Q15.4 23.4 20.5 28.1 Q15.6 29.6 10.4 26.2 Z"
        fill="#8EA68C" opacity={0.8} />
      <Path d="M11.3 31.2 Q16.8 30.9 20.8 34 Q17.1 37.7 13.5 35.4 Z"
        fill="#BC8C65" opacity={0.85} />
      <Ellipse cx={11.7} cy={17.1} rx={3.2} ry={2.55} transform="rotate(27 11.7 17.1)"
        fill="#4E675F" stroke="#E3C69B" strokeWidth={0.85} />
      <Ellipse cx={11.8} cy={17.1} rx={1.4} ry={1.12}
        fill="#C5BDA0" stroke="#F3E7C9" strokeWidth={0.42} />
      <Ellipse cx={16} cy={34.7} rx={2.4} ry={1.8} transform="rotate(25 16 34.7)"
        fill="#6D7969" stroke="#E6CA9E" strokeWidth={0.56} />
      <G fill="#F7E9C9" opacity={0.85}>
        <Circle cx={7.5} cy={14} r={0.57} />
        <Circle cx={9} cy={23.8} r={0.52} />
        <Circle cx={13.6} cy={27.3} r={0.4} />
        <Circle cx={12.6} cy={37.9} r={0.5} />
        <Circle cx={18.5} cy={39.4} r={0.43} />
      </G>
    </G>
  );
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-nature">
      <Defs>
        <LinearGradient id="nature-moth-forewing" x1="5%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#E2D1AD" />
          <Stop offset="46%" stopColor="#A9A48D" />
          <Stop offset="100%" stopColor="#536E6A" />
        </LinearGradient>
        <LinearGradient id="nature-moth-hindwing" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#CFA77F" />
          <Stop offset="54%" stopColor="#937E6B" />
          <Stop offset="100%" stopColor="#596F66" />
        </LinearGradient>
        <LinearGradient id="nature-moth-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F3E2BB" />
          <Stop offset="52%" stopColor="#AE9475" />
          <Stop offset="100%" stopColor="#534F4D" />
        </LinearGradient>
      </Defs>
      {leftWing}
      <G transform="translate(52 0) scale(-1 1)">{leftWing}</G>
      {/* Antennae, velvet thorax and tapered, segmented abdomen. */}
      <Path d="M25 14.1 Q21.2 6.9 19.6 5.9 M27 14.1 Q30.8 6.9 32.4 5.9"
        stroke="#DFC69F" strokeWidth={1.15} strokeLinecap="round" fill="none" />
      <Circle cx={26} cy={14.8} r={3} fill="#C8AD88" stroke="#F5E1BD" strokeWidth={0.6} />
      <Path d="M22.8 18.9 Q26 15.2 29.2 18.9 L29.3 28 Q28.5 37.5 26 42.8
               Q23.5 37.5 22.7 28 Z"
        fill="url(#nature-moth-body)" stroke="#EEDBBC" strokeWidth={0.82} />
      <Path d="M26 19.4 V41.1 M23.3 26.5 Q26 28 28.7 26.5
               M23.6 30.9 Q26 32.5 28.4 30.9 M24.2 35.2 Q26 36.7 27.8 35.2"
        fill="none" stroke="#5F6258" strokeWidth={0.72} opacity={0.7} />
      <Path d="M24.1 20.3 Q26 18.1 27.9 20.3" stroke="#FAEAC9" strokeWidth={0.7} fill="none" />
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

/** Arts & culture: an original moonlit seascape in a gilded picture frame. */
export function CultureWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-culture">
      <Defs>
        <LinearGradient id="culture-night-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#132F55" />
          <Stop offset="55%" stopColor="#285775" />
          <Stop offset="100%" stopColor="#526477" />
        </LinearGradient>
        <LinearGradient id="culture-night-sea" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#516F87" />
          <Stop offset="100%" stopColor="#162E42" />
        </LinearGradient>
        <LinearGradient id="culture-frame-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F3D6A0" />
          <Stop offset="45%" stopColor="#B78C59" />
          <Stop offset="100%" stopColor="#5F4B42" />
        </LinearGradient>
        <LinearGradient id="culture-moon-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF3CA" />
          <Stop offset="100%" stopColor="#F0C883" />
        </LinearGradient>
      </Defs>
      {/* Carved wood-and-gilt bevel around an actual painted canvas. */}
      <Path d="M4.4 3.8 H47.6 V48.2 H4.4 Z" fill="#493E42"
        stroke="#D1AF7F" strokeWidth={0.9} />
      <Path d="M5.6 4.9 H46.4 L42.2 9.3 H9.8 Z"
        fill="url(#culture-frame-gold)" stroke="#F5DCB1" strokeWidth={0.58} />
      <Path d="M5.6 4.9 L9.8 9.3 V42.7 L5.6 47.1 Z"
        fill="#D3AF7B" stroke="#FFE4B5" strokeWidth={0.52} />
      <Path d="M46.4 4.9 L42.2 9.3 V42.7 L46.4 47.1 Z"
        fill="#78604B" stroke="#C7A171" strokeWidth={0.52} />
      <Path d="M5.6 47.1 L9.8 42.7 H42.2 L46.4 47.1 Z"
        fill="#916D4F" stroke="#DDB886" strokeWidth={0.5} />
      <Rect x={9.4} y={9} width={33.2} height={34.1}
        fill="url(#culture-night-sky)" stroke="#F3D4A1" strokeWidth={0.75} />
      {/* Flowing cloud shapes are original strokes rather than a reproduction. */}
      <Path d="M10.1 17.2 C17 11 20.8 17.5 27.2 14.4
               C31.4 12.4 35.6 11.1 41.8 13.8"
        stroke="#8BB4BE" strokeWidth={2.7} fill="none" opacity={0.65}
        strokeLinecap="round" />
      <Path d="M10.4 21.4 C18.6 14.6 22.5 25.9 29.2 20.2
               C34.6 15.9 38.3 18.9 41.6 21.2"
        stroke="#C2C3A5" strokeWidth={1.25} fill="none" opacity={0.72}
        strokeLinecap="round" />
      <Path d="M12.4 25 C16.2 21.3 20.5 22.4 22.9 25.3
               C25.2 28.1 20 30.7 17.9 27.9
               C16.7 26.2 18.8 24.8 20.1 26"
        stroke="#DBD1A6" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M28.4 28.4 C33.4 23.9 36.4 26 41.2 25.5
               M11.2 32.9 Q21.2 27.6 28.8 32.6"
        stroke="#9EC3BD" strokeWidth={1.35} fill="none" opacity={0.78}
        strokeLinecap="round" />
      {/* Crescent moon and constellations, deliberately distinct in composition. */}
      <Circle cx={34.2} cy={15.8} r={4.1} fill="url(#culture-moon-glow)" opacity={0.97} />
      <Path d="M33.5 11.4 C31.8 15.1 34 19.3 37.7 19.6
               C34.6 21.3 30.3 19.1 30.1 15.6 C29.9 13.1 31.1 11.6 33.5 11.4 Z"
        fill="#F6D8A1" opacity={0.76} />
      <G fill="#F9E8B6">
        <Circle cx={15.5} cy={13.8} r={1.3} />
        <Circle cx={25.6} cy={11.6} r={0.92} />
        <Circle cx={39.2} cy={24.5} r={0.8} />
      </G>
      <Path d="M15.5 11 V16.6 M12.8 13.8 H18.2 M25.6 9.7 V13.5
               M23.7 11.6 H27.5 M39.2 23 V26"
        stroke="#F6DDA7" strokeWidth={0.52} opacity={0.8} />
      {/* Dark shore and distant water keep the picture a unique seascape. */}
      <Path d="M9.9 35.4 Q18.6 32 24 35.2 Q31.9 33.3 42.1 35.4
               V42.4 H9.9 Z" fill="url(#culture-night-sea)" />
      <Path d="M9.9 38.2 L15 34.1 L20 37.3 L23 36.1 L29.2 40.2 L42.1 38.3 V42.4 H9.9 Z"
        fill="#1A3446" opacity={0.9} />
      <Path d="M11.1 36.3 Q18.8 34.7 24.1 36.1 M29 36.8 Q35 35 41 36.5
               M26.6 39.4 L36.8 39.1"
        fill="none" stroke="#E1BD82" strokeWidth={0.53} opacity={0.62} />
      <Path d="M7.5 6.7 H44.3 M7.3 45.4 H44.3"
        stroke="#FFE4B5" strokeWidth={0.57} opacity={0.62} />
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

/** Difficult history: a sealed archival case file with a discreet red stamp. */
export function DifficultHistoryWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  return (
    <Svg {...canvas(size, displayScale)} testID="home-world-art-difficult-history">
      <Defs>
        <LinearGradient id="difficult-history-folder" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#AD9780" />
          <Stop offset="53%" stopColor="#82776B" />
          <Stop offset="100%" stopColor="#4E5358" />
        </LinearGradient>
        <LinearGradient id="difficult-history-paper" x1="0%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#F0E5CF" />
          <Stop offset="100%" stopColor="#B9AD9B" />
        </LinearGradient>
        <LinearGradient id="difficult-history-flap" x1="0%" y1="0%" x2="100%" y2="90%">
          <Stop offset="0%" stopColor="#C5AD8D" />
          <Stop offset="100%" stopColor="#746859" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={26} cy={46.4} rx={21.8} ry={2.1} fill="#0A111C" opacity={0.35} />
      {/* Tucked case notes peek out above the folder: typed lines and a seal. */}
      <Path d="M17.5 6.7 L40.4 5.9 L41.3 30.7 L18.2 31.5 Z"
        fill="#7E746A" stroke="#CBBDA9" strokeWidth={0.5} />
      <Path d="M15.2 8.4 L38.2 7.1 L39.5 30.9 L16.9 32.3 Z"
        fill="url(#difficult-history-paper)" stroke="#F6E6C9" strokeWidth={0.72} />
      <Path d="M19.1 12.1 L32.3 11.4 M19.4 15 L35.4 14.1
               M19.8 18.1 L35.8 17.2 M20.1 21.1 L32.1 20.4
               M20.5 24.1 L35.2 23.3"
        fill="none" stroke="#766F69" strokeWidth={0.7} opacity={0.65} />
      <Rect x={20.3} y={26} width={9.5} height={1.25} rx={0.2}
        fill="#7E7772" opacity={0.43} transform="rotate(-3 20.3 26)" />
      <Circle cx={35} cy={26.1} r={2.2} fill="none" stroke="#85766A"
        strokeWidth={0.65} opacity={0.57} />
      {/* Heavy manila folder, projecting tab, folded corner, and layered shadow. */}
      <Path d="M4.1 15.9 H15.9 L19.8 19.9 H47.2 V42.9 H4.1 Z"
        fill="url(#difficult-history-folder)" stroke="#E2C7A6" strokeWidth={0.92} />
      <Path d="M4.5 16.8 H15.5 L18.5 20.7 H45.6"
        fill="none" stroke="#F3DFC0" strokeWidth={0.65} opacity={0.72} />
      <Path d="M3.7 25.3 L47.8 22.6 L46.2 45.4 H6.2 Z"
        fill="url(#difficult-history-flap)" stroke="#E6D0AD" strokeWidth={0.87}
        strokeLinejoin="round" />
      <Path d="M4.8 26.6 L46.4 24.4 M7.5 44.1 H45.1"
        fill="none" stroke="#F2DFC0" strokeWidth={0.55} opacity={0.69} />
      <Path d="M44.4 24.6 L46.4 24.4 L45.1 30.5 L41.8 28.8 Z"
        fill="#6E6256" opacity={0.7} />
      {/* Stamped classification mark: muted oxide red, not a bright alert badge. */}
      <G transform="rotate(-11 31 34)" opacity={0.84}>
        <Rect x={23.9} y={29.6} width={18.1} height={8.7} rx={0.4}
          fill="none" stroke="#A45E59" strokeWidth={1.18} />
        <Rect x={25.1} y={30.8} width={15.7} height={6.3}
          fill="none" stroke="#A45E59" strokeWidth={0.47} />
        <Path d="M26.5 34 H39.5 M28.1 32.5 L29.1 35.5 M31 32.5 V35.5
                 M33.3 32.5 L34.2 35.5 M36.1 32.5 L38.1 35.5"
          fill="none" stroke="#9E5550" strokeWidth={0.85} strokeLinecap="round" />
      </G>
      <Path d="M10.4 33.7 L18.3 33.2 M10.8 36.4 L18.1 36
               M11.3 39.2 L16.5 39"
        stroke="#514F4C" strokeWidth={0.67} opacity={0.55} />
      <Path d="M6.9 28.7 L7.5 31.2 L6.9 32.8 M43 41.6 L44.7 42.4"
        stroke="#4C4A49" strokeWidth={0.48} opacity={0.5} fill="none" />
    </Svg>
  );
}
