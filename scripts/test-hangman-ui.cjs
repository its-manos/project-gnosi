/* Execute the actual screen with a deterministic hook/native harness.
 * These checks cover interactions and semantics, not native Yoga layout. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(__dirname, "..");
const hooks = [], effects = [], cues = [], scrollCalls = [];
let hookIndex = 0, height = 900, reduced = false;
const jsx = (type, props) => ({ type, props: props || {} });
const react = {
  useState(initial) {
    const i = hookIndex++;
    if (!(i in hooks)) hooks[i] = typeof initial === "function" ? initial() : initial;
    return [hooks[i], value => { hooks[i] = typeof value === "function" ? value(hooks[i]) : value; }];
  },
  useRef(initial) {
    const i = hookIndex++;
    if (!(i in hooks)) hooks[i] = { current: initial };
    return hooks[i];
  },
  useEffect(fn, deps) {
    const i = hookIndex++, prior = hooks[i];
    if (!prior || deps.some((d, j) => d !== prior.deps[j])) {
      effects.push(() => { prior?.cleanup?.(); hooks[i] = { deps, cleanup: fn() }; });
    }
  },
};
const animationCalls = [], cancelled = [];
const reanimated = {
  __esModule: true,
  default: { View: "AnimatedView", createAnimatedComponent: type => type },
  useReducedMotion: () => reduced,
  useSharedValue: value => react.useRef({ value }).current,
  useAnimatedStyle: fn => fn(), useAnimatedProps: fn => fn(),
  withTiming: (value, options) => { animationCalls.push({ value, options }); return value; },
  withSequence: (...values) => values.at(-1),
  cancelAnimation: value => cancelled.push(value),
};
const native = {
  ScrollView: "ScrollView", View: "View", Text: "Text",
  StyleSheet: { create: styles => styles }, useWindowDimensions: () => ({ height }),
};
const imports = {
  react, "react/jsx-runtime": { jsx, jsxs: jsx }, "react-native": native,
  "react-native-reanimated": reanimated,
  "react-native-svg": { __esModule: true, default: "svg", Circle: "circle", G: "g", Path: "path" },
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 20 }) },
};
const componentStubs = ["ProfileSectionHeader", "ProgressGradientBackground", "AtlasContinueCard", "HangmanFigure", "HangmanFeedbackMotion"];
for (const name of componentStubs) imports[`../components/${name}`] = { __esModule: true, default: name };
imports["../components/ProfileSectionHeader"].profileSectionLayout = { horizontal: 18, top: 8, below: 13 };
imports["../components/AtlasContinueCard"].atlasContinueStyles = { title: {} };
imports["../components/HomeMotion"] = { MotionPressable: "Pressable", MotionView: "MotionView" };
imports["../play/soundStatus"] = { requestPracticeCue: cue => cues.push(cue) };
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  Function("module", "exports", "require", code)(module, module.exports, id => {
    if (id in imports) return imports[id];
    const resolved = path.join(path.dirname(file), id);
    return load(fs.existsSync(path.join(root, resolved + ".ts")) ? resolved + ".ts" : resolved + ".tsx");
  });
  return module.exports;
}
const engine = load("src/games/hangman/engine.ts");
const Screen = load("src/screens/HangmanScreen.tsx").default;
const nodes = tree => tree && typeof tree === "object" ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const find = id => nodes(tree).find(node => node.props.testID === id);
let homes = 0, tree;
function render() {
  hookIndex = 0;
  tree = Screen({ onHome: () => homes++ });
  while (effects.length) effects.shift()();
  return tree;
}
function key(letter) { return find(`hangman-key-${letter}`); }
function reset() { hooks.length = 0; effects.length = 0; }
const realRandom = Math.random; Math.random = () => 0.5;
render();
assert.equal(cues.at(-1), "question-open");
assert.equal(nodes(tree).filter(n => n.type === "Pressable").length, 24);
assert.ok(nodes(tree).filter(n => n.type === "Pressable").every(n => n.props.style[0].minHeight >= 44 && n.props.style[0].minWidth >= 44));
assert.equal(find("hangman-status").props.accessibilityLiveRegion, "polite");
assert.ok(!find("hangman-result"));
const scroll = find("hangman-scroll");
assert.equal(scroll.props.contentContainerStyle.at(-1).paddingBottom, 36);
assert.equal(scroll.props.contentContainerStyle[0].maxWidth, 620);
scroll.props.ref.current = { scrollTo: options => scrollCalls.push(options) };
const staleKey = key("Α");
staleKey.props.onPress(); staleKey.props.onPress();
assert.equal(hooks[0].guesses.length, 1, "synchronous ref rejects a double tap before rerender");
assert.equal(cues.length, 2, "only one feedback sound for the accepted tap");
render();
assert.equal(key("Α").props.disabled, true);
assert.equal(key("Α").props.accessibilityState.disabled, true);
const word = engine.normalizeGreek(hooks[0].word.word);
for (const letter of new Set(word)) {
  if (!hooks[0].guesses.includes(letter)) key(letter).props.onPress();
  render();
}
assert.equal(engine.hangmanStatus(hooks[0]), "won");
assert.ok(find("hangman-result"));
assert.ok(!find("hangman-keyboard"));
assert.ok(find("hangman-word").props.accessibilityLabel.endsWith([...word].join(", ")));
assert.equal(cues.at(-1), "complete");
const next = find("hangman-next");
next.props.onPress(); next.props.onPress();
assert.equal(hooks[0].round, 2, "double Next does not skip a word");
staleKey.props.onPress();
assert.equal(hooks[0].guesses.length, 0, "old keyboard cannot answer the next word");
render();
assert.equal(cues.at(-1), "question-open");
assert.deepEqual(scrollCalls.at(-1), { y: 0, animated: false });
assert.equal(hooks[0].wins, 1);
const newWord = engine.normalizeGreek(hooks[0].word.word);
for (const l of [...engine.GREEK_ALPHABET].filter(l => !newWord.includes(l)).slice(0, 6)) { key(l).props.onPress(); render(); }
assert.equal(engine.hangmanStatus(hooks[0]), "lost");
assert.ok(find("hangman-result"));
assert.ok(!find("hangman-keyboard"));
assert.ok(find("hangman-status").props.children.includes(hooks[0].word.word));
assert.equal(hooks[0].wins, 1);
const tiles = nodes(find("hangman-word")).filter(n => n.type === "MotionView");
assert.equal(tiles.length, newWord.length);
for (const [i, tile] of tiles.entries()) {
  assert.equal(tile.props.children.props.children, newWord[i], "loss reveals every letter");
  assert.equal(tile.props.children.props.accessible, false, "the word is announced as a single accessible phrase");
}
nodes(tree).find(n => n.type === "ProfileSectionHeader").props.onAction();
assert.equal(homes, 1);
height = 640; render();
assert.ok(find("hangman-scroll").props.contentContainerStyle[1]);
assert.equal(nodes(tree).find(n => n.type === "HangmanFigure").props.size, 116);
Math.random = realRandom;

// Run the real feedback motion to check reduced motion and cleanup.
reset();
const Feedback = load("src/components/HangmanFeedbackMotion.tsx").default;
function renderMotion(props) { hookIndex = 0; Feedback(props); while (effects.length) effects.shift()(); }
renderMotion({ mistakes: 0, won: false });
assert.equal(animationCalls.length, 0);
renderMotion({ mistakes: 1, won: false });
assert.equal(animationCalls.length, 4, "a new mistake runs a short shake");
renderMotion({ mistakes: 1, won: true });
assert.equal(animationCalls.length, 6, "a win runs one celebration");
reduced = true;
renderMotion({ mistakes: 2, won: true });
assert.equal(animationCalls.length, 6, "reduced motion disables shake and celebration");
assert.ok(cancelled.length >= 3);
reset();
const Figure = load("src/components/HangmanFigure.tsx").default;
const figureTree = Figure({ mistakes: 0 });
assert.equal(figureTree.props.accessible, false);
const strokes = nodes(figureTree).filter(n => typeof n.type === "function");
assert.equal(strokes.length, 6);
function renderStroke(visible) { hookIndex = 0; const result = strokes[0].type({ visible }); while (effects.length) effects.shift()(); return result; }
renderStroke(false);
const before = animationCalls.length;
renderStroke(true);
assert.equal(animationCalls.length, before, "drawing reveal also respects reduced motion");
reduced = false;
renderStroke(false);
assert.equal(animationCalls.at(-1).value, 0);
renderStroke(true);
assert.equal(animationCalls.at(-1).value, 1);
assert.equal(animationCalls.at(-1).options.duration, 240);
console.log("Hangman UI: keyboard, rapid/stale taps, results, audio, safe area, compact mode and reduced-motion animations passed.");
