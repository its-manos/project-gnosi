/**
 * Temporarily disabled while testing Android's Wikimedia API/CDN delivery.
 * Keep the reader's integration stable; no speculative network requests.
 */
export default function NextImageWarmup(_props: { uri?: string | null }) {
  return null;
}
