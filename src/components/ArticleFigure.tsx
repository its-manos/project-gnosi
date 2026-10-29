import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";
import type { InlineArticleImage } from "../data/articleMedia";
import { colors } from "../theme";

type Props = { figure: InlineArticleImage };

export default function ArticleFigure({ figure }: Props) {
  const isSvg = figure.url.toLowerCase().includes(".svg");

  return (
    <View style={styles.container}>
      <View style={styles.imageFrame}>
        {isSvg ? (
          <View style={styles.svgFrame}>
            <SvgUri uri={figure.url} width="100%" height={220} />
          </View>
        ) : (
          <Image
            source={{ uri: figure.url }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={figure.caption}
          />
        )}
      </View>
      <Text style={styles.caption}>{figure.caption}</Text>
      <Pressable
        accessibilityRole="link"
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
    backgroundColor: "#F3F4F8",
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 218, backgroundColor: "#20263A" },
  svgFrame: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  caption: { color: "#B2B6C9", fontSize: 12, lineHeight: 19, marginTop: 9 },
  credit: { color: colors.accentLight, fontSize: 10, lineHeight: 16, marginTop: 5 },
});
