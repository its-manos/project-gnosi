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
  View: "View", Text: "Text", Pressable: "Pressable", Image: "Image",
  StyleSheet: { create: values => values },
};
const svg = { __esModule: true, default: "svg", Circle: "circle", Path: "path",
  Defs: "defs", G: "g", LinearGradient: "linearGradient",
  Rect: "rect", Stop: "stop", Text: "text" };
let showList = false;
const map = compile("src/components/FantasyMap.tsx", {
  react: { useMemo: fn => fn(), useState: () => [showList, value => { showList = value; }] },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": native, "react-native-svg": svg,
}).default;
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
const artAsset = 12345;
const artTree = map({ ...props, backgroundImage: artAsset });
const artFrame = nodes(artTree).find(node => node.props?.testID === "knowledge-world-map");
const artNode = nodes(artFrame).find(node => node.props?.testID === "history-midnight-atlas-art");
assert.ok(artNode, "locally bundled art is placed behind the existing interactive SVG");
assert.equal(artNode.props.source, artAsset);
assert.equal(artNode.props.resizeMode, "cover");
assert.equal(artNode.props.pointerEvents, "none");
assert.equal(nodes(artFrame).filter(node => node.props?.testID?.startsWith("atlas-island-")).length, 3,
  "all atlas tap targets survive background mode");
assert.equal(nodes(artTree).filter(node => node.type === "path" &&
  node.props?.strokeDasharray === "2 5").length, 2,
  "the existing routes remain in the overlay but can be visually suppressed");
const overviewArt = map({ ...props, overview: true, backgroundImage: artAsset });
assert.equal(nodes(overviewArt).filter(node => node.props?.testID === "history-midnight-atlas-art").length, 0,
  "the History-only artwork does not bleed into the home overview map");
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

// The page and navigator pass existing account-scoped progress, not local keys.
const screen = fs.readFileSync(path.join(root, "src/screens/CategoryScreen.tsx"), "utf8");
const navigator = fs.readFileSync(path.join(root, "src/navigation/AppNavigator.tsx"), "utf8");
assert.match(screen, /<FantasyMap/);
assert.match(screen, /getAtlasRegionProgress/);
assert.match(screen, /getAtlasCategoryProgress/);
assert.match(screen, /scrollEnabled={canScroll}/);
assert.match(screen, /chromeMeasured/, "map height uses measured viewport chrome");
assert.match(screen, /onControlsHeightChange=/);
assert.doesNotMatch(screen, /\{category\.description\}/, "remove redundant category description");
assert.match(screen, /reduceMotionChanged/);
assert.match(navigator, /<CategoryScreen[\s\S]*?completedLessonIds={app\.completedLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?inProgressLessonIds={app\.inProgressLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?progressLoaded={app\.progressLoaded}/);
console.log("Category Interactive Atlas contracts passed. Device visual QA still required.");
