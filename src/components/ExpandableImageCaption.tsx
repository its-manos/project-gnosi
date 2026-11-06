import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { reading } from "../theme";

type Props = { caption: string };

// The full-width, hidden measurer determines whether the caption actually
// wraps beyond two lines. Short descriptions never show a redundant toggle.
// Keep the measurer out of the accessibility tree.
export default function ExpandableImageCaption({ caption }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  if (!caption.trim()) return null;

  return (
    <View style={styles.container} testID="reader-image-description">
      <Text selectable={expanded} style={styles.caption} numberOfLines={expanded ? undefined : 2}>
        {caption}
      </Text>
      <View style={styles.measurer} pointerEvents="none" accessible={false}
        importantForAccessibility="no-hide-descendants">
        <Text style={styles.caption} accessible={false} onTextLayout={event => {
          const next = event.nativeEvent.lines.length > 2;
          setOverflows(previous => previous === next ? previous : next);
        }}>
          {caption}
        </Text>
      </View>
      {overflows ? (
        <Pressable
          style={styles.toggle}
          onPress={() => setExpanded(previous => !previous)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Σύμπτυξη περιγραφής εικόνας" : "Εμφάνιση πλήρους περιγραφής εικόνας"}
          accessibilityState={{ expanded }}
          testID="reader-image-description-toggle"
          hitSlop={4}
        >
          <Text style={styles.toggleText}>{expanded ? "Λιγότερα ↑" : "Περισσότερα ↓"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", marginTop: 9, marginBottom: 2 },
  caption: { color: reading.muted, fontSize: 13, lineHeight: 21 },
  // Absolute positioning prevents the full caption from taking up reading
  // space while collapsed, but still measures real wrapping on each screen.
  measurer: { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 },
  toggle: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", paddingRight: 14 },
  toggleText: { color: reading.accent, fontSize: 13, lineHeight: 20, fontWeight: "700" },
});
