/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}) {
 if(!Object.keys(overrides).length && cache.has(file))return cache.get(file);
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module:mod,exports:mod.exports,console,Intl,setTimeout,clearTimeout,__DEV__:true,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')) {const target=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',target+'.ts'))?target+'.ts':target+'.tsx');}
  throw Error(id);
 }});
 if(!Object.keys(overrides).length)cache.set(file,mod.exports);return mod.exports;
}
const doc=load('src/utils/dailySyncDocument.ts'),util=load('src/utils/dailyChallenge.ts'),historyUtil=load('src/utils/dailyChallengeHistory.ts'),topics=load('src/data/dailyChallengeTopics.ts'),bank=load('src/data/questions.ts'),stats=load('src/utils/progressStats.ts');
const {DailyStore}=load('src/state/DailyStore.ts');
const plain=x=>JSON.parse(JSON.stringify(x));
const date='2026-10-30';
const prefs={topicIds:['history','science','geography'],difficulty:'hard'};
const ids=util.selectDailyQuestions(date).map(q=>q.id);
function record(count=0,completed=false,day=date,wrong=false) {
 const answers={};for(let i=0;i<count;i++){const q=bank.questions.find(q=>q.id===ids[i]);answers[String(i)]=wrong?(q.correctIndex+1)%q.answers.length:q.correctIndex;}
 return {dateKey:day,started:true,completed,currentIndex:Math.max(0,count-1),questionIds:ids,answers};
}
function document(rec,n=1,site='a',run=[1,site]) {return doc.parseDailyDocument({schemaVersion:1,clock:n,preferences:null,days:{[rec.dateKey]:{run,edit:[n,site],record:rec,history:historyUtil.createCompletedHistoryEntry(rec)}}});}
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
function disk(site) {const map=new Map([['@gnosi/sync-device-id',site]]);let fail=false;return{map,setFail:v=>{fail=v;},getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{if(fail)throw Error('full');map.set(k,v);}};}
const rows=new Map();let connected=true,uid='A',conflict=false,pause=null,lostAck=false;const stores=[];
function network(user) {return {pull:async()=>{if(!connected)throw TypeError('offline');if(uid!==user)throw Error('account_changed');const r=rows.get(user);return r?{doc:doc.parseDailyDocument(plain(r.doc)),revision:r.revision}:null;},push:async(payload,revision)=>{if(pause)await pause;if(!connected)throw TypeError('offline');if(uid!==user)throw{code:'42501'};const row=rows.get(user);if(conflict){conflict=false;rows.set(user,{doc:row.doc,revision:row.revision+1});throw{code:'40001'};}if((row?.revision??0)!==revision)throw{code:'40001'};rows.set(user,{doc:plain(payload),revision:revision+1});if(lostAck){lostAck=false;throw TypeError('lost ack');}}};}
function store(user,d,transport=network(user)) {const s=new DailyStore(user,d,user?transport:null);stores.push(s);return s;}
const state=s=>s.getSnapshot();
async function boot(s){await s.start();await flush();await s.sync();await flush();}
(async()=>{
 const partial=document(record(2),3,'a'),more=document(record(4),5,'a'),otherRun=document({...record(1),questionIds:util.selectDailyQuestions(date,bank.questions,prefs).map(q=>q.id)},4,'b',[2,'b']);
 const completed=document(record(7,true),10,'a'),lowScore=document(record(7,true,date,true),8,'b');
 const documents=[doc.emptyDailyDocument(),partial,more,otherRun,completed,lowScore];
 for(const a of documents)for(const b of documents){assert.deepEqual(plain(doc.mergeDailyDocuments(a,b)),plain(doc.mergeDailyDocuments(b,a)));assert.deepEqual(plain(doc.mergeDailyDocuments(a,a)),plain(a));for(const c of documents)assert.deepEqual(plain(doc.mergeDailyDocuments(doc.mergeDailyDocuments(a,b),c)),plain(doc.mergeDailyDocuments(a,doc.mergeDailyDocuments(b,c))));}
 assert.equal(doc.dailyHistory(doc.mergeDailyDocuments(completed,lowScore))[0].score,0,'Concurrent result choice never optimizes for high score.');
 assert.equal(Object.keys(doc.mergeDailyDocuments(partial,more).days[date].record.answers).length,4);
 assert.deepEqual(plain(doc.mergeDailyDocuments(more,otherRun).days[date].record.questionIds),plain(ids));
 assert.equal(doc.mergeDailyDocuments(partial,completed).days[date].record.completed,true);
 const retired=plain(completed);retired.days[date].record.questionIds[0]='retired-question';retired.days[date].history.questionIds[0]='retired-question';assert.equal(doc.dailyHistory(doc.parseDailyDocument(retired))[0].score,700);
 const invalid=plain(partial);invalid.days[date].record.questionIds[0]='retired-question';assert.throws(()=>doc.parseDailyDocument(invalid));
 assert.throws(()=>doc.parseDailyDocument({...plain(completed),schemaVersion:2}));assert.throws(()=>doc.dailyPreferences({topicIds:['unknown','science','history'],difficulty:'hard'}));
 // Migrate shared daily storage only into guest; keep legacy keys as recovery.
 const d1=disk('phone');d1.map.set('@gnosi/daily-challenge-preferences-v1',JSON.stringify(prefs));d1.map.set(util.DAILY_CHALLENGE_STORAGE_KEY,JSON.stringify(record(2,false,util.getAthensDateKey())));d1.map.set(historyUtil.DAILY_CHALLENGE_HISTORY_STORAGE_KEY,JSON.stringify([historyUtil.createCompletedHistoryEntry(record(7,true,'2026-10-28')),historyUtil.createCompletedHistoryEntry(record(7,true,'2026-10-29'))]));
 const guest=store(null,d1);await boot(guest);assert.equal(doc.dailyHistory(state(guest).doc).length,2);assert.ok(d1.map.has(util.DAILY_CHALLENGE_STORAGE_KEY));
 const phone=store('A',d1);await boot(phone);assert.equal(doc.dailyHistory(state(phone).doc).length,0);assert.equal(state(phone).doc.preferences,null);await phone.importGuest(state(guest).doc);await phone.sync();
 const d2=disk('tablet'),tablet=store('A',d2);await boot(tablet);assert.equal(doc.dailyHistory(state(tablet).doc).length,2);assert.equal(doc.currentDailyPreferences(state(tablet).doc).difficulty,'hard');
 // Preference edits never replace a question set already in progress.
 const today=util.getAthensDateKey();const pinned=plain(state(phone).doc.days[today].record.questionIds);await phone.savePreferences(topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES);assert.deepEqual(plain(state(phone).doc.days[today].record.questionIds),pinned);await phone.sync();await tablet.sync();
 // Real hooks: expected-day guards prevent double taps and stale remote answers.
 let displayDate=today,actionDate=today;
 const hookImports={'../data/questions':bank,'../state/LearningSession':{useLearningSession:()=>({dailyStore:phone}),useDailySnapshot:()=>state(phone)},'./useAthensDate':{useAthensDate:()=>displayDate},'../utils/dailyChallenge':{...util,getAthensDateKey:()=>actionDate}};
 const invokeChallenge=load('src/hooks/useDailyChallenge.ts',hookImports).useDailyChallenge;
 const render=()=>invokeChallenge(doc.currentDailyPreferences(state(phone).doc),true);
 let quiz=render();const oldNext=quiz.nextQuestion;await oldNext();quiz=render();const before=plain(quiz.record);await oldNext();assert.deepEqual(plain(render().record),before,'Repeated stale Next cannot skip a question.');
 const oldAnswer=quiz.answerQuestion;actionDate='2099-01-01';await oldAnswer(0);assert.deepEqual(plain(render().record),before,'Athens date rollover rejects stale actions.');actionDate=today;
 // Complete via the actual hook and count once, with atomic history/attempt state.
 for(let i=0;i<20 && !render().record.completed;i++){quiz=render();if(quiz.selectedAnswer===null)await quiz.answerQuestion(quiz.currentQuestion.correctIndex);else await quiz.nextQuestion();}
 assert.equal(render().record.completed,true);const count=doc.dailyHistory(state(phone).doc).length;await render().nextQuestion();assert.equal(doc.dailyHistory(state(phone).doc).length,count);await phone.sync();await tablet.sync();assert.equal(doc.dailyHistory(state(tablet).doc).length,count);
 const knownResult=state(phone).doc.days[today].history.score;
 await phone.importGuest(document(record(7,true,today,true),0,'legacy',[0,'legacy']));assert.equal(state(phone).doc.days[today].history.score,knownResult,'Import preserves loaded account completions.');
 const dailyStats=stats.calculateDailyChallengeProgress(doc.dailyHistory(state(tablet).doc),today);assert.equal(dailyStats.completedChallenges,count);
 // Offline preference/day edits persist across restart and reconcile.
 connected=false;await phone.savePreferences(prefs);const yesterday='2026-09-20';phone.commitRecord(record(1,false,yesterday),undefined);await phone.flushLocal();await phone.sync();assert.equal(state(phone).status,'waiting');phone.stop();const reopened=store('A',d1);await boot(reopened);assert.equal(state(reopened).doc.days[yesterday].record.started,true);connected=true;await reopened.retry();conflict=true;await reopened.savePreferences(topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES);await reopened.sync();await tablet.sync();assert.equal(state(tablet).doc.days[yesterday].record.started,true);
 lostAck=true;await reopened.savePreferences(prefs);await reopened.sync();assert.equal(state(reopened).status,'waiting');await reopened.sync();assert.equal(state(reopened).status,'saved');
 // Changes made during upload require a later acknowledgement.
 let release;pause=new Promise(r=>{release=r;});await reopened.savePreferences(topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES);const upload=reopened.sync();await flush();await reopened.savePreferences(prefs);release();pause=null;await upload;assert.equal(state(reopened).status,'queued');await reopened.sync();assert.equal(state(reopened).status,'saved');
 // Isolation and late response guards apply to daily data as well.
 let releaseOld;pause=new Promise(r=>{releaseOld=r;});await reopened.savePreferences(topics.DEFAULT_DAILY_CHALLENGE_PREFERENCES);const oldUpload=reopened.sync();await flush();reopened.stop();uid='B';const b=store('B',d1);await boot(b);releaseOld();pause=null;await oldUpload;assert.equal(doc.dailyHistory(state(b).doc).length,0);assert.equal(state(b).doc.preferences,null);assert.equal(doc.dailyHistory(state(guest).doc).length,2);await assert.rejects(b.resetGuestDate(today));
 uid='A';await boot(reopened);d1.setFail(true);await reopened.savePreferences(prefs);assert.equal(state(reopened).status,'local-error');d1.setFail(false);await reopened.retry();assert.equal(state(reopened).status,'saved');
 // Guest reset removes just that day's attempt/result, preserving prefs and prior dates.
 await guest.resetGuestDate(today);assert.equal(state(guest).doc.days[today],undefined);assert.equal(doc.dailyHistory(state(guest).doc).length,2);assert.equal(doc.currentDailyPreferences(state(guest).doc).difficulty,'hard');
 const corrupted=disk('broken');corrupted.map.set('@gnosi/daily-v2/guest','invalid');const bad=store(null,corrupted);await boot(bad);assert.equal(state(bad).ready,false);assert.equal(corrupted.map.get('@gnosi/daily-v2/guest'),'invalid');
 // Import controls only write after confirmation, support cancel, and lock duplicate taps.
 let slots=[],cursor=0,effect,imports=0;
 const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:init=>{const i=cursor++;return slots[i]??={current:init};},useEffect:fn=>{effect??=fn;}};
 const jsx=(type,props)=>({type,props});
 const Controls=load('src/components/DailySyncControls.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x}},'../state/LearningSession':{useLearningSession:()=>({email:'a@example.com',dailyStore:{userId:'A',importGuest:async()=>{imports++;}}})},'../lib/dailySync':{getDailyStore:()=>guest}}).default;
 const renderControls=()=>{cursor=0;return Controls();};
 const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
 const tap=(t,label)=>{const button=nodes(t).find(n=>n.type==='Pressable'&&nodes(n).some(c=>c.type==='Text'&&c.props.children===label));assert.ok(button,label);button.props.onPress();};
 let ui=renderControls();const cleanup=effect();assert.equal(imports,0);tap(ui,'Προεπισκόπηση παλιών ημερήσιων δεδομένων');await flush();ui=renderControls();assert.equal(imports,0);tap(ui,'Ακύρωση εισαγωγής ημερήσιων δεδομένων');ui=renderControls();assert.equal(imports,0);
 tap(ui,'Προεπισκόπηση παλιών ημερήσιων δεδομένων');await flush();ui=renderControls();tap(ui,'Εισαγωγή ημερήσιων δεδομένων και προτιμήσεων');tap(ui,'Εισαγωγή ημερήσιων δεδομένων και προτιμήσεων');await flush();assert.equal(imports,1);cleanup();
 console.log('Daily sync checks passed: merge laws, whole pinned attempts, deterministic one-result-per-date history, frozen historical score, strict validation, guest migration/import, real quiz hooks/stale taps/midnight, preferences, offline restart, conflict/lost-ack/in-flight edits, account isolation, storage errors and guest reset. Transport/native views mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{for(const s of stores)s.stop();});
