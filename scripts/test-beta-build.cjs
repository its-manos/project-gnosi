/* global __dirname */
const assert=require('node:assert/strict'),path=require('node:path');
const {checkBetaBuild}=require('./check-beta-build.cjs');
const {configureBetaUpdates}=require('./configure-beta-updates.cjs');
const app=require(path.join(__dirname,'../app.json')),eas=require(path.join(__dirname,'../eas.json')),pkg=require(path.join(__dirname,'../package.json'));
assert.deepEqual(checkBetaBuild({app,eas,env:{},configOnly:true}),[]);
const fixture=structuredClone(app);fixture.expo.extra={eas:{projectId:'00000000-0000-4000-8000-000000000000'}};delete fixture.expo.updates;const linked=configureBetaUpdates(fixture);
const env={EXPO_PUBLIC_SUPABASE_URL:'https://test-project.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_key_for_configuration_only'};
assert.deepEqual(checkBetaBuild({app:linked,eas,env}),[]);
assert.deepEqual(checkBetaBuild({app:linked,eas,env,profile:'beta'}),[]);
const unlinked=structuredClone(app);delete unlinked.expo.extra.eas.projectId;assert.ok(checkBetaBuild({app:unlinked,eas,env}).some(e=>e.includes('Link this project')));
for(const bad of [{},{...env,EXPO_PUBLIC_SUPABASE_URL:'http://localhost:54321'},{...env,EXPO_PUBLIC_SUPABASE_URL:'https://YOUR_PROJECT_REF.supabase.co'},{...env,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_ship_this'},{...env,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_YOUR_KEY'}])assert.ok(checkBetaBuild({app:linked,eas,env:bad}).length);
const dev=structuredClone(eas);dev.build.preview.developmentClient=true;assert.ok(checkBetaBuild({app:linked,eas:dev,env}).some(e=>e.includes('standalone')));
const aab=structuredClone(eas);aab.build.preview.android.buildType='app-bundle';assert.ok(checkBetaBuild({app:linked,eas:aab,env}).some(e=>e.includes('APK')));
const mismatched=structuredClone(linked);mismatched.expo.ios.bundleIdentifier='com.other.app';assert.ok(checkBetaBuild({app:mismatched,eas,env}).some(e=>e.includes('matching')));
assert.equal(pkg.scripts['eas-build-post-install'],'node scripts/check-beta-build.cjs --remote');
assert.ok(pkg.scripts['beta:android'].includes('--profile preview'));assert.ok(pkg.scripts['beta:ios'].includes('--profile beta'));
console.log('Beta config checks passed: standalone APK/TestFlight profiles, stable identifiers, remote build numbers, missing Expo link/backend variables, placeholder and secret-key rejection, and remote build guard. No cloud build or backend request made.');
