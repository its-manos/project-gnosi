/**
 * Home's Midnight Atlas backdrop.
 *
 * Geometry is local SVG and follows the measured Home viewport exactly:
 * no image crop, stretched bitmap, per-frame path updates, or remote request.
 * Static geography is independent of the few animated ambient accents;
 * the entire layer remains decorative and never captures touches.
 */
import { memo, useState } from "react";
import { HomeAtlasAmbientGlow, HomeAtlasCurrent, HomeAtlasTwinkleStar } from "./HomeAtlasMotion";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop,
} from "react-native-svg";

type Size = { width: number; height: number };

// Hand-placed, deterministic chart stars. Their positions follow the height
// of the real viewport, not a phone-specific aspect ratio.
const stars: ReadonlyArray<readonly [number, number, number, number]> = [
  [22, .051, .8, .36], [75, .072, .65, .3], [126, .041, 1.1, .6],
  [188, .087, .7, .3], [252, .033, .9, .36], [302, .079, .7, .4],
  [362, .058, 1.25, .65], [406, .124, .65, .35],
  [41, .185, .8, .32], [94, .231, .65, .22], [329, .205, .8, .29],
  [385, .291, .8, .35], [18, .349, .65, .26], [408, .416, 1, .42],
  [54, .503, .65, .24], [352, .557, .75, .28], [16, .644, .7, .3],
  [403, .699, .85, .35], [86, .731, 1, .35], [312, .784, .7, .3],
  [379, .862, .95, .4], [58, .91, .85, .37], [222, .954, .7, .23],
];

function HomeAtlasBackground() {
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  // Use matching aspect ratios in physical pixels and SVG coordinates.
  // Unlike 'slice' or a background image, this never crops or distorts.
  const h = viewport.width > 0 ? viewport.height * 420 / viewport.width : 0;
  const upperShore = `M 0 0 H 153
    Q 142 ${h * .025} 155 ${h * .043}
    C 123 ${h * .064} 145 ${h * .086} 111 ${h * .102}
    Q 89 ${h * .118} 105 ${h * .139}
    C 71 ${h * .154} 82 ${h * .18} 44 ${h * .192}
    Q 23 ${h * .218} 0 ${h * .239} Z`;
  const lowerShore = `M 420 ${h * .752}
    C 389 ${h * .777} 405 ${h * .801} 362 ${h * .824}
    Q 339 ${h * .843} 346 ${h * .862}
    C 306 ${h * .868} 303 ${h * .898} 273 ${h * .902}
    C 244 ${h * .894} 237 ${h * .923} 202 ${h * .927}
    C 169 ${h * .915} 147 ${h * .956} 105 ${h * .949}
    Q 61 ${h * .962} 0 ${h * .943}
    L 0 ${h} H 420 Z`;

  return (
    <View testID="home-atlas-background" style={styles.underlay}
      pointerEvents="none" accessible={false}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        if (width <= 0 || height <= 0) return;
        setViewport(previous => Math.abs(previous.width - width) < 1
          && Math.abs(previous.height - height) < 1 ? previous : { width, height });
      }}>
      {h > 0 ? <Svg width={viewport.width} height={viewport.height}
        viewBox={`0 0 420 ${h}`} pointerEvents="none">
        <Defs>
          <LinearGradient id="home-atlas-night" x1="0%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor="#0C1625" />
            <Stop offset="54%" stopColor="#121A2C" />
            <Stop offset="100%" stopColor="#111A2B" />
          </LinearGradient>
          <RadialGradient id="home-atlas-teal" cx="24%" cy="22%" rx="63%" ry="43%">
            <Stop offset="0%" stopColor="#528A92" stopOpacity={0.21} />
            <Stop offset="54%" stopColor="#284D60" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#142033" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="home-atlas-violet" cx="85%" cy="57%" rx="68%" ry="54%">
            <Stop offset="0%" stopColor="#6B578C" stopOpacity={0.18} />
            <Stop offset="55%" stopColor="#493F70" stopOpacity={0.07} />
            <Stop offset="100%" stopColor="#191C31" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="home-atlas-gold-haze" cx="20%" cy="95%" rx="58%" ry="35%">
            <Stop offset="0%" stopColor="#907A59" stopOpacity={0.09} />
            <Stop offset="100%" stopColor="#907A59" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="home-atlas-vignette" cx="49%" cy="48%" rx="73%" ry="76%">
            <Stop offset="30%" stopColor="#050A16" stopOpacity={0} />
            <Stop offset="77%" stopColor="#050A16" stopOpacity={0.09} />
            <Stop offset="100%" stopColor="#050A16" stopOpacity={0.39} />
          </RadialGradient>
          <RadialGradient id="home-atlas-breath" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#97BAC4" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="#50798A" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#50798A" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="home-atlas-celestial-disc" cx="42%" cy="36%" rx="63%" ry="63%">
            <Stop offset="0%" stopColor="#B8ACBC" stopOpacity={0.51} />
            <Stop offset="45%" stopColor="#7C708B" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#5A617B" stopOpacity={0.05} />
          </RadialGradient>
          <LinearGradient id="home-atlas-shore" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#263C45" />
            <Stop offset="100%" stopColor="#273044" />
          </LinearGradient>
        </Defs>
        <Rect width={420} height={h} fill="url(#home-atlas-night)" />
        <Rect width={420} height={h} fill="url(#home-atlas-teal)" />
        <Rect width={420} height={h} fill="url(#home-atlas-violet)" />
        <Rect width={420} height={h} fill="url(#home-atlas-gold-haze)" />

        {/* Almost-hidden edge of a celestial sphere inside the astrolabe. */}
        <Circle cx={433} cy={h * 0.057} r={70}
          fill="url(#home-atlas-celestial-disc)" opacity={0.28} />
        <G fill="none" stroke="#C5B7C8" strokeWidth={0.7} opacity={0.10}>
          <Path d={`M 398 ${h * 0.01} Q 422 ${h * 0.055} 393 ${h * 0.12}`} />
          <Path d={`M 379 ${h * 0.038} Q 410 ${h * 0.073} 420 ${h * 0.14}`} />
        </G>

        {/* Very faint survey grid; it sits behind the existing opaque cards. */}
        <G fill="none" stroke="#96A9B6" strokeWidth={0.65}
          strokeDasharray="2 17" opacity={0.10}>
          {[42, 126, 210, 294, 378].map(x =>
            <Path key={`home-meridian-${x}`} d={`M ${x} 0 V ${h}`} />)}
          {Array.from({ length: Math.ceil(h / 119) }, (_, i) => (i + 1) * 119)
            .filter(y => y < h).map(y =>
              <Path key={`home-parallel-${y}`} d={`M 0 ${y} H 420`} />)}
        </G>
        <G fill="none" stroke="#B9A989" strokeWidth={0.8} opacity={0.11}>
          <Path d={`M -42 ${h * .31} C 89 ${h * .14} 294 ${h * .20} 464 ${h * .04}`} />
          <Path d={`M -34 ${h * .71} C 94 ${h * .56} 290 ${h * .68} 459 ${h * .48}`} />
          <Path d={`M -30 ${h * .95} Q 220 ${h * .72} 464 ${h * .86}`} />
          <Path d={`M 420 ${h * .15} Q 133 ${h * .46} 0 ${h * .86}`}
            strokeDasharray="2 13" />
        </G>
        {/* Abstract shores, deliberately secondary to the Home cards. */}
        <G fill="url(#home-atlas-shore)" fillOpacity={0.48}
          stroke="#BDA786" strokeOpacity={0.28} strokeWidth={1}>
          <Path d={upperShore} /><Path d={lowerShore} />
        </G>
        <G fill="none" stroke="#B8AA8F" strokeWidth={0.8} opacity={0.14}>
          {Array.from({ length: 5 }, (_, i) =>
            <Path key={`home-upper-relief-${i}`}
              d={`M -4 ${11 + i * 13} Q 95 ${-12 + i * 14} 112 ${h * .055 + i * 6}
                T 40 ${h * .174 + i * 8}`} />)}
          {Array.from({ length: 6 }, (_, i) =>
            <Path key={`home-lower-relief-${i}`}
              d={`M ${155 + i * 8} ${h}
                C ${193 + i * 7} ${h * .935} ${296 + i * 7} ${h * .97}
                  352 ${h * .845 + i * 4}
                Q 385 ${h * .828 + i * 4} 425 ${h * .795 + i * 5}`} />)}
        </G>
        {/* A handful of contour/bathymetric curves, not a repeating texture. */}
        <G fill="none" stroke="#8CA8B6" strokeWidth={0.8} opacity={0.12}>
          <Path d={`M 0 ${h * .37} C 120 ${h * .32} 98 ${h * .43} 0 ${h * .48}`} />
          <Path d={`M 0 ${h * .39} C 142 ${h * .34} 113 ${h * .46} 0 ${h * .50}`} />
          <Path d={`M 420 ${h * .38} C 309 ${h * .42} 336 ${h * .55} 420 ${h * .61}`} />
          <Path d={`M 420 ${h * .405} C 332 ${h * .45} 358 ${h * .54} 420 ${h * .585}`} />
        </G>

        {/* Partial celestial instrument at the upper-right edge. */}
        <G transform={`translate(426 ${h * .057})`} fill="none"
          stroke="#BEA884" strokeWidth={0.75} opacity={0.29}>
          <Circle r={116} /><Circle r={126} strokeDasharray="2 8" />
          <Circle r={150} strokeOpacity={0.34} />
          <Circle r={92} strokeDasharray="1 11" />
          {Array.from({ length: 32 }, (_, i) => {
            const a = i * Math.PI / 16;
            const r = i % 4 === 0 ? 109 : 114;
            return <Path key={`home-astrolabe-tick-${i}`}
              d={`M ${Math.cos(a) * r} ${Math.sin(a) * r}
                L ${Math.cos(a) * 120} ${Math.sin(a) * 120}`} />;
          })}
        </G>
        {/* Restrained compass rose anchored below the last Home section. */}
        <G transform={`translate(21 ${h * .97})`} fill="none"
          stroke="#C4A77D" strokeWidth={0.85} opacity={0.35}>
          <Circle r={65} /><Circle r={81} strokeDasharray="2 8" />
          <Circle r={98} strokeOpacity={0.38} /><Circle r={11} />
          <Path d="M 0 -86 L 11 -11 L 0 0 L -11 -11 Z"
            fill="#D3B78D" fillOpacity={0.46} />
          <Path d="M 0 86 L 11 11 L 0 0 L -11 11 Z"
            fill="#D3B78D" fillOpacity={0.20} />
          <Path d="M -86 0 L -11 -11 L 0 0 L -11 11 Z
                   M 86 0 L 11 -11 L 0 0 L 11 11 Z"
            fill="#CBB18A" fillOpacity={0.23} />
          <Path d="M -65 -65 L 65 65 M 65 -65 L -65 65" opacity={0.42} />
        </G>

        {/* Survey rosettes inhabit the margins, not the touch targets. */}
        <G fill="none" stroke="#C7B398" strokeWidth={0.75} opacity={0.24}>
          {[[15, 0.31], [403, 0.49], [30, 0.77]].map(([x, y], i) =>
            <G key={`home-survey-${i}`} transform={`translate(${x} ${h * y})`}>
              <Circle r={5.2} />
              <Path d="M -10 0 H 10 M 0 -10 V 10" />
              <Circle r={1} fill="#D6BE9A" stroke="none" />
            </G>)}
        </G>

        {/* Distant constellations are decor, never extra destinations. */}
        <G stroke="#D6C09C" fill="none" strokeWidth={0.72} opacity={0.23}>
          <Path d={`M 65 ${h * .10} L 115 ${h * .065} L 158 ${h * .12}
            L 214 ${h * .10}`} />
          <Path d={`M 351 ${h * .71} L 387 ${h * .75} L 367 ${h * .83}`} />
        </G>
        <G fill="#D9CAB3">
          {stars.map(([x, y, r, opacity], i) =>
            <Circle key={`home-star-${i}`} cx={x} cy={h * y}
              r={r} opacity={opacity} />)}
        </G>
        <G fill="none" stroke="#E8D0A7" strokeWidth={0.75} opacity={0.43}>
          {[[115, .065], [362, .058], [387, .75]].map(([x, y], i) =>
            <G key={`home-star-cross-${i}`} transform={`translate(${x} ${h * y})`}>
              <Path d="M -5 0 H 5 M 0 -5 V 5" />
              <Circle r={1.35} fill="#E8D0A7" stroke="none" />
            </G>)}
        </G>
        {/* Small UI-thread ambient accents; the chart itself never animates. */}
        <HomeAtlasAmbientGlow h={h} />
        {[[115, 0.065], [362, 0.058], [403, 0.416], [387, 0.75]].map(([x, y], index) =>
          <HomeAtlasTwinkleStar key={index} index={index} x={x} y={h * y} />)}
        <HomeAtlasCurrent h={h} />
        {/* Edge falloff keeps text and cards high-contrast. */}
        <Rect width={420} height={h} fill="url(#home-atlas-vignette)" />
      </Svg> : null}
    </View>
  );
}

export default memo(HomeAtlasBackground);

const styles = StyleSheet.create({
  underlay: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: "#101827",
  },
});
