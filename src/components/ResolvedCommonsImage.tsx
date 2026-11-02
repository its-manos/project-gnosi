import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import type { ImageResizeMode, StyleProp, ViewStyle } from "react-native";
import ResilientImage, { ImageStatusPlaceholder } from "./ResilientImage";
import { remoteImageCandidates } from "../utils/commonsImage";
import { bundledLessonImages } from "../data/bundledLessonImages";
import { commonsFilename, isCommonsFilePath, resolveCommonsThumbnail } from "../utils/commonsImageResolver";
import { colors } from "../theme";

type Props = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
  fallbackLabel?: string;
  loadingLabel?: string;
  onDimensions?: (size: { width: number; height: number }) => void;
};
type Resolution = { uri: string; url: string | null; failed: boolean };
type LoadState = { url: string; status: "loading" | "loaded" | "error" };

/**
 * Android Wikimedia thumbnails use Expo Image/Glide. Fresco's native Image
 * returned HTTP 403 for the same CDN URL that Expo Image loaded on-device.
 * Non-Wikimedia images and bundled assets continue through ResilientImage.
 */
function AndroidWikimediaThumbnail({ url, ...props }: Props & { url: string }) {
  const [lastLoad, setLastLoad] = useState<LoadState>({ url, status: "loading" });
  const status = lastLoad.url === url ? lastLoad.status : "loading";
  // Read identification headers from the original Commons FilePath request:
  // direct thumb.wikimedia.org URLs are not given headers by remoteImageCandidates.
  const headers = props.uri ? remoteImageCandidates(props.uri)[0]?.headers : undefined;

  return <View style={[styles.frame, props.style]}>
    <ExpoImage
      key={url}
      source={{ uri: url, ...(headers ? { headers } : {}) }}
      contentFit={props.resizeMode === "contain" ? "contain" : props.resizeMode === "stretch" ? "fill" : "cover"}
      cachePolicy="memory-disk"
      style={styles.image}
      accessible={Boolean(props.accessibilityLabel)}
      accessibilityLabel={props.accessibilityLabel}
      onLoad={event => {
        setLastLoad({ url, status: "loaded" });
        const { width, height } = event.source;
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          props.onDimensions?.({ width, height });
        }
      }}
      onError={event => {
        console.warn(`[ΓΝΩΣΗ] Expo Image failed to load Wikimedia thumbnail: ${url}`, event.error);
        setLastLoad({ url, status: "error" });
      }}
    />
    {status === "loading" ? <View pointerEvents="none" style={styles.loadingBadge}
      accessible accessibilityLabel={props.loadingLabel ?? "Φόρτωση εικόνας…"}>
      <ActivityIndicator color={colors.accentLight} size="small" />
    </View> : null}
    {status === "error" ? <ImageStatusPlaceholder status="error" label={props.fallbackLabel}
      style={StyleSheet.absoluteFill} /> : null}
  </View>;
}

/** Android-only workaround for Wikimedia's 403 responses on redirect endpoints. */
export default function ResolvedCommonsImage(props: Props) {
  const uri = props.uri?.trim() ?? "";
  const resolve = Platform.OS === "android" && isCommonsFilePath(uri) && !bundledLessonImages[uri];
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    if (!resolve) return;
    let active = true;
    resolveCommonsThumbnail(uri).then(url => {
      if (active) setResolution({ uri, url, failed: false });
    }).catch(error => {
      if (active) {
        console.warn(`[ΓΝΩΣΗ] Wikimedia thumbnail resolution failed: ${commonsFilename(uri) ?? uri}`, String(error));
        setResolution({ uri, url: null, failed: true });
      }
    });
    return () => { active = false; };
  }, [uri, resolve]);

  if (!resolve) return <ResilientImage {...props} />;
  if (resolution?.uri === uri) {
    if (resolution.failed || !resolution.url) {
      // Don't re-request the known-failing Commons redirect URLs after an API failure.
      return <ResilientImage {...props} uri={null} />;
    }
    return <AndroidWikimediaThumbnail {...props} url={resolution.url} />;
  }
  // Reserved frame prevents jumps in article scroll position while metadata loads.
  return <View style={[styles.placeholder, props.style]} accessible accessibilityRole="image"
    accessibilityLabel={props.loadingLabel ?? "Φόρτωση εικόνας…"}>
    <ActivityIndicator color={colors.accentLight} size="small" />
  </View>;
}

const styles = StyleSheet.create({
  frame: { position: "relative", overflow: "hidden", backgroundColor: colors.surfaceSoft },
  image: { width: "100%", height: "100%" },
  loadingBadge: { position: "absolute", top: 9, right: 9, width: 30, height: 30,
    borderRadius: 15, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(11, 13, 21, 0.78)" },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft },
});
