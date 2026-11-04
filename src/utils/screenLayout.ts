/** Shared screen measurements. The viewport excludes safe areas and bottom tabs.
 * The fallback is only used before the first onLayout measurement.
 */
export function availableScreenHeight(viewportHeight: number, windowHeight: number): number {
  return viewportHeight > 0 ? viewportHeight : Math.max(0, windowHeight - 130);
}

/** Ignore subpixel layout jitter to avoid unnecessary render cycles. */
export function stableLayoutHeight(previous: number, next: number): number {
  return next > 0 && Math.abs(previous - next) >= 1 ? next : previous;
}
