const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={}){const m={exports:{}};const c=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('require','module','exports',c)(id=>{if(id in imports)return imports[id];if(id.startsWith('.')){let p=path.normalize(path.join(path.dirname(file),id));return load(p+(fs.existsSync(path.join(root,p+'.ts'))?'.ts':'.tsx'));}throw Error(id);},m,m.exports);return m.exports;}
function harness(){let slots=[],i=0,pending=[];return{react:{useState:init=>{const k=i++;if(!(k in slots))slots[k]=typeof init==='function'?init():init;return[slots[k],v=>{slots[k]=typeof v==='function'?v(slots[k]):v;}];},useRef:init=>{const k=i++;return slots[k]??={current:init};},useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:(fn,deps)=>{const k=i++;if(!slots[k]||!deps||deps.some((d,j)=>d!==slots[k].deps[j])){const old=slots[k];pending.push(()=>{old?.cleanup?.();slots[k]={deps,cleanup:fn()};});}}},render:fn=>{i=0;const tree=fn();const list=pending;pending=[];list.forEach(f=>f());return tree;}};}
const jsx=(type,props)=>({type,props}),native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',Switch:'Switch',StyleSheet:{create:x=>x},BackHandler:{addEventListener:()=>({remove(){}})},Alert:{alert(){}}};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const events=[];const analytics=new Proxy({}, {get:(_,name)=>(...args)=>{events.push([name,...args]);return Promise.resolve();}});
const hook={analytics,enabled:true,ready:true,error:false};
const common={'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../state/BetaAnalytics':{useBetaAnalytics:()=>hook},'../components/UsageSharing':{__esModule:true,default:'UsageSharing'},'../components/ActionButton':{__esModule:true,default:'Button'}};
(async()=>{
 const h=harness();const Welcome=load('src/screens/WelcomeScreen.tsx',{...common,react:h.react}).default;
 const prefs={topicIds:['science','nature','culture'],difficulty:'medium'};
 const props={initialPreferences:prefs,replay:false,hasStartedChallenge:false,onFinish:async()=>true,onSkip:async()=>{}};
 let tree=h.render(()=>Welcome(props));assert.ok(nodes(tree).some(n=>n.type==='UsageSharing'));assert.ok(events.some(e=>e[1]==='onboarding_step_viewed'&&e[2].onboarding_step===1&&e[2].replay===false));
 nodes(tree).find(n=>n.type==='Button'&&n.props.label==='Ας ξεκινήσουμε →').props.onPress();h.render(()=>Welcome(props));assert.ok(events.some(e=>e[2]?.onboarding_step===2));
 const consent=harness();hook.enabled=false;const Usage=load('src/components/UsageSharing.tsx',{...common,react:consent.react}).default;tree=consent.render(()=>Usage());const toggle=nodes(tree).find(n=>n.type==='Switch');assert.equal(toggle.props.value,false);toggle.props.onValueChange(true);await Promise.resolve();assert.ok(events.some(e=>e[0]==='setEnabled'&&e[1]===true));
 // Exercise effects from the real navigator, not a reimplementation of routing.
 hook.enabled=true;events.length=0;const nav=harness(),data=load('src/data/lessons.ts');
 const lesson=data.lessons[0],app={screen:'home',activeCategoryId:lesson.categoryId,activeSubcategoryId:lesson.subcategoryId,activeLessonId:lesson.id,checkpointAnswers:{},completedLessonIds:[],inProgressLessonIds:[],inProgressLessonCount:0,lessonAttempts:{},progressLoaded:true,resultMode:'finished',setScreen:s=>{app.screen=s;}};
 const screens=['Home','Category','Subcategory','Lesson','Quiz','Results','ReviewMistakes','WeeklyReview','Account','SavedLessons','Search','DailyChallenge','DailyChallengePreferences','Progress','Welcome'];
 const imports={...common,react:nav.react,'react-native-safe-area-context':{SafeAreaView:'SafeArea'},'../hooks/useLearningApp':{useLearningApp:()=>app},'../hooks/useAthensDate':{useAthensDate:()=> '2026-10-31'},'../hooks/useSavedLessons':{useSavedLessons:()=>({savedLessonIds:[]})},'../hooks/useDailyChallengePreferences':{useDailyChallengePreferences:()=>({preferences:prefs,savePreferences:async()=>true})},'../hooks/useWelcome':{useWelcome:()=>({visible:false,loading:false,replay:false})},'../state/LearningSession':{useLearningSession:()=>({dailyStore:{}}),useDailySnapshot:()=>({doc:{days:{},preferences:null},userId:null})},'../components/BottomNavigation':{__esModule:true,default:'Tabs'},'../components/SyncStatus':{__esModule:true,default:'SyncStatus'},...Object.fromEntries(screens.map(n=>['../screens/'+n+'Screen',{__esModule:true,default:n}]))};
 const Navigator=load('src/navigation/AppNavigator.tsx',imports).default;
 const render=()=>nav.render(()=>Navigator());render();app.screen='lesson';render();app.checkpointAnswers={0:0};render();app.screen='results';render();
 assert.ok(events.some(e=>e[0]==='lesson'&&e[1]?.lesson_id===lesson.id));assert.ok(events.some(e=>e[0]==='progress'&&e[1]?.answered_count===1));assert.equal(events.filter(e=>e[0]==='completeLesson').length,1);
 events.length=0;app.resultMode='returning';app.activeLessonId=data.lessons[1].id;render();assert.ok(!events.some(e=>e[0]==='completeLesson'),'Saved results never count as new completions');
 app.screen='lesson';render();events.length=0;app.screen='home';render();assert.ok(events.some(e=>e[0]==='lesson'&&e[1]===null),'Confirmed navigation leaves the visit');
 // Provider uses actual AppState events and the existing RPC transport.
 const providerDisk=new Map(),sent=[];let onAppState,intervalTick,cleanupProvider;
 const core=load('src/utils/betaAnalytics.ts');
 const providerNative={AppState:{currentState:'active',addEventListener:(_event,handler)=>{onAppState=handler;return{remove(){}};}},Platform:{OS:'android'}};
 const providerReact={createContext:()=>({Provider:'Provider'}),useState:init=>[init(),()=>{}],useEffect:fn=>{cleanupProvider=fn();}};
 const providerImports={react:providerReact,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':providerNative,'@react-native-async-storage/async-storage':{__esModule:true,default:{getItem:async k=>providerDisk.get(k)??null,setItem:async(k,v)=>{providerDisk.set(k,v);}}},'../lib/supabase':{supabase:{rpc:(name,{events})=>{assert.equal(name,'ingest_beta_events');return{abortSignal:async()=>{sent.push(...events);return{error:null};}};}}},'../utils/betaAnalytics':core};
 const providerCode=ts.transpileModule(fs.readFileSync(path.join(root,'src/state/BetaAnalytics.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('require','module','exports','__DEV__','setInterval','clearInterval',providerCode)(id=>{assert.ok(id in providerImports,id);return providerImports[id];},mod,mod.exports,true,fn=>{intervalTick=fn;return 1;},()=>{});
 const providerTree=mod.exports.BetaAnalyticsProvider({children:'child'}),store=providerTree.props.value;
 const settle=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};await settle();await store.setEnabled(true);await settle();assert.ok(sent.some(e=>e.event_name==='session_started'&&e.environment==='development'));
 onAppState('inactive');await settle();assert.equal(sent.filter(e=>e.event_name==='session_backgrounded').length,0);
 await store.view('home');onAppState('background');await settle();assert.equal(sent.filter(e=>e.event_name==='session_backgrounded').length,1);
 onAppState('active');await settle();assert.ok(sent.some(e=>e.event_name==='screen_viewed'));intervalTick();cleanupProvider();
 console.log('Analytics UI passed: welcome step events, sharing switch, real navigator lesson entry/checkpoints/completion/exit, saved-result exclusion. Native rendering mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
