/**
 * Island Atlas 2.0 — compact, viewport-fitted Category destinations.
 * The detailed geography is a cached background image. Only the clickable
 * landmasses, labels and tiny status indicators are live React Native views.
 * No scroll container, whole-map animated SVG or layout-driven timers.
 */
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from "react-native-svg";
import AncientGreeceIslandIcon from "./islandIcons/AncientGreeceIslandIcon";

export type IslandDestination = {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressLoaded: boolean;
  status: "loading" | "coming-soon" | "new" | "in-progress" | "complete";
};

type Props = {
  regions: IslandDestination[];
  width: number;
  height: number;
  onSelectRegion: (id: string) => void;
};

export type IslandPlacement = {
  left: number;
  top: number;
  width: number;
  artWidth: number;
  artHeight: number;
};

const SHORELINES = [
  "M 13 57 Q 21 32 39 31 Q 49 15 70 25 Q 88 13 110 31 Q 133 25 148 47 L 165 56 Q 156 83 135 88 Q 115 106 91 96 Q 67 108 49 91 Q 26 93 13 72 Z",
  "M 13 47 Q 24 22 51 30 Q 69 11 91 24 Q 114 16 128 37 Q 153 30 165 55 Q 149 71 144 85 Q 126 102 99 95 Q 76 111 59 94 Q 28 98 21 79 Z",
  "M 15 60 Q 25 38 44 39 Q 50 21 74 22 Q 91 10 108 32 Q 133 27 145 47 Q 164 49 168 70 Q 153 91 126 87 Q 110 105 85 99 Q 65 104 50 89 Q 24 92 15 60 Z",
  "M 11 51 Q 20 27 40 30 Q 52 12 77 26 Q 92 17 109 28 Q 132 25 151 42 Q 164 60 151 76 Q 155 92 122 94 Q 105 107 86 92 Q 65 103 48 86 Q 22 89 11 66 Z",
  "M 16 60 Q 24 34 51 33 Q 57 17 80 22 Q 106 16 120 35 Q 143 31 162 57 Q 163 79 141 85 Q 128 100 101 94 Q 73 108 54 91 Q 27 93 16 73 Z",
  "M 14 52 Q 32 26 51 36 Q 67 15 90 25 Q 108 14 129 38 Q 153 39 164 61 Q 152 87 134 88 Q 109 104 85 96 Q 66 108 48 91 Q 20 89 14 67 Z",
] as const;

const TINTS = [
  ["#90869F", "#4A5B68", "#233340"],
  ["#829C9A", "#456B73", "#203946"],
  ["#B39B7C", "#6B6472", "#283848"],
  ["#8695B0", "#4B6079", "#263649"],
  ["#A18C98", "#645A7B", "#253347"],
  ["#879C82", "#4C6A69", "#263A42"],
] as const;

/**
 * Rows rather than scattered absolute coordinates guarantee that every
 * destination remains reachable even when subcategory counts grow.
 * The 2–1–2 pattern gives small catalogues a natural archipelago outline.
 */
export function islandAtlasRows(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [2];
  if (count === 3) return [2, 1];
  if (count === 4) return [2, 2];
  if (count === 5) return [2, 1, 2];
  if (count === 6) return [2, 2, 2];
  if (count === 7) return [2, 3, 2];
  if (count === 8) return [3, 2, 3];
  const columns = count > 12 ? 4 : 3;
  return Array.from({ length: Math.ceil(count / columns) },
    (_, row) => Math.min(columns, count - row * columns));
}

export function getIslandAtlasPlacements(count: number, width: number, height: number): IslandPlacement[] {
  if (count <= 0 || width <= 0 || height <= 0) return [];
  const rows = islandAtlasRows(count);
  const rowHeight = height / rows.length;
  const placements: IslandPlacement[] = [];
  let index = 0;
  for (let row = 0; row < rows.length; row++) {
    const columns = rows[row];
    const columnWidth = width / columns;
    // Reserve room for a two-line name plate and the progress mark on shorter
    // screens. An island must not overlap the label in the row below.
    const artHeight = Math.max(46, Math.min(112, rowHeight - 49));
    const artWidth = Math.max(58, Math.min(163, columnWidth - 12, artHeight * 1.50));
    const widthForLabel = Math.min(columnWidth - 4, Math.max(artWidth + 16, 94));
    const blockHeight = artHeight + 46;
    for (let col = 0; col < columns; col++) {
      const drift = Math.min(6, Math.max(0, (rowHeight - blockHeight) / 4));
      const xDrift = ((row + col) % 2 === 0 ? -1 : 1) * Math.min(7, columnWidth * 0.035);
      const yDrift = ((index % 3) - 1) * drift;
      const centerX = (col + 0.5) * columnWidth + xDrift;
      const top = row * rowHeight + Math.max(0, (rowHeight - blockHeight) / 2) + yDrift;
      placements.push({
        left: Math.max(0, Math.min(width - widthForLabel, centerX - widthForLabel / 2)),
        top: Math.max(0, Math.min(height - blockHeight, top)),
        width: widthForLabel,
        artWidth,
        artHeight,
      });
      index++;
    }
  }
  return placements;
}

function IslandArtwork({ index, id, width, height, status }: {
  index: number;
  id: string;
  width: number;
  height: number;
  status: IslandDestination["status"];
}) {
  const colors = TINTS[index % TINTS.length];
  const shore = SHORELINES[index % SHORELINES.length];
  const engraved = status === "complete" ? "#E7C99B"
    : status === "in-progress" ? "#C1B2F7" : "#95AAB6";
  const discovered = status === "complete" || status === "in-progress";
  const suffix = id.replace(/[^a-z0-9-]/gi, "-") + "-" + index;
  const isAncientGreece = id === "ancient-greece";
  // Large enough to read as a temple; the stylobate sits on the upper plateau.
  // No overflow or layout shift: just a decorative SVG over the land texture.
  const emblemSize = Math.max(35, Math.min(68, height * 0.66));
  const emblemTop = Math.max(0, height * 0.62 - emblemSize * 0.84);

  return (
    <View pointerEvents="none" accessible={false} style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 180 120" pointerEvents="none"
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id={"island-land-" + suffix} x1="0" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="0.40" stopColor={colors[1]} />
          <Stop offset="1" stopColor={colors[2]} />
        </LinearGradient>
      </Defs>
      {/* Atmospheric halo is static: no native blur/shadow or animated SVG. */}
      {discovered ? <Ellipse cx={90} cy={68} rx={87} ry={45}
        fill={engraved} fillOpacity={0.045}
        stroke={engraved} strokeOpacity={0.16} strokeWidth={1.25} /> : null}
      <Ellipse cx={90} cy={68} rx={83} ry={42} fill="none"
        stroke="#98B7BE" strokeOpacity={0.10} strokeWidth={1} />
      <Ellipse cx={90} cy={68} rx={76} ry={39} fill="none"
        stroke="#C7B79D" strokeOpacity={0.09} strokeWidth={0.7} />
      <Path d={shore} fill="#0A1A26" opacity={0.70}
        transform="translate(0 6)" />
      <Path d={shore} fill={"url(#island-land-" + suffix + ")"}
        stroke={engraved} strokeOpacity={discovered ? 0.92 : 0.62}
        strokeWidth={discovered ? 1.9 : 1.55} strokeLinejoin="round" />
      {/* A few contour strokes suggest relief without increasing redraw cost. */}
      <Path d="M 30 56 Q 52 31 77 40 T 126 40 Q 143 45 149 56"
        fill="none" stroke="#E0CFB2" strokeOpacity={0.16} strokeWidth={1.1} />
      <Path d="M 39 82 Q 61 90 85 85 T 128 82"
        fill="none" stroke="#0B2634" strokeOpacity={0.36} strokeWidth={1.3} />
      <Path d="M 32 61 Q 50 43 70 52 T 109 47 Q 129 48 143 65"
        fill="none" stroke="#E9D9BC" strokeOpacity={0.35} strokeWidth={1.1} />
      <Path d="M 37 70 Q 61 56 80 68 T 132 67"
        fill="none" stroke="#182B37" strokeOpacity={0.48} strokeWidth={2} />
      <Path d="M 48 80 Q 72 73 96 80 Q 117 87 138 76"
        fill="none" stroke="#CDD1C0" strokeOpacity={0.22} strokeWidth={1} />
      {/* Stone plateau underneath the Parthenon — its shadow and engraved
          footings belong to the landmass, not the floating icon. */}
      {isAncientGreece ? (
        <>
          <Ellipse cx={90} cy={78} rx={52} ry={10}
            fill="#0B1E2B" opacity={0.48} />
          <Path d="M 43 75 Q 61 68 85 70 Q 114 66 139 75 L 133 81 Q 91 86 47 81 Z"
            fill="#B6A78B" fillOpacity={0.16}
            stroke="#E7D0AA" strokeOpacity={0.18} strokeWidth={1.1} />
          <Path d="M 54 80 Q 90 85 127 79 M 60 73 L 57 78 M 126 74 L 130 79"
            fill="none" stroke="#D7C09A" strokeOpacity={0.26} strokeWidth={1.05} />
        </>
      ) : null}
      {/* Tiny engraved relief/ruin, not a cartoon emoji or a large icon. */}
      {isAncientGreece ? null : index % 3 === 0 ? (
        <>
          <Path d="M 75 60 L 75 48 L 85 44 L 95 48 L 95 60 M 73 60 H 99 M 79 47 V 59 M 86 46 V 59 M 93 47 V 59"
            fill="none" stroke="#E3D1AB" strokeOpacity={0.75} strokeWidth={1.7} />
          <Path d="M 71 44 L 86 39 L 101 44" stroke="#E5D5B5" strokeWidth={1.5}
            strokeOpacity={0.68} fill="none" />
        </>
      ) : index % 3 === 1 ? (
        <Path d="M 65 68 L 83 43 L 94 59 L 105 47 L 122 70 M 75 55 L 81 52 M 104 51 L 108 57"
          fill="none" stroke="#E5D6BC" strokeOpacity={0.72} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        <>
          <Path d="M 69 68 L 77 49 L 85 68 M 91 66 L 100 42 L 110 66 M 76 65 V 75 M 100 65 V 75"
            fill="none" stroke="#D5DBBC" strokeOpacity={0.73} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={122} cy={57} r={2.3} fill="#DBC99E" opacity={0.6} />
        </>
      )}
      {/* In-progress is already expressed by the rim and progress rail.
          Only a completed island needs a small, grounded check marker. */}
      {status === "complete" ? (
        <>
          <Circle cx={145} cy={59} r={5.3} fill="#D6B98D" opacity={0.94} />
          <Path d="M 142 59 L 144.2 61 L 148 56"
            stroke="#1E2D3A" strokeWidth={1.65} strokeLinecap="round" fill="none" />
        </>
      ) : null}
      </Svg>
      {isAncientGreece ? (
        <View testID="island-atlas-ancient-greece-emblem"
          pointerEvents="none" accessible={false}
          style={[styles.ancientGreeceEmblem, { top: emblemTop }]}>
          <AncientGreeceIslandIcon size={emblemSize} />
        </View>
      ) : null}
    </View>
  );
}

function IslandAtlasMap({ regions, width, height, onSelectRegion }: Props) {
  const placements = useMemo(
    () => getIslandAtlasPlacements(regions.length, width, height),
    [regions.length, width, height],
  );

  if (regions.length === 0) {
    return <View testID="island-atlas-empty" style={styles.empty}>
      <Text style={styles.emptyTitle}>Νέοι κόσμοι στον ορίζοντα</Text>
      <Text style={styles.emptyCopy}>Περισσότερες περιοχές θα προστεθούν σύντομα.</Text>
    </View>;
  }

  return (
    <View testID="island-atlas-map" style={{ width, height }} accessible={false}>
      {regions.map((region, index) => {
        const position = placements[index];
        const percent = region.progressLoaded && region.totalLessons > 0
          ? Math.max(0, Math.min(100,
              Math.round(region.completedLessons / region.totalLessons * 100))) : 0;
        const statusText = !region.progressLoaded ? ", φόρτωση προόδου"
          : region.status === "coming-soon" ? ", σύντομα"
          : ", " + region.completedLessons + " από " + region.totalLessons + " μαθήματα";
        return (
          <Pressable key={region.id} testID={"island-atlas-destination-" + region.id}
            style={({ pressed }) => [styles.destination, {
              left: position.left,
              top: position.top,
              width: position.width,
            }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={region.title + statusText}
            accessibilityHint="Άνοιγμα περιοχής γνώσης"
            onPress={() => onSelectRegion(region.id)}>
            <IslandArtwork index={index} id={region.id}
              width={position.artWidth} height={position.artHeight} status={region.status} />
            {/* A translucent cartographic name plate keeps Greek labels readable
                above real coastlines, without becoming another content card. */}
            <View testID={"island-atlas-nameplate-" + region.id}
              pointerEvents="none"
              style={[styles.namePlate, { maxWidth: position.width },
                region.status === "in-progress" && styles.activePlate,
                region.status === "complete" && styles.completePlate]}>
              <Text testID={"island-atlas-label-" + region.id}
                style={[styles.label, region.status === "in-progress" && styles.activeLabel]}
                numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
                {region.title}
              </Text>
            </View>
            {region.status === "coming-soon" && region.progressLoaded ?
              <Text style={styles.soon}>ΣΥΝΤΟΜΑ</Text> :
              <View testID={"island-atlas-progress-" + region.id}
                pointerEvents="none" style={styles.progressRail}>
                <View style={[styles.progressFill, {
                  width: Math.round(56 * percent / 100),
                  backgroundColor: region.status === "complete" ? "#CEB38A" : "#AE9DFB",
                }]} />
              </View>}
          </Pressable>
        );
      })}
    </View>
  );
}

export default memo(IslandAtlasMap);

const styles = StyleSheet.create({
  destination: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 18,
    minHeight: 48,
  },
  pressed: { opacity: 0.77, transform: [{ scale: 0.96 }] },
  ancientGreeceEmblem: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  namePlate: {
    // Size the visible plate to its actual title, not the whole island slot.
    // maxWidth is set per destination so long Greek names may wrap to 2 lines.
    alignSelf: "center", minHeight: 30, paddingHorizontal: 8, paddingVertical: 2,
    marginTop: -4,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(10, 23, 38, 0.61)",
    borderRadius: 10, borderWidth: 1, borderColor: "rgba(166, 176, 183, 0.16)",
  },
  activePlate: { borderColor: "rgba(190, 173, 246, 0.52)" },
  completePlate: { borderColor: "rgba(213, 184, 137, 0.46)" },
  label: {
    flexShrink: 1, minHeight: 26,
    textAlign: "center", textAlignVertical: "center",
    color: "#E6E8EB", fontSize: 11.5, lineHeight: 14,
    fontWeight: "800", letterSpacing: 0.1,
    textShadowColor: "#08121F", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
  },
  activeLabel: { color: "#D8CAFF" },
  progressRail: {
    marginTop: 5, width: 56, height: 3, borderRadius: 2,
    backgroundColor: "rgba(143, 159, 177, 0.28)", overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 2 },
  soon: {
    color: "#ADB9C4", fontSize: 8, letterSpacing: 0.8,
    fontWeight: "900", lineHeight: 10, marginTop: 4,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, gap: 8 },
  emptyTitle: { color: "#E4D9F9", fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyCopy: { color: "#ABB4C2", fontSize: 12, textAlign: "center" },
});
