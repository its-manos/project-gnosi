const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./helpers/load-typescript.cjs');
const { PvpFeedbackTracker } = load('src/play/pvpFeedback.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const player = (id, ready = false) => ({ id, name: id, ready, connected: true, left: false, score: 0, answer: null, answered: false });
const lobby = { id: 'room', matchId: 'match', index: 0, status: 'lobby', players: [player('self')] };
const tracker = new PvpFeedbackTracker();
const tick = (room, countdown = 0, seconds = 0, active = true, visible = false) => plain(tracker.update(room, 'self', visible, active, countdown, seconds));
assert.deepEqual(tick(lobby), []);
const joined = { ...lobby, players: [...lobby.players, player('friend'), player('third')] };
assert.deepEqual(tick(joined), ['pvp-join'], 'simultaneous joins coalesce'); assert.match(tracker.notice, /2 παίκτες/);
assert.deepEqual(tick(joined), [], 'polls never repeat lobby sounds');
const ready = { ...joined, players: joined.players.map(p => ({ ...p, ready: true })) };
assert.deepEqual(tick(ready), ['pvp-ready']); assert.match(tracker.notice, /Όλοι έτοιμοι/);
assert.deepEqual(tick(ready), []);
assert.deepEqual(tick(joined), [], 'unready is silent');
assert.deepEqual(tick(ready), ['pvp-ready'], 'a new ready action still gets acknowledgement');
assert.deepEqual(tick({ ...ready, players: [ready.players[0]] }), ['pvp-leave']); assert.match(tracker.notice, /2 παίκτες/);
assert.deepEqual(tick(joined, 0, 0, false), [], 'stale joins are silent');
assert.deepEqual(tick(joined), [], 'recovery never replays joins');
assert.deepEqual(tick(ready), ['pvp-ready']);
const question = { ...ready, status: 'question', players: ready.players.map(p => ({ ...p, answered: false })) };
assert.deepEqual(tick(question, 3), ['pvp-countdown']);
assert.deepEqual(tick(question, 3), []);
assert.deepEqual(tick(question, 2), ['pvp-countdown']);
assert.deepEqual(tick(question, 1), ['pvp-countdown']);
assert.deepEqual(tick(question, 2), [], 'clock correction cannot replay a tick');
assert.deepEqual(tick(question, 1), []);
assert.deepEqual(tick(question, 0, 30, true, true), ['question-open']);
assert.deepEqual(tick(question, 0, 6, true, true), []);
assert.deepEqual(tick(question, 0, 5, true, true), ['pvp-warning']);
assert.deepEqual(tick(question, 0, 4, true, true), []);
assert.deepEqual(tick(question, 0, 6, true, true), []);
assert.deepEqual(tick(question, 0, 5, true, true), [], 'warning once per round');
const locked = { ...question, players: question.players.map(p => p.id === 'self' ? { ...p, answered: true, answer: 2 } : p) };
assert.deepEqual(tick(locked, 0, 4, true, true), ['pvp-lock']);
assert.deepEqual(tick(locked, 0, 3, true, true), []);
const reveal = { ...locked, status: 'reveal', question: { correctIndex: 2 } };
assert.deepEqual(tick(reveal), ['correct']);
const next = { ...question, index: 1 };
assert.deepEqual(tick(next, 2), ['pvp-countdown'], 'later rounds use their server countdown');
assert.deepEqual(tick(next, 1), ['pvp-countdown']);
assert.deepEqual(tick(next, 0, 30, true, true), ['question-open']);
assert.deepEqual(tick(next, 0, 5, false, true), []);
assert.deepEqual(tick(next, 0, 4, true, true), [], 'stale warning is never replayed');
const restored = new PvpFeedbackTracker();
assert.deepEqual(plain(restored.update(joined, 'self', false, true)), [], 'restored roster silent');
assert.deepEqual(plain(restored.update({ ...question, matchId: 'new' }, 'self', false, true, 1)), ['pvp-countdown'], 'one current tick instead of a backlog');
assert.deepEqual(tick({ ...ready, id: 'different-room' }), [], 'room replacement is a silent baseline');
assert.deepEqual(tick(null), []);

// Run the actual animation component with native scheduling mocked.
let motion = true, cursor = 0, slots = [], effects = [], animations = [], stops = 0;
const react = {
  useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], () => {}]; },
  useRef: initial => { const i = cursor++; return slots[i] ??= { current: initial }; },
  useEffect: (fn, deps) => { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) {
    const old = slots[i]; slots[i] = { deps }; effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
  } },
};
const Animated = { View: 'AnimatedView', Value: class { constructor(v) { this.value = v; } setValue(v) { this.value = v; } },
  timing: (_value, options) => { animations.push(options); return options; }, sequence: () => ({ start() {}, stop() { stops++; } }) };
const Pulse = load('src/components/PvpPulse.tsx', { react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  'react-native': { Animated }, '../play/motion': { usePlayMotion: () => motion } }).default;
function render(props) { cursor = 0; const tree = Pulse({ children: 'seat', ...props }); const pending = effects; effects = []; pending.forEach(fn => fn()); return tree; }
render({ pulseKey: 'ready:false' }); assert.equal(animations.length, 0, 'restored seats stay still');
render({ pulseKey: 'ready:true' }); assert.equal(animations.length, 2);
render({ pulseKey: 'ready:true' }); assert.equal(animations.length, 2, 'polls do not animate');
motion = false; const tree = render({ pulseKey: 'ready:true' }); assert.equal(stops, 1); assert.equal(tree.props.style[1].transform[0].scale.value, 1);
render({ pulseKey: 'ready:false' }); assert.equal(animations.length, 2, 'reduced motion is static');
motion = true; render({ pulseKey: 'ready:false' }); assert.equal(animations.length, 2, 'enabling motion never replays a past state');
render({ pulseKey: 'ready:true' }); assert.equal(animations.length, 4);
for (const animation of animations) { assert.equal(animation.useNativeDriver, true); assert.equal(animation.isInteraction, false); }
slots.forEach(slot => slot?.cleanup?.()); assert.equal(stops, 2, 'unmount cancels native work');

const kinds = ['pvp-join', 'pvp-leave', 'pvp-ready', 'pvp-countdown', 'pvp-lock', 'pvp-warning'];
const hashes = new Set();
for (const kind of kinds) {
  const data = fs.readFileSync(`assets/sounds/${kind}.wav`);
  assert.equal(data.toString('ascii', 0, 4), 'RIFF'); assert.equal(data.toString('ascii', 8, 12), 'WAVE');
  assert.equal(data.readUInt16LE(22), 1); assert.equal(data.readUInt16LE(34), 16);
  const rate = data.readUInt32LE(24); assert.equal(rate, 22050);
  assert.ok((data.length - 44) / 2 / rate >= 1.1, 'Android-safe container');
  let peak = 0, activeFrames = 0;
  for (let i = 44; i < data.length; i += 2) { const sample = Math.abs(data.readInt16LE(i)); peak = Math.max(peak, sample); if (sample > 0) activeFrames++; }
  assert.ok(peak > 1000 && peak < 11000, 'bounded audible signal'); assert.ok(activeFrames < rate * .3, 'short cue, no sustained tone');
  assert.ok(data.subarray(44 + Math.ceil(rate * .3) * 2).every(byte => byte === 0), 'only silence after pluck');
  hashes.add(require('node:crypto').createHash('sha256').update(data).digest('hex'));
}
assert.equal(hashes.size, kinds.length, 'six distinct original cues');
console.log('PvP feedback passed: batched lobby events, readiness, 3/2/1 ticks, lock/warning/result priority, no poll/reconnect/clock repeats, native pulse cleanup/reduced motion and six bounded Android-safe assets. Audio/motion need device review.');
