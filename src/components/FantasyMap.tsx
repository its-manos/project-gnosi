import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from "react-native-svg";

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
  "#65569B",
  "#326E70",
  "#8B6B42",
  "#3D638F",
  "#8A4F6A",
  "#4D765E",
  "#8A645E",
  "#516A91",
];

function columnCount(count: number) {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
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

function makeLayout(regions: MapRegion[]): PositionedRegion[] {
  const count = regions.length;
  if (count === 0) return [];

  const columns = columnCount(count);
  const cellWidth = MAP_WIDTH / columns;

  return regions.map((region, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const noise = stableNoise(index + 1);

    // Staggered positions with deterministic drift keep the landmasses
    // organic rather than looking like a grid of cards. The layout is
    // recalculated from the number of categories/regions supplied.
    const shift = row % 2 === 1 ? cellWidth * 0.065 : -cellWidth * 0.015;
    const horizontalDrift = Math.cos((index + 1) * 1.63) * cellWidth * 0.055;
    const cx = count === 1
      ? MAP_WIDTH / 2
      : cellWidth * (column + 0.5) + shift + horizontalDrift;
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
}: Props) {
  const [showList, setShowList] = useState(false);
  const positionedRegions = useMemo(() => makeLayout(regions), [regions]);
  const columns = columnCount(regions.length);
  const rows = Math.max(1, Math.ceil(regions.length / columns));
  const mapHeight = regions.length === 1 ? 168 : rows * ROW_GAP + 16;
  // Larger text is practical because the layout uses at most three columns for
  // up to 24 regions. Large catalogues retain a list view for full labels.
  const labelFontSize = columns >= 5 ? 9 : columns === 4 ? 9.6 : 10.2;
  const maxLabelChars = columns >= 5 ? 9 : columns === 4 ? 11 : 12;

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
      <View style={styles.mapFrame}>
      <Svg
        width="100%"
        height={mapHeight}
        viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
        preserveAspectRatio="xMidYMid meet"
        accessibilityLabel="Διαδραστικός φανταστικός χάρτης γνώσης"
      >
        {/* Subtle cartographic contours in the ocean. */}
        <Ellipse cx={MAP_WIDTH / 2} cy={mapHeight / 2} rx={155} ry={Math.max(70, mapHeight * 0.42)} fill="none" stroke="#26354A" strokeWidth={1} opacity={0.38} />
        <Ellipse cx={MAP_WIDTH / 2} cy={mapHeight / 2} rx={128} ry={Math.max(56, mapHeight * 0.34)} fill="none" stroke="#26354A" strokeWidth={1} opacity={0.27} />
        <Ellipse cx={MAP_WIDTH / 2} cy={mapHeight / 2} rx={96} ry={Math.max(42, mapHeight * 0.25)} fill="none" stroke="#26354A" strokeWidth={1} opacity={0.19} />

        {Array.from({ length: 30 }, (_, index) => {
          const x = 13 + ((index * 71) % 334);
          const y = 15 + ((index * 47) % Math.max(20, mapHeight - 25));
          const radius = index % 5 === 0 ? 1.5 : 0.8;
          return (
            <Circle
              key={`star-${index}`}
              cx={x}
              cy={y}
              r={radius}
              fill={index % 4 === 0 ? "#A89BFF" : "#6C89A7"}
              opacity={index % 4 === 0 ? 0.65 : 0.36}
            />
          );
        })}

        {connectorPaths.map((connector) => (
          <Path
            key={connector.key}
            d={connector.d}
            fill="none"
            stroke="#7C8BA8"
            strokeWidth={1}
            strokeDasharray="2 7"
            opacity={0.42}
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
          const labelStartY = region.cy + (labelLines.length > 1 ? 10 : 14);
          const detailY = labelStartY + labelLines.length * (labelFontSize + 2) + 1;

          return (
            <G
              key={region.id}
              onPress={() => onSelectRegion(region.id)}
            >
              <Path
                d={islandPath}
                fill={region.fill}
                fillOpacity={0.92}
                stroke="#B9B6DF"
                strokeWidth={1.35}
                strokeOpacity={0.62}
              />
              <Path
                d={innerPath}
                fill="none"
                stroke="#D8D0FF"
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
                stroke="#B9B6DF"
                strokeWidth={0.6}
                strokeOpacity={0.5}
              />
              <Circle
                cx={region.cx + region.rx * 0.91}
                cy={region.cy - region.ry * 0.48}
                r={Math.max(1.7, region.rx * 0.055)}
                fill={region.fill}
                stroke="#B9B6DF"
                strokeWidth={0.6}
                strokeOpacity={0.4}
              />

              <SvgText
                x={region.cx}
                y={region.cy - 11}
                fontSize={columns >= 5 ? 11 : 14}
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
                  fill="#E6E3FF"
                  opacity={0.88}
                >
                  {region.detail}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
      </View>

      <Pressable
        style={styles.listToggle}
        onPress={() => setShowList((visible) => !visible)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showList }}
        accessibilityLabel={showList ? "Προβολή χάρτη" : "Προβολή λίστας με όλες τις θεματικές"}
      >
        <Text style={styles.listToggleGlyph}>{showList ? "⌖" : "☷"}</Text>
        <Text style={styles.listToggleText}>
          {showList ? "Προβολή χάρτη" : "Προβολή ως λίστα"}
        </Text>
      </Pressable>

      {showList ? (
        <View style={styles.regionList}>
          {positionedRegions.map((region) => (
            <Pressable
              key={`list-${region.id}`}
              style={styles.regionListItem}
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
  },
  listToggle: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  listToggleGlyph: {
    color: "#B1A5FF",
    fontSize: 18,
  },
  listToggleText: {
    color: "#B1A5FF",
    fontSize: 12,
    fontWeight: "700",
  },
  regionList: {
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  regionListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
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
    color: "#F6F5FC",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
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
