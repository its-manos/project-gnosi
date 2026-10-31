const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const jsx=(type,props)=>({type,props}),nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
function harness(){let slots=[],i=0,queued=[];return{react:{useState:init=>{const n=i++;if(!(n in slots))slots[n]=typeof init==='function'?init():init;return[slots[n],v=>{slots[n]=typeof v==='function'?v(slots[n]):v;}];},useRef:init=>{const n=i++;return slots[n]??={current:init};},useSyncExternalStore:(_sub,snapshot)=>snapshot(),useEffect:(fn,deps)=>{const n=i++;if(!slots[n]||deps.some((d,j)=>d!==slots[n].deps[j]))queued.push(()=>{slots[n]?.cleanup?.();slots[n]={deps,cleanup:fn()};});}},render:fn=>{i=0;const tree=fn();const q=queued;queued=[];q.forEach(fn=>fn());return tree;},cleanup:()=>slots.forEach(s=>s?.cleanup?.())};}
class Value{constructor(n){this.n=n;}setValue(n){this.n=n;}interpolate(config){return{value:this,config};}}
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
(async()=>{
 let started=0,stopped=0,deviceReduced,appState;
 const animation=()=>({start(){started++;},stop(){stopped++;}});
 const native={Text:'Text',View:'View',Switch:'Switch',StyleSheet:{create:x=>x},Animated:{Value,View:'AnimatedView',timing:animation,sequence:animation,delay:animation},AppState:{currentState:'active',addEventListener:(_e,fn)=>{appState=fn;return{remove(){}};}},AccessibilityInfo:{addEventListener:(_e,fn)=>{deviceReduced=fn;return{remove(){}};},isReduceMotionEnabled:async()=>false}};
 const events=load('src/play/events.ts'),prefs=load('src/play/preferences.ts'),status=load('src/play/soundStatus.ts'),h=harness();let sounds=[],stops=0,disposed=0;
 class Audio{async start(){}play(kind,allowed){if(allowed())sounds.push(kind);}preview(allowed){this.play('correct',allowed);}stop(){stops++;}dispose(){disposed++;}}
 const store={userId:'one',getSnapshot:()=>({rewards:{'lesson:test':210}})},dailyStore={getSnapshot:()=>({doc:{rewards:{}}})};
 const storage={getItem:async()=>null,setItem:async()=>{}};
 const Provider=load('src/play/PlayFeedback.tsx',{react:h.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:20})},'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'../state/LearningSession':{useLearningSession:()=>({store,dailyStore})},'./events':events,'./preferences':prefs,'./motion':{usePlayMotion:()=>false},'./audio':{FeedbackAudio:Audio},'./soundStatus':status}).default;
 const render=()=>h.render(()=>Provider({children:'app'}));let tree=render();await flush();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'mount/hydration is silent');
 const e={scope:'one',id:'finish:1',kind:'complete',xp:60,label:'Μάθημα ολοκληρώθηκε'};events.emitPlayFeedback(e);tree=render();assert.ok(text(tree).includes('Επίπεδο 2'));assert.ok(!text(tree).includes('+60 XP'),'completion total stays in results');assert.equal(sounds.at(-1),'level-up');assert.equal(started,0,'disabled motion keeps static feedback');
 const count=sounds.length;events.emitPlayFeedback(e);events.emitPlayFeedback({...e,id:'foreign',scope:'other'});assert.equal(sounds.length,count);
 deviceReduced(true);assert.equal(prefs.playPreferences.getSnapshot().reducedMotion,true);appState('background');tree=render();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'));events.emitPlayFeedback({...e,id:'background'});assert.equal(sounds.length,count);appState('active');
 await prefs.playPreferences.set('sound',false);assert.ok(stops>0);events.emitPlayFeedback({...e,id:'muted',xp:0,kind:'correct',answerXP:17,pendingXP:true});tree=render();assert.equal(sounds.length,count);assert.ok(text(tree).includes('+17 XP'),'muted audio does not hide answer XP');assert.ok(text(tree).includes('Πιστώνονται στην ολοκλήρωση'));events.emitPlayFeedback({...e,id:'wrong',xp:0,kind:'incorrect',answerXP:0});tree=render();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'zero XP answers dismiss an earlier earned-XP popup');appState('background');appState('active');events.emitPlayFeedback({...e,id:'ordinary-complete',xp:0});tree=render();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'no ordinary completion popup');
// A replay can be correct but earns no additional XP: keep audio feedback,
// without a +0 XP popup. Zero-XP mastery notifications follow the same rule.
await prefs.playPreferences.set('sound',true);
const beforeReplaySound=sounds.length;
events.emitPlayFeedback({...e,id:'replay-correct',xp:0,kind:'correct',answerXP:0,pendingXP:false});
tree=render();assert.equal(sounds.length,beforeReplaySound+1,'replay answer sound still plays');
assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'replay +0 XP popup hidden');
events.emitPlayFeedback({...e,id:'mastery-no-xp',xp:0,kind:'mastered'});
tree=render();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'zero XP mastery popup hidden');
events.emitPlayFeedback({...e,id:'mastery-with-xp',xp:10,kind:'mastered'});
tree=render();assert.ok(nodes(tree).some(n=>n.props.testID==='play-celebration'),'positive XP mastery remains visible');
events.emitPlayFeedback({...e,id:'replay-after-mastery',xp:0,kind:'correct',answerXP:0});
tree=render();assert.ok(!nodes(tree).some(n=>n.props.testID==='play-celebration'),'zero XP after a milestone closes the popup');
await prefs.playPreferences.set('sound',false);
assert.equal(prefs.playPreferences.getSnapshot().sound,false,'restore muted preference after replay audio check');

 const Settings=load('src/components/PlayFeedbackSettings.tsx',{react:h.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../play/preferences':prefs,'../play/soundStatus':status,'./ActionButton':{__esModule:true,default:'Button'}}).default;tree=h.render(()=>Settings());const switches=nodes(tree).filter(n=>n.type==='Switch');assert.equal(switches.length,2);assert.equal(switches[0].props.value,false);assert.equal(switches[1].props.value,true);switches[1].props.onValueChange(false);await flush();assert.equal(prefs.playPreferences.getSnapshot().animations,false);assert.equal(prefs.playPreferences.getSnapshot().sound,false);
 await prefs.playPreferences.set('sound',true);status.requestSoundPreview();assert.equal(sounds.at(-1),'correct','test sound uses live provider');await prefs.playPreferences.set('sound',false);const afterPreview=sounds.length;h.cleanup();assert.equal(disposed,1);events.emitPlayFeedback({...e,id:'after-unmount'});assert.equal(sounds.length,afterPreview,'unmounted provider cannot play');
 const mh=harness();let enabled=true;
 const Motion=load('src/play/motion.tsx',{react:mh.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'./preferences':{motionAllowed:p=>p.on,playPreferences:{getSnapshot:()=>({on:enabled}),subscribe:()=>()=>{}}}}).AnswerMotion;
 const startBefore=started;mh.render(()=>Motion({active:true,children:'restored'}));assert.equal(started,startBefore,'restored answers do not pulse');mh.render(()=>Motion({active:false,children:'new'}));mh.render(()=>Motion({active:true,children:'accepted'}));assert.equal(started,startBefore+1);enabled=false;mh.render(()=>Motion({active:true,children:'reduced'}));assert.ok(stopped>0);mh.cleanup();
 const bh=harness();const Bar=load('src/components/ProgressBar.tsx',{react:bh.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../play/motion':{usePlayMotion:()=>false}}).default;
 for(const [input,expected] of [[-5,0],[0,0],[50,50],[150,100],[NaN,0]]){const bar=bh.render(()=>Bar({progress:input,label:'XP'}));assert.equal(bar.props.accessibilityRole,'progressbar');assert.equal(bar.props.accessibilityValue.now,expected);assert.equal(bar.props.accessibilityLabel,'XP');}bh.cleanup();
 console.log('Feedback UI passed: live level/XP celebration from accepted events, quiet hydration/duplicates/foreign scope, mute/background/unmount cancellation, independent switches, reduced motion and fresh-vs-restored answer pulses. Native views/audio mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
