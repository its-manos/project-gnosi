const analyticsStub = { analytics: new Proxy({}, { get: () => async () => {} }), enabled: false };
/* global __dirname */
// Headless interaction/order checks; phone typography and scrolling still need device QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}){if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);const m={exports:{}};
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(code,{module:m,exports:m.exports,Date,Intl,console,__DEV__:true,require:id=>{if(id === '../state/BetaAnalytics') return { useBetaAnalytics: () => analyticsStub };
  if(id === '../components/UsageSharing') return { __esModule: true, default: 'UsageSharing' };
  if(id in overrides)return overrides[id];if(id.startsWith('.')){const p=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',p+'.ts'))?p+'.ts':p+'.tsx');}throw Error(id);}});if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;}
const data=load('src/data/lessons.ts'),{quizFingerprint}=load('src/utils/learningActivity.ts'),lesson=data.lessons[0];
let learning={ready:true,activity:{attempt:{lessonId:lesson.id,at:Date.parse('2026-10-22T12:00:00Z'),wasCompleted:false,correctCount:2,questionCount:4,quizKey:quizFingerprint(lesson.questions),missedQuestionIndices:[1,3]}},weeklyReviews:{recovery:{sourceId:'attempt',questionIndex:1,week:'2026-10-26',answerIndex:lesson.questions[1].correctIndex,at:Date.parse('2026-10-30T12:00:00Z')}}};
let daily={ready:true,doc:{}};
let history=[{dateKey:'2026-10-30',correctCount:5,score:500},{dateKey:'2026-10-29',correctCount:4,score:400}];
let slots=[],cursor=0;const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useMemo:fn=>fn(),useEffect(){}};
const jsx=(type,props)=>({type,props}),native={Text:'Text',View:'View',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'Spinner',StyleSheet:{create:x=>x},Alert:{alert(){}}};
const Screen=load('src/screens/ProgressScreen.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'../state/LearningSession':{useLearningSnapshot:()=>learning,useDailySnapshot:()=>daily},'../utils/dailySyncDocument':{dailyHistory:()=>history},'../utils/dailyChallenge':{getAthensDateKey:()=> '2026-10-30'},...Object.fromEntries(['KnowledgeMastery','KnowledgeProgress','ActionButton','AppHeader','WeeklyReviewCard','SyncStatus'].map(n=>['../components/'+n,{__esModule:true,default:n}])),'../components/LearningActivityPanel':{__esModule:true,default:'Activity',CategoryProgress:'Categories'}}).default;
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
const opened=[];let accounts=0;
let props={onKnowledgeReview(){},onHome(){},onOpenLesson:id=>opened.push(id),onWeeklyReview(){},onOpenAccount:()=>accounts++,onOpenWelcome(){},completedLessons:data.lessons.slice(0,7),inProgressLesson:lesson,inProgressAnsweredCount:2,inProgressQuestionCount:4,inProgressLessonCount:2,totalLessonCount:data.lessons.length,lessonProgressLoaded:true,onResetLessonProgressForDevelopment:async()=>{}};
const render=()=>{cursor=0;return Screen(props);};
let tree=render();let sections=nodes(tree).filter(n=>n.props?.testID?.startsWith('progress-')).map(n=>n.props.testID);
assert.deepEqual(sections,['progress-overview','progress-resume','progress-mastery','progress-weekly','progress-activity','progress-categories','progress-daily','progress-account']);
assert.ok(nodes(tree).some(n=>n.props?.label==='ΣΩΣΤΑ ΑΠΑΝΤΗΜΕΝΕΣ ΕΡΩΤΗΣΕΙΣ'&&n.props.value==='3'),'overview includes weekly-corrected question once');
assert.ok(nodes(tree).some(n=>n.props?.label==='ΤΡΕΧΟΝ ΗΜΕΡΗΣΙΟ ΣΕΡΙ'&&n.props.value==='2'));
assert.ok(nodes(tree).find(n=>n.type==='Activity').props.compact,'graph gets compact summary');
assert.ok(!nodes(tree).some(n=>n.props?.testID==='progress-daily-details'),'daily detail starts collapsed');
const resume=nodes(tree).find(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith('Συνέχισε το μάθημα'));resume.props.onPress();assert.deepEqual(opened,[lesson.id]);
const disclosure=label=>nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes(label));
disclosure('Οι καθημερινές προκλήσεις σου').props.onPress();tree=render();assert.ok(nodes(tree).some(n=>n.props?.testID==='progress-daily-details'));assert.equal(disclosure('Οι καθημερινές προκλήσεις σου').props.accessibilityState.expanded,true);assert.ok(text(tree).includes('5 / 7 σωστές απαντήσεις'));
disclosure('Οι καθημερινές προκλήσεις σου').props.onPress();tree=render();assert.ok(!nodes(tree).some(n=>n.props?.testID==='progress-daily-details'));
disclosure('Τα ολοκληρωμένα μαθήματά σου').props.onPress();tree=render();const categoryBlock=nodes(tree).find(n=>n.props?.testID==='progress-categories');assert.equal(nodes(categoryBlock).filter(n=>n.type==='Pressable'&&n.props.accessibilityState===undefined).length,7,'all completed lessons are reachable, including beyond first five');
nodes(categoryBlock).filter(n=>n.type==='Pressable'&&n.props.accessibilityState===undefined).at(-1).props.onPress();assert.equal(opened.at(-1),data.lessons[6].id);
disclosure('Ο λογαριασμός μου').props.onPress();assert.equal(accounts,1);
// No fabricated mastery from a score-only legacy record; duplicates/full replays never double it.
learning={...learning,activity:{a:learning.activity.attempt,b:{...learning.activity.attempt,at:learning.activity.attempt.at+1}},weeklyReviews:{}};tree=render();assert.equal(nodes(tree).find(n=>n.props?.label==='ΣΩΣΤΑ ΑΠΑΝΤΗΜΕΝΕΣ ΕΡΩΤΗΣΕΙΣ').props.value,'2');
const old={...learning.activity.a};delete old.missedQuestionIndices;learning={...learning,activity:{old}};tree=render();assert.equal(nodes(tree).find(n=>n.props?.label==='ΣΩΣΤΑ ΑΠΑΝΤΗΜΕΝΕΣ ΕΡΩΤΗΣΕΙΣ').props.value,'0');assert.ok(text(tree).includes('Παλιότερα σκορ'));
props={...props,inProgressLesson:null,completedLessons:[],lessonProgressLoaded:false};learning={...learning,ready:false,activity:{}};daily={ready:false,doc:{}};tree=render();assert.ok(!nodes(tree).some(n=>n.props?.testID==='progress-resume'));assert.equal(nodes(tree).find(n=>n.props?.label==='ΣΩΣΤΑ ΑΠΑΝΤΗΜΕΝΕΣ ΕΡΩΤΗΣΕΙΣ').props.value,'—');assert.equal(nodes(tree).find(n=>n.props?.label==='ΤΡΕΧΟΝ ΗΜΕΡΗΣΙΟ ΣΕΡΙ').props.value,'—');
// A new player has no measured daily accuracy yet.
history=[];daily={ready:true,doc:{}};tree=render();
disclosure('Οι καθημερινές προκλήσεις σου').props.onPress();tree=render();
assert.ok(text(tree).includes('ΣΥΝΟΛΙΚΗ ΑΚΡΙΒΕΙΑ—'),'empty daily history shows no measured accuracy');
console.log('Progress layout passed: overview/action/chart/category/details/account order, distinct mastery including weekly correction, legacy/loading states, resume/account callbacks, collapsed daily details and full completed-lesson list. Native views mocked.');
