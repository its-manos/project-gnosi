/* UI-state contract for both cover and inline image captions. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

let states = [];
let nextState = 0;
const useState = initial => {
  const i = nextState++;
  if (!(i in states)) states[i] = initial;
  return [states[i], change => { states[i] = typeof change === "function" ? change(states[i]) : change; }];
};
const jsx = (type, props) => ({ type, props });
const mod = { exports: {} };
const filename = path.join(__dirname, "..", "src/components/ExpandableImageCaption.tsx");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(code, {
  module: mod, exports: mod.exports,
  require: id => ({
    react: { useState },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Pressable: "Pressable", Text: "Text", View: "View", StyleSheet: { create: x => x } },
    "../theme": { reading: { muted: "#BAC5D5", accent: "#C9BEFF" } },
  }[id] ?? (() => { throw Error("Unexpected import: " + id); })()),
});
const Caption = mod.exports.default;
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)]
  : [];
const render = caption => { nextState = 0; return Caption({ caption }); };
const getMeasure = tree => nodes(tree).find(node => node.type === "Text" && node.props.onTextLayout);
const getToggle = tree => nodes(tree).find(node => node.props.testID === "reader-image-description-toggle");

states = [];
let tree = render("Σύντομη περιγραφή της εικόνας.");
assert.ok(tree && !getToggle(tree), "Short descriptions have no clutter.");
assert.equal(nodes(tree).filter(node => node.type === "Text" && !node.props.onTextLayout)[0].props.numberOfLines, 2);
const measurement = getMeasure(tree);
assert.equal(measurement.props.accessible, false);
const measureView = nodes(tree).find(node => node.type === "View" && node.props.importantForAccessibility === "no-hide-descendants");
assert.ok(measureView);
assert.equal(measureView.props.pointerEvents, "none", "Hidden measurements cannot intercept taps");
assert.equal(measureView.props.accessibilityElementsHidden, true, "Hidden measurements must not be read twice on iOS");
measurement.props.onTextLayout({ nativeEvent: { lines: [{}, {}] } });
tree = render("Σύντομη περιγραφή της εικόνας.");
assert.equal(getToggle(tree), undefined);

states = [];
const long = "Μεγάλη περιγραφή της εικόνας με ιστορικές λεπτομέρειες που αξίζει να διαβάσει ο χρήστης.";
tree = render(long);
getMeasure(tree).props.onTextLayout({ nativeEvent: { lines: [{}, {}, {}, {}] } });
tree = render(long);
let toggle = getToggle(tree);
assert.ok(toggle, "Long captions reveal a toggle.");
assert.equal(toggle.props.accessibilityState.expanded, false);
assert.equal(toggle.props.accessibilityLabel, "Εμφάνιση πλήρους περιγραφής εικόνας");
toggle.props.onPress();
tree = render(long);
assert.equal(getToggle(tree).props.accessibilityState.expanded, true);
assert.equal(getToggle(tree).props.accessibilityLabel, "Σύμπτυξη περιγραφής εικόνας");
assert.equal(nodes(tree).find(node => node.type === "Text" && !node.props.onTextLayout).props.numberOfLines, undefined);
getToggle(tree).props.onPress();
tree = render(long);
assert.equal(getToggle(tree).props.accessibilityState.expanded, false);

// A narrower/wider layout can change whether a caption overflows.
getMeasure(tree).props.onTextLayout({ nativeEvent: { lines: [{}] } });
tree = render(long);
assert.equal(getToggle(tree), undefined);
assert.equal(render("  "), null, "Empty captions render nothing.");
console.log("Expandable image captions passed: short/long text, accessibility, expansion and responsive reflow.");
