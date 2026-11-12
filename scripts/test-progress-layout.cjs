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

let slots = [], cursor = 0, fontScale = 1, windowWidth = 390;
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
  useWindowDimensions: () => ({ height: 810, width: windowWidth, fontScale }),
};
const { lessons, categories } = load("src/data/lessons.ts");
const knowledge = { revised:4,total:12,pending:[], due: [], categories: [
  { id: "history", mastered: 3, total: 8 },
  { id: "science", mastered: 1, total: 4 },
] };
const common = {
  react, "react/jsx-runtime": { jsx, jsxs: jsx },
  "../utils/screenLayout": { availableScreenHeight: (viewport, window) => viewport > 0 ? viewport : Math.max(0, window - 130), stableLayoutHeight: (old, next) => next > 0 && Math.abs(old - next) >= 1 ? next : old }, "react-native": native,
  "../components/KnowledgeMastery": { __esModule: true, default: "Mastery" },
  "../components/ReviewActions": { __esModule: true, default: "ReviewActions" },
  "../components/AppBackground": { __esModule: true, default: "AppBackground" },
  "../components/HomeMotion": { MotionView: "MotionView", MotionPressable: "MotionPressable", MotionXpCircle: "MotionXpCircle", MotionCounter: "MotionCounter" },
  "../components/ProgressMotion": { ProgressBarFill: "ProgressBarFill", ProgressRingGlow: "ProgressRingGlow" },
  "../components/ProgressTrack": { __esModule: true, default: "ProgressTrack" },
  "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle", Path: "Path" },
  "../components/SyncStatus": { __esModule: true, default: "SyncStatus" },
  "../components/LearningActivityPanel": { CategoryProgress: "Categories" },
  "../hooks/useMistakesModel": { useMistakesModel: () => ({ model: knowledge, ready: true }) },
};
const Progress = load("src/screens/ProgressScreen.tsx", common).default;
const Insights = load("src/screens/LearningInsightsScreen.tsx", common).default;
let profile = 0, review = 0, explore = 0, opened = [], insights = [], backs = 0;
let props = {
  onOpenInsights: view => insights.push(view),
  onKnowledgeReview: () => review++,
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
assert.ok(nodes(tree).some(n => n.type === "AppBackground"), "shared atlas backdrop is mounted behind the dashboard");
assert.ok(!nodes(tree).some(n => n.type === "AtlasBackground"), "no map SVG background remains");
assert.ok(!nodes(tree).some(n => n.type === "ScrollView"));
assert.ok(nodes(node(tree, "progress-summary")).some(n => n.type === "Circle"), "overview retains the ring track");
assert.ok(nodes(node(tree, "progress-summary")).some(n => n.type === "MotionXpCircle"),
  "the completed arc animates as the percentage changes");
assert.equal(nodes(tree).filter(n => typeof n.type === "function" && n.type.name === "OpenArrow").length, 3,
  "Profile and detail links use reliable vector arrows instead of font glyphs");
assert.doesNotMatch(fs.readFileSync(require("node:path").join(__dirname,
  "../src/screens/ProgressScreen.tsx"), "utf8"), /↗/,
  "Progress navigation must not regress to a missing diagonal-arrow glyph");
const glow = nodes(node(tree, "progress-summary")).find(n => n.type === "ProgressRingGlow");
assert.ok(glow, "completion ring gets a separate, soft interior halo");
assert.equal(glow.props.ready, true);
assert.equal(glow.props.progress, Math.round(7 / lessons.length * 100));
assert.equal(nodes(tree).filter(n => n.type === "MotionCounter").length, 4,
  "summary and destination numbers animate on real data changes");
const learningCards = ["progress-knowledge-link", "progress-reading-link"];
for (const key of learningCards) {
  const element = node(tree, key);
  const style = element.props.style;
  assert.equal(element.type, "MotionPressable", "learning cards use native press motion");
  assert.equal(style[0].height, 176, "learning cards have bounded height, not stretched flex height");
  assert.ok(text(element).includes("Δες την ανάλυση"), "card signals navigation to detail");
  assert.ok(nodes(element).some(n => n.type === "ProgressBarFill"), "card animates its progress bar");
}
assert.ok(node(tree, "progress-summary"), "progress totals are visible");
assert.equal(node(tree, "progress-reading-link").props.style[1].backgroundColor, "#182631",
  "Reading card has a distinctive, restrained teal treatment");
assert.ok(nodes(node(tree, "progress-reading-link")).some(n =>
  Array.isArray(n.props.style) && n.props.style.some(style => style?.backgroundColor === "#82C4C7")),
  "Reading has an accent that doesn't add another card outline");
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
assert.equal(node(tree, "progress-heading").type, "MotionView", "heading gets a subtle entrance");
assert.equal(node(tree, "progress-summary").type, "MotionView", "summary gets a staggered entrance");
const progressMotionSource = fs.readFileSync(require("node:path").join(__dirname, "../src/components/ProgressMotion.tsx"), "utf8");
assert.match(progressMotionSource, /useReducedMotion\(/, "indicator animations respect reduced-motion");
assert.doesNotMatch(progressMotionSource, /withRepeat\(/, "no continuous progress animation");
const backgroundSource = fs.readFileSync(require("node:path").join(__dirname, "../src/components/AppBackground.tsx"), "utf8");
assert.match(backgroundSource, /<HomeAtlasBackground showAmbientMotion=\{false\} \/>/, "shared backdrop reuses Home artwork without ambient loops");
assert.ok(!backgroundSource.includes("withRepeat"), "shared backdrop stays static");

const reviewSource = fs.readFileSync(require("node:path").join(__dirname, "../src/components/ReviewActions.tsx"), "utf8");
const buttonSource = fs.readFileSync(require("node:path").join(__dirname, "../src/components/ActionButton.tsx"), "utf8");
assert.match(reviewSource, /decoration=\{<ProgressActionHighlight \/>\}/,
  "the highlight is a child of the primary button, not a misplaced sibling");
assert.match(reviewSource, /overflow: "hidden"/,
  "the button clips its decorative layer to the existing rounded corners");
assert.match(buttonSource, /\{decoration\}[\s\S]*?<Text style=/,
  "the highlight is painted under the button label");
assert.match(progressMotionSource, /\.\.\.StyleSheet\.absoluteFill/,
  "the highlight covers the rounded button instead of drawing a stray stripe");
assert.doesNotMatch(progressMotionSource, /height: 1\.4/,
  "the old 1.4px horizontal line cannot regress");
assert.match(progressMotionSource, /pointerEvents="none"/,
  "the decorative overlay never intercepts the review button");

primary.props.onReview(); primary.props.onExplore();
assert.equal(review, 1); assert.equal(explore, 1);

// On tall screens no leftover height is distributed between rows.
node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 950 } } });
tree = render();
const tallLayout = node(tree, "progress-fixed-dashboard").props.style;
assert.equal(tallLayout[0].justifyContent, "flex-start",
  "tall screens keep dashboard rows together instead of using space-between");
assert.equal(tallLayout[2].gap, 16,
  "roomy screens increase normal spacing by only a small, bounded amount");
assert.equal(node(tree, "progress-knowledge-link").props.style[0].height, 176,
  "learning card height stays bounded on tall screens");

node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 560 } } });
tree = render();
assert.equal(tree.type, "View", "typical smaller phones must not scroll");
assert.equal(nodes(tree).find(n => n.type === "ReviewActions").props.dense, true);
node(tree, "progress-shell").props.onLayout({ nativeEvent: { layout: { height: 540 } } });
tree = render();
assert.ok(node(tree, "progress-fixed-dashboard"), "a short phone still uses the fixed dashboard");
assert.equal(node(tree, "progress-knowledge-link").props.style[2].height, 142,
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
assert.equal(nodes(node(tree, "progress-summary")).find(n => n.type === "ProgressRingGlow").props.ready, false,
  "the ring halo stays off until real progress is hydrated");
props = { ...props, lessonProgressLoaded: true, completedLessons: [] };
tree = render();
assert.ok(text(node(tree, "progress-reading-link")).includes("0 / " + lessons.length));
assert.equal(node(tree, "progress-summary").props.testID, "progress-summary");
assert.ok(!nodes(node(tree, "progress-summary")).some(n => n.type === "MotionXpCircle"),
  "an empty account must not render a rounded purple arc-cap dot");

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
assert.ok(nodes(tree).some(n => n.type === "AppBackground"),
  "learning details reuse the same static Midnight Atlas artwork");
assert.ok(node(tree, "insights-overview"), "detail page leads with a compact mastery overview");
const overviewShell = node(tree, "insights-overview").props.style[0];
assert.equal(overviewShell.minHeight, 112, "both overview cards have matching compact height");
assert.equal(overviewShell.justifyContent, "center", "both progress summaries stay vertically balanced");
assert.equal(nodes(node(tree, "insights-overview")).filter(n => n.type === "Text").length, 4,
  "overview card has only its label, actual/total values and ring percent");
assert.equal(node(tree, "insights-review-action"), undefined,
  "the overview is strictly informational, with no action button");
assert.ok(text(node(tree, "insights-overview")).includes("4 / 12"),
  "overview uses actual mastered concepts, not read lesson count");
assert.ok(nodes(node(tree, "insights-ring")).some(n => n.type === "MotionXpCircle"
  && n.props.progress === 0.33), "mastery is visualized as a compact animated ring");
assert.ok(node(tree, "learning-insights-knowledge"), "knowledge details are identifiable");
assert.ok(nodes(tree).some(n => n.type === "Mastery"), "knowledge detail is available");
assert.ok(nodes(tree).some(n => n.type === "ScrollView"));
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.mapOnly, true);
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.detail, true,
  "dedicated knowledge page reveals all category rows without a secondary disclosure");
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.singleColumn, false,
  "normal-width phones use the two-column subject tile design");
assert.ok(!text(node(tree, "insights-overview")).includes("Η ανάγνωση είναι η αρχή."),
  "normal mastery state has no repetitive explanatory paragraph");
assert.ok(!nodes(tree).some(n => n.type === "Categories"));
button(tree, "Ανάγνωση").props.onPress();
tree = renderInsights();
assert.ok(node(tree, "learning-insights-reading"));
assert.ok(text(node(tree, "insights-overview")).includes("7 / " + lessons.length),
  "reading overview retains real completed lesson count");
assert.equal(node(tree, "insights-overview").props.style[0], overviewShell,
  "reading and knowledge use the exact same dimensions and layout");
assert.equal(node(tree, "insights-overview").props.style[1].backgroundColor, "#192A35",
  "reading retains its original teal-themed surface");
assert.equal(nodes(node(tree, "insights-overview")).filter(n => n.type === "Text").length, 4,
  "reading overview also shows no explanatory subtitle or button");
assert.ok(nodes(node(tree, "insights-ring")).some(n => n.type === "MotionXpCircle"
  && n.props.stroke === "#8BCACB"), "reading uses a distinct teal progress ring");
assert.ok(nodes(tree).some(n => n.type === "Categories"), "reading detail is available");
assert.equal(nodes(tree).find(n => n.type === "Categories").props.detail, true,
  "reading categories use the detail-specific card layout");
assert.equal(nodes(tree).find(n => n.type === "Categories").props.singleColumn, false,
  "normal-width phones use matching teal tiles");
const readingTileSource = fs.readFileSync(require("node:path").join(__dirname, "../src/components/LearningActivityPanel.tsx"), "utf8");
assert.match(readingTileSource, /reading-all-subjects/);
assert.match(readingTileSource, /detail \? 4 : 3/,
  "reading details default to four focused subjects before expansion");
assert.ok(!text(node(tree, "insights-overview")).includes("Κάθε ολοκληρωμένο"),
  "non-empty reading state remains visually driven");
assert.ok(!nodes(tree).some(n => n.type === "Mastery"));
assert.ok(!text(tree).includes(lessons[6].title), "completed list starts collapsed");
assert.equal(node(tree, "insights-completed-toggle").props.accessibilityState.expanded, false,
  "completed list begins closed with an explicit accessibility state");
button(tree, "Ολοκληρωμένα μαθήματα").props.onPress();
tree = renderInsights();
assert.equal(node(tree, "insights-completed-toggle").props.accessibilityState.expanded, true,
  "the completed list announces its open state");
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
assert.ok(text(node(tree, "insights-overview")).includes("—"),
  "unhydrated reading metrics must not show fabricated zero progress");
assert.ok(text(tree).includes("Φόρτωση μαθημάτων"));
insightProps.lessonProgressLoaded = true;
insightProps.completedLessons = [];
tree = renderInsights();
assert.ok(text(tree).includes("Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ."));
assert.ok(!button(tree, "Ολοκληρωμένα μαθήματα"), "fresh account cannot open a nonexistent list");
assert.ok(!text(node(tree, "insights-overview")).includes("Το πρώτο σου μάθημα"),
  "fresh reading overview remains clean with no conditional explanation");
assert.equal(node(tree, "insights-ring").props.accessibilityValue.now, 0,
  "empty reading progress stays accessible without explanatory text");
slots = []; cursor = 0;
insightProps.initialView = "knowledge";
tree = renderInsights();
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.detail, true);
assert.ok(text(tree).includes("ΛΑΘΗ ΠΟΥ ΔΙΟΡΘΩΣΕΣ"));
assert.ok(!nodes(tree).some(n => n.type === "Categories"));

// A 0% mastery ring is a quiet empty track, not a bright arc-cap dot.
// It still announces the true zero value to assistive technology.
const existingCategories = knowledge.categories;
knowledge.revised=0;knowledge.total=24;
knowledge.categories = [{ id: "history", mastered: 0, total: 24, percent: 0 }];
tree = renderInsights();
assert.equal(node(tree, "insights-ring").props.accessibilityValue.now, 0);
assert.ok(!nodes(node(tree, "insights-ring")).some(n => n.type === "MotionXpCircle"),
  "zero mastery does not draw a visible rounded arc-cap dot");
assert.ok(!text(node(tree, "insights-overview")).includes("πρώτη κατάκτηση"),
  "empty mastery overview avoids a redundant hint");
knowledge.due = [{}, {}, {}];
tree = renderInsights();
assert.equal(node(tree, "insights-review-action"), undefined,
  "review availability must not add an action row to the top card");
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.onOpen,
  insightProps.onKnowledgeReview,
  "the established KnowledgeMastery review route remains wired for the rest of the screen");
knowledge.due = [];
knowledge.categories = existingCategories;knowledge.revised=4;knowledge.total=12;

// Responsive detail layout: three columns on wide screens and a single
// readable column when large text is enabled.
slots = []; cursor = 0; windowWidth = 690; fontScale = 1;
insightProps.initialView = "knowledge";
tree = renderInsights();
assert.equal(nodes(tree).find(n => n.type === "Mastery").props.threeColumn, true,
  "wide screens get three compact knowledge tile columns");
button(tree, "Ανάγνωση").props.onPress();
tree = renderInsights();
assert.equal(nodes(tree).find(n => n.type === "Categories").props.threeColumn, true,
  "wide screens get matching reading columns");
slots = []; cursor = 0; fontScale = 1.5;
insightProps.initialView = "reading";
tree = renderInsights();
assert.equal(nodes(tree).find(n => n.type === "Categories").props.singleColumn, true,
  "large accessibility fonts switch to single-column cards");
assert.equal(nodes(tree).find(n => n.type === "Categories").props.threeColumn, false);
fontScale = 1; windowWidth = 390;

// The navigator and Android Back contract must recognize the new route.
const routeSource = fs.readFileSync(require("node:path").join(__dirname, "../src/navigation/AppNavigator.tsx"), "utf8");
assert.match(routeSource, /case "learning-insights"/);
assert.match(routeSource, /app\.screen === "learning-insights" \? "progress"/);
console.log("Progress responsive routing passed: fixed dashboard, adaptive compact mode, accessibility fallback, details navigation, completion access, loading/empty states and Back integration.");
