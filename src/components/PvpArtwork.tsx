import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import PlayerCharacter from "./PlayerCharacter";
import { getCategoryWorldIcon } from "./worldIcons/categoryIconMap";
import { colors } from "../theme";

export function PvpWorld({ category, size = 32 }: { category: string; size?: number }) {
  const Icon = getCategoryWorldIcon(category === "all" ? "geography" : category);
  return Icon ? <Icon size={size} /> : null;
}
export const PvpHero = memo(function PvpHero({ result = false, compact = false }: { result?: boolean; compact?: boolean }) {
  return <View accessible={false} pointerEvents="none" style={[styles.scene, compact && styles.compactScene]}>
    <View style={[styles.orbit, compact && styles.compactOrbit]} />
    <View style={[styles.platform, styles.left, compact && styles.compactPlatform]}><PlayerCharacter level={1} size={compact ? 64 : 100} variant="male" /></View>
    <View style={[styles.medallion, compact && styles.compactMedallion]}><Text style={[styles.glyph, compact && styles.compactGlyph]}>{result ? "✦" : "VS"}</Text></View>
    <View style={[styles.platform, styles.right, compact && styles.compactPlatform]}><PlayerCharacter level={1} size={compact ? 64 : 100} variant="female" /></View>
  </View>;
});
export function PvpBadge({ name, index, winner = false, compact = false }: { name: string; index: number; winner?: boolean; compact?: boolean }) {
  return <View accessible={false} style={[styles.badge, compact && styles.compactBadge, index % 2 === 1 && styles.teal, winner && styles.winner]}>
    <Text style={[styles.initial, compact && styles.compactInitial, winner && styles.goldText]}>{name.trim().slice(0, 1).toLocaleUpperCase("el")}</Text>
  </View>;
}
const styles = StyleSheet.create({
  compactScene: { height: 84, maxWidth: 200 },
  compactOrbit: { width: 144, height: 64 },
  compactPlatform: { width: 68, height: 72, borderRadius: 20 },
  compactMedallion: { width: 34, height: 34, borderRadius: 11 },
  compactGlyph: { fontSize: 14 },
  compactBadge: { width: 32, height: 34, borderRadius: 10 },
  compactInitial: { fontSize: 16 },
  scene: { height: 132, alignSelf: "center", width: "100%", maxWidth: 300, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  orbit: { position: "absolute", width: 210, height: 92, borderWidth: 1, borderColor: "#514665", borderRadius: 70, transform: [{ rotate: "-12deg" }] },
  platform: { width: 105, height: 114, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "#8570AD" },
  left: { transform: [{ rotate: "-6deg" }], backgroundColor: "rgba(113,88,160,0.12)", borderRadius: 32 },
  right: { transform: [{ rotate: "6deg" }], backgroundColor: "rgba(69,147,140,0.1)", borderBottomColor: "#609D98", borderRadius: 32 },
  medallion: { zIndex: 1, marginHorizontal: -8, width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: "#AD956B", backgroundColor: "#302C38", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  glyph: { color: "#ECD3A5", fontSize: 18, fontWeight: "900", transform: [{ rotate: "8deg" }] },
  badge: { width: 42, height: 46, borderRadius: 14, borderTopLeftRadius: 5, borderBottomRightRadius: 5, borderWidth: 1, borderColor: "#7D6AAB", backgroundColor: "#332E4C", alignItems: "center", justifyContent: "center" },
  teal: { backgroundColor: "#203D40", borderColor: "#528E88" },
  winner: { backgroundColor: "#3B3228", borderColor: "#C4A574" },
  initial: { color: colors.text, fontSize: 21, fontWeight: "800" },
  goldText: { color: "#ECD3A5" },
});
