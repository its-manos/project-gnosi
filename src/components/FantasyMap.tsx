import { useMemo, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import { AtlasAtmosphereBreath, AtlasDestinationFeedback, AtlasTwinkleStar } from "./CategoryAtlasMotion";

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
  /** Available fixed atlas area; only Category screens use the compact constellation layout. */
  fitViewport?: { width: number; height: number };
  /** Category Atlas shows only the exploration map, without a count or mode switch. */
  hideControls?: boolean;
  /** Static chart is rendered behind this interactive SVG as its own layer. */
  externalBackground?: boolean;
  onControlsHeightChange?: (height: number) => void;
  /** Fires once the interactive SVG has completed native layout. */
  onMapLayout?: () => void;
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

/** Keep constellation threads outside the islands, never through labels.
 * Independent destinations have no order: this is only decorative geometry. */
export function getAtlasConnectorSegment(
  from: Point & { rx: number; ry: number },
  to: Point & { rx: number; ry: number },
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return "";
  const edge = (point: { rx: number; ry: number }) =>
    length / Math.hypot(dx / Math.max(1, point.rx), dy / Math.max(1, point.ry));
  // Short links keep a minimum visible strand; long links stop just clear of
  // each landmass, even when the destination has an irregular shoreline.
  const fromInset = Math.min(length * 0.43, edge(from) + 8);
  const toInset = Math.min(length * 0.43, edge(to) + 8);
  const ux = dx / length;
  const uy = dy / length;
  return `M ${(from.x + ux * fromInset).toFixed(1)} ${(from.y + uy * fromInset).toFixed(1)} L ${(to.x - ux * toInset).toFixed(1)} ${(to.y - uy * toInset).toFixed(1)}`;
}

function overviewRows(count: number): number[] {
  if (count === 5) return [2, 3];
  if (count === 6) return [3, 3];
  if (count === 7) return [2, 3, 2];
  if (count === 8) return [3, 2, 3];
  const columns = columnCount(count);
  return Array.from({ length: Math.ceil(count / columns) }, (_, row) => Math.min(columns, count - row * columns));
}

// Compact, asymmetric constellations keep small catalogues spread across the
// canvas without pushing their last destination to the far bottom edge.
// Normalized coordinates make the same composition work on tall and short phones.
export function getCompactAtlasPoint(index: number, count: number): Point | null {
  const arrangements: Record<number, Point[]> = {
    2: [{ x: 0.31, y: 0.36 }, { x: 0.69, y: 0.64 }],
    3: [{ x: 0.30, y: 0.25 }, { x: 0.72, y: 0.46 }, { x: 0.39, y: 0.73 }],
    4: [
      { x: 0.28, y: 0.23 }, { x: 0.73, y: 0.36 },
      { x: 0.27, y: 0.65 }, { x: 0.72, y: 0.79 },
    ],
  };
  return arrangements[count]?.[index] ?? null;
}

// Scale the island silhouette to the room available without shrinking Greek
// labels or creating overlapping hit targets on compact devices.
export function getCompactAtlasRadii(count: number, mapHeight: number) {
  const room = Math.max(0, Math.min(1, (mapHeight - 260) / 240));
  const base = count === 4 ? 53 : count === 2 ? 60 : 57;
  return {
    rx: Math.round(base + (count === 4 ? 11 : 12) * room),
    ry: Math.round(39 + 12 * room),
  };
}

function makeLayout(regions: MapRegion[], overview: boolean, mapHeight: number, fitted: boolean): PositionedRegion[] {
  const count = regions.length;
  if (count === 0) return [];

  const columns = fitted && count > 4 ? 3 : columnCount(count);
  const cellWidth = MAP_WIDTH / columns;
  const totalRows = Math.ceil(count / columns);
  // Anchor islands to the available canvas, rather than leaving a short map
  // floating above an empty viewport. Row spacing stays safe for long titles.
  const edgeMargin = totalRows <= 1 ? mapHeight / 2
    : Math.max(78, Math.min(138, (mapHeight - (totalRows - 1) * 140) / 2));
  const rowStep = totalRows <= 1 ? 0 : (mapHeight - edgeMargin * 2) / (totalRows - 1);

  const rowSizes = overviewRows(count);
  return regions.map((region, index) => {
    if (fitted && count > 1) {
      const compactPoint = getCompactAtlasPoint(index, count);
      if (compactPoint) {
        // Destinations grow on larger screens, but keep safe spacing on small
        // viewports. Positions remain independently selectable.
        const radii = getCompactAtlasRadii(count, mapHeight);
        return {
          ...region,
          cx: MAP_WIDTH * compactPoint.x,
          cy: Math.max(74, Math.min(mapHeight - 77, mapHeight * compactPoint.y)),
          ...radii,
          seed: index + 1, fill: region.color ?? LAND_COLORS[index % LAND_COLORS.length],
        };
      }

      // For larger catalogues, balanced constellations remain fully visible.
      // Use moderate insets instead of pinning the first/last row to the edges.
      let row = 0;
      let column = index;
      while (column >= rowSizes[row]) { column -= rowSizes[row]; row += 1; }
      const cell = MAP_WIDTH / rowSizes[row];
      const edge = Math.max(67, Math.min(mapHeight * 0.27, mapHeight / 2 - 36));
      const yStep = rowSizes.length === 1 ? 0
        : (mapHeight - edge * 2) / (rowSizes.length - 1);
      return {
        ...region,
        cx: cell * (column + 0.5) + Math.sin(index * 1.7) * 2.5,
        cy: rowSizes.length === 1 ? mapHeight / 2 : edge + row * yStep,
        rx: Math.min(61, cell * 0.42),
        ry: Math.min(48, Math.max(36, mapHeight / (rowSizes.length * 3))),
        seed: index + 1, fill: region.color ?? LAND_COLORS[index % LAND_COLORS.length],
      };
    }
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

// Preserve every word on the fitted category map. When the normal wrap would
// need three lines, choose a balanced two-line split and scale the text rather
// than silently dropping the last part of a Greek destination name.
export function wrapFittedAtlasTitle(title: string, maxCharacters: number): string[] {
  const cleaned = title.replace(/\s+/g, " ").trim();
  const wrapped = wrapTitle(cleaned, maxCharacters);
  if (wrapped.join(" ") === cleaned) return wrapped;
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length < 2) return [cleaned];
  let best: string[] = [cleaned];
  let bestScore = Infinity;
  for (let index = 1; index < words.length; index++) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const score = Math.max(first.length, second.length) +
      Math.abs(first.length - second.length) * 0.2;
    if (score < bestScore) { best = [first, second]; bestScore = score; }
  }
  return best;
}

export default function FantasyMap({
  regions,
  onSelectRegion,
  emptyMessage = "Νέες περιοχές θα εμφανιστούν εδώ.",
  overview = false,
  minHeight = 0,
  fitViewport,
  hideControls = false,
  externalBackground = false,
  onControlsHeightChange,
  onMapLayout,
}: Props) {
  const [showList, setShowList] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(50);
  // Press feedback uses a UI-thread shared value. A touch must not re-render
  // the entire cartographic SVG just to light up one island coastline.
  const pressedRegion = useSharedValue<string | null>(null);
  const fitted = Boolean(fitViewport?.width && fitViewport?.height);
  // Both platforms use the same Android-friendly decorative detail budget,
  // preserving every island, label, progress marker and press interaction.
  const sharedLite = fitted;
  const columns = fitted && regions.length > 4 ? 3 : columnCount(regions.length);
  const rows = Math.max(1, overview || fitted
    ? overviewRows(regions.length).length : Math.ceil(regions.length / columns));
  const naturalHeight = regions.length === 1 ? 198 : overview ? rows * 128 + 32 : rows * 144 + 16;
  // Match the measured on-screen width and free height. The fixed Category
  // atlas keeps all destinations visible without making users chase a path.
  const fittedCanvasHeight = fitted
    ? Math.max(160, fitViewport!.height - (hideControls ? 0 : controlsHeight)
      - (hideControls ? 0 : 11)) : 0;
  const mapHeight = fitted
    ? Math.max(180, Math.round(fittedCanvasHeight * MAP_WIDTH / Math.min(520, fitViewport!.width)))
    : overview ? naturalHeight : Math.max(naturalHeight, Math.min(960, minHeight));
  const positionedRegions = useMemo(
    () => makeLayout(regions, overview, mapHeight, fitted),
    [regions, overview, mapHeight, fitted],
  );
  // Larger text is practical because the layout uses at most three columns for
  // up to 24 regions. Large catalogues retain a list view for full labels.
  // Match Adventure Path stop labels: platform system face, 800 weight,
  // 12-ish point type and muted text. Longer names still scale to two lines.
  const labelFontSize = overview ? 12.5
    : fitted ? (regions.length <= 4 ? 12.5 : columns >= 4 ? 10.5 : 11.5)
    : columns >= 4 ? 10 : columns === 3 ? 11 : 12.5;
  // Compact island contours curve inward at title height. Even when a title
  // fits in the overall SVG width it can touch the coast, so keep multiword
  // names to shorter lines inside the island's central safe area.
  const maxLabelChars = fitted && regions.length <= 4 ? 11
    : fitted && columns === 3 ? 12 : columns >= 4 ? 10 : columns === 3 ? 12 : 16;

  if (regions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyStar}>✧</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const linked = new Set<string>();
  const connectorPaths = positionedRegions.flatMap((region, index) => {
    const neighbours = fitted
      ? positionedRegions.filter(other => other.id !== region.id)
        .sort((a, b) => Math.hypot(a.cx - region.cx, a.cy - region.cy)
          - Math.hypot(b.cx - region.cx, b.cy - region.cy)).slice(0, 2)
      : index ? [positionedRegions[index - 1]] : [];
    return neighbours.flatMap(other => {
      const key = [region.id, other.id].sort().join("-");
      if (linked.has(key)) return [];
      linked.add(key);
      const controlX = (region.cx + other.cx) / 2;
      const controlY = (region.cy + other.cy) / 2 - 18;
      return [{
        key,
        midX: controlX,
        midY: (region.cy + other.cy) / 2,
        d: fitted
          ? getAtlasConnectorSegment(
              { x: region.cx, y: region.cy, rx: region.rx, ry: region.ry },
              { x: other.cx, y: other.cy, rx: other.rx, ry: other.ry },
            )
          : `M ${other.cx} ${other.cy} Q ${controlX} ${controlY} ${region.cx} ${region.cy}`,
      }];
    });
  });
  const ListContainer = fitted ? ScrollView : View;

  return (
    <View style={styles.container}>
      {!hideControls ? <View style={[styles.viewControls, overview && styles.overviewControls]}
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          setControlsHeight(previous => Math.abs(previous - height) < 1 ? previous : height);
          onControlsHeightChange?.(height);
        }}>
        <Text style={overview ? styles.overviewLabel : fitted ? styles.fittedMapEyebrow : styles.mapEyebrow}>
          {overview ? "Θεματικές" : regions.length + " ΠΕΡΙΟΧΕΣ"}
        </Text>
        <View style={[styles.modeSwitch, fitted && styles.fittedModeSwitch]}>
          {([{ label: "Χάρτης", list: false }, { label: "Λίστα", list: true }] as const).map(mode => (
            <Pressable key={mode.label} accessibilityRole="button"
              testID={mode.list ? "atlas-list-toggle" : "atlas-map-toggle"}
              accessibilityLabel={mode.list ? "Προβολή ως λίστα" : "Προβολή χάρτη"}
              accessibilityState={{ selected: showList === mode.list }}
              onPress={() => setShowList(mode.list)}
              style={[styles.viewButton, showList === mode.list && styles.viewButtonActive,
                fitted && showList === mode.list && styles.fittedViewButtonActive]}>
              <Text style={[styles.viewButtonText, showList === mode.list && styles.viewButtonTextActive,
                fitted && styles.fittedViewButtonText,
                fitted && showList === mode.list && styles.fittedViewButtonTextActive]}>{mode.label}</Text>
            </Pressable>
          ))}
        </View>
      </View> : null}
      {(!showList || hideControls) ? <View testID="knowledge-world-map" style={[styles.mapFrame, overview && styles.overviewFrame,
        { aspectRatio: MAP_WIDTH / mapHeight }, fitted && styles.fittedFrame,
        fitted && externalBackground && styles.externalBackgroundFrame]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onLayout={onMapLayout}
        accessibilityLabel="Διαδραστικός φανταστικός χάρτης γνώσης"
      >
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
          {positionedRegions.map(region => (
                <RadialGradient key={`atlas-region-aura-${region.id}`}
                  id={`atlas-region-aura-${region.seed}`}
                  cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0" stopColor={region.status === "complete"
                    ? "#C8AA73" : region.fill} stopOpacity={region.status === "in-progress" ? 0.23 : 0.16} />
                  <Stop offset="0.55" stopColor={region.status === "complete"
                    ? "#BBA27C" : region.fill} stopOpacity={0.08} />
                  <Stop offset="1" stopColor={region.fill} stopOpacity={0} />
                </RadialGradient>
              ))}
            </>
          ) : null}
          {positionedRegions.map((region) => fitted ? (
            <LinearGradient key={region.id} id={`land-${region.seed}`} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor={region.fill} />
              <Stop offset="0.45" stopColor="#343D4F" />
              <Stop offset="1" stopColor="#1D2738" />
            </LinearGradient>
          ) : (
            <LinearGradient key={region.id} id={`land-${region.seed}`} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor={region.fill} />
              <Stop offset="1" stopColor="#253B40" />
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
        {(!fitted || !externalBackground) ? <>
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
        </> : null}
        <G testID={fitted ? "atlas-premium-compass" : undefined}
          opacity={fitted ? 0.83 : 0.65} pointerEvents="none">
          {fitted ? (
            <G>
              <Circle cx={326} cy={30} r={18} fill="#101827" fillOpacity={0.52}
                stroke="#BDAF8D" strokeWidth={0.55} strokeOpacity={0.6} />
              <Circle cx={326} cy={30} r={15.3} fill="none"
                stroke="#879CAA" strokeWidth={0.55} strokeOpacity={0.5}
                strokeDasharray="1 4" />
              <Path d="M326 8 V 12 M326 48 V52 M304 30 H308 M344 30 H348"
                fill="none" stroke="#D0BF9A" strokeWidth={0.8} strokeOpacity={0.72} />
            </G>
          ) : <Circle cx={326} cy={30} r={13} fill="none"
            stroke="#C9BB92" strokeWidth={0.6} />}
          <Path d="M326 13 L330 30 L326 45 L322 30 Z"
            fill={fitted ? "#D5C49C" : "#C9BB92"} />
          <Path d="M312 30 L326 26 L340 30 L326 34 Z" fill="#799B9D" />
          <SvgText x={fitted ? 297 : 305} y={23} fill="#C9BB92" fontSize={7}>Β</SvgText>
        </G>
        {fitted ? positionedRegions.map(region => (
          <Circle key={`atlas-ambient-${region.id}`} cx={region.cx} cy={region.cy}
            r={region.rx * 1.88} fill={`url(#atlas-region-aura-${region.seed})`}
            pointerEvents="none" />
        )) : null}
        {connectorPaths.map(connector => (
          <G key={connector.key} pointerEvents="none">
            {fitted ? (
              <Path d={connector.d} fill="none" stroke="#859CB3"
                strokeWidth={2.5} opacity={0.10} />
            ) : null}
            <Path d={connector.d} fill="none" stroke={fitted ? "#D5C3AA" : "#BEB896"}
              strokeWidth={fitted ? 0.85 : 1} strokeDasharray="2 5"
              opacity={fitted ? 0.43 : 0.32} />
            {fitted && regions.length <= 4 && connector.d ? (
              <G testID={`atlas-route-anchor-${connector.key}`} pointerEvents="none">
                <Circle cx={connector.midX} cy={connector.midY} r={4.2}
                  fill="#D3C6AF" opacity={0.11} />
                <Circle cx={connector.midX} cy={connector.midY} r={1.5}
                  fill="#DDCDB4" opacity={0.62} />
              </G>
            ) : null}
          </G>
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
              <Path d={islandPath} transform={fitted ? "translate(0 4)" : "translate(0 5)"}
                fill="#050F18" opacity={fitted ? 0.75 : 0.6} />
              <Path d={islandPath} fill="none"
                stroke={fitted
                  ? region.status === "in-progress" ? "#C5B7FF"
                    : region.status === "complete" ? "#BBA27C" : "#6C668A"
                  : region.status === "in-progress" ? "#B1A5FF" : region.fill}
                strokeWidth={fitted ? (region.status === "in-progress" ? 12 : 8)
                  : region.status === "in-progress" ? 17 : 13}
                strokeOpacity={fitted ? (region.status === "in-progress" ? 0.16 : 0.07)
                  : region.status === "in-progress" ? 0.25 : 0.09} />
              <Path d={islandPath} fill="none"
                stroke={fitted ? "#7C7691" : "#94C0B7"}
                strokeWidth={fitted ? 4 : 6} strokeOpacity={fitted ? 0.12 : 0.13} />
              <Path
                d={islandPath}
                fill={`url(#land-${region.seed})`}
                fillOpacity={fitted ? 0.88 : 0.92}
                stroke={fitted
                  ? region.status === "complete" ? "#BBA27C"
                    : region.status === "in-progress" ? "#C5B7FF" : "#6C668A"
                  : region.status === "complete" ? "#E5C989"
                    : region.status === "in-progress" ? "#C2B3FF" : "#CFC9A9"}
                strokeWidth={region.status === "in-progress" ? 2 : 1.35}
                strokeOpacity={region.status === "in-progress" || region.status === "complete" ? 0.95 : 0.62}
              />
              {fitted ? (
                <G pointerEvents="none">
                  {/* Thin ink seam and a restrained engraved upper ridge give
                      the landmass depth. Keep relief away from titles and
                      progress bars; do not add another luminous checkpoint ring. */}
                  <Path testID={`atlas-rim-${region.id}`} d={islandPath}
                    fill="none" stroke="#0D1627" strokeWidth={2.6}
                    strokeOpacity={0.55} />
                  <Path testID={`atlas-relief-${region.id}`}
                    d={upperIslandContour(makeIslandPoints(
                      region.cx, region.cy, region.rx * 0.91, region.ry * 0.87, region.seed,
                    ))}
                    fill="none" stroke="#EEE3CF" strokeWidth={0.9}
                    strokeOpacity={0.28} strokeLinecap="round" />
                </G>
              ) : null}
              <Path
                d={innerPath}
                fill="none"
                stroke={fitted ? "#A8916B" : "#D7D3B4"}
                strokeWidth={0.7}
                strokeDasharray="2 4"
                strokeOpacity={fitted ? 0.22 : 0.42}
              />

              {/* Small nearby islets make the landmasses feel like a fantasy atlas. */}
              <Circle
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
              />

              {/* Other islands keep their original mountain motif; the first
                  bespoke landmark is exclusive to Αρχαία Ελλάδα. */}
              {(overview || region.id !== "ancient-greece") ? (
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
          const labelLines = fitted
            ? wrapFittedAtlasTitle(region.title, maxLabelChars)
            : wrapTitle(region.title, maxLabelChars);
          const longestLine = Math.max(1, ...labelLines.map(line => line.length));
          const regionLabelSize = fitted ? Math.max(10.5,
            labelFontSize * Math.min(1, maxLabelChars / longestLine))
            : labelFontSize;
          const isAncientGreeceLandmark = !overview && region.id === "ancient-greece";
          const pressShape = fitted ? smoothClosedPath(makeIslandPoints(
            region.cx, region.cy, region.rx, region.ry, region.seed,
          )) : "";
          // The Doric pediment is detailed enough to deserve breathing room;
          // shift its title down slightly and bring the progress pill nearer.
          // Other destinations keep their established spacing for now.
          const labelStartY = region.cy + (isAncientGreeceLandmark ? 1 : -3);
          const barY = isAncientGreeceLandmark
            ? region.cy + (labelLines.length > 1 ? 27 : 18)
            : region.cy + (labelLines.length > 1 ? (fitted ? 33 : 30) : 23);
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
              onPressIn={fitted ? () => { pressedRegion.value = region.id; } : undefined}
              onPressOut={fitted ? () => {
                if (pressedRegion.value === region.id) pressedRegion.value = null;
              } : undefined}
              onPress={() => {
                pressedRegion.value = null;
                onSelectRegion(region.id);
              }}>
              {/* Preserve the whole island as a touch target, including coasts. */}
              <Path d={fitted ? pressShape : smoothClosedPath(makeIslandPoints(
                region.cx, region.cy, region.rx, region.ry, region.seed,
              ))} fill="transparent" />
              {fitted ? <AtlasDestinationFeedback
                d={pressShape} regionId={region.id} pressedRegion={pressedRegion} /> : null}
              {isAncientGreeceLandmark ? (
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
                  y={labelStartY + index * (regionLabelSize + 2)}
                  fontSize={regionLabelSize}
                  fontWeight={fitted ? "800" : "700"}
                  textAnchor="middle"
                  fill={fitted
                    ? region.status === "in-progress" ? "#C7BCFF"
                      : region.status === "complete" ? "#C1EDD3" : "#D0D2DA"
                    : "#FFFFFF"}
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
      {fitted ? (
        <View testID="atlas-native-ambient-layer" pointerEvents="none"
          accessible={false} style={StyleSheet.absoluteFill}>
          <AtlasAtmosphereBreath />
          {[0, 11, 22, 33, 44].map((star, index) => (
            <AtlasTwinkleStar key={star} index={index} mapHeight={mapHeight}
              cx={14 + stableNoise(star + 91) * (MAP_WIDTH - 28)}
              cy={20 + stableNoise(star + 397) * (mapHeight - 40)} />
          ))}
        </View>
      ) : null}
      </View> : null}

      {showList && !hideControls ? (
        <ListContainer testID="knowledge-region-list"
          style={fitted ? [styles.regionListScroll,
            { maxHeight: Math.max(140, fitViewport!.height - controlsHeight - 11) }] : styles.regionList}>
          <View style={fitted ? styles.regionList : undefined}>
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
        </ListContainer>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  fittedFrame: {
    borderWidth: 0, borderRadius: 0, backgroundColor: "#101827",
  },
  externalBackgroundFrame: { backgroundColor: "transparent" },
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
  fittedMapEyebrow: { color: "#ABB0C1", fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 1.1 },
  modeSwitch: { flexDirection: "row", borderRadius: 12, backgroundColor: "#191D2A", padding: 3 },
  fittedModeSwitch: { backgroundColor: "#191D2D" },
  overviewFrame: { maxWidth: 520, alignSelf: "center" },
  overviewControls: { flexWrap: "wrap", rowGap: 8, marginTop: 4, marginBottom: 10 },
  overviewLabel: { flex: 1, minWidth: 72, color: "#AAB3BF", fontSize: 13, lineHeight: 20, paddingRight: 8 },
  overviewListItem: { paddingVertical: 10, paddingHorizontal: 12, minHeight: 60 },
  viewButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9, minHeight: 40, justifyContent: "center" },
  viewButtonActive: { backgroundColor: "#343448" },
  fittedViewButtonActive: { backgroundColor: "#34304E" },
  viewButtonText: { color: "#AAB3BF", fontSize: 12, fontWeight: "700" },
  viewButtonTextActive: { color: "#F3EEE2" },
  fittedViewButtonText: { color: "#ABB0C1", fontWeight: "800" },
  fittedViewButtonTextActive: { color: "#F3F0E8" },
  regionListScroll: {
    width: "100%", maxWidth: 520, alignSelf: "center",
  },
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
