/** Obtain an actual Wikimedia thumbnail CDN URL instead of relying on native redirect chains. */
const FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "GnosiMobile/1.0 (https://github.com/its-manos/project-gnosi)";
const WIDTH = 960;
const MAX_CACHE = 100;
const MAX_CONCURRENT_LOOKUPS = 2;
let activeLookups = 0;
const queuedLookups: Array<() => void> = [];

// Keep Commons metadata traffic bounded even when a virtualized list mounts
// multiple covers at once. The image CDN itself is still cached by React Native.
function scheduleLookup<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      activeLookups++;
      void task().then(resolve, reject).finally(() => {
        activeLookups--;
        queuedLookups.shift()?.();
      });
    };
    if (activeLookups < MAX_CONCURRENT_LOOKUPS) start();
    else queuedLookups.push(start);
  });
}

// Only successful lookups are retained. Concurrent readers of one file share a promise.
const successful = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

export function isCommonsFilePath(uri: string): boolean {
  return uri.startsWith(FILE_PATH);
}

export function commonsFilename(uri: string): string | null {
  if (!isCommonsFilePath(uri)) return null;
  const encoded = uri.slice(FILE_PATH.length).split(/[?#]/, 1)[0];
  if (!encoded) return null;
  try {
    const filename = decodeURIComponent(encoded).replace(/_/g, " ").trim();
    return filename && !filename.includes("/") ? filename : null;
  } catch {
    return null;
  }
}

/**
 * MediaWiki action=query&prop=imageinfo returns a direct Wikimedia CDN
 * thumbnail URL. In 2026, Wikimedia moved thumbnails to thumb.wikimedia.org. Do not use the original full-resolution `url` as a substitute.
 * The scaled URL may be wider than WIDTH due to Wikimedia's predefined buckets.
 */
export function resolveCommonsThumbnail(uri: string, request: typeof fetch = fetch): Promise<string> {
  const filename = commonsFilename(uri);
  if (!filename) return Promise.reject(new Error("Invalid Commons file path"));
  const cached = successful.get(filename);
  if (cached) return Promise.resolve(cached);
  const running = pending.get(filename);
  if (running) return running;

  // Build a simple percent-encoded query; no browser URLSearchParams dependency.
  const requestUrl = `${API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=${WIDTH}&titles=${encodeURIComponent(`File:${filename}`)}`;
  const promise = scheduleLookup(async () => {
    const response = await request(requestUrl, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT },
    });
    if (!response.ok) throw new Error(`Wikimedia imageinfo HTTP ${response.status}`);
    const data = await response.json();
    if (data?.error) throw new Error(`Wikimedia imageinfo API error: ${String(data.error.code ?? "unknown")}`);
    const pages = data?.query?.pages;
    const info = Array.isArray(pages) && pages.find((p: any) => p?.imageinfo?.[0]?.thumburl)?.imageinfo?.[0];
    const thumbnail = info?.thumburl;
    if (typeof thumbnail !== "string") throw new Error(`No thumbnail for File:${filename}`);
    // Wikimedia migrated thumbnail traffic to thumb.wikimedia.org in 2026.
    // Keep upload.wikimedia.org for legacy responses, but never trust arbitrary
    // hosts, plain HTTP, or original full-resolution file URLs.
    const validThumbnail = [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/",
    ].some(prefix => thumbnail.startsWith(prefix));
    if (!validThumbnail) {
      throw new Error("Unexpected Wikimedia thumbnail host or path");
    }
    successful.set(filename, thumbnail);
    if (successful.size > MAX_CACHE) successful.delete(successful.keys().next().value!);
    return thumbnail;
  });
  pending.set(filename, promise);
  // Ensure the pending entry is released on both success and failure; no ignored rejections.
  void promise.then(() => { pending.delete(filename); }, () => { pending.delete(filename); });
  return promise;
}
