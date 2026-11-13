/* The profile-family screens share one header layout while retaining navigation. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const Header = load("src/components/ProfileSectionHeader.tsx", {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { Pressable: "Pressable", Text: "Text", View: "View", StyleSheet: { create: x => x } },
});
let pressed = 0;
const example = Header.default({
  title: "Δεδομένα και απόρρητο",
  actionLabel: "‹ Ρυθμίσεις", actionAccessibilityLabel: "Πίσω στις ρυθμίσεις",
  onAction: () => { pressed++; },
});
assert.equal(example.props.testID, "profile-section-header");
const action = nodes(example).find(node => node.type === "Pressable");
assert.equal(action.props.accessibilityRole, "button");
assert.equal(action.props.accessibilityLabel, "Πίσω στις ρυθμίσεις");
action.props.onPress();
assert.equal(pressed, 1);
const title = nodes(example).find(node => node.type === "Text" && node.props?.children === "Δεδομένα και απόρρητο");
assert.equal(nodes(example).filter(node => node.type === "Text").length, 2, "Only the title and action are visible");
assert.equal(title.props.numberOfLines, 2, "Long settings titles must have wrap room");
assert.equal(title.props.adjustsFontSizeToFit, true);
const actionStyle = action.props.style({ pressed: false })[0];
assert.ok(actionStyle.minHeight >= 44, "Keep an accessible touch target");
assert.equal(Header.profileSectionLayout.horizontal, 18);
assert.equal(Header.profileSectionLayout.top, 8);
assert.equal(Header.profileSectionLayout.below, 13);
const read = file => fs.readFileSync(file, "utf8");
const screens = [
  "ProfileScreen.tsx", "PlayerStatsScreen.tsx",
  "AccountScreen.tsx", "DailyChallengePreferencesScreen.tsx", "DailyChallengeScreen.tsx", "QuickQuizScreen.tsx",
];
for (const file of screens) {
  const source = read("src/screens/" + file);
  assert.match(source, /<ProfileSectionHeader\b/, file + " uses the shared header");
  const layout = source.includes('quizFlowStyles') ? read('src/components/quizFlowStyles.ts') : source;
  assert.match(layout, /profileSectionLayout\.horizontal/);
  assert.match(layout, /profileSectionLayout\.top/);
}
const statsSource = read("src/screens/PlayerStatsScreen.tsx");
assert.doesNotMatch(statsSource, /fixedContent:|headerSpacing:/,
  "Statistics must not distribute spare height across the dashboard");
assert.match(statsSource, /content: \{[^\n]*gap: profileSectionLayout\.below/,
  "Statistics should use the shared vertical spacing below its header");
assert.match(statsSource, /scrollEnabled=\{allowScroll\}/,
  "Statistics should scroll only when content or accessibility requires it");
assert.doesNotMatch(read("src/screens/DailyChallengePreferencesScreen.tsx"),
  /contentCompact: \{[^\n]*paddingTop/,
  "Compact Interests must not vertically offset its header");
assert.match(read("src/screens/AccountScreen.tsx"), /onAction=\{goBack\}/);
assert.match(read("src/screens/DailyChallengePreferencesScreen.tsx"), /onAction=\{onCancel\}/);
console.log("Shared Profile-section header contracts passed: equal insets, readable titles, touch target, back actions and top alignment.");
