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
  Defs: "defs", G: "g", Ellipse: "ellipse", LinearGradient: "linearGradient",
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

function compile(file, extra = {}, returnModule = false) {
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
const worldArtwork = {
  history: HistoryWorldIcon,
  science: otherWorlds.ScienceWorldIcon,
  nature: otherWorlds.NatureWorldIcon,
  technology: otherWorlds.TechnologyWorldIcon,
  culture: otherWorlds.CultureWorldIcon,
  geography: otherWorlds.GeographyWorldIcon,
  "difficult-history": otherWorlds.DifficultHistoryWorldIcon,
};
const home = compile("src/screens/HomeScreen.tsx", {
  "../components/worldIcons/HistoryWorldIcon": { __esModule: true, default: HistoryWorldIcon },
  "../components/worldIcons/OtherWorldIcons": otherWorlds,
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
const textById = (id, t = tree) => nodes(t).find(node => node.props?.testID === id);
assert.equal(textById("home-hero-location").props.children, "Ιστορία · Αρχαία Ελλάδα",
  "continue card shows real category and subcategory titles");
assert.match(textById("home-primary-action").props.accessibilityLabel, /Ιστορία · Αρχαία Ελλάδα/);
assert.equal(textById("home-daily-answered").props.children, "7/7",
  "completed daily quiz shows seven answered questions");
assert.equal(textById("home-daily-answered").props.style.fontSize, 24,
  "daily answer count stays prominent without expanding the card");
assert.equal(textById("home-daily-quiz").props.accessibilityLabel.includes("7 από 7"), true);
assert.equal(textById("home-daily-quiz").props.style({ pressed: false })[0].minHeight, 96,
  "daily card keeps its current compact footprint");
// Every known world renders bespoke local art, with the same viewBox, display
// scale and 32pt Yoga layout footprint. Each remains inside the original card.
const HistoryCard = nodes(tree).find(node => node.props?.testID === "home-category-history");
assert.equal(Object.keys(worldArtwork).length, 7);
for (const category of categories) {
  const card = nodes(tree).find(node => node.props?.testID === "home-category-" + category.id);
  assert.equal(card.props.accessibilityRole, "button");
  assert.match(card.props.accessibilityLabel, /Άνοιξε τη θεματική/);
  assert.equal(card.props.style({ pressed: false })[0].minHeight, 78);
  assert.ok(!nodes(card).some(node => node.props?.children === category.emoji),
    "custom art replaces emoji for " + category.id);
  const illustrationType = worldArtwork[category.id];
  assert.equal(typeof illustrationType, "function", "component exists for " + category.id);
  const illustrationNode = nodes(card).find(node => node.type === illustrationType);
  assert.ok(illustrationNode, "card uses bespoke art for " + category.id);
  assert.equal(illustrationNode.props.size, 32);
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
assert.equal(nodes(tree).find(node => node.props?.testID === "home-quiz-streak").props.accessibilityLabel.includes("καθημερινού quiz"), true);
assert.ok(nodes(tree).some(node => node.props?.children === "Ολοκληρώθηκε ✓"));
// The counter is the number of submitted answers, not the current index,
// correct answers, or a streak. It is scoped to today's Athens daily record.
daily = { ready: true, doc: { days: { "2026-11-03": {
  record: { completed: false, started: true, currentIndex: 2, answers: { "0": 2, "1": 0, "2": 1 } },
} } } };
tree = home(props);
assert.equal(textById("home-daily-answered").props.children, "3/7");
assert.ok(nodes(tree).some(node => node.props?.children === "Συνέχισε σήμερα"));
assert.match(textById("home-daily-quiz").props.accessibilityLabel, /3 από 7/);
daily = { ready: true, doc: { days: { "2026-11-02": {
  record: { completed: true, answers: completeDailyAnswers },
} } } };
tree = home(props);
assert.equal(textById("home-daily-answered").props.children, "0/7",
  "yesterday's completed quiz does not count towards today's progress");
assert.ok(nodes(tree).some(node => node.props?.children === "Ξεκίνα σήμερα"));
daily = { ready: false, doc: { days: {} } };
tree = home(props);
assert.equal(textById("home-daily-answered").props.children, "—/7",
  "unknown loading progress must not appear as zero");
assert.match(textById("home-daily-quiz").props.accessibilityLabel, /φόρτωση προόδου/);
daily = { ready: true, doc: { days: { "2026-11-03": {
  record: { completed: true, started: true, currentIndex: 6, answers: completeDailyAnswers },
} } } };
tree = home(props);
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
  assert.equal(game.props.style[0].minHeight, 62);
}
assert.ok(nodes(tree).some(node => node.props?.children === "Μίνι παιχνίδια"));
assert.equal(nodes(tree).filter(node => node.props?.children === "Σύντομα").length, 2);

// Responsive density follows the available Home height after safe areas and tabs.
homeScrollState = [0, 0, 0];
const renderMeasuredHome = () => { homeScrollHookIndex = 0; return home(props); };
const scrollNode = () => nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-game-dashboard");
let scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "disable scrolling before measurements settle");
assert.equal(scroll.props.bounces, false, "disable iOS elastic bounce");
assert.equal(scroll.props.alwaysBounceVertical, false);
assert.equal(scroll.props.overScrollMode, "never", "disable Android overscroll glow");
scroll.props.onLayout({ nativeEvent: { layout: { height: 705 } } });
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[1].gap, 8,
  "shorter usable viewport activates compact layout even with a tall window");
assert.equal(scroll.props.contentContainerStyle[2], false);
scroll.props.onContentSizeChange(360, 711);
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[2].gap, 5,
  "measured overflow activates tight spacing without dropping sections");
const tightHero = nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-primary-action");
const tightQuiz = nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-daily-quiz");
const tightCategory = nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-category-history");
const tightMiniGame = nodes(renderMeasuredHome()).find(node => node.props?.testID === "home-mini-game-sudoku");
assert.equal(tightHero.props.style({ pressed: false })[2].padding, 10);
assert.equal(tightQuiz.props.style({ pressed: false })[3].minHeight, 80);
assert.equal(tightCategory.props.style({ pressed: false })[2].minHeight, 67);
assert.equal(tightMiniGame.props.style[1].minHeight, 56);
assert.equal(nodes(tightCategory).find(node => node.type === HistoryWorldIcon).props.size, 32);
assert.ok(nodes(tightHero).some(node => node.props?.style?.minHeight === 44),
  "primary CTA retains its 44pt tap target");
scroll.props.onContentSizeChange(360, 701);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "fitted tight content cannot be scrolled");
scroll.props.onLayout({ nativeEvent: { layout: { height: 790 } } });
scroll = scrollNode();
assert.equal(scroll.props.contentContainerStyle[1], false,
  "available height growth restores spacious styling");
assert.equal(scroll.props.scrollEnabled, false);
// Small landscape screens and large accessibility text must never be clipped.
scroll.props.onLayout({ nativeEvent: { layout: { height: 560 } } });
scroll.props.onContentSizeChange(360, 680);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, true, "genuine overflow remains scrollable");
scroll.props.onContentSizeChange(360, 554);
scroll = scrollNode();
assert.equal(scroll.props.scrollEnabled, false, "drag turns off when content fits again");

// Preserve the one-point measurement tolerance and resize behavior.
homeScrollState = [0, 0, 0];
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
homeScrollState = null;
assert.ok(nodes(tree).some(node => node.props?.children === "1 / 3 ερωτήσεις"),
  "resume card shows question progress beside its heading");
const centeredGrid = nodes(tree).find(node =>
  Array.isArray(node.props?.style) && node.props.style[0]?.flexWrap === "wrap"
  && node.props.style[0]?.justifyContent === "center");
assert.ok(centeredGrid, "knowledge worlds are centered with equal grid gaps");
assert.equal(centeredGrid.props.style[0].columnGap, 8);
assert.equal(HistoryCard.props.style({ pressed: false })[0].minHeight, 78,
  "History card dimensions remain unchanged on normal screens");
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
