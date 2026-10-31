/* global __dirname */
const fs=require('node:fs'),path=require('node:path');
/** Merge into the user's linked configuration; never ship a replacement app.json. */
function configurePlayFeedback(app){
 const result=structuredClone(app),config=result.expo;
 if(!config||typeof config!=='object')throw Error('Expected an Expo app.json configuration.');
 const options={microphonePermission:false,recordAudioAndroid:false,enableBackgroundPlayback:false,enableBackgroundRecording:false};
 const plugins=config.plugins??[];
 const existing=plugins.find(p=>(Array.isArray(p)?p[0]:p)==='expo-audio');
 config.plugins=[...plugins.filter(p=>(Array.isArray(p)?p[0]:p)!=='expo-audio'),['expo-audio',{...(Array.isArray(existing)?existing[1]:{}),...options}]];
 config.runtimeVersion={policy:'fingerprint'};
 // An explicit platform override otherwise takes precedence over the new policy.
 for(const platform of ['android','ios'])if(config[platform]?.runtimeVersion)config[platform].runtimeVersion={policy:'fingerprint'};
 return result;
}
function main(){
 const root=path.resolve(__dirname,'..');
 for(const name of ['app.config.js','app.config.ts'])if(fs.existsSync(path.join(root,name)))throw Error(`Apply the exported configurePlayFeedback function to your ${name}; app.json was not modified.`);
 const file=path.join(root,'app.json'),app=JSON.parse(fs.readFileSync(file,'utf8'));
 fs.writeFileSync(file,JSON.stringify(configurePlayFeedback(app),null,2)+'\n');
 console.log('Playback-only feedback configured; linked project settings preserved. Build and install a new Android APK before publishing updates with audio.');
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={configurePlayFeedback};
