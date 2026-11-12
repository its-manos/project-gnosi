/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { load } = require('./helpers/load-typescript.cjs');
const model = load('src/quiz/pvp.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

assert.equal(model.normalizeRoomCode(' a1 b2c3 '), 'A1B2C3');
for (const code of ['12345', '1234567', 'GHIJKL', '', '❤️']) assert.equal(model.validRoomCode(code), false);
assert.equal(model.validRoomCode('a1b2c3'), true);
assert.equal(model.pvpClockOffset('2026-11-12T00:00:01Z', Date.parse('2026-11-12T00:00:00Z'), Date.parse('2026-11-12T00:00:00.200Z')), 900);
assert.equal(model.pvpSecondsLeft('2026-11-12T00:00:10Z', Date.parse('2026-11-12T00:00:05Z'), 1000), 4);
assert.equal(model.pvpSecondsLeft('2026-11-12T00:00:10Z', Date.parse('2026-11-12T00:00:30Z'), 0), 0);
assert.deepEqual(plain(model.pvpStandings([{ id: 'a', name: 'Άννα', score: 3 }, { id: 'b', name: 'Βάσω', score: 3 }, { id: 'c', name: 'Γιώργος', score: 1 }])).map(p => p.rank), [1, 1, 3]);
assert.match(model.pvpErrorMessage({ message: 'pvp_room_full' }), /4/);
assert.doesNotMatch(model.pvpErrorMessage({ message: 'private backend information' }), /private/);

function compile(file, imports, timers = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Date, console, Promise, setTimeout, clearTimeout, ...timers,
    require: id => { if (id in imports) return imports[id]; throw Error(id); } });
  return module.exports;
}

function hooks() {
  const slots = [], dependencies = [], cleanups = [];
  let cursor = 0, effects = [];
  const memo = (fn, deps) => {
    const index = cursor++;
    if (!dependencies[index] || deps.some((value, n) => !Object.is(value, dependencies[index][n]))) {
      slots[index] = fn(); dependencies[index] = deps;
    }
    return slots[index];
  };
  return {
    react: {
      useRef: initial => { const index = cursor++; return slots[index] ??= { current: initial }; },
      useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useCallback: (fn, deps) => memo(() => fn, deps),
      useEffect: (fn, deps) => { const index = cursor++; if (!dependencies[index] || deps.some((value, n) => !Object.is(value, dependencies[index][n]))) {
        dependencies[index] = deps; effects.push(() => { cleanups[index]?.(); cleanups[index] = fn(); });
      } },
    },
    render: fn => { cursor = 0; const result = fn(); const run = effects; effects = []; for (const effect of run) effect(); return result; },
    unmount: () => { for (const cleanup of cleanups) cleanup?.(); },
  };
}

(async () => {
  const timers = new Set(), listeners = new Set(), calls = [];
  const appState = { currentState: 'active', addEventListener: (_name, callback) => { listeners.add(callback); return { remove: () => listeners.delete(callback) }; } };
  const snapshot = { id: 'room', code: 'ABC123', matchId: 'match', hostId: 'user', status: 'question', index: 0, serverNow: new Date().toISOString(), players: [] };
  let pollReply = snapshot, answerReply = snapshot;
  const api = {
    pvpAvailable: true,
    resumePvpRoom: async () => { calls.push('resume'); return snapshot; },
    getPvpRoom: async () => { calls.push('poll'); return pollReply; },
    answerPvpRoom: async (room, value) => { calls.push(['answer', room.index, room.matchId, value]); return answerReply; },
    leavePvpRoom: async () => null,
  };
  const harness = hooks();
  const { usePvp } = compile('src/hooks/usePvp.ts', { react: harness.react, 'react-native': { AppState: appState }, '../lib/pvp': api, '../quiz/pvp': model }, {
    setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn),
  });
  const render = () => harness.render(() => usePvp('user'));
  let game = render(); await flush(); game = render();
  assert.equal(game.room.id, 'room'); assert.equal(game.loading, false);
  const pending = deferred(); pollReply = pending.promise;
  for (const tick of timers) tick(); await flush();
  const accepted = game.answer(2), duplicate = game.answer(3);
  assert.equal(await duplicate, false, 'same-frame answer double tap is ignored');
  assert.equal(calls.filter(c => Array.isArray(c)).length, 0, 'foreground action queues behind the poll');
  answerReply = { ...snapshot, index: 1 };
  pending.resolve(answerReply); await accepted; game = render();
  assert.deepEqual(calls.find(c => Array.isArray(c)), ['answer', 0, 'match', 2], 'queued tap keeps its original round, even when the poll advances');
  assert.equal(game.room.index, 1);
  assert.equal(game.busy, false);
  appState.currentState = 'background';
  const before = calls.length; for (const tick of timers) tick(); await flush();
  assert.equal(calls.length, before, 'no polling while backgrounded');
  pollReply = { ...snapshot, index: 2 }; appState.currentState = 'active';
  for (const listener of listeners) listener('active'); await flush(); game = render();
  assert.equal(game.room.index, 2, 'foreground immediately refreshes');
  const late = deferred(); pollReply = late.promise;
  for (const tick of timers) tick(); await flush();
  harness.unmount(); late.resolve({ ...snapshot, index: 3 }); await flush();
  assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
  assert.equal(render().room.index, 2, 'unmounted hook ignores an in-flight response');

  let rpcReply = { data: { error: 'pvp_rate_limit' }, error: null }, lastRpc;
  const transport = compile('src/lib/pvp.ts', {
    './supabase': { supabase: { rpc: (name, args) => { lastRpc = { name, args }; return { abortSignal: async () => rpcReply }; } } },
    '../quiz/pvp': model,
  }, { AbortController });
  await assert.rejects(transport.joinPvpRoom(' Μάνος ', 'ab12cd'), /pvp_rate_limit/, 'structured join errors cannot become room snapshots');
  assert.equal(lastRpc.args.p_name, 'Μάνος'); assert.equal(lastRpc.args.p_code, 'AB12CD');
  rpcReply = { data: snapshot, error: null };
  assert.equal((await transport.getPvpRoom('room')).id, 'room');

  const feedbackHarness = hooks(), heard = [], feedbackListeners = new Set();
  const { usePvpFeedback } = compile('src/hooks/usePvpFeedback.ts', {
    react: feedbackHarness.react,
    'react-native': { AppState: { currentState: 'active', addEventListener: (_event, listener) => { feedbackListeners.add(listener); return { remove: () => feedbackListeners.delete(listener) }; } } },
    '../play/pvpFeedback': load('src/play/pvpFeedback.ts'), '../play/soundStatus': { requestPracticeCue: cue => heard.push(cue) },
  });
  let audibleRoom = { ...snapshot, status: 'lobby' }, visible = false;
  const feedback = () => feedbackHarness.render(() => usePvpFeedback(audibleRoom, 'user', visible, true));
  feedback(); audibleRoom = { ...audibleRoom, status: 'question' }; feedback(); visible = true; feedback();
  assert.deepEqual(heard, ['question-open']);
  audibleRoom = { ...audibleRoom, status: 'reveal', question: { correctIndex: 1 }, players: [{ id: 'user', answered: true, answer: 1 }] }; visible = false; feedback(); feedback();
  assert.deepEqual(heard, ['question-open', 'correct']);
  for (const listener of feedbackListeners) listener('background');
  for (const listener of feedbackListeners) listener('active');
  feedback(); audibleRoom = { ...audibleRoom, status: 'finished' }; feedback();
  assert.deepEqual(heard, ['question-open', 'correct'], 'returning to a cached snapshot must not replay a result/completion sound');
  feedbackHarness.unmount(); assert.equal(feedbackListeners.size, 0);

  // Exercise the actual native screen's interactions with a stubbed transport.
  const ui = hooks(), sent = [];
  let savedName = '';
  const identity = () => ({ name: savedName, ready: true, saving: false, error: null,
    choose: async value => { savedName = value.trim(); return true; }, retry() {} });
  let state = { room: null, busy: false, loading: false, available: true, error: null, offset: 0, lastSynced: Date.now(),
    join: (...args) => sent.push(args), create: (...args) => sent.push(args), refresh() {}, ready() {}, start() {}, answer() {}, rematch() {}, dismiss() {} };
  const jsx = (type, props, key) => ({ type, props, key });
  const native = { StyleSheet: { create: value => value }, Platform: { OS: 'android' }, BackHandler: { addEventListener: () => ({ remove() {} }) } };
  for (const name of ['ActivityIndicator', 'KeyboardAvoidingView', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View']) native[name] = name;
  const Screen = compile('src/screens/PvpScreen.tsx', {
    react: ui.react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': native,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '../components/AppBackground': { default: 'Background' }, '../components/ProfileSectionHeader': { default: 'Header' },
    '../components/SourceLink': { default: 'Source' }, '../hooks/usePvp': { usePvp: () => state },
    '../components/AtlasContinueCard': { __esModule: true, default: 'Pressable' }, '../components/ScreenEntrance': { __esModule: true, default: 'Entrance' },
    '../components/PvpArtwork': { PvpBadge: 'Badge', PvpHero: 'Hero', PvpWorld: 'World' },
    '../hooks/usePvpIdentity': { usePvpIdentity: identity }, '../hooks/usePvpFeedback': { usePvpFeedback() {} },
    '../state/PvpIdentity': load('src/state/PvpIdentity.ts'),
    '../quiz/pvp': model, '../theme': { colors: {} },
  }, { setInterval: () => 1, clearInterval() {} }).default;
  const draw = userId => ui.render(() => Screen({ userId, onHome() {}, onAccount() {} }));
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (typeof node.type === 'function') return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  const text = root => nodes(root).filter(node => node.type === 'Text').flatMap(node => node.props.children).join(' ');
  let root = draw(null); assert.match(text(root), /Συνδέσου/);
  root = draw('user');
  nodes(root).find(node => node.props.testID === 'pvp-name').props.onChangeText('Μάνος');
  root = draw('user');
  await nodes(root).find(node => node.type === 'Pressable' && text(node) === 'Αποθήκευση ονόματος').props.onPress(); await flush();
  root = draw('user');
  assert.ok(!nodes(root).some(node => node.props.testID === 'pvp-name'), 'saved identity replaces the entry form');
  nodes(root).find(node => node.props.accessibilityRole === 'tab' && text(node) === 'Έχω κωδικό').props.onPress();
  root = draw('user');
  nodes(root).find(node => node.props.testID === 'pvp-code').props.onChangeText('ab12cd');
  root = draw('user');
  nodes(root).find(node => node.type === 'Pressable' && text(node) === 'Συμμετοχή').props.onPress();
  assert.deepEqual(sent[0], ['Μάνος', 'AB12CD']);
  state = { ...state, room: { ...snapshot, count: 5, seconds: 30, startsAt: new Date(Date.now() + 60000).toISOString(), deadline: new Date(Date.now() + 90000).toISOString(), question: { id: 'q', prompt: 'Secret prompt', answers: ['A', 'B', 'C', 'D'] } } };
  root = draw('user'); assert.match(text(root), /Ξεκινάμε/); assert.doesNotMatch(text(root), /Secret prompt/);
  state.room = { ...state.room, startsAt: new Date(Date.now() - 1000).toISOString(), players: [{ id: 'user', name: 'Μάνος', score: 0, answer: 1, answered: true, connected: true }] };
  root = draw('user');
  const choices = nodes(root).filter(node => node.type === 'Pressable' && ['A', 'B', 'C', 'D'].includes(node.props.accessibilityLabel));
  assert.equal(choices.length, 4); assert.ok(choices.every(node => node.props.disabled));
  assert.match(text(root), /κλείδωσε/);
  state.room = { ...state.room, status: 'reveal', question: { ...state.room.question, correctIndex: 2, explanation: 'Explanation' } };
  root = draw('user'); assert.match(text(root), /Explanation/);
  assert.ok(nodes(root).find(node => node.props.accessibilityLabel === 'C, σωστή απάντηση'));
  ui.unmount();
  console.log('PvP client passed: codes, ties, server-clock offsets, safe errors, actual-hook request serialization/stale taps/background/reconnect/cleanup, and native-screen account/join/countdown/locked-answer/reveal flows.');
})().catch(error => { console.error(error); process.exitCode = 1; });
