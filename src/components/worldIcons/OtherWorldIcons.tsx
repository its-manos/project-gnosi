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
      <Path d="M26 7.3V40.8M7.1 23.5H44.9" stroke="#C4B391"
        strokeWidth={0.44} strokeOpacity={0.34} />
      {/* Three materials, three planetary sizes. */}
      <Circle cx={26} cy={23.5} r={5.35} fill="url(#science-star)"
        stroke="#FFF2C7" strokeWidth={0.68} />
      <Path d="M22.4 21.2c1.2-2 3-2.8 4.8-2.5"
        stroke="#FFF5D9" strokeWidth={0.95} strokeLinecap="round" fill="none" opacity={0.8} />
      <Circle cx={12.2} cy={15.5} r={3.65} fill="url(#science-blue)"
        stroke="#DBE9F6" strokeWidth={0.68} />
      <Path d="M10.4 14.2q2-1.6 3.7.2"
        fill="none" stroke="#EFF4FF" strokeWidth={0.63} opacity={0.75} />
      <Circle cx={39.2} cy={30.2} r={2.55} fill="#A8C3BD"
        stroke="#E5E5C8" strokeWidth={0.7} />
      <Circle cx={39.8} cy={29.5} r={0.62} fill="#F6E7C6" opacity={0.8} />
      {/* Instrument pedestal connects the celestial mechanism to a real object. */}
      <Path d="M25.5 28.8v10.7m1.8-10.7v10.7"
        stroke="#A18A72" strokeWidth={1.75} strokeLinecap="round" />
      <Path d="M26.4 32.4 18 38.5m8.4-6.1 8.2 6.1"
        stroke="#E0C297" strokeWidth={1.05} strokeLinecap="round" />
      <Path d="M20 39.2h12l3 3H17Z"
        fill="url(#science-brass)" stroke="#FFE0B0" strokeWidth={0.65} />
      <Rect x={13.7} y={42.2} width={24.6} height={2.1} rx={0.5}
        fill="#AA8C6A" stroke="#F6DCB0" strokeWidth={0.55} />
      <Path d="M17.4 43.2h17" stroke="#FFEACA" strokeWidth={0.52} opacity={0.65} />
      <Path d="M8.4 8.2v4.2m-2.1-2.1h4.2"
        stroke="#C8D6E2" strokeWidth={0.68} opacity={0.63} />
    </Svg>
  );
}

/** Nature & wildlife: an engraved, bilaterally symmetric hawk moth. */
export function NatureWorldIcon({ size = 32, displayScale = 1 }: WorldIconProps) {
  // Drawing one wing pair and mirroring it keeps the pattern truly symmetric.
  const leftWing = (
    <G>
      <Path d="M24.5 18.4c-2.8-7-8.8-11.9-14.7-11.1-5.1.7-7.2 5.8-6.4 12.2.9 5.9 8 9.5 19.8 10.9Z"
        fill="url(#nature-moth-forewing)" stroke="#E9D4AE" strokeWidth={0.9} />
      <Path d="M23.4 26.9c-7.4-1.9-13.3.5-15.2 5.2-.5 4.9 5 12 11.2 12.1 4-2.1 5.6-7.7 5.7-14.6Z"
        fill="url(#nature-moth-hindwing)" stroke="#E7D0AA" strokeWidth={0.83} />
      {/* Wing margins and scalloping echo biological field-guide engravings. */}
      <Path d="M5.4 13q4.6-1.5 8.6 2.1 4.1 3.4 9.8 6.4m-18.3-.6q8.2 1.4 18 7M9.6 31.1q5.4 0 14.3 1.4m-11.1 6.9q5.3-.6 10.2-3.8"
        fill="none" stroke="#F5E5C8" strokeWidth={0.7} opacity={0.8} />
      <Path d="M7.5 10.1c5.6-.9 10.5 4.6 13.8 10.6m-15.1-3c6.3 0 12.8 5.3 16.4 9.4m-12.5 8.1c5.8-1.1 11.5 1.2 13.7 3.3"
        fill="none" stroke="#5B7069" strokeWidth={1.2} opacity={0.72} />
      <Path d="M9.2 15.1q3.8-2.2 8.5 3.1-3.2 3.1-7.4.9Z"
        fill="#BC8D62" opacity={0.78} />
      <Path d="M10.4 24.1q5-.7 10.1 4-4.9 1.5-10.1-1.9Z"
        fill="#8EA68C" opacity={0.8} />
      <Path d="M11.3 31.2q5.5-.3 9.5 2.8-3.7 3.7-7.3 1.4Z"
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
      <Path d="M25 14.1q-3.8-7.2-5.4-8.2m7.4 8.2q3.8-7.2 5.4-8.2"
        stroke="#DFC69F" strokeWidth={1.15} strokeLinecap="round" fill="none" />
      <Circle cx={26} cy={14.8} r={3} fill="#C8AD88" stroke="#F5E1BD" strokeWidth={0.6} />
      <Path d="M22.8 18.9q3.2-3.7 6.4 0l.1 9.1q-.8 9.5-3.3 14.8-2.5-5.3-3.3-14.8Z"
        fill="url(#nature-moth-body)" stroke="#EEDBBC" strokeWidth={0.82} />
      <Path d="M26 19.4v21.7m-2.7-14.6q2.7 1.5 5.4 0m-5.1 4.4q2.4 1.6 4.8 0m-4.2 4.3q1.8 1.5 3.6 0"
        fill="none" stroke="#5F6258" strokeWidth={0.72} opacity={0.7} />
      <Path d="M24.1 20.3q1.9-2.2 3.8 0" stroke="#FAEAC9" strokeWidth={0.7} fill="none" />
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
        <Path d="M15 19H8L5.6 15.6H3.3" />
        <Path d="M15 26H4.1" />
        <Path d="M15 33H9L5.5 37H3" />
        <Path d="M37 19h6l3.2-3.6H49" />
        <Path d="M37 26H48.7" />
        <Path d="M37 33h6l3.4 4.1H49" />
        <Path d="M20 15V7.3L17.1 4.5" />
        <Path d="M26 15V3.4" />
        <Path d="M32 15V7.3l3.2-2.8" />
        <Path d="M20 37v7.5l-2.9 3.2" />
        <Path d="M26 37V48.4" />
        <Path d="M32 37v7.5l3.1 3.2" />
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
      <Path d="M17.2 13.5h17.6l5.2 5.3V34l-5.2 5.4H17.2L12 34V18.8Z"
        fill="#1B3245" stroke="#E4C99C" strokeWidth={1.15} />
      <Path d="M17.7 15.6h16.5l3.4 3.6v14.4l-3.4 3.7H17.7l-3.4-3.7V19.2Z"
        fill="url(#technology-chip)" stroke="url(#technology-metal)" strokeWidth={1.07} />
      <Path d="M18.7 18h14.6l1.8 1.8v13l-1.8 2H18.7l-1.9-2v-13Z"
        fill="#1B2D49" stroke="#A6D4D2" strokeWidth={0.67} />
      <Path d="M19 20.4H33M19 31.9H33"
        stroke="#7CB5BB" strokeWidth={0.6} strokeOpacity={0.7} />
      {/* Miniature processor die and pathways under a bright protective lens. */}
      <Rect x={21.2} y={21.3} width={9.7} height={9.7} rx={1.15}
        fill="#3D768C" stroke="#DBE6DC" strokeWidth={0.87} />
      <Rect x={23.9} y={23.9} width={4.4} height={4.4} rx={0.45}
        fill="#B8D6C3" stroke="#F4EFCF" strokeWidth={0.42} />
      <Path d="M26.1 22.3v-3m-3.9 6.9h-3.6m11.4 0h3.6m-7.5 3.9v3.1"
        stroke="#E2CC9E" strokeWidth={0.67} />
      <Path d="m17.2 15.9 2.2-1.7m13.3 23.5 2.7-2.7"
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
      <Path d="M4.4 3.8H47.6V48.2H4.4Z" fill="#493E42"
        stroke="#D1AF7F" strokeWidth={0.9} />
      <Path d="M5.6 4.9H46.4L42.2 9.3H9.8Z"
        fill="url(#culture-frame-gold)" stroke="#F5DCB1" strokeWidth={0.58} />
      <Path d="M5.6 4.9L9.8 9.3V42.7L5.6 47.1Z"
        fill="#D3AF7B" stroke="#FFE4B5" strokeWidth={0.52} />
      <Path d="m46.4 4.9-4.2 4.4v33.4l4.2 4.4Z"
        fill="#78604B" stroke="#C7A171" strokeWidth={0.52} />
      <Path d="m5.6 47.1 4.2-4.4h32.4l4.2 4.4Z"
        fill="#916D4F" stroke="#DDB886" strokeWidth={0.5} />
      <Rect x={9.4} y={9} width={33.2} height={34.1}
        fill="url(#culture-night-sky)" stroke="#F3D4A1" strokeWidth={0.75} />
      {/* Flowing cloud shapes are original strokes rather than a reproduction. */}
      <Path d="M10.1 17.2c6.9-6.2 10.7.3 17.1-2.8 4.2-2 8.4-3.3 14.6-.6"
        stroke="#8BB4BE" strokeWidth={2.7} fill="none" opacity={0.65}
        strokeLinecap="round" />
      <Path d="M10.4 21.4c8.2-6.8 12.1 4.5 18.8-1.2 5.4-4.3 9.1-1.3 12.4 1"
        stroke="#C2C3A5" strokeWidth={1.25} fill="none" opacity={0.72}
        strokeLinecap="round" />
      <Path d="M12.4 25c3.8-3.7 8.1-2.6 10.5.3 2.3 2.8-2.9 5.4-5 2.6-1.2-1.7.9-3.1 2.2-1.9"
        stroke="#DBD1A6" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M28.4 28.4c5-4.5 8-2.4 12.8-2.9m-30 7.4q10-5.3 17.6-.3"
        stroke="#9EC3BD" strokeWidth={1.35} fill="none" opacity={0.78}
        strokeLinecap="round" />
      {/* Crescent moon and constellations, deliberately distinct in composition. */}
      <Circle cx={34.2} cy={15.8} r={4.1} fill="url(#culture-moon-glow)" opacity={0.97} />
      <Path d="M33.5 11.4c-1.7 3.7.5 7.9 4.2 8.2-3.1 1.7-7.4-.5-7.6-4-.2-2.5 1-4 3.4-4.2"
        fill="#F6D8A1" opacity={0.76} />
      <G fill="#F9E8B6">
        <Circle cx={15.5} cy={13.8} r={1.3} />
        <Circle cx={25.6} cy={11.6} r={0.92} />
        <Circle cx={39.2} cy={24.5} r={0.8} />
      </G>
      <Path d="M15.5 11v5.6m-2.7-2.8h5.4m7.4-4.1v3.8m-1.9-1.9h3.8M39.2 23v3"
        stroke="#F6DDA7" strokeWidth={0.52} opacity={0.8} />
      {/* Dark shore and distant water keep the picture a unique seascape. */}
      <Path d="M9.9 35.4q8.7-3.4 14.1-.2 7.9-1.9 18.1.2v7H9.9Z" fill="url(#culture-night-sea)" />
      <Path d="m9.9 38.2 5.1-4.1 5 3.2 3-1.2 6.2 4.1 12.9-1.9v4.1H9.9Z"
        fill="#1A3446" opacity={0.9} />
      <Path d="M11.1 36.3q7.7-1.6 13-.2m4.9.7q6-1.8 12-.3m-14.4 2.9 10.2-.3"
        fill="none" stroke="#E1BD82" strokeWidth={0.53} opacity={0.62} />
      <Path d="M7.5 6.7h36.8m-37 38.7h37"
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
      <Path d="M15.3 12.4c2.5-3.3 5.8-3.9 9.9-3.2l1.3 3.1-2.9 2.1-.9 4.1-4.4.7-1.2 4.7-3.4-.4-2.2-3.8Z"
        fill="url(#geography-land)" stroke="#C5D7A8" strokeWidth={0.55} />
      <Path d="m27.1 16.2 5.3-3.1 5 2 3 5-3.4 2.8-2.3 3.9-4-.8-2.6-3.3-2.7-2.1Z"
        fill="#8EA992" stroke="#D6DCB6" strokeWidth={0.48} />
      <Path d="m22.9 25.9 5.5.7L30 30l-2.3 6.2-3.2.5-2-5-3.1-2.3Z"
        fill="#82A188" stroke="#C4D0AC" strokeWidth={0.48} />
      <Path d="M12.5 22.6h27M26 7v31.2"
        stroke="#D1EBE3" strokeWidth={0.4} strokeOpacity={0.48} fill="none" />
      <Path d="M17.4 10.7c-5.1 9.7-.3 21.5 6.8 27.3m8-29.1c8.6 6.5 7.1 21.1-.5 27.6"
        stroke="#C9E3DF" strokeWidth={0.45} strokeOpacity={0.5} fill="none" />
      <Path d="M13.4 15.3q12.6 4.9 25.1-.6M11.6 28.5q13.4-4.9 27.4.6"
        stroke="#D2E4E1" strokeWidth={0.43} strokeOpacity={0.46} fill="none" />
      <Path d="M13.5 13.1q1.9-2.8 4.7-3.2"
        stroke="#F5F7E1" strokeWidth={0.9} opacity={0.76} fill="none" />
      {/* Turned base and compass axis echo antique cartography instruments. */}
      <Path d="M26 39.1v4m-8.4.4h16.8l1.8 2.2H15.8Z"
        fill="url(#geography-brass)" stroke="#EFD8B0" strokeWidth={0.85} />
      <Rect x={12.7} y={45.7} width={26.6} height={2} rx={0.4}
        fill="#AA8C6F" stroke="#EFD9B3" strokeWidth={0.53} />
      <Path d="M25.6 1.6v3.8m0 34.4v2.8"
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
      <Path d="m17.5 6.7 22.9-.8.9 24.8-23.1.8Z"
        fill="#7E746A" stroke="#CBBDA9" strokeWidth={0.5} />
      <Path d="m15.2 8.4 23-1.3 1.3 23.8-22.6 1.4Z"
        fill="url(#difficult-history-paper)" stroke="#F6E6C9" strokeWidth={0.72} />
      <Path d="m19.1 12.1 13.2-.7M19.4 15l16-.9m-15.6 4 16-.9m-15.7 3.9 12-.7m-11.6 3.7 14.7-.8"
        fill="none" stroke="#766F69" strokeWidth={0.7} opacity={0.65} />
      <Rect x={20.3} y={26} width={9.5} height={1.25} rx={0.2}
        fill="#7E7772" opacity={0.43} transform="rotate(-3 20.3 26)" />
      <Circle cx={35} cy={26.1} r={2.2} fill="none" stroke="#85766A"
        strokeWidth={0.65} opacity={0.57} />
      {/* Heavy manila folder, projecting tab, folded corner, and layered shadow. */}
      <Path d="M4.1 15.9h11.8l3.9 4h27.4v23H4.1Z"
        fill="url(#difficult-history-folder)" stroke="#E2C7A6" strokeWidth={0.92} />
      <Path d="M4.5 16.8h11l3 3.9h27.1"
        fill="none" stroke="#F3DFC0" strokeWidth={0.65} opacity={0.72} />
      <Path d="m3.7 25.3 44.1-2.7-1.6 22.8h-40Z"
        fill="url(#difficult-history-flap)" stroke="#E6D0AD" strokeWidth={0.87}
        strokeLinejoin="round" />
      <Path d="m4.8 26.6 41.6-2.2M7.5 44.1h37.6"
        fill="none" stroke="#F2DFC0" strokeWidth={0.55} opacity={0.69} />
      <Path d="m44.4 24.6 2-.2-1.3 6.1-3.3-1.7Z"
        fill="#6E6256" opacity={0.7} />
      {/* Stamped classification mark: muted oxide red, not a bright alert badge. */}
      <G transform="rotate(-11 31 34)" opacity={0.84}>
        <Rect x={23.9} y={29.6} width={18.1} height={8.7} rx={0.4}
          fill="none" stroke="#A45E59" strokeWidth={1.18} />
        <Rect x={25.1} y={30.8} width={15.7} height={6.3}
          fill="none" stroke="#A45E59" strokeWidth={0.47} />
        <Path d="M26.5 34h13m-11.4-1.5 1 3m1.9-3v3m2.3-3 .9 3m1.9-3 2 3"
          fill="none" stroke="#9E5550" strokeWidth={0.85} strokeLinecap="round" />
      </G>
      <Path d="m10.4 33.7 7.9-.5m-7.5 3.2 7.3-.4m-6.8 3.2 5.2-.2"
        stroke="#514F4C" strokeWidth={0.67} opacity={0.55} />
      <Path d="m6.9 28.7.6 2.5-.6 1.6M43 41.6l1.7.8"
        stroke="#4C4A49" strokeWidth={0.48} opacity={0.5} fill="none" />
    </Svg>
  );
}
