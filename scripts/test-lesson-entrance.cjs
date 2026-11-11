const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./helpers/load-typescript.cjs');
function harness(initial) {
  let enabled = initial, slots = [], cursor = 0, effects = [], animations = [];
  const react = {
    useRef: init => { const i = cursor++; return slots[i] ??= { current: init }; },
    useEffect: (fn, deps) => { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) {
      const previous = slots[i]; slots[i] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
    } },
  };
  const Animated = { View: 'AnimatedView', Value: class { constructor(v) { this.value = v; } setValue(v) { this.value = v; } stopAnimation() { this.stopped = true; } interpolate(x) { return x; } },
    timing: (value, opts) => { animations.push(opts); return { start() { value.value = opts.toValue; }, stop() {} }; } };
  const Component = load('src/components/ScreenEntrance.tsx', { react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'react-native': { Animated, Easing: { out: v => v, cubic: x => x } }, '../play/motion': { usePlayMotion: () => enabled } }).default;
  return {
    animations, setEnabled: v => { enabled = v; },
    render(props = {}) { cursor = 0; const tree = Component({ ...props, children: 'reader', style: { flex: 1 } }); const pending = effects; effects = []; pending.forEach(f => f()); return tree; },
    unmount() { slots.forEach(s => s?.cleanup?.()); },
  };
}
const h = harness(true); let tree = h.render();
assert.equal(h.animations.length, 1);assert.equal(h.animations[0].useNativeDriver, true);
assert.equal(h.animations[0].isInteraction, false, 'Entrance cannot delay reader interactions or image work');
h.render();assert.equal(h.animations.length, 1, 'Answer updates never replay reader entry');
h.setEnabled(false);tree = h.render();assert.equal(tree.props.style[1].transform[0].translateY,0);
h.setEnabled(true);h.render();assert.equal(h.animations.length,1,'Changing settings cannot replay entry');h.unmount();
const disabled = harness(false);disabled.render();assert.equal(disabled.animations.length,0);
disabled.setEnabled(true);disabled.render();assert.equal(disabled.animations.length,0,'Late preference hydration never hides the reader');disabled.unmount();
const back = harness(true);back.render({ animateOnMount: false, duration: 240, rise: 6 });assert.equal(back.animations.length,0,'Back and restored browsing screens stay still');back.unmount();
const forward = harness(true);const forwardTree=forward.render({ duration: 240, rise: 6 });assert.equal(forward.animations[0].duration,240);assert.equal(forwardTree.props.style[1].transform[0].translateY.outputRange[0],6);forward.unmount();
for (const kind of ['lesson-preview', 'lesson-open', 'world-open', 'island-open']) {
  const bytes = fs.readFileSync(`assets/sounds/${kind}.wav`);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt16LE(34),16);
  const samples = bytes.readUInt32LE(40)/2, duration = samples/bytes.readUInt32LE(24);
  const navigation = kind === 'world-open' || kind === 'island-open';
  assert.ok(duration >= (navigation ? .06 : .12) && duration <= (navigation ? .1 : .25), 'Navigation stays shorter than lesson cues');
  let peak=0, energy=0; for(let i=44;i<bytes.length;i+=2){const sample=bytes.readInt16LE(i);peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}
  assert.ok(peak<32767*.35&&energy>0,'Original sweep has no clipping or loud transients');
  assert.equal(bytes.readInt16LE(44),0);assert.equal(bytes.readInt16LE(bytes.length-2),0,'Fade endpoints avoid clicks');
}
console.log('Lesson entrance passed: native one-shot reveal, motion settings, hydration, cleanup and short non-clipping whoosh assets. Native views mocked.');
