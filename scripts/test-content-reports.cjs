/* global __dirname */
// Real report parser/outbox/transport/component; native UI/Auth/network mocked.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}){if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(code,{module:m,exports:m.exports,Date,Intl,console,AbortController,setTimeout,clearTimeout,require:id=>{if(id in overrides)return overrides[id];if(id.startsWith('.')){const p=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(__dirname,'..',p+'.ts'))?p+'.ts':p+'.tsx');}throw Error(id);}});if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;}
const {lessons}=load('src/data/lessons.ts'),{questions}=load('src/data/questions.ts'),util=load('src/utils/contentReports.ts'),{ReportOutbox}=load('src/state/ReportOutbox.ts');
const plain=x=>JSON.parse(JSON.stringify(x)),target=util.lessonReportTarget(lessons[0],2),flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
function disk(){const map=new Map();let fail=false;return{map,setFail:v=>fail=v,getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{if(fail)throw Error('full');map.set(k,v);}};}
(async()=>{
 assert.equal(target.questionText,lessons[0].questions[2].question);assert.equal(target.questionIndex,2);assert.equal(util.dailyReportTarget(questions[0]).itemId,questions[0].id);assert.equal(util.lessonReportTarget(lessons[0]).questionText,null);
 assert.throws(()=>util.lessonReportTarget(lessons[0],-1));assert.throws(()=>util.lessonReportTarget(lessons[0],99));
 const changed=plain(lessons[0]);changed.questions[2].explanation+=' edited';assert.notEqual(util.lessonReportTarget(changed,2).contentKey,target.contentKey,'explanation changes must alter content fingerprint');
 const base={id:'report_a',clientId:'client_a',createdAt:Date.now(),target,reason:'unclear',note:'Could this be clearer?'};
 for(const l of lessons){util.parseContentReport({...base,target:util.lessonReportTarget(l)});l.questions.forEach((q,i)=>{const t=util.lessonReportTarget(l,i);util.parseContentReport({...base,target:t});assert.equal(t.questionText,q.question);});}
 for(const q of questions)util.parseContentReport({...base,target:util.dailyReportTarget(q)});
 util.parseContentReport(base);for(const value of [{...base,reason:'bad'},{...base,note:'a'.repeat(2001)},{...base,reason:'other',note:' '},{...base,target:{...target,questionIndex:-1}},{...base,extra:1},{...base,target:{...target,questionText:null}},{...base,target:{...target,kind:'daily',questionIndex:2}},{...base,createdAt:-1}])assert.throws(()=>util.parseContentReport(value));
 const storage=disk(),server=new Map(),requests=[];let online=false,lostAck=false;
 async function deliver(report){requests.push(plain(report));if(!online)throw Error('offline');const previous=server.get(report.id);if(previous)assert.deepEqual(previous,plain(report));else server.set(report.id,plain(report));if(lostAck){lostAck=false;throw Error('lost acknowledgement');}}
 const store=new ReportOutbox(null,storage,deliver);await store.start();assert.equal(requests.length,0,'opening/loading never sends');
 assert.equal(await store.submit(target,'unclear','  More explanation please  '),false);assert.equal(store.getSnapshot().items.length,1);assert.equal(store.getSnapshot().items[0].note,'More explanation please');
 const frozen=plain(store.getSnapshot().items[0]);const restarted=new ReportOutbox(null,storage,deliver);await restarted.start();assert.deepEqual(plain(restarted.getSnapshot().items),[frozen]);assert.equal(requests.length,1,'restart does not send without user action');
 online=true;lostAck=true;assert.equal(await restarted.retry(),false);assert.equal(server.size,1);assert.equal(restarted.getSnapshot().items.length,1);assert.equal(await restarted.retry(),true);assert.equal(server.size,1,'lost acknowledgement retries cannot duplicate report');assert.equal(restarted.getSnapshot().items.length,0);
 assert.ok([...storage.map.keys()].every(key=>key.startsWith('@gnosi/report-outbox-v1/')),'report writes never touch scores/progress');
 const account=new ReportOutbox('user-a',storage,deliver);await account.start();assert.equal(account.getSnapshot().items.length,0);assert.notEqual(account.key,store.key);
 const badDisk=disk();badDisk.setFail(true);let sent=0;const diskFail=new ReportOutbox(null,badDisk,async()=>sent++);await diskFail.start();assert.equal(await diskFail.submit(target,'incorrect',''),false);assert.equal(sent,0,'do not send before local durable save');assert.equal(diskFail.getSnapshot().items.length,0);
 const corrupt=disk();corrupt.map.set('@gnosi/report-outbox-v1/guest','broken');const broken=new ReportOutbox(null,corrupt,deliver);await broken.start();assert.equal(broken.getSnapshot().ready,false);assert.equal(corrupt.map.get(broken.key),'broken','load failure must never erase reports');
 // Real transport refuses a session that changed after a report was queued.
 let user=null,rpcCalls=0,accepted=true;
 const client={auth:{getSession:async()=>({data:{session:user?{user:{id:user}}:null}})},rpc(_name,args){rpcCalls++;assert.equal(args.p_user_id,user);return{abortSignal:async()=>({data:accepted,error:null})};}};
 const lib=load('src/lib/contentReports.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'./supabase':{supabase:client}});
 const scoped=lib.getReportOutbox('user-a');await scoped.start();assert.equal(await scoped.submit(target,'image',''),false);assert.equal(rpcCalls,0);user='user-a';assert.equal(await scoped.retry(),true);assert.equal(rpcCalls,1);
 accepted=false;assert.equal(await scoped.submit(target,'unclear',''),false);assert.equal(scoped.getSnapshot().items.length,1,'missing acceptance cannot discard a queued report');accepted=true;assert.equal(await scoped.retry(),true);
 // Report form: other requires details, offline report freezes for retry, no duplicate taps.
 const uiDisk=disk();let uiOnline=false,uiRequests=0;
 const uiStore=new ReportOutbox(null,uiDisk,async()=>{uiRequests++;if(!uiOnline)throw Error('offline');});await uiStore.start();
 let slots=[],cursor=0,effects=[];
 const react={useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=cursor++;if(!(i in slots))slots[i]={current:init};return slots[i];},useEffect:fn=>{const i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(fn);}}};
 const jsx=(type,props)=>({type,props});
 const Button=load('src/components/ReportContentButton.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{Text:'Text',View:'View',Pressable:'Pressable',Modal:'Modal',TextInput:'Input',ScrollView:'ScrollView',KeyboardAvoidingView:'Keyboard',Platform:{OS:'ios'},StyleSheet:{create:x=>x}},'react-native-safe-area-context':{SafeAreaProvider:'SafeAreaProvider',SafeAreaView:'SafeArea'},'react-native-svg':{__esModule:true,default:'Svg',Path:'Path'},'../hooks/useReportOutbox':{useReportOutbox:()=>({store:uiStore,...uiStore.getSnapshot()})},'./ActionButton':{__esModule:true,default:'Button'}}).default;
 const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
 const render=()=>{cursor=0;const tree=Button({target});effects.splice(0).forEach(fn=>fn());return tree;};
 const button=(tree,label)=>{const n=nodes(tree).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(n,label);return n;};
 let tree=render();assert.equal(nodes(tree).find(n=>n.type==='Modal').props.visible,false);nodes(tree).find(n=>n.type==='Pressable').props.onPress();tree=render();assert.equal(uiRequests,0);
 const modal=nodes(tree).find(n=>n.type==='Modal');assert.equal(modal.props.children.type,'SafeAreaProvider','modal measures its own safe-area surface');assert.deepEqual(plain(nodes(modal).find(n=>n.type==='SafeArea').props.edges),['top','right','bottom','left']);assert.equal(nodes(modal).find(n=>n.type==='ScrollView').props.contentInsetAdjustmentBehavior,'never','safe area and keyboard spacing must not be added twice');
 nodes(tree).find(n=>n.props?.accessibilityLabel==='Κάτι άλλο').props.onPress();tree=render();assert.equal(button(tree,'Στείλε την αναφορά').props.disabled,true);
 nodes(tree).find(n=>n.type==='Input').props.onChangeText('This sentence is confusing.');tree=render();const submit=button(tree,'Στείλε την αναφορά');submit.props.onPress();submit.props.onPress();await flush();tree=render();assert.equal(uiRequests,1);assert.equal(uiStore.getSnapshot().items.length,1);assert.equal(nodes(tree).find(n=>n.type==='Input').props.editable,false);
 nodes(tree).find(n=>n.type==='Modal').props.onRequestClose();tree=render();assert.equal(nodes(tree).find(n=>n.type==='Modal').props.visible,false);
 nodes(tree).find(n=>n.type==='Pressable').props.onPress();tree=render();uiOnline=true;button(tree,'Ξαναστείλε την αναφορά').props.onPress();await flush();tree=render();button(tree,'Πίσω στη μάθηση');assert.equal(uiStore.getSnapshot().items.length,0);assert.equal(uiRequests,2);
 assert.ok([...uiDisk.map.keys()].every(k=>k.startsWith('@gnosi/report-outbox')));
 console.log('Content reports passed: exact lesson/daily/question context, version fingerprint, input validation, explicit submission, offline/restart persistence, lost-ack deduplication, account isolation, disk-error preservation, real transport account guard, form validation/double taps/retry/success. Native/network mocked; no live reports sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
