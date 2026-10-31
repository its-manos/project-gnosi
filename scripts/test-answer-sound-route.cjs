const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const jsx=(type,props)=>({type,props}),flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const events=load('src/play/events.ts'),status=load('src/play/soundStatus.ts'),prefs=load('src/play/preferences.ts');
const {LearningStore}=load('src/state/LearningStore.ts'),{DailyStore}=load('src/state/DailyStore.ts'),{lessons}=load('src/data/lessons.ts'),{questions}=load('src/data/questions.ts');
const {getAthensDateKey}=load('src/utils/dailyChallenge.ts'),{createSharedDailyRecord}=load('src/utils/sharedDailyChallenge.ts');
const {dailyRecordSession,updateDailyRecord}=load('src/quiz/compatibility.ts'),{questionToken,submitQuizAnswer,advanceQuizSession}=load('src/quiz/engine.ts');
const heard=[],players=[];
const {FeedbackAudio}=load('src/play/audio.ts',{'react-native':{Platform:{OS:'android'}},'./soundStatus':status,'expo-audio':{setAudioModeAsync:async()=>{},createAudioPlayer:source=>{
 let listener;const p={isLoaded:true,currentTime:0,firstPlay:true,addListener(_event,fn){listener=fn;return{remove(){listener=null;}};},play(){assert.equal(this.isLoaded,true,'rewind must restore a completed Android player before play');if(this.firstPlay){assert.equal(this.volume,0,'cold native playback must be muted');this.firstPlay=false;}else{assert.ok(this.volume>0,'real answer must be audible');heard.push(source);}this.currentTime=.23;this.isLoaded=false;listener?.({didJustFinish:true,isLoaded:false});},pause(){},remove(){},async seekTo(){this.currentTime=0;this.isLoaded=true;listener?.({isLoaded:true});}};players.push(p);return p;
}},...Object.fromEntries(['correct','incorrect','complete','mastered','level-up'].map(k=>['../../assets/sounds/'+k+'.wav',k]))});
let slots=[],cursor=0,effects=[];
const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:init=>{const i=cursor++;return slots[i]??={current:init};},useEffect:(fn,deps)=>{const i=cursor++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j]))effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}};
const native={View:'View',Text:'Text',StyleSheet:{create:x=>x},Animated:{Value:class{setValue(){} interpolate(){return 0;}}},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:()=>({remove(){}})}};
(async()=>{
 let resolvePreferences;const preferencesReady=new Promise(resolve=>{resolvePreferences=resolve;});
 const map=new Map(),storage={getItem:async k=>{if(k===prefs.PLAY_PREFERENCES_KEY)await preferencesReady;return map.get(k)??null;},setItem:async(k,v)=>map.set(k,v)},store=new LearningStore(null,storage),dailyStore=new DailyStore(null,storage);await store.start();await dailyStore.start();
 const Provider=load('src/play/PlayFeedback.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'../state/LearningSession':{useLearningSession:()=>({store,dailyStore})},'./audio':{FeedbackAudio},'./events':events,'./preferences':prefs,'./soundStatus':status,'./motion':{usePlayMotion:()=>false}}).default;
 const render=()=>{cursor=0;Provider({children:null});const pending=effects;effects=[];pending.forEach(fn=>fn());};
 try{
 render();await flush();assert.deepEqual(heard,[],'hydration stays quiet');
 const lesson=lessons[0],answers={},first=lesson.questions[0];answers[0]=first.correctIndex;
 store.answer(lesson.id,{checkpointAnswers:{...answers},score:1,updatedAt:Date.now(),replayOfCompletedLesson:false});
 await flush();render();assert.deepEqual(heard,[],'first lesson answer waits for sound preferences instead of being lost');
 resolvePreferences();await flush();assert.deepEqual(heard,['correct'],'the first lesson answer plays without test-sound prewarming');
 status.requestSoundPreview();await flush();assert.deepEqual(heard,['correct','correct'],'preview works after the real first answer');
 for(let i=1;i<3;i++){const q=lesson.questions[i],answer=(q.correctIndex+1)%q.answers.length;answers[i]=answer;store.answer(lesson.id,{checkpointAnswers:{...answers},score:1,updatedAt:Date.now()+i,replayOfCompletedLesson:false});await flush();render();}
 assert.deepEqual(heard,['correct','correct','incorrect','incorrect'],'real answers and preview replay after repeated Android STATE_ENDED');
 const n=heard.length;store.answer(lesson.id,{checkpointAnswers:{...answers},score:1,updatedAt:Date.now()+10,replayOfCompletedLesson:false});await flush();assert.equal(heard.length,n,'duplicate tap remains silent');
 const date=getAthensDateKey();dailyStore.commitRecord(createSharedDailyRecord(date),undefined);
 const expected=[];while(!dailyStore.getSnapshot().doc.days[date].record.completed){const day=dailyStore.getSnapshot().doc.days[date],record=day.record,session=dailyRecordSession(record,questions),token=questionToken(session);
 if(record.answers[record.currentIndex]===undefined){const q=questions.find(q=>'daily:'+q.id===token.id),right=record.currentIndex%2===0;expected.push(right?'correct':'incorrect');dailyStore.commitRecord(updateDailyRecord(record,submitQuizAnswer(session,token,right?q.correctIndex:(q.correctIndex+1)%q.answers.length).session),day);await flush();render();}
 else{dailyStore.commitRecord(updateDailyRecord(record,advanceQuizSession(session,token).session),day);await flush();render();}}
 assert.deepEqual(heard.slice(n,n+7),expected,'every accepted daily answer reaches the real provider and audio service');assert.equal(players.length,5,'normal playback and preview share cached players');
 console.log('Answer sound route passed: cold Android native first play is silent, prewarm is inaudible, first accepted lesson answer and daily quiz answers are audible after warm-up. Native playback mocked.');
 }finally{slots.forEach(s=>s?.cleanup?.());store.stop();dailyStore.stop();}
})().catch(e=>{console.error(e);process.exitCode=1;});
