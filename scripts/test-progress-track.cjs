/* Shared Midnight Atlas progress tracks preserve precise geometry and fill ownership. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const { default: ProgressTrack, progressTrackStyles } = load("src/components/ProgressTrack.tsx", {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { View: "View", StyleSheet: { create: value => value } },
});
const render = props => ProgressTrack({ testID: "shared-progress", ...props });
for (const [variant, height, background, radius] of [
  ["destination", 5, "#333951", 5],
  ["subject", 7, "#363650", 6],
  ["accuracy", 7, "#282D40", 20],
]) {
  const tree = render({ variant, children: jsx("ProgressBarFill", { percent: 30 }) });
  assert.equal(tree.type, "View");
  assert.equal(tree.props.testID, "shared-progress");
  assert.equal(tree.props.style[0].height, height);
  assert.equal(tree.props.style[0].backgroundColor, background);
  assert.equal(tree.props.style[0].borderRadius, radius);
  assert.equal(tree.props.style[0].overflow, "hidden");
  assert.equal(tree.props.children.type, "ProgressBarFill",
    "track never alters or recreates the caller's fill");
}
assert.equal(progressTrackStyles.subject.borderColor, "#4C466D");
assert.equal(progressTrackStyles.subject.borderWidth, 1);
assert.equal(progressTrackStyles.accuracy.marginTop, 11);
const teal = render({ variant: "subject", tone: "reading", pointerEvents: "none",
  children: jsx("ProgressBarFill", { tone: "reading", percent: 60 }) });
assert.equal(teal.props.style[1].backgroundColor, "#2D4650");
assert.equal(teal.props.style[1].borderColor, "#49717A");
assert.equal(teal.props.pointerEvents, "none");
assert.equal(teal.props.children.props.tone, "reading");
const violet = render({ variant: "subject", tone: "knowledge" });
assert.ok(!violet.props.style[1], "knowledge track does not inherit reading colors");
const custom = { opacity: 1 };
assert.equal(render({ variant: "accuracy", style: custom }).props.style[2], custom);
const source = path => fs.readFileSync(path, "utf8");
const progress = source("src/screens/ProgressScreen.tsx");
const subjects = source("src/components/SubjectProgressTile.tsx");
const stats = source("src/screens/PlayerStatsScreen.tsx");
assert.equal((progress.match(/<ProgressTrack variant="destination"/g) || []).length, 2,
  "both dashboard destination cards share one track surface");
assert.match(subjects, /<ProgressTrack variant="subject" tone=\{tone\}/);
assert.match(stats, /<ProgressTrack variant="accuracy">/);
assert.match(progress, /<ProgressBarFill tone="reading"/);
assert.match(progress, /<ProgressBarFill tone="knowledge"/);
assert.match(subjects, /<ProgressBarFill tone=\{tone\}/);
assert.match(stats, /width: stats\.accuracyPercent \+ "%"/);
console.log("Shared progress tracks passed: identical 5/7pt surfaces, teal/violet variants, native fill ownership, accuracy and screen wiring.");
