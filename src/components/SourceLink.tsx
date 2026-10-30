import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";

type Source = Lesson["sources"][number];

export default function SourceLink({ source }: { source: Source }) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      style={styles.row}
      onPress={() => { setFailed(false); void Linking.openURL(source.url).catch(() => setFailed(true)); }}
      accessibilityRole="link"
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{source.title}</Text>
        <Text style={styles.publisher}>{source.publisher}</Text>
        {failed ? <Text style={styles.error} accessibilityLiveRegion="polite">Η πηγή δεν άνοιξε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.</Text> : null}
      </View>
      <Text style={styles.arrow}>↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#2B3044", gap: 12 },
  textContainer: { flex: 1 },
  title: { color: "#C8C0FF", fontSize: 15, fontWeight: "600", lineHeight: 23, marginBottom: 3 },
  publisher: { color: "#949AB0", fontSize: 12 },
  error: { color: "#F07585", fontSize: 12, lineHeight: 19, marginTop: 6 },
  arrow: { color: "#B5ABFF", fontSize: 18 },
});
