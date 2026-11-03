/* Headless contracts for the compact Home dashboard and subcategory adventure map.
 * These checks do not replace native Android/iOS layout testing. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const jsx = (type, props) => ({ type, props });
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  ActivityIndicator: "Spinner", useWindowDimensions: () => ({ width: 360, height: 740 }),
  StyleSheet: { create: value => value },
};
const svg = {
  __esModule: true, default: "svg", Circle: "circle", Path: "path",
  Defs: "defs", G: "g", LinearGradient: "linearGradient",
  Rect: "rect", Stop: "stop", Text: "text",
};
let showList = false;
let homeScrollState = null;
let homeScrollHookIndex = 0;
const react = {
  useMemo: fn => fn(),
  useState: initial => {
    if (homeScrollState !== null) {
      const index = homeScrollHookIndex++;
      const value = homeScrollState[index] ?? initial;
      return [value, next => {
        homeScrollState[index] = typeof next === "function" ? next(homeScrollState[index]) : next;
      }];
    }
    return [showList, value => { showList = typeof value === "function" ? value(showList) : value; }];
  },
};
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];

function compile(file, extra = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const imports = {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": native, "react-native-svg": svg,
    "../theme": { colors: {
      accent: "#A89BFF", accentLight: "#B1A5FF", borderStrong: "#34304E",
      textMuted: "#ABB0C1", success: "#3CC69A", successSurface: "#17372F",
    } },
    ...extra,
  };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    require: id => { if (id in imports) return imports[id]; throw Error("Missing stub " + id); },
  });
  return mod.exports.default;
}

const categories = [
  ["history", "Ιστορία", "🏛️"], ["science", "Επιστήμη & Διάστημα", "🚀"],
  ["nature", "Φύση & Ζώα", "🌿"], ["technology", "Τεχνολογία", "⚡"],
  ["culture", "Τέχνες & Πολιτισμός", "🎨"], ["geography", "Γεωγραφία & Κοινωνία", "🌍"],
  ["difficult-history", "Ταμπού της Ιστορίας", "🕯️"],
].map(([id, title, emoji]) => ({ id, title, emoji }));
const lessons = categories.map((category, index) => ({
  id: String(index), categoryId: category.id, title: "Μάθημα " + index,
  subcategoryId: "ancient-greece", questions: [], sources: [],
}));
const actions = [];
let profile = { ready: true, profile: { level: 3, earned: 150, required: 600 } };
let daily = { ready: true, doc: { days: { "2026-11-03": { record: { completed: true } } } } };
const home = compile("src/screens/HomeScreen.tsx", {
  "../hooks/useKnowledgeProfile": { useKnowledgeProfile: () => profile },
  "../hooks/useAthensDate": { useAthensDate: () => "2026-11-03" },
  "../state/LearningSession": { useDailySnapshot: () => daily },
  "../utils/dailySyncDocument": { dailyHistory: () => ["today", "yesterday"] },
  "../utils/progressStats": { calculateDailyChallengeProgress: () => ({ currentStreak: 2 }) },
});
const props = {
  categories, featuredLesson: lessons[1], progressLoaded: true,
  completedCount: 1, savedCount: 2,
  inProgressLesson: lessons[0], inProgressAnsweredCount: 1, inProgressQuestionCount: 3,
  onResumeLesson: id => actions.push("resume:" + id),
  onOpenLesson: id => actions.push("lesson:" + id),
  onOpenCategory: id => actions.push("category:" + id),
  onStartDailyChallenge: () => actions.push("daily"),
  onKnowledgeReview: () => actions.push("review"),
  onOpenProfile: () => actions.push("profile"),
};
let tree = home(props);
assert.ok(nodes(tree).some(node => node.props?.testID === "home-game-dashboard"));
assert.ok(!nodes(tree).some(node => node.type === "FantasyMap" || node.props?.children === "Πού θα ταξιδέψεις;"));
const press = (id, value = tree) => {
  const target = nodes(value).find(node => node.props?.testID === id);
  assert.ok(target, id + " must exist");
  target.props.onPress();
  return target;
};
press("home-primary-action");
press("home-daily-quiz");
press("home-knowledge-review");
press("home-level-profile");
assert.deepEqual(actions, ["resume:0", "daily", "review", "profile"]);
const ring = nodes(tree).find(node => node.props?.testID === "home-xp-ring");
assert.ok(Math.abs(Number(ring.props.strokeDasharray.split(" ")[0]) - 2 * Math.PI * 21 * .25) < 0.01);
assert.equal(nodes(tree).find(node => node.props?.testID === "home-level").props.children, 3);
assert.equal(nodes(tree).filter(node => node.props?.testID?.startsWith("home-category-")).length, 7);
press("home-category-history");
assert.equal(actions.at(-1), "category:history");
assert.equal(nodes(tree).find(node => node.props?.testID === "home-quiz-streak").props.accessibilityLabel.includes("καθημερινού quiz"), true);
assert.ok(nodes(tree).some(node => node.props?.children === "Ολοκληρώθηκε ✓"));
assert.equal(nodes(tree).filter(node => node.props?.accessibilityLabel?.includes("Αναζήτηση")).length, 0);
// Future games are only discoverable previews. No unfinished game can be launched.
const upcomingGames = nodes(tree).filter(node => node.props?.testID?.startsWith("home-mini-game-"));
assert.equal(nodes(tree).filter(node => node.props?.testID === "home-mini-games").length, 1);
assert.equal(upcomingGames.length, 2);
assert.deepEqual(Array.from(upcomingGames, node => node.props.testID), [
  "home-mini-game-sudoku", "home-mini-game-hangman",
]);
for (const game of upcomingGames) {
  assert.equal(game.type, "View");
  assert.equal(game.props.onPress, undefined, "future game cards must not navigate");
  assert.equal(game.props.accessible, true);
  assert.equal(game.props.accessibilityState.disabled, true);
  assert.match(game.props.accessibilityLabel, /σύντομα διαθέσιμο/);
  assert.equal(game.props.style.minHeight, 62);
}
assert.ok(nodes(tree).some(node => node.props?.children === "Μίνι παιχνίδια"));
assert.equal(nodes(tree).filter(node => node.props?.children === "Σύντομα").length, 2);

// No scrolling or elastic pull on a fitted one-screen dashboard.
// A genuinely taller dashboard must still scroll on small devices or with larger text.
homeScrollState = [0, 0];
const renderMeasuredHome = () => { homeScrollHookIndex = 0; return home(props); };
const scrollNode = () => nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-game-dashboard");
let scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "disable scrolling before measurements settle");
assert.equal(scroll.props.bounces, false, "disable iOS elastic bounce");
assert.equal(scroll.props.alwaysBounceVertical, false);
assert.equal(scroll.props.overScrollMode, "never", "disable Android overscroll glow");
scroll.props.onLayout({ nativeEvent: { layout: { height: 600 } } });
scroll.props.onContentSizeChange(360, 596);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "no movement when content fits");
scroll.props.onContentSizeChange(360, 601);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "ignore subpixel measurement mismatch");
scroll.props.onContentSizeChange(360, 620);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, true, "enable scrolling for genuine overflow");
scroll.props.onLayout({ nativeEvent: { layout: { height: 660 } } });
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "recalculate scroll availability when the viewport grows");
homeScrollState = null;
assert.ok(nodes(tree).some(node => node.props?.children === "1 / 3 ερωτήσεις"),
  "resume card shows question progress beside its heading");
const centeredGrid = nodes(tree).find(node => node.props?.style?.flexWrap === "wrap"
  && node.props?.style?.justifyContent === "center");
assert.ok(centeredGrid, "knowledge worlds are centered with equal grid gaps");
assert.equal(centeredGrid.props.style.columnGap, 8);
const firstWorld = nodes(tree).find(node => node.props?.testID === "home-category-history");
const cardPercent = Number.parseFloat(firstWorld.props.style({ pressed: false })[0].width) / 100;
for (const phoneWidth of [320, 360, 393]) {
  const available = phoneWidth - 32;
  assert.ok(4 * available * cardPercent + 3 * 8 <= available,
    "four-column grid must fit at " + phoneWidth + "pt");
}
const primaryButton = nodes(tree).find(node => node.props?.style?.minHeight === 44
  && node.props?.style?.backgroundColor === "#A89BFF");
assert.ok(primaryButton, "primary CTA retains a 44-point tap area");
const homeTrack = nodes(tree).find(node => Array.isArray(node.props?.style)
  && node.props.style[0]?.backgroundColor === "#B1A5FF"
  && node.props.style[1]?.width?.endsWith("%"));
assert.ok(homeTrack, "lesson progress uses the shared lavender accent");

// The compact bottom navigation preserves all three destinations.
const bottomNav = compile("src/components/BottomNavigation.tsx", {
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
});
const bottomTree = bottomNav({ currentScreen: "home", onNavigate: destination => actions.push("nav:" + destination) });
const tabs = nodes(bottomTree).filter(node => node.props?.accessibilityRole === "tab");
assert.equal(tabs.length, 3);
assert.equal(tabs[0].props.accessibilityState.selected, true);
assert.equal(tabs[1].props.accessibilityState.selected, false);
tabs[1].props.onPress();
assert.equal(actions.at(-1), "nav:progress");
assert.ok(nodes(bottomTree).some(node => Array.isArray(node.props?.style)
  && node.props.style[0]?.minHeight === 60 && node.props.style[1]?.paddingBottom === 34),
  "navigation preserves safe-area inset while remaining compact");

tree = home({ ...props, inProgressLesson: null });
press("home-primary-action", tree);
assert.equal(actions.at(-1), "lesson:1");
tree = home({ ...props, inProgressLesson: null, featuredLesson: null });
press("home-primary-action", tree);
assert.equal(actions.at(-1), "category:history");
profile = { ready: false, profile: { level: 1, earned: 0, required: 200 } };
tree = home(props);
assert.equal(nodes(tree).find(node => node.props?.testID === "home-level").props.children, "—");
assert.ok(!nodes(tree).some(node => node.props?.testID === "home-xp-ring"));

// Keep the detailed islands accessible on CategoryScreen even though Home is now compact.
const categorySource = fs.readFileSync(path.join(root, "src/screens/CategoryScreen.tsx"), "utf8");
assert.match(categorySource, /<FantasyMap/);
const map = compile("src/components/FantasyMap.tsx");
const mapProps = { regions: categories.map(category => ({ id: category.id, title: category.title, emoji: category.emoji })), overview: true, onSelectRegion: id => actions.push(id) };
const mapTree = map(mapProps);
assert.ok(nodes(mapTree).some(node => node.type === "svg"));
assert.equal(nodes(mapTree).filter(node => node.type === "g" && node.props?.onPress).length, 7);

// Each subcategory has an accessible, ordered series of checkpoints.
const adventureLessons = Array.from({ length: 30 }, (_v, index) => ({
  id: "anc-" + index, subcategoryId: "ancient-greece", title: "Ενότητα " + (index + 1),
}));
const access = (lesson, catalogue, completed, inProgress) => {
  const index = catalogue.findIndex(item => item.id === lesson.id);
  const prerequisite = index > 0 ? catalogue[index - 1] : null;
  return { prerequisite, unlocked: !prerequisite || completed.includes(prerequisite.id) || completed.includes(lesson.id) || inProgress.includes(lesson.id) };
};
const adventure = compile("src/screens/SubcategoryScreen.tsx", {
  "../components/AppHeader": { __esModule: true, default: "AppHeader" },
  "../utils/lessonPath": { getSubcategoryPath: catalogue => catalogue, getLessonAccess: access },
  "../utils/devLessonAccess": { devLessonsUnlocked: () => false },
});
const adventureProps = {
  category: categories[0], subcategory: { id: "ancient-greece", title: "Αρχαία Ελλάδα", description: "Ιστορικό ταξίδι" },
  lessons: adventureLessons, completedLessonIds: [], inProgressLessonIds: [], progressLoaded: true,
  onBack: () => actions.push("back"), onOpenLesson: id => actions.push("open:" + id),
};
tree = adventure(adventureProps);
assert.ok(nodes(tree).some(node => node.props?.testID === "subcategory-adventure-path"));
assert.equal(nodes(tree).filter(node => node.props?.testID?.startsWith("adventure-node-")).length, 30);
assert.equal(nodes(tree).filter(node => node.props?.children?.startsWith?.("ΚΕΦΑΛΑΙΟ ")).length, 5);
const first = nodes(tree).find(node => node.props?.testID === "adventure-node-anc-0");
const second = nodes(tree).find(node => node.props?.testID === "adventure-node-anc-1");
assert.equal(first.props.disabled, false);
assert.equal(second.props.disabled, true);
first.props.onPress();
assert.equal(actions.at(-1), "open:anc-0");
tree = adventure({ ...adventureProps, completedLessonIds: ["anc-0"] });
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-1").props.disabled, false);
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-2").props.disabled, true);
tree = adventure({ ...adventureProps, progressLoaded: false });
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-0").props.disabled, true);
console.log("Game Home + Adventure Path headless contracts passed. Native layout and touch QA still required.");
