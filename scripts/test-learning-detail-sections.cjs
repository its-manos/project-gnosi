/* Consistent Midnight Atlas section UI: independent data, shared visual geometry. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const { LearningSectionHeading, SubjectInsightPanel, SubjectShowAll } =
  load("src/components/LearningDetailSections.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Pressable: "Pressable", View: "View", Text: "Text",
      StyleSheet: { create: value => value } },
    "../theme": { colors: { text: "#F2EFEA", textBody: "#C6CBD6" } },
  });
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
  : tree && typeof tree === "object" ? text(tree.props?.children) : "";

const violetHeading = LearningSectionHeading({ title: "ΟΙ ΘΕΜΑΤΙΚΕΣ ΣΟΥ", tone: "knowledge" });
const tealHeading = LearningSectionHeading({ title: "ΟΙ ΘΕΜΑΤΙΚΕΣ ΣΟΥ", tone: "reading" });
assert.equal(violetHeading.type, "Text");
assert.equal(violetHeading.props.style[0], tealHeading.props.style[0],
  "headings share identical sizing and weight in both sections");
assert.equal(violetHeading.props.style[0].lineHeight, 18);
assert.equal(tealHeading.props.style[1].color, "#9CD2D1");
assert.equal(text(violetHeading), text(tealHeading));

const knowledge = SubjectInsightPanel({
  tone: "knowledge", title: "Ιστορία", current: 2, total: 8,
  caption: "Απομένουν 6 έννοιες για πλήρη κατάκτηση.",
  note: "Πρόοδος επαναλήψεων: 25%", testID: "knowledge-selected-subject",
});
const reading = SubjectInsightPanel({
  tone: "reading", title: "Ιστορία", current: 2, total: 8,
  caption: "Απομένουν 6 μαθήματα για ολοκλήρωση.", testID: "reading-selected-subject",
});
assert.equal(knowledge.type, "View");
assert.equal(knowledge.props.accessibilityLiveRegion, "polite");
assert.equal(reading.props.accessibilityLiveRegion, "polite");
assert.equal(knowledge.props.style[0], reading.props.style[0]);
assert.equal(knowledge.props.style[0].paddingVertical, 11);
assert.equal(reading.props.style[1].borderColor, "#40626C");
assert.ok(text(knowledge).includes("Πρόοδος επαναλήψεων: 25%"));
assert.ok(!text(reading).includes("Πρόοδος επαναλήψεων"),
  "reading must not show knowledge-review semantics");
assert.ok(text(reading).includes("6 μαθήματα"));

let taps = 0;
const violetDisclosure = SubjectShowAll({
  tone: "knowledge", expanded: false, count: 8,
  onPress: () => taps++, testID: "knowledge-all-subjects",
});
const tealDisclosure = SubjectShowAll({
  tone: "reading", expanded: false, count: 7,
  onPress: () => taps++, testID: "reading-all-subjects",
});
assert.equal(violetDisclosure.type, "Pressable");
assert.equal(violetDisclosure.props.accessibilityRole, "button");
assert.equal(violetDisclosure.props.accessibilityState.expanded, false);
assert.equal(violetDisclosure.props.style({ pressed: false })[0].minHeight, 46);
assert.equal(violetDisclosure.props.style({ pressed: false })[0],
  tealDisclosure.props.style({ pressed: false })[0],
  "same accessible touch target and border radius");
assert.equal(violetDisclosure.props.style({ pressed: true })[2].backgroundColor, "#2F2C4A");
assert.equal(tealDisclosure.props.style({ pressed: true })[2].backgroundColor, "#294450");
assert.ok(text(violetDisclosure).includes("Όλες οι θεματικές (8)"));
assert.ok(text(tealDisclosure).includes("Όλες οι θεματικές (7)"));
violetDisclosure.props.onPress();tealDisclosure.props.onPress();
assert.equal(taps, 2);
const expanded = SubjectShowAll({
  tone: "reading", expanded: true, count: 7,
  onPress: () => {}, testID: "reading-all-subjects",
});
assert.equal(expanded.props.accessibilityState.expanded, true);
assert.ok(text(expanded).includes("Λιγότερες θεματικές"));
assert.ok(text(expanded).includes("⌃"));

for (const path of ["LearningActivityPanel.tsx"]) {
  const source = fs.readFileSync("src/components/" + path, "utf8");
  assert.match(source, /<LearningSectionHeading\b/);
  assert.match(source, /<SubjectInsightPanel\b/);
  assert.match(source, /<SubjectShowAll\b/);
}
console.log("Learning detail sections passed: matching headings/panels/disclosures, distinct themes, a11y and preserved state semantics.");
