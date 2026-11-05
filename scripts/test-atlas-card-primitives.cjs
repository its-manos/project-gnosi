/* Shared Midnight Atlas shells retain the current dimensions and motion hosts. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const common = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { StyleSheet: { create: x => x } },
  "../theme": { colors: { accent: "#A89BFF", text: "#F3F0E8" } },
  "./HomeMotion": { MotionView: "MotionView", MotionPressable: "MotionPressable" },
};
const card = load("src/components/AtlasCard.tsx", common);
const continueCard = load("src/components/AtlasContinueCard.tsx", common);
const heroLayout = { padding: 16, gap: 6 };
const hero = card.default({ entranceDelay: 65, style: heroLayout, testID: "identity", children: "content" });
assert.equal(hero.type, "MotionView");
assert.equal(hero.props.entranceDelay, 65);
assert.equal(hero.props.testID, "identity");
assert.equal(hero.props.children, "content");
assert.equal(hero.props.style[0].borderRadius, 22);
assert.equal(hero.props.style[0].borderColor, "#555078");
assert.equal(hero.props.style[0].backgroundColor, "#20243C");
assert.equal(hero.props.style[1], heroLayout);
const pressed = [];
const c = continueCard.default({ testID: "adventure-continue", entranceDelay: 70,
  pressScale: 0.983, disabled: true, onPress: () => pressed.push(1), children: "body" });
assert.equal(c.type, "MotionPressable");
assert.equal(c.props.entranceDelay, 70);
assert.equal(c.props.pressScale, 0.983);
assert.equal(c.props.disabled, true);
assert.equal(c.props.testID, "adventure-continue");
assert.equal(c.props.children, "body");
assert.equal(typeof c.props.onPress, "function");
assert.equal(c.props.style[0].paddingTop, 12);
assert.equal(c.props.style[0].paddingBottom, 13);
assert.equal(c.props.style[0].borderRadius, 18);
assert.equal(c.props.style[0].borderColor, "#6A618C");
assert.equal(continueCard.atlasContinueStyles.progressTrack.height, 8);
assert.equal(continueCard.atlasContinueStyles.progressTrack.borderColor, "#62597D");
assert.equal(continueCard.atlasContinueStyles.action.width, 40);
assert.equal(continueCard.atlasContinueStyles.heading.gap, 8);
assert.equal(continueCard.atlasContinueStyles.body.gap, 10);
assert.equal(continueCard.atlasContinueStyles.eyebrow.fontSize, 9);
for (const screen of ["CategoryScreen.tsx", "SubcategoryScreen.tsx"]) {
  const s = fs.readFileSync("src/screens/" + screen, "utf8");
  assert.match(s, /<AtlasContinueCard\b/);
  assert.match(s, /atlasContinueStyles\.progressTrack/);
  assert.match(s, /atlasContinueStyles\.heading/);
  assert.match(s, /atlasContinueStyles\.body/);
  assert.doesNotMatch(s, /  continueCard: \{/);
}
for (const screen of ["ProfileScreen.tsx", "DailyChallengePreferencesScreen.tsx"]) {
  const s = fs.readFileSync("src/screens/" + screen, "utf8");
  assert.match(s, /<AtlasCard\b/);
}
console.log("Shared Atlas card primitives passed: unchanged visual tokens, native motion hosts, progress tracks and screen integration.");
