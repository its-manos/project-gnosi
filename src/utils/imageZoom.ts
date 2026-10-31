export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type ZoomTransform = { scale: number; x: number; y: number };
export type ZoomGeometry = { viewport: Size; image: Size };
export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 6;
export const FIT_ZOOM: ZoomTransform = { scale: 1, x: 0, y: 0 };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export function containSize(image: Size, viewport: Size): Size {
  if (![image.width, image.height, viewport.width, viewport.height].every(n => Number.isFinite(n) && n > 0)) return { width: 0, height: 0 };
  const ratio = Math.min(viewport.width / image.width, viewport.height / image.height);
  return { width: image.width * ratio, height: image.height * ratio };
}
export function clampZoom(state: ZoomTransform, geometry: ZoomGeometry): ZoomTransform {
  const scale = clamp(Number.isFinite(state.scale) ? state.scale : 1, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
  const fit = containSize(geometry.image, geometry.viewport);
  const boundX = Math.max(0, (fit.width * scale - geometry.viewport.width) / 2);
  const boundY = Math.max(0, (fit.height * scale - geometry.viewport.height) / 2);
  return { scale, x: clamp(Number.isFinite(state.x) ? state.x : 0, -boundX, boundX), y: clamp(Number.isFinite(state.y) ? state.y : 0, -boundY, boundY) };
}
/** Keep the image point beneath the fingers anchored as scale and midpoint move. */
export function zoomAround(state: ZoomTransform, scale: number, from: Point, to: Point, geometry: ZoomGeometry): ZoomTransform {
  const next = clamp(scale, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM), ratio = next / state.scale;
  const cx = geometry.viewport.width / 2, cy = geometry.viewport.height / 2;
  return clampZoom({ scale: next, x: to.x - cx - (from.x - cx - state.x) * ratio, y: to.y - cy - (from.y - cy - state.y) * ratio }, geometry);
}
function midpoint(points: Point[]): Point {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
type Gesture = { count: number; center: Point; distance: number; state: ZoomTransform; tap: boolean; at: number };
/** Pure gesture controller: handles finger-count transitions without jumps. */
export class ImageZoomController {
  state: ZoomTransform = { ...FIT_ZOOM };
  private gesture: Gesture | null = null;
  private lastTap: { point: Point; at: number } | null = null;
  constructor(private geometry: ZoomGeometry) {}
  configure(geometry: ZoomGeometry) { this.geometry = geometry; return this.reset(); }
  reset() { this.state = { ...FIT_ZOOM }; this.gesture = null; this.lastTap = null; return this.state; }
  zoom(scale: number, point = { x: this.geometry.viewport.width / 2, y: this.geometry.viewport.height / 2 }) {
    this.gesture = null; this.lastTap = null;
    this.state = zoomAround(this.state, scale, point, point, this.geometry); return this.state;
  }
  begin(points: Point[], now: number, tap = true) {
    if (!points.length) return;
    const count = Math.min(points.length, 2);
    this.gesture = { count, center: midpoint(points), distance: count === 2 ? distance(points[0], points[1]) : 0, state: this.state, tap: tap && count === 1, at: now };
    if (count > 1) this.lastTap = null;
  }
  move(points: Point[], now: number) {
    if (!points.length) return this.state;
    const count = Math.min(points.length, 2);
    if (!this.gesture || count !== this.gesture.count) { this.begin(points, now, false); return this.state; }
    const g = this.gesture, center = midpoint(points);
    if (distance(center, g.center) > 6 || count > 1) g.tap = false;
    if (count === 2 && g.distance > 0) {
      this.state = zoomAround(g.state, g.state.scale * distance(points[0], points[1]) / g.distance, g.center, center, this.geometry);
    } else this.state = clampZoom({ ...g.state, x: g.state.x + center.x - g.center.x, y: g.state.y + center.y - g.center.y }, this.geometry);
    return this.state;
  }
  end(remaining: Point[], now: number) {
    const g = this.gesture;
    if (!g && !remaining.length) return this.state;
    if (remaining.length) { this.begin(remaining, now, false); return this.state; }
    this.gesture = null;
    if (g?.tap && now - g.at <= 250) {
      const last = this.lastTap;
      if (last && now - last.at <= 300 && distance(last.point, g.center) <= 32) {
        if (this.state.scale > 1.01) return this.reset();
        return this.zoom(2.5, g.center);
      }
      this.lastTap = { point: g.center, at: now };
    } else this.lastTap = null;
    return this.state;
  }
  cancel() { this.gesture = null; this.lastTap = null; return this.state; }
}
