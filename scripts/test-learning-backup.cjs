/* global __dirname */
// Mocked API/UI + real merge/validation logic. No live account or network writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.join(__dirname,'..');
function compile(file,imports={}) {
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module:mod,exports:mod.exports,console,Intl,require:id=>{if(id in imports)return imports[id];throw Error(id);}});
 return mod.exports;
}
const data=compile('src/data/lessons.ts',{'./additionalLessons':compile('src/data/additionalLessons.ts'),'./catalogueExpansion':compile('src/data/catalogueExpansion.ts')});
const progress=compile('src/utils/lessonProgress.ts');
const util=compile('src/utils/learningBackup.ts',{'../data/lessons':data,'./lessonProgress':progress});
const plain=x=>JSON.parse(JSON.stringify(x));
const a=data.lessons[0],b=data.lessons[1],c=data.lessons[2];
const empty=()=>({schemaVersion:1,completedIds:[],savedIds:[],attempts:{}});
const attempt=(n,time=100,replay=false)=>({checkpointAnswers:Object.fromEntries(Array.from({length:n},(_,i)=>[i,a.questions[i].correctIndex])),score:999,updatedAt:time,replayOfCompletedLesson:replay});
const local={...empty(),completedIds:[b.id],savedIds:[a.id],attempts:{[a.id]:attempt(2)}};
const cloud={...empty(),completedIds:[c.id],savedIds:[b.id],attempts:{[a.id]:attempt(1,200)}};
const merged=util.mergeLearningBackups(local,cloud);
assert.deepEqual(plain(merged.completedIds),[b.id,c.id].sort());assert.deepEqual(plain(merged.savedIds),[a.id,b.id].sort());
assert.equal(merged.attempts[a.id].score,2);assert.equal(Object.keys(merged.attempts[a.id].checkpointAnswers).length,2);
assert.deepEqual(plain(util.mergeLearningBackups(merged,cloud)),plain(merged),'Retry is idempotent.');
assert.throws(()=>util.parseLearningBackup({...empty(),schemaVersion:2}));
assert.throws(()=>util.parseLearningBackup({...empty(),savedIds:'bad'}));
assert.throws(()=>util.parseLearningBackup({...empty(),attempts:{[a.id]:{...attempt(1),checkpointAnswers:{0:99}}}}));
assert.throws(()=>util.parseLearningBackup({...empty(),savedIds:['newer-catalogue-id']}));
assert.deepEqual(plain(util.parseLearningBackup({...empty(),savedIds:[a.id,a.id]}).savedIds),[a.id]);
assert.ok(!util.mergeLearningBackups(local,{...empty(),completedIds:[a.id]}).attempts[a.id]);
assert.ok(util.mergeLearningBackups({...empty(),completedIds:[a.id],attempts:{[a.id]:attempt(1,100,true)}},empty()).attempts[a.id]);
assert.ok(util.mergeLearningBackups({...empty(),completedIds:[a.id],attempts:{[a.id]:attempt(1,100,true)}},{...empty(),attempts:{[a.id]:attempt(2,200)}}).attempts[a.id].replayOfCompletedLesson);
let uid='user-a',row=null,rpcCalls=[],readCount=0,conflict=false;
const client={auth:{getSession:async()=>({data:{session:uid?{user:{id:uid}}:null}})},
 from(table){assert.equal(table,'learning_backups');return {select:()=>({eq:(field,id)=>{assert.equal(field,'user_id');assert.equal(id,'user-a');return {maybeSingle:async()=>{readCount++;return {data:row};}};}})};},
 rpc:async(name,args)=>{assert.equal(name,'save_learning_backup');rpcCalls.push(args);return conflict?{error:{code:'40001'}}:{};}};
const api=compile('src/lib/learningBackup.ts',{'../utils/learningBackup':util});
let slots=[],cursor=0,effect;
const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:initial=>{const i=cursor++;return slots[i]??={current:initial};},useEffect:fn=>{effect??=fn;}};
const jsx=(type,props)=>({type,props});
const native={Text:'Text',View:'View',ActivityIndicator:'Spinner',StyleSheet:{create:s=>s}};
const Panel=compile('src/components/CloudBackupPanel.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'./ActionButton':{__esModule:true,default:'Button'},'../lib/supabase':{supabase:client},'../lib/learningBackup':api,'../utils/learningBackup':util,'../theme':{colors:{}}}).default;
let restored=[],busy=[];
const render=()=>{cursor=0;return Panel({userId:'user-a',deviceBackup:local,onRestoreBackup:async p=>restored.push(p),onBusyChange:v=>busy.push(v)});};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const button=(t,label)=>{const n=nodes(t).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(n,label);return n;};
const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
(async()=>{
 assert.equal(await api.readAccountBackup(client,'user-a'),null);
 uid='user-b';await assert.rejects(api.saveAccountBackup(client,'user-a',local,0));assert.equal(rpcCalls.length,0);uid='user-a';
 row={user_id:'wrong-user',payload:cloud,revision:1,updated_at:'2026-10-30T12:00:00Z'};await assert.rejects(api.readAccountBackup(client,'user-a'));
 row=null;let tree=render();const cleanup=effect();const before=readCount;await flush();assert.equal(readCount,before,'No automatic transfer on mount.');
 button(tree,'Προεπισκόπηση αποθήκευσης στον λογαριασμό').props.onPress();await flush();tree=render();assert.equal(rpcCalls.length,0,'Preview does not save.');
 const confirm=button(tree,'Επιβεβαίωση αποθήκευσης');confirm.props.onPress();confirm.props.onPress();await flush();tree=render();assert.equal(rpcCalls.length,1);assert.equal(rpcCalls[0].p_user_id,'user-a');assert.equal(rpcCalls[0].p_expected_revision,0);
 row={user_id:'user-a',payload:cloud,revision:3,updated_at:'2026-10-30T12:00:00Z'};
 button(tree,'Προεπισκόπηση επαναφοράς στη συσκευή').props.onPress();await flush();tree=render();assert.equal(restored.length,0);
 button(tree,'Ακύρωση μεταφοράς').props.onPress();tree=render();assert.equal(restored.length,0);
 button(tree,'Προεπισκόπηση επαναφοράς στη συσκευή').props.onPress();await flush();tree=render();button(tree,'Επιβεβαίωση επαναφοράς').props.onPress();await flush();tree=render();assert.deepEqual(plain(restored[0]),plain(merged));
 button(tree,'Προεπισκόπηση αποθήκευσης στον λογαριασμό').props.onPress();await flush();tree=render();conflict=true;button(tree,'Επιβεβαίωση αποθήκευσης').props.onPress();await flush();tree=render();assert.ok(JSON.stringify(tree).includes('άλλη συσκευή'));conflict=false;
 button(tree,'Προεπισκόπηση επαναφοράς στη συσκευή').props.onPress();await flush();tree=render();uid='user-b';button(tree,'Επιβεβαίωση επαναφοράς').props.onPress();await flush();tree=render();assert.equal(restored.length,1,'Account change cannot apply previous account data.');uid='user-a';
 row={...row,payload:{schemaVersion:99}};button(tree,'Προεπισκόπηση επαναφοράς στη συσκευή').props.onPress();await flush();tree=render();assert.ok(JSON.stringify(tree).includes('μη έγκυρα'));assert.equal(restored.length,1);
 cleanup();assert.equal(busy.at(-1),false);
 // Exercise actual local hooks: hydrate, additive restore, disk persistence and repeated restore.
 function harness(file,extra={}) {
  let state=[],index=0,dependencies=[],effects=[];
  const storage=new Map();
  const asyncStorage={getItem:async k=>storage.get(k)??null,setItem:async(k,v)=>{storage.set(k,v);},removeItem:async k=>{storage.delete(k);}};
  const hooks={useState:initial=>{const i=index++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;}];},useEffect:(fn,deps)=>{const i=index++;if(!dependencies[i]||deps.some((d,j)=>d!==dependencies[i][j])){dependencies[i]=deps;effects.push(fn);}}};
  const m=compile(file,{react:hooks,'@react-native-async-storage/async-storage':{__esModule:true,default:asyncStorage},'../data/lessons':data,'../utils/lessonProgress':progress,'../utils/learningBackup':util,...extra});
  const invokeHook=Object.values(m)[0];
  return {storage,render(){index=0;const value=invokeHook();const run=effects;effects=[];for(const fn of run)fn();return value;}};
 }
 const learning=harness('src/hooks/useLearningApp.ts');learning.storage.set('@gnosi/completed-lesson-ids',JSON.stringify([b.id]));learning.storage.set('@gnosi/in-progress-lesson-attempts',JSON.stringify(local.attempts));learning.render();await flush();let app=learning.render();assert.equal(app.progressLoaded,true);
 await app.mergeRestoredProgress(cloud);app=learning.render();assert.deepEqual(plain(app.completedLessonIds),[b.id,c.id].sort());assert.equal(Object.keys(app.lessonAttempts[a.id].checkpointAnswers).length,2);
 assert.deepEqual(JSON.parse(learning.storage.get('@gnosi/completed-lesson-ids')),[b.id,c.id].sort());
 await app.mergeRestoredProgress(cloud);app=learning.render();assert.equal(app.completedLessonIds.length,2);
 const restoreWrite=app.mergeRestoredProgress(cloud);app=learning.render();app.openLesson(a.id);app=learning.render();
 app.answerCheckpoint(2,a.questions[2].correctIndex,a.questions[2].correctIndex);await restoreWrite;await flush();
 assert.equal(Object.keys(JSON.parse(learning.storage.get('@gnosi/in-progress-lesson-attempts'))[a.id].checkpointAnswers).length,3,'New reading writes follow restore writes.');
 const saved=harness('src/hooks/useSavedLessons.ts');saved.storage.set('@gnosi/saved-lesson-ids',JSON.stringify([a.id]));saved.render();await flush();let bookmarks=saved.render();await flush();await bookmarks.mergeRestoredBookmarks([b.id,a.id]);bookmarks=saved.render();assert.equal(bookmarks.savedLessonIds.length,2);await flush();assert.equal(JSON.parse(saved.storage.get('@gnosi/saved-lesson-ids')).length,2);
 console.log('Learning backup checks passed: schema validation, additive/idempotent merge, whole-attempt selection, score recomputation, replay, explicit previews/cancel, double taps, account changes, revision conflicts, malformed data and real local-hook persistence. API/native views mocked.');
})().catch(error=>{console.error(error);process.exitCode=1;});
