const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
  : tree && typeof tree === "object" ? text(tree.props?.children) : "";

let slots = [], cursor = 0;
const react = {
  useState: init => {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof init === "function" ? init() : init;
    return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
  },
};
const native = {
  View: "View", Text: "Text", Pressable: "Pressable",
  ScrollView: "ScrollView", StyleSheet: { create: value => value },
};
const stubs = Object.fromEntries(["KnowledgeMastery", "ReviewActions", "SyncStatus"]
  .map(name => ["../components/" + name, { __esModule: true, default: name }]));
const Screen = load("src/screens/ProgressScreen.tsx", {
  react, "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": native,
  ...stubs,
  "../components/LearningActivityPanel": { CategoryProgress: "Categories" },
}).default;
const { lessons, categories } = load("src/data/lessons.ts");
let profile = 0, review = 0, weekly = 0, explore = 0, opened = [];
let props = {
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
const render = () => { cursor = 0; return Screen(props); };
const press = (tree, label) => nodes(tree).find(node => node.type === "Pressable" && text(node).includes(label));

let tree = render();
const summary = nodes(tree).find(node => node.props.testID === "progress-summary");
assert.ok(summary, "completion overview is visible before actions");
assert.ok(text(summary).includes("7"), "completed total is visible");
assert.ok(text(summary).includes(String(categories.length)), "world total comes from the catalogue");
assert.ok(text(summary).includes("%"), "overview shows a derived completion percentage");
assert.ok(!nodes(tree).some(node => node.props.testID === "progress-resume"),
  "separate resume card no longer competes with the single action card");
const action = nodes(tree).find(node => node.type === "ReviewActions");
assert.equal(action.props.inProgressLesson, props.inProgressLesson);
assert.equal(action.props.onResumeLesson, props.onOpenLesson);
assert.equal(action.props.inProgressAnsweredCount, 2);
assert.equal(action.props.lessonProgressLoaded, true);
action.props.onReview(); action.props.onWeeklyReview(); action.props.onExplore();
assert.equal(review, 1); assert.equal(weekly, 1); assert.equal(explore, 1);
assert.equal(nodes(tree).find(node => node.type === "KnowledgeMastery").props.preview, true);
assert.equal(nodes(tree).find(node => node.type === "KnowledgeMastery").props.mapOnly, true);
for (const type of ["KnowledgeProgress", "UsageSharing", "Activity", "Categories", "WeeklyReviewCard"]) {
  assert.ok(!nodes(tree).some(node => node.type === type), "default Progress is focused: " + type);
}
assert.ok(!text(tree).includes("ΣΥΝΟΛΙΚΟΙ ΠΟΝΤΟΙ"));
press(tree, "Προφίλ").props.onPress();
assert.equal(profile, 1);

press(tree, "Ανάγνωση").props.onPress();
tree = render();
assert.ok(!nodes(tree).some(node => node.type === "KnowledgeMastery"));
assert.equal(nodes(tree).find(node => node.type === "Categories").props.compact, true);
assert.ok(text(tree).includes("7"));
assert.ok(!text(tree).includes(lessons[6].title), "completed lesson list stays collapsed");
press(tree, "Ολοκληρωμένα μαθήματα").props.onPress();
tree = render();
press(tree, lessons[6].title).props.onPress();
assert.equal(opened.at(-1), lessons[6].id, "all completed lessons remain reachable");
press(tree, "Γνώσεις").props.onPress();
tree = render();
assert.ok(!nodes(tree).some(node => node.type === "Categories"));

props = { ...props, inProgressLesson: null, lessonProgressLoaded: false };
tree = render();
assert.ok(!nodes(tree).some(node => node.type === "Categories"), "no empty-looking category chart while hydrating");
assert.ok(!text(nodes(tree).find(node => node.props.testID === "progress-summary")).includes("0%"),
  "loading must not pretend that completion is zero");
press(tree, "Ανάγνωση").props.onPress();
tree = render();
assert.ok(text(tree).includes("Φόρτωση μαθημάτων"));
assert.ok(!nodes(tree).some(node => node.type === "Categories"));
props = { ...props, lessonProgressLoaded: true, completedLessons: [] };
tree = render();
assert.ok(text(tree).includes("Τα ολοκληρωμένα μαθήματα θα εμφανιστούν εδώ."));
assert.ok(!press(tree, "Ολοκληρωμένα μαθήματα"), "empty reading state is not expandable");
console.log("Progress Phase 1 passed: compact overview, one priority-action component, focused previews, accessible reading detail and honest loading/empty states.");
