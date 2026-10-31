/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { configureBetaUpdates } = require('./configure-beta-updates.cjs');
const { checkBetaBuild } = require('./check-beta-build.cjs');
const root = path.resolve(__dirname, '..');
const app = require(path.join(root, 'app.json')), eas = require(path.join(root, 'eas.json')), pkg = require(path.join(root, 'package.json'));
const original = { expo: { name: 'Keep me', android: { package: 'gr.gnosi.learning' }, ios: { bundleIdentifier: 'gr.gnosi.learning' }, extra: { existing: true, eas: { projectId: '00000000-0000-4000-8000-000000000000' } }, updates: { maxUpdatesToKeep: 3 } } };
const saved = structuredClone(original), result = configureBetaUpdates(original);
assert.deepEqual(original, saved, 'configuration does not mutate the input');
assert.equal(result.expo.name, original.expo.name);
assert.deepEqual(result.expo.extra, original.expo.extra, 'keeps the actual Expo owner/project link and unrelated extra values');
assert.deepEqual(result.expo.android, original.expo.android); assert.deepEqual(result.expo.ios, original.expo.ios);
assert.equal(result.expo.updates.url, 'https://u.expo.dev/' + original.expo.extra.eas.projectId);
assert.equal(result.expo.updates.maxUpdatesToKeep, 3);
assert.equal(result.expo.updates.checkAutomatically, 'ON_LOAD'); assert.equal(result.expo.updates.fallbackToCacheTimeout, 0); assert.equal(result.expo.updates.useEmbeddedUpdate, true);
assert.deepEqual(result.expo.runtimeVersion, { policy: 'fingerprint' });
assert.deepEqual(configureBetaUpdates(result), result, 'setup is idempotent');
assert.throws(() => configureBetaUpdates({ expo: {} }), /Link/);
const conflict = structuredClone(original); conflict.expo.updates.url = 'https://u.expo.dev/another-project'; assert.throws(() => configureBetaUpdates(conflict), /different project/);
const platform = structuredClone(original); platform.expo.android.runtimeVersion = 'old'; assert.throws(() => configureBetaUpdates(platform), /overrides/);
const header = structuredClone(original); header.expo.updates.requestHeaders = { 'expo-channel-name': 'other' }; assert.throws(() => configureBetaUpdates(header), /header/);
assert.ok(pkg.dependencies['expo-updates']);
for (const [script, channel, platformName] of [['beta:update:android', 'preview', 'android'], ['beta:update:ios', 'beta', 'ios']]) {
  assert.ok(pkg.scripts[script].includes(`--channel ${channel}`));
  assert.ok(pkg.scripts[script].includes(`--platform ${platformName}`));
  assert.ok(pkg.scripts[script].includes('--environment preview'), 'updates use the same public backend configuration as builds');
}
const env = { EXPO_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only' };
assert.deepEqual(checkBetaBuild({ app, eas, env }), []);
for (const alter of [a => { a.expo.updates.enabled = false; }, a => { a.expo.updates.url = 'https://u.expo.dev/wrong'; }, a => { a.expo.runtimeVersion = { policy: 'appVersion' }; }, a => { a.expo.updates.fallbackToCacheTimeout = 30000; }, a => { a.expo.android.runtimeVersion = 'old'; }]) {
  const bad = structuredClone(app); alter(bad); assert.ok(checkBetaBuild({ app: bad, eas, env }).length, 'build guard catches update configuration drift');
}
const wrongChannel = structuredClone(eas); wrongChannel.build.preview.channel = 'beta'; assert.ok(checkBetaBuild({ app, eas: wrongChannel, env }).length);
assert.ok(fs.readFileSync(path.join(root, 'index.ts'), 'utf8').includes('registerRootComponent(App)'));
console.log('Beta updates passed: project/identifier preservation, repeatable setup, conflicting config rejection, fingerprint compatibility, automatic non-blocking startup, separate Android/iPhone channels, matching update environment and build guards. No update published; installed APK testing still required.');
