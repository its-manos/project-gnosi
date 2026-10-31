/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

function configureBetaUpdates(app) {
  const result = structuredClone(app);
  const config = result.expo;
  const id = config?.extra?.eas?.projectId;
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id ?? '')) throw Error('Link your Expo project first: npx eas-cli@latest init');
  if (config.ios?.runtimeVersion || config.android?.runtimeVersion) throw Error('Remove platform runtimeVersion overrides before configuring the shared fingerprint policy.');
  if (config.updates?.requestHeaders?.['expo-channel-name']) throw Error('Remove the fixed expo-channel-name header; eas.json selects the channel for each build profile.');
  const url = `https://u.expo.dev/${id}`;
  if (config.updates?.url && config.updates.url !== url) throw Error('The existing updates.url points to a different project. Check the Expo project link before changing it.');
  config.runtimeVersion = { policy: 'fingerprint' };
  config.updates = { ...config.updates, url, enabled: true, checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0, useEmbeddedUpdate: true };
  return result;
}

function main() {
  const root = path.resolve(__dirname, '..');
  for (const name of ['app.config.js', 'app.config.ts']) if (fs.existsSync(path.join(root, name))) throw Error(`This setup expects app.json; ${name} must be configured separately.`);
  const file = path.join(root, 'app.json');
  const app = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = configureBetaUpdates(app);
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log('Automatic updates configured for your linked Expo project. Project ID, app identifiers and other settings preserved. Build one new APK before publishing updates.');
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { configureBetaUpdates };
