const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const {LearningStore}=load('src/state/LearningStore.ts'),{DailyStore}=load('src/state/DailyStore.ts');
const {lessons}=load('src/data/lessons.ts'),{questions}=load('src/data/questions.ts');
const jsx=(type,props,key)=>({type,props,key});
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const disk=()=>{const map=new Map();return{getItem:async k=>map.get(k)??null,setItem:async(k,v)=>map.set(k,v)};};
const storage=disk(),learning=new LearningStore('fresh-account',storage),daily=new DailyStore('fresh-account',storage);
let expanded=false,memoIndex=0,memos=[],latest,renderCount=0;
const useKnowledgeProfile=load('src/hooks/useKnowledgeProfile.ts',{
 react:{useMemo:(calculate,deps)=>{const i=memoIndex++;if(!memos[i]||deps.some((v,j)=>v!==memos[i].deps[j]))memos[i]={deps,value:calculate()};return memos[i].value;}},
 '../state/LearningSession':{useLearningSnapshot:()=>learning.getSnapshot(),useDailySnapshot:()=>daily.getSnapshot()},
 './useAthensDate':{useAthensDate:()=> '2026-10-31'}
}).useKnowledgeProfile;
const Card=load('src/components/KnowledgeProgress.tsx',{ './ProgressBar':{__esModule:true,default:'ProgressBar'},
 react:{useState:()=>[expanded,v=>{expanded=typeof v==='function'?v(expanded):v;}]},
 'react/jsx-runtime':{jsx,jsxs:jsx},
 'react-native':{Text:'Text',View:'View',Pressable:'Pressable',StyleSheet:{create:x=>x}},
 '../hooks/useKnowledgeProfile':{useKnowledgeProfile}
}).default;
const render=()=>{memoIndex=0;renderCount++;latest=Card({});};
const title=()=>nodes(latest).find(n=>n.props?.testID==='player-title');
const unsubscribe=[learning.subscribe(render),daily.subscribe(render)];
(async()=>{
 render();assert.equal(title(),undefined,'no stale title before hydration');
 await learning.start();await daily.start();
 assert.equal(title().props.children,'Αρχάριος');const originalKey=title().key;
 nodes(latest).find(n=>n.type==='Pressable').props.onPress();render();assert.equal(expanded,true);
 const lesson=lessons[0],answers=Object.fromEntries(lesson.questions.map((q,i)=>[i,q.correctIndex]));
 learning.complete(lesson.id,{id:'first',answers});
 assert.equal(title().props.children,'Αρχάριος');
 const before=renderCount,selected=questions.slice(0,7);
 daily.commitRecord({dateKey:'2026-10-31',started:true,completed:true,currentIndex:6,questionIds:selected.map(q=>q.id),answers:Object.fromEntries(selected.map((q,i)=>[i,q.correctIndex]))},undefined);
 assert.ok(renderCount>before,'local daily reward synchronously notifies the mounted card');
 assert.equal(title().props.children,'Μαθητευόμενος','title updates before storage flush or app restart');
 assert.notEqual(title().key,originalKey,'the native title text is remeasured for the new level');
 assert.equal(title().props.accessibilityLiveRegion,'polite');assert.equal(title().props.style.flexShrink,1);assert.equal(title().props.style.maxWidth,'100%');
 assert.equal(expanded,true,'updating the title does not remount/reset the whole card');
 assert.ok(nodes(latest).find(n=>n.type==='Pressable').props.accessibilityState.expanded);
 // Existing credits arriving from another device/import update the same mounted hook.
 const credits=Object.fromEntries(Array.from({length:10},(_,i)=>[`day:2026-10-${String(i+1).padStart(2,'0')}`,220]));
 await daily.importGuest({schemaVersion:1,clock:0,preferences:null,days:{},rewards:credits});
 assert.equal(title().props.children,'Εξερευνητής');
 const total=learning.getSnapshot().rewards;learning.complete(lesson.id,{id:'replay',answers});
 assert.equal(title().props.children,'Εξερευνητής');assert.deepEqual(learning.getSnapshot().rewards,total);
 console.log('Live title passed: fresh-account hydration, real learning/daily store notifications, level 1→2 and 5 title transitions without restart/remount, import updates, persistent card disclosure, native text layout props and replay stability. Native views mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{unsubscribe.forEach(fn=>fn());learning.stop();daily.stop();});
