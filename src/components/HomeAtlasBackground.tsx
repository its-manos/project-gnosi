/**
 * Home's Midnight Atlas backdrop.
 *
 * Static chart is a bundled WebP; native ambient motion remains independent.
 * Static geography is independent of the few animated ambient accents;
 * the entire layer remains decorative and never captures touches.
 */
import { memo, useState } from "react";
import { HomeAtlasAmbientGlow, HomeAtlasTwinkles } from "./HomeAtlasMotion";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

type Size = { width: number; height: number };
const atlasImage = require("../../assets/atlas-export-preview/home.webp");

function HomeAtlasBackground({ showAmbientMotion = true }: { showAmbientMotion?: boolean } = {}) {
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  return (
    <View testID="home-atlas-background" style={styles.underlay}
      pointerEvents="none" accessible={false}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        if (width <= 0 || height <= 0) return;
        setViewport(previous => Math.abs(previous.width - width) < 1
          && Math.abs(previous.height - height) < 1 ? previous : { width, height });
      }}>
      <Image source={atlasImage} contentFit="fill" transition={0}
        cachePolicy="memory-disk" style={StyleSheet.absoluteFill} />
      {viewport.width > 0 && viewport.height > 0 && showAmbientMotion ? <>
        <HomeAtlasAmbientGlow width={viewport.width} height={viewport.height} />
        <HomeAtlasTwinkles width={viewport.width} height={viewport.height} />
      </> : null}
    </View>
  );
}

export default memo(HomeAtlasBackground);

const styles = StyleSheet.create({
  underlay: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: "#101827",
  },
});
