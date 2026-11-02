import { cdnImageManifest } from "../data/cdnImageManifest";

export type ImageRendition = "preview" | "full";

/**
 * Public, immutable image URLs only. Never use R2 credentials in Expo.
 * Missing CDN configuration or unuploaded image entries are a no-op.
 * Only explicitly listed files can be requested from our CDN.
 */
export function imageCdnUrl(sourceUri: string, rendition: ImageRendition = "full"): string | null {
  const base = process.env.EXPO_PUBLIC_IMAGE_CDN_BASE_URL?.trim();
  if (!base || !/^https:\/\/[^?#\s]+$/i.test(base)) return null;
  const entry = cdnImageManifest[sourceUri];
  const key = entry?.[rendition];
  // Validate generated mapping to avoid unexpected origins or path traversal.
  if (!key || !/^commons\/[a-f0-9]{24}-(preview|full)\.webp$/.test(key)) return null;
  return `${base.replace(/\/+$/, "")}/${key}`;
}
