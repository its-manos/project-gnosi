import ZoomableLessonImage from "./ZoomableLessonImage";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { InlineArticleImage } from "../data/articleMedia";
import ResilientImage from "./ResilientImage";
import { colors } from "../theme";

type Props = { figure: InlineArticleImage };

export default function ArticleFigure({ figure }: Props) {
  return (
    <View style={styles.container}>
      <ZoomableLessonImage image={{ uri: figure.url, caption: figure.caption, credit: figure.credit, creditUrl: figure.creditUrl }}>
      <View style={styles.imageFrame}>
        {/* Commons FilePath URLs request raster thumbnails even for .svg originals.
            The source filename is not the format of the redirected response. */}
          <ResilientImage
            uri={figure.url}
            style={styles.image}
            resizeMode={figure.resizeMode ?? "cover"}
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
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 218 },
  caption: {
    color: "#B2B6C9",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  credit: {
    color: colors.accentLight,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
});
