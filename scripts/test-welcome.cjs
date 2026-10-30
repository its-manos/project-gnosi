/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,imports={}) {
 if(!Object.keys(imports).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,setTimeout,clearTimeout,require:id=>{
  if(id in imports)return imports[id];
  if(id.startsWith('.')){const p=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',p+'.ts'))?p+'.ts':p+'.tsx');}
  throw Error(id);
 }});if(!Object.keys(imports).length)cache.set(file,m.exports);return m.exports;
}
const first=load('src/utils/firstRun.ts'),topics=load('src/data/dailyChallengeTopics.ts'),daily=load('src/utils/dailyChallenge.ts'),questions=load('src/data/questions.ts'),data=load('src/data/lessons.ts');
const {DailyStore}=load('src/state/DailyStore.ts');const initial=topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES;
const choices={topicIds:['history','science','nature'],difficulty:'hard'};
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function disk(){const map=new Map();let fail=false;return{map,setFail:v=>{fail=v;},getItem:async k=>map.get(k)??null,multiGet:async keys=>keys.map(k=>[k,map.get(k)??null]),setItem:async(k,v)=>{if(fail)throw Error('storage');map.set(k,v);}};}
function reactHarness(){let slots=[],cursor=0,effect;return{react:{useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:init=>{const i=cursor++;return slots[i]??={current:init};},useEffect:fn=>{effect??=fn;},useMemo:fn=>fn(),useCallback:fn=>fn},render(fn){cursor=0;return fn();},mount(){return effect();}};}
const jsx=(type,props)=>({type,props});const native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'Spinner',StyleSheet:{create:x=>x},Alert:{alert(){}}};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const button=(t,label)=>{const n=nodes(t).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(n,label);return n;};
const press=(t,label)=>{const n=nodes(t).find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label);assert.ok(n,label);n.props.onPress();};
(async()=>{
 assert.equal(first.shouldShowWelcome(null,null,false,[]),true);
 for(const args of [['done',null,false,[]],[null,'A',false,[]],[null,null,true,[]],[null,null,false,['[]']]])assert.equal(first.shouldShowWelcome(...args),false);
 function welcomeHook(storage,user=null,activity=false){const h=reactHarness();const invoke=load('src/hooks/useWelcome.ts',{react:h.react,'@react-native-async-storage/async-storage':{__esModule:true,default:storage}}).useWelcome;return{render:()=>h.render(()=>invoke(user,activity)),mount:()=>h.mount()};}
 const d=disk(),hook=welcomeHook(d);hook.render();const cleanup=hook.mount();await flush();let state=hook.render();assert.equal(state.visible,true);assert.equal(await state.complete(),true);assert.equal(d.map.get(first.WELCOME_STORAGE_KEY),'done');state=hook.render();assert.equal(state.visible,false);state.open();state=hook.render();assert.equal(state.replay,true);await state.skip();cleanup();
 const legacyDisk=disk();legacyDisk.map.set('@gnosi/saved-lesson-ids','[]');const legacyHook=welcomeHook(legacyDisk);legacyHook.render();const endLegacy=legacyHook.mount();await flush();assert.equal(legacyHook.render().visible,false);endLegacy();
 const skipDisk=disk(),skipHook=welcomeHook(skipDisk);skipHook.render();const endSkip=skipHook.mount();await flush();skipDisk.setFail(true);assert.equal(await skipHook.render().skip(),true);assert.equal(skipHook.render().visible,false);endSkip();
 let resolveRead;const delayed=disk();delayed.getItem=()=>new Promise(r=>{resolveRead=r;});const stale=welcomeHook(delayed);stale.render();const endStale=stale.mount();endStale();resolveRead(null);await flush();assert.equal(stale.render().loading,true,'Unmounted loads cannot open the guide.');
 // Actual scoped daily store: settings + first question before completion marker.
 const store=new DailyStore(null,disk());await store.start();let marked=0;
 const complete=async()=>{marked++;return true;};
 assert.equal(await first.finishWelcome(store,choices,'daily',()=>true,complete),true);assert.equal(marked,1);
 const today=daily.getAthensDateKey();let day=store.getSnapshot().doc.days[today];assert.equal(day.record.questionIds.length,7);assert.equal(day.record.currentIndex,0);assert.equal(Object.keys(day.record.answers).length,0);
 const pinned=plain(day.record.questionIds);assert.equal(await first.finishWelcome(store,initial,'daily',()=>true,complete),true);assert.deepEqual(plain(store.getSnapshot().doc.days[today].record.questionIds),pinned);
 day=store.getSnapshot().doc.days[today];const answers=Object.fromEntries(day.record.questionIds.map((id,i)=>[String(i),questions.questions.find(q=>q.id===id).correctIndex]));store.commitRecord({...day.record,currentIndex:6,answers,completed:true},day);await store.flushLocal();const finished=plain(store.getSnapshot().doc.days[today]);await first.finishWelcome(store,choices,'daily',()=>true,complete);assert.deepEqual(plain(store.getSnapshot().doc.days[today]),finished,'Guide replay cannot reset a completed quiz.');
 const homeStore=new DailyStore(null,disk());await homeStore.start();await first.finishWelcome(homeStore,choices,'home',()=>true,complete);assert.equal(Object.keys(homeStore.getSnapshot().doc.days).length,0,'Article destination does not start a quiz.');
 let touched=false;assert.equal(await first.finishWelcome({savePreferences:async()=>{touched=true;return true;}},choices,'home',()=>false,complete),false);assert.equal(touched,false);
 assert.equal(await first.finishWelcome({savePreferences:async()=>false},choices,'daily',()=>true,complete),false);
 const previousMarks=marked;assert.equal(await first.finishWelcome(homeStore,choices,'home',()=>true,async()=>false),false);assert.equal(marked,previousMarks);
 // Screen interactions: bounds, back/draft retention, no auth wall, errors and double taps.
 const ui=reactHarness();let finishCalls=[],skips=0,resolveFinish;
 let finishAction=async()=>true;
 const Screen=load('src/screens/WelcomeScreen.tsx',{react:ui.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../components/ActionButton':{__esModule:true,default:'Button'}}).default;
 const props={initialPreferences:initial,replay:false,hasStartedChallenge:false,onFinish:async(p,dest)=>{finishCalls.push([p,dest]);return finishAction();},onSkip:async()=>{skips++;}};
 const render=()=>ui.render(()=>Screen(props));let tree=render();const endUi=ui.mount();assert.ok(!nodes(tree).some(n=>n.type==='TextInput'));
 button(tree,'Φτιάξε την πρώτη σου πρόκληση →').props.onPress();tree=render();assert.equal(button(tree,'Συνέχεια →').props.disabled,true);
 for(const topic of topics.DAILY_CHALLENGE_TOPICS.slice(0,5)){press(tree,topic.title);tree=render();}
 assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,5);assert.ok(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&!n.props.accessibilityState.checked).every(n=>n.props.disabled));
 press(tree,topics.DAILY_CHALLENGE_TOPICS[0].title);tree=render();press(tree,topics.DAILY_CHALLENGE_TOPICS[1].title);tree=render();assert.equal(button(tree,'Συνέχεια →').props.disabled,false);button(tree,'Συνέχεια →').props.onPress();tree=render();
 const hard=nodes(tree).find(n=>n.props?.accessibilityRole==='radio'&&n.props.accessibilityLabel.startsWith('Δύσκολο.'));hard.props.onPress();tree=render();press(tree,'Προηγούμενο βήμα');tree=render();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,3);button(tree,'Συνέχεια →').props.onPress();tree=render();
 finishAction=()=>new Promise(r=>{resolveFinish=r;});const start=button(tree,'Πάμε στις 7 ερωτήσεις →');start.props.onPress();start.props.onPress();assert.equal(finishCalls.length,1);tree=render();assert.equal(nodes(tree).find(n=>n.props?.accessibilityLabel==='Παράλειψη οδηγού').props.disabled,true);resolveFinish(false);await flush();tree=render();assert.ok(JSON.stringify(tree).includes('Δεν ολοκληρώθηκε η αποθήκευση'));assert.equal(finishCalls[0][0].difficulty,'hard');finishAction=async()=>true;button(tree,'Αποθήκευση & εξερεύνηση άρθρων').props.onPress();await flush();assert.equal(finishCalls.at(-1)[1],'home');assert.equal(skips,0);endUi();
 const skipUi=reactHarness();const SkipScreen=load('src/screens/WelcomeScreen.tsx',{react:skipUi.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../components/ActionButton':{__esModule:true,default:'Button'}}).default;tree=skipUi.render(()=>SkipScreen(props));const endSkipUi=skipUi.mount();const beforeFinish=finishCalls.length;button(tree,'Εξερεύνησε τα άρθρα τώρα').props.onPress();await flush();assert.equal(skips,1);assert.equal(finishCalls.length,beforeFinish);endSkipUi();
 // Existing preference drafts survive fresh props delivered by background sync.
 let prefSlots=[],prefCursor=0,prefEffects=[];
 const prefReact={useState:init=>{const i=prefCursor++;if(!(i in prefSlots))prefSlots[i]=init;return[prefSlots[i],v=>{prefSlots[i]=typeof v==='function'?v(prefSlots[i]):v;}];},useEffect:(fn,deps)=>{const i=prefCursor++;if(!prefSlots[i]||deps.some((d,j)=>d!==prefSlots[i][j])){prefSlots[i]=deps;prefEffects.push(fn);}}};
 const PrefScreen=load('src/screens/DailyChallengePreferencesScreen.tsx',{react:prefReact,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../components/ActionButton':{__esModule:true,default:'Button'},'../components/AppHeader':{__esModule:true,default:'Header'}}).default;
 let prefProps={initialPreferences:initial,isLoading:false,onSave:async()=>true,onCancel:()=>{}};
 const renderPrefs=()=>{prefCursor=0;const t=PrefScreen(prefProps);const pending=prefEffects;prefEffects=[];for(const fn of pending)fn();return t;};
 tree=renderPrefs();nodes(tree).find(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).props.onPress();tree=renderPrefs();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,4);
 prefProps={...prefProps,initialPreferences:choices};renderPrefs();tree=renderPrefs();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,4,'Background sync cannot overwrite an unsaved preference draft.');
 // Real AppNavigator route boundary: welcome hides tabs; finishing opens daily directly.
 const nav=reactHarness();let visible=true;
 const navStore=new DailyStore(null,disk());await navStore.start();
 const app={screen:'home',activeCategoryId:data.categories[0].id,activeSubcategoryId:data.subcategories[0].id,activeLessonId:data.lessons[0].id,completedLessonIds:[],lessonAttempts:{},progressLoaded:true,inProgressLessonIds:[],inProgressLessonCount:0,setScreen:s=>{app.screen=s;}};
 const screens=['HomeScreen','CategoryScreen','SubcategoryScreen','LessonScreen','QuizScreen','ResultsScreen','ReviewMistakesScreen','WeeklyReviewScreen','SavedLessonsScreen','SearchScreen','DailyChallengeScreen','DailyChallengePreferencesScreen','ProgressScreen','WelcomeScreen'];
 const screenImports=Object.fromEntries(screens.map(name=>['../screens/'+name,{__esModule:true,default:name}]));
 const Navigator=load('src/navigation/AppNavigator.tsx',{...screenImports,react:nav.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{SafeAreaView:'SafeArea'},'../hooks/useWelcome':{useWelcome:()=>({visible,loading:false,replay:false,isCurrent:()=>true,complete:async()=>{visible=false;return true;},skip:async()=>{visible=false;return true;},open:()=>{visible=true;}})},'../hooks/useLearningApp':{useLearningApp:()=>app},'../hooks/useSavedLessons':{useSavedLessons:()=>({savedLessonIds:[],isSavedLessonsLoaded:true})},'../hooks/useAthensDate':{useAthensDate:()=>today},'../hooks/useDailyChallengePreferences':{useDailyChallengePreferences:()=>({preferences:initial,isLoading:false,savePreferences:p=>navStore.savePreferences(p)})},'../state/LearningSession':{useLearningSession:()=>({dailyStore:navStore}),useDailySnapshot:()=>navStore.getSnapshot()},'../components/BottomNavigation':{__esModule:true,default:'Tabs'},'../components/SyncStatus':{__esModule:true,default:'SyncStatus'}}).default;
 let routed=nav.render(()=>Navigator());assert.ok(!nodes(routed).some(n=>n.type==='Tabs'));const welcome=nodes(routed).find(n=>n.type==='WelcomeScreen');await welcome.props.onFinish(choices,'daily');routed=nav.render(()=>Navigator());assert.ok(nodes(routed).some(n=>n.type==='DailyChallengeScreen'));assert.ok(nodes(routed).some(n=>n.type==='Tabs'));assert.equal(navStore.getSnapshot().doc.days[today].record.started,true);
 store.stop();homeStore.stop();navStore.stop();
 console.log('Welcome checks passed: fresh/returning detection, legacy protection, marker/skip/storage failure, cleanup, selection bounds, back/draft retention, difficulty, double taps, errors, direct challenge creation, started/completed preservation and actual navigation routing. Native views mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
