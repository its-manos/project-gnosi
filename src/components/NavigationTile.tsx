import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MotionPressable } from "./HomeMotion";
import { colors } from "../theme";

type Variant = "shortcut" | "settings";
type Props = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onPress: () => void;
  variant?: Variant;
  testID?: string;
  accessibilityLabel?: string;
  iconBackground?: string;
  entranceDelay?: number;
  pressScale?: number;
};

/** Common navigation tile, with deliberate compact/static and spacious/animated variants. */
export default function NavigationTile({
  title, subtitle, icon, onPress, variant = "shortcut", testID,
  accessibilityLabel, iconBackground, entranceDelay, pressScale = 0.983,
}: Props) {
  const settings = variant === "settings";
  const label = accessibilityLabel ?? (settings ? title : title + ". " + subtitle);
  const contents = <>
    <View accessible={false} style={[styles.icon, settings && styles.iconSettings,
      iconBackground ? { backgroundColor: iconBackground } : undefined]}>{icon}</View>
    <View style={[styles.copy, settings && styles.copySettings]}>
      <Text style={[styles.title, settings && styles.titleSettings]}
        numberOfLines={settings ? undefined : 1} adjustsFontSizeToFit={!settings}>{title}</Text>
      <Text style={[styles.subtitle, settings && styles.subtitleSettings]}
        numberOfLines={settings ? undefined : 1} adjustsFontSizeToFit={!settings}
        minimumFontScale={0.82}>{subtitle}</Text>
    </View>
    <Text accessible={false} style={[styles.arrow, settings && styles.arrowSettings]}>›</Text>
  </>;
  if (settings) return <MotionPressable testID={testID} entranceDelay={entranceDelay}
    pressScale={pressScale} accessibilityRole="button" accessibilityLabel={label}
    onPress={onPress} style={[styles.base, styles.settings]}>{contents}</MotionPressable>;
  return <Pressable testID={testID} accessibilityRole="button"
    accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.base, styles.shortcut, pressed && styles.pressed]}>
    {contents}
  </Pressable>;
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: "#38435C", backgroundColor: "#1A2538" },
  shortcut: { width: "48.5%", flexGrow: 1, minHeight: 58, paddingHorizontal: 8,
    gap: 7, borderRadius: 15 },
  settings: { minHeight: 75, padding: 12, marginBottom: 9, borderRadius: 17 },
  pressed: { backgroundColor: "#2D304A" },
  icon: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  iconSettings: { width: 44, height: 44, borderRadius: 14, marginRight: 13 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  copySettings: { gap: 5 },
  title: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  titleSettings: { fontSize: 15 },
  subtitle: { color: colors.textMuted, fontSize: 9, lineHeight: 14 },
  subtitleSettings: { fontSize: 12 },
  arrow: { color: "#ACA0E7", fontSize: 19 },
  arrowSettings: { color: colors.accentLight, fontSize: 26 },
});
