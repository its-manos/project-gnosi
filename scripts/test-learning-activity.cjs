/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const cache = new Map(), stores = [];
let now = Date.parse('2026-10-30T12:00:00Z');
class ClockDate extends Date { constructor(value) { super(value === undefined ? now : value); } static now() { return now; } }
function load(file, overrides = {}) {
  if (!Object.keys(overrides).length && cache.has(file)) return cache.get(file);
  const mod = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code,{module:mod,exports:mod.exports,console,Intl,Date:ClockDate,setTimeout,clearTimeout,setInterval,clearInterval,__DEV__:true,require:id=>{
    if (id in overrides) return overrides[id];
    if (id.startsWith('.')) {const target=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',target+'.ts'))?target+'.ts':target+'.tsx');}
    throw Error(id);
  }});
  if(!Object.keys(overrides).length)cache.set(file,mod.exports);
  return mod.exports;
}
const utils=load('src/utils/learningActivity.ts'), docs=load('src/utils/syncDocument.ts'), data=load('src/data/lessons.ts');
const {LearningStore}=load('src/state/LearningStore.ts');
const plain=value=>JSON.parse(JSON.stringify(value));
function disk(device) {const map=new Map([['@gnosi/sync-device-id',device]]), writes=[];let full=false;return{map,writes,setFull:value=>{full=value;},getItem:async key=>map.get(key)??null,setItem:async(key,value)=>{if(full)throw Error('disk full');map.set(key,value);writes.push([key,value]);}};}
function makeStore(user,d,transport=null){const s=new LearningStore(user,d,transport);stores.push(s);return s;}
const answers=lesson=>Object.fromEntries(lesson.questions.map((q,i)=>[i,q.correctIndex]));
const lesson=data.lessons[0], other=data.lessons[1];
const event=(id,at,replay=false)=>({lessonId:id,at:Date.parse(at),wasCompleted:replay,correctCount:3,questionCount:4,quizKey:'q_test'});
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
(async()=>{
  // Historical data stays undated, completed and bookmarked.
  const legacy=disk('legacy');
  legacy.map.set('@gnosi/learning-v2/guest',JSON.stringify({format:1,userId:null,dirty:false,doc:{schemaVersion:1,clock:0,progress:{[lesson.id]:{stamp:[0,'old'],value:{completed:true,attempt:null}}},bookmarks:{[lesson.id]:{stamp:[0,'old'],value:true}}}}));
  const migrated=makeStore(null,legacy);await migrated.start();
  assert.equal(migrated.getSnapshot().backup.completedIds.length,1);
  assert.equal(migrated.getSnapshot().backup.savedIds.length,1);
  assert.equal(Object.keys(migrated.getSnapshot().activity).length,0);
  assert.equal(utils.activitySummary({},[lesson.id],[],'2026-10-30').undatedCount,1);
  migrated.complete(lesson.id,{id:'old_replay',answers:answers(lesson)});await migrated.flushLocal();
  assert.equal(utils.activitySummary(migrated.getSnapshot().activity,[lesson.id],[],'2026-10-30').firstThisWeek,0);
  assert.equal(utils.activitySummary(migrated.getSnapshot().activity,[lesson.id],[],'2026-10-30').replaysThisWeek,1);

  // A first completion and its event share a write; retries cannot add events.
  const storage=disk('phone'), s=makeStore(null,storage);await s.start();
  assert.throws(()=>s.complete(lesson.id,{id:'partial',answers:{0:0}}),/incomplete_quiz/);
  assert.equal(s.getSnapshot().backup.completedIds.length,0);
  s.complete(lesson.id,{id:'run_one',answers:answers(lesson)});s.complete(lesson.id,{id:'run_one',answers:answers(lesson)});await s.flushLocal();
  let snap=s.getSnapshot();assert.equal(Object.keys(snap.activity).length,1);
  const saved=JSON.parse(storage.map.get(s.key));assert.equal(saved.doc.progress[lesson.id].value.completed,true);assert.equal(Object.keys(saved.doc.activity).length,1);
  assert.equal(Object.values(snap.activity)[0].correctCount,4);
  now+=1000;s.complete(lesson.id,{id:'run_two',answers:{...answers(lesson),0:(lesson.questions[0].correctIndex+1)%4}});await s.flushLocal();
  const reopened=makeStore(null,storage);await reopened.start();snap=reopened.getSnapshot();
  let summary=utils.activitySummary(snap.activity,snap.backup.completedIds,['2026-10-30','2026-10-29'],'2026-10-30');
  assert.equal(summary.firstThisWeek,1);assert.equal(summary.replaysThisWeek,1);assert.equal(summary.activeDays,2);assert.equal(summary.accuracy,88);
  assert.equal(snap.backup.completedIds.length,1);
  // Recorded scores survive later edits to question keys.
  const key=lesson.questions[0].correctIndex;lesson.questions[0].correctIndex=(key+1)%4;
  assert.equal(Object.values(reopened.getSnapshot().activity)[0].correctCount,4);lesson.questions[0].correctIndex=key;
  await reopened.restoreProgress({schemaVersion:1,completedIds:[other.id],savedIds:[],attempts:{}});
  assert.equal(Object.keys(reopened.getSnapshot().activity).length,2,'manual imports must not fabricate completion dates');
  const importTarget=makeStore('import-account',disk('import'));await importTarget.start();
  const guestBefore=plain(reopened.getSnapshot());
  await importTarget.importGuest(guestBefore.backup,guestBefore.activity);
  await importTarget.importGuest(guestBefore.backup,guestBefore.activity);
  assert.equal(Object.keys(importTarget.getSnapshot().activity).length,2,'repeated guest import must deduplicate original events');
  assert.equal(importTarget.getSnapshot().backup.completedIds.length,2);
  assert.deepEqual(plain(reopened.getSnapshot().activity),guestBefore.activity,'guest original stays intact');

  // Offline/restart, two-device sync and lost acknowledgement keep one event.
  let row=null,online=false,dropAck=false,activeUser='A';
  const network=user=>({pull:async()=>{if(!online)throw TypeError('offline');if(activeUser!==user)throw Error('account_changed');return row?{doc:docs.parseSyncDocument(plain(row.doc)),revision:row.revision}:null;},seed:async()=>null,push:async(doc,revision)=>{if(!online)throw TypeError('offline');if(activeUser!==user)throw Error('account_changed');if((row?.revision??0)!==revision)throw{code:'40001'};row={doc:plain(doc),revision:revision+1};if(dropAck){dropAck=false;throw TypeError('lost acknowledgement');}}});
  const d1=disk('one'), phone=makeStore('A',d1,network('A'));await phone.start();await flush();
  phone.complete(lesson.id,{id:'offline',answers:answers(lesson)});await phone.flushLocal();phone.stop();
  const restarted=makeStore('A',d1,network('A'));await restarted.start();await flush();assert.equal(Object.keys(restarted.getSnapshot().activity).length,1);
  online=true;dropAck=true;await restarted.sync();assert.equal(restarted.getSnapshot().status,'waiting');await restarted.sync();
  assert.equal(Object.keys(row.doc.activity).length,1);
  const tablet=makeStore('A',disk('two'),network('A'));await tablet.start();await flush();await tablet.sync();assert.equal(Object.keys(tablet.getSnapshot().activity).length,1);
  activeUser='B';const b=makeStore('B',d1);await b.start();assert.equal(Object.keys(b.getSnapshot().activity).length,0);activeUser='A';

  // Concurrent offline first completions produce one new lesson, one repeat.
  const concurrent={a:event(lesson.id,'2026-10-30T10:00:00Z'),b:event(lesson.id,'2026-10-30T11:00:00Z')};
  const count=utils.activitySummary(concurrent,[lesson.id],[],'2026-10-30');assert.equal(count.firstThisWeek,1);assert.equal(count.replaysThisWeek,1);
  const left=docs.parseSyncDocument({...docs.emptySyncDocument(),activity:{a:concurrent.a}}),right=docs.parseSyncDocument({...docs.emptySyncDocument(),activity:{b:concurrent.b}});
  assert.deepEqual(plain(docs.mergeSyncDocuments(left,right)),plain(docs.mergeSyncDocuments(right,left)));
  assert.deepEqual(plain(docs.mergeSyncDocuments(left,left)),plain(left));
  assert.throws(()=>utils.mergeCompletionEvents({a:concurrent.a},{a:{...concurrent.a,correctCount:0}}),/invalid_sync/);
  const corrupt={...concurrent.a,correctCount:9};assert.throws(()=>utils.parseCompletionEvents({bad:corrupt}));
  storage.setFull(true);s.complete(other.id,{id:'failed_write',answers:answers(other)});assert.equal(await s.flushLocal(),false);assert.equal(s.getSnapshot().status,'local-error');storage.setFull(false);await s.retry();assert.equal(s.getSnapshot().status,'local');

  // Calendar boundaries use Athens dates, including the 25-hour DST day.
  const dst={a:event(lesson.id,'2026-10-24T21:30:00Z'),b:event(other.id,'2026-10-25T21:30:00Z'),c:event(data.lessons[2].id,'2026-10-25T22:30:00Z')};
  const days=utils.activityBuckets(dst,'2026-10-26','daily');assert.equal(days.find(x=>x.key==='2026-10-25').first,2);assert.equal(days.at(-1).first,1);
  assert.equal(utils.mondayOf('2027-01-01'),'2026-12-28');assert.equal(utils.shiftDateKey('2026-03-29',1),'2026-03-30');
  const weeks=utils.activityBuckets(dst,'2026-10-26','weekly');assert.equal(weeks.length,8);assert.equal(weeks.at(-1).key,'2026-10-26');assert.equal(weeks.at(-2).first,2);
  assert.equal(utils.activitySummary({},[],[],'2026-10-30').accuracy,null);
  assert.equal(utils.activityBuckets({future:event(lesson.id,'2026-11-01T10:00:00Z')},'2026-10-30','daily').reduce((n,x)=>n+x.first+x.replay,0),0);

  // Native-view harness checks the actual chart controls and category bars.
  let slots=[],cursor=0;
  const react={useMemo:fn=>fn(),useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];}};
  const jsx=(type,props)=>({type,props});
  const component=load('src/components/LearningActivityPanel.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x}},'../state/LearningSession':{useLearningSnapshot:()=>reopened.getSnapshot(),useDailySnapshot:()=>({doc:{days:{}}})}});
  const nodes=tree=>tree&&typeof tree==='object'?[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)]:[];
  const render=()=>{cursor=0;return component.default({todayKey:'2026-10-30'});};
  let tree=render();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityLabel?.includes('πρώτες ολοκληρώσεις')).length,7);
  nodes(tree).find(n=>n.props?.children?.props?.children==='Ανά εβδομάδα').props.onPress();tree=render();
  const bars=nodes(tree).filter(n=>n.props?.accessibilityLabel?.includes('πρώτες ολοκληρώσεις'));assert.equal(bars.length,8);bars[0].props.onPress();tree=render();assert.equal(nodes(tree).filter(n=>n.props?.accessibilityState?.selected===true).length,2);
  assert.equal(nodes(component.CategoryProgress()).filter(n=>n.props?.accessibilityRole==='progressbar').length,7);
  // Preview and cancellation never write to the account. Confirm imports history.
  const importUI=makeStore('preview-account',disk('preview'));await importUI.start();
  slots=[];cursor=0;
  const syncStatus=load('src/components/SyncStatus.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x}},'./DailySyncControls':{default:'DailySyncControls',__esModule:true},'../lib/learningSync':{getLearningStore:()=>reopened},'../state/LearningSession':{useLearningSession:()=>({store:importUI,dailyStore:{},email:'test@example.com'}),useLearningSnapshot:()=>importUI.getSnapshot(),useDailySnapshot:()=>({status:'local',error:''})}}).default;
  const renderImport=()=>{cursor=0;return syncStatus({detailed:true});};
  const button=(tree,label)=>nodes(tree).find(n=>n.type==='Pressable'&&n.props.children?.props?.children===label);
  let importTree=renderImport();button(importTree,'Προεπισκόπηση εισαγωγής προόδου επισκέπτη').props.onPress();await flush();importTree=renderImport();
  assert.equal(Object.keys(importUI.getSnapshot().activity).length,0);
  button(importTree,'Ακύρωση εισαγωγής').props.onPress();importTree=renderImport();assert.equal(Object.keys(importUI.getSnapshot().activity).length,0);
  button(importTree,'Προεπισκόπηση εισαγωγής προόδου επισκέπτη').props.onPress();await flush();importTree=renderImport();
  button(importTree,'Προσθήκη στον λογαριασμό').props.onPress();await flush();assert.equal(Object.keys(importUI.getSnapshot().activity).length,2);
  console.log('Learning activity checks passed: migration, atomic completion/event writes, duplicate taps, replays, frozen scores, imports, offline restart/sync, lost acknowledgement, account isolation, immutable merge, storage recovery, Athens/DST/year boundaries, chart controls and seven category bars. Native views and transport mocked.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
