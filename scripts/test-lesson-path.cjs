/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map(),stores=[];
function load(file,overrides={}){
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,Date,setTimeout,clearTimeout,__DEV__:true,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const target=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(root,target+'.ts'))?target+'.ts':target+'.tsx');}throw Error(id);
 }});if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;
}
const data=load('src/data/lessons.ts'),paths=load('src/utils/lessonPath.ts'),discovery=load('src/utils/readingDiscovery.ts'),{LearningStore}=load('src/state/LearningStore.ts');
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
function harness(store){
 const slots=[],deps=[];let cursor=0,effects=[];
 const react={useRef:init=>{const i=cursor++;if(!(i in slots))slots[i]={current:init};return slots[i];},useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect:(fn,d)=>{const i=cursor++;if(!deps[i]||d.some((v,j)=>v!==deps[i][j])){deps[i]=d;effects.push(fn);}}};
 const hook=load('src/hooks/useLearningApp.ts',{react,'../state/LearningSession':{useLearningSession:()=>({store}),useLearningSnapshot:()=>store.getSnapshot()}}).useLearningApp;
 return()=>{cursor=0;const app=hook();const pending=effects;effects=[];pending.forEach(f=>f());return app;};
}
(async()=>{
 const ids=Object.values(paths.lessonPaths).flat();assert.equal(ids.length,data.lessons.length);assert.equal(new Set(ids).size,data.lessons.length);
 assert.deepEqual([...ids].sort(),plain(data.lessons.map(l=>l.id).sort()));
 let initial=0;
 for(const sub of data.subcategories){
  const sequence=paths.getSubcategoryPath(data.lessons,sub.id);assert.ok(sequence.length);
  assert.deepEqual(plain(paths.getSubcategoryPath([...data.lessons].reverse(),sub.id)),plain(sequence),'order independent of catalogue input');
  sequence.forEach((lesson,i)=>{
   const access=paths.getLessonAccess(lesson,data.lessons,[]);if(access.unlocked)initial++;
   assert.equal(access.unlocked,i===0);assert.equal(access.position,i+1);
   if(i){assert.equal(access.prerequisite.id,sequence[i-1].id);assert.ok(paths.getLessonAccess(lesson,data.lessons,[sequence[i-1].id]).unlocked);}
   assert.ok(paths.getLessonAccess(lesson,data.lessons,[lesson.id]).unlocked,'existing completion always accessible');
   assert.ok(paths.getLessonAccess(lesson,data.lessons,[],[lesson.id]).unlocked,'old unfinished attempt remains accessible');
  });
  const finished=sequence.map(l=>l.id);assert.equal(paths.getNextPathLesson(sequence.at(-1),data.lessons,finished),null);
 }
 assert.equal(initial,data.subcategories.length,'every subcategory has an independent starting point');
 const sequence=paths.getSubcategoryPath(data.lessons,'ancient-greece'),[first,second,third,fourth]=sequence;
 const memory=new Map([['@gnosi/sync-device-id','pathtest']]);
 const storage={getItem:async key=>memory.get(key)??null,setItem:async(key,value)=>{memory.set(key,value);}};
 const store=new LearningStore(null,storage);stores.push(store);
 const render=harness(store);let app=render();app.openLesson(second.id);assert.equal(app.screen,'home','tap before hydration waits');
 await store.start();app=render();app=render();assert.equal(app.screen,'subcategory','queued locked route cannot bypass gate');
 app.openLesson(first.id);app=render();assert.equal(app.screen,'lesson');
 for(let i=0;i<4;i++){app.answerCheckpoint(i,(first.questions[i].correctIndex+1)%4,first.questions[i].correctIndex);app=render();}
 app.finishInlineLesson();await flush();app=render();assert.equal(app.screen,'results');assert.equal(app.score,0);
 assert.equal(paths.getNextPathLesson(first,data.lessons,app.completedLessonIds).id,second.id,'completion unlocks next even at zero score');
 app.openLesson(third.id);app=render();assert.equal(app.screen,'subcategory','cannot skip a prerequisite');
 app.openLesson(second.id);app=render();assert.equal(app.screen,'lesson');
 app.openLesson(first.id);app=render();assert.equal(app.screen,'results','completed lesson opens existing result');
 await store.flushLocal();
 const reopened=new LearningStore(null,storage);stores.push(reopened);await reopened.start();
 assert.ok(paths.getLessonAccess(second,data.lessons,reopened.getSnapshot().backup.completedIds).unlocked,'unlock persists offline restart');
 // Emulate an old app's unfinished later lesson; adding a bookmark never does this.
 reopened.answer(third.id,{checkpointAnswers:{0:third.questions[0].correctIndex},score:1,updatedAt:Date.now(),replayOfCompletedLesson:false});await reopened.flushLocal();
 const resumed=harness(reopened);let old=resumed();old.openLesson(third.id);old=resumed();assert.equal(old.screen,'lesson');assert.equal(old.checkpointAnswers[0],third.questions[0].correctIndex);
 assert.ok(!paths.getLessonAccess(fourth,data.lessons,old.completedLessonIds,old.inProgressLessonIds).unlocked,'started predecessor is insufficient');
 const other=new LearningStore('different-account',storage);stores.push(other);await other.start();assert.ok(!paths.getLessonAccess(second,data.lessons,other.getSnapshot().backup.completedIds).unlocked,'unlock cannot leak between accounts');
 await reopened.resetGuestProgress();assert.ok(!paths.getLessonAccess(second,data.lessons,reopened.getSnapshot().backup.completedIds).unlocked,'reset restores the initial path');
 for(const day of ['2026-10-30','2026-10-31']){
  const picks=discovery.getHomeDiscovery(data.lessons,[],[],day);
  assert.ok([picks.featured,...picks.suggestions].every(l=>l&&paths.getLessonAccess(l,data.lessons,[]).unlocked),'discovery excludes locked lessons');
  assert.ok(discovery.getRelatedLessons(first,data.lessons,[],[],day).every(r=>paths.getLessonAccess(r.lesson,data.lessons,[]).unlocked));
 }
 console.log('Lesson path passed: stable positions and independent starts for the full catalogue, sequential completion unlocks at any score, no route/hydration bypass, recommendations, old progress/resume, offline restart, account isolation and reset.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
