import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

type MapRegion = {
  id: string;
  title: string;
  emoji?: string;
  detail?: string;
  color?: string;
};

type Props = {
  regions: MapRegion[];
  onSelectRegion: (id: string) => void;
  emptyMessage?: string;
  overview?: boolean;
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
const TOP_PADDING = 76;

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

function makeLayout(regions: MapRegion[], overview: boolean): PositionedRegion[] {
  const count = regions.length;
  if (count === 0) return [];

  const columns = columnCount(count);
  const cellWidth = MAP_WIDTH / columns;

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
    const cx = count === 1
      ? MAP_WIDTH / 2
      : cellWidth * (column + 0.5) + rowOffset + shift + horizontalDrift;
    const verticalDrift = Math.sin((column + 1) * 1.91 + row * 1.47) * 18;
    const cy = count === 1
      ? 82
      : TOP_PADDING + row * ROW_GAP + verticalDrift + (noise - 0.5) * 7;

    const rx = count === 1
      ? 73
      : Math.min(76, cellWidth * (columns >= 4 ? 0.34 : 0.36)) * (0.91 + noise * 0.13);
    const ry = count === 1
      ? 59
      : Math.min(52, cellWidth * 0.43) * (0.91 + stableNoise(index + 5) * 0.15);

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

function wrapTitle(title: string, maxCharacters: number): string[] {
  const cleaned = title.replace(/\s*&\s*/g, " ");
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
}: Props) {
  const [showList, setShowList] = useState(false);
  const positionedRegions = useMemo(() => makeLayout(regions, overview), [regions, overview]);
  const columns = columnCount(regions.length);
  const rows = Math.max(1, overview ? overviewRows(regions.length).length : Math.ceil(regions.length / columns));
  const mapHeight = regions.length === 1 ? 168 : overview ? rows * 128 + 32 : rows * ROW_GAP + 16;
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
      <View style={[styles.viewControls, overview && styles.overviewControls]}>
        {overview ? <Text style={styles.overviewLabel}>Θεματικές</Text> : null}
        {([{ label: "Χάρτης", list: false }, { label: "Λίστα", list: true }] as const).map((mode) => (
          <Pressable key={mode.label} accessibilityRole="button"
            accessibilityLabel={mode.list ? "Προβολή ως λίστα" : "Προβολή χάρτη"}
            accessibilityState={{ selected: showList === mode.list }}
            onPress={() => setShowList(mode.list)}
            style={[styles.viewButton, showList === mode.list && styles.viewButtonActive]}>
            <Text style={[styles.viewButtonText, showList === mode.list && styles.viewButtonTextActive]}>{mode.label}</Text>
          </Pressable>
        ))}
      </View>
      {!showList ? <View testID="knowledge-world-map" style={[styles.mapFrame, overview && styles.overviewFrame, { aspectRatio: MAP_WIDTH / mapHeight }]}>
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
        </Defs>
        <Rect width={MAP_WIDTH} height={mapHeight} rx={20} fill="url(#atlas-sea)" />
        {Array.from({ length: 9 }, (_, index) => (
          <Path key={`meridian-${index}`} d={`M ${index * 45} 0 Q ${index * 45 - 45} ${mapHeight / 2} ${index * 45} ${mapHeight}`}
            stroke="#7CA8AC" strokeOpacity={0.07} fill="none" />
        ))}
        {Array.from({ length: rows * 4 }, (_, index) => (
          <Path key={`parallel-${index}`} d={`M 0 ${index * 40} Q 180 ${index * 40 + 30} 360 ${index * 40}`}
            stroke="#7CA8AC" strokeOpacity={0.07} fill="none" />
        ))}
        <Rect x={7} y={7} width={346} height={mapHeight - 14} rx={15} fill="none" stroke="#89AAA6" strokeOpacity={0.18} />
        <G opacity={0.65}>
          <Circle cx={326} cy={30} r={13} fill="none" stroke="#C9BB92" strokeWidth={0.6} />
          <Path d="M326 13 L330 30 L326 45 L322 30 Z" fill="#C9BB92" />
          <Path d="M312 30 L326 26 L340 30 L326 34 Z" fill="#799B9D" />
          <SvgText x={305} y={23} fill="#C9BB92" fontSize={7}>Β</SvgText>
        </G>
        {connectorPaths.map((connector) => (
          <Path
            key={connector.key}
            d={connector.d}
            fill="none"
            stroke="#BEB896"
            strokeWidth={1}
            strokeDasharray="2 5"
            opacity={0.32}
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
          const innerPath = smoothClosedPath(
            makeIslandPoints(
              region.cx,
              region.cy,
              region.rx * 0.79,
              region.ry * 0.77,
              region.seed + 0.42,
            ),
          );
          const labelLines = wrapTitle(region.title, maxLabelChars);
          const labelStartY = region.cy + 14;
          const detailY = labelStartY + labelLines.length * (labelFontSize + 2) + 1;

          return (
            <G
              key={region.id}
              onPress={() => onSelectRegion(region.id)}
            >
              <Path d={islandPath} transform="translate(0 5)" fill="#050F18" opacity={0.6} />
              <Path d={islandPath} fill="none" stroke={region.fill} strokeWidth={13} strokeOpacity={0.09} />
              <Path d={islandPath} fill="none" stroke="#94C0B7" strokeWidth={6} strokeOpacity={0.13} />
              <Path
                d={islandPath}
                fill={`url(#land-${region.seed})`}
                fillOpacity={0.92}
                stroke="#CFC9A9"
                strokeWidth={1.35}
                strokeOpacity={0.62}
              />
              <Path
                d={innerPath}
                fill="none"
                stroke="#D7D3B4"
                strokeWidth={0.7}
                strokeDasharray="2 4"
                strokeOpacity={0.42}
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

              {/* Terrain sits above the labels; coastlines remain fully tappable. */}
              <Path d={`M ${region.cx - 25} ${region.cy - 18} l 10 -14 l 10 14 m -7 -2 l 14 -20 l 16 20`}
                fill="none" stroke="#EEE5C7" strokeOpacity={0.28} strokeWidth={1.1} strokeLinejoin="round" />
              <Path d={`M ${region.cx - 20} ${region.cy - 18} l 5 -7 l 5 7 m 9 -8 l 3 -5 l 5 6`}
                fill="none" stroke="#EEE5C7" strokeOpacity={0.3} strokeWidth={0.8} />
              <SvgText
                x={region.cx}
                y={region.cy - 5}
                fontSize={columns >= 4 ? 12 : 18}
                textAnchor="middle"
                fill="#FFFFFF"
              >
                {region.emoji ?? "✦"}
              </SvgText>

              {labelLines.map((line, index) => (
                <SvgText
                  key={`${region.id}-label-${index}`}
                  x={region.cx}
                  y={labelStartY + index * (labelFontSize + 2)}
                  fontSize={labelFontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  stroke="#17202B"
                  strokeWidth={0.18}
                >
                  {line}
                </SvgText>
              ))}

              {region.detail ? (
                <SvgText
                  x={region.cx}
                  y={detailY}
                  fontSize={columns >= 5 ? 7.2 : columns === 4 ? 7.8 : 8.2}
                  fontWeight="500"
                  textAnchor="middle"
                  fill="#F0E9D6"
                  opacity={0.88}
                >
                  {region.detail}
                </SvgText>
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
              accessibilityLabel={`${region.title}${region.detail ? `, ${region.detail}` : ""}`}
              accessibilityHint="Άνοιγμα αυτής της χώρας ή περιοχής γνώσης"
            >
              <View style={[styles.regionListIcon, { backgroundColor: region.fill }]}>
                <Text style={styles.regionListEmoji}>{region.emoji ?? "✦"}</Text>
              </View>
              <View style={styles.regionListText}>
                <Text style={styles.regionListTitle}>{region.title}</Text>
                {region.detail ? (
                  <Text style={styles.regionListDetail}>{region.detail}</Text>
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
  mapFrame: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#33454C",
    marginBottom: 12,
  },
  viewControls: { flexDirection: "row", alignSelf: "flex-end", backgroundColor: "#181E2A", padding: 4, borderRadius: 14, marginVertical: 12 },
  overviewFrame: { maxWidth: 520, alignSelf: "center" },
  overviewControls: { flexWrap: "wrap", rowGap: 8, alignSelf: "stretch", alignItems: "center", marginTop: 4, marginBottom: 10, backgroundColor: "transparent", padding: 0 },
  overviewLabel: { flex: 1, minWidth: 72, color: "#AAB3BF", fontSize: 13, lineHeight: 20, paddingRight: 8 },
  overviewListItem: { paddingVertical: 10, paddingHorizontal: 12, minHeight: 60 },
  viewButton: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10, minHeight: 44 },
  viewButtonActive: { backgroundColor: "#343448" },
  viewButtonText: { color: "#AAB3BF", fontSize: 14, fontWeight: "600" },
  viewButtonTextActive: { color: "#F3EEE2" },
  regionList: {
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
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
