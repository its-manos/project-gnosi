/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const named = (tree, id) => nodes(tree).find(node => node.props?.testID === id);
const content = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(content).join("")
    : tree && typeof tree === "object" ? content(tree.props?.children) : "";

let state = [], cursor = 0;
let dimensions = { height: 852, fontScale: 1 };
let adaptiveScroll = false;
const react = {
  useState(initial) {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = typeof initial === "function" ? initial() : initial;
    return [state[slot], value => {
      state[slot] = typeof value === "function" ? value(state[slot]) : value;
    }];
  },
};
const native = {
  ScrollView: "ScrollView", View: "View", Text: "Text",
  StyleSheet: { create: styles => styles },
  useWindowDimensions: () => dimensions,
};
const mocks = {
  react,
  "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
  "react-native": native,
  "../theme": { colors: {
    background: "#0B0D15", text: "#fff", textBody: "#bbc",
    textMuted: "#99a", success: "#51b79c",
  } },
  "../components/ProgressGradientBackground": { __esModule: true, default: "ProgressGradientBackground" },
  "../components/ProfileSectionHeader": {
    __esModule: true, default: "ProfileSectionHeader",
    profileSectionLayout: { horizontal: 18, top: 8, below: 13 },
  },
  "../components/SingleChoiceQuestionCard": { __esModule: true, default: "SingleChoiceQuestionCard" },
  "../components/QuestionStageFooter": { __esModule: true, default: "QuestionStageFooter" },
  "../hooks/useAdaptiveQuestionScroll": { useAdaptiveQuestionScroll: () => ({
    scrollEnabled: adaptiveScroll, onLayout() {}, onContentSizeChange() {},
  }) },
  "../hooks/useQuestionStageAction": { useQuestionStageAction: key => ({
    action: { label: "Επιβεβαίωση →", disabled: true, onPress() {} },
    onActionChange() {},
    questionKey: key,
  }) },
  "../utils/contentReports": { lessonReportTarget: (lesson, questionIndex) => ({
    lessonId: lesson.id, questionIndex,
  }) },
};

function load(file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const js = ts.transpileModule(text, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, {
    module: mod, exports: mod.exports, console,
    require(id) {
      if (id in mocks) return mocks[id];
      throw Error("Unexpected dependency: " + id);
    },
  });
  return mod.exports;
}
const Screen = load("src/screens/ReviewMistakesScreen.tsx").default;
const lesson = {
  id: "demo-lesson", title: "Ένα δοκιμαστικό μάθημα",
  questions: [
    { question: "0?", answers: ["α", "β", "γ", "δ"], correctIndex: 0, explanation: "0 explanation" },
    { question: "1?", answers: ["α", "β", "γ", "δ"], correctIndex: 2, explanation: "1 explanation" },
    { question: "2?", answers: ["α", "β", "γ", "δ"], correctIndex: 1, explanation: "2 explanation" },
  ],
};
let index = 0, selected = null, attempts = [], next = 0, retries = 0, exits = 0;
const props = () => ({
  lesson, indices: [1, 2], index, selected,
  onChoose(answer) { attempts.push(answer); selected = answer; },
  onNext() { next++; index++; selected = null; },
  onRetry() { retries++; selected = null; },
  onBack() { exits++; },
});
const render = () => { cursor = 0; return Screen(props()); };
const element = (tree, type) => nodes(tree).find(node => node.type === type);
let tree = render();
assert.ok(named(tree, "mistake-practice-screen"));
assert.equal(element(tree, "ProfileSectionHeader").props.title, "Εξάσκηση στα λάθη");
assert.ok(element(tree, "ProgressGradientBackground"));
const scroll = named(tree, "mistake-practice-viewport");
assert.equal(scroll.props.scrollEnabled, false, "screen fitting content should not scroll");
assert.ok(scroll.props.onContentSizeChange, "adaptive overflow measurements are wired");
assert.ok(named(tree, "mistake-practice-progress"));
const progress = nodes(tree).find(node => node.props?.accessibilityRole === "progressbar");
assert.equal(progress.props.accessibilityValue.now, 0);
assert.equal(progress.props.accessibilityValue.max, 2);
let question = element(tree, "SingleChoiceQuestionCard");
assert.equal(question.props.question, lesson.questions[1].question);
assert.equal(question.props.questionNumber, 1);
assert.equal(question.props.reportTarget.questionIndex, 1);
assert.ok(question.props.onActionChange, "shared question card owns its confirmation action");
assert.equal(question.props.answer, undefined, "question is initially editable");
assert.equal(question.props.compactAnswered, false);
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Επιβεβαίωση →");
question.props.onConfirm(0);tree = render();
assert.equal(element(tree, "SingleChoiceQuestionCard").props.answer, 0);
assert.equal(element(tree, "SingleChoiceQuestionCard").props.compactAnswered, true);
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Δοκίμασε ξανά →");
const previousKey = element(tree, "SingleChoiceQuestionCard").props.id;
element(tree, "QuestionStageFooter").props.action.onPress();tree = render();
assert.equal(retries, 1);
assert.equal(element(tree, "SingleChoiceQuestionCard").props.answer, undefined);
assert.notEqual(element(tree, "SingleChoiceQuestionCard").props.id, previousKey, "retry must reset internal draft/confirm lock");
element(tree, "SingleChoiceQuestionCard").props.onConfirm(2);tree = render();
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Επόμενη ερώτηση →");
element(tree, "QuestionStageFooter").props.action.onPress();tree = render();
assert.equal(next, 1);
assert.equal(element(tree, "SingleChoiceQuestionCard").props.questionNumber, 2);
assert.equal(element(tree, "SingleChoiceQuestionCard").props.reportTarget.questionIndex, 2);
assert.equal(nodes(tree).find(node => node.props?.accessibilityRole === "progressbar").props.accessibilityValue.now, 1);
element(tree, "SingleChoiceQuestionCard").props.onConfirm(1);tree = render();
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Ολοκλήρωση εξάσκησης →");
element(tree, "QuestionStageFooter").props.action.onPress();tree = render();
assert.equal(next, 2);
assert.ok(named(tree, "mistake-practice-finished"));
assert.equal(element(tree, "SingleChoiceQuestionCard"), undefined);
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Πίσω στα αποτελέσματα");
assert.ok(content(tree).includes("Τα διόρθωσες όλα!"));
assert.ok(content(tree).includes("Το αρχικό σκορ παραμένει ίδιο"));
assert.ok(!content(tree).includes("XP"), "practice never claims rewards");
element(tree, "QuestionStageFooter").props.action.onPress();
assert.equal(exits, 1);
index = 0; selected = null;
adaptiveScroll = true; dimensions = { height: 670, fontScale: 1.4 };tree = render();
assert.equal(named(tree, "mistake-practice-viewport").props.scrollEnabled, true, "overflow must remain scrollable");
tree = Screen({ ...props(), indices: [], index: 0 });
assert.ok(named(tree, "mistake-practice-empty"), "no eligible mistakes has a safe return path");
assert.equal(element(tree, "QuestionStageFooter").props.action.label, "Πίσω στα αποτελέσματα");
assert.deepEqual(attempts, [0, 2, 1]);
console.log("Mistake Practice passed: shared question/feedback/footer, responsive overflow, accessible progress, canonical reporting, wrong retry draft reset, next/finish, original score and zero XP.");
