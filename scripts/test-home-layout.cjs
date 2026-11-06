/* Headless contracts for the compact Home dashboard and subcategory adventure map.
 * These checks do not replace native Android/iOS layout testing. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = path.join(__dirname, "..");
// Emulate Expo's development-only EXPO_PUBLIC inline substitution in the
// headless renderer. This lets the contract exercise all three A/B modes.
const atlasTestEnv = {};
const jsx = (type, props) => ({ type, props });
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  ActivityIndicator: "Spinner", useWindowDimensions: () => ({ width: 360, height: 740 }),
  Platform: { OS: "ios" },
  StyleSheet: { create: value => value },
};
const svg = {
  __esModule: true, default: "svg", Circle: "circle", Path: "path",
  Defs: "defs", G: "g", Ellipse: "ellipse", LinearGradient: "linearGradient",
  Rect: "rect", Stop: "stop", Text: "text",
};
let showList = false;
let homeScrollState = null;
let homeScrollHookIndex = 0;
const react = {
  useMemo: fn => fn(),
  useRef: initial => ({ current: initial }),
  useEffect: () => {},
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
const adventureAnimationCalls = [];
const adventureCancelCalls = [];
const reanimated = {
  __esModule: true,
  default: { ScrollView: "ScrollView" },
  Easing: { inOut: easing => easing, cubic: t => t },
  useAnimatedRef: () => ({ current: {} }),
  useSharedValue: initial => ({ value: initial }),
  useAnimatedReaction: () => {},
  scrollTo: () => {},
  withTiming: (target, config) => {
    adventureAnimationCalls.push({ target, duration: config.duration });
    return target;
  },
  cancelAnimation: value => adventureCancelCalls.push(value),
};
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];

function compile(file, extra = {}, returnModule = false, globals = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const imports = {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "../utils/screenLayout": { availableScreenHeight: (viewport, window) => viewport > 0 ? viewport : Math.max(0, window - 130) },
    "react-native": native, "react-native-svg": svg,
    "react-native-reanimated": reanimated,
    // The shared FantasyMap is compiled in isolation here; map-only motion
    // is tested separately in test-category-atlas.cjs.
    "./CategoryAtlasMotion": {
      AtlasAtmosphereBreath: "AtlasAtmosphereBreath",
      AtlasTwinkleStar: "AtlasTwinkleStar",
      AtlasDestinationFeedback: "AtlasDestinationFeedback",
    },
    "../theme": { colors: {
      accent: "#A89BFF", accentLight: "#B1A5FF", borderStrong: "#34304E", surface: "#151928",
      textMuted: "#ABB0C1", success: "#3CC69A", successSurface: "#17372F",
    } },
    ...extra,
  };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    __DEV__: true, process: { env: atlasTestEnv }, ...globals,
    require: id => { if (id in imports) return imports[id]; throw Error("Missing stub " + id); },
  });
  return returnModule ? mod.exports : mod.exports.default;
}

const categories = [
  ["history", "Ιστορία", "🏛️"], ["science", "Επιστήμη & Διάστημα", "🚀"],
  ["nature", "Φύση & Ζώα", "🌿"], ["technology", "Τεχνολογία", "⚡"],
  ["culture", "Τέχνες & Πολιτισμός", "🎨"], ["geography", "Γεωγραφία & Κοινωνία", "🌍"],
  ["difficult-history", "Ταμπού της Ιστορίας", "🕯️"],
].map(([id, title, emoji]) => ({ id, title, emoji }));
const subcategories = [
  { id: "ancient-greece", categoryId: "history", title: "Αρχαία Ελλάδα" },
  { id: "space", categoryId: "science", title: "Αστρονομία & Διάστημα" },
];
const lessons = categories.map((category, index) => ({
  id: String(index), categoryId: category.id, title: "Μάθημα " + index,
  subcategoryId: index === 1 ? "space" : "ancient-greece", questions: [], sources: [],
}));
const actions = [];
let profile = { ready: true, profile: { level: 3, earned: 150, required: 600 } };
const completeDailyAnswers = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [String(i), i % 4]));
let daily = { ready: true, doc: { days: { "2026-11-03": {
  record: { completed: true, started: true, currentIndex: 6, answers: completeDailyAnswers },
} } } };
const HistoryWorldIcon = compile("src/components/worldIcons/HistoryWorldIcon.tsx");
const otherWorlds = compile("src/components/worldIcons/OtherWorldIcons.tsx", {}, true);
const categoryIconModule = compile("src/components/worldIcons/categoryIconMap.ts", {
  "./HistoryWorldIcon": { __esModule: true, default: HistoryWorldIcon },
  "./OtherWorldIcons": otherWorlds,
}, true);
const worldArtwork = categoryIconModule.categoryWorldIcons;
assert.equal(Object.keys(worldArtwork).length, 7, "exactly seven shared world icons");
for (const [id, Component] of Object.entries(worldArtwork)) {
  assert.equal(categoryIconModule.getCategoryWorldIcon(id), Component,
    "shared category map resolves " + id);
}
assert.equal(categoryIconModule.getCategoryWorldIcon("unknown"), undefined,
  "unknown worlds preserve their original fallback");
// Compile the streak badge separately to verify its daily-quiz semantics.
const HomeStreakBadge = compile("src/components/HomeStreakBadge.tsx");
const landmarkImports = Object.fromEntries(["ancient-greece", "world-history", "mythology"].map(id =>
  ["../../assets/atlas-export-preview/island-icons/" + id + ".webp", id]));
const backdrop = compile("src/components/HomeLessonBackdrop.tsx", {
  "expo-image": { Image: "Image" }, ...landmarkImports,
});
for (const id of ["ancient-greece", "world-history", "mythology", "space", undefined]) {
  const decoration = backdrop({ subcategoryId: id });
  assert.equal(decoration.props.pointerEvents, "none");
  assert.equal(decoration.props.importantForAccessibility, "no-hide-descendants");
  const artwork = nodes(decoration).find(node => node.props?.testID === "home-lesson-landmark");
  if (["ancient-greece", "world-history", "mythology"].includes(id)) {
    assert.equal(artwork.props.source, id, "landmark matches the selected destination");
    assert.equal(artwork.props.style[0].width, 104, "the Continue landmark retains its base silhouette");
    assert.equal(artwork.props.style[0].height, 84);
    assert.equal(artwork.props.style[0].right, 12);
    assert.equal(artwork.props.style[0].top, 12);
    assert.equal(artwork.props.style[1].width, 104, "default icon scale stays 1");
    assert.equal(artwork.props.style[1].height, 84);
    assert.ok(fs.existsSync(path.join(root, "assets/atlas-export-preview/island-icons/" + id + ".webp")));
  } else assert.equal(artwork, undefined, "unknown destinations never show an unrelated landmark");
}
const home = compile("src/screens/HomeScreen.tsx", {
  "../components/worldIcons/categoryIconMap": categoryIconModule,
  "../components/HomeAtlasBackground": { __esModule: true, default: "HomeAtlasBackground" },
  "../components/HomeLessonBackdrop": { __esModule: true, default: "HomeLessonBackdrop" },
  "../components/HomeStreakBadge": { __esModule: true, default: HomeStreakBadge },
  "../components/HomeMotion": {
    MotionView: "View", MotionPressable: "Pressable", MotionIcon: "View",
    MotionCounter: "Text", MotionXpCircle: "circle", MotionShimmer: "View",
    MotionHeroAccent: "HeroAccent",
  },
  "../data/questions": { DAILY_CHALLENGE_SIZE: 7 },
  "../hooks/useKnowledgeProfile": { useKnowledgeProfile: () => profile },
  "../hooks/useAthensDate": { useAthensDate: () => "2026-11-03" },
  "../state/LearningSession": { useDailySnapshot: () => daily },
  "../utils/dailySyncDocument": { dailyHistory: () => ["today", "yesterday"] },
  "../utils/progressStats": { calculateDailyChallengeProgress: () => ({ currentStreak: 2 }) },
});
const props = {
  categories, subcategories, featuredLesson: lessons[1], progressLoaded: true,
  completedCount: 1, savedCount: 2,
  inProgressLesson: lessons[0], inProgressAnsweredCount: 1, inProgressQuestionCount: 3,
  onResumeLesson: id => actions.push("resume:" + id),
  onOpenLesson: id => actions.push("lesson:" + id),
  onOpenCategory: id => actions.push("category:" + id),
  onStartDailyChallenge: () => actions.push("daily"),
  onOpenQuickQuiz: () => actions.push("quick-quiz"),
  onOpenProfile: () => actions.push("profile"),
};
let tree = home(props);
assert.ok(nodes(tree).some(node => node.props?.testID === "home-game-dashboard"));
assert.equal(nodes(tree).filter(node => node.type === "HomeAtlasBackground").length, 1,
  "one fixed atlas sits behind the Home dashboard");
assert.equal(tree.props.testID, "home-atlas-screen",
  "Home's atlas owns the viewport, not an individual dashboard card");
assert.equal(tree.props.children[0].type, "HomeAtlasBackground",
  "static atlas renders before the scrollable content");
assert.equal(tree.props.children[1].props.testID, "home-game-dashboard",
  "the existing dashboard scroll container stays intact");
assert.equal(tree.props.children[0].props.showAmbientMotion, true,
  "the default Home presentation retains all ambient effects");
atlasTestEnv.EXPO_PUBLIC_GNOSI_HOME_ATLAS_MODE = "static";
const staticHomeTree = home(props);
assert.equal(staticHomeTree.props.children[0].type, "HomeAtlasBackground");
assert.equal(staticHomeTree.props.children[0].props.showAmbientMotion, false,
  "static diagnostic mode removes only the ambient motion");
assert.equal(staticHomeTree.props.children[1].props.testID, "home-game-dashboard");
atlasTestEnv.EXPO_PUBLIC_GNOSI_HOME_ATLAS_MODE = "off";
const plainHomeTree = home(props);
assert.equal(plainHomeTree.props.children[0], null,
  "off diagnostic mode excludes the entire background");
assert.equal(plainHomeTree.props.children[1].props.testID, "home-game-dashboard",
  "dashboard navigation and layout remain mounted in all modes");
atlasTestEnv.EXPO_PUBLIC_GNOSI_HOME_ATLAS_MODE = undefined;

const homeEntranceOrder = [
  [0, "topBar"], [60, "home-primary-action"], [130, "actions"],
  [200, "home-exploration"],
];
const entranceSource = fs.readFileSync(
  path.join(root, "src/screens/HomeScreen.tsx"), "utf8");
for (const [delay, section] of homeEntranceOrder) {
  const expected = section === "topBar" ? `<MotionView entranceDelay={${delay}} style={styles.topBar}`
    : section === "home-primary-action" ? `<MotionPressable entranceDelay={${delay}} testID="home-primary-action"`
    : section === "actions" ? `<MotionView entranceDelay={${delay}} style={styles.actions}`
    : `<MotionView entranceDelay={${delay}} testID="${section}"`;
  assert.ok(entranceSource.includes(expected),
    `Home entrance order must preserve the established ${section} delay of ${delay} ms`);
}

assert.ok(!nodes(tree).some(node => node.type === "FantasyMap" || node.props?.children === "Πού θα ταξιδέψεις;"));
const press = (id, value = tree) => {
  const target = nodes(value).find(node => node.props?.testID === id);
  assert.ok(target, id + " must exist");
  target.props.onPress();
  return target;
};
press("home-primary-action");
press("home-daily-quiz");
press("home-quick-quiz");
press("home-level-profile");
assert.equal(nodes(tree).find(node => node.props?.testID === "home-level-profile").props.style.borderWidth,
  undefined, "level badge has no duplicate native border outside its SVG ring");
assert.deepEqual(actions, ["resume:0", "daily", "quick-quiz", "profile"]);
const ring = nodes(tree).find(node => node.props?.testID === "home-xp-ring");
assert.ok(Math.abs(Number(ring.props.strokeDasharray.split(" ")[0]) - 2 * Math.PI * 21 * .25) < 0.01);
assert.equal(nodes(tree).find(node => node.props?.testID === "home-level").props.children, 3);
const levelBadge = nodes(tree).find(node => node.props?.testID === "home-level-profile");
assert.equal(levelBadge.props.style.width, 50, "level ring retains a compact 50pt footprint");
assert.ok(!nodes(levelBadge).some(node => node.props?.children === "Επίπεδο"),
  "level caption is not displayed beside the ring");
assert.match(levelBadge.props.accessibilityLabel, /Επίπεδο 3/,
  "the level remains understandable to screen readers");
assert.equal(nodes(tree).filter(node => node.props?.testID?.startsWith("home-category-")).length, 7);
press("home-category-history");
assert.equal(actions.at(-1), "category:history");
const textById = (id, t = tree) => nodes(t).find(node => node.props?.testID === id);
assert.equal(textById("home-hero-location").props.children, "Ιστορία · Αρχαία Ελλάδα",
  "continue card shows real category and subcategory titles");
assert.match(textById("home-primary-action").props.accessibilityLabel, /Ιστορία · Αρχαία Ελλάδα/);
assert.equal(nodes(textById("home-primary-action")).find(node => node.type === "HomeLessonBackdrop")
  .props.subcategoryId, "ancient-greece", "hero decoration follows the actual lesson destination");
const longLessonTitle = "Πελοποννησιακός Πόλεμος: φόβος, επιλογές και εξάντληση";
const longTitleTree = home({ ...props, inProgressLesson: { ...lessons[0], title: longLessonTitle } });
assert.equal(nodes(longTitleTree).find(node => node.props?.children === longLessonTitle)
  .props.numberOfLines, undefined, "long lesson titles wrap instead of losing their ending");
const nextLessonTree = home({ ...props, inProgressLesson: null, completedCount: 39 });
assert.ok(!nodes(nextLessonTree).some(node => typeof node.props?.children === "string"
  && node.props.children.includes("39 ολοκληρωμένα")), "unrelated completion totals are absent");
assert.equal(nodes(textById("home-primary-action")).filter(node => node.type === "HeroAccent").length, 0,
  "Continue has one border, with no duplicate animated rim");
assert.equal(textById("home-primary-action").props.style({ pressed: false })[0].borderColor, "#595375",
  "Continue uses a single restrained border");
const filledSegments = () => nodes(tree).filter(node => node.props?.testID === "home-daily-segment-filled").length;
const emptySegments = () => nodes(tree).filter(node => node.props?.testID === "home-daily-segment-empty").length;
assert.equal(filledSegments(), 7, "completed daily quiz fills every segment");
assert.equal(emptySegments(), 0);
assert.equal(textById("home-daily-answered").props.children, "7/7",
  "completed daily quiz shows seven answered questions");
assert.equal(textById("home-daily-answered").props.style[1].fontSize, 18,
  "daily answer count leaves room for progress segments");
assert.equal(textById("home-daily-quiz").props.accessibilityLabel.includes("7 από 7"), true);
assert.equal(textById("home-daily-quiz").props.style({ pressed: false })[0].minHeight, 96,
  "daily card keeps its current compact footprint");
// Every known world keeps its bespoke art and navigation, with a larger
// illustration inside a lightweight circular platform.
const HistoryCard = nodes(tree).find(node => node.props?.testID === "home-category-history");
assert.equal(Object.keys(worldArtwork).length, 7);
for (const category of categories) {
  const card = nodes(tree).find(node => node.props?.testID === "home-category-" + category.id);
  assert.equal(card.props.accessibilityRole, "button");
  assert.match(card.props.accessibilityLabel, /Άνοιξε τη θεματική/);
  assert.equal(card.props.style({ pressed: false })[0].minHeight, 96);
  assert.ok(!nodes(card).some(node => node.props?.children === category.emoji),
    "custom art replaces emoji for " + category.id);
  const illustrationType = worldArtwork[category.id];
  assert.equal(typeof illustrationType, "function", "component exists for " + category.id);
  const illustrationNode = nodes(card).find(node => node.type === illustrationType);
  assert.ok(illustrationNode, "card uses bespoke art for " + category.id);
  assert.equal(illustrationNode.props.size, 46);
  assert.equal(illustrationNode.props.displayScale, 1.18);
  const illustration = illustrationType({ size: 32, displayScale: 1.18 });
  assert.equal(illustration.type, "svg");
  assert.equal(illustration.props.width, 32);
  assert.equal(illustration.props.height, 32);
  assert.equal(illustration.props.viewBox, "0 0 52 52");
  assert.equal(illustration.props.accessible, false, "illustration is decorative");
  assert.equal(illustration.props.pointerEvents, "none", "card owns touch");
  assert.equal(illustration.props.style.transform[0].scale, 1.18);
  assert.ok(nodes(illustration).filter(node => node.type === "path").length >= 5,
    "custom engraving includes layered paths for " + category.id);
  assert.ok(nodes(illustration).filter(node => node.type === "linearGradient").length >= 2,
    "artwork includes shaded materials for " + category.id);
  card.props.onPress();
  assert.equal(actions.at(-1), "category:" + category.id, "category navigation unchanged");
}
// Icon-specific regressions: geometry, textures and motifs must remain distinct.
// All seven still share the layout, navigation and accessibility tests above.
const drawn = id => nodes(worldArtwork[id]({ size: 32, displayScale: 1.18 }));
const gradientIds = id => drawn(id).filter(node => node.type === "linearGradient")
  .map(node => node.props.id);
const historyArt = drawn("history");
assert.ok(gradientIds("history").includes("history-pyramid-sunlit"), "limestone gradient present");
assert.ok(gradientIds("history").includes("history-pyramid-shaded"), "shadow gradient present");
assert.ok(historyArt.some(node => node.type === "path" && node.props.fill === "url(#history-pyramid-sunlit)"
  && node.props.d.includes("27 4.8")), "sunlit triangle reaches pyramid apex");
assert.ok(historyArt.some(node => node.type === "path" && node.props.fill === "url(#history-pyramid-shaded)"
  && node.props.d.includes("27 4.8")), "shaded triangle reaches pyramid apex");
assert.ok(historyArt.filter(node => node.type === "circle").length >= 5, "mineral weathering remains");
assert.ok(historyArt.filter(node => node.type === "path").length >= 18, "pyramid masonry is detailed");
const mothArt = drawn("nature");
assert.ok(mothArt.some(node => node.type === "g"
  && node.props.transform === "translate(52 0) scale(-1 1)"),
  "nature wings are geometrically mirrored around the body");
assert.ok(gradientIds("nature").includes("nature-moth-forewing"));
assert.ok(gradientIds("nature").includes("nature-moth-hindwing"));
assert.ok(mothArt.filter(node => node.type === "ellipse").length >= 4,
  "moth has paired, engraved eyespots");
assert.ok(mothArt.filter(node => node.type === "path").length >= 16,
  "moth has detailed naturalistic wing patterns");

const painting = drawn("culture");
assert.ok(gradientIds("culture").includes("culture-night-sky"),
  "the Arts icon depicts an original night sky");
assert.ok(gradientIds("culture").includes("culture-frame-gold"),
  "the painting keeps a gilded perspective frame");
assert.ok(painting.filter(node => node.type === "circle").length >= 4,
  "moon and constellation stars are present");
assert.ok(painting.filter(node => node.type === "path").length >= 12,
  "painting has its own sky, seascape and wood bevel geometry");

const archive = drawn("difficult-history");
assert.ok(gradientIds("difficult-history").includes("difficult-history-folder"));
assert.ok(gradientIds("difficult-history").includes("difficult-history-paper"));
assert.ok(archive.some(node => node.type === "g"
  && node.props.transform === "rotate(-11 31 34)"),
  "classification stamp remains angled on archival folder");
assert.ok(archive.some(node => node.type === "rect"
  && node.props.stroke === "#A45E59"),
  "classification stamp remains a muted oxide red");
assert.ok(archive.filter(node => node.type === "path").length >= 11,
  "document layers and folded folder remain dimensional");

// These three landmarks are deliberately out of scope for the redesign.
for (const [id, material] of [
  ["science", "science-brass"], ["technology", "technology-chip"],
  ["geography", "geography-sea"],
]) {
  assert.ok(gradientIds(id).includes(material), id + " retains its existing identity");
}

const futureCategory = { id: "future-world", title: "Νέος κόσμος", emoji: "🌟" };
const futureTree = home({ ...props, categories: [...categories, futureCategory] });
const futureCard = nodes(futureTree).find(node => node.props?.testID === "home-category-future-world");
assert.ok(nodes(futureCard).some(node => node.props?.children === "🌟"),
  "new/unknown categories safely fall back to their emoji");
futureCard.props.onPress();
assert.equal(actions.at(-1), "category:future-world");
const streakSlot = nodes(tree).find(node => node.type === HomeStreakBadge);
assert.ok(streakSlot, "Home uses the compact daily streak badge");
assert.equal(streakSlot.props.streak, 2,
  "the badge receives the existing daily quiz streak");
const renderedStreak = HomeStreakBadge({ streak: streakSlot.props.streak });
assert.match(renderedStreak.props.accessibilityLabel, /καθημερινού quiz/);
assert.equal(renderedStreak.props.testID, "home-quiz-streak");
assert.equal(nodes(renderedStreak).find(node => node.props?.testID === "home-streak-count").props.children, 2);
assert.equal(nodes(renderedStreak).filter(node => node.type === "circle").length, 0,
  "a daily streak does not imply a percentage of completion");
assert.equal(nodes(renderedStreak).filter(node => node.type === "path").length, 2,
  "the compact streak has flame artwork");
assert.equal(renderedStreak.props.children[0].type, "svg",
  "the flame appears first in the compact horizontal streak badge");
assert.equal(renderedStreak.props.children[1].props.testID, "home-streak-count",
  "the streak number is directly beside the flame");
for (const streak of [1, 2, null]) {
  const badge = HomeStreakBadge({ streak });
  assert.equal(nodes(badge).filter(node => node.type === "Text").length, 1,
    "the streak badge shows only the number, without a day caption");
}
const loadingStreak = HomeStreakBadge({ streak: null });
assert.match(loadingStreak.props.accessibilityLabel, /Φόρτωση/);
assert.equal(nodes(loadingStreak).find(node => node.props?.testID === "home-streak-count").props.children, "—");
assert.ok(nodes(tree).some(node => node.props?.children === "Ολοκληρώθηκε ✓"));
// The counter is the number of submitted answers, not the current index,
// correct answers, or a streak. It is scoped to today's Athens daily record.
daily = { ready: true, doc: { days: { "2026-11-03": {
  record: { completed: false, started: true, currentIndex: 2, answers: { "0": 2, "1": 0, "2": 1 } },
} } } };
tree = home(props);
assert.equal(textById("home-daily-answered").props.children, "3/7");
assert.equal(filledSegments(), 3, "one segment fills for each answer submitted today");
assert.equal(emptySegments(), 4);
assert.ok(nodes(tree).some(node => node.props?.children === "Συνέχισε σήμερα"));
assert.match(textById("home-daily-quiz").props.accessibilityLabel, /3 από 7/);
daily = { ready: true, doc: { days: { "2026-11-02": {
  record: { completed: true, answers: completeDailyAnswers },
} } } };
tree = home(props);
assert.equal(filledSegments(), 0, "yesterday’s progress does not fill today’s segments");
assert.equal(textById("home-daily-answered").props.children, "0/7",
  "yesterday's completed quiz does not count towards today's progress");
assert.ok(nodes(tree).some(node => node.props?.children === "Ξεκίνα σήμερα"));
daily = { ready: false, doc: { days: {} } };
tree = home(props);
assert.equal(filledSegments(), 0, "loading state must not claim completed segments");
assert.equal(textById("home-daily-answered").props.children, "—/7",
  "unknown loading progress must not appear as zero");
assert.match(textById("home-daily-quiz").props.accessibilityLabel, /φόρτωση προόδου/);
daily = { ready: true, doc: { days: { "2026-11-03": {
  record: { completed: true, started: true, currentIndex: 6, answers: completeDailyAnswers },
} } } };
tree = home(props);
assert.equal(nodes(tree).filter(node => node.props?.accessibilityLabel?.includes("Αναζήτηση")).length, 0);
// Unavailable games no longer consume space or expose dead actions.
assert.equal(nodes(tree).filter(node => node.props?.testID?.startsWith("home-mini-game")).length, 0);
assert.ok(!nodes(tree).some(node => node.props?.children === "Σύντομα"));
assert.ok(!nodes(tree).some(node => node.props?.children === "7 κόσμοι"));

// The Home chart now uses a cached WebP instead of a full-screen live SVG.
// Verify immediate static artwork, viewport-driven ambient overlays and no
// remounting/late reveal when the measured size changes.
let atlasSize = { width: 0, height: 0 };
const atlas = compile("src/components/HomeAtlasBackground.tsx", {
  react: {
    memo: component => component,
    useState: initial => [atlasSize ?? initial, next => {
      atlasSize = typeof next === "function" ? next(atlasSize) : next;
    }],
  },
  "expo-image": { Image: "Image" },
  "../../assets/atlas-export-preview/home.webp": "home.webp",
  "./HomeAtlasMotion": {
    HomeAtlasAmbientGlow: "HomeAtlasAmbientGlow",
    HomeAtlasTwinkles: "HomeAtlasTwinkles",
  },
});
let atlasTree = atlas();
assert.equal(atlasTree.props.testID, "home-atlas-background");
assert.equal(atlasTree.props.pointerEvents, "none", "atlas cannot intercept card taps");
assert.equal(atlasTree.props.accessible, false, "decorative atlas stays out of the accessibility tree");
let atlasImage = nodes(atlasTree).find(node => node.type === "Image");
assert.ok(atlasImage, "static chart is mounted without waiting for viewport measurement");
assert.equal(atlasImage.props.source, "home.webp");
assert.equal(atlasImage.props.contentFit, "fill");
assert.equal(atlasImage.props.transition, 0, "static artwork must not fade in after cards");
assert.equal(atlasImage.props.cachePolicy, "memory-disk");
assert.equal(nodes(atlasTree).filter(node => node.type === "HomeAtlasAmbientGlow").length, 0,
  "ambient overlay waits until measurement");
atlasTree.props.onLayout({ nativeEvent: { layout: { width: 390, height: 844 } } });
atlasTree = atlas();
atlasImage = nodes(atlasTree).find(node => node.type === "Image");
assert.equal(nodes(atlasTree).filter(node => node.type === "Image").length, 1,
  "measured screen retains one static chart image");
assert.equal(nodes(atlasTree).filter(node => node.type === "HomeAtlasReveal").length, 0,
  "background has no deferred reveal layer");
assert.equal(nodes(atlasTree).filter(node => node.type === "HomeAtlasAmbientGlow").length, 1,
  "one small compositor-friendly atmosphere overlay is animated");
assert.equal(nodes(atlasTree).filter(node => node.type === "HomeAtlasTwinkles").length, 1,
  "star twinkles are isolated from static artwork");
const motionlessAtlas = atlas({ showAmbientMotion: false });
assert.equal(nodes(motionlessAtlas).filter(node => node.type === "Image").length, 1,
  "static mode retains the bundled atlas artwork");
assert.equal(nodes(motionlessAtlas).filter(node => node.type === "HomeAtlasAmbientGlow").length, 0,
  "static diagnostic mode mounts no ambient glow");
assert.equal(nodes(motionlessAtlas).filter(node => node.type === "HomeAtlasTwinkles").length, 0,
  "static diagnostic mode mounts no twinkles");
atlasTree.props.onLayout({ nativeEvent: { layout: { width: 844, height: 390 } } });
atlasTree = atlas();
assert.equal(nodes(atlasTree).filter(node => node.type === "Image").length, 1,
  "landscape rotation reuses a single cached background image");
assert.equal(nodes(atlasTree).find(node => node.type === "HomeAtlasAmbientGlow").props.width, 844);
assert.equal(nodes(atlasTree).find(node => node.type === "HomeAtlasAmbientGlow").props.height, 390);
const staticAtlasSource = fs.readFileSync(
  path.join(root, "src/components/HomeAtlasBackground.tsx"), "utf8");
assert.ok(!/withRepeat\(|withTiming\(|useSharedValue\(|setInterval\(/.test(staticAtlasSource),
  "all time-based motion stays isolated outside the static chart");
assert.match(staticAtlasSource, /memo\(HomeAtlasBackground\)/,
  "dashboard updates should not redraw the atlas");
assert.match(staticAtlasSource, /absoluteFill/,
  "atlas stays fixed outside the scrollable dashboard");
assert.doesNotMatch(staticAtlasSource, /setTimeout|setInterval|HomeAtlasReveal|atlasReady/,
  "Home background mounts directly without deferred work");

// Verify reduced motion without a simulator: the new effects animate only
// native view opacity and do not animate any SVG property on each frame.
let homeAmbientReduced = true;
let homeAmbientLoops = 0;
const atlasMotion = compile("src/components/HomeAtlasMotion.tsx", {
  react: { useEffect: fn => fn() },
  "react-native-reanimated": {
    __esModule: true,
    default: { View: "AnimatedView" },
    Easing: { sin: x => x, cubic: x => x, inOut: fn => fn, out: fn => fn },
    useReducedMotion: () => homeAmbientReduced,
    useSharedValue: initial => ({ value: initial }),
    useAnimatedStyle: fn => fn(),
    cancelAnimation: () => {},
    withDelay: (_delay, result) => result,
    withSequence: (...values) => values.at(-1),
    withRepeat: result => { homeAmbientLoops++; return result; },
    withTiming: value => value,
  },
  "react-native-svg": { ...svg, RadialGradient: "radialGradient", Ellipse: "ellipse" },
}, true);
assert.equal(atlasMotion.HomeAtlasReveal, undefined,
  "the late full-screen fade was removed; only ambient motion remains");
const glow = atlasMotion.HomeAtlasAmbientGlow({ width: 390, height: 844 });
assert.equal(glow.type, "AnimatedView");
assert.equal(glow.props.testID, "home-atlas-motion-glow");
assert.equal(glow.props.pointerEvents, "none");
assert.equal(glow.props.accessible, false);
assert.equal(glow.props.style[2].opacity, 0.065);
assert.equal(nodes(glow).filter(node => node.type === "ellipse").length, 1,
  "the glow's geometry stays static inside a separately composited view");
const skyTwinkles = atlasMotion.HomeAtlasTwinkles({ width: 390, height: 844 });
assert.equal(skyTwinkles.props.pointerEvents, "none");
const starNodes = [skyTwinkles.props.children].flat(Infinity);
assert.equal(starNodes.length, 4, "at most four small stars twinkle");
for (const node of starNodes) {
  const dot = node.type(node.props);
  assert.equal(dot.type, "AnimatedView");
  assert.equal(dot.props.pointerEvents, "none");
  assert.equal(dot.props.accessible, false);
  assert.equal(dot.props.style[2].opacity, 0.17);
  assert.equal(dot.props.style[0].width, 3,
    "stars are tiny composited views, not animated SVG nodes");
}
assert.equal(homeAmbientLoops, 0, "reduce motion prevents every infinite loop");
homeAmbientReduced = false;
atlasMotion.HomeAtlasAmbientGlow({ width: 390, height: 844 });
for (const node of starNodes) node.type(node.props);
assert.equal(homeAmbientLoops, 5,
  "only one view-based glow and four tiny stars loop during normal motion");
const nativeMotionSource = fs.readFileSync(
  path.join(root, "src/components/HomeAtlasMotion.tsx"), "utf8");
assert.ok(!/useAnimatedProps|Animated\.createAnimatedComponent|strokeDashoffset/.test(nativeMotionSource),
  "no background SVG property is animated on the UI thread");
assert.match(nativeMotionSource, /useReducedMotion/,
  "ambient animations always respect reduced motion");
const homeMotionSourceCheck = fs.readFileSync(
  path.join(root, "src/components/HomeMotion.tsx"), "utf8");
assert.match(homeMotionSourceCheck, /export function MotionShimmer/,
  "the original Continue button shimmer remains installed");
assert.match(homeMotionSourceCheck, /withTiming\(width \+ 42/,
  "the Continue shimmer's original animation has not been changed");

// Responsive density follows the available Home height after safe areas and tabs.
homeScrollState = [0, 0];
const renderMeasuredHome = () => { homeScrollHookIndex = 0; return home(props); };
const scrollNode = () => nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-game-dashboard");
let scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[0].flexGrow, 1,
  "dashboard content fills the usable viewport on taller screens");
assert.equal(scroll.props.contentContainerStyle[0].justifyContent, "flex-start",
  "spare height belongs inside the playable cards rather than between sections");
assert.equal(scroll.props.contentContainerStyle[0].gap, 12,
  "spacious Home retains comfortable minimum spacing");
const homeSections = [scroll.props.children].flat(Infinity).filter(Boolean);
assert.equal(homeSections.length, 4, "four actionable Home sections share the available height");
assert.equal(homeSections.at(-1).props.testID, "home-exploration",
  "knowledge worlds end the dashboard");

assert.equal(homeSections[0].props.style.minHeight, 52,
  "the brand/header stays at its original height");
assert.equal(homeSections[1].props.style({ pressed: false })[0].flexGrow, 2,
  "the lesson card absorbs two shares of extra height");
assert.equal(homeSections[1].props.style({ pressed: false })[0].justifyContent, "center",
  "the lesson elements are centered vertically as a group");
assert.equal(homeSections[2].props.style.flexGrow, 1,
  "the two side-by-side quiz cards share the remaining extra height");
for (const id of ["home-daily-quiz", "home-quick-quiz"]) {
  const quiz = nodes(homeSections[2]).find(node => node.props?.testID === id);
  assert.equal(quiz.props.style({ pressed: false })[0].justifyContent, "center",
    "expanded quiz elements are centered vertically as a group");
  assert.equal(quiz.props.style({ pressed: false })[0].flex, 1,
    "both quizzes stretch to the same height");
}
assert.equal(homeSections[3].props.style[0].flexGrow, undefined,
  "knowledge worlds stay at their natural height");
const flexibleWorldGrid = nodes(homeSections[3]).find(node =>
  Array.isArray(node.props?.style) && node.props.style[0]?.flexWrap === "wrap");
assert.ok(flexibleWorldGrid, "knowledge-world cards stay in the existing grid");
assert.equal(flexibleWorldGrid.props.style[0].alignContent, "flex-start",
  "category rows sit directly below the heading");
assert.equal(flexibleWorldGrid.props.style[0].flexGrow, undefined,
  "the grid cannot stretch into unused viewport space");
assert.equal(flexibleWorldGrid.props.style[0].rowGap, 8,
  "world-row margins stay fixed");

assert.equal(scroll.props.scrollEnabled, false, "disable scrolling before measurements settle");
assert.equal(scroll.props.bounces, false, "disable iOS elastic bounce");
assert.equal(scroll.props.alwaysBounceVertical, false);
assert.equal(scroll.props.overScrollMode, "never", "disable Android overscroll glow");
scroll.props.onLayout({ nativeEvent: { layout: { height: 705 } } });
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[1].gap, 8,
  "shorter usable viewport uses compact gaps without hiding genuine overflow");
assert.equal(scroll.props.contentContainerStyle[1].paddingTop, 4);
assert.equal(scroll.props.contentContainerStyle[1].paddingBottom, 4);
assert.equal(scroll.props.contentContainerStyle[2], false);
// The larger illustrations and card silhouettes stay exactly the same.
// Small inner spacings, not clipping/scroll disabling, recover the few points
// consumed when the new two-row world atlas and lesson breadcrumb were added.
const compactTree = renderMeasuredHome();
const compactWorlds = nodes(compactTree).find(node => node.props?.testID === "home-exploration");
assert.equal(compactWorlds.props.style[1].gap, 5);
assert.equal(compactWorlds.props.style[1].paddingTop, 4);
const compactTile = nodes(compactTree).find(node => node.props?.testID === "home-category-history");
assert.equal(compactTile.props.style({ pressed: false })[1].paddingVertical, 4);
assert.equal(compactTile.props.style({ pressed: false })[1].gap, 4);
const originalPlatform = nodes(compactTile).find(node =>
  Array.isArray(node.props?.style) && node.props.style[0]?.width === 62);
assert.ok(originalPlatform, "compact Home preserves the 62pt circular category illustration");
assert.equal(originalPlatform.props.style[0].height, 62);
const savedCompactHeight =
  3 * (10 - 8) + (6 - 4) + (6 - 4) +
  2 * (2 * (6 - 4) + (7 - 4)) + (6 - 5) + (6 - 4);
assert.ok(savedCompactHeight >= 24,
  "compact spacing reclaims a small vertical overflow without shrinking or clipping artwork");
scroll.props.onContentSizeChange(360, 711);
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[2], false,
  "transient overflow cannot permanently tighten the layout");
assert.equal(scroll.props.scrollEnabled, true, "overflow is scrollable at compact density");
scroll.props.onContentSizeChange(360, 701);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "fitted tight content cannot be scrolled");
scroll.props.onLayout({ nativeEvent: { layout: { height: 790 } } });
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[1], false,
  "available height growth restores spacious styling");
assert.equal(scroll.props.contentContainerStyle[0].justifyContent, "flex-start",
  "spacious mode expands cards without introducing large vertical gaps");
assert.equal(scroll.props.scrollEnabled, false);

// Measure actual card dimensions: increasing height scales the card contents,
// without affecting the knowledge-world grid or viewport density.
const tallTree = renderMeasuredHome();
const tallHero = nodes(tallTree).find(node => node.props?.testID === "home-primary-action");
const tallQuizzes = nodes(tallTree).find(node =>
  node.props?.entranceDelay === 130 && node.props?.style?.flexGrow === 1);
tallHero.props.onLayout({ nativeEvent: { layout: { height: 315 } } });
tallQuizzes.props.onLayout({ nativeEvent: { layout: { height: 165 } } });
const grownTree = renderMeasuredHome();
const grownHero = nodes(grownTree).find(node => node.props?.testID === "home-primary-action");
const heroTitle = nodes(grownHero).find(node =>
  node.props?.children === "Μάθημα 0");
assert.ok(heroTitle.props.style[2].fontSize > 21,
  "longer hero card grows its lesson title instead of adding blank interior space");
const grownBackdrop = nodes(grownHero).find(node => node.type === "HomeLessonBackdrop");
assert.ok(grownBackdrop.props.scale > 1,
  "the lesson landmark grows with its card");
const quizCount = nodes(grownTree).find(node => node.props?.testID === "home-daily-answered");
assert.ok(quizCount.props.style[1].fontSize > 18,
  "taller quiz cards grow their progress counter");
const grownDaily = nodes(grownTree).find(node => node.props?.testID === "home-daily-quiz");
assert.ok(nodes(grownDaily).some(node => node.props?.children === "Καθημερινό Quiz"
  && node.props.style[1].fontSize > 14), "taller quiz cards grow their headings");
// Compact mode must disable the measured growth even after a tall viewport.
scroll.props.onLayout({ nativeEvent: { layout: { height: 705 } } });
const resetTree = renderMeasuredHome();
assert.equal(nodes(resetTree).find(node => node.props?.testID === "home-daily-answered")
  .props.style[1].fontSize, 18);
assert.equal(nodes(resetTree).find(node => node.type === "HomeLessonBackdrop").props.scale, 1);
scroll.props.onLayout({ nativeEvent: { layout: { height: 790 } } });
scroll = scrollNode();
// Small landscape screens and large accessibility text must never be clipped.
scroll.props.onLayout({ nativeEvent: { layout: { height: 560 } } });
scroll.props.onContentSizeChange(360, 680);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, true, "genuine overflow remains scrollable");
scroll.props.onContentSizeChange(360, 554);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "drag turns off when content fits again");

// Preserve the one-point measurement tolerance and resize behavior.
homeScrollState = [0, 0];
scroll = scrollNode();
scroll.props.onLayout({ nativeEvent: { layout: { height: 600 } } });
scroll.props.onContentSizeChange(360, 596);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false);
scroll.props.onContentSizeChange(360, 601);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "ignore subpixel measurement mismatch");
scroll.props.onContentSizeChange(360, 620);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, true);
scroll.props.onLayout({ nativeEvent: { layout: { height: 660 } } });
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "recalculate overflow after viewport resize");
// Cold startup can deliver content measured for an older viewport first.
// Its settled layout must match a fresh visit with the same available height.
homeScrollState = [0, 0];
scroll = scrollNode();
scroll.props.onContentSizeChange(360, 820);
scroll = scrollNode();
scroll.props.onLayout({ nativeEvent: { layout: { height: 705 } } });
scroll = scrollNode();
scroll.props.onContentSizeChange(360, 705);
const coldLayout = scrollNode().props.contentContainerStyle;
homeScrollState = [0, 0];
scroll = scrollNode();
scroll.props.onLayout({ nativeEvent: { layout: { height: 705 } } });
scroll = scrollNode();
scroll.props.onContentSizeChange(360, 705);
assert.deepEqual(scrollNode().props.contentContainerStyle, coldLayout,
  "cold startup and returning Home settle to the same layout");
assert.equal(scrollNode().props.scrollEnabled, false);
homeScrollState = null;
assert.ok(nodes(tree).some(node => node.props?.children === "1 / 3 ερωτήσεις"),
  "resume card shows question progress beside its heading");
const centeredGrid = nodes(tree).find(node =>
  Array.isArray(node.props?.style) && node.props.style[0]?.flexWrap === "wrap"
  && node.props.style[0]?.justifyContent === "center");
assert.ok(centeredGrid, "knowledge worlds are centered with equal grid gaps");
assert.equal(centeredGrid.props.style[0].columnGap, 8);
assert.equal(HistoryCard.props.style({ pressed: false })[0].minHeight, 96,
  "History destination has room for larger artwork");
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

// Shared Continue accent behavior.
const homeMotionSource = fs.readFileSync(path.join(root, "src/components/HomeMotion.tsx"), "utf8");
const heroRimSource = homeMotionSource.slice(
  homeMotionSource.indexOf("export function MotionHeroAccent"),
  homeMotionSource.indexOf("const styles ="));
assert.match(heroRimSource, /useReducedMotion/, "Continue accent respects reduced-motion settings");
assert.match(heroRimSource, /pointerEvents="none"/, "Continue accent never takes taps");
assert.doesNotMatch(heroRimSource, /withRepeat\(/,
  "Continue accent is a one-shot highlight rather than another ambient loop");

// The compact bottom navigation preserves all four destinations.
const bottomNav = compile("src/components/BottomNavigation.tsx", {
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
});
const bottomTree = bottomNav({ currentScreen: "home", onNavigate: destination => actions.push("nav:" + destination) });
const tabs = nodes(bottomTree).filter(node => node.props?.accessibilityRole === "tab");
assert.equal(tabs.length, 4);
assert.equal(tabs[0].props.accessibilityState.selected, true);
assert.equal(tabs[1].props.accessibilityState.selected, false);
tabs[1].props.onPress();
assert.equal(actions.at(-1), "nav:progress");
assert.ok(nodes(bottomTree).some(node => Array.isArray(node.props?.style)
  && node.props.style[0]?.minHeight === 60 && node.props.style[1]?.paddingBottom === 34),
  "navigation preserves safe-area inset while remaining compact");

tree = home({ ...props, inProgressLesson: null });
assert.equal(textById("home-hero-location", tree).props.children,
  "Επιστήμη & Διάστημα · Αστρονομία & Διάστημα",
  "the next-lesson card resolves the featured lesson's own destination");
press("home-primary-action", tree);
assert.equal(actions.at(-1), "lesson:1");
tree = home({ ...props, inProgressLesson: null, featuredLesson: null });
assert.equal(textById("home-hero-location", tree), undefined,
  "empty hero should never display a stale category path");
press("home-primary-action", tree);
assert.equal(actions.at(-1), "category:history");
profile = { ready: false, profile: { level: 1, earned: 0, required: 200 } };
tree = home(props);
assert.equal(nodes(tree).find(node => node.props?.testID === "home-level").props.children, "—");
assert.ok(!nodes(tree).some(node => node.props?.testID === "home-xp-ring"));

// Keep the detailed islands accessible on CategoryScreen even though Home is now compact.
const categorySource = fs.readFileSync(path.join(root, "src/screens/CategoryScreen.tsx"), "utf8");
assert.match(categorySource, /<IslandAtlasMap/,
  "the Category screen uses its dedicated native island destinations");
const map = compile("src/components/FantasyMap.tsx");
const mapProps = { regions: categories.map(category => ({ id: category.id, title: category.title, emoji: category.emoji })), overview: true, onSelectRegion: id => actions.push(id) };
const mapTree = map(mapProps);
assert.ok(nodes(mapTree).some(node => node.type === "svg"));
assert.equal(nodes(mapTree).filter(node => node.type === "g" && node.props?.onPress).length, 7);

// Each subcategory has an accessible, ordered series of checkpoints.
const adventureLessons = Array.from({ length: 30 }, (_v, index) => ({
  id: "anc-" + index, subcategoryId: "ancient-greece", title: "Ενότητα " + (index + 1),
}));
const adventureAccess = compile("src/utils/lessonPath.ts", {
  "../data/lessonPaths": compile("src/data/lessonPaths.ts", {}, true),
  "./devLessonAccess": { devLessonsUnlocked: () => false },
}, true);
const adventurePathRules = {
  getSubcategoryPath: catalogue => catalogue,
  getOrderedPathAccess: adventureAccess.getOrderedPathAccess,
};
const continueModule = compile("src/components/AtlasContinueCard.tsx", {
  "./HomeMotion": { MotionPressable: "Pressable" },
}, true);
const atlasContinueStub = { __esModule: true, default: "Pressable",
  atlasContinueStyles: continueModule.atlasContinueStyles };
const adventureModule = compile("src/screens/SubcategoryScreen.tsx", {
  "../utils/lessonPath": adventurePathRules,
  "../utils/devLessonAccess": { devLessonsUnlocked: () => false },
  "../components/AdventureAtlasBackground": { __esModule: true, default: "AtlasBackground" },
  "../components/AtlasContinueCard": atlasContinueStub,
  "../components/AdventureMotion": { AdventureProgressFill: "AdventureProgressFill", AdventureActiveHalo: "AdventureActiveHalo", AdventureContinueAccent: "AdventureContinueAccent", AdventureContinueArrow: "AdventureContinueArrow" },
  "../components/HomeMotion": { MotionView: "View", MotionPressable: "Pressable", MotionIcon: "View", MotionCounter: "Text" },
}, true);
const adventure = adventureModule.default;
// Automatic focus and "Η ΘΕΣΗ ΜΟΥ" now use the same checkpoint offset.
assert.equal(adventureModule.getAdventureCurrentOffset(2800, 4500, 500), 2700,
  "next checkpoint has the same offset whichever navigation initiates it");
assert.equal(adventureModule.getAdventureCurrentOffset(75, 1200, 600), 0,
  "early lessons do not introduce phantom scrolling");
assert.ok(adventureModule.getAdventureScrollDuration(2800) >= 3000,
  "UI-thread map glide must be noticeably slower over long journeys");
assert.ok(adventureModule.getAdventureScrollDuration(2800) <= 5200,
  "entry animation remains reasonably bounded");
assert.equal(adventureModule.getAdventureEntryOffset(2700, 4500, 500), 2588,
  "chapter marker remains visible near the top of the map pane");
assert.equal(adventureModule.getAdventureEntryOffset(500, 1200, 1100), 132,
  "entry offset is clamped on short maps");
assert.equal(adventureModule.getAdventureEntryOffset(75, 1200, 600), 0,
  "chapter I stays near the top");
const adventureProps = {
  category: categories[0], subcategory: { id: "ancient-greece", title: "Αρχαία Ελλάδα", description: "Ιστορικό ταξίδι" },
  lessons: adventureLessons, completedLessonIds: [], inProgressLessonIds: [], progressLoaded: true,
  onBack: () => actions.push("back"), onOpenLesson: id => actions.push("open:" + id),
};
tree = adventure(adventureProps);
assert.ok(nodes(tree).some(node => node.props?.testID === "subcategory-adventure-path"));
const emptyAdventure = nodes(adventure({ ...adventureProps, lessons: [] }));
assert.ok(emptyAdventure.some(node => node.props?.children === "Νέες αποστολές έρχονται"));
assert.ok(!emptyAdventure.some(node => node.props?.testID === "adventure-continue" ||
  node.props?.testID?.startsWith("adventure-node-")), "an empty path renders no destinations");
assert.equal(nodes(tree).filter(node => node.props?.testID?.startsWith("adventure-node-")).length, 30);
assert.equal(nodes(tree).filter(node => node.props?.children?.startsWith?.("ΚΕΦΑΛΑΙΟ ")).length, 5);
const categoryHeader = nodes(tree).find(node => node.props?.testID === "adventure-category-header");
const categoryTitle = nodes(categoryHeader).find(node => node.props?.testID === "adventure-category-title");
assert.equal(categoryTitle.props.children, "ΙΣΤΟΡΙΑ",
  "the global Gnosi logo is replaced with the selected category");
assert.ok(!nodes(tree).some(node => node.props?.children === "ΓΝΩΣΗ"),
  "hide the redundant logo on the adventure screen");
assert.ok(!nodes(tree).some(node => node.props?.children === "Ο ΧΑΡΤΗΣ ΤΗΣ ΔΙΑΔΡΟΜΗΣ"),
  "avoid a second heading that pushes the map below the fold");
assert.ok(!nodes(tree).some(node => node.props?.children === "Ιστορικό ταξίδι"),
  "subcategory description no longer consumes the map viewport");
const compactCard = nodes(tree).find(node => node.props?.testID === "adventure-continue");
const progressInCard = nodes(compactCard).find(node => node.props?.testID === "adventure-progress");
assert.ok(progressInCard, "the only progress track is integrated into the Continue card");
assert.equal(compactCard.props.entranceDelay, 70, "Continue card uses the Home motion entrance");
assert.equal(categoryHeader.props.entranceDelay, 0, "fixed header uses the Home motion entrance");
const motionHeaderIcon = nodes(categoryHeader).find(node => node.props?.index === 0 &&
  nodes(node).some(child => child.props?.children === "✦"));
assert.ok(motionHeaderIcon,
  "the fixed header reuses Home's slow, reduced-motion-aware icon drift");
const progressCount = nodes(compactCard).find(node => node.props?.progressKey === "0/30");
assert.ok(progressCount, "completed-lesson count uses Home's one-shot counter animation");
assert.equal(progressCount.props.children, "0 / 30",
  "progress count retains the visible and accessible original text");
const progressFill = nodes(progressInCard).find(node => node.type === "AdventureProgressFill");
assert.ok(progressFill, "progress fill is animated without changing the accessible track");
assert.equal(progressInCard.props.style.height, 8,
  "compact progress track uses a subtly highlighted 8pt height");
assert.equal(progressInCard.props.style.borderColor, "#62597D",
  "progress track frame remains visibly distinct over the dark card");
assert.equal(nodes(compactCard).filter(node => node.type === "AdventureContinueAccent").length, 1,
  "only an actionable Continue card receives the one-shot perimeter highlight");
assert.equal(nodes(compactCard).filter(node => node.type === "AdventureContinueArrow").length, 1,
  "Continue icon receives a one-shot nudge without changing its tap target");
const pinnedFrame = nodes(tree).find(node => node.props?.testID === "adventure-map-viewport");
assert.equal(pinnedFrame.type, "View",
  "the scrollable adventure map mounts as a static viewport instead of a massive animated surface");
assert.equal(pinnedFrame.props.entranceDelay, undefined,
  "map entrance no longer competes with autoscroll and checkpoint animations");
assert.equal(pinnedFrame.props.style.flex, 1,
  "entrance animation does not change map viewport layout sizing");
assert.equal(pinnedFrame.props.style.marginBottom, 8,
  "atlas viewport leaves a small gap above the fixed bottom navigation");
assert.equal(pinnedFrame.props.style.paddingBottom, undefined,
  "navigation clearance remains outside the atlas and its scroll viewport");
const nestedScroll = nodes(pinnedFrame).find(node => node.props?.testID === "adventure-map-scroll");
assert.ok(nestedScroll, "the map has its own scroll container");
assert.equal(nodes(tree).filter(node => node.type === "ScrollView").length, 1,
  "the header and Continue card are outside the only ScrollView");
assert.ok(!nodes(pinnedFrame).some(node => node.props?.testID === "adventure-continue"),
  "the Continue card never moves with the map");
assert.equal(nestedScroll.props.contentContainerStyle.paddingBottom, 32,
  "map scroll has a little bottom breathing room");
assert.equal(typeof nestedScroll.props.onScrollBeginDrag, "function",
  "user drag can interrupt the entry glide");

assert.equal(nodes(tree).filter(node => node.props?.testID === "adventure-progress").length, 1);
assert.ok(nodes(compactCard).some(node => node.props?.children === "Αρχαία Ελλάδα"),
  "subcategory identity moves into the Continue card");
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-map").props.style[0].marginTop, 2,
  "no oversized gap before the map");
const headerBack = nodes(categoryHeader).find(node => node.props?.testID === "adventure-back");
headerBack.props.onPress();
assert.equal(actions.at(-1), "back", "compact header preserves back navigation");
assert.equal(headerBack.props.pressScale, 0.95,
  "Back reuses Home's press feedback without altering its 44pt hit target");
const first = nodes(tree).find(node => node.props?.testID === "adventure-node-anc-0");
const second = nodes(tree).find(node => node.props?.testID === "adventure-node-anc-1");
assert.equal(first.props.disabled, false);
assert.equal(second.props.disabled, true);
// On Android, all 29 locked checkpoints use ordinary native Pressables
// instead of mounting Reanimated hooks that cannot provide press feedback.
native.Platform.OS = "android";
const androidAdventureTree = adventure(adventureProps);
const androidStops = nodes(androidAdventureTree).filter(node =>
  node.props?.testID?.startsWith("adventure-node-"));
assert.equal(androidStops.length, 30, "Android retains all checkpoint controls");
assert.equal(androidStops.filter(node => node.type?.name === "AndroidLockedCheckpoint").length, 29,
  "locked Android checkpoints do not allocate Reanimated press animations");
assert.equal(androidStops.filter(node => node.type === "Pressable").length, 1,
  "the usable Android checkpoint keeps its animated press feedback");
const firstLockedAndroidStop = androidStops.find(node =>
  node.props.testID === "adventure-node-anc-1");
assert.equal(firstLockedAndroidStop.type(firstLockedAndroidStop.props).type, "Pressable",
  "the Android locked-stop wrapper forwards native pressable semantics");
assert.equal(firstLockedAndroidStop.props.disabled, true);
native.Platform.OS = "ios";
first.props.onPress();
assert.equal(actions.at(-1), "open:anc-0");
tree = adventure({ ...adventureProps, completedLessonIds: ["anc-0"] });
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-1").props.disabled, false);
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-2").props.disabled, true);

// Adventure 3.0: the geographical atlas belongs to the fixed map viewport,
// not the screen header or 30-lesson scrolling content. Scroll focus is unchanged.
const completedNineteen = adventureLessons.slice(0, 19).map(item => item.id);
tree = adventure({ ...adventureProps, completedLessonIds: completedNineteen });
const mapFrame = nodes(tree).find(node => node.props?.testID === "adventure-map");
const stops = nodes(mapFrame).filter(node => node.props?.testID?.startsWith("adventure-node-"));
const stopPositions = nodes(mapFrame).filter(node => Array.isArray(node.props?.style)
  && node.props.style[0]?.position === "absolute" && node.props.style[0]?.width === 148);
const width = mapFrame.props.style[1].width;
assert.equal(stops.length, 30);
assert.equal(stopPositions.length, 30);
const chapterMarker = nodes(mapFrame).find(node => node.props?.children === "ΚΕΦΑΛΑΙΟ IV");
assert.ok(chapterMarker, "chapter IV milestone is still positioned on the path");
assert.equal(chapterMarker.props.style.color, "#E3CEAA",
  "warm engraved chapter badges are distinct from the active violet checkpoint");
assert.equal(chapterMarker.props.style.top, -28,
  "chapter ornamentation must not shift the badge into previous lesson titles");
// Chapter badges sit 28pt above the following stop. Allow a full
// 3-line title but do not reserve empty space for redundant status captions.
const chapterBeginnings = [5, 11, 18, 24];
for (const start of chapterBeginnings) {
  const previousTop = stopPositions[start - 1].props.style[1].top;
  const chapterBadgeTop = stopPositions[start].props.style[1].top - 28;
  const worstCasePreviousEnd = previousTop + 74 + 5 + 3 * 16;
  assert.ok(chapterBadgeTop - worstCasePreviousEnd >= 20,
    "chapter " + start + " must clear a long 3-line Greek lesson title");
}
assert.equal(stopPositions[1].props.style[1].top - stopPositions[0].props.style[1].top, 142,
  "normal checkpoint density is unchanged outside chapter boundaries");
// The background now spans the complete fixed screen, behind the header,
// card and map. It is not inside the scrolling checkpoint subtree.
const atlasLayer = nodes(tree).find(node => node.props?.testID === "adventure-atlas-underlay");
assert.ok(atlasLayer, "Subcategory atlas underlay exists at the screen root");
assert.equal(atlasLayer.props.pointerEvents, "none", "atlas never intercepts taps");
assert.equal(tree.props.children[0].props.testID, "adventure-atlas-underlay",
  "background is behind the fixed header, Continue card and checkpoint map");
assert.ok(!nodes(categoryHeader).some(node => node.props?.testID === "adventure-atlas-underlay"),
  "atlas is independent of the fixed header");
assert.ok(!nodes(compactCard).some(node => node.props?.testID === "adventure-atlas-underlay"),
  "atlas is independent of the Continue card");
assert.equal(nodes(mapFrame).filter(node => node.type === "AtlasBackground").length, 0,
  "no oversized atlas is mounted inside the scrolling path");
assert.equal(nodes(nestedScroll).filter(node => node.props?.testID === "adventure-atlas-underlay").length, 0,
  "atlas stays fixed as the scroll content moves");
assert.equal(nodes(mapFrame).filter(node => node.type === "AdventureActiveHalo").length, 1,
  "only the active checkpoint receives a breathing halo");
const medallionParts = lessonId => {
  const press = nodes(mapFrame).find(node => node.props?.testID === "adventure-node-" + lessonId);
  assert.ok(press, "checkpoint must remain a separate accessible control");
  const outer = nodes(press).find(node =>
    Array.isArray(node.props?.style) && node.props.style[0]?.width === 74);
  const coin = nodes(outer).find(node =>
    Array.isArray(node.props?.style) && node.props.style[0]?.width === 69);
  const inset = nodes(coin).find(node =>
    node.props?.style?.[0]?.position === "absolute" && node.props?.style?.[0]?.top === 7);
  return { press, outer, coin, inset };
};
const completedMedal = medallionParts("anc-0");
const activeMedal = medallionParts("anc-19");
const lockedMedal = medallionParts("anc-20");
assert.equal(completedMedal.outer.props.style[1].borderColor, "#AE9671",
  "completed checkpoints use a bronze outer seal");
assert.equal(completedMedal.coin.props.style[1].backgroundColor, "#254339",
  "completed medallions retain a green completion core");
assert.equal(completedMedal.inset.props.style[1].borderColor, "#A8916B",
  "completed medallions have a restrained inner engraving");
assert.equal(activeMedal.outer.props.style[2].backgroundColor, "transparent",
  "active outer wrapper no longer adds an opaque competing circular band");
assert.equal(activeMedal.inset, undefined,
  "active checkpoint omits the extra inner engraving ring");
assert.equal(activeMedal.coin.props.style[2].borderColor, "#C5B7FF",
  "current checkpoint keeps one clear, brighter lavender coin rim");
assert.ok(nodes(activeMedal.press).some(node => node.type === "AdventureActiveHalo"),
  "only the current checkpoint has the single breathing outline");
assert.equal(lockedMedal.outer.props.style[3].borderColor, "#41495C",
  "locked checkpoints use a quiet weathered outer rim");
assert.equal(lockedMedal.inset.props.style[2].opacity, 0.32,
  "locked inner engraving stays subdued");
assert.equal(completedMedal.press.props.disabled, false);
assert.equal(activeMedal.press.props.disabled, false);
assert.equal(lockedMedal.press.props.disabled, true);
assert.equal(nodes(completedMedal.press).filter(node => node.type === "AdventureActiveHalo").length, 0,
  "completed stations never spawn ambient animations");
assert.equal(nodes(lockedMedal.press).filter(node => node.type === "AdventureActiveHalo").length, 0,
  "locked stations never spawn ambient animations");
assert.ok(!nodes(mapFrame).some(node => node.props?.children === "ΣΕ ΕΞΕΛΙΞΗ" ||
  node.props?.children === "ΕΠΟΜΕΝΟΣ ΣΤΑΘΜΟΣ"),
  "node state is conveyed by checkpoint styling, not redundant captions");
assert.ok(nodes(mapFrame).some(node => node.props?.pressScale === 0.96),
  "lesson checkpoint press feedback uses the existing MotionPressable");
assert.ok(stopPositions.every(node => node.props.style[1].left >= 0 &&
  node.props.style[1].left + 148 <= width), "all stop labels stay inside the map width");
assert.ok(nodes(mapFrame).some(node => node.type === "path" && node.props?.stroke === "#2E9A7E"),
  "completed legs use a green route");
assert.ok(nodes(mapFrame).some(node => node.type === "path" && node.props?.stroke === "#A89BFF"),
  "the next leg is distinctly highlighted");
assert.equal(nodes(mapFrame).filter(node => node.type === "path" &&
  node.props?.stroke === "#BBA889").length, 29,
"every route leg receives a static engraved casing");
assert.ok(nodes(mapFrame).some(node => node.type === "path" && node.props?.stroke === "#3F9A7C"),
  "completed path receives a subtle static emerald halo");
assert.ok(nodes(mapFrame).some(node => node.type === "path" && node.props?.stroke === "#AD9FFB"),
  "the next active segment receives a lavender halo");
const titleOnMap = nodes(mapFrame).find(node => node.props?.testID === "adventure-label-anc-19");
assert.ok(titleOnMap, "checkpoint title remains visible on the path");
assert.equal(titleOnMap.props.numberOfLines, 3,
  "long Greek lesson titles may wrap onto a third line");
assert.equal(titleOnMap.props.adjustsFontSizeToFit, true,
  "small devices can shrink a long title rather than cut it");
assert.ok(titleOnMap.props.style[1].width > 148,
  "labels have a little more room without expanding checkpoint touch targets");
assert.ok(titleOnMap.props.style[1].width <= width * 0.51 + 0.001,
  "labels do not cross the map edges on narrow screens");
assert.ok(!("backgroundColor" in titleOnMap.props.style[0]),
  "titles no longer obscure the atlas with oversized dark rectangles");
assert.ok(titleOnMap.props.style[0].textShadowRadius >= 6,
  "titles use a subtle shadow for contrast against the atlas");
const longGreekTitle = "Όσα μετρούσε το ανάκτορο: εξουσία και εργασία στη μυκηναϊκή Πύλο";
const longLessonTree = adventure({
  ...adventureProps,
  lessons: adventureLessons.map((lesson, i) =>
    i === 5 ? { ...lesson, title: longGreekTitle } : lesson),
});
const longGreekLabel = nodes(longLessonTree).find(node =>
  node.props?.testID === "adventure-label-anc-5");
assert.equal(longGreekLabel.props.children, longGreekTitle,
  "full editorial title is preserved without manually shortening content");
assert.equal(longGreekLabel.props.numberOfLines, 3,
  "long editorial titles get a third line while leaving node coordinates untouched");
const nineteenCount = nodes(tree).find(node => node.props?.progressKey === "19/30");
assert.equal(nineteenCount.props.children, "19 / 30",
  "counter reanimates only when completion changes, without affecting layout");
const nineteenProgress = nodes(tree).find(node => node.props?.testID === "adventure-progress");
assert.equal(nodes(nineteenProgress).find(node => node.type === "AdventureProgressFill").props.percent, 63,
  "animated fill receives the actual lesson completion percentage");
assert.equal(nineteenProgress.props.accessibilityValue.now, 19);
assert.equal(nineteenProgress.props.accessibilityValue.max, 30);
assert.ok(nodes(tree).find(node => node.props?.testID === "adventure-continue"),
  "Continue card stays visible with older completion history");
const next = nodes(tree).find(node => node.props?.testID === "adventure-continue");
next.props.onPress();
assert.equal(actions.at(-1), "open:anc-19", "Continue opens the next unlocked lesson");
const mapScroll = nodes(tree).find(node => node.props?.testID === "adventure-map-scroll");
assert.ok(mapScroll, "map remains independently scrollable");
assert.ok(!nodes(tree).some(node => node.props?.testID === "adventure-jump-to-current"),
  "the redundant Η ΘΕΣΗ ΜΟΥ button has been removed");
assert.ok(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-20").props.disabled,
  "later lessons remain locked after jumping");
assert.ok(!nodes(tree).some(node => node.props?.children === "Ακολούθησε τους σταθμούς με τη σειρά."),
  "remove redundant tutorial copy above the first chapter");
tree = adventure({ ...adventureProps, progressLoaded: false });
assert.equal(nodes(tree).find(node => node.props?.testID === "adventure-node-anc-0").props.disabled, true);
const loadingCard = nodes(tree).find(node => node.props?.testID === "adventure-continue");
assert.equal(nodes(loadingCard).filter(node => node.type === "AdventureContinueAccent").length, 0,
  "loading/inactive Continue cards never flash their border");
assert.equal(nodes(loadingCard).filter(node => node.type === "AdventureContinueArrow").length, 0,
  "loading Continue cards have no animated chevron");

// Exercise the entry effect with stable hook state and measured ScrollView
// dimensions, rather than only testing the pure offset formula.
const motionState = { values: [0, 0, false], refs: [], effects: [], stateIndex: 0, refIndex: 0 };
const motionReact = {
  useMemo: fn => fn(),
  useState: initial => {
    const index = motionState.stateIndex++;
    if (!(index in motionState.values)) motionState.values[index] = initial;
    return [motionState.values[index], update => {
      const previous = motionState.values[index];
      motionState.values[index] = typeof update === "function" ? update(previous) : update;
    }];
  },
  useRef: initial => {
    const index = motionState.refIndex++;
    if (!motionState.refs[index]) motionState.refs[index] = { current: initial };
    return motionState.refs[index];
  },
  useEffect: effect => { motionState.effects.push(effect); },
};
const motionScreen = compile("src/screens/SubcategoryScreen.tsx", {
  react: motionReact,
  "../utils/lessonPath": adventurePathRules,
  "../utils/devLessonAccess": { devLessonsUnlocked: () => false },
  "../components/AdventureAtlasBackground": { __esModule: true, default: "AtlasBackground" },
  "../components/AtlasContinueCard": atlasContinueStub,
  "../components/AdventureMotion": { AdventureProgressFill: "AdventureProgressFill", AdventureActiveHalo: "AdventureActiveHalo", AdventureContinueAccent: "AdventureContinueAccent", AdventureContinueArrow: "AdventureContinueArrow" },
  "../components/HomeMotion": { MotionView: "View", MotionPressable: "Pressable", MotionIcon: "View", MotionCounter: "Text" },
});
const renderMotion = extra => {
  motionState.stateIndex = 0;
  motionState.refIndex = 0;
  motionState.effects = [];
  return motionScreen({ ...adventureProps, completedLessonIds: completedNineteen, ...extra });
};
let motionTree = renderMotion({ progressLoaded: false });
// Native layout supplies the visible scroll pane's dimensions (not the whole
// screen or 4300-point content). Verify screen/viewport resize independently.
let viewportLayout = nodes(motionTree).find(node => node.props?.testID === "subcategory-adventure-path");
viewportLayout.props.onLayout({ nativeEvent: { layout: { width: 320, height: 450 } } });
motionTree = renderMotion({ progressLoaded: false });
let fullAtlas = nodes(motionTree).find(node => node.type === "AtlasBackground");
assert.ok(fullAtlas, "measured map viewport mounts its atlas");
assert.equal(fullAtlas.props.width, 320);
assert.equal(fullAtlas.props.height, 450);
assert.ok(nodes(nodes(motionTree).find(node => node.props?.testID === "adventure-atlas-underlay"))
  .some(node => node.type === "AtlasBackground"), "rendered atlas stays in the screen-level underlay");
viewportLayout = nodes(motionTree).find(node => node.props?.testID === "subcategory-adventure-path");
viewportLayout.props.onLayout({ nativeEvent: { layout: { width: 350, height: 430 } } });
motionTree = renderMotion({ progressLoaded: false });
fullAtlas = nodes(motionTree).find(node => node.type === "AtlasBackground");
assert.equal(fullAtlas.props.width, 350, "atlas follows responsive map viewport width");
assert.equal(fullAtlas.props.height, 430, "atlas stops at the map viewport, not the whole screen");
let motionScroll = nodes(motionTree).find(node => node.props?.testID === "adventure-map-scroll");
const autoCalls = adventureAnimationCalls;
autoCalls.length = 0;
motionScroll.props.onLayout({ nativeEvent: { layout: { height: 540 } } });
motionScroll.props.onContentSizeChange(360, 1200);
motionTree = renderMotion({ progressLoaded: false });
motionState.effects[1]();
assert.equal(autoCalls.length, 0, "no entry scroll before progress hydration");
motionTree = renderMotion({ progressLoaded: true });
motionState.effects[1]();
assert.equal(autoCalls.length, 0, "wait for full map content measurement before focusing");
motionScroll.props.onContentSizeChange(360, 4800);
motionTree = renderMotion({ progressLoaded: true });
motionState.effects[1]();
assert.equal(autoCalls.length, 1, "only one UI-thread entry animation after full hydration");
assert.equal(autoCalls[0].target, adventureModule.getAdventureCurrentOffset(
  75 + 19 * 142 + 3 * 40, 75 + 29 * 142 + 4 * 40 + 115, 540,
), "automatic entry must preserve the previously correct checkpoint destination");
assert.ok(autoCalls[0].target > 2700,
  "19/30 completion must land at the current checkpoint, not before chapter IV");
assert.ok(autoCalls[0].duration >= 3000,
  "the slower glide uses an explicit multi-second duration");
mapScroll.props.onScrollBeginDrag();
assert.equal(adventureCancelCalls.length, 1,
  "manually dragging the map cancels automatic movement");
renderMotion({ progressLoaded: true });
motionState.effects[1]();
assert.equal(autoCalls.length, 1, "re-rendering cannot restart the entry animation");

// Subcategory cartography has also moved to a cached WebP backdrop;
// the animated halo stays in a separate native-composited view on both OSes.
const staticAtlas = compile("src/components/AdventureAtlasBackground.tsx", {
  react: { ...react, memo: component => component, useEffect: () => {} },
  "expo-image": { Image: "Image" },
  "../../assets/atlas-export-preview/subcategory.webp": "subcategory.webp",
  "react-native-svg": { ...svg, RadialGradient: "radialGradient" },
  "react-native-reanimated": {
    __esModule: true,
    default: { View: "AnimatedView" },
    Easing: { inOut: fn => fn, sin: value => value },
    useReducedMotion: () => true,
    useSharedValue: initial => ({ value: initial }),
    useAnimatedStyle: fn => fn(),
    cancelAnimation: () => {},
    withRepeat: animation => animation,
    withSequence: (...animations) => animations.at(-1),
    withTiming: target => target,
  },
});
native.Platform.OS = "ios";
const iosAtlas = staticAtlas({ width: 360, height: 680 });
native.Platform.OS = "android";
const androidAtlas = staticAtlas({ width: 360, height: 680 });
for (const rendered of [iosAtlas, androidAtlas]) {
  assert.equal(nodes(rendered).filter(node => node.type === "Image").length, 1,
    "both platforms use one bundled atlas image");
  const image = nodes(rendered).find(node => node.type === "Image");
  assert.equal(image.props.source, "subcategory.webp");
  assert.equal(image.props.contentFit, "fill");
  assert.equal(image.props.transition, 0);
  assert.equal(image.props.cachePolicy, "memory-disk");
  assert.equal(nodes(rendered).filter(node =>
    node.props?.testID === "adventure-atlas-ambient-glow").length, 1,
    "both platforms retain atmospheric motion in a small native view");
}
native.Platform.OS = "ios";

const atlasSource = fs.readFileSync(path.join(root, "src/components/AdventureAtlasBackground.tsx"), "utf8");
const adventureMotionSource = fs.readFileSync(path.join(root, "src/components/AdventureMotion.tsx"), "utf8");
assert.match(atlasSource, /useReducedMotion/, "atlas respects reduced motion");
assert.match(atlasSource, /pointerEvents="none"/, "atlas cannot intercept lesson taps");
assert.match(atlasSource, /withRepeat\(/, "atlas has low-frequency ambient motion");
assert.match(atlasSource, /subcategory\.webp/, "background uses exported static geography");
assert.match(atlasSource, /contentFit="fill" transition=\{0\}/, "static chart mounts without a fade");
assert.doesNotMatch(atlasSource, /useAnimatedProps/, "background never animates SVG attributes");
assert.doesNotMatch(atlasSource, /styles\.tideLayer|waveStyle|translateX: tide\.value/,
  "no viewport-sized SVG layer motion is present");
assert.match(atlasSource, /testID="adventure-atlas-ambient-glow"/,
  "a compact native-opacity glow replaces the full-map tide");
assert.match(atlasSource, /const glowStyle = useAnimatedStyle/,
  "the atlas effect animates only a small view style");
assert.match(atlasSource, /width: width \* 0\.64, height: height \* 0\.34/,
  "the animated atmosphere occupies only a bounded fraction of the viewport");
assert.match(atlasSource, /memo\(AdventureAtlasBackground\)/, "atlas is memoized across progress updates");
assert.equal((atlasSource.match(/withRepeat\(/g) || []).length, 1,
  "lighting adds no animated layers beyond the ambient tide");
assert.match(adventureMotionSource, /useReducedMotion/, "motion accents respect reduce motion");
assert.match(adventureMotionSource, /withRepeat\(/, "current lesson has a breathing halo");
assert.match(adventureMotionSource, /width: 84, height: 84, borderRadius: 42/,
  "pulse stays concentric and close to the 74pt checkpoint wrapper");
assert.match(adventureMotionSource, /borderWidth: 2\.5/,
  "pulse has a legible stroke, including on high-density screens");
assert.match(adventureMotionSource, /backgroundColor: "rgba\(159,137,242,0\.16\)"/,
  "one translucent halo creates soft light without an opaque disk");
assert.match(adventureMotionSource, /scale: 1 \+ pulse\.value \* 0\.13/,
  "only the outer halo expands, by a bounded thirteen percent");
assert.match(adventureMotionSource, /opacity: 0\.78 \* \(1 - pulse\.value\)/,
  "expanding halo fades completely before resetting");
assert.match(adventureMotionSource, /withDelay\(550, withTiming\(0, \{ duration: 0 \}\)\)/,
  "invisible pause prevents an incessant, overlapping pulse");
assert.match(adventureMotionSource, /if \(reduced\) return/,
  "reduced-motion renders a visible static halo without repeating");
assert.equal((adventureMotionSource.match(/withRepeat\(/g) || []).length, 1,
  "Continue accents add no extra continuous animation loops");
assert.match(adventureMotionSource, /testID="adventure-continue-accent"/,
  "the Continue perimeter glint is a separately testable decorative overlay");
assert.match(adventureMotionSource, /pointerEvents="none" accessible={false} style=\{\[styles\.continueAccent/,
  "perimeter accent cannot intercept card taps or screen-reader focus");
assert.match(adventureMotionSource, /borderRadius: 18, borderWidth: 1/,
  "card accent matches the original 18pt rounded shape");
assert.match(adventureMotionSource, /progressSheen/,
  "progress fill has a static top-edge sheen, not a second animation");
assert.match(adventureMotionSource, /testID="adventure-continue-chevron"/,
  "Continue arrow preserves a separate entry accent");
assert.match(adventureMotionSource, /if \(reduced\) return/,
  "reduced-motion users skip the Continue arrow's movement");
assert.match(adventureMotionSource, /withTiming\(target/, "progress bar animates to its value");
console.log("Game Home + Adventure Path headless contracts passed. Native layout and touch QA still required.");
