/* Headless contracts for the category atlas. Native visual QA is still required. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const compile = (file, modules = {}) => {
  const mod = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(output, {
    module: mod, exports: mod.exports,
    require: id => {
      if (id in modules) return modules[id];
      throw Error("Missing module stub: " + id);
    },
  });
  return mod.exports;
};

const { getAtlasRegionProgress, getAtlasCategoryProgress } = compile("src/utils/categoryAtlas.ts");
const lessons = [
  { id: "a", categoryId: "history", subcategoryId: "ancient" },
  { id: "b", categoryId: "history", subcategoryId: "ancient" },
  { id: "c", categoryId: "history", subcategoryId: "world" },
  { id: "d", categoryId: "science", subcategoryId: "physics" },
];
let region = getAtlasRegionProgress(lessons, "ancient", ["a", "a", "d"], ["a", "b"], true);
assert.equal(region.total, 2);
assert.equal(region.completed, 1);
assert.equal(region.inProgress, 1);
assert.equal(region.percent, 50);
assert.equal(region.status, "in-progress");
region = getAtlasRegionProgress(lessons, "ancient", ["a", "b"], [], true);
assert.equal(region.status, "complete");
assert.equal(region.percent, 100);
region = getAtlasRegionProgress(lessons, "world", [], [], true);
assert.equal(region.status, "new");
assert.equal(region.percent, 0);
region = getAtlasRegionProgress(lessons, "unknown", [], [], true);
assert.equal(region.status, "coming-soon");
region = getAtlasRegionProgress(lessons, "ancient", ["a"], ["b"], false);
assert.equal(region.status, "loading");
assert.equal(region.completed, 0, "unknown account progress must not be presented as completed");
let overall = getAtlasCategoryProgress(lessons, "history", ["a", "c", "d", "d"], true);
assert.equal(overall.total, 3);
assert.equal(overall.completed, 2);
assert.equal(overall.percent, 67);
overall = getAtlasCategoryProgress(lessons, "history", ["a"], false);
assert.equal(overall.completed, 0);
overall = getAtlasCategoryProgress(lessons, "unknown", [], true);
assert.equal(overall.percent, 0);

const jsx = (type, props) => ({ type, props });
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  StyleSheet: { create: values => values },
};
const svg = { __esModule: true, default: "svg", Circle: "circle", Path: "path",
  Defs: "defs", G: "g", LinearGradient: "linearGradient",
  RadialGradient: "radialGradient", Ellipse: "ellipse",
  Rect: "rect", Stop: "stop", Text: "text" };
let showList = false;
const mapModule = compile("src/components/FantasyMap.tsx", {
  react: { useMemo: fn => fn(), useState: initial =>
    typeof initial === "number" || initial === null ? [initial, () => {}]
      : [showList, value => { showList = value; }] },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": native, "react-native-svg": svg,
  "./CategoryAtlasMotion": {
    AtlasAtmosphereBreath: "AtlasAtmosphereBreath",
    AtlasTwinkleStar: "AtlasTwinkleStar",
    AtlasDestinationFeedback: "AtlasDestinationFeedback",
  },
});
const map = mapModule.default;
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const regionData = [
  { id: "ancient", title: "Αρχαία Ελλάδα", detail: "1 / 2", status: "in-progress",
    progressLoaded: true, totalLessons: 2, completedLessons: 1 },
  { id: "world", title: "Παγκόσμια ιστορία", detail: "0 / 1", status: "new",
    progressLoaded: true, totalLessons: 1, completedLessons: 0 },
  { id: "myths", title: "Μυθολογία", detail: "Σύντομα", status: "coming-soon",
    progressLoaded: false, totalLessons: 0, completedLessons: 0 },
];
const selected = [];
const props = { regions: regionData, minHeight: 540, onSelectRegion: id => selected.push(id) };
let tree = map(props);
let frame = nodes(tree).find(node => node.props?.testID === "knowledge-world-map");
assert.ok(frame);
assert.equal(frame.props.style[2].aspectRatio, 360 / 540, "grow map into available screen height");
let islands = nodes(tree).filter(node => node.props?.testID?.startsWith("atlas-island-"));
assert.equal(islands.length, 3);
// Map view is deliberately minimal: keep the lesson counts in the accessible
// labels and List view, but do not draw numeric count text on the islands.
const mapText = nodes(frame).filter(node => node.type === "text")
  .map(node => node.props?.children).filter(value => typeof value === "string");
assert.ok(!mapText.includes("1 / 2") && !mapText.includes("0 / 1"),
  "map island counts must be hidden");
const barTracks = nodes(frame).filter(node => node.props?.testID?.startsWith("atlas-progress-track-"));
const barFills = nodes(frame).filter(node => node.props?.testID?.startsWith("atlas-progress-fill-"));
assert.equal(barTracks.length, 2, "both started and empty regions show tracks");
assert.equal(barFills.length, 1, "zero-progress destinations have no colored fill");
assert.equal(barTracks[0].props.height, 5.5, "progress pill is thicker and easier to see");
assert.equal(barTracks[0].props.rx, 2.75, "progress pill has fully rounded ends");
assert.equal(barFills[0].props.fill, "url(#atlas-progress-lavender)");
// Progress-bearing islands must not draw the lower inset coastline through
// their tracks. The loading/no-progress island retains the full contour.
const insetPaths = nodes(tree).filter(node => node.type === "path"
  && node.props?.strokeDasharray === "2 4");
assert.equal(insetPaths.length, 3);
assert.ok(!insetPaths[0].props.d.endsWith(" Z"), "progress island has open upper contour");
assert.ok(!insetPaths[1].props.d.endsWith(" Z"), "progress island has open upper contour");
assert.ok(insetPaths[2].props.d.endsWith(" Z"), "unstarted island keeps closed inset");
assert.equal(islands[0].props.accessibilityRole, "button");
assert.match(islands[0].props.accessibilityLabel, /1 από 2/);
islands[0].props.onPress();
assert.deepEqual(selected, ["ancient"]);
// The first bespoke landmark belongs only to the catalogue's real
// ancient-greece ID, and must never interfere with labels or touch targets.
const ancientRegion = { ...regionData[0], id: "ancient-greece",
  title: "Αρχαία Ελλάδα" };
const detailMap = map({ ...props, regions: [ancientRegion, regionData[1]] });
const detailNodes = nodes(detailMap);
const templeInstances = detailNodes.filter(node =>
  typeof node.type === "function" && node.type.name === "AncientGreekTemple");
assert.equal(templeInstances.length, 1,
  "only ancient-greece receives the bespoke architectural landmark");
const temple = templeInstances[0].type(templeInstances[0].props);
assert.equal(temple.props.testID, "atlas-landmark-ancient-greece");
assert.equal(temple.props.pointerEvents, "none",
  "decoration must not capture island taps");
assert.ok(nodes(temple).filter(node => node.type === "path"
  && node.props?.fill === "#F0DFC1").length >= 6,
  "temple has individually detailed Doric columns, not a generic glyph");
const ancientTitle = detailNodes.find(node => node.type === "text"
  && node.props?.children === "Αρχαία Ελλάδα");
assert.ok(ancientTitle, "temple must preserve title");
const ancientTrack = detailNodes.find(node =>
  node.props?.testID === "atlas-progress-track-ancient-greece");
const worldTrack = detailNodes.find(node =>
  node.props?.testID === "atlas-progress-track-world");
const worldTitle = detailNodes.find(node =>
  node.type === "text" && node.props?.children === "Παγκόσμια");
assert.ok(ancientTrack && worldTrack && worldTitle);
assert.equal(ancientTrack.props.y - ancientTitle.props.y, 17,
  "bring Ancient Greece progress closer to the title");
assert.equal(worldTrack.props.y - worldTitle.props.y, 33,
  "leave other island compositions unchanged during the first landmark pilot");
const ancientBacking = detailNodes.find(node =>
  node.type === "rect" && node.props?.fill === "#12232E"
  && node.props?.y === ancientTrack.props.y - 3);
assert.ok(ancientBacking && ancientBacking.props.opacity === 0.46,
  "progress capsule should have a restrained translucent backing");
assert.ok(templeInstances[0].props.y + 36 * templeInstances[0].props.scale
  < ancientTitle.props.y - 6, "temple must not overlap title");
assert.ok(detailNodes.some(node => node.props?.testID === "atlas-progress-track-ancient-greece"),
  "temple must not remove progress bar");
assert.ok(detailNodes.some(node => node.props?.testID === "atlas-island-ancient-greece"),
  "temple must not remove accessible island navigation");
const noTempleMap = map({ ...props, regions: regionData });
assert.equal(nodes(noTempleMap).filter(node =>
  typeof node.type === "function" && node.type.name === "AncientGreekTemple").length, 0,
  "other regions retain their existing mountain and symbol treatment");

const listToggle = nodes(tree).find(node => node.props?.testID === "atlas-list-toggle");
assert.ok(listToggle, "map/list toggle remains available");
listToggle.props.onPress();
tree = map(props);
assert.ok(nodes(tree).some(node => node.props?.testID === "knowledge-region-list"));
assert.ok(nodes(tree).some(node => node.type === "Text"
  && node.props?.children === "1 / 2 μαθήματα"),
  "List view retains the detailed lesson count");
assert.equal(nodes(tree).filter(node => node.type === "Pressable"
  && node.props?.accessibilityHint?.includes("Άνοιγμα")).length, 3);
const firstList = nodes(tree).find(node => node.props?.accessibilityLabel?.startsWith("Αρχαία Ελλάδα"));
firstList.props.onPress();
assert.deepEqual(selected, ["ancient", "ancient"]);
showList = false;
// Preserve title punctuation on island labels, including '&'.
tree = map({ ...props, regions: [{ id: "astro", title: "Αστρονομία & Διάστημα",
  status: "new", progressLoaded: true, totalLessons: 11, completedLessons: 0 }] });
assert.ok(nodes(tree).some(node => node.type === "text"
  && typeof node.props?.children === "string" && node.props.children.includes("&")),
  "island labels must preserve ampersands from catalogue titles");

// Completed regions keep their golden visual status on the new gradient bar.
tree = map({ ...props, regions: [{ ...regionData[0], status: "complete",
  completedLessons: 2 }] });
const completedBar = nodes(tree).find(node =>
  node.props?.testID === "atlas-progress-fill-ancient");
assert.ok(completedBar);
assert.equal(completedBar.props.fill, "url(#atlas-progress-gold)");
assert.equal(completedBar.props.height, 5.5);

// Five-destination layouts keep illustrated landmasses within the atlas frame.
const five = [
  ...regionData,
  { id: "brain", title: "Εγκέφαλος και Ψευδαισθήσεις", progressLoaded: true,
    totalLessons: 9, completedLessons: 6, status: "in-progress" },
  { id: "earth", title: "Γεωλογία και η κρυμμένη Γη", progressLoaded: true,
    totalLessons: 5, completedLessons: 1, status: "in-progress" },
];
tree = map({ ...props, regions: five });
const filledLand = nodes(tree).filter(node => node.type === "path"
  && typeof node.props?.fill === "string" && node.props.fill.startsWith("url(#land-"));
assert.equal(filledLand.length, 5);
for (const pathNode of filledLand) {
  const coords = [...pathNode.props.d.matchAll(/(-?\\d+(?:\\.\\d+)?) (-?\\d+(?:\\.\\d+)?)/g)];
  const xs = coords.map(match => Number(match[1]));
  assert.ok(Math.min(...xs) >= 9 && Math.max(...xs) <= 351,
    "island coastline must leave room for glow inside map frame");
}
tree = map({ ...props, minHeight: 0 });
frame = nodes(tree).find(node => node.props?.testID === "knowledge-world-map");
assert.equal(frame.props.style[2].aspectRatio, 360 / 304,
  "keep a natural map height when no viewport minimum is supplied");

// Compact layouts keep islands balanced across the screen even when a map
// viewport is tall. No destination is placed on a sequential lesson path.
const compact = mapModule.getCompactAtlasPoint;
assert.equal(compact(0, 3).x, 0.30);
assert.equal(compact(1, 3).y, 0.46);
assert.equal(compact(2, 3).y, 0.73);
assert.ok(compact(2, 3).y - compact(0, 3).y < 0.5,
  "three destinations no longer leave the middle as an empty corridor");
assert.ok(compact(0, 2).y < compact(1, 2).y,
  "two destinations are arranged as a compact diagonal");
assert.ok(compact(0, 4).x < compact(1, 4).x,
  "four destinations retain independent side-by-side positions");
assert.equal(compact(0, 5), null, "larger constellations use balanced rows");
assert.deepEqual(
  Array.from(mapModule.wrapFittedAtlasTitle("Αρχαία Ελλάδα", 11)),
  ["Αρχαία", "Ελλάδα"],
  "compact Greek titles must wrap before touching the curved island outline");
assert.deepEqual(
  Array.from(mapModule.wrapFittedAtlasTitle("Μυθολογία", 11)),
  ["Μυθολογία"],
  "short names remain on a single line");
const fittedAncient = map({ ...props, regions: [
  { ...regionData[0], id: "ancient-greece", title: "Αρχαία Ελλάδα" },
  regionData[1], regionData[2],
], fitViewport: { width: 340, height: 490 } });
const fittedAncientIsland = nodes(fittedAncient).find(node =>
  node.props?.testID === "atlas-island-ancient-greece");
assert.ok(fittedAncientIsland, "Ancient Greece remains an accessible island");
const fittedAncientLabels = nodes(fittedAncientIsland).filter(node =>
  node.type === "text" && (node.props.children === "Αρχαία" ||
    node.props.children === "Ελλάδα" || node.props.children === "Αρχαία Ελλάδα"));
assert.deepEqual(Array.from(fittedAncientLabels, node => node.props.children),
  ["Αρχαία", "Ελλάδα"],
  "the fitted atlas must not render the full Ancient Greece title across the coast");
const fittedAncientBar = nodes(fittedAncientIsland).find(node =>
  node.props?.testID === "atlas-progress-track-ancient-greece");
assert.ok(fittedAncientBar.props.y - fittedAncientLabels[1].props.y >= 10,
  "the second title line must stay clear of its progress track");
assert.ok(fittedAncientIsland.props.onPress,
  "wrapping a destination title must not remove its tap target");
assert.equal(typeof fittedAncientIsland.props.onPressIn, "function",
  "fitted destinations respond to press-in without a route delay");
assert.equal(typeof fittedAncientIsland.props.onPressOut, "function",
  "fitted destinations cancel glint when the touch ends");
assert.equal(nodes(fittedAncient).filter(node => node.type === "AtlasDestinationFeedback").length, 3,
  "all fitted islands receive a lightweight outline glint");
assert.equal(nodes(fittedAncient).filter(node => node.type === "AtlasAtmosphereBreath").length, 1,
  "one atmosphere layer animates without moving any islands");
assert.equal(nodes(fittedAncient).filter(node => node.type === "AtlasTwinkleStar").length, 5,
  "only five deterministic stars twinkle on the UI thread");
assert.ok(!nodes(map(props)).some(node => [
  "AtlasDestinationFeedback", "AtlasAtmosphereBreath", "AtlasTwinkleStar",
].includes(node.type)), "non-fitted atlas does not gain ambient motion");
const islandRims = nodes(fittedAncient).filter(node =>
  typeof node.props?.testID === "string" && node.props.testID.startsWith("atlas-rim-"));
const islandReliefs = nodes(fittedAncient).filter(node =>
  typeof node.props?.testID === "string" && node.props.testID.startsWith("atlas-relief-"));
assert.equal(islandRims.length, 3, "each fitted island has one subtle contour seam");
assert.equal(islandReliefs.length, 3, "each fitted island has one engraved upper ridge");
assert.ok(islandRims.every(node => node.type === "path" && node.props.strokeOpacity <= 0.55),
  "shadows stay restrained rather than becoming heavy rings");
assert.ok(islandReliefs.every(node => node.type === "path" &&
  node.props.fill === "none" && !node.props.d.endsWith(" Z")),
  "fitted relief stays above the labels instead of closing around progress bars");
const normals = nodes(map(props));
assert.ok(!normals.some(node => node.props?.testID?.startsWith("atlas-rim-") ||
  node.props?.testID?.startsWith("atlas-relief-")),
  "regular non-fitted FantasyMap artwork must not change");

// Independent constellation threads stop at the island edges rather than
// crossing SVG labels and progress bars.
const segment = mapModule.getAtlasConnectorSegment(
  { x: 50, y: 100, rx: 48, ry: 42 },
  { x: 250, y: 100, rx: 48, ry: 42 },
);
assert.equal(segment, "M 106.0 100.0 L 194.0 100.0",
  "constellation links should finish just outside illustrated destinations");
assert.equal(mapModule.getAtlasConnectorSegment(
  { x: 50, y: 50, rx: 45, ry: 40 },
  { x: 50, y: 50, rx: 45, ry: 40 },
), "", "coincident points do not create invalid paths");


const compactRadii = mapModule.getCompactAtlasRadii;
assert.deepEqual(
  { ...compactRadii(3, 260) }, { rx: 57, ry: 39 },
  "short viewports must keep enough separation between tappable islands");
assert.deepEqual(
  { ...compactRadii(3, 500) }, { rx: 69, ry: 51 },
  "tall phones should make the destinations more substantial");
assert.deepEqual(
  { ...compactRadii(4, 500) }, { rx: 64, ry: 51 },
  "four destinations preserve generous horizontal margins");
const fullTitle = "Γεωλογία και η κρυμμένη Γη";
assert.equal(mapModule.wrapFittedAtlasTitle(fullTitle, 15).join(" "), fullTitle,
  "fitted map labels retain every Greek title word");
assert.deepEqual(
  Array.from(mapModule.wrapFittedAtlasTitle("Παγκόσμια ιστορία", 15)),
  ["Παγκόσμια", "ιστορία"],
  "normal two-line labels remain stable");

// The Category Atlas fits its islands into the visible map rather than
// introducing sequential stops or requiring a vertical treasure hunt.
tree = map({ ...props, regions: five, fitViewport: { width: 340, height: 490 } });
frame = nodes(tree).find(node => node.props?.testID === "knowledge-world-map");
const fittedCanvas = Math.max(180, Math.round((490 - 50 - 11) * 360 / 340));
assert.equal(frame.props.style[2].aspectRatio, 360 / fittedCanvas);
assert.equal(frame.props.style[3].borderWidth, 0, "integrated atlas has no black inset frame");
assert.equal(nodes(frame).filter(node => node.type === "rect"
  && node.props?.stroke === "#89AAA6").length, 0,
  "fitted map is not drawn inside another rounded border");
assert.ok(nodes(frame).filter(node => node.type === "circle"
  && (node.props?.fill === "#E4CFA6" || node.props?.fill === "#B5CADD")).length >= 30,
  "fitted atlas gets a small static starfield");
assert.equal(nodes(frame).filter(node => node.type === "radialGradient"
  && node.props?.id === "atlas-atmosphere").length, 1,
  "category atlas has a subtle static radial atmosphere");
assert.equal(nodes(frame).filter(node => node.type === "radialGradient"
  && node.props?.id === "atlas-nebula").length, 1,
  "soft nebula stays in SVG geometry without an external texture");
assert.equal(nodes(frame).filter(node => node.props?.testID === "atlas-sky-atmosphere").length, 1,
  "map atmosphere uses one local noninteractive background layer");
assert.equal(nodes(frame).filter(node => node.type === "ellipse"
  && String(node.props?.fill).startsWith("url(#atlas-nebula-")).length, 2,
  "two soft color washes balance the top-right and lower-left sky");
assert.ok(nodes(frame).some(node => node.props?.testID === "atlas-sky-vignette"),
  "vignette makes map edges recede without covering island labels");
assert.equal(nodes(frame).filter(node => node.type === "radialGradient"
  && String(node.props?.id).startsWith("atlas-region-aura-")).length, five.length,
  "every destination gets a subtle theme-aware aura");
assert.ok(nodes(frame).some(node => node.props?.testID === "atlas-premium-compass"),
  "fitted atlas compass gets an engraved star-chart treatment");
assert.ok(nodes(frame).some(node => node.props?.testID === "atlas-chart-orbit-upper"));
assert.ok(nodes(frame).some(node => node.props?.testID === "atlas-chart-orbit-lower"));
assert.equal(nodes(frame).filter(node => node.props?.testID?.startsWith("atlas-chart-tick-")).length, 9,
  "astral chart ticks stay sparse and decorative");
assert.equal(nodes(frame).filter(node => node.type === "circle"
  && ["#E4CFA6","#B5CADD"].includes(node.props?.fill)).length, 50,
  "quiet starfield has deterministic density on all screen sizes");
assert.ok(nodes(frame).some(node => node.type === "path"
  && node.props?.stroke === "#8CA6B9" && node.props?.strokeOpacity === 0.11),
  "faint map engravings add depth without implying lesson progression");
const readableFrame = nodes(map({ ...props, fitViewport: { width: 340, height: 490 } }))
  .find(node => node.props?.testID === "knowledge-world-map");
assert.ok(nodes(readableFrame).some(node => node.props?.testID === "atlas-decorative-constellations"),
  "sparse catalogues have decorative chart groups outside destination interactions");
assert.ok(nodes(readableFrame).filter(node =>
  String(node.props?.testID).startsWith("atlas-route-anchor-")).length >= 2,
  "fitted links have small, noninteractive guide stars in the open sky");
assert.ok(nodes(readableFrame).filter(node =>
  String(node.props?.testID).startsWith("atlas-route-anchor-"))
    .every(node => node.props.pointerEvents === "none"),
  "route anchor decoration cannot steal island taps");
const fittedLabel = nodes(readableFrame).find(node => node.type === "text"
  && node.props?.children === "Παγκόσμια");
assert.equal(fittedLabel.props.fontSize, 12.5,
  "category labels match the Adventure Path's compact system typography");
assert.equal(fittedLabel.props.fontWeight, "800",
  "category labels use the same weight as Adventure Path stop labels");
assert.equal(fittedLabel.props.fill, "#D0D2DA",
  "unstarted destinations use the Adventure Path's softer text body color");
const activeAtlasText = nodes(readableFrame).filter(node => node.type === "text"
  && ["Αρχαία", "Ελλάδα"].includes(node.props?.children));
assert.deepEqual(Array.from(activeAtlasText, node => node.props.children),
  ["Αρχαία", "Ελλάδα"],
  "the active title remains fully visible on two lines in the fitted map");
assert.ok(activeAtlasText.every(node => node.props.fill === "#C7BCFF"),
  "both title lines retain the Adventure Path's active label accent");
const selectedMapControl = nodes(map({ ...props, fitViewport: { width: 340, height: 490 } }))
  .find(node => node.props?.testID === "atlas-map-toggle");
assert.ok(selectedMapControl.props.style.some(style => style?.backgroundColor === "#34304E"),
  "fitted map controls use the Subcategory's muted violet surfaces");
assert.equal(nodes(frame).filter(node => node.props?.testID?.startsWith("atlas-island-")).length, 5);
const constellationEdges = nodes(frame).filter(node =>
  node.type === "path" && node.props?.strokeDasharray === "2 5");
assert.ok(constellationEdges.length >= five.length - 1, "destinations share a constellation");
assert.ok(constellationEdges.every(edge => edge.props.d.includes(" L ")),
  "connections are undirected constellations, not a sequential checkpoint route");
assert.ok(constellationEdges.every(edge => !edge.props.d.startsWith("M 90.0")),
  "constellation link starts are inset from the island centres");
assert.equal(nodes(normals).filter(node => node.props?.testID?.startsWith("atlas-chart-orbit-")).length, 0,
  "non-fitted map keeps its original background");
assert.equal(nodes(normals).filter(node => node.props?.testID === "atlas-sky-vignette").length, 0,
  "legacy overview map must not inherit the richer category sky");
assert.equal(nodes(normals).filter(node => String(node.props?.testID).startsWith("atlas-route-anchor-")).length, 0,
  "overview connectors keep their unchanged visual behavior");
showList = true;
tree = map({ ...props, regions: five, fitViewport: { width: 340, height: 490 } });
const list = nodes(tree).find(node => node.props?.testID === "knowledge-region-list");
assert.equal(list.type, "ScrollView", "the optional list can scroll within the same map viewport");
showList = false;

// The page and navigator pass existing account-scoped progress, not local keys.
const motionCode = fs.readFileSync(path.join(root, "src/components/CategoryAtlasMotion.tsx"), "utf8");
assert.match(motionCode, /useReducedMotion\(/, "atlas respects system reduced-motion settings");
assert.match(motionCode, /cancelAnimation\(/, "ambient animations are cancelled on unmount");
assert.match(motionCode, /useAnimatedProps\(/, "ambient opacity runs on the UI thread");
assert.doesNotMatch(motionCode, /setTimeout|setInterval|requestAnimationFrame/,
  "no JS-thread timers for continuous atlas motion");
assert.match(motionCode, /export function AtlasContinueAccent\(/,
  "the shortcut has its own non-repeating outline glint");
assert.match(motionCode, /export function AtlasContinueArrow\(/,
  "the shortcut arrow has a one-time nudge");
assert.match(motionCode, /export function AtlasProgressFill\(/,
  "the shortcut progress uses animated percentage width");
assert.match(motionCode, /useAnimatedStyle\(/,
  "card animation uses UI-thread styles, not React re-renders");
const continueAccentCode = motionCode.slice(
  motionCode.indexOf("export function AtlasContinueAccent"),
  motionCode.indexOf("export function AtlasContinueArrow"),
);
assert.doesNotMatch(continueAccentCode, /withRepeat\(/,
  "the card highlight must not start an ongoing looping pulse");
const screen = fs.readFileSync(path.join(root, "src/screens/CategoryScreen.tsx"), "utf8");
const navigator = fs.readFileSync(path.join(root, "src/navigation/AppNavigator.tsx"), "utf8");
assert.match(screen, /<FantasyMap/);
assert.match(screen, /getAtlasRegionProgress/);
assert.match(screen, /getAtlasCategoryProgress/);
assert.match(screen, /testID="category-atlas-continue"/);
assert.match(screen, /pressScale=\{0\.983\}/,
  "card press feedback stays restrained");
assert.match(screen, /<AtlasContinueAccent\s*\/>/,
  "card accent stays decorative");
assert.match(screen, /<AtlasContinueArrow\s*\/>/,
  "the navigation arrow has its own brief cue");
assert.match(screen, /<AtlasProgressFill percent=/,
  "regional progress has a smooth UI-thread fill");
assert.match(screen, /Η ΠΡΟΟΔΟΣ ΣΟΥ/,
  "overall progress heading is explicit rather than repeating category title");
assert.match(screen, /#6C668A/, "island tints share Adventure Path palette");
assert.match(screen, /letterSpacing: 1.4/, "header typography matches Subcategory screen");
assert.match(screen, /testID="category-atlas-map-viewport"/);
assert.match(screen, /fitViewport=/, "map respects actual viewport rather than enforcing a tall path");
assert.match(screen, /chooseAtlasFeaturedRegion/, "shortcut chooses an explored area independently");
assert.doesNotMatch(screen, /<ScrollView/, "map exploration fits without page scrolling");
assert.doesNotMatch(screen, /\{category\.description\}/, "remove redundant category description");
assert.doesNotMatch(screen, /getLessonAccess/, "category has no lesson unlock path");
assert.doesNotMatch(screen, /AdventureAtlasBackground/, "do not impose chapter-map geography");
assert.match(navigator, /<CategoryScreen[\s\S]*?completedLessonIds={app\.completedLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?inProgressLessonIds={app\.inProgressLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?progressLoaded={app\.progressLoaded}/);
const screenModule = compile("src/screens/CategoryScreen.tsx", {
  react: { useMemo: fn => fn(), useState: initial => [initial, () => {}] },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": native,
  "../components/FantasyMap": { __esModule: true, default: map },
  "../components/HomeMotion": { MotionPressable: "MotionPressable" },
  "../components/CategoryAtlasMotion": {
    AtlasContinueAccent: "AtlasContinueAccent",
    AtlasContinueArrow: "AtlasContinueArrow",
    AtlasProgressFill: "AtlasProgressFill",
  },
  "../theme": { colors: { accentLight: "#B1A5FF", accent: "#A89BFF", text: "#F3F0E8" } },
  "../utils/categoryAtlas": { getAtlasCategoryProgress, getAtlasRegionProgress },
});
// Initial layout must never show the legacy (non-fitted) map for a frame.
// A fresh CategoryScreen renders only the measured-container shell, then
// mounts FantasyMap once with the correct viewport on the next render.
const screenState = [];
let screenHookIndex = 0;
const screenWithLayout = compile("src/screens/CategoryScreen.tsx", {
  react: {
    useMemo: fn => fn(),
    useState: initial => {
      const index = screenHookIndex++;
      if (!(index in screenState)) screenState[index] = initial;
      return [screenState[index], value => {
        screenState[index] = typeof value === "function" ? value(screenState[index]) : value;
      }];
    },
  },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": native,
  "../components/FantasyMap": { __esModule: true, default: map },
  "../components/HomeMotion": { MotionPressable: "MotionPressable" },
  "../components/CategoryAtlasMotion": {
    AtlasContinueAccent: "AtlasContinueAccent",
    AtlasContinueArrow: "AtlasContinueArrow",
    AtlasProgressFill: "AtlasProgressFill",
  },
  "../theme": { colors: { accentLight: "#B1A5FF", accent: "#A89BFF", text: "#F3F0E8" } },
  "../utils/categoryAtlas": { getAtlasCategoryProgress, getAtlasRegionProgress },
}).default;
const shortcutVisits = [];
const screenProps = {
  category: { id: "history", title: "Ιστορία" },
  subcategories: [{ id: "ancient", title: "Αρχαία Ελλάδα" },
    { id: "world", title: "Παγκόσμια ιστορία" }],
  lessons, completedLessonIds: ["a"], inProgressLessonIds: ["b"],
  progressLoaded: true, onBack: () => {},
  onOpenSubcategory: (id, categoryId) => shortcutVisits.push([id, categoryId]),
};
const renderCategory = () => {
  screenHookIndex = 0;
  return screenWithLayout(screenProps);
};
let categoryTree = renderCategory();
const shortcut = nodes(categoryTree).find(node =>
  node.props?.testID === "category-atlas-continue");
assert.equal(shortcut.type, "MotionPressable",
  "the Continue shortcut uses the established Home press animation");
assert.equal(shortcut.props.pressScale, 0.983);
assert.ok(nodes(shortcut).some(node => node.type === "AtlasContinueAccent"));
assert.ok(nodes(shortcut).some(node => node.type === "AtlasContinueArrow"));
const fill = nodes(shortcut).find(node => node.type === "AtlasProgressFill");
assert.equal(fill.props.percent, 50, "progress motion uses real regional completion");
shortcut.props.onPress();
assert.deepEqual(shortcutVisits, [["ancient", "history"]],
  "animated shortcut still opens the same subcategory");
assert.equal(nodes(categoryTree).filter(node => node.type === map).length, 0,
  "old non-fitted FantasyMap must not flash while viewport is unmeasured");
const mapShell = nodes(categoryTree).find(node =>
  node.props?.testID === "category-atlas-map-viewport");
assert.ok(mapShell && typeof mapShell.props.onLayout === "function",
  "empty flex viewport must still measure its bounds");
mapShell.props.onLayout({ nativeEvent: { layout: { width: 340, height: 490 } } });
categoryTree = renderCategory();
let mountedMaps = nodes(categoryTree).filter(node => node.type === map);
assert.equal(mountedMaps.length, 1, "measured screen mounts exactly one map");
assert.deepEqual(
  { ...mountedMaps[0].props.fitViewport }, { width: 340, height: 490 },
  "first map mount uses the real viewport size rather than legacy layout");
nodes(categoryTree).find(node =>
  node.props?.testID === "category-atlas-map-viewport"
).props.onLayout({ nativeEvent: { layout: { width: 310, height: 420 } } });
categoryTree = renderCategory();
mountedMaps = nodes(categoryTree).filter(node => node.type === map);
assert.deepEqual(
  { ...mountedMaps[0].props.fitViewport }, { width: 310, height: 420 },
  "fitted map still adapts when viewport dimensions change");

const choose = screenModule.chooseAtlasFeaturedRegion;
const picks = [
  { id: "ancient", status: "new" },
  { id: "world", status: "in-progress" },
  { id: "myths", status: "complete" },
];
assert.equal(choose(picks, [
  { id: "a", subcategoryId: "ancient" }, { id: "b", subcategoryId: "world" },
], ["b"]).id, "world", "resume the subcategory already in progress");
assert.equal(choose(picks, [], []).id, "world", "prefer started locations without an active lesson");
assert.equal(choose([{ id: "a", status: "complete" }, picks[0]], [], []).id, "ancient",
  "new explorers can start anywhere");
console.log("Category Interactive Atlas contracts passed. Device visual QA still required.");
