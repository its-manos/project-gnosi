import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import type { InlineArticleImage } from "../data/articleMedia";
import ResilientImage, { ImageStatusPlaceholder } from "./ResilientImage";
import { colors } from "../theme";

type Props = { figure: InlineArticleImage };
type SvgStatus = "loading" | "loaded" | "error";

export default function ArticleFigure({ figure }: Props) {
  const isSvg = /\.svg(?:$|\?)/i.test(figure.url);
  const [svgLoad, setSvgLoad] = useState<{ url: string; status: SvgStatus }>({
    url: figure.url,
    status: "loading",
  });
  const svgStatus = svgLoad.url === figure.url ? svgLoad.status : "loading";

  return (
    <View style={styles.container}>
      <View style={styles.imageFrame}>
        {isSvg ? (
          <View style={styles.svgFrame}>
            <SvgUri
              uri={figure.url}
              width="100%"
              height={220}
              onLoad={() => setSvgLoad({ url: figure.url, status: "loaded" })}
              onError={(error) => {
                console.warn(`[ΓΝΩΣΗ] Failed to load SVG: ${figure.url}`, error);
                setSvgLoad({ url: figure.url, status: "error" });
              }}
            />
            {svgStatus === "loading" ? (
              <View
                pointerEvents="none"
                style={styles.svgLoadingBadge}
                accessible
                accessibilityLabel="Φόρτωση διαγράμματος…"
              >
                <ActivityIndicator color={colors.accentLight} size="small" />
              </View>
            ) : null}
            {svgStatus === "error" ? (
              <ImageStatusPlaceholder
                status="error"
                label="Το διάγραμμα δεν είναι διαθέσιμο"
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
          </View>
        ) : (
          <ResilientImage
            uri={figure.url}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={figure.caption}
            fallbackLabel="Η εικόνα δεν είναι διαθέσιμη"
            loadingLabel="Φόρτωση εικόνας…"
          />
        )}
      </View>

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
  svgFrame: {
    minHeight: 220,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  svgLoadingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 13, 21, 0.78)",
    borderWidth: 1,
    borderColor: colors.border,
  },
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
