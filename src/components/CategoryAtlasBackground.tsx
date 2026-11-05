/** The noninteractive category chart is mounted before the interactive
 * constellation. It has one shared, low-cost detail budget on iOS and Android.
 * The viewBox and artwork exactly match the embedded FantasyMap backdrop.
 */
import { memo } from "react";
import { Image } from "expo-image";
const atlasImage = require("../../assets/atlas-export-preview/category.webp");
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

type Props = { width: number; height: number; regionCount: number };
const MAP_WIDTH = 360;

function stableNoise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function CategoryAtlasBackground({ width, height, regionCount }: Props) {
  // Keep the same decorative density for both platforms; never trade
  // loading smoothness for additional iPhone-only SVG detail.
  const fitted = true;
  const sharedLite = true;
  const regions = { length: regionCount };
  // Match FantasyMap's compact row allocation (3 regions use two rows).
  const rows = regionCount === 3 ? 2 : Math.max(1, Math.ceil(regionCount / 3));
  // Root background: match the measured viewport exactly, without the
  // former 520pt map cap or an intermediate rounded height.
  const mapHeight = height * MAP_WIDTH / width;
  return (
    <View testID="category-atlas-static-background" pointerEvents="none"
      accessible={false} style={[styles.background, {
        width, height,
      }]}>
      {regionCount === 6 ? (
        <Image source={atlasImage} contentFit="fill" transition={0}
          cachePolicy="memory-disk" style={StyleSheet.absoluteFillObject} />
      ) : <Svg width="100%" height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`} preserveAspectRatio="xMidYMid meet"
        pointerEvents="none">
        <Defs>
          <LinearGradient id="atlas-sea" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#172C36" /><Stop offset="1" stopColor="#101C27" />
          </LinearGradient>
          {fitted ? (
            <RadialGradient id="atlas-atmosphere" cx="51%" cy="46%" r="69%">
              <Stop offset="0" stopColor="#40576C" stopOpacity={0.25} />
              <Stop offset="0.54" stopColor="#2B3E52" stopOpacity={0.11} />
              <Stop offset="1" stopColor="#101827" stopOpacity={0} />
            </RadialGradient>
          ) : null}
          {fitted ? (
            <RadialGradient id="atlas-nebula" cx="45%" cy="45%" r="56%">
              <Stop offset="0" stopColor="#665C88" stopOpacity={0.14} />
              <Stop offset="0.55" stopColor="#4B5878" stopOpacity={0.055} />
              <Stop offset="1" stopColor="#101827" stopOpacity={0} />
            </RadialGradient>
          ) : null}
          {fitted ? (
            <>
              <RadialGradient id="atlas-nebula-teal" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor="#406D7B" stopOpacity={0.27} />
                <Stop offset="0.5" stopColor="#2A4B5E" stopOpacity={0.11} />
                <Stop offset="1" stopColor="#162334" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="atlas-nebula-gold" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor="#947959" stopOpacity={0.19} />
                <Stop offset="0.55" stopColor="#5D5362" stopOpacity={0.08} />
                <Stop offset="1" stopColor="#141B2D" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="atlas-vignette" cx="50%" cy="48%" rx="76%" ry="70%">
                <Stop offset="0" stopColor="#070B15" stopOpacity={0} />
                <Stop offset="0.62" stopColor="#070B15" stopOpacity={0.03} />
                <Stop offset="1" stopColor="#070B15" stopOpacity={0.46} />
              </RadialGradient>
            </>
          ) : null}
        </Defs>
        <Rect width={MAP_WIDTH} height={mapHeight} rx={fitted ? 0 : 20}
          fill={fitted ? "#101827" : "url(#atlas-sea)"} />
        {fitted ? <Rect width={MAP_WIDTH} height={mapHeight}
          fill="url(#atlas-atmosphere)" pointerEvents="none" /> : null}
        {fitted ? (
          <G testID="atlas-sky-atmosphere" pointerEvents="none">
            <Rect x={40} y={mapHeight * 0.13} width={280} height={mapHeight * 0.72}
              fill="url(#atlas-nebula)" />
            <Ellipse cx={MAP_WIDTH * 0.76} cy={mapHeight * 0.43}
              rx={MAP_WIDTH * 0.40} ry={mapHeight * 0.33}
              fill="url(#atlas-nebula-teal)" />
            {!sharedLite ? <Ellipse cx={MAP_WIDTH * 0.23} cy={mapHeight * 0.82}
              rx={MAP_WIDTH * 0.38} ry={mapHeight * 0.27}
              fill="url(#atlas-nebula-gold)" /> : null}
          </G>
        ) : null}
        {Array.from({ length: 9 }, (_, index) => index)
          .filter(index => !sharedLite || index % 2 === 0).map(index => (
          <Path key={`meridian-${index}`} d={`M ${index * 45} 0 Q ${index * 45 - 45} ${mapHeight / 2} ${index * 45} ${mapHeight}`}
            stroke="#7CA8AC" strokeOpacity={fitted ? 0.045 : 0.07} fill="none" />
        ))}
        {Array.from({ length: sharedLite ? rows * 2 : rows * 4 }, (_, index) => (
          <Path key={`parallel-${index}`} d={`M 0 ${index * 40} Q 180 ${index * 40 + 30} 360 ${index * 40}`}
            stroke="#7CA8AC" strokeOpacity={fitted ? 0.045 : 0.07} fill="none" />
        ))}
        {fitted ? (
          <G pointerEvents="none">
            {/* Faint cartographic latitude arcs. They are decoration, not a
                route, and stay behind every island and touch target. */}
            <Path d={`M -30 ${mapHeight * 0.24} C 95 ${mapHeight * 0.12}, 234 ${mapHeight * 0.33}, 390 ${mapHeight * 0.16}`}
              fill="none" stroke="#8CA6B9" strokeWidth={0.8} strokeOpacity={0.11} />
            <Path d={`M -25 ${mapHeight * 0.81} C 95 ${mapHeight * 0.65}, 251 ${mapHeight * 0.9}, 385 ${mapHeight * 0.68}`}
              fill="none" stroke="#C7B48F" strokeWidth={0.7} strokeOpacity={0.12} />
            <Path d={`M 40 ${mapHeight * 1.04} Q 130 ${mapHeight * 0.45} 308 ${-mapHeight * 0.04}`}
              fill="none" stroke="#839EB4" strokeWidth={0.65} strokeOpacity={0.09}
              strokeDasharray="3 11" />
          </G>
        ) : null}
        {fitted ? (
          <G pointerEvents="none">
            {/* The circular chart grid is deliberately incomplete and faint:
                the destinations are free choices, not points along a track. */}
            <Path testID="atlas-chart-orbit-upper"
              d={`M -66 ${mapHeight * 0.42} A 248 ${mapHeight * 0.51} 0 0 1 426 ${mapHeight * 0.42}`}
              stroke="#91A8B8" strokeWidth={0.85} strokeOpacity={0.12} fill="none" />
            <Path testID="atlas-chart-orbit-lower"
              d={`M -54 ${mapHeight * 0.59} A 255 ${mapHeight * 0.56} 0 0 0 414 ${mapHeight * 0.59}`}
              stroke="#D8C3A3" strokeWidth={0.75} strokeOpacity={0.1} fill="none" />
            {Array.from({ length: 9 }, (_, i) => {
              const x = 24 + i * 39;
              return (
                <Path key={`atlas-chart-tick-${i}`} testID={`atlas-chart-tick-${i}`}
                  d={`M ${x} 0 V ${i % 3 === 0 ? 12 : 6} M ${x} ${mapHeight} v -${i % 3 === 0 ? 12 : 6}`}
                  stroke="#C2B79E" strokeWidth={0.8} strokeOpacity={0.22} fill="none" />
              );
            })}
          </G>
        ) : null}
        {!fitted ? <Rect x={7} y={7} width={346} height={mapHeight - 14} rx={15}
          fill="none" stroke="#89AAA6" strokeOpacity={0.18} /> : null}
        {fitted ? (
          <G testID="atlas-fitted-map-border" pointerEvents="none">
            {/* An engraved chart neatline frames the open atlas without a
                heavy native card. Leave the upper right open for the compass.
                All paths are static, and remain behind the island hit targets. */}
            <Path testID="atlas-map-border-main"
              d={`M 18 10 H 285 M 10 26 V ${mapHeight - 25}
                Q 10 ${mapHeight - 10} 25 ${mapHeight - 10}
                H 335 Q 350 ${mapHeight - 10} 350 ${mapHeight - 25} V 60`}
              fill="none" stroke="#BFA984" strokeWidth={0.85}
              strokeOpacity={0.37} strokeLinecap="round" />
            <Path testID="atlas-map-border-inner"
              d={`M 18 29 V ${mapHeight - 22} H 342 V 68 M 19 17 H 284`}
              fill="none" stroke="#86A0B2" strokeWidth={0.55}
              strokeOpacity={0.19} />
            <Path testID="atlas-map-border-marks"
              d={`M 25 7 V 17 M 7 25 H 17
                M 7 ${mapHeight - 25} H 17
                M 25 ${mapHeight - 17} V ${mapHeight - 7}
                M 335 ${mapHeight - 17} V ${mapHeight - 7}
                M 343 ${mapHeight - 25} H 353 M 343 66 H 353`}
              fill="none" stroke="#D0BB94" strokeWidth={0.85}
              strokeOpacity={0.42} />
          </G>
        ) : null}
        {fitted ? (
          <G pointerEvents="none">
            {/* Restrained starfield adds depth to empty space without a new
                illustration layer, bitmap download, or animation. */}
            {Array.from({ length: sharedLite ? 30 : 50 }, (_, index) => {
              const x = 14 + stableNoise(index + 91) * (MAP_WIDTH - 28);
              const y = 20 + stableNoise(index + 397) * (mapHeight - 40);
              return <Circle key={`atlas-star-${index}`} cx={x} cy={y}
                r={index % 11 === 0 ? 1.4 : index % 5 === 0 ? 0.9 : 0.5}
                fill={index % 5 === 0 ? "#E4CFA6" : "#B5CADD"}
                opacity={index % 11 === 0 ? 0.52 : index % 5 === 0 ? 0.3 : 0.17} />;
            })}
            {Array.from({ length: sharedLite ? 4 : 7 }, (_, index) => {
              const x = 24 + stableNoise(index + 601) * (MAP_WIDTH - 48);
              const y = 24 + stableNoise(index + 743) * (mapHeight - 48);
              return (
                <G key={`atlas-sky-cross-${index}`}>
                  <Path d={`M ${x-2.2} ${y} h 4.4 M ${x} ${y-2.2} v 4.4`}
                    stroke="#B8C9D6" strokeWidth={0.6} opacity={0.31} fill="none" />
                </G>
              );
            })}
          </G>
        ) : null}
        {fitted && regions.length <= 4 && mapHeight >= 330 ? (
          <G testID="atlas-decorative-constellations" pointerEvents="none">
            {/* Two small non-interactive star charts occupy clear sky, away
                from labels. They do not designate destinations or a path. */}
            <G opacity={0.54}>
              <Path d={`M 227 ${mapHeight * 0.13} L 247 ${mapHeight * 0.18} L 283 ${mapHeight * 0.16}
                L 270 ${mapHeight * 0.225}`}
                fill="none" stroke="#B5C5DA" strokeWidth={0.75} strokeOpacity={0.5} />
              {[[227, 0.13], [247, 0.18], [283, 0.16], [270, 0.225]].map(([x, y], i) => (
                <G key={`atlas-sky-cluster-north-${i}`}>
                  <Circle cx={x} cy={mapHeight * y} r={i === 1 ? 2.25 : 1.35}
                    fill="#E1DBCB" opacity={0.78} />
                  {i === 1 ? <Path d={`M ${x-4} ${mapHeight*y} h8 M ${x} ${mapHeight*y-4} v8`}
                    fill="none" stroke="#D7C7AE" strokeWidth={0.55} opacity={0.45} /> : null}
                </G>
              ))}
            </G>
            <G opacity={0.42}>
              <Path d={`M 232 ${mapHeight * 0.82} L 276 ${mapHeight * 0.86}
                L 295 ${mapHeight * 0.79}`}
                fill="none" stroke="#BCA98F" strokeWidth={0.7} strokeOpacity={0.48} />
              {[[232, 0.82], [276, 0.86], [295, 0.79]].map(([x, y], i) => (
                <Circle key={`atlas-sky-cluster-south-${i}`} cx={x} cy={mapHeight*y}
                  r={i === 1 ? 2 : 1.3} fill="#E3C99A" opacity={0.68} />
              ))}
            </G>
          </G>
        ) : null}
        {fitted ? <Rect testID="atlas-sky-vignette" width={MAP_WIDTH}
          height={mapHeight} fill="url(#atlas-vignette)" pointerEvents="none" /> : null}

      </Svg>}
    </View>
  );
}

export default memo(CategoryAtlasBackground);

const styles = StyleSheet.create({
  background: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
});