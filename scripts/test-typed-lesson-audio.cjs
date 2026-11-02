/* Dev lesson pilot audio/answer regression. React Native views and native sound
 * player are mocked. Exercise actual quiz projections and the component's UI
 * callbacks without awarding XP or storing learning progress.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "..");
require.extensions[".ts"] = (mod, filename) => {
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  mod._compile(js, filename);
};
const data = require(path.join(root, "src/data/lessons.ts"));
const adapters = require(path.join(root, "src/quiz/adapters.ts"));
const engine = require(path.join(root, "src/quiz/engine.ts"));
const jsx = (type, props) => ({ type, props: props ?? {} });
let states = [], refs = [], nextState = 0, nextRef = 0;
const react = {
  useMemo: fn => fn(),
  useState: initial => {
    const slot = nextState++;
    if (!(slot in states)) states[slot] = typeof initial === "function" ? initial() : initial;
    return [states[slot], next => {
      states[slot] = typeof next === "function" ? next(states[slot]) : next;
    }];
  },
  useRef: initial => {
    const slot = nextRef++;
    if (!(slot in refs)) refs[slot] = { current: initial };
    return refs[slot];
  },
};
const cues = [];
const imports = {
  react,
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { ScrollView: "ScrollView", Text: "Text", View: "View", StyleSheet: { create: x => x } },
  "../components/ActionButton": { __esModule: true, default: "ActionButton" },
  "../data/lessons": data,
  "../quiz/adapters": adapters,
  "../quiz/engine": engine,
  "../play/soundStatus": { requestPracticeCue: kind => cues.push(kind) },
  "../theme": { colors: { text: "#fff", accentLight: "#ddd", textBody: "#ccc" } },
  "./ReaderLessonScreen": { __esModule: true, default: "ReaderLessonScreen" },
};
const moduleRef = { exports: {} };
const source = fs.readFileSync(path.join(root, "src/screens/DevTypedLessonPilotScreen.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(compiled, {
  module: moduleRef, exports: moduleRef.exports, Promise,
  require: id => {
    if (!(id in imports)) throw Error("unexpected pilot import: " + id);
    return imports[id];
  },
});
const Pilot = moduleRef.exports.default;
const render = () => {
  nextState = 0; nextRef = 0;
  return Pilot({ onBack: () => {} });
};
const nodes = tree => tree && typeof tree === "object"
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const view = () => {
  const tree = render();
  assert.equal(tree.type, "ReaderLessonScreen", "pilot uses the real article reader interface");
  assert.equal(tree.props.enableReporting, false);
  assert.equal(tree.props.bookmarksLoaded, false);
  return tree.props;
};
const r = view();
assert.equal(cues.length, 0, "the pilot opens silently");
assert.equal("store" in r, false, "no learning-store reference in pilot props");
r.onFinishLesson();
assert.equal(cues.length, 0, "incomplete pilot cannot play a completion cue");
const typed = index => adapters.adaptInteractiveLessonQuestion(r.lesson, index);
const confirms = [
  [0, [0, 2], "correct"],
  [1, ["classical", "mycenaean", "geometric"], "incorrect"],
  [2, { assembly: "citizens", council: "prepares", heliaia: "court" }, "correct"],
];
for (const [index, value, cue] of confirms) {
  const question = typed(index);
  const projection = adapters.projectInteractiveLessonAnswer(r.lesson, index, value);
  assert.ok(engine.evaluateAnswer(question, value).valid);
  const baseline = cues.length;
  r.onAnswerCheckpoint(index, projection, r.lesson.questions[index].correctIndex, value);
  assert.deepEqual(cues.slice(baseline), [cue], "only the accepted confirmation plays a cue");
  r.onAnswerCheckpoint(index, projection, r.lesson.questions[index].correctIndex, value);
  assert.equal(cues.length, baseline + 1, "duplicate confirmations are silent");
  const next = view();
  assert.equal(next.checkpointAnswers[index], projection);
  assert.deepEqual(JSON.parse(JSON.stringify(next.typedCheckpointAnswers[index].value)), value);
  assert.equal(next.typedCheckpointAnswers[index].questionVersion, question.version);
}
const check = view();
check.onFinishLesson();
check.onFinishLesson();
assert.deepEqual(cues, ["correct", "incorrect", "correct", "complete"],
  "success/failure sound and one completion cue follow committed actions only");
assert.equal(render().type, "ScrollView", "completion shows a sandbox-only result screen");
assert.equal(source.includes("emitPlayFeedback"), false, "never emit rewarded gameplay events from the pilot");
assert.equal(source.includes("store.answer"), false, "never write learning progress from the pilot");
const host = fs.readFileSync(path.join(root, "src/play/PlayFeedback.tsx"), "utf8");
assert.ok(host.includes("subscribePracticeCue") && host.includes("playPreferences.getSnapshot()"),
  "native sound host receives practice cues and honours device preferences");
console.log("Typed lesson pilot audio passed: accepted correct/wrong cues, no sound on setup, double-submit guard, one completion cue, no XP/storage writes and existing audio host.");
