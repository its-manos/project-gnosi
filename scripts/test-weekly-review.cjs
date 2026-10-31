/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
let now = Date.parse('2026-10-30T10:00:00Z');
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
const cache = new Map(), stores = [];
function load(file, overrides = {}) {
 if (!Object.keys(overrides).length && cache.has(file)) return cache.get(file);
 const m = {exports:{}};
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,Date:Clock,setTimeout,clearTimeout,__DEV__:true,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const target=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',target+'.ts'))?target+'.ts':target+'.tsx');}
  throw Error(id);
 }});
 if(!Object.keys(overrides).length) cache.set(file,m.exports);return m.exports;
}
const {lessons}=load('src/data/lessons.ts'), weekly=load('src/utils/weeklyReview.ts'), activity=load('src/utils/learningActivity.ts'), sync=load('src/utils/syncDocument.ts'), {LearningStore}=load('src/state/LearningStore.ts');
const lesson=lessons[0], plain=x=>JSON.parse(JSON.stringify(x));
const event=(l,missed,at=Date.parse('2026-10-22T12:00:00Z'))=>({lessonId:l.id,at,wasCompleted:false,correctCount:4-missed.length,questionCount:4,quizKey:activity.quizFingerprint(l.questions),missedQuestionIndices:missed});
const events={old:event(lesson,[1,3])};
const doc=()=>({...sync.emptySyncDocument(),activity:events});
function disk(payload=doc(),userId=null){const map=new Map([['@gnosi/sync-device-id','phone'],[`@gnosi/learning-v2/${userId??'guest'}`,JSON.stringify({format:1,userId,dirty:false,doc:payload})]]);return{map,getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{map.set(k,v);}};}
(async()=>{
 const plan=weekly.weeklyPlan(events,{},'2026-10-30');assert.equal(plan.length,2);assert.ok(plan.every(q=>q.week==='2026-10-26'));
 assert.equal(weekly.weeklyPlan(events,{},'2026-10-22').length,0,'no immediate score recovery');
 assert.deepEqual(plain(weekly.lessonScores(lesson,events)),{best:2,mastered:2,total:4,hasDetails:true});
 const storage=disk(),store=new LearningStore(null,storage);stores.push(store);await store.start();
 const first=plan[0], second=plan[1];
 assert.equal(store.answerWeekly(first.id,lesson.questions[first.questionIndex].correctIndex),true);
 assert.equal(store.answerWeekly(first.id,0),false,'duplicate tap cannot replace answer');
 await store.flushLocal();
 let snapshot=store.getSnapshot();
 assert.equal(weekly.lessonScores(lesson,snapshot.activity,snapshot.weeklyReviews).mastered,3);
 assert.equal(weekly.lessonScores(lesson,snapshot.activity,snapshot.weeklyReviews).best,2,'weekly answer does not rewrite best attempt');
 const wrong=(lesson.questions[second.questionIndex].correctIndex+1)%4;
 assert.equal(store.answerWeekly(second.id,wrong),true);await store.flushLocal();
 assert.equal(store.answerWeekly(second.id,lesson.questions[second.questionIndex].correctIndex),false,'wrong answer cannot be retried for score in same week');
 assert.equal(weekly.weeklyPlan(events,store.getSnapshot().weeklyReviews,'2026-10-30').length,2,'answers do not refill batch');
 assert.deepEqual(plain(store.getSnapshot().activity),events,'review cannot inflate lesson/replay/accuracy history');
 const reopened=new LearningStore(null,storage);stores.push(reopened);await reopened.start();
 assert.deepEqual(plain(reopened.getSnapshot().weeklyReviews),plain(store.getSnapshot().weeklyReviews),'restart preserves both answers');
 now=Date.parse('2026-11-02T10:00:00Z');
 const next=weekly.weeklyPlan(events,store.getSnapshot().weeklyReviews,'2026-11-02');assert.equal(next.length,1);assert.equal(next[0].questionIndex,second.questionIndex,'only wrong answer returns');
 assert.equal(store.answerWeekly(next[0].id,lesson.questions[second.questionIndex].correctIndex),true);
 snapshot=store.getSnapshot();assert.equal(weekly.lessonScores(lesson,events,snapshot.weeklyReviews).mastered,4);assert.equal(weekly.lessonScores(lesson,events,snapshot.weeklyReviews).best,2);
 assert.equal(weekly.weeklyPlan(events,snapshot.weeklyReviews,'2026-11-09').length,0);
 assert.equal(weekly.lessonScores(lesson,{...events,worse:event(lesson,[0,1,2],now)},snapshot.weeklyReviews).best,2,'bad replay never lowers best');
 assert.equal(weekly.lessonScores(lesson,{...events,perfect:event(lesson,[],now)},snapshot.weeklyReviews).best,4);
 const many=Object.fromEntries(lessons.slice(0,8).map((l,i)=>['e'+i,event(l,[0,1,2,3])]));assert.equal(weekly.weeklyPlan(many,{},'2026-10-30').length,10);
 assert.deepEqual(plain(weekly.weeklyPlan(many,{},'2026-10-30')),plain(weekly.weeklyPlan(many,{},'2026-10-30')),'stable selection');
 const unknown={...events.old};delete unknown.missedQuestionIndices;
 assert.equal(weekly.weeklyPlan({old:unknown},{},'2026-10-30').length,0,'do not invent legacy mistakes');
 assert.equal(weekly.lessonScores(lesson,{old:unknown}).hasDetails,false);
 assert.equal(weekly.weeklyPlan({old:{...events.old,quizKey:'changed'}},{},'2026-10-30').length,0,'changed question sets excluded');
 const a=plain(reopened.getSnapshot().weeklyReviews), key=Object.keys(a)[0];
 assert.throws(()=>weekly.parseWeeklyAnswers({[key]:{...a[key],questionIndex:99}},events));
 assert.throws(()=>weekly.parseWeeklyAnswers({[key]:{...a[key],week:'2026-10-27'}},events));
 assert.throws(()=>weekly.parseWeeklyAnswers({[key]:{...a[key],answerIndex:-1}},events));
 assert.throws(()=>weekly.parseWeeklyAnswers({[key]:{...a[key],at:Date.parse('2026-11-03T12:00:00Z')}},events));
 assert.throws(()=>weekly.parseWeeklyAnswers({bad:a[key]},events));
 const later={[key]:{...a[key],answerIndex:(a[key].answerIndex+1)%4,at:a[key].at+1000}};
 assert.deepEqual(plain(weekly.mergeWeeklyAnswers(a,later)),plain(a));assert.deepEqual(plain(weekly.mergeWeeklyAnswers(later,a)),plain(a),'merge commutes');
 const richer={...doc(),weeklyReviews:a};assert.deepEqual(plain(sync.mergeSyncDocuments(doc(),richer).weeklyReviews),plain(a),'old client merge retains history');
 const user=new LearningStore('test-user',disk({...sync.emptySyncDocument()},'test-user'));stores.push(user);await user.start();await user.importGuest(store.getSnapshot().backup,events,snapshot.weeklyReviews);
 assert.deepEqual(plain(user.getSnapshot().weeklyReviews),plain(snapshot.weeklyReviews),'guest import preserves mastery');
 await user.importGuest(store.getSnapshot().backup,events,snapshot.weeklyReviews);assert.equal(Object.keys(user.getSnapshot().weeklyReviews).length,3,'repeat import deduplicates');
 // Render the real weekly screen: persisted answers, original shuffled indices, feedback and summary.
 now=Date.parse('2026-10-30T10:00:00Z');
 const uiStore=new LearningStore(null,disk());stores.push(uiStore);await uiStore.start();
 let slots=[],cursor=0;
 const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];}};
 const jsx=(type,props)=>({type,props});
 const stubs=Object.fromEntries(['ActionButton','AnswerOption','AppHeader','SyncStatus','ReportContentButton'].map(n=>['../components/'+n,{__esModule:true,default:n}]));
 const Screen=load('src/screens/WeeklyReviewScreen.tsx',{...stubs,react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{ScrollView:'ScrollView',View:'View',Text:'Text',StyleSheet:{create:x=>x}},'../hooks/useAthensDate':{useAthensDate:()=>load('src/utils/dailyChallenge.ts').getAthensDateKey()},'../state/LearningSession':{useLearningSession:()=>({store:uiStore}),useLearningSnapshot:()=>uiStore.getSnapshot()}}).default;
 const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
 const render=()=>{cursor=0;return Screen({onBack(){}});};
 let tree=render();let choices=nodes(tree).filter(n=>n.type==='AnswerOption');assert.equal(choices.length,4);
 const visible=slots[0].items[0],correctLabel=visible.lesson.questions[visible.questionIndex].answers[visible.lesson.questions[visible.questionIndex].correctIndex];
 assert.equal(nodes(tree).find(n=>n.type==='ReportContentButton').props.target.questionIndex,visible.questionIndex,'weekly reporting points at the canonical question, not its shuffled position');
 choices.find(n=>n.props.label===correctLabel).props.onPress();tree=render();assert.equal(uiStore.getSnapshot().weeklyReviews[visible.id].answerIndex,visible.lesson.questions[visible.questionIndex].correctIndex);
 assert.ok(nodes(tree).filter(n=>n.type==='AnswerOption').every(n=>n.props.locked));nodes(tree).find(n=>n.props?.label==='Συνέχεια').props.onPress();tree=render();
 const remaining=slots[0].items[1],wrongLabel=remaining.lesson.questions[remaining.questionIndex].answers[(remaining.lesson.questions[remaining.questionIndex].correctIndex+1)%4];
 nodes(tree).find(n=>n.type==='AnswerOption'&&n.props.label===wrongLabel).props.onPress();tree=render();assert.ok(!nodes(tree).some(n=>n.props?.label==='Δοκίμασε ξανά'),'weekly score cannot be retried');
 nodes(tree).find(n=>n.props?.label==='Δες το αποτέλεσμα').props.onPress();tree=render();assert.equal(nodes(tree).filter(n=>n.type==='AnswerOption').length,0);assert.ok(nodes(tree).some(n=>n.props?.label==='Πίσω στην πρόοδο'));
 now=Date.parse('2026-11-02T10:00:00Z');tree=render();assert.equal(nodes(tree).filter(n=>n.type==='AnswerOption').length,0,'midnight/week rollover blocks stale screen');
 await store.resetGuestProgress();assert.equal(Object.keys(store.getSnapshot().weeklyReviews).length,0);
 // Athens Monday boundary on the autumn DST weekend, not UTC midnight.
 const sunday=Date.parse('2026-10-25T21:59:59Z'),monday=sunday+1000;
 const q=plan[0], rec={sourceId:q.sourceId,questionIndex:q.questionIndex,week:'2026-10-26',answerIndex:0,at:monday};
 weekly.parseWeeklyAnswers({[q.id]:rec},events);assert.throws(()=>weekly.parseWeeklyAnswers({[q.id]:{...rec,at:sunday}},events));
 for(let n=1;n<10;n++){const order=plain(weekly.shuffledIndices(n,'seed'));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i));}
 console.log('Weekly review passed: delayed eligibility, 10-question cap, deterministic shuffle, one answer/week, resume, mastery/best separation, missed return, changed/legacy quiz safety, date/DST boundary, guest import, old-client sync preservation and deterministic conflict merge.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
