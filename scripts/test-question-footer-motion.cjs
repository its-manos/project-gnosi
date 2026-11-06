const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");

function mount() {
  let states = [], refs = [], effects = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0;
  let allowed = true;
  let started = 0, stopped = 0;
  const timings = [];
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
  }
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const react = {
    useState(initial) {
      const i = stateIndex++;
      if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], next => {
        states[i] = typeof next === "function" ? next(states[i]) : next;
      }];
    },
    useRef(initial) {
      const i = refIndex++;
      return refs[i] ??= { current: initial };
    },
    useEffect(callback, deps) {
      const i = effectIndex++;
      const previous = effects[i];
      if (previous && deps && deps.every((value, index) => Object.is(value, previous.deps[index]))) return;
      previous?.cleanup?.();
      effects[i] = { deps, cleanup: callback() };
    },
  };
  const Component = load("src/components/QuestionStageFooter.tsx", {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "../play/motion": { usePlayMotion: () => allowed },
    "./ActionButton": { __esModule: true, default: "ActionButton" },
    "react-native": {
      View: "View", StyleSheet: { create: styles => styles },
      Animated: {
        Value, View: "AnimatedView",
        timing: (_value, config) => {
          timings.push(config);
          return { start() {}, stop() {} };
        },
        parallel(animations) {
          assert.equal(animations.length, 2);
          return { start() { started++; }, stop() { stopped++; } };
        },
      },
    },
  }).default;
  function render(action, bottomInset = 0) {
    stateIndex = 0; refIndex = 0; effectIndex = 0;
    return Component({ action, bottomInset });
  }
  const nodes = tree => tree && typeof tree === "object" ?
    [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
  const button = tree => nodes(tree).find(node => node.type === "ActionButton");
  const animated = tree => nodes(tree).find(node => node.type === "AnimatedView");
  return {
    render, button, animated,
    setMotion: value => { allowed = value; },
    info: () => ({ started, stopped, timings }),
    unmount() { effects.forEach(effect => effect.cleanup?.()); },
  };
}

const f = mount();
const confirm = { label: "Επιβεβαίωση →", disabled: false, onPress: () => {} };
const next = { label: "Επόμενη ερώτηση →", disabled: false, onPress: () => {} };
let tree = f.render(null);
assert.equal(f.info().started, 0, "blank first paint should not animate");
assert.equal(f.button(tree).props.disabled, true);
tree = f.render(confirm);
assert.equal(f.info().started, 0, "registering confirm should not pulse");
assert.equal(f.button(tree).props.disabled, false);
tree = f.render({ ...confirm, disabled: true });
assert.equal(f.info().started, 0, "disabling confirmation stays quiet");
tree = f.render(next, 26);
assert.equal(f.info().started, 1, "confirm-to-continue gets exactly one transition");
assert.deepEqual(f.info().timings.map(t => t.duration), [165, 195]);
assert.ok(f.info().timings.every(t => t.useNativeDriver && t.isInteraction === false),
  "transition must run on native driver without deferring touch interactions");
assert.equal(tree.props.style[1].paddingBottom, 26, "safe area remains correct");
assert.equal(f.animated(tree).props.style[1].opacity.value, 0.82);
assert.equal(f.animated(tree).props.style[1].transform[0].translateY.value, 4);
tree = f.render({ ...next, onPress: () => {} });
assert.equal(f.info().started, 1, "callback identity and label repeats do not animate");
tree = f.render(confirm);
assert.equal(f.info().started, 2, "next question resets button purpose smoothly");
assert.ok(f.info().stopped >= 1, "previous animation cleans up");
f.setMotion(false);
tree = f.render(next);
assert.equal(f.info().started, 2, "reduced motion skips new animations");
assert.equal(f.animated(tree).props.style[1].opacity.value, 1);
assert.equal(f.animated(tree).props.style[1].transform[0].translateY.value, 0);
assert.equal(tree.props.style[1].paddingBottom, 12, "bottom inset retains a sensible floor");
f.unmount();
const ready = mount();
ready.render({ ...confirm, disabled: true });
assert.equal(ready.info().started, 0, "a new disabled action stays still");
tree = ready.render(confirm);
assert.equal(ready.info().started, 1, "enabling confirmation gives a quiet cue");
assert.equal(ready.animated(tree).props.style[1].opacity.value, 0.9);
assert.equal(ready.animated(tree).props.style[1].transform[0].translateY.value, 2);
ready.render({ ...confirm });
assert.equal(ready.info().started, 1, "a ready action does not repeat its cue");
ready.setMotion(false);
ready.render({ ...confirm, disabled: true });
ready.render(confirm);
assert.equal(ready.info().started, 1, "reduced motion suppresses the ready cue");
ready.unmount();
console.log("Question footer motion passed: confirmation readiness, purpose transitions, safe-area and reduced-motion behavior.");
