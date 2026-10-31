/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const jsx = (type, props) => ({ type, props });
const statuses = ['loading', 'local', 'queued', 'syncing', 'saved', 'waiting', 'error', 'local-error'];
const actionable = new Set(['waiting', 'error', 'local-error']);
const priority = ['local-error', 'error', 'waiting', 'syncing', 'queued', 'loading', 'saved', 'local'];
let learning, daily, learningRetries = 0, dailyRetries = 0;
const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } };
const imports = {
  react: { useState: initial => [initial, () => {}] },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': native,
  './DailySyncControls': { __esModule: true, default: 'DailySyncControls' },
  '../state/LearningSession': {
    useLearningSession: () => ({ store: { retry: () => { learningRetries++; } }, dailyStore: { retry: () => { dailyRetries++; } }, email: null }),
    useLearningSnapshot: () => learning,
    useDailySnapshot: () => daily,
  },
  '../lib/learningSync': { getLearningStore: () => { throw Error('Guest import must be user initiated'); } },
  '../utils/learningBackup': { describeLearningBackup: () => 'Guest progress' },
  '../theme': { colors: {} },
};
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root + '/src/components/SyncStatus.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { module: mod, exports: mod.exports, require: id => {
  if (id in imports) return imports[id];
  throw Error('Unexpected import: ' + id);
} });
const SyncStatus = mod.exports.default;
const nodes = node => node && typeof node === 'object' ? [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] : [];
for (const a of statuses) for (const b of statuses) {
  learning = { status: a, error: actionable.has(a) ? 'Learning problem' : '', userId: null };
  daily = { status: b, error: actionable.has(b) ? 'Daily problem' : '', userId: null };
  const combined = priority.indexOf(b) < priority.indexOf(a) ? daily : learning;
  const tree = SyncStatus({ quiet: true });
  assert.equal(tree !== null, actionable.has(a) || actionable.has(b), a + '/' + b + ': home only shows actionable issues');
  if (tree) {
    const retry = nodes(tree).find(n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
    assert.ok(retry, 'retry remains available');
    const oldLearning = learningRetries, oldDaily = dailyRetries;
    retry.props.onPress();
    assert.equal(learningRetries, oldLearning + 1);
    assert.equal(dailyRetries, oldDaily + 1);
    assert.ok(nodes(tree).some(n => n.props?.accessibilityLiveRegion === 'polite'), 'visible notice stays accessible');
  }
  assert.ok(SyncStatus({}), 'non-quiet status always available');
  const detailed = SyncStatus({ detailed: true, quiet: true });
  assert.ok(detailed, 'detailed mode overrides quiet mode');
  assert.ok(nodes(detailed).some(n => n.type === 'DailySyncControls'), 'detailed controls retained');
  if (combined.error) assert.ok(nodes(detailed).some(n => n.props?.children === combined.error), 'combined error details retained');
}
// Periodic successful sync, including one store finishing ahead of the other,
// contributes no banner row at any step of the home-screen cycle.
for (let cycle = 0; cycle < 3; cycle++) for (const [a, b] of [
  ['saved', 'saved'], ['queued', 'saved'], ['syncing', 'saved'],
  ['syncing', 'syncing'], ['saved', 'syncing'], ['saved', 'saved'],
  ['loading', 'local'], ['local', 'local'],
]) {
  learning = { status: a, error: '', userId: null };
  daily = { status: b, error: '', userId: null };
  assert.equal(SyncStatus({ quiet: true }), null, 'normal sync cycle never adds layout height');
}
const navigation = fs.readFileSync(root + '/src/navigation/AppNavigator.tsx', 'utf8');
assert.match(navigation, /app\.screen === "home"[^\n]+<SyncStatus quiet\s*\/>/, 'home still selects quiet mode');
console.log('Quiet sync status passed: all 64 learning/daily status combinations, routine startup/queue/sync/recovery cycles, actionable errors, both retry actions, accessibility and complete detailed views. Native views mocked.');
