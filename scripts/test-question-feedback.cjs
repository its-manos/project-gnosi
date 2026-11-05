const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/components/QuestionFeedbackPanel.tsx"), "utf8");
const jsx = (type, props) => ({ type, props: props ?? {} });
let states = [], index = 0;
const react = { useState(initial) {
  const i = index++;
  if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
  return [states[i], next => { states[i] = typeof next === "function" ? next(states[i]) : next; }];
} };
const native = { View: "View", Text: "Text", Pressable: "Pressable", StyleSheet: { create: value => value } };
const loadedModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText, { module: loadedModule, exports: loadedModule.exports, require: name => {
  if (name === "react") return react;
  if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
  if (name === "react-native") return native;
  if (name === "../theme") return { colors: { success: "#4A9", error: "#F77", accentLight: "#BAF", text: "#FFF", textMuted: "#AAA", textBody: "#DDD" } };
  throw Error("unexpected feedback import " + name);
} });
const { default: Panel, explanationTeaser } = loadedModule.exports;
const nodes = t => t && typeof t === "object" ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
const byId = (t, label) => nodes(t).find(n => n.props?.testID === label);
const render = props => { index = 0; return Panel(props); };
let short = render({ testID: "short", correct: true, explanation: "Σύντομη εξήγηση." });
assert.equal(byId(short,"short-explanation").props.children,"Σύντομη εξήγηση.");
assert.equal(byId(short,"short-toggle"),undefined,"brief reasons never get a redundant toggle");
const long = "Η πρώτη εξήγηση είναι αρκετά σημαντική για να διαβαστεί σωστά. " +
  "Ακολουθούν περισσότερες ιστορικές λεπτομέρειες για τον τρόπο λειτουργίας του θεσμού, " +
  "τις εξαιρέσεις και το χρονικό πλαίσιο, που πρέπει πάντα να παραμένουν διαθέσιμες.";
assert.equal(explanationTeaser("Κείμενο."),"Κείμενο.");
assert.ok(explanationTeaser(long).length < long.length,"long authored text is previewed, not deleted");
assert.ok(explanationTeaser(long).includes("Η πρώτη εξήγηση"));
const chosen = jsx("Text",{children:"Η επιλογή σου"});
const answer = jsx("Text",{children:"Η σωστή επιλογή"});
states = []; index = 0;
let t = render({ testID:"detail", correct:false, explanation:long, selection:chosen, solution:answer, readingSize:24 });
assert.equal(byId(t,"detail").props.style[0].borderRadius,17,"result uses lightweight shared surface");
assert.equal(byId(t,"detail-selection").props.children[1],chosen);
assert.equal(byId(t,"detail-solution").props.children[1],answer);
assert.equal(byId(t,"detail-explanation").props.children,explanationTeaser(long));
assert.equal(byId(t,"detail-explanation").props.style[1].fontSize,22,"reader type scaling preserved");
let toggle = byId(t,"detail-toggle");
assert.equal(toggle.props.accessibilityRole,"button");
assert.equal(toggle.props.accessibilityState.expanded,false);
toggle.props.onPress();
t=render({testID:"detail",correct:false,explanation:long,selection:chosen,solution:answer,readingSize:24});
assert.equal(byId(t,"detail-explanation").props.children,long,"full authored text available after one tap");
assert.equal(byId(t,"detail-toggle").props.accessibilityState.expanded,true);
byId(t,"detail-toggle").props.onPress();
t=render({testID:"detail",correct:false,explanation:long,selection:chosen,solution:answer});
assert.equal(byId(t,"detail-explanation").props.children,explanationTeaser(long),"learner can collapse full explanation");
assert.equal(explanationTeaser("α".repeat(240)).length < 240,true,
  "unbroken strings still produce a short teaser");
console.log("Feedback panel passed: one status, correct-answer reveal, Greek teaser, one-tap full explanation, accessibility and text scale.");
