/**
 * Remote Wikimedia Commons image delivery.
 *
 * Wikimedia's 2026 CDN policy accepts standardized thumbnail steps, not the
 * legacy 1200px thumbnails embedded in some catalogue URLs. Preserve those
 * catalogue URLs as stable bundle-lookup keys and normalize only when an image
 * actually needs to be requested over the network.
 *
 * All candidates retain the same original Commons filename; no third-party
 * image proxy, attribution rewrite, or request for the full-resolution file.
 */
export type RemoteImageCandidate = {
  uri: string;
  headers?: Record<string, string>;
};

const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const COMMONS_REDIRECT = "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/";
const THUMB_WIDTH = 960; // Wikimedia 2026 standard thumbnail bucket.
const WIKIMEDIA_HEADERS: Record<string, string> = {
  "User-Agent": "GnosiMobile/1.0 (https://github.com/its-manos/project-gnosi)",
  "Api-User-Agent": "GnosiMobile/1.0 (https://github.com/its-manos/project-gnosi)",
};

/** Returns at most two predictable attempts; never loops or retries blindly. */
export function remoteImageCandidates(uri: string): RemoteImageCandidate[] {
  if (!uri.startsWith(COMMONS_FILE_PATH)) return [{ uri }];

  const tail = uri.slice(COMMONS_FILE_PATH.length);
  const filename = tail.split(/[?#]/, 1)[0];
  if (!filename) return [{ uri }];

  // Both paths are officially supported by Wikimedia. If an intermediary
  // rejects the first redirect, try the alternate documented PHP endpoint.
  const headers = WIKIMEDIA_HEADERS;
  return [
    { uri: `${COMMONS_FILE_PATH}${filename}?width=${THUMB_WIDTH}`, headers },
    { uri: `${COMMONS_REDIRECT}${filename}&width=${THUMB_WIDTH}`, headers },
  ];
}
