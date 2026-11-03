import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

type MapRegion = {
  id: string;
  title: string;
  emoji?: string;
  detail?: string;
  color?: string;
  totalLessons?: number;
  completedLessons?: number;
  progressLoaded?: boolean;
  status?: "loading" | "coming-soon" | "new" | "in-progress" | "complete";
};

type Props = {
  regions: MapRegion[];
  onSelectRegion: (id: string) => void;
  emptyMessage?: string;
  overview?: boolean;
  minHeight?: number;
  onControlsHeightChange?: (height: number) => void;
  /** Bundled image for a bespoke world. Omit it to retain the SVG atlas. */
  backgroundImage?: ImageSourcePropType;
};

type Point = { x: number; y: number };
type PositionedRegion = MapRegion & {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  seed: number;
  fill: string;
};

const MAP_WIDTH = 360;
const ROW_GAP = 146;

const LAND_COLORS = [
  "#716287",
  "#427C78",
  "#9C8055",
  "#557A92",
  "#986E7F",
  "#62866A",
  "#8A645E",
  "#516A91",
];

function columnCount(count: number) {
  if (count <= 1) return 1;
  if (count <= 8) return 2;
  // Keep a roomy three-column map for the current catalogue (up to 24
  // regions). More columns are only used for larger future catalogues.
  if (count <= 24) return 3;
  if (count <= 40) return 4;
  return 5;
}

function stableNoise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function overviewRows(count: number): number[] {
  if (count === 5) return [2, 3];
  if (count === 6) return [3, 3];
  if (count === 7) return [2, 3, 2];
  if (count === 8) return [3, 2, 3];
  const columns = columnCount(count);
  return Array.from({ length: Math.ceil(count / columns) }, (_, row) => Math.min(columns, count - row * columns));
}

function makeLayout(regions: MapRegion[], overview: boolean, mapHeight: number): PositionedRegion[] {
  const count = regions.length;
  if (count === 0) return [];

  const columns = columnCount(count);
  const cellWidth = MAP_WIDTH / columns;
  const totalRows = Math.ceil(count / columns);
  // Anchor islands to the available canvas, rather than leaving a short map
  // floating above an empty viewport. Row spacing stays safe for long titles.
  const edgeMargin = totalRows <= 1 ? mapHeight / 2
    : Math.max(78, Math.min(138, (mapHeight - (totalRows - 1) * 140) / 2));
  const rowStep = totalRows <= 1 ? 0 : (mapHeight - edgeMargin * 2) / (totalRows - 1);

  const rowSizes = overviewRows(count);
  return regions.map((region, index) => {
    if (overview && count > 1) {
      let row = 0;
      let column = index;
      while (column >= rowSizes[row]) { column -= rowSizes[row]; row += 1; }
      const cell = MAP_WIDTH / rowSizes[row];
      return {
        ...region, cx: cell * (column + 0.5) + Math.sin(index * 1.7) * 3,
        cy: 72 + row * 128 + Math.cos(index * 1.4) * 4,
        rx: Math.min(65, cell * 0.36), ry: 46,
        seed: index + 1, fill: region.color ?? LAND_COLORS[index % LAND_COLORS.length],
      };
    }
    const row = Math.floor(index / columns);
    const column = index % columns;
    const noise = stableNoise(index + 1);

    // Staggered positions with deterministic drift keep the landmasses
    // organic rather than looking like a grid of cards. The layout is
    // recalculated from the number of categories/regions supplied.
    const shift = row % 2 === 1 ? cellWidth * 0.065 : -cellWidth * 0.015;
    const horizontalDrift = Math.cos((index + 1) * 1.63) * cellWidth * 0.055;
    const rowSize = Math.min(columns, count - row * columns);
    const rowOffset = (columns - rowSize) * cellWidth / 2;
    const proposedCx = count === 1
      ? MAP_WIDTH / 2
      : cellWidth * (column + 0.5) + rowOffset + shift + horizontalDrift;
    const verticalDrift = Math.sin((column + 1) * 1.91 + row * 1.47) * 4;
    const cy = totalRows === 1 ? mapHeight / 2
      : edgeMargin + row * rowStep + verticalDrift;

    const rx = count === 1 ? 80
      : Math.min(82, cellWidth * (columns >= 4 ? 0.34 : 0.42)) * (0.97 + noise * 0.06);
    const ry = count === 1 ? 69
      : Math.min(70, cellWidth * (columns >= 4 ? 0.36 : 0.38))
        * (0.97 + stableNoise(index + 5) * 0.06);
    // Irregular shorelines and their soft glow extend outside the nominal
    // island radius. Leave a safe margin inside the atlas frame.
    const edgeClearance = rx * 1.14 + 11;
    const cx = Math.min(MAP_WIDTH - edgeClearance,
      Math.max(edgeClearance, proposedCx));

    return {
      ...region,
      cx,
      cy,
      rx,
      ry,
      seed: index + 1,
      fill: region.color ?? LAND_COLORS[index % LAND_COLORS.length],
    };
  });
}

function makeIslandPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
): Point[] {
  const pointCount = 22;

  return Array.from({ length: pointCount }, (_, index) => {
    const angle = (index / pointCount) * Math.PI * 2;
    const variation =
      0.83 +
      0.12 * Math.sin(angle * 3 + seed * 0.8) +
      0.08 * Math.cos(angle * 5 + seed * 1.31) +
      0.035 * Math.sin(angle * 7 + seed);

    return {
      x: cx + Math.cos(angle) * rx * variation,
      y: cy + Math.sin(angle) * ry * variation,
    };
  });
}

function smoothClosedPath(points: Point[]) {
  if (points.length < 3) return "";

  const midpoint = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const firstMidpoint = midpoint(points[points.length - 1], points[0]);
  let path = `M ${firstMidpoint.x.toFixed(1)} ${firstMidpoint.y.toFixed(1)}`;

  points.forEach((point, index) => {
    const nextMidpoint = midpoint(points[(index + 1) % points.length], point);
    path += ` Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${nextMidpoint.x.toFixed(1)} ${nextMidpoint.y.toFixed(1)}`;
  });

  return `${path} Z`;
}

// Keep decorative island contours above the progress area. The full closed
// contour intersects the lower progress tracks on compact destinations.
function upperIslandContour(points: Point[]): string {
  const upper = [...points.slice(Math.ceil(points.length / 2)), points[0]];
  if (upper.length < 2) return "";
  const fmt = (point: Point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  let path = `M ${fmt(upper[0])}`;
  for (let i = 1; i < upper.length - 1; i++) {
    const mid = {
      x: (upper[i].x + upper[i + 1].x) / 2,
      y: (upper[i].y + upper[i + 1].y) / 2,
    };
    path += ` Q ${fmt(upper[i])} ${fmt(mid)}`;
  }
  path += ` Q ${fmt(upper[upper.length - 2])} ${fmt(upper[upper.length - 1])}`;
  return path;
}

/**
 * An original, local SVG engraving inspired by a classical Doric temple.
 * Small architectural details (pediment, triglyphs, fluting, capitals,
 * stylobate and stone highlights) keep it legible without looking cartoonish.
 * It is decorative artwork, not a new island interaction or image request.
 */
function AncientGreekTemple({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const columns = [8, 15.2, 22.4, 29.6, 36.8, 44];
  return (
    <G testID="atlas-landmark-ancient-greece"
      pointerEvents="none"
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={0.94}>
      {/* A grounded stone silhouette and three stepped foundation courses. */}
      <Path d="M4 33 L48 33 L51 36 L1 36 Z" fill="#132B36" opacity={0.5} />
      <Rect x={4.5} y={30.6} width={43} height={1.8} rx={0.3} fill="#D8C9A9" opacity={0.65} />
      <Rect x={2.7} y={32.6} width={46.6} height={1.5} rx={0.25} fill="#F2DFC0" opacity={0.72} />
      <Rect x={0.7} y={34.6} width={50.6} height={1.3} rx={0.25} fill="#B9A886" opacity={0.65} />
      <Path d="M5 30 L47 30" stroke="#FFF2D6" strokeWidth={0.5} opacity={0.65} />

      {/* Six Doric columns with individual flutes, bases and capitals. */}
      {columns.map((left, index) => (
        <G key={`doric-column-${index}`}>
          <Path d={`M ${left + 0.3} 19 L ${left + 3.2} 19 L ${left + 3.6} 30.2 L ${left} 30.2 Z`}
            fill="#F0DFC1" fillOpacity={0.69}
            stroke="#F9E9CE" strokeWidth={0.45} strokeOpacity={0.65} />
          <Path d={`M ${left + 1.1} 19.4 L ${left + 0.9} 29.7 M ${left + 2.15} 19.4 L ${left + 2.3} 29.7`}
            stroke="#7B796F" strokeWidth={0.43} opacity={0.72} />
          <Path d={`M ${left - 0.4} 18.4 L ${left + 3.9} 18.4 L ${left + 3.3} 19.3 L ${left + 0.2} 19.3 Z`}
            fill="#E8D3AB" stroke="#FAEACD" strokeWidth={0.32} />
          <Path d={`M ${left - 0.45} 17.4 L ${left + 3.95} 17.4`}
            stroke="#FFF0D5" strokeWidth={0.85} />
          <Rect x={left - 0.4} y={29.9} width={4.4} height={0.65}
            fill="#F5E3C2" opacity={0.82} />
        </G>
      ))}

      {/* Entablature with small triglyph and metope rhythm. */}
      <Rect x={5} y={13.4} width={42} height={4.2}
        fill="#CDBB98" fillOpacity={0.72} stroke="#FAE9C8" strokeWidth={0.5} />
      {[8.4, 15.7, 23, 30.3, 37.6, 44.1].map((left, index) => (
        <G key={`triglyph-${index}`} opacity={0.72}>
          <Path d={`M ${left} 14.2 V 16.9 M ${left + 0.7} 14.2 V 16.9 M ${left + 1.4} 14.2 V 16.9`}
            fill="none" stroke="#5D615C" strokeWidth={0.48} />
        </G>
      ))}
      <Path d="M3.1 12.6 H48.9 M4.8 17.8 H47.2"
        stroke="#FFF0D2" strokeWidth={1.1} opacity={0.86} />

      {/* The pitched pediment has a tympanum and carved inner cornice. */}
      <Path d="M2.5 12.3 L26 1.8 L49.5 12.3 Z"
        fill="#D3C19F" fillOpacity={0.58} stroke="#FFE6BB"
        strokeOpacity={0.96} strokeWidth={1.15} strokeLinejoin="round" />
      <Path d="M8.6 10.9 L26 4.3 L43.4 10.9 Z"
        fill="#2B3A42" fillOpacity={0.51} stroke="#E5D2AD"
        strokeWidth={0.6} strokeOpacity={0.77} />
      <Path d="M13 9.8 L26 5.8 L39 9.8"
        fill="none" stroke="#F9E4BF" strokeWidth={0.5} opacity={0.57} />
      <Path d="M25.4 6.8 L24.4 8.9 L26 8.3 L27.8 8.9 L26.6 6.8 Z"
        fill="#EBD4AB" opacity={0.79} />
      {/* Fine acroteria and a few weathered joints, not cartoon outlines. */}
      <Path d="M25.9 1.7 L25.9 0 M2.5 12.3 L1.2 11.4 M49.5 12.3 L50.8 11.4"
        fill="none" stroke="#EEDDC0" strokeWidth={0.7} opacity={0.74} />
      <Path d="M10.6 14.3 L11.1 16 M40.6 14.4 L40.2 16.5 M19 33 L23 33"
        stroke="#534E52" strokeWidth={0.45} opacity={0.37} />
    </G>
  );
}

function wrapTitle(title: string, maxCharacters: number): string[] {
  // Display the actual catalogue title: removing '&' silently changes it.
  const cleaned = title.replace(/\s+/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
    } else if (`${line} ${word}`.length <= maxCharacters) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 2);
}

export default function FantasyMap({
  regions,
  onSelectRegion,
  emptyMessage = "Νέες περιοχές θα εμφανιστούν εδώ.",
  overview = false,
  minHeight = 0,
  onControlsHeightChange,
  backgroundImage,
}: Props) {
  const [showList, setShowList] = useState(false);
  const columns = columnCount(regions.length);
  const rows = Math.max(1, overview ? overviewRows(regions.length).length : Math.ceil(regions.length / columns));
  const naturalHeight = regions.length === 1 ? 198 : overview ? rows * 128 + 32 : rows * 144 + 16;
  const mapHeight = overview ? naturalHeight : Math.max(naturalHeight, Math.min(960, minHeight));
  const positionedRegions = useMemo(() => makeLayout(regions, overview, mapHeight), [regions, overview, mapHeight]);
  // Larger text is practical because the layout uses at most three columns for
  // up to 24 regions. Large catalogues retain a list view for full labels.
  const labelFontSize = overview ? 12.5 : columns >= 4 ? 10 : columns === 3 ? 11 : 12.5;
  const maxLabelChars = columns >= 4 ? 10 : columns === 3 ? 12 : 16;

  if (regions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyStar}>✧</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const connectorPaths = positionedRegions.slice(1).map((region, index) => {
    const previous = positionedRegions[index];
    const controlX = (previous.cx + region.cx) / 2;
    const controlY = (previous.cy + region.cy) / 2 - 18;

    return {
      key: `${previous.id}-${region.id}`,
      d: `M ${previous.cx} ${previous.cy} Q ${controlX} ${controlY} ${region.cx} ${region.cy}`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.viewControls, overview && styles.overviewControls]}
        onLayout={event => onControlsHeightChange?.(event.nativeEvent.layout.height)}>
        <Text style={overview ? styles.overviewLabel : styles.mapEyebrow}>
          {overview ? "Θεματικές" : regions.length + " ΠΕΡΙΟΧΕΣ"}
        </Text>
        <View style={styles.modeSwitch}>
          {([{ label: "Χάρτης", list: false }, { label: "Λίστα", list: true }] as const).map(mode => (
            <Pressable key={mode.label} accessibilityRole="button"
              testID={mode.list ? "atlas-list-toggle" : "atlas-map-toggle"}
              accessibilityLabel={mode.list ? "Προβολή ως λίστα" : "Προβολή χάρτη"}
              accessibilityState={{ selected: showList === mode.list }}
              onPress={() => setShowList(mode.list)}
              style={[styles.viewButton, showList === mode.list && styles.viewButtonActive]}>
              <Text style={[styles.viewButtonText, showList === mode.list && styles.viewButtonTextActive]}>{mode.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!showList ? <View testID="knowledge-world-map" style={[styles.mapFrame, overview && styles.overviewFrame, { aspectRatio: MAP_WIDTH / mapHeight }]}>
      {backgroundImage && !overview ? (
        <Image testID="history-midnight-atlas-art" pointerEvents="none"
          source={backgroundImage} resizeMode="cover" style={styles.backgroundArt}
          accessible={false} />
      ) : null}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
        preserveAspectRatio="xMidYMid meet"
        accessibilityLabel="Διαδραστικός φανταστικός χάρτης γνώσης"
      >
        <Defs>
          <LinearGradient id="atlas-sea" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#172C36" /><Stop offset="1" stopColor="#101C27" />
          </LinearGradient>
          {positionedRegions.map((region) => (
            <LinearGradient key={region.id} id={`land-${region.seed}`} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor={region.fill} /><Stop offset="1" stopColor="#253B40" />
            </LinearGradient>
          ))}
          <LinearGradient id="atlas-progress-lavender" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#DFD2FF" />
            <Stop offset="1" stopColor="#A38DFF" />
          </LinearGradient>
          <LinearGradient id="atlas-progress-gold" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFE9AD" />
            <Stop offset="1" stopColor="#DEB766" />
          </LinearGradient>
        </Defs>
        <Rect width={MAP_WIDTH} height={mapHeight} rx={20} fill="url(#atlas-sea)" fillOpacity={backgroundImage ? 0.03 : 1} />
        {!backgroundImage && Array.from({ length: 9 }, (_, index) => (
          <Path key={`meridian-${index}`} d={`M ${index * 45} 0 Q ${index * 45 - 45} ${mapHeight / 2} ${index * 45} ${mapHeight}`}
            stroke="#7CA8AC" strokeOpacity={0.07} fill="none" />
        ))}
        {!backgroundImage && Array.from({ length: rows * 4 }, (_, index) => (
          <Path key={`parallel-${index}`} d={`M 0 ${index * 40} Q 180 ${index * 40 + 30} 360 ${index * 40}`}
            stroke="#7CA8AC" strokeOpacity={0.07} fill="none" />
        ))}
        {!backgroundImage ? <Rect x={7} y={7} width={346} height={mapHeight - 14} rx={15} fill="none" stroke="#89AAA6" strokeOpacity={0.18} /> : null}
        {!backgroundImage ? <G opacity={0.65}>
          <Circle cx={326} cy={30} r={13} fill="none" stroke="#C9BB92" strokeWidth={0.6} />
          <Path d="M326 13 L330 30 L326 45 L322 30 Z" fill="#C9BB92" />
          <Path d="M312 30 L326 26 L340 30 L326 34 Z" fill="#799B9D" />
          <SvgText x={305} y={23} fill="#C9BB92" fontSize={7}>Β</SvgText>
        </G> : null}
        {connectorPaths.map((connector) => (
          <Path
            key={connector.key}
            d={connector.d}
            fill="none"
            stroke="#BEB896"
            strokeWidth={1}
            strokeDasharray="2 5"
            opacity={backgroundImage ? 0 : 0.32}
          />
        ))}

        {positionedRegions.map((region) => {
          const points = makeIslandPoints(
            region.cx,
            region.cy,
            region.rx,
            region.ry,
            region.seed,
          );
          const islandPath = smoothClosedPath(points);
          const innerPoints = makeIslandPoints(
            region.cx,
            region.cy,
            region.rx * 0.79,
            region.ry * 0.77,
            region.seed + 0.42,
          );
          const innerPath = region.progressLoaded && region.totalLessons
            ? upperIslandContour(innerPoints)
            : smoothClosedPath(innerPoints);
          return (
            <G
              key={region.id}
              pointerEvents="none"
            >
              <Path d={islandPath} transform="translate(0 5)" fill="#050F18" opacity={backgroundImage ? 0.12 : 0.6} />
              <Path d={islandPath} fill="none"
                stroke={region.status === "in-progress" ? "#B1A5FF" : region.fill}
                strokeWidth={region.status === "in-progress" ? 17 : 13}
                strokeOpacity={backgroundImage ? 0.12 : region.status === "in-progress" ? 0.25 : 0.09} />
              <Path d={islandPath} fill="none" stroke="#94C0B7" strokeWidth={6} strokeOpacity={backgroundImage ? 0.04 : 0.13} />
              <Path
                d={islandPath}
                fill={`url(#land-${region.seed})`}
                fillOpacity={backgroundImage ? 0.09 : 0.92}
                stroke={region.status === "complete" ? "#E5C989"
                  : region.status === "in-progress" ? "#C2B3FF" : "#CFC9A9"}
                strokeWidth={region.status === "in-progress" ? 2 : 1.35}
                strokeOpacity={backgroundImage ? 0.42 : region.status === "in-progress" || region.status === "complete" ? 0.95 : 0.62}
              />
              <Path
                d={innerPath}
                fill="none"
                stroke="#D7D3B4"
                strokeWidth={0.7}
                strokeDasharray="2 4"
                strokeOpacity={backgroundImage ? 0 : 0.42}
              />

              {/* Small nearby islets make the landmasses feel like a fantasy atlas. */}
              {!backgroundImage ? <G><Circle
                cx={region.cx - region.rx * 0.89}
                cy={region.cy + region.ry * 0.52}
                r={Math.max(2.1, region.rx * 0.075)}
                fill={region.fill}
                stroke="#CFC9A9"
                strokeWidth={0.6}
                strokeOpacity={0.5}
              />
              <Circle
                cx={region.cx + region.rx * 0.91}
                cy={region.cy - region.ry * 0.48}
                r={Math.max(1.7, region.rx * 0.055)}
                fill={region.fill}
                stroke="#CFC9A9"
                strokeWidth={0.6}
                strokeOpacity={0.4}
              /></G> : null}

              {/* Other islands keep their original mountain motif; the first
                  bespoke landmark is exclusive to Αρχαία Ελλάδα. */}
              {!backgroundImage && (overview || region.id !== "ancient-greece") ? (
                <G>
                  <Path d={`M ${region.cx - 25} ${region.cy - 18} l 10 -14 l 10 14 m -7 -2 l 14 -20 l 16 20`}
                    fill="none" stroke="#EEE5C7" strokeOpacity={0.28} strokeWidth={1.1} strokeLinejoin="round" />
                  <Path d={`M ${region.cx - 20} ${region.cy - 18} l 5 -7 l 5 7 m 9 -8 l 3 -5 l 5 6`}
                    fill="none" stroke="#EEE5C7" strokeOpacity={0.3} strokeWidth={0.8} />
                </G>
              ) : null}
            </G>
          );
        })}

        {/* Draw every label after every island. Avoid text strokes, which can
            reduce the visible white fill of small glyphs on Android. */}
        {positionedRegions.map((region) => {
          const labelLines = wrapTitle(region.title, maxLabelChars);
          const isAncientGreeceLandmark = !overview && region.id === "ancient-greece";
          // The Doric pediment is detailed enough to deserve breathing room;
          // shift its title down slightly and bring the progress pill nearer.
          // Other destinations keep their established spacing for now.
          const labelStartY = region.cy + (isAncientGreeceLandmark ? 1 : -3);
          const barY = isAncientGreeceLandmark
            ? region.cy + (labelLines.length > 1 ? 27 : 18)
            : region.cy + (labelLines.length > 1 ? 30 : 23);
          const barWidth = region.rx * 0.82;
          const barHeight = 5.5;
          const barX = region.cx - barWidth / 2;
          const canShowProgress = region.progressLoaded && (region.totalLessons ?? 0) > 0;
          const progressRatio = canShowProgress
            ? Math.max(0, Math.min(1, (region.completedLessons ?? 0) / (region.totalLessons ?? 1)))
            : 0;
          const fillWidth = barWidth * progressRatio;
          const isComplete = region.status === "complete";

          return (
            <G key={`label-${region.id}`} opacity={1} fillOpacity={1} stroke="none"
              testID={`atlas-island-${region.id}`}
              accessible accessibilityRole="button"
              accessibilityLabel={region.title + (region.progressLoaded
                ? ", " + region.completedLessons + " από " + region.totalLessons + " μαθήματα"
                : region.status === "coming-soon" ? ", σύντομα" : "")}
              onPress={() => onSelectRegion(region.id)}>
              {/* Preserve the whole island as a touch target, including coasts. */}
              <Path d={smoothClosedPath(makeIslandPoints(region.cx, region.cy, region.rx, region.ry, region.seed))}
                fill="transparent" />
              {backgroundImage ? (
                region.status === "complete" ? <SvgText x={region.cx + 30} y={region.cy - 21} textAnchor="middle" fontSize={11} fontWeight="700" fill="#F4D996">✓</SvgText> : null
              ) : isAncientGreeceLandmark ? (
                <G>
                  <AncientGreekTemple x={region.cx - 26 * (columns >= 3 ? 0.84 : 1)}
                    y={region.cy - (columns >= 3 ? 44 : 51)}
                    scale={columns >= 3 ? 0.84 : 1} />
                  {region.status === "complete" ? (
                    <SvgText x={region.cx + 31} y={region.cy - 23}
                      textAnchor="middle" fontSize={11} fontWeight="700"
                      fill="#F4D996">✓</SvgText>
                  ) : null}
                </G>
              ) : (
                <SvgText
                  x={region.cx}
                  y={region.cy - 22}
                  fontSize={columns >= 4 ? 12 : 20}
                  textAnchor="middle"
                  fill="#FFFFFF"
                >
                  {region.status === "complete" ? "✓" : region.emoji ?? "✦"}
                </SvgText>
              )}

              {labelLines.map((line, index) => (
                <SvgText
                  key={`${region.id}-label-${index}`}
                  x={region.cx}
                  y={labelStartY + index * (labelFontSize + 2)}
                  fontSize={labelFontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  fill="#FFFFFF"
                >
                  {line}
                </SvgText>
              ))}

              {region.status === "coming-soon" ? (
                <SvgText x={region.cx} y={barY + 4}
                  fontSize={9} fontWeight="600" textAnchor="middle"
                  fill="#EFE6D2">Σύντομα</SvgText>
              ) : null}
              {canShowProgress ? (
                <G testID={`atlas-progress-${region.id}`} pointerEvents="none">
                  {/* A soft, dark backing keeps map decorations from running
                      behind the bar. The pale track stays visible at 0%. */}
                  <Rect x={barX - 3} y={barY - 3}
                    width={barWidth + 6} height={barHeight + 6} rx={6}
                    fill="#12232E" opacity={0.46} />
                  <Rect testID={`atlas-progress-track-${region.id}`}
                    x={barX} y={barY} width={barWidth} height={barHeight}
                    rx={barHeight / 2} fill="#65717E" fillOpacity={0.76}
                    stroke="#E2E7E5" strokeOpacity={0.32} strokeWidth={0.65} />
                  {progressRatio > 0 ? (
                    <G>
                      <Rect x={barX - 2} y={barY - 2}
                        width={fillWidth + 4} height={barHeight + 4}
                        rx={barHeight / 2 + 2}
                        fill={isComplete ? "#F5D58E" : "#C0B1FF"} opacity={0.16} />
                      <Rect testID={`atlas-progress-fill-${region.id}`}
                        x={barX} y={barY} width={fillWidth}
                        height={barHeight} rx={barHeight / 2}
                        fill={isComplete ? "url(#atlas-progress-gold)" : "url(#atlas-progress-lavender)"} />
                    </G>
                  ) : null}
                </G>
              ) : null}
            </G>
          );
        })}
      </Svg>
      </View> : null}

      {showList ? (
        <View testID="knowledge-region-list" style={styles.regionList}>
          {positionedRegions.map((region) => (
            <Pressable
              key={`list-${region.id}`}
              style={[styles.regionListItem, overview && styles.overviewListItem]}
              onPress={() => onSelectRegion(region.id)}
              accessibilityRole="button"
              accessibilityLabel={region.title + (region.progressLoaded
                ? ", " + region.completedLessons + " από " + region.totalLessons + " μαθήματα"
                : region.detail ? ", " + region.detail : "")}
              accessibilityHint="Άνοιγμα αυτής της χώρας ή περιοχής γνώσης"
            >
              <View style={[styles.regionListIcon, { backgroundColor: region.fill }]}>
                <Text style={styles.regionListEmoji}>{region.status === "complete" ? "✓" : region.emoji ?? "✦"}</Text>
              </View>
              <View style={styles.regionListText}>
                <Text style={styles.regionListTitle}>{region.title}</Text>
                {region.detail ? (
                  <Text style={styles.regionListDetail}>{region.progressLoaded
                    ? region.completedLessons + " / " + region.totalLessons + " μαθήματα"
                    : region.detail}</Text>
                ) : null}
                {region.progressLoaded && region.totalLessons ? (
                  <View style={styles.listProgressTrack}>
                    <View style={[styles.listProgressFill, {
                      width: Math.round((region.completedLessons ?? 0) / region.totalLessons * 100) + "%",
                    }]} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.regionListArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  backgroundArt: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  mapFrame: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#33454C",
    marginBottom: 0,
  },
  viewControls: { flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 520,
    alignItems: "center", justifyContent: "space-between", marginTop: 3, marginBottom: 8 },
  mapEyebrow: { color: "#A7AAC1", fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 1.1 },
  modeSwitch: { flexDirection: "row", borderRadius: 12, backgroundColor: "#191D2A", padding: 3 },
  overviewFrame: { maxWidth: 520, alignSelf: "center" },
  overviewControls: { flexWrap: "wrap", rowGap: 8, marginTop: 4, marginBottom: 10 },
  overviewLabel: { flex: 1, minWidth: 72, color: "#AAB3BF", fontSize: 13, lineHeight: 20, paddingRight: 8 },
  overviewListItem: { paddingVertical: 10, paddingHorizontal: 12, minHeight: 60 },
  viewButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9, minHeight: 40, justifyContent: "center" },
  viewButtonActive: { backgroundColor: "#343448" },
  viewButtonText: { color: "#AAB3BF", fontSize: 12, fontWeight: "700" },
  viewButtonTextActive: { color: "#F3EEE2" },
  regionList: {
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  listProgressTrack: { height: 4, borderRadius: 3, backgroundColor: "#30354A",
    marginTop: 7, overflow: "hidden", width: "85%" },
  listProgressFill: { height: "100%", borderRadius: 3, backgroundColor: "#B1A5FF" },
  regionListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#151928",
    borderWidth: 1,
    borderColor: "#282D41",
    borderRadius: 15,
  },
  regionListIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  regionListEmoji: {
    fontSize: 18,
  },
  regionListText: {
    flex: 1,
  },
  regionListTitle: {
    color: "#F3EEE2",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  regionListDetail: {
    color: "#9EA3BA",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  regionListArrow: {
    color: "#B1A5FF",
    fontSize: 24,
    paddingHorizontal: 3,
  },
  empty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emptyStar: {
    color: "#B1A5FF",
    fontSize: 34,
    marginBottom: 10,
  },
  emptyText: {
    color: "#9EA3BA",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
