/** Fixed-viewport Aegean atlas for the Adventure Path.
 * All geometry is local SVG: no oversized bitmap, remote fetch or per-frame
 * path generation. The viewBox matches the measured aspect ratio exactly.
 */
import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText,
} from "react-native-svg";

type Props = { width: number; height: number };
type Isle = { x: number; y: number; rx: number; ry: number; turn: number };

// A deliberately uneven shore, not an ellipse: islands should read as land.
function islandOutline(rx: number, ry: number) {
  return [
    "M", -rx, -ry * 0.16,
    "Q", -rx * 1.12, -ry * 0.62, -rx * 0.37, -ry,
    "L", rx * 0.21, -ry * 0.91,
    "Q", rx * 0.82, -ry * 0.66, rx * 0.73, -ry * 0.25,
    "L", rx, ry * 0.27,
    "Q", rx * 0.74, ry * 0.92, rx * 0.17, ry,
    "L", -rx * 0.61, ry * 0.74,
    "Q", -rx * 0.91, ry * 0.33, -rx, -ry * 0.16, "Z",
  ].join(" ");
}

function AdventureAtlasBackground({ width, height }: Props) {
  const reduced = useReducedMotion();
  const tide = useSharedValue(-1);
  // 420 map-units wide at every device width, with an exact aspect-ratio
  // match. No aspectFill, crop or non-uniform stretch on either platform.
  const h = height * 420 / width;
  const geography = useMemo(() => {
    const west = `M 0 0 H 179
      C 167 ${h * .045} 190 ${h * .09} 151 ${h * .13}
      Q 125 ${h * .16} 144 ${h * .195}
      C 105 ${h * .23} 130 ${h * .265} 94 ${h * .30}
      Q 116 ${h * .33} 82 ${h * .365}
      C 62 ${h * .405} 108 ${h * .43} 67 ${h * .475}
      Q 97 ${h * .505} 70 ${h * .555}
      C 58 ${h * .60} 20 ${h * .63} 0 ${h * .665} Z`;
    const east = `M 420 0 H 320
      Q 326 ${h * .06} 302 ${h * .105}
      C 336 ${h * .145} 299 ${h * .19} 331 ${h * .235}
      Q 301 ${h * .27} 338 ${h * .312}
      C 304 ${h * .355} 350 ${h * .392} 322 ${h * .43}
      Q 350 ${h * .47} 322 ${h * .51}
      C 355 ${h * .55} 319 ${h * .60} 352 ${h * .647}
      Q 323 ${h * .688} 365 ${h * .745}
      C 334 ${h * .795} 372 ${h * .84} 420 ${h * .865} Z`;
    const peloponnese = `M 0 ${h * .565}
      Q 37 ${h * .54} 75 ${h * .578}
      L 95 ${h * .594} 106 ${h * .64}
      Q 133 ${h * .654} 121 ${h * .691}
      L 92 ${h * .704} 83 ${h * .739}
      Q 50 ${h * .748} 34 ${h * .716}
      L 0 ${h * .736} Z`;
    const crete = `M 101 ${h * .897}
      L 131 ${h * .883} 156 ${h * .887} 178 ${h * .875}
      L 207 ${h * .887} 239 ${h * .878} 273 ${h * .888}
      L 302 ${h * .881} 333 ${h * .902} 345 ${h * .919}
      L 316 ${h * .934} 280 ${h * .929} 257 ${h * .939}
      L 219 ${h * .931} 191 ${h * .942} 154 ${h * .927}
      L 123 ${h * .928} 98 ${h * .915} Z`;
    const islands: Isle[] = [
      { x: 210, y: .297, rx: 12, ry: 35, turn: 18 }, // Euboea
      { x: 287, y: .310, rx: 19, ry: 17, turn: -20 }, // Lesbos
      { x: 303, y: .414, rx: 10, ry: 19, turn: 16 }, // Chios
      { x: 308, y: .522, rx: 22, ry: 9, turn: -12 }, // Samos
      { x: 213, y: .477, rx: 10, ry: 20, turn: 10 }, // Andros
      { x: 239, y: .524, rx: 14, ry: 9, turn: -25 }, // Tinos
      { x: 272, y: .560, rx: 9, ry: 7, turn: 15 }, // Mykonos
      { x: 219, y: .560, rx: 9, ry: 11, turn: 15 }, // Syros
      { x: 193, y: .607, rx: 11, ry: 15, turn: -8 }, // Paros
      { x: 228, y: .635, rx: 13, ry: 23, turn: -14 }, // Naxos
      { x: 177, y: .668, rx: 8, ry: 12, turn: 28 }, // Sifnos
      { x: 140, y: .691, rx: 17, ry: 9, turn: -14 }, // Milos
      { x: 241, y: .766, rx: 11, ry: 5, turn: 24 }, // Santorini
      { x: 320, y: .687, rx: 16, ry: 7, turn: -13 }, // Kos
      { x: 307, y: .814, rx: 7, ry: 20, turn: 10 }, // Karpathos
      { x: 366, y: .819, rx: 14, ry: 24, turn: 12 }, // Rhodes
      { x: 262, y: .718, rx: 7, ry: 10, turn: -12 },
      { x: 254, y: .584, rx: 6, ry: 7, turn: 25 },
      { x: 166, y: .531, rx: 5, ry: 8, turn: -16 },
      { x: 292, y: .759, rx: 5, ry: 9, turn: 30 },
      // Small archipelagos give the chart a sense of scale without adding
      // large visual shapes underneath the lesson labels.
      { x: 235, y: .249, rx: 4.5, ry: 8, turn: -20 }, // Northern Sporades
      { x: 251, y: .263, rx: 6, ry: 4, turn: 18 },
      { x: 267, y: .277, rx: 3.4, ry: 4.6, turn: 24 },
      { x: 171, y: .558, rx: 4.5, ry: 6, turn: -12 }, // Western Cyclades
      { x: 173, y: .610, rx: 3.4, ry: 5, turn: 24 },
      { x: 249, y: .658, rx: 3.8, ry: 7.5, turn: 31 }, // Lesser Cyclades
      { x: 258, y: .681, rx: 3.5, ry: 4.3, turn: 14 },
      { x: 277, y: .697, rx: 4.2, ry: 5.6, turn: -13 },
      { x: 339, y: .719, rx: 3.5, ry: 5.2, turn: 30 }, // Dodecanese
      { x: 345, y: .749, rx: 4.2, ry: 6.5, turn: -28 },
    ];
    const relief = [
      `M 18 ${h * .045} C 81 ${h * .055} 89 ${h * .09} 79 ${h * .14} S 46 ${h * .225} 20 ${h * .252}`,
      `M 9 ${h * .087} C 47 ${h * .113} 59 ${h * .165} 34 ${h * .198}`,
      `M 0 ${h * .285} C 61 ${h * .301} 41 ${h * .385} 12 ${h * .415}`,
      `M 5 ${h * .325} C 30 ${h * .352} 27 ${h * .391} 8 ${h * .408}`,
      `M 0 ${h * .611} C 46 ${h * .596} 72 ${h * .626} 78 ${h * .672} S 33 ${h * .705} 12 ${h * .705}`,
      `M 0 ${h * .648} Q 46 ${h * .632} 49 ${h * .684}`,
      `M 401 ${h * .055} C 362 ${h * .092} 368 ${h * .15} 402 ${h * .177}`,
      `M 420 ${h * .204} C 379 ${h * .232} 371 ${h * .295} 406 ${h * .325}`,
      `M 420 ${h * .45} C 364 ${h * .48} 383 ${h * .546} 417 ${h * .572}`,
      `M 420 ${h * .652} C 380 ${h * .685} 394 ${h * .73} 417 ${h * .766}`,
      `M 130 ${h * .905} Q 194 ${h * .893} 257 ${h * .902} T 320 ${h * .914}`,
    ];
    const depths = [
      `M 142 ${h * .067} C 194 ${h * .143} 151 ${h * .228} 139 ${h * .277}`,
      `M 172 ${h * .09} C 214 ${h * .165} 174 ${h * .247} 165 ${h * .296}`,
      `M 263 ${h * .12} C 236 ${h * .214} 261 ${h * .273} 246 ${h * .344}`,
      `M 280 ${h * .154} C 255 ${h * .241} 287 ${h * .314} 273 ${h * .368}`,
      `M 127 ${h * .39} C 162 ${h * .425} 143 ${h * .502} 115 ${h * .548}`,
      `M 143 ${h * .407} C 179 ${h * .445} 160 ${h * .505} 135 ${h * .557}`,
      `M 269 ${h * .40} C 237 ${h * .471} 290 ${h * .545} 278 ${h * .61}`,
      `M 287 ${h * .427} C 267 ${h * .479} 314 ${h * .57} 301 ${h * .623}`,
      `M 120 ${h * .755} C 160 ${h * .785} 156 ${h * .84} 112 ${h * .864}`,
      `M 143 ${h * .766} C 185 ${h * .799} 170 ${h * .855} 142 ${h * .873}`,
      `M 270 ${h * .804} C 245 ${h * .84} 262 ${h * .868} 282 ${h * .878}`,
    ];
    return { west, east, peloponnese, crete, islands, relief, depths };
  }, [h]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + (tide.value + 1) * 0.035,
    transform: [
      { translateX: tide.value * 3 },
      { translateY: tide.value * 1.5 },
    ],
  }));

  useEffect(() => {
    cancelAnimation(tide);
    if (reduced) { tide.value = 0; return; }
    tide.value = withRepeat(withSequence(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(tide);
  }, [reduced, tide]);

  return (
    <View pointerEvents="none" accessible={false} style={styles.underlay}>
      <Svg width={width} height={height} viewBox={`0 0 420 ${h}`} pointerEvents="none">
        <Defs>
          <LinearGradient id="adventure-sea" x1="0%" x2="100%" y1="0%" y2="100%">
            <Stop offset="0%" stopColor="#111C2A" />
            <Stop offset="50%" stopColor="#121A29" />
            <Stop offset="100%" stopColor="#14192A" />
          </LinearGradient>
          <LinearGradient id="adventure-land" x1="0%" x2="100%" y1="0%" y2="100%">
            <Stop offset="0%" stopColor="#30403E" />
            <Stop offset="100%" stopColor="#282F3E" />
          </LinearGradient>
          {/* All atmospheric lighting is static; no per-frame shader changes. */}
          <RadialGradient id="adventure-atlas-ambient" cx="50%" cy="44%" rx="71%" ry="69%">
            <Stop offset="0%" stopColor="#7796A4" stopOpacity={0.16} />
            <Stop offset="52%" stopColor="#516C83" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#516C83" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="adventure-atlas-vignette" cx="50%" cy="46%" rx="77%" ry="75%">
            <Stop offset="25%" stopColor="#050B17" stopOpacity={0} />
            <Stop offset="76%" stopColor="#050B17" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#050B17" stopOpacity={0.53} />
          </RadialGradient>
        </Defs>
        <Rect width={420} height={h} fill="url(#adventure-sea)" />
        <Rect width={420} height={h} fill="url(#adventure-atlas-ambient)" />

        {/* Latitude/longitude rhumb grid, border and coordinates are stationary. */}
        <G stroke="#A9B6BA" strokeWidth={0.65} opacity={0.11} strokeDasharray="2 13">
          {[36, 94, 152, 210, 268, 326, 384].map(x =>
            <Path key={"meridian-" + x} d={`M ${x} 0 V ${h}`} />)}
          {Array.from({ length: Math.ceil(h / 86) }, (_, n) => (n + 1) * 86).map(y =>
            <Path key={"parallel-" + y} d={`M 0 ${y} H 420`} />)}
        </G>
        <Rect x={9} y={9} width={402} height={Math.max(0, h - 18)}
          fill="none" stroke="#BEAC95" strokeWidth={0.7} opacity={0.18} />
        {/* Four quiet Greek-key corner engravings, not a busy repeating frame. */}
        <G fill="none" stroke="#C8AB83" strokeWidth={0.85} opacity={0.23}>
          {[
            { x: 18, y: 31, angle: 0 },
            { x: 402, y: 31, angle: 180 },
            { x: 18, y: h - 31, angle: 0 },
            { x: 402, y: h - 31, angle: 180 },
          ].map((corner, index) =>
            <G key={"fret-" + index}
              transform={`translate(${corner.x} ${corner.y}) rotate(${corner.angle})`}>
              <Path d="M 0 10 H 36 V 0 H 12 V 7 H 28 V 4 H 20" />
              <Path d="M 0 14 H 40" opacity={0.45} />
            </G>)}
        </G>
        <G fill="#C0AB8C" fontSize={8} opacity={0.32} letterSpacing={1}>
          <SvgText x={20} y={23}>24° E</SvgText>
          <SvgText x={356} y={23}>26° E</SvgText>
          <SvgText x={17} y={h * .40}>38° N</SvgText>
          <SvgText x={367} y={h * .75}>36° N</SvgText>
        </G>

        {/* Fine chart bearings suggest routes without overpowering checkpoints. */}
        <G fill="none" stroke="#B9A989" strokeWidth={0.8} opacity={0.09}
          strokeDasharray="2 14">
          <Path d={`M 270 ${h * .235} L 420 ${h * .485}`} />
          <Path d={`M 270 ${h * .235} L 0 ${h * .775}`} />
          <Path d={`M 270 ${h * .235} L 80 ${h * .08}`} />
        </G>
        {/* Two opposing shores make the sea legible as the Aegean basin. */}
        <G fill="url(#adventure-land)" fillOpacity={0.75}
          stroke="#B7A27F" strokeWidth={1.35} strokeOpacity={0.42}>
          <Path d={geography.west} />
          <Path d={geography.east} />
          <Path d={geography.peloponnese} />
          <Path d={geography.crete} />
        </G>
        <G stroke="#CFB891" strokeWidth={3.5} opacity={0.07} fill="none">
          <Path d={geography.west} /><Path d={geography.east} />
          <Path d={geography.peloponnese} /><Path d={geography.crete} />
        </G>
        {/* Land relief follows the coast; sea contours follow the basin. */}
        <G fill="none" stroke="#B3AE9F" strokeWidth={0.85} opacity={0.18}>
          {geography.relief.map((d, n) => <Path key={"relief-" + n} d={d} />)}
        </G>
        <G fill="none" stroke="#879FB4" strokeWidth={0.85} opacity={0.21}>
          {geography.depths.map((d, n) => <Path key={"depth-" + n} d={d} />)}
        </G>
        <G stroke="#C5B58E" strokeWidth={1} fill="#344446" fillOpacity={0.73}
          strokeOpacity={0.47}>
          {geography.islands.map((isle, n) =>
            <G key={"isle-" + n} transform={`translate(${isle.x} ${h * isle.y}) rotate(${isle.turn})`}>
              <Path d={islandOutline(isle.rx, isle.ry)} />
              {isle.rx > 10 && isle.ry > 12 ?
                <Path d={`M ${-isle.rx * .33} ${-isle.ry * .49}
                  Q ${isle.rx * .20} 0 ${-isle.rx * .06} ${isle.ry * .53}`}
                  stroke="#A5B2A7" strokeWidth={0.7} opacity={0.36} fill="none" /> : null}
            </G>)}
        </G>

        {/* Fine engraved navigational details, subtle enough behind labels. */}
        <G transform={`translate(270 ${h * .235})`} opacity={0.38}>
          <Circle r={39} stroke="#BBA98E" strokeWidth={0.8} fill="none" />
          <Circle r={31} stroke="#BBA98E" strokeWidth={0.55} fill="none" strokeDasharray="1 6" />
          <Circle r={9} stroke="#BBA98E" strokeWidth={0.75} fill="none" />
          <Path d="M 0 -34 L 7 -5 L 0 0 L -7 -5 Z" fill="#BFAF92" />
          <Path d="M 0 34 L 7 5 L 0 0 L -7 5 Z" fill="#BFAF92" fillOpacity={0.40} />
          <Path d="M -34 0 L -5 -7 L 0 0 L -5 7 Z
                   M 34 0 L 5 -7 L 0 0 L 5 7 Z"
            stroke="#BFAF92" fill="none" strokeWidth={0.9} />
          <Path d="M -24 -24 L 24 24 M 24 -24 L -24 24"
            stroke="#BFAF92" strokeWidth={0.65} opacity={0.5} />
          <SvgText x={0} y={-44} textAnchor="middle" fill="#E1D1B6" fontSize={10}>N</SvgText>
        </G>
        <G fill="#BEB9AF" opacity={0.19} letterSpacing={2.3}>
          <SvgText x={174} y={h * .385} fontSize={11}>ΑΙΓΑΙΟΝ</SvgText>
          <SvgText x={172} y={h * .408} fontSize={9}>ΠΕΛΑΓΟΣ</SvgText>
          <SvgText x={163} y={h * .741} fontSize={9}>ΚΥΚΛΑΔΕΣ</SvgText>
          <SvgText x={204} y={h * .966} fontSize={9}>ΚΡΗΤΗ</SvgText>
        </G>
        {/* Occasional survey markers and etched navigation points. */}
        <G fill="none" stroke="#C3B398" strokeWidth={0.8} opacity={0.28}>
          {[{ x: 147, y: .19 }, { x: 339, y: .375 }, { x: 152, y: .816 }].map((p, n) =>
            <G key={"survey-" + n} transform={`translate(${p.x} ${h * p.y})`}>
              <Circle r={4.2} />
              <Path d="M -9 0 H 9 M 0 -9 V 9" />
            </G>)}
        </G>
        {/* Soft paper-edge falloff helps checkpoints stand out without a hard frame. */}
        <Rect width={420} height={h} fill="url(#adventure-atlas-vignette)" />
      </Svg>

      {/* Only this small translucent tide layer moves on the UI thread. */}
      <Animated.View pointerEvents="none" style={[styles.tideLayer, waveStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 420 ${h}`} pointerEvents="none">
          <G fill="none" stroke="#A6B6C6" strokeWidth={1.1} strokeDasharray="3 16">
            {geography.depths.filter((_, n) => n % 2 === 0).map((d, n) =>
              <Path key={"current-" + n} d={d} />)}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

export default memo(AdventureAtlasBackground);

const styles = StyleSheet.create({
  underlay: { ...StyleSheet.absoluteFill, overflow: "hidden", backgroundColor: "#101827" },
  tideLayer: { ...StyleSheet.absoluteFill },
});
