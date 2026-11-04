const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
  : tree && typeof tree === "object" ? text(tree.props?.children) : "";
const node = (tree, testID) => nodes(tree).find(n => n.props.testID === testID);
const button = (tree, label) => nodes(tree).find(n => n.type === "Pressable" && text(n).includes(label));

let slots = [], cursor = 0, fontScale = 1;
const react = {
  useState: init => {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof init === "function" ? init() : init;
    return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
  },
};
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  StyleSheet: { create: value => value },
  useWindowDimensions: () => ({ height: 810, width: 390, fontScale }),
};
const { lessons, categories } = load("src/data/lessons.ts");
const knowledge = { categories: [
  { id: "history", mastered: 3, total: 8 },
  { id: "science", mastered: 1, total: 4 },
] };
const common = {
  react, "react/jsx-runtime": { jsx, jsxs: jsx }, "react-native": native,
  "../components/KnowledgeMastery": { __esModule: true, default: "Mastery" },
  "../components/ReviewActions": { __esModule: true, default: "ReviewActions" },
  "../components/HomeAtlasBackground": { __esModule: true, default: "AtlasBackground" },
  "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle" },
  "../components/SyncStatus": { __esModule: true, default: "SyncStatus" },
  "../components/LearningActivityPanel": { CategoryProgress: "Categories" },
  "../hooks/useKnowledgeModel": { useKnowledgeModel: () => ({ model: knowledge, ready: true }) },
};
const Progress = load("src/screens/ProgressScreen.tsx", common).default;
const Insights = load("src/screens/LearningInsightsScreen.tsx", common).default;
let profile = 0, review = 0, weekly = 0, explore = 0, opened = [], insights = [], backs = 0;
let props = {
  onOpenInsights: view => insights.push(view),
  onKnowledgeReview: () => review++,
  onWeeklyReview: () => weekly++,
  onOpenProfile: () => profile++,
  onHome: () => explore++,
  onOpenLesson: id => opened.push(id),
  completedLessons: lessons.slice(0, 7),
  inProgressLesson: lessons[0],
  inProgressAnsweredCount: 2,
  inProgressQuestionCount: 4,
  inProgressLessonCount: 2,
  totalLessonCount: lessons.length,
  lessonProgressLoaded: true,
};
const render = () => { cursor = 0; return Progress(props); };

let tree = render();
assert.equal(tree.type, "View", "Progress is a fixed View, not a scroll container");
assert.ok(node(tree, "progress-fixed-dashboard"));
assert.ok(node(tree, "progress-shell"));
assert.equal(nodes(tree).find(n => n.type === "AtlasBackground").props.showAmbientMotion, false,
  "static atlas detail must not add continuous animation work");
assert.ok(!nodes(tree).some(n => n.type === "ScrollView"));
assert.ok(nodes(node(tree, "progress-summary")).some(n => n.type === "Circle"), "overview has a real SVG completion ring");
const learningCards = ["progress-knowledge-link", "progress-reading-link"];
for (const key of learningCards) {
  const element = node(tree, key);
  const style = element.props.style({ pressed: false });
  assert.equal(style[0].height, 176, "learning cards have bounded height, not stretched flex height");
  assert.ok(text(element).includes("Δες την ανάλυση"), "card signals navigation to detail");
  assert.ok(nodes(element).some(n => n.props.style && Array.isArray(n.props.style) && n.props.style[0]?.height === "100%"), "card carries its own progress bar");
}
assert.ok(node(tree, "progress-summary"), "progress totals are visible");
assert.ok(text(node(tree, "progress-summary")).includes("7"), "completed count is retained");
assert.ok(text(node(tree, "progress-summary")).includes(String(categories.length)), "world count is live");
assert.ok(text(node(tree, "progress-summary")).includes("%"), "completion percent remains");
assert.ok(text(node(tree, "progress-knowledge-link")).includes("4 / 12"));
assert.ok(text(node(tree, "progress-reading-link")).includes("7 / " + lessons.length));
assert.ok(!nodes(tree).some(n => n.type === "Mastery" || n.type === "Categories"),
  "the Progress dashboard has no expandable knowledge or reading content");
assert.ok(!nodes(tree).some(n => n.props.accessibilityRole === "tab"), "detail tabs moved off Progress");
assert.ok(!text(tree).includes("ΣΥΝΟΛΙΚΟΙ ΠΟΝΤΟΙ"), "XP/statistics remain on their proper screens");
node(tree, "progress-knowledge-link").props.onPress();
node(tree, "progress-reading-link").props.onPress();
assert.deepEqual(insights, ["knowledge", "reading"]);
button(tree, "Προφίλ").props.onPress();
assert.equal(profile, 1);
const primary = nodes(tree).find(n => n.type === "ReviewActions");
assert.equal(primary.props.inProgressLesson, props.inProgressLesson);
assert.equal(primary.props.onResumeLesson, props.onOpenLesson);
primary.props.onReview(); primary.props.onExplore(); primary.props.onWeeklyReview();
assert.equal(review, 1); assert.equal(explore, 1); assert.equal(weekly, 1);

node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 560 } } });
tree = render();
assert.equal(tree.type, "View", "typical smaller phones must not scroll");
assert.equal(nodes(tree).find(n => n.type === "ReviewActions").props.dense, true);
node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 540 } } });
tree = render();
assert.ok(node(tree, "progress-fixed-dashboard"), "a short phone still uses the fixed dashboard");
assert.equal(node(tree, "progress-knowledge-link").props.style({ pressed: false })[2].height, 142,
  "very short screens use compact learning cards");
node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 440 } } });
tree = render();
assert.equal(tree.type, "View", "background shell remains mounted");
assert.ok(nodes(tree).some(n => n.type === "ScrollView"), "exceptionally short viewport gets safe overflow");
assert.ok(node(tree, "progress-accessibility-scroll"));
fontScale = 1.5; tree = render();
assert.ok(nodes(tree).some(n => n.type === "ScrollView"), "large accessibility font may scroll instead of clipping");
slots = []; cursor = 0; fontScale = 1;
props = { ...props, lessonProgressLoaded: false };
tree = render();
assert.ok(!text(node(tree, "progress-summary")).includes("0%"), "loading must not show false zero");
assert.ok(text(node(tree, "progress-reading-link")).includes("—"));
props = { ...props, lessonProgressLoaded: true, completedLessons: [] };
tree = render();
assert.ok(text(node(tree, "progress-reading-link")).includes("0 / " + lessons.length));

const insightProps = {
  initialView: "knowledge", onViewChange: view => insights.push(view),
  onBack: () => backs++, onKnowledgeReview: () => review++,
  completedLessons: lessons.slice(0, 7),
  totalLessonCount: lessons.length,
  lessonProgressLoaded: true,
  onOpenLesson: id => opened.push(id),
};
slots = []; cursor = 0;
const renderInsights = () => { cursor = 0; return Insights(insightProps); };
tree = renderInsights();
assert.equal(tree.type, "View", "the detail page owns its own scrollable content");
assert.ok(node(tree, "learning-insights-screen"));
assert.ok(nodes(tree).some(n => n.type === "Mastery"), "knowledge detail is available");
assert.ok(nodes(tree).some(n => n.type === "ScrollView"));
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.mapOnly, true);
assert.ok(!nodes(tree).some(n => n.type === "Categories"));
button(tree, "Ανάγνωση").props.onPress();
tree = renderInsights();
assert.ok(node(tree, "learning-insights-reading"));
assert.ok(nodes(tree).some(n => n.type === "Categories"), "reading detail is available");
assert.ok(!nodes(tree).some(n => n.type === "Mastery"));
assert.ok(!text(tree).includes(lessons[6].title), "completed list starts collapsed");
button(tree, "Ολοκληρωμένα μαθήματα").props.onPress();
tree = renderInsights();
button(tree, lessons[6].title).props.onPress();
assert.equal(opened.at(-1), lessons[6].id, "all completed lessons remain reachable");
button(tree, "Γνώσεις").props.onPress();
tree = renderInsights();
assert.ok(nodes(tree).some(n => n.type === "Mastery"), "switching back restores knowledge detail");
button(tree, "ΠΡΟΟΔΟΣ").props.onPress();
assert.equal(backs, 1);
assert.deepEqual(insights.slice(-2), ["reading", "knowledge"], "detail view changes persist in navigator");

slots = []; cursor = 0;
insightProps.initialView = "reading";
insightProps.lessonProgressLoaded = false;
tree = renderInsights();
assert.ok(!nodes(tree).some(n => n.type === "Categories"), "reading list waits for data");
assert.ok(text(tree).includes("Φόρτωση μαθημάτων"));
insightProps.lessonProgressLoaded = true;
insightProps.completedLessons = [];
tree = renderInsights();
assert.ok(text(tree).includes("Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ."));
assert.ok(!button(tree, "Ολοκληρωμένα μαθήματα"), "fresh account cannot open a nonexistent list");

// Existing analytics allowlist and Android Back contract must recognize the new route.
const routeSource = fs.readFileSync(require("node:path").join(__dirname, "../src/navigation/AppNavigator.tsx"), "utf8");
assert.match(routeSource, /case "learning-insights"/);
assert.match(routeSource, /app\.screen === "learning-insights" \? "progress"/);
assert.match(routeSource, /app\.screen === "player-stats" \|\| app\.screen === "learning-insights"/);
console.log("Progress responsive routing passed: fixed dashboard, adaptive compact mode, accessibility fallback, details navigation, completion access, loading/empty states and Back integration.");
