import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  ImageResizeMode,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors } from "../theme";

type ImageStatus = "loading" | "loaded" | "error";

type Props = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
  fallbackLabel?: string;
  loadingLabel?: string;
};

type PlaceholderProps = {
  status: Exclude<ImageStatus, "loaded">;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function ImageStatusPlaceholder({
  status,
  label,
  style,
}: PlaceholderProps) {
  const isLoading = status === "loading";
  const visibleLabel = label ?? (isLoading ? "Φόρτωση εικόνας…" : "Η εικόνα δεν είναι διαθέσιμη");

  return (
    <View
      style={[styles.placeholder, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={visibleLabel}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : (
        <Text style={styles.placeholderGlyph} accessible={false}>
          ▧
        </Text>
      )}
      <Text style={styles.placeholderText} numberOfLines={2}>
        {visibleLabel}
      </Text>
    </View>
  );
}

/**
 * Keeps the native Image in normal layout (rather than absolute-fill layout),
 * matching the previously working Image component sizing. The wrapper provides
 * the same fixed dimensions as callers already pass in `style`.
 */
export default function ResilientImage({
  uri,
  style,
  resizeMode = "cover",
  accessibilityLabel,
  fallbackLabel = "Η εικόνα δεν είναι διαθέσιμη",
  loadingLabel = "Φόρτωση εικόνας…",
}: Props) {
  const hasValidUri = typeof uri === "string" && uri.trim().length > 0;
  const normalizedUri = hasValidUri ? uri!.trim() : null;
  const [lastLoad, setLastLoad] = useState<{
    uri: string | null;
    status: ImageStatus;
  }>({ uri: normalizedUri, status: hasValidUri ? "loading" : "error" });

  // Derived state ensures a newly supplied URL immediately returns to loading
  // without a useEffect resetting state after a fast image-load event.
  const status: ImageStatus = lastLoad.uri === normalizedUri
    ? lastLoad.status
    : hasValidUri
      ? "loading"
      : "error";

  return (
    <View style={[styles.frame, style]}>
      {hasValidUri ? (
        <Image
          key={normalizedUri!}
          source={{ uri: normalizedUri! }}
          style={styles.image}
          resizeMode={resizeMode}
          accessible={Boolean(accessibilityLabel)}
          accessibilityLabel={accessibilityLabel}
          onLoad={() => setLastLoad({ uri: normalizedUri, status: "loaded" })}
          onError={(event) => {
            const reason = event.nativeEvent?.error ?? "Unknown native image error";
            console.warn(`[ΓΝΩΣΗ] Failed to load image: ${normalizedUri}`, reason);
            setLastLoad({ uri: normalizedUri, status: "error" });
          }}
        />
      ) : null}

      {status === "loading" && hasValidUri ? (
        <View
          pointerEvents="none"
          style={styles.loadingBadge}
          accessible
          accessibilityLabel={loadingLabel}
        >
          <ActivityIndicator color={colors.accentLight} size="small" />
        </View>
      ) : null}

      {status === "error" ? (
        <ImageStatusPlaceholder
          status="error"
          label={fallbackLabel}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.surfaceSoft,
  },
  // The image is a normal layout child. Every current caller provides a frame
  // width and height, so percentages resolve against that measured frame.
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  loadingBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 13, 21, 0.78)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSoft,
  },
  placeholderGlyph: {
    color: colors.accentLight,
    fontSize: 27,
    lineHeight: 32,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
