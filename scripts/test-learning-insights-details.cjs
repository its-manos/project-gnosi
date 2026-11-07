/* Learning detail smoke tests: interactive disclosure, bounded rendering and progress semantics. */
const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
    : tree && typeof tree === "object" ? text(tree.props?.children) : "";
const node = (tree, id) => nodes(tree).find(n => n.props?.testID === id);
let slots = [], cursor = 0, review = 0;
const react = {
  useState: initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], next => {
      slots[index] = typeof next === "function" ? next(slots[index]) : next;
    }];
  },
};
const mockQuestion = n => ({
  questionId: "q-" + n, version: "v1",
  wrong: { at: n, value: "incorrect" }, correctAt: 0, revised: false,
  available: true, item: { title: "Μάθημα " + n, question: { prompt: "Ερώτηση " + n } },
});
const rows = Array.from({ length: 25 }, (_, i) => mockQuestion(i));
const model = {
  rows, pending: rows, revised: 0, total: 25, unavailable: 0,
  subjects: ["Ιστορία", "Επιστήμη", "Τεχνολογία", "Τέχνη", "Φύση"].map((title, i) => ({
    id: "subject-" + i, title, emoji: "✦", total: 5, revised: i,
  })),
};
const Mastery = load("src/components/KnowledgeMastery.tsx", {
  react, "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": {
    View: "View", Text: "Text", Pressable: "Pressable",
    StyleSheet: { create: value => value },
  },
  "../knowledge/mistakes": {
    asBuiltinQuestion: value => value,
    describeMistakeAnswer: () => "Η λάθος επιλογή",
  },
  "../hooks/useMistakesModel": { useMistakesModel: () => ({ model, ready: true }) },
  "./ActionButton": { __esModule: true, default: "ActionButton" },
  "./HomeMotion": { MotionView: "MotionView" },
  "./LearningDetailSections": {
    LearningSectionHeading: "LearningSectionHeading",
    SubjectInsightPanel: "SubjectInsightPanel",
    SubjectShowAll: "SubjectShowAll",
  },
  "./SubjectProgressTile": { __esModule: true, default: "SubjectProgressTile" },
}).default;
let props = { onOpen: () => review++, detail: true, subjectLimit: 2 };
const render = () => { cursor = 0; return Mastery(props); };
let tree = render();
assert.ok(node(tree, "knowledge-mastery"));
assert.equal(nodes(tree).filter(n => n.type === "SubjectProgressTile").length, 2,
  "small screens render a single row first");
assert.equal(node(tree, "knowledge-all-subjects").props.expanded, false);
assert.equal(node(tree, "knowledge-history-toggle").props.accessibilityState.expanded, false);
assert.equal(nodes(tree).filter(n => n.type === "SubjectProgressTile")[0].props.dense, true);
assert.ok(!text(tree).includes("Ερώτηση 0"), "history is collapsed on entry");

nodes(tree).find(n => n.type === "ActionButton").props.onPress();
assert.equal(review, 1, "review navigation survives the redesign");
node(tree, "knowledge-subject-subject-1").props.onPress();
tree = render();
assert.ok(node(tree, "knowledge-selected-subject"), "subject detail opens only on demand");
assert.equal(node(tree, "knowledge-selected-subject").props.current, 1);
node(tree, "knowledge-all-subjects").props.onPress();
tree = render();
assert.equal(nodes(tree).filter(n => n.type === "SubjectProgressTile").length, 5);
assert.equal(node(tree, "knowledge-selected-subject"), undefined,
  "expanding the grid resets the selected category");
node(tree, "knowledge-history-toggle").props.onPress();
tree = render();
assert.equal(node(tree, "knowledge-history-toggle").props.accessibilityState.expanded, true);
assert.ok(text(tree).includes("Ερώτηση 0"));
assert.equal(nodes(tree).filter(n => n.props?.style?.backgroundColor === "#1D2235").length, 12,
  "large histories mount 12 rows at a time");
const more = nodes(tree).find(n => n.type === "Pressable" && text(n).includes("Περισσότερα (13)"));
assert.ok(more, "remaining history is reachable");
more.props.onPress();
tree = render();
assert.ok(text(tree).includes("Ερώτηση 20"), "more history pages display on demand");
model.pending = []; model.rows = []; model.total = 0; model.subjects = [];
slots = []; tree = render();
assert.ok(text(tree).includes("Τα λάθη από μαθήματα"));
assert.ok(!node(tree, "knowledge-history-toggle"), "new accounts do not get empty history controls");
assert.ok(!nodes(tree).some(n => n.type === "ActionButton"), "zero pending mistakes cannot launch an empty session");

console.log("Learning knowledge detail passed: compact subject rows, review navigation, selection, expansion, paginated history and empty state.");
