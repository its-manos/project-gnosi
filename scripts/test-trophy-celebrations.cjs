const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const events = load('src/play/trophyEvents.ts');
const jsx = (type, props) => ({ type, props });
const nodes = node => node && typeof node === 'object' ? [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : '';
function harness() {
  let slots = [], index = 0, effects = [];
  return { react: {
    useState: init => { const n = index++; if (!(n in slots)) slots[n] = typeof init === 'function' ? init() : init; return [slots[n], value => { slots[n] = typeof value === 'function' ? value(slots[n]) : value; }]; },
    useRef: init => { const n = index++; return slots[n] ??= { current: init }; },
    useEffect: (fn, deps) => { const n = index++; if (!slots[n] || deps.some((d, j) => d !== slots[n].deps[j])) effects.push(() => { slots[n]?.cleanup?.(); slots[n] = { deps, cleanup: fn() }; }); },
  }, render: fn => { index = 0; const result = fn(); const pending = effects; effects = []; pending.forEach(fn => fn()); return result; }, cleanup: () => slots.forEach(s => s?.cleanup?.()) };
}
let animations = 0, appState, motion = false;
class Value { setValue() {} interpolate(config) { return config; } }
const animation = () => ({ start() { animations++; }, stop() {} });
const h = harness();
const Component = load('src/play/TrophyCelebrations.tsx', {
  react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: x => x }, Animated: { Value, View: 'Animated', timing: animation, sequence: animation, delay: animation }, AppState: { currentState: 'active', addEventListener: (_, fn) => { appState = fn; return { remove() {} }; } } },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20 }) },
  '../state/LearningSession': { useLearningSession: () => ({ store }) },
  '../components/TrophyIcon': { __esModule: true, default: 'TrophyIcon' },
  './motion': { usePlayMotion: () => motion },
}).default;
const store = { userId: 'one' };
const render = () => h.render(() => Component({ children: 'app' }));
(async () => {
let tree = render();
assert.equal(nodes(tree).some(n => n.props?.testID === 'trophy-celebration'), false);
events.announceTrophyCrossings('other', { lessons: 0 }, { lessons: 1 });
tree = render(); assert.ok(!text(tree).includes('Ανακαλύψεις'));
events.announceTrophyCrossings('one', { lessons: 0, worlds: 0 }, { lessons: 1, worlds: 1 });
tree = render();
assert.ok(text(tree).includes('2 νέες διακρίσεις!'));
assert.ok(text(tree).includes('Ανακαλύψεις I'));
const overlay = nodes(tree).find(n => n.props?.testID === 'trophy-celebration');
assert.equal(overlay.props.pointerEvents, 'none');
assert.equal(overlay.props.style[1].top, 32);
assert.deepEqual(Array.from(overlay.props.style[1].transform), [], 'Reduced motion is static');
assert.equal(animations, 0);
motion = true; tree = render(); assert.equal(animations, 1);
appState('background'); tree = render(); assert.ok(!text(tree).includes('Νέα διάκριση'));
events.announceTrophyCrossings('one', { hangman: 0 }, { hangman: 1 });
tree = render(); assert.ok(!nodes(tree).some(n => n.props?.testID === 'trophy-celebration'));
appState('active');
events.announceTrophyCrossings('one', { lessons: 0 }, { lessons: 1 });
tree = render(); assert.ok(!nodes(tree).some(n => n.props?.testID === 'trophy-celebration'), 'Same trophy is not replayed');
events.announceTrophyCrossings('one', { lessons: 1 }, { lessons: 5 });
tree = render(); assert.ok(text(tree).includes('Ανακαλύψεις II'));
await new Promise(resolve => setTimeout(resolve, 2900));
tree = render();
assert.ok(!nodes(tree).some(n => n.props?.testID === 'trophy-celebration'), 'Banner dismisses automatically');
h.cleanup();
console.log('Trophy celebration scope, deduplication, grouped milestones, background handling and reduced-motion checks passed');

})().catch(error => { console.error(error); h.cleanup(); process.exitCode = 1; });
