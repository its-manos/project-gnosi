/* Footer actions are presentation-only. Cards keep confirmation guards, the
 * screen anchors the action, and new questions must not inherit stale taps. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "..");
const source = file => fs.readFileSync(path.join(root, file), "utf8");
const compiled = file => ts.transpileModule(source(file), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const jsx = (type, props) => ({ type, props: props ?? {} });
const native = { View: "View", Text: "Text", Pressable: "Pressable",
  StyleSheet: { create: styles => styles } };
const theme = { colors: {
  surface: "#222", surfaceRaised: "#333", border: "#555", borderStrong: "#666",
  background: "#111", accentLight: "#baf", accent: "#baf", accentSurface: "#324",
  text: "#fff", textBody: "#ddd", textMuted: "#aaa", success: "#4c9",
  successSurface: "#142", error: "#f77", errorSurface: "#412",
} };
const compile = (file, imports) => {
  const mod = { exports: {} };
  vm.runInNewContext(compiled(file), { module: mod, exports: mod.exports,
    require: name => {
      if (!(name in imports)) throw Error("unexpected import from " + file + ": " + name);
      return imports[name];
    } });
  return mod.exports;
};
const styles = compile("src/components/questionCardStyles.ts",
  { "react-native": native, "../theme": theme }).questionCardStyles;
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const id = (tree, name) => nodes(tree).find(node => node.props?.testID === name);

/** Model useEffect dependency equality instead of resetting each card's draft. */
function runner() {
  let states = [], refs = [], effects = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0;
  const react = {
    useState: value => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof value === "function" ? value() : value;
      return [states[index], next => {
        states[index] = typeof next === "function" ? next(states[index]) : next;
      }];
    },
    useRef: value => {
      const index = refIndex++;
      return refs[index] ??= { current: value };
    },
    useEffect: (callback, deps) => {
      const index = effectIndex++;
      const old = effects[index];
      const changed = !old || !deps || deps.some((dep, i) => !Object.is(dep, old.deps[i]));
      if (changed) {
        old?.cleanup?.();
        effects[index] = { deps, cleanup: callback() };
      }
    },
    useCallback: value => value,
  };
  return { react, render(Component, props) {
    stateIndex = 0; refIndex = 0; effectIndex = 0;
    return Component(props);
  } };
}
const fixtures = [
  ["SingleChoiceQuestionCard", { id: "choice", question: "Δείγμα;", answers: ["Α", "Β"],
    correctIndex: 1, explanation: "Εξήγηση.", questionNumber: 1, onConfirm: () => {} },
    "single-choice-confirm", "single-choice-option-0", true],
  ["MultipleSelectQuestionCard", { question: { id: "multi", version: "1", prompt: "Επίλεξε",
    content: { answers: ["Α", "Β"], correctIndices: [0] } }, questionNumber: 1, onSubmit: () => {} },
    "multiple-select-confirm", "multiple-select-option-0", true],
  ["OrderingQuestionCard", { question: { id: "order", version: "1", prompt: "Σειρά",
    content: { items: [{ id: "a", label: "Α" }, { id: "b", label: "Β" }], correctOrder: ["b", "a"] } },
    questionNumber: 1, onSubmit: () => {} },
    "ordering-confirm", "ordering-down-a", false],
  ["MatchingQuestionCard", { question: { id: "match", version: "1", prompt: "Ζεύγη",
    content: { pairs: [{ leftId: "a", leftLabel: "Α", rightId: "b", rightLabel: "Β" }] } },
    questionNumber: 1, onSubmit: () => {} },
    "matching-confirm", "matching-left-a", true],
  ["SpotMistakeQuestionCard", { question: { id: "spot", version: "1", prompt: "Το θέμα",
    content: { options: [{ id: "a", text: "Α" }, { id: "b", text: "Β" }],
      incorrectOptionId: "a", correction: "Σωστό" } }, questionNumber: 1, onSubmit: () => {} },
    "spot-mistake-confirm", "spot-mistake-option-a", true],
  ["FillBlankQuestionCard", { question: { id: "fill", version: "1", prompt: "Συμπλήρωσε",
    content: { before: "Πριν", after: ".", options: [{ id: "a", text: "Α" }, { id: "b", text: "Β" }],
      correctOptionId: "a" } }, questionNumber: 1, onSubmit: () => {} },
    "fill-blank-confirm", "fill-blank-option-a", true],
];
for (const [name, props, confirmId, firstChoiceId, initiallyDisabled] of fixtures) {
  const hooks = runner();
  const Component = compile("src/components/" + name + ".tsx", {
    react: hooks.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": native, "../theme": theme,
    "../play/motion": { AnswerMotion: "AnswerMotion" },
    "../quiz/engine": { evaluateAnswer: () => ({ correct: false }) },
    "./QuizReveal": { __esModule: true, default: "QuizReveal" },
    "./ReportContentButton": { __esModule: true, default: "ReportContentButton" },
    "./questionCardStyles": { questionCardStyles: styles },
  }).default;
  let footerAction = null;
  const onActionChange = action => { footerAction = action; };
  const render = () => hooks.render(Component, { ...props, onActionChange });
  let tree = render();
  assert.equal(id(tree, confirmId), undefined, name + " has no duplicate inline confirmation");
  assert.ok(footerAction && typeof footerAction.onPress === "function", name + " registers footer");
  assert.equal(footerAction.disabled, initiallyDisabled, name + " exposes correct initial enabled state");
  if (name !== "OrderingQuestionCard" && name !== "MatchingQuestionCard") {
    const choice = id(tree, firstChoiceId);
    assert.ok(choice, "first option exists for " + name);
    choice.props.onPress();
    tree = render();
    assert.equal(footerAction.disabled, false, name + " enables confirmation after draft");
  }
}

const hooks = runner();
const { useQuestionStageAction } = compile("src/hooks/useQuestionStageAction.ts", {
  react: hooks.react,
}).useQuestionStageAction ? compile("src/hooks/useQuestionStageAction.ts", {react:hooks.react}) : {};
assert.equal(typeof useQuestionStageAction, "function");
let stage = hooks.render(useQuestionStageAction, "q1");
assert.equal(stage.action, null);
const onFirst = stage.onActionChange;
const action = { label: "Confirm", disabled: false, onPress: () => {} };
onFirst(action);
stage = hooks.render(useQuestionStageAction, "q1");
assert.equal(stage.action, action, "same question sees registered action");
stage = hooks.render(useQuestionStageAction, "q2");
assert.equal(stage.action, null, "new question never sees previous confirmation");
stage.onActionChange({ label: "Next", disabled: false, onPress: () => {} });
stage = hooks.render(useQuestionStageAction, "q2");
assert.equal(stage.action.label, "Next");
onFirst(null);
stage = hooks.render(useQuestionStageAction, "q2");
assert.equal(stage.action, null, "cleanup cannot leave a stale tap visible");

console.log("Question footer passed: all six formats register actions, no duplicate CTA, and question keys clear old actions.");
