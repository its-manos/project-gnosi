const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

function fixture() {
  let effect, resolve, reject, listener;
  let started = 0, stopped = 0, removed = 0;
  const timings = [];
  const pending = new Promise((a, b) => { resolve = a; reject = b; });
  class Value {
    constructor(n) { this.n = n; }
    setValue(n) { this.n = n; }
  }
  const jsx = (type, props) => ({ type, props });
  const Component = load("src/components/QuizReveal.tsx", {
    "../play/motion": { usePlayMotion: () => true },
    react: {
      useState: initializer => [initializer(), () => {}],
      useEffect: callback => { effect = callback; },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Animated: {
        Value, View: "AnimatedView",
        timing: (_value, config) => {
          timings.push(config);
          return { start() {}, stop() {} };
        },
        parallel: animations => {
          assert.equal(animations.length, 2);
          return { start() { started++; }, stop() { stopped++; } };
        },
      },
      AccessibilityInfo: {
        isReduceMotionEnabled: () => pending,
        addEventListener: (event, fn) => {
          assert.equal(event, "reduceMotionChanged");
          listener = fn;
          return { remove() { removed++; } };
        },
      },
    },
  }).default;
  const tree = Component({ children: "quiz" });
  const cleanup = effect();
  return {
    tree, resolve, reject, cleanup, change: value => listener(value),
    state: () => ({ started, stopped, removed, timings }),
  };
}

(async () => {
  let f = fixture();
  assert.equal(f.tree.props.style.opacity.n, 1);
  assert.equal(f.tree.props.style.transform[0].translateY.n, 0);
  f.resolve(false);
  await flush();
  assert.equal(f.state().started, 1);
  assert.deepEqual(f.state().timings.map(c => c.duration), [210, 260]);
  assert.ok(f.state().timings.every(c => c.useNativeDriver === true && c.isInteraction === false));
  f.change(true);
  assert.equal(f.tree.props.style.opacity.n, 1);
  assert.equal(f.tree.props.style.transform[0].translateY.n, 0);
  assert.ok(f.state().stopped > 0);
  f.cleanup();
  assert.equal(f.state().removed, 1);

  f = fixture(); f.resolve(true); await flush();
  assert.equal(f.state().started, 0); f.cleanup();
  f = fixture(); f.cleanup(); f.resolve(false); await flush();
  assert.equal(f.state().started, 0, "unmounted panels never start");
  f = fixture(); f.change(true); f.resolve(false); await flush();
  assert.equal(f.state().started, 0, "latest reduced-motion event wins");
  f.cleanup();
  f = fixture(); f.reject(Error("unsupported")); await flush();
  assert.equal(f.tree.props.style.opacity.n, 1);
  assert.equal(f.tree.props.style.transform[0].translateY.n, 0);
  assert.equal(f.state().started, 0); f.cleanup();
  console.log("Quiz reveal passed: native fade and lift, reduced motion, query/event race, cleanup and fallback.");
})().catch(error => { console.error(error); process.exitCode = 1; });
