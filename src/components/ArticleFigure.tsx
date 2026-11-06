import ZoomableLessonImage from "./ZoomableLessonImage";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { InlineArticleImage } from "../data/articleMedia";
import ResolvedCommonsImage from "./ResolvedCommonsImage";
import { reading } from "../theme";

type Props = { figure: InlineArticleImage };

export default function ArticleFigure({ figure }: Props) {
  return (
    <View style={styles.container}>
      <ZoomableLessonImage image={{ uri: figure.url, caption: figure.caption, credit: figure.credit, creditUrl: figure.creditUrl }}>
      <View style={styles.imageFrame}>
        {/* Commons FilePath URLs request raster thumbnails even for .svg originals.
            The source filename is not the format of the redirected response. */}
          <ResolvedCommonsImage
            uri={figure.url}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={figure.caption}
            fallbackLabel="Η εικόνα δεν είναι διαθέσιμη"
            loadingLabel="Φόρτωση εικόνας…"
          />
      </View>

      </ZoomableLessonImage>

      <Text style={styles.caption}>{figure.caption}</Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Άνοιγμα πηγής εικόνας: ${figure.credit}`}
        onPress={() => void Linking.openURL(figure.creditUrl).catch(() => {})}
      >
        <Text style={styles.credit}>Εικόνα: {figure.credit} ↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4, marginBottom: 24 },
  imageFrame: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: reading.surface,
    borderWidth: 1,
    borderColor: reading.border,
  },
  // Reserve the space before remote images load to avoid changing scroll positions.
  // Contain preserves the whole photo/diagram, even when its source is portrait.
  image: { width: "100%", aspectRatio: 4 / 3, minHeight: 210, maxHeight: 340 },
  caption: {
    color: reading.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },
  credit: {
    color: reading.accent,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
});
