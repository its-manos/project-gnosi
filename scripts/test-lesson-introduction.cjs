const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const { load } = require('./helpers/load-typescript.cjs');
const source = fs.readFileSync('src/components/LessonIntroductionModal.tsx', 'utf8');
function harness(reduced = false, ok = true) {
  const slots = []; let cursor = 0, starts = 0, dismissals = 0, effects = [];
  const durations = [], cues = [];
  const jsx = (type, props) => ({ type, props });
  const react = {
    useMemo: fn => fn(),
    useEffect: (fn, deps) => {
      const i = cursor++;
      if (!slots[i] || deps.some((d,j)=>d!==slots[i].deps[j])) {
        const previous=slots[i];slots[i]={deps};
        effects.push(()=>{previous?.cleanup?.();slots[i].cleanup=fn();});
      }
    },
    useRef: initial => { const i = cursor++; return slots[i] ??= { current: initial }; },
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], v => { slots[i] = v; }]; },
  };
  const native = Object.fromEntries(['Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map(x => [x, x]));
  Object.assign(native, {
    StyleSheet: { create: x => x, absoluteFill: {} }, useWindowDimensions: () => ({ height: 400, width: 350, fontScale: 1 }),
    Easing: { out: x => x, cubic: x => x },
    Animated: { View: 'AnimatedView', Value: class { constructor(x) { this.value = x; } interpolate(x) { return x; } stopAnimation() {} },
      timing: (value, options) => ({ start: done => { durations.push(options.duration); value.value = options.toValue; done?.({ finished: true }); } }) },
  });
  const m = { exports: {} };
  const imports = { './lessonIntroductionStyles': load('src/components/lessonIntroductionStyles.ts', { 'react-native': native }), react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native,
    '../play/motion': { usePlayMotion: () => !reduced }, '../play/soundStatus': { requestPracticeCue: kind => cues.push(kind) }, './WelcomeStepIcons': { WelcomeLessonIcon: 'Icon' }, 'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports: m.exports, module: m, require: id => { assert.ok(id in imports, id); return imports[id]; } });
  const render = () => { cursor = 0; const tree = m.exports.default({ lesson: { title: 'Test lesson', intro: 'Full introduction', readingMinutes: 5 },
    actionLabel: 'Start', onDismiss: () => { dismissals++; }, onStart: async () => { starts++; return ok; } }); const pending=effects;effects=[];pending.forEach(fn=>fn());return tree; };
  return { render, durations, cues, unmount: () => slots.forEach(s=>s?.cleanup?.()), counts: () => ({ starts, dismissals }) };
}
const nodes = t => t && typeof t === 'object' ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
const start = t => nodes(t).find(n => n.type === 'Pressable' && n.props.accessibilityState?.busy !== undefined);
(async () => {
  for (const reduced of [false, true]) {
    const h = harness(reduced); let tree = h.render(); tree.props.onShow();
    assert.equal(h.durations[0], reduced ? 0 : 320);
    tree.props.onShow();assert.deepEqual(h.cues,[],'native onShow never schedules audio');
    h.render();assert.deepEqual(h.cues,[],'rerenders stay silent');
    assert.ok(nodes(tree).some(n => n.type === 'Text' && n.props.children === 'Full introduction'));
    assert.ok(nodes(tree).some(n => n.type === 'ScrollView'), 'Long introductions can scroll on small screens');
    start(tree).props.onPress(); start(tree).props.onPress(); tree.props.onRequestClose();
    await Promise.resolve(); assert.deepEqual(h.counts(), { starts: 1, dismissals: 0 }, 'Double tap starts only once');
    const d = harness(reduced); tree = d.render(); tree.props.onRequestClose();
    assert.deepEqual(d.counts(), { starts: 0, dismissals: 1 }, 'Android Back only dismisses');
  }
  const retry = harness(false, false); let tree = retry.render(); start(tree).props.onPress(); await Promise.resolve();
  tree = retry.render(); assert.equal(start(tree).props.disabled, false, 'Failed onboarding persistence permits retry');
  assert.ok(nodes(tree).some(n => n.props?.accessibilityLiveRegion === 'polite'));
  let finishStart;
  const abandoned=harness(false,new Promise(resolve=>{finishStart=resolve;}));
  let abandonedTree=abandoned.render();start(abandonedTree).props.onPress();
  const beforeUnmount=abandoned.durations.length;abandoned.unmount();finishStart(false);
  for(let i=0;i<5;i++)await Promise.resolve();
  assert.equal(abandoned.durations.length,beforeUnmount,'A late failed start cannot animate an unmounted popup');
  const reader = fs.readFileSync('src/screens/ReaderLessonScreen.tsx', 'utf8');
  assert.ok(!reader.includes('{lesson.intro}'), 'Introduction appears only in preview');
  console.log('Lesson introduction animation, reduced motion, cancellation, duplicate start and retry passed. Native views mocked.');
})().catch(e => { console.error(e); process.exitCode = 1; });
