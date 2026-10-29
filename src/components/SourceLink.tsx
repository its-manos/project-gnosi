import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";

type Source = Lesson["sources"][number];

export default function SourceLink({ source }: { source: Source }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => void Linking.openURL(source.url).catch(() => {})}
      accessibilityRole="link"
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{source.title}</Text>
        <Text style={styles.publisher}>{source.publisher}</Text>
      </View>
      <Text style={styles.arrow}>↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#2B3044", gap: 12 },
  textContainer: { flex: 1 },
  title: { color: "#C8C0FF", fontSize: 13, fontWeight: "700", lineHeight: 20, marginBottom: 3 },
  publisher: { color: "#949AB0", fontSize: 11 },
  arrow: { color: "#B5ABFF", fontSize: 18 },
});
