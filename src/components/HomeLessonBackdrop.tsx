/** Static decoration: bundled landmarks, with no remote requests or animation loops. */
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const landmarks: Record<string, number> = {
  "ancient-greece": require("../../assets/atlas-export-preview/island-icons/ancient-greece.webp"),
  "world-history": require("../../assets/atlas-export-preview/island-icons/world-history.webp"),
  mythology: require("../../assets/atlas-export-preview/island-icons/mythology.webp"),
};

export default function HomeLessonBackdrop({ subcategoryId }: { subcategoryId?: string }) {
  const landmark = subcategoryId ? landmarks[subcategoryId] : undefined;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%" accessible={false}>
      <Defs>
        <LinearGradient id="home-lesson-surface" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0" stopColor="#172334" />
          <Stop offset="0.6" stopColor="#20283F" />
          <Stop offset="1" stopColor="#39345B" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#home-lesson-surface)" />
    </Svg>
    {landmark ? <Image testID="home-lesson-landmark" source={landmark}
      contentFit="contain" style={styles.landmark} accessible={false} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  landmark: { position: "absolute", right: 16, top: 16, width: 98, height: 78, opacity: 0.46 },
});
