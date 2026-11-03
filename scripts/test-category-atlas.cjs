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
  View: "View", Text: "Text", Pressable: "Pressable",
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
let islands = nodes(tree).filter(node => node.props?.testID?.startsWith("atlas-island-"));
assert.equal(islands.length, 3);
assert.equal(islands[0].props.accessibilityRole, "button");
assert.match(islands[0].props.accessibilityLabel, /1 από 2/);
islands[0].props.onPress();
assert.deepEqual(selected, ["ancient"]);
const listToggle = nodes(tree).find(node => node.props?.testID === "atlas-list-toggle");
assert.ok(listToggle, "map/list toggle remains available");
listToggle.props.onPress();
tree = map(props);
assert.ok(nodes(tree).some(node => node.props?.testID === "knowledge-region-list"));
assert.equal(nodes(tree).filter(node => node.type === "Pressable"
  && node.props?.accessibilityHint?.includes("Άνοιγμα")).length, 3);
const firstList = nodes(tree).find(node => node.props?.accessibilityLabel?.startsWith("Αρχαία Ελλάδα"));
firstList.props.onPress();
assert.deepEqual(selected, ["ancient", "ancient"]);
showList = false;
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
assert.match(screen, /reduceMotionChanged/);
assert.match(navigator, /<CategoryScreen[\s\S]*?completedLessonIds={app\.completedLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?inProgressLessonIds={app\.inProgressLessonIds}/);
assert.match(navigator, /<CategoryScreen[\s\S]*?progressLoaded={app\.progressLoaded}/);
console.log("Category Interactive Atlas contracts passed. Device visual QA still required.");
