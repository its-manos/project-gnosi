const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
function fixture({fail=false}={}){
 const players=[],modes=[];let pending=[];
 const FeedbackAudio=load('src/play/audio.ts',{'expo-audio':{setAudioModeAsync:async mode=>{modes.push(mode);if(fail)throw Error('unavailable');},createAudioPlayer:()=>{const p={isLoaded:true,played:0,paused:0,removed:0,play(){this.played++;},pause(){this.paused++;},remove(){this.removed++;},seekTo:()=>new Promise(resolve=>pending.push(resolve))};players.push(p);return p;}},...Object.fromEntries(['correct','incorrect','complete','mastered','level-up'].map((k,i)=>['../../assets/sounds/'+k+'.wav',i+1]))}).FeedbackAudio;
 return{audio:new FeedbackAudio(),players,modes,resolve:()=>{const resolve=pending.shift();assert.ok(resolve);resolve();}};
}
(async()=>{
 let f=fixture();await f.audio.start();assert.equal(f.players.length,5);assert.equal(f.modes[0].playsInSilentMode,false);assert.equal(f.modes[0].interruptionMode,'mixWithOthers');assert.equal(f.modes[0].shouldPlayInBackground,false);assert.equal(f.modes[0].allowsRecording,false);
 let enabled=true;f.audio.play('correct',()=>enabled);f.resolve();await flush();assert.equal(f.players[0].played,1);assert.ok(f.players.every(p=>p.loop===false&&p.volume<.5));
 f.audio.play('correct',()=>enabled);f.audio.play('complete',()=>enabled);f.resolve();await flush();assert.equal(f.players[0].played,1,'new sound cancels an older pending seek');f.resolve();await flush();assert.equal(f.players[2].played,1);
 f.audio.play('correct',()=>enabled);enabled=false;f.resolve();await flush();assert.equal(f.players[0].played,1,'mute checked again after asynchronous seek');
 enabled=true;f.audio.play('correct',()=>enabled);f.audio.stop();f.resolve();await flush();assert.equal(f.players[0].played,1,'background stop cancels pending playback');
 f.audio.play('correct',()=>enabled);f.audio.dispose();f.resolve();await flush();assert.equal(f.players[0].played,1);assert.ok(f.players.every(p=>p.removed===1));
 f=fixture();await f.audio.start();f.players[0].isLoaded=false;f.audio.play('correct',()=>true);await flush();assert.equal(f.players[0].played,0,'unloaded sounds are dropped, never queued late');f.audio.dispose();
 f=fixture({fail:true});await f.audio.start();f.audio.play('correct',()=>true);assert.equal(f.players.length,0,'native failure stays silent');f.audio.dispose();
 console.log('Audio passed: SDK playback-only mode, original bundled assets, bounded volume, no loops, one cue at a time, cancelled asynchronous seeks on mute/background/dispose and silent native/load failures. Native player mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
