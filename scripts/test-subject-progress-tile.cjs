/* Shared subject cards keep identical responsive geometry and distinct progress semantics. */
const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const subject = load("src/components/SubjectProgressTile.tsx", {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": {
    View: "View", Text: "Text", StyleSheet: { create: value => value },
  },
  "./HomeMotion": { MotionPressable: "MotionPressable" },
  "./ProgressMotion": { ProgressBarFill: "ProgressBarFill" },
}).default;
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => tree === null || tree === undefined || typeof tree === "boolean" ? ""
  : typeof tree === "string" || typeof tree === "number" ? String(tree)
  : Array.isArray(tree) ? tree.map(text).join("")
  : text(tree.props?.children);
const base = {
  title: "Επιστήμη & Διάστημα", emoji: "🚀",
  completed: 0, total: 6, percent: 0, selected: false,
  onPress: () => {}, testID: "reading-subject-space", accessibilityLabel: "Έξι μαθήματα",
};
const zeroReading = subject({ ...base, tone: "reading" });
assert.equal(zeroReading.type, "MotionPressable");
assert.equal(zeroReading.props.pressScale, 0.985);
assert.equal(zeroReading.props.accessibilityRole, "button");
assert.deepEqual({ ...zeroReading.props.accessibilityState }, { selected: false, expanded: false });
assert.equal(zeroReading.props.accessibilityLabel, "Έξι μαθήματα");
assert.equal(zeroReading.props.style[0].minHeight, 137);
assert.equal(zeroReading.props.style[0].borderRadius, 17);
assert.equal(zeroReading.props.style[3].backgroundColor, "#1F313D");
assert.ok(text(zeroReading).includes("ΜΑΘΗΜΑΤΑ"));
assert.ok(text(zeroReading).includes("0 / 6"));
assert.ok(text(zeroReading).includes("›"));
assert.ok(!text(zeroReading).includes("0%"), "new reader has no fake completion badge");
const readingTrack = nodes(zeroReading).find(n => n.type === "View" && n.props?.style?.[0]?.height === 7);
assert.equal(readingTrack.props.style[1].borderColor, "#49717A");
assert.equal(nodes(readingTrack).find(n => n.type === "ProgressBarFill").props.tone, "reading");
const title = nodes(zeroReading).find(n => n.type === "Text" && n.props?.children === base.title);
assert.equal(title.props.numberOfLines, 2);
assert.equal(title.props.adjustsFontSizeToFit, true);
assert.equal(title.props.minimumFontScale, 0.86);

const readingProgress = subject({ ...base, tone: "reading", completed: 2, percent: 33 });
assert.ok(text(readingProgress).includes("33%"));
assert.equal(readingProgress.props.style[4].borderColor, "#4A717B");
const progressBadge = nodes(readingProgress).find(n => n.type === "Text" && n.props?.children === "33%");
assert.equal(progressBadge.props.style[1].color, "#B8E9E3");
const completeReading = subject({ ...base, tone: "reading", completed: 6,
  percent: 100, selected: true, singleColumn: true });
assert.ok(text(completeReading).includes("✓"));
assert.ok(!text(completeReading).includes("100%"), "completed cards show check, not duplicate percent");
assert.equal(completeReading.props.style[2].width, "100%");
assert.equal(completeReading.props.style[2].minHeight, 118);
assert.equal(completeReading.props.style[5].backgroundColor, "#264149");
assert.equal(completeReading.props.style[6].borderColor, "#9CD2D1");
assert.equal(completeReading.props.accessibilityState.selected, true);
assert.equal(nodes(completeReading).find(n => n.type === "ProgressBarFill").props.percent, 100);

const knowledge = subject({ ...base, tone: "knowledge", completed: 3, total: 10,
  percent: 30, threeColumn: true, testID: "knowledge-subject-space" });
assert.equal(knowledge.props.style[1].width, "31.7%");
assert.equal(knowledge.props.style[4].backgroundColor, "#262840");
assert.ok(text(knowledge).includes("ΚΑΤΑΚΤΗΣΗ"));
assert.equal(nodes(knowledge).find(n => n.type === "ProgressBarFill").props.tone, "knowledge");
const knowledgeBadge = nodes(knowledge).find(n => n.type === "Text" && n.props?.children === "30%");
assert.equal(knowledgeBadge.props.style[1], undefined);
assert.equal(knowledgeBadge.props.style[0].color, "#D3C6FF");
let pressed = 0;
const tappable = subject({ ...base, tone: "reading", onPress: () => pressed++ });
tappable.props.onPress();
assert.equal(pressed, 1, "navigation still triggers the screen-provided action");
console.log("Shared subject tiles passed: responsive geometry, teal/violet themes, real progress, empty/full states, a11y and native press handling.");
