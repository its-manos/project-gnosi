/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

function checkBetaBuild({ app, eas, env, profile = 'preview', configOnly = false }) {
  const errors = [];
  const config = app.expo;
  if (!config?.ios?.bundleIdentifier || !config?.android?.package || config.ios.bundleIdentifier !== config.android.package) errors.push('Set matching ios.bundleIdentifier and android.package in app.json.');
  if (config?.android?.package && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(config.android.package)) errors.push('The app identifier must be a valid reverse-domain identifier.');
  if (eas.cli?.appVersionSource !== 'remote') errors.push('Use remote app version management.');
  const preview = eas.build?.preview, beta = eas.build?.beta;
  if (preview?.distribution !== 'internal' || preview?.android?.buildType !== 'apk') errors.push('The preview profile must produce an internally distributed Android APK.');
  if (beta?.distribution !== 'store') errors.push('The beta profile must use store distribution for TestFlight.');
  for (const [name, value] of [['preview', preview], ['beta', beta]]) {
    if (value?.environment !== 'preview' || value?.autoIncrement !== true || value?.developmentClient === true) errors.push(`${name}: use the preview environment, autoIncrement and a standalone build.`);
  }
  if (!eas.build?.[profile]) errors.push('Unknown build profile.');
  for (const name of ['preview', 'beta']) if (eas.build?.[name]?.channel !== name) errors.push(`${name}: set the matching EAS Update channel.`);
  if (config?.runtimeVersion?.policy !== 'fingerprint' || config?.ios?.runtimeVersion || config?.android?.runtimeVersion) errors.push('Use the shared fingerprint runtime policy for compatible updates. Run npm run beta:updates:setup.');
  if (config?.updates?.enabled !== true || config?.updates?.checkAutomatically !== 'ON_LOAD' || config?.updates?.fallbackToCacheTimeout !== 0 || config?.updates?.useEmbeddedUpdate !== true) errors.push('Enable automatic launch checks with a non-blocking embedded fallback: npm run beta:updates:setup');
  if (config?.updates?.requestHeaders?.['expo-channel-name']) errors.push('Let the EAS build profile select the update channel instead of fixing it in app.json.');

  if (!configOnly) {
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(config?.extra?.eas?.projectId ?? '')) errors.push('Link this project first: npx eas-cli@latest init');
    if (config?.updates?.url !== `https://u.expo.dev/${config?.extra?.eas?.projectId}`) errors.push('The update URL must match your linked Expo project: npm run beta:updates:setup');
    const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim(), key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || /YOUR_PROJECT_REF/i.test(url)) throw Error('invalid');
    } catch { errors.push('Set EXPO_PUBLIC_SUPABASE_URL to the HTTPS URL of your working Supabase project.'); }
    if (!key?.startsWith('sb_publishable_') || key.includes('YOUR_KEY')) errors.push('Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your public publishable key. Never use a secret/service-role key.');
  }
  return errors;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const remote = process.argv.includes('--remote');
  const configOnly = process.argv.includes('--config-only');
  const profile = process.env.EAS_BUILD_PROFILE || 'preview';
  if (remote && !['preview', 'beta'].includes(profile)) return;
  if (!remote && !configOnly) {
    // Native Node .env loading; no values are printed or written to tracked files.
    if (typeof process.loadEnvFile !== 'function') throw Error('Use Node 22.13 or newer for the beta check.');
    for (const name of ['.env.local', '.env']) if (fs.existsSync(path.join(root, name))) process.loadEnvFile(path.join(root, name));
  }
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
  const errors = checkBetaBuild({ app, eas, env: process.env, profile, configOnly });
  if (errors.length) {
    console.error('Beta build setup needs attention:\n' + errors.map(e => '- ' + e).join('\n'));
    process.exitCode = 1;
  } else console.log(configOnly ? 'Beta configuration passed. Expo project linking and build environment values still need setup.' : 'Beta build configuration and required environment values passed. Backend access must still be tested in the installed app.');
}
if (require.main === module) { try { main(); } catch { console.error('Could not check beta configuration. Verify app.json, eas.json and your Node version.'); process.exitCode = 1; } }
module.exports = { checkBetaBuild };
