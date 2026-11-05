/** 
 * A world-scale atlas for Category selection, distinct from the local Aegean
 * Adventure Path chart. Editable source: assets/atlas-source/category-world.svg
 * Export: npm run atlas:world:export
 *
 * The map is one cached WebP with uniform cover scaling, so continental
 * proportions stay correct on phones with different screen aspect ratios.
 * No live full-viewport SVG/animation runs during
 * scrolling or when lesson progress changes. Interactive islands are separate.
 */
import { memo } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const categoryWorld = require("../../assets/atlas-export-preview/category-world.webp");

function CategoryWorldAtlasBackground() {
  return (
    <View testID="category-world-atlas-background"
      accessible={false} pointerEvents="none" style={styles.underlay}>
      <Image source={categoryWorld} contentFit="cover" transition={0}
        cachePolicy="memory-disk" style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors />
    </View>
  );
}

export default memo(CategoryWorldAtlasBackground);

const styles = StyleSheet.create({
  underlay: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: "#101827",
  },
});
