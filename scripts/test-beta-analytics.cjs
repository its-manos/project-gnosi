const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, imports = {}) {
 const output=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const m={exports:{}};new Function('require','module','exports',output)(id=>{assert.ok(id in imports,id);return imports[id];},m,m.exports);return m.exports;
}
const {BetaAnalytics,ANALYTICS_KEY,ANALYTICS_CONSENT_KEY,SESSION_GAP_MS,cleanAnalyticsProperties}=load('src/utils/betaAnalytics.ts');
const tick=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
function harness(environment='beta') {
 let now=Date.parse('2026-10-31T10:00:00Z'),n=0,offline=true,failKey=null;
 const disk=new Map(),server=new Map(),batches=[];
 const storage={getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{if(failKey==='all'||failKey===k)throw Error('disk');disk.set(k,v);}};
 const deps={environment,platform:'android',storage,now:()=>now,id:()=>`00000000-0000-4000-8000-${String(++n).padStart(12,'0')}`,send:async(events,signal)=>{assert.equal(signal.aborted,false);batches.push(JSON.parse(JSON.stringify(events)));if(offline)throw Error('offline');for(const e of events)server.set(e.event_id,e);}};
 return {disk,server,batches,deps,make:()=>new BetaAnalytics(deps),advance:ms=>{now+=ms;},online:()=>{offline=false;},fail:key=>{failKey=key;}};
}
const lesson={screen:'lesson',lesson_id:'architecture-introduction',category_id:'culture',subcategory_id:'architecture',answered_count:0,total_questions:4};
(async()=>{
 const h=harness(),a=h.make();await a.start();
 assert.equal(a.getSnapshot().enabled,false);await a.view('home');await a.track('onboarding_completed');await a.flush();assert.equal(h.disk.size,0);assert.equal(h.batches.length,0,'No identifier or events before opt-in');
 await a.setEnabled(true);await tick();const install=JSON.parse(h.disk.get(ANALYTICS_KEY)).installId;
 await a.track('onboarding_step_viewed',{screen:'welcome',onboarding_step:1,replay:false});
 await a.track('onboarding_completed',{screen:'welcome',onboarding_step:4,replay:false});
 await a.lesson(lesson);await a.progress({answered_count:1,last_paragraph:2});await a.progress({answered_count:1,last_paragraph:2});
 await a.progress({last_paragraph:1});await a.lesson(null);
 let d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.queue.filter(e=>e.event_name==='lesson_started').length,1);assert.equal(d.queue.filter(e=>e.event_name==='lesson_progress').length,1);assert.equal(d.queue.find(e=>e.event_name==='lesson_left').properties.last_paragraph,2);
 await a.completeLesson();assert.equal(JSON.parse(h.disk.get(ANALYTICS_KEY)).queue.filter(e=>e.event_name==='lesson_completed').length,0,'Opening saved results is not completion');
 await a.lesson({...lesson,answered_count:1});await a.progress({answered_count:4});await a.completeLesson();await a.completeLesson();
 d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.queue.filter(e=>e.event_name==='lesson_completed').length,1);assert.equal(d.queue.filter(e=>e.event_name==='lesson_started')[1].properties.resumed,true);
 await a.view('lesson');await a.lesson(lesson);await a.background();await a.background();h.advance(60000);await a.foreground();
 d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.queue.filter(e=>e.event_name==='session_backgrounded').length,1);assert.equal(d.queue.filter(e=>e.event_name==='lesson_interrupted').length,0,'Short background is not abandonment');assert.equal(d.queue.filter(e=>e.event_name==='session_started').length,1);
 await a.background();h.advance(SESSION_GAP_MS);await a.foreground();d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.queue.filter(e=>e.event_name==='session_started').length,2);assert.equal(d.queue.filter(e=>e.event_name==='lesson_interrupted').length,1);
 const b=h.make();await b.start();await b.flush();d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.installId,install);assert.ok(d.queue.some(e=>e.event_name==='lesson_interrupted'&&e.properties.reason==='cold_start'));
 // Lost acknowledgements retry exactly the same IDs, server ON CONFLICT dedupes.
 h.online();let loseAck=true;const actualSend=h.deps.send;h.deps.send=async(...args)=>{await actualSend(...args);if(loseAck){loseAck=false;throw Error('lost acknowledgement');}};
 await b.flush();const unique=h.server.size;await b.flush();assert.equal(h.server.size,unique);assert.equal(JSON.parse(h.disk.get(ANALYTICS_KEY)).queue.length,0);
 await b.track('screen_viewed',{screen:'search',email:'private@example.test',query:'private search',answer:3});await b.flush();const event=[...h.server.values()].at(-1);assert.deepEqual(event.properties,{screen:'search'});
 assert.deepEqual(cleanAnalyticsProperties({screen:'invented',onboarding_step:9,answered_count:-1,lesson_id:'email@example.test',replay:'yes'}),{});
 await b.lesson(lesson);const pending=b.track('screen_viewed',{screen:'home'});await b.setEnabled(false);await pending;await b.flush();d=JSON.parse(h.disk.get(ANALYTICS_KEY));assert.equal(d.installId,null);assert.equal(d.queue.length,0);assert.equal(d.activeLesson,null);assert.equal(b.getSnapshot().enabled,false);
 const count=h.server.size;await b.track('onboarding_completed');await b.flush();assert.equal(h.server.size,count);const off=h.make();await off.start();assert.equal(off.getSnapshot().enabled,false);
 await off.setEnabled(true);assert.notEqual(JSON.parse(h.disk.get(ANALYTICS_KEY)).installId,install,'Re-consent creates a new pseudonym');
 // Withdrawal aborts transport immediately, before pending serial writes.
 const slow=harness();let resolveSend,aborted=false;slow.deps.send=async(_e,signal)=>new Promise(resolve=>{resolveSend=resolve;signal.addEventListener('abort',()=>{aborted=true;resolve();});});const c=slow.make();await c.start();await c.setEnabled(true);await tick();assert.ok(resolveSend);await c.setEnabled(false);await tick();assert.equal(aborted,true);assert.equal(JSON.parse(slow.disk.get(ANALYTICS_KEY)).queue.length,0);
 // Either persisted revocation record is sufficient when one disk write fails.
 for(const failKey of [ANALYTICS_KEY,ANALYTICS_CONSENT_KEY]){const x=harness();const store=x.make();await store.start();await store.setEnabled(true);await tick();x.fail(failKey);await store.setEnabled(false);x.fail(null);const restart=x.make();await restart.start();assert.equal(restart.getSnapshot().enabled,false);}
 // Both writes fail: current process still stops; report inability to save.
 const broken=harness();const bs=broken.make();await bs.start();await bs.setEnabled(true);broken.fail('all');await bs.setEnabled(false);assert.equal(bs.getSnapshot().enabled,false);assert.equal(bs.getSnapshot().error,true);
 const malformed=harness();malformed.disk.set(ANALYTICS_CONSENT_KEY,'yes');malformed.disk.set(ANALYTICS_KEY,'{bad');const bad=malformed.make();await bad.start();assert.equal(bad.getSnapshot().enabled,false);
 // Queue remains bounded and drops stale (>7 days) events on restart.
 const bounded=harness('development'),q=bounded.make();await q.start();await q.setEnabled(true);for(let i=0;i<350;i++)await q.track('screen_viewed',{screen:'home'});assert.equal(JSON.parse(bounded.disk.get(ANALYTICS_KEY)).queue.length,300);bounded.advance(8*86400000);const fresh=bounded.make();await fresh.start();assert.equal(JSON.parse(bounded.disk.get(ANALYTICS_KEY)).queue.length,1);assert.equal(JSON.parse(bounded.disk.get(ANALYTICS_KEY)).queue[0].environment,'development');
 console.log('Beta analytics passed: opt-in, privacy allowlist, navigation/completion, resume and timeout, cold-start interruption, bounded offline queue, lost-ack dedupe, withdrawal abort, storage failures and DEV separation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
