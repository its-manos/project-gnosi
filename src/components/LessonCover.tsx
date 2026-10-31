import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { categories, type Lesson } from "../data/lessons";
import ResilientImage from "./ResilientImage";

const palette: Record<string, string> = {
  history: "#746653", science: "#536C88", nature: "#4E7567", technology: "#615D88",
  culture: "#8A6476", geography: "#52797C", "difficult-history": "#726A62",
};

export default function LessonCover({ lesson, style }: { lesson: Lesson; style: StyleProp<ViewStyle> }) {
  if (lesson.coverKind !== "editorial") {
    return <ResilientImage uri={lesson.imageUrl} style={style} resizeMode={lesson.imageResizeMode ?? "cover"}
      accessibilityLabel={lesson.imageCaption} fallbackLabel="Η φωτογραφία του άρθρου δεν είναι διαθέσιμη" loadingLabel="Φόρτωση φωτογραφίας…" />;
  }
  const category = categories.find((item) => item.id === lesson.categoryId);
  return (
    <View style={[style, styles.cover, { backgroundColor: palette[lesson.categoryId] ?? "#536C78" }]}
      accessible accessibilityRole="image" accessibilityLabel={`Θεματική εικονογράφηση: ${category?.title ?? lesson.title}. Δεν αποτελεί ιστορικό τεκμήριο.`}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" accessible={false}>
          <Circle cx={305} cy={-10} r={160} fill="none" stroke="#F2E6CB" strokeOpacity={0.18} />
          <Circle cx={305} cy={-10} r={120} fill="none" stroke="#F2E6CB" strokeOpacity={0.18} />
          <G opacity={0.15}>
            <Path d="M0 150 Q90 80 200 145 T400 110 L400 200 H0Z" fill="#101820" />
            <Path d="M0 190 Q130 90 260 170 T400 160" fill="none" stroke="#F2E6CB" strokeWidth={2} />
          </G>
        </Svg>
      </View>
      <Text style={styles.symbol}>{category?.emoji ?? "✦"}</Text>
      <Text style={styles.category}>{category?.title ?? "ΓΝΩΣΗ"}</Text>
      <Text style={styles.label}>ΘΕΜΑΤΙΚΗ ΕΙΚΟΝΟΓΡΑΦΗΣΗ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 16, gap: 8 },
  symbol: { fontSize: 36 },
  category: { color: "#FFF5E1", fontSize: 17, lineHeight: 24, fontWeight: "700", textAlign: "center" },
  label: { color: "#F3E9D7", fontSize: 9, lineHeight: 14, letterSpacing: 1, textAlign: "center" },
});
