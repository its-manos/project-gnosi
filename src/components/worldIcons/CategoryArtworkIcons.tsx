import { Image, type ImageSourcePropType } from "react-native";

export type WorldIconProps = { size?: number; displayScale?: number };
type IconId = "history" | "science" | "nature" | "culture" | "technology" | "geography" | "difficult-history";

// Bundled artwork is deliberately static: Metro resolves every asset at build time,
// so opening the Home or Category screen never requires a network request.
const artwork: Record<IconId, ImageSourcePropType> = {
  history: require("../../../assets/category-world-icons/gnosi_history.webp"),
  science: require("../../../assets/category-world-icons/gnosi_science.webp"),
  nature: require("../../../assets/category-world-icons/gnosi_nature.webp"),
  culture: require("../../../assets/category-world-icons/gnosi_arts.webp"),
  technology: require("../../../assets/category-world-icons/gnosi_technology.webp"),
  geography: require("../../../assets/category-world-icons/gnosi_geography.webp"),
  "difficult-history": require("../../../assets/category-world-icons/gnosi_difficult_history.webp"),
};

function WorldArtwork({
  icon, size = 32, displayScale = 1, testID,
}: WorldIconProps & { icon: IconId; testID: string }) {
  return (
    <Image
      testID={testID}
      source={artwork[icon]}
      resizeMode="cover"
      fadeDuration={0}
      accessible={false}
      pointerEvents="none"
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size, borderRadius: size * 0.23,
        transform: [{ scale: displayScale }] }}
    />
  );
}

export function HistoryWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="history" testID="home-history-world-illustration" />;
}
export function ScienceWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="science" testID="home-world-art-science" />;
}
export function NatureWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="nature" testID="home-world-art-nature" />;
}
export function CultureWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="culture" testID="home-world-art-culture" />;
}
export function TechnologyWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="technology" testID="home-world-art-technology" />;
}
export function GeographyWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="geography" testID="home-world-art-geography" />;
}
export function DifficultHistoryWorldIcon(props: WorldIconProps) {
  return <WorldArtwork {...props} icon="difficult-history" testID="home-world-art-difficult-history" />;
}
