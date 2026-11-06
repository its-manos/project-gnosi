const analyticsStub = { analytics: new Proxy({}, { get: () => async () => {} }), enabled: false };
/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,imports={}) {
 if(!Object.keys(imports).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,setTimeout,clearTimeout,require:id=>{
  if(id === '../state/BetaAnalytics') return { useBetaAnalytics: () => analyticsStub };
  if(id === '../components/UsageSharing') return { __esModule: true, default: 'UsageSharing' };
  if(id in imports)return imports[id];
  if(id.startsWith('.')){const p=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',p+'.ts'))?p+'.ts':p+'.tsx');}
  throw Error(id);
 }});if(!Object.keys(imports).length)cache.set(file,m.exports);return m.exports;
}
const first=load('src/utils/firstRun.ts'),topics=load('src/data/dailyChallengeTopics.ts'),daily=load('src/utils/dailyChallenge.ts'),questions=load('src/data/questions.ts'),data=load('src/data/lessons.ts');
const {DailyStore}=load('src/state/DailyStore.ts');const initial=topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES;
const welcomeLessons=load('src/utils/welcomeLesson.ts'),lessonPaths=load('src/utils/lessonPath.ts');
const choices={topicIds:['history','science','nature'],difficulty:'hard'};
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function disk(){const map=new Map();let fail=false;return{map,setFail:v=>{fail=v;},getItem:async k=>map.get(k)??null,multiGet:async keys=>keys.map(k=>[k,map.get(k)??null]),setItem:async(k,v)=>{if(fail)throw Error('storage');map.set(k,v);}};}
function reactHarness(){let slots=[],cursor=0,effect;return{react:{useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:init=>{const i=cursor++;return slots[i]??={current:init};},useEffect:fn=>{effect??=fn;},useMemo:fn=>fn(),useCallback:fn=>fn},render(fn){cursor=0;return fn();},mount(){return effect();}};}
let backHandler,leaveAlert;
const jsx=(type,props)=>({type,props});const native={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'Spinner',StyleSheet:{create:x=>x},Alert:{alert(...args){leaveAlert=args;}},BackHandler:{addEventListener(_event,handler){backHandler=handler;return{remove(){backHandler=null;}};}}};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const button=(t,label)=>{const n=nodes(t).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(n,label);return n;};
const press=(t,label)=>{const n=nodes(t).find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label);assert.ok(n,label);n.props.onPress();};
(async()=>{
 assert.equal(first.shouldShowWelcome(null,null,false,[]),true);
 assert.equal(first.shouldShowWelcome('question',null,true,[]),true,'Daily activity must not dismiss an unfinished onboarding');
 assert.equal(first.shouldShowWelcome('choose','signed-in',true,[]),true);
 assert.equal(first.shouldShowWelcome('interests',null,true,[]),true);
 assert.equal(first.ONBOARDING_INTRO_LESSON_ID,'ancient-athens');
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
 const candidates=welcomeLessons.welcomeLessonCandidates(data.lessons,[],[]);
 assert.ok(candidates.length>0);assert.ok(candidates.every(l=>!l.contentNote&&lessonPaths.getLessonAccess(l,data.lessons,[]).unlocked));
 const suggested=welcomeLessons.pickWelcomeLesson(candidates,['science','history','nature']);assert.equal(suggested.categoryId,'science');
 assert.equal(welcomeLessons.pickWelcomeLesson(candidates,['sports','everyday']).id,candidates[0].id,'unsupported article interests fall back safely');
 assert.equal(welcomeLessons.pickWelcomeLesson([],choices.topicIds),null);
 assert.equal(welcomeLessons.welcomeLessonCandidates(data.lessons,data.lessons.map(l=>l.id),[]).length,0);
 assert.ok(!welcomeLessons.welcomeLessonCandidates(data.lessons,[],[suggested.id]).some(l=>l.id===suggested.id),'do not call an unfinished article a new first lesson');
 await first.finishWelcome(homeStore,choices,'lesson',()=>true,complete);assert.equal(Object.keys(homeStore.getSnapshot().doc.days).length,0,'lesson selection does not create a daily challenge');
 let touched=false;assert.equal(await first.finishWelcome({savePreferences:async()=>{touched=true;return true;}},choices,'home',()=>false,complete),false);assert.equal(touched,false);
 assert.equal(await first.finishWelcome({savePreferences:async()=>false},choices,'daily',()=>true,complete),false);
 const previousMarks=marked;assert.equal(await first.finishWelcome(homeStore,choices,'home',()=>true,async()=>false),false);assert.equal(marked,previousMarks);
 // Four-stage playable onboarding, including interest selection.
 const ui=reactHarness();let phase='welcome',category=null,skips=0;
 const uiNative={...native,useWindowDimensions:()=>({height:830,fontScale:1})};
 const Screen=load('src/screens/WelcomeScreen.tsx',{react:ui.react,'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-native':uiNative,'../components/ActionButton':{__esModule:true,default:'Button'},
  '../components/AtlasCard':{__esModule:true,default:'AtlasCard'},
  '../components/ProgressGradientBackground':{__esModule:true,default:'Background'},
  '../components/worldIcons/categoryIconMap':{getCategoryWorldIcon:()=>null},
  '../components/WelcomeStepIcons':{WelcomeQuizIcon:'QuizIcon',WelcomeLessonIcon:'LessonIcon'},
  './OnboardingDailyQuestion':{__esModule:true,default:'OnboardingDailyQuestion'}}).default;
 let savedInterests=null;
 const props=()=>({phase,replay:false,categories:data.categories,selectedCategoryId:category,
  preferences:initial,preferencesLoaded:true,onAdvance:async (next,chosen)=>{phase=next;category=chosen??category;return true;},
  onBeginLesson:async value=>{savedInterests=value;phase='lesson';return true;},
  onSkip:async()=>{skips++;}});
 const draw=()=>ui.render(()=>Screen(props()));let tree=draw();const endUi=ui.mount();
 assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel==='Βήμα 1 από 4'));
 assert.ok(!JSON.stringify(tree).includes('Μικρές προκλήσεις'));
 assert.equal(nodes(tree).filter(n=>n.type==='QuizIcon'||n.type==='LessonIcon').length,2,'Branded quiz/book icons replace placeholder glyphs');
 button(tree,'Ξεκινάμε →').props.onPress();await flush();tree=draw();
 assert.ok(nodes(tree).some(n=>n.type==='OnboardingDailyQuestion'),'Play the actual first daily question, not a static illustration');
 assert.equal(nodes(tree).find(n=>n.type==='OnboardingDailyQuestion').props.preferences,initial);
 await nodes(tree).find(n=>n.type==='OnboardingDailyQuestion').props.onContinue();tree=draw();
 assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel==='Βήμα 3 από 4'));
 assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='radio').length,data.categories.length);
 press(tree,data.categories.find(c=>c.id==='science').title);tree=draw();
 assert.ok(JSON.stringify(tree).includes('Αρχαία Ελλάδα'),'Temporary fixed lesson is explicit');
 button(tree,'Συνέχεια →').props.onPress();await flush();tree=draw();
 assert.equal(category,'science','Keep selected world while advancing to interests');
 assert.equal(phase,'interests');
 assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel==='Βήμα 4 από 4'));
 assert.equal(button(tree,'Ξεκίνα το πρώτο μάθημα →').props.disabled,true,'At least three interests are required');
 for(const topic of topics.DAILY_CHALLENGE_TOPICS.slice(0,5)){press(tree,topic.title);tree=draw();}
 assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,5);
 assert.ok(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&!n.props.accessibilityState.checked).every(n=>n.props.disabled));
 press(tree,topics.DAILY_CHALLENGE_TOPICS[0].title);tree=draw();
 press(tree,topics.DAILY_CHALLENGE_TOPICS[1].title);tree=draw();
 assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,3);
 assert.equal(button(tree,'Ξεκίνα το πρώτο μάθημα →').props.disabled,false);
 button(tree,'Ξεκίνα το πρώτο μάθημα →').props.onPress();await flush();
 assert.equal(phase,'lesson');assert.equal(savedInterests.topicIds.length,3);
 assert.equal(savedInterests.difficulty,initial.difficulty,'Keep existing difficulty');
 press(tree,'Παράλειψη οδηγού');await flush();assert.equal(skips,1);endUi();
 // Stored milestones resume even when activity has already been created.
 const resumeDisk=disk(),resume=welcomeHook(resumeDisk);resume.render();const stopResume=resume.mount();await flush();
 assert.equal(await resume.render().advance('question'),true);
 assert.equal(resumeDisk.map.get(first.WELCOME_STORAGE_KEY),'question');
 assert.equal(await resume.render().advance('choose'),true);
 assert.equal(await resume.render().advance('interests','science'),true);
 assert.equal(resumeDisk.map.get(first.ONBOARDING_CATEGORY_KEY),'science');
 assert.equal(resumeDisk.map.get(first.WELCOME_STORAGE_KEY),'interests');
 assert.equal(await resume.render().advance('lesson'),true);
 stopResume();
 const resumed=welcomeHook(resumeDisk,null,true);resumed.render();const stopResumed=resumed.mount();await flush();
 assert.equal(resumed.render().phase,'lesson');assert.equal(resumed.render().categoryId,'science');
 assert.equal(resumed.render().visible,true);stopResumed();
 // Existing preference drafts survive fresh props delivered by background sync.
 let prefSlots=[],prefCursor=0,prefEffects=[];
 const prefReact={useState:init=>{const i=prefCursor++;if(!(i in prefSlots))prefSlots[i]=init;return[prefSlots[i],v=>{prefSlots[i]=typeof v==='function'?v(prefSlots[i]):v;}];},useEffect:(fn,deps)=>{const i=prefCursor++;if(!prefSlots[i]||deps.some((d,j)=>d!==prefSlots[i][j])){prefSlots[i]=deps;prefEffects.push(fn);}}};
 const PrefScreen=load('src/screens/DailyChallengePreferencesScreen.tsx',{react:prefReact,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{...native,useWindowDimensions:()=>({height:800,fontScale:1})},'../components/ActionButton':{__esModule:true,default:'Button'},'../components/ProgressGradientBackground':{__esModule:true,default:'Background'},'../components/AtlasCard':{__esModule:true,default:'Card'},'../components/ProfileSectionHeader':{__esModule:true,default:'Header',profileSectionLayout:{}},'../components/HomeMotion':{MotionView:'View',MotionPressable:'Pressable'}}).default;
 let prefProps={initialPreferences:initial,isLoading:false,onSave:async()=>true,onCancel:()=>{}};
 const renderPrefs=()=>{prefCursor=0;const t=PrefScreen(prefProps);const pending=prefEffects;prefEffects=[];for(const fn of pending)fn();return t;};
 tree=renderPrefs();nodes(tree).find(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).props.onPress();tree=renderPrefs();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,4);
 prefProps={...prefProps,initialPreferences:choices};renderPrefs();tree=renderPrefs();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='checkbox'&&n.props.accessibilityState.checked).length,4,'Background sync cannot overwrite an unsaved preference draft.');
 // Real AppNavigator route boundary: welcome hides tabs; finishing opens daily directly.
 const nav=reactHarness();let visible=true,welcomePhase="welcome";
 let latestNavEffect;
 nav.react.useEffect=fn=>{if(fn.toString().includes("hardwareBackPress"))latestNavEffect=fn;};
 const navStore=new DailyStore(null,disk());await navStore.start();
 const app={checkpointAnswers:{},resultMode:'finished',screen:'home',activeCategoryId:data.categories[0].id,activeSubcategoryId:data.subcategories[0].id,activeLessonId:data.lessons[0].id,completedLessonIds:[],completionEvents:{},lessonAttempts:{},progressLoaded:true,inProgressLessonIds:[],inProgressLessonCount:0,setScreen:s=>{app.screen=s;}};
 app.openLesson=id=>{const l=data.lessons.find(x=>x.id===id);app.activeLessonId=id;app.activeCategoryId=l.categoryId;app.activeSubcategoryId=l.subcategoryId;app.screen='lesson';};
 const screens=['HomeScreen','QuickQuizScreen','CategoryScreen','SubcategoryScreen','LessonScreen','QuizScreen','ResultsScreen','ReviewMistakesScreen','WeeklyReviewScreen','KnowledgeReviewScreen','ProfileScreen','PlayerStatsScreen','AccountScreen','SavedLessonsScreen','SearchScreen','DailyChallengeScreen','DailyChallengePreferencesScreen','ProgressScreen','LearningInsightsScreen','WelcomeScreen'];
 const screenImports=Object.fromEntries(screens.map(name=>['../screens/'+name,{__esModule:true,default:name}]));
 const navigationAnalytics = load('src/navigation/useNavigationAnalytics.ts', { react: nav.react });
 const Navigator=load('src/navigation/AppNavigator.tsx',{...screenImports,'./useNavigationAnalytics':navigationAnalytics,react:nav.react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{SafeAreaView:'SafeArea'},'../hooks/useWelcome':{useWelcome:()=>({visible,loading:false,replay:false,phase:welcomePhase,categoryId:null,isCurrent:()=>true,advance:async p=>{welcomePhase=p;return true;},complete:async()=>{visible=false;return true;},skip:async()=>{visible=false;return true;},open:()=>{visible=true;welcomePhase='welcome';}})},'../hooks/useQuickQuiz':{useQuickQuiz:()=>({progress:null})},'../hooks/useLearningApp':{useLearningApp:()=>app},'../hooks/useSavedLessons':{useSavedLessons:()=>({savedLessonIds:[],isSavedLessonsLoaded:true})},'../hooks/useAthensDate':{useAthensDate:()=>today},'../hooks/useDailyChallengePreferences':{useDailyChallengePreferences:()=>({preferences:initial,isLoading:false,savePreferences:p=>navStore.savePreferences(p)})},'../state/LearningSession':{useLearningSession:()=>({dailyStore:navStore}),useDailySnapshot:()=>navStore.getSnapshot()},'../components/BottomNavigation':{__esModule:true,default:'Tabs'},'../components/SyncStatus':{__esModule:true,default:'SyncStatus'}}).default;
 let routed=nav.render(()=>Navigator());assert.ok(!nodes(routed).some(n=>n.type==='Tabs'));
 let guide=nodes(routed).find(n=>n.type==='WelcomeScreen');
 assert.equal(guide.props.phase,'welcome');
 assert.equal(await guide.props.onAdvance('question'),true);
 routed=nav.render(()=>Navigator());guide=nodes(routed).find(n=>n.type==='WelcomeScreen');
 assert.equal(guide.props.phase,'question');
 assert.equal(await guide.props.onAdvance('choose'),true);
 routed=nav.render(()=>Navigator());guide=nodes(routed).find(n=>n.type==='WelcomeScreen');
 const beforeLessonDaily=plain(navStore.getSnapshot().doc.days);
 assert.equal(await guide.props.onAdvance('interests','science'),true);
 routed=nav.render(()=>Navigator());guide=nodes(routed).find(n=>n.type==='WelcomeScreen');
 assert.equal(guide.props.phase,'interests');
 assert.equal(await guide.props.onBeginLesson(choices),true);
 assert.deepEqual(plain(navStore.getSnapshot().doc.preferences.value),plain(choices),'Onboarding choices reach synced preferences');
 routed=nav.render(()=>Navigator());assert.ok(nodes(routed).some(n=>n.type==='LessonScreen'));
 assert.equal(app.activeLessonId,first.ONBOARDING_INTRO_LESSON_ID);
 assert.deepEqual(plain(navStore.getSnapshot().doc.days),beforeLessonDaily);
 // Skipping the guide returns to Home without resetting the daily or reader.
 await nodes(nav.render(()=>Navigator())).find(n=>n.type==='LessonScreen').props.onBack();
 routed=nav.render(()=>Navigator());assert.equal(nodes(routed).find(n=>n.type==='WelcomeScreen').props.phase,'interests');
 await nodes(routed).find(n=>n.type==='WelcomeScreen').props.onSkip(3);
 routed=nav.render(()=>Navigator());assert.ok(nodes(routed).some(n=>n.type==='HomeScreen'));
 nodes(routed).find(n=>n.type==='HomeScreen').props.onOpenProfile();routed=nav.render(()=>Navigator());assert.ok(nodes(routed).some(n=>n.type==='ProfileScreen'));
 let unsubscribeBack=latestNavEffect();assert.equal(backHandler(),true);unsubscribeBack();routed=nav.render(()=>Navigator());assert.equal(app.screen,'home');
 nodes(routed).find(n=>n.type==='HomeScreen').props.onOpenQuickQuiz();routed=nav.render(()=>Navigator());
 assert.ok(nodes(routed).some(n=>n.type==='QuickQuizScreen'));assert.ok(!nodes(routed).some(n=>n.type==='Tabs'));
 unsubscribeBack=latestNavEffect();assert.equal(backHandler(),true);unsubscribeBack();routed=nav.render(()=>Navigator());assert.equal(app.screen,'home');
 nodes(routed).find(n=>n.type==='Tabs').props.onNavigate('progress');routed=nav.render(()=>Navigator());
 nodes(routed).find(n=>n.type==='ProgressScreen').props.onOpenProfile();routed=nav.render(()=>Navigator());
 unsubscribeBack=latestNavEffect();backHandler();unsubscribeBack();assert.equal(app.screen,'progress');
 app.screen='profile';routed=nav.render(()=>Navigator());nodes(routed).find(n=>n.type==='ProfileScreen').props.onAccount();
 routed=nav.render(()=>Navigator());assert.equal(app.screen,'account');unsubscribeBack=latestNavEffect();backHandler();unsubscribeBack();assert.equal(app.screen,'profile');
 routed=nav.render(()=>Navigator());nodes(routed).find(n=>n.type==='ProfileScreen').props.onStats();routed=nav.render(()=>Navigator());
 unsubscribeBack=latestNavEffect();backHandler();unsubscribeBack();assert.equal(app.screen,'profile');
 app.screen='lesson';app.lessonBackScreen='saved';routed=nav.render(()=>Navigator());
 unsubscribeBack=latestNavEffect();assert.equal(backHandler(),true);assert.equal(app.screen,'lesson','Back keeps the protected reader open');
 assert.equal(leaveAlert[0],'Το μάθημα δεν έχει ολοκληρωθεί');
 leaveAlert[2].find(b=>b.style==='destructive').onPress();assert.equal(app.screen,'saved');unsubscribeBack();
 app.screen='home';nav.render(()=>Navigator());unsubscribeBack=latestNavEffect();
 assert.equal(backHandler(),false,'Android can exit normally from root');unsubscribeBack();
 // Returning from results continues the most recently worked-on lesson path.
 const [finishedLesson, nextLesson] = lessonPaths.getSubcategoryPath(data.lessons, 'ancient-greece');
 const other = data.lessons.find(lesson => lesson.subcategoryId !== finishedLesson.subcategoryId);
 app.openLesson(finishedLesson.id);
 app.screen = 'results';
 app.completedLessonIds = [finishedLesson.id];
 app.completionEvents = { finish: { lessonId: finishedLesson.id, at: 200 } };
 app.inProgressLessonId = other.id;
 app.inProgressLessonIds = [other.id];
 app.lessonAttempts = { [other.id]: { updatedAt: 100 } };
 routed = nav.render(() => Navigator());
 nodes(routed).find(node => node.type === 'ResultsScreen').props.onHome();
 const home = () => nodes(nav.render(() => Navigator())).find(node => node.type === 'HomeScreen').props;
 assert.equal(home().featuredLesson.id, nextLesson.id, 'Home continues the finished lesson’s subcategory');
 assert.equal(home().inProgressLesson, null, 'An older attempt does not hide the next lesson');
 app.lessonAttempts[other.id].updatedAt = 300;
 assert.equal(home().inProgressLesson.id, other.id, 'More recent unfinished reading takes priority');
 app.lessonAttempts[other.id].updatedAt = 100;
 app.completedLessonIds = lessonPaths.getSubcategoryPath(data.lessons, 'ancient-greece').map(lesson => lesson.id);
 assert.equal(home().inProgressLesson.id, other.id, 'A completed path falls back to the unfinished lesson');
 app.inProgressLessonId = null;
 app.inProgressLessonIds = [];
 assert.notEqual(home().featuredLesson.subcategoryId, finishedLesson.subcategoryId, 'A completed path falls back to discovery when nothing is in progress');
 store.stop();homeStore.stop();navStore.stop();
 console.log('Welcome checks passed: four-stage flow, custom step icons, 3–5 persisted interests, real daily question and lesson routing, skip/back, resume and navigation. Native views mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
