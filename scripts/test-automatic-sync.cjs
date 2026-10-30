/* global __dirname */
// Deterministic engines, real local hooks and mocked transport; no live service writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function compile(file,imports={}) {
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,setTimeout,clearTimeout,setInterval,clearInterval,__DEV__:true,require:id=>{if(id in imports)return imports[id];throw Error(id);}});return m.exports;
}
const data=compile('src/data/lessons.ts',{'./additionalLessons':compile('src/data/additionalLessons.ts'),'./catalogueExpansion':compile('src/data/catalogueExpansion.ts')});
const progress=compile('src/utils/lessonProgress.ts');
const backup=compile('src/utils/learningBackup.ts',{'../data/lessons':data,'./lessonProgress':progress});
const legacy=compile('src/utils/legacyLearning.ts',{'../data/lessons':data,'./lessonProgress':progress});
const doc=compile('src/utils/syncDocument.ts',{'../data/lessons':data,'./learningBackup':backup});
const {LearningStore}=compile('src/state/LearningStore.ts',{'../data/lessons':data,'../utils/learningBackup':backup,'../utils/legacyLearning':legacy,'../utils/syncDocument':doc});
const [a,b,c]=data.lessons;
const plain=x=>JSON.parse(JSON.stringify(x));
const empty=()=>({schemaVersion:1,completedIds:[],savedIds:[],attempts:{}});
const attempt=(n=1,replay=false)=>({checkpointAnswers:Object.fromEntries(Array.from({length:n},(_,i)=>[i,a.questions[i].correctIndex])),score:99,updatedAt:100,replayOfCompletedLesson:replay});
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const stores=[];
function disk(site) {const map=new Map([['@gnosi/sync-device-id',site]]);let fail=false;return {map,setFail:v=>{fail=v;},getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{if(fail)throw Error('storage full');map.set(k,v);}};}
const rows=new Map();let connected=true,currentUser='A',pushes=0,seedCalls=0,forceConflict=false,pausePush=null,dropAck=false;
const oldBackup={...empty(),completedIds:[c.id],savedIds:[a.id]};
function transport(user,seed=oldBackup) {return {
 pull:async()=>{if(!connected)throw TypeError('network');if(currentUser!==user)throw Error('account_changed');const row=rows.get(user);return row?{doc:doc.parseSyncDocument(plain(row.doc)),revision:row.revision}:null;},
 seed:async()=>{seedCalls++;return seed;},
 push:async(payload,revision)=>{if(pausePush)await pausePush;if(!connected)throw TypeError('network');if(currentUser!==user)throw {code:'42501'};if(forceConflict){forceConflict=false;const row=rows.get(user);rows.set(user,{doc:row.doc,revision:row.revision+1});throw {code:'40001'};}const row=rows.get(user);if((row?.revision??0)!==revision)throw {code:'40001'};rows.set(user,{doc:plain(payload),revision:revision+1});pushes++;if(dropAck){dropAck=false;throw TypeError("ack lost");}},
};}
function store(user,storage,network=transport(user)) {const s=new LearningStore(user,storage,user?network:null);stores.push(s);return s;}
async function boot(s) {await s.start();await flush();await s.sync();await flush();}
function state(s) {return s.getSnapshot();}
(async()=>{
 // Merge laws, deletion retention, validation and replay reset.
 const seed=doc.seedSyncBackup(oldBackup);
 const removed=doc.parseSyncDocument({...plain(seed),clock:1,bookmarks:{[a.id]:{stamp:[1,'phone'],value:false}}});
 const concurrent=doc.parseSyncDocument({...plain(seed),clock:1,bookmarks:{[a.id]:{stamp:[1,'tablet'],value:true}}});
 const values=[seed,removed,concurrent];
 for(const x of values)for(const y of values) {
  assert.deepEqual(plain(doc.mergeSyncDocuments(x,y)),plain(doc.mergeSyncDocuments(y,x)));
  assert.deepEqual(plain(doc.mergeSyncDocuments(x,x)),plain(x));
  for(const z of values)assert.deepEqual(plain(doc.mergeSyncDocuments(doc.mergeSyncDocuments(x,y),z)),plain(doc.mergeSyncDocuments(x,doc.mergeSyncDocuments(y,z))));
 }
 assert.equal(doc.syncBackup(doc.mergeSyncDocuments(removed,seed)).savedIds.length,0);
 assert.throws(()=>doc.parseSyncDocument({...plain(seed),clock:-1}));
 assert.throws(()=>doc.parseSyncDocument({...plain(seed),bookmarks:{unknown:{stamp:[0,'x'],value:true}}}));
 assert.throws(()=>doc.parseSyncDocument({...plain(seed),bookmarks:{[a.id]:{stamp:[5,'x'],value:true}}}));
 const complete=doc.seedSyncBackup({...empty(),completedIds:[a.id]});
 const stale=doc.parseSyncDocument({...plain(complete),clock:5,progress:{[a.id]:{stamp:[5,'x'],value:{completed:false,attempt:attempt()}}}});
 assert.ok(doc.syncBackup(doc.mergeSyncDocuments(complete,stale)).completedIds.includes(a.id));
 assert.equal(doc.syncBackup(doc.mergeSyncDocuments(complete,stale)).attempts[a.id],undefined);
 // Legacy data migrates to guest exactly once and is never silently assigned to A.
 const storage1=disk('phone');storage1.map.set('@gnosi/completed-lesson-ids',JSON.stringify([b.id]));storage1.map.set('@gnosi/saved-lesson-ids',JSON.stringify([b.id]));
 const guest=store(null,storage1);await boot(guest);assert.deepEqual(plain(state(guest).backup.completedIds),[b.id]);assert.ok(storage1.map.has('@gnosi/completed-lesson-ids'));
 const phone=store('A',storage1);await boot(phone);assert.deepEqual(plain(state(phone).backup.completedIds),[c.id]);assert.ok(!state(phone).backup.savedIds.includes(b.id));assert.equal(state(phone).status,'saved');
 // Initial backup seed is only read when the sync row is absent.
 const initialSeeds=seedCalls;const storage2=disk('tablet');const tablet=store('A',storage2);await boot(tablet);assert.equal(seedCalls,initialSeeds);
 phone.setBookmark(a.id,false);await phone.sync();await flush();await tablet.sync();assert.ok(!state(tablet).backup.savedIds.includes(a.id));
 await tablet.sync();assert.ok(!state(tablet).backup.savedIds.includes(a.id),'Old backup does not resurrect deletion.');
 // Offline edits survive a process restart and upload after reconnecting.
 connected=false;phone.setBookmark(b.id,true);phone.answer(a.id,attempt(2));await phone.flushLocal();await phone.sync();assert.equal(state(phone).status,'waiting');phone.stop();
 const restarted=store('A',storage1);await boot(restarted);assert.equal(state(restarted).backup.attempts[a.id].score,2);assert.ok(state(restarted).backup.savedIds.includes(b.id));
 connected=true;await restarted.retry();await tablet.sync();assert.ok(state(tablet).backup.savedIds.includes(b.id));assert.equal(Object.keys(state(tablet).backup.attempts[a.id].checkpointAnswers).length,2);
 // Both devices edit different rows; optimistic conflict retries preserve both.
 tablet.setBookmark(c.id,true);await tablet.sync();restarted.setBookmark(a.id,true);forceConflict=true;await restarted.sync();await tablet.sync();assert.ok(state(tablet).backup.savedIds.includes(a.id));assert.ok(state(tablet).backup.savedIds.includes(c.id));
 // A committed write with a lost response reconciles on the next pull.
 dropAck=true;restarted.setBookmark(b.id,false);await restarted.sync();assert.equal(state(restarted).status,'waiting');await restarted.sync();assert.equal(state(restarted).status,'saved');await tablet.sync();assert.ok(!state(tablet).backup.savedIds.includes(b.id));
 await assert.rejects(restarted.resetGuestProgress());
 // Local edits made during upload stay pending until their own acknowledgement.
 let release;pausePush=new Promise(r=>{release=r;});restarted.setBookmark(a.id,false);const pending=restarted.sync();await flush();restarted.setBookmark(c.id,false);await restarted.flushLocal();release();pausePush=null;await pending;assert.equal(state(restarted).status,'queued');await restarted.sync();assert.equal(state(restarted).status,'saved');await tablet.sync();assert.ok(!state(tablet).backup.savedIds.includes(a.id));assert.ok(!state(tablet).backup.savedIds.includes(c.id));
 // Attempt clear/replay tombstones beat older attempts, completion never regresses.
 restarted.complete(a.id);await restarted.sync();await tablet.sync();assert.ok(state(tablet).backup.completedIds.includes(a.id));assert.equal(state(tablet).backup.attempts[a.id],undefined);
 restarted.answer(a.id,attempt(1,true));await restarted.sync();await tablet.sync();assert.equal(state(tablet).backup.attempts[a.id].replayOfCompletedLesson,true);
 restarted.clearAttempt(a.id);await restarted.sync();await tablet.sync();assert.equal(state(tablet).backup.attempts[a.id],undefined);
 // First-sync backup download may be slow; edits during it must not disappear.
 let releaseSeed,seedStarted=false;const delayedSeed=new Promise(r=>{releaseSeed=r;});
 const seedTransport={pull:async()=>null,seed:async()=>{seedStarted=true;return delayedSeed;},push:async()=>{}};
 const duringSeed=store('seed-user',disk('seed-phone'),seedTransport);await duringSeed.start();await flush();assert.equal(seedStarted,true);
 duringSeed.setBookmark(b.id,true);releaseSeed(oldBackup);await flush();assert.ok(state(duringSeed).backup.savedIds.includes(b.id));assert.ok(state(duringSeed).backup.savedIds.includes(a.id));duringSeed.stop();
 // Separate account cache, delayed old-account upload and guest isolation.
 let releaseOld;pausePush=new Promise(r=>{releaseOld=r;});restarted.setBookmark(a.id,true);const oldRequest=restarted.sync();await flush();restarted.stop();currentUser='B';const userB=store('B',storage1,transport('B',null));await boot(userB);assert.equal(state(userB).backup.completedIds.length,0);releaseOld();pausePush=null;await oldRequest;assert.equal(rows.get('B').doc.progress[a.id],undefined);assert.deepEqual(plain(state(guest).backup.completedIds),[b.id]);
 assert.ok(storage1.map.has('@gnosi/learning-v2/A'));assert.ok(storage1.map.has('@gnosi/learning-v2/B'));assert.ok(storage1.map.has('@gnosi/learning-v2/guest'));
 currentUser='A';await boot(restarted);await tablet.sync();
 // Storage failure is surfaced, does not upload unpersisted changes, and retries.
 const beforePush=pushes;storage1.setFail(true);restarted.setBookmark(c.id,true);assert.equal(await restarted.flushLocal(),false);await restarted.sync();assert.equal(pushes,beforePush);assert.equal(state(restarted).status,'local-error');assert.ok(state(restarted).backup.savedIds.includes(c.id));storage1.setFail(false);await restarted.retry();assert.equal(state(restarted).status,'saved');
 const corruptDisk=disk('corrupt');corruptDisk.map.set('@gnosi/learning-v2/guest','broken');const corrupt=store(null,corruptDisk);await boot(corrupt);assert.equal(state(corrupt).ready,false);assert.equal(corruptDisk.map.get('@gnosi/learning-v2/guest'),'broken');
 // The actual learning/bookmark hooks write to the scoped store, not legacy keys.
 function harness(file,s) {
  let slots=[],cursor=0,deps=[],effects=[];
  const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect:(fn,d)=>{const i=cursor++;if(!deps[i]||d.some((v,j)=>v!==deps[i][j])){deps[i]=d;effects.push(fn);}}};
  const session={useLearningSession:()=>({store:s}),useLearningSnapshot:()=>s.getSnapshot()};
  const m=compile(file,{react,'../data/lessons':data,'../utils/legacyLearning':legacy,'../utils/lessonProgress':progress,'../state/LearningSession':session});const invoke=Object.values(m)[0];
  return ()=>{cursor=0;const result=invoke();const run=effects;effects=[];for(const e of run)e();return result;};
 }
 const hookStore=store(null,disk('hook'));await boot(hookStore);const render=harness('src/hooks/useLearningApp.ts',hookStore);let app=render();app.openLesson(a.id);app=render();app.answerCheckpoint(0,a.questions[0].correctIndex,a.questions[0].correctIndex);app=render();assert.equal(Object.keys(app.lessonAttempts[a.id].checkpointAnswers).length,1);
 const savedRender=harness('src/hooks/useSavedLessons.ts',hookStore);let saved=savedRender();saved.toggleSavedLesson(a.id);saved=savedRender();assert.ok(saved.savedLessonIds.includes(a.id));saved.toggleSavedLesson(a.id);assert.ok(!state(hookStore).backup.savedIds.includes(a.id));
 for(let i=1;i<progress.getInlineQuestionCount(a);i++){app.answerCheckpoint(i,a.questions[i].correctIndex,a.questions[i].correctIndex);app=render();}
 app.finishInlineLesson();await flush();app=render();assert.equal(app.screen,'results');assert.ok(app.completedLessonIds.includes(a.id));assert.equal(app.lessonAttempts[a.id],undefined);
 await app.mergeRestoredProgress({...empty(),completedIds:[b.id]});app=render();assert.ok(app.completedLessonIds.includes(b.id));await app.resetLessonProgressForDevelopment();assert.equal(state(hookStore).backup.completedIds.length,0);
 // Root auth boundary remount key changes A -> B -> guest and ignores stale initial session.
 let authCallback,resolveInitial,authEffect,authSlots=[],authCursor=0;
 const fakeClient={auth:{getSession:()=>new Promise(r=>{resolveInitial=r;}),onAuthStateChange:fn=>{authCallback=fn;return{data:{subscription:{unsubscribe(){}}}};}}};
 const authReact={createContext:()=>({Provider:'Provider'}),useContext:()=>null,useSyncExternalStore:()=>{},useState:init=>{const i=authCursor++;if(!(i in authSlots))authSlots[i]=init;return[authSlots[i],v=>{authSlots[i]=typeof v==='function'?v(authSlots[i]):v;}];},useEffect:fn=>{authEffect??=fn;}};
 const jsx=(type,props,key)=>({type,props,key});
 const Session=compile('src/state/LearningSession.tsx',{react:authReact,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{StyleSheet:{create:x=>x}},'react-native-safe-area-context':{},'../lib/supabase':{supabase:fakeClient},'../lib/learningSync':{},'../lib/dailySync':{},'../theme':{colors:{}}}).default;
 const renderSession=()=>{authCursor=0;return Session({children:'app'});};renderSession();const cleanup=authEffect();authCallback('SIGNED_IN',{user:{id:'A',email:'a@example.com'}});assert.equal(renderSession().key,'A');resolveInitial({data:{session:null}});await flush();assert.equal(renderSession().key,'A');authCallback('SIGNED_IN',{user:{id:'B'}});assert.equal(renderSession().key,'B');authCallback('SIGNED_OUT',null);assert.equal(renderSession().key,'guest');cleanup();
 console.log('Automatic sync checks passed: merge laws, tombstones, backup seed, legacy guest migration, offline/restart outbox, conflict retry, in-flight edits, replay reset, account isolation/auth boundary, storage errors and actual learning/bookmark hooks. Mocked transport/native views.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{for(const s of stores)s.stop();});
