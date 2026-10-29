import { useEffect, useState } from "react";
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

/** A consistent loading/error state for remote images, preserving the given layout. */
export function ImageStatusPlaceholder({
  status,
  label,
  style,
}: PlaceholderProps) {
  const isLoading = status === "loading";

  return (
    <View
      style={[styles.placeholder, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        label ?? (isLoading ? "Φόρτωση εικόνας" : "Η εικόνα δεν είναι διαθέσιμη")
      }
    >
      {isLoading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : (
        <Text style={styles.placeholderGlyph} accessible={false}>
          ▧
        </Text>
      )}
      <Text style={styles.placeholderText} numberOfLines={2}>
        {label ?? (isLoading ? "Φόρτωση εικόνας…" : "Η εικόνα δεν είναι διαθέσιμη")}
      </Text>
    </View>
  );
}

export default function ResilientImage({
  uri,
  style,
  resizeMode = "cover",
  accessibilityLabel,
  fallbackLabel = "Η εικόνα δεν είναι διαθέσιμη",
  loadingLabel = "Φόρτωση εικόνας…",
}: Props) {
  const hasValidUri = typeof uri === "string" && uri.trim().length > 0;
  const [status, setStatus] = useState<ImageStatus>(
    hasValidUri ? "loading" : "error"
  );

  // Reset if a recycled card/component receives a different image URL.
  useEffect(() => {
    setStatus(hasValidUri ? "loading" : "error");
  }, [uri, hasValidUri]);

  return (
    <View style={[styles.frame, style]}>
      {hasValidUri ? (
        <Image
          key={uri}
          source={{ uri: uri! }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={resizeMode}
          accessible={status === "loaded" && Boolean(accessibilityLabel)}
          accessibilityLabel={accessibilityLabel}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : null}

      {status !== "loaded" ? (
        <ImageStatusPlaceholder
          status={status}
          label={status === "loading" ? loadingLabel : fallbackLabel}
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
