/* global __dirname */
// Real account component with mocked native controls/Auth. Does not send email.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
let slots=[],cursor=0,effects=[],deps=[],cleanups=[],callback,configured=true,calls=[],fail=null,pending=null,time=1793354400000;
class Clock extends Date{static now(){return time;}}
const session={user:{id:'user-a',email:'test@example.com'}};
const emit=(value,event='SIGNED_IN')=>callback(event,value);
const client={auth:{
 getSession:async()=>({data:{session:null}}),
 onAuthStateChange(fn){callback=fn;return{data:{subscription:{unsubscribe(){calls.push('cleanup');}}}};},
 signInWithPassword:async args=>{calls.push(['signin',args]);if(fail)return{error:{code:fail}};emit(session);return{};},
 signUp:async args=>{calls.push(['signup',args]);return{data:{session:null}};},
 verifyOtp:async args=>{calls.push(['verify',args]);if(fail)return{error:{code:fail}};emit(session);return{};},
 resend:async args=>{calls.push(['resend',args]);return{};},
 signOut:async args=>{assert.equal(args.scope,'local');emit(null,'SIGNED_OUT');return{};},
},from(){return{upsert:async()=>({}),select:()=>({eq:()=>({single:async()=>({data:{user_id:'user-a'}})})})};}};
const jsx=(type,props)=>({type,props});
const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect(fn,d){const i=cursor++;if(!deps[i]||!d||d.some((v,j)=>v!==deps[i][j])){deps[i]=d;effects.push(()=>{cleanups[i]?.();cleanups[i]=fn();});}}};
function load(file,extras={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,Date:Clock,__DEV__:true,setInterval:()=>1,clearInterval(){},require(id){
 if(id in extras)return extras[id];
 if(id==='react')return react;
 if(id==='react/jsx-runtime')return{jsx,jsxs:jsx};
 if(id==='react-native')return{Text:'Text',View:'View',TextInput:'Input',Pressable:'Pressable',ActivityIndicator:'Spinner',KeyboardAvoidingView:'Keyboard',Platform:{OS:'ios'},StyleSheet:{create:x=>x}};
 if(id==='../lib/supabase')return{get supabase(){return configured?client:null;}};
 if(id==='../utils/pendingSignup')return{validEmail:e=>e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),pendingSignup:async()=>pending,rememberSignup:async e=>{pending=e;}};
 if(id==='../theme')return{colors:{}};
 if(id==='./CloudBackupPanel')return{__esModule:true,default:'CloudBackupPanel'};
 if(id==='./ActionButton')return{__esModule:true,default:'Button'};
 throw Error(id);
 }});return m.exports;}
const Account=load('src/components/AccountPanel.tsx').default;
const render=()=>{cursor=0;const t=Account();const e=effects;effects=[];e.forEach(fn=>fn());return t;};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const button=(t,label)=>{const b=nodes(t).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(b,label);return b;};
const input=(t,label,value)=>{const n=nodes(t).find(n=>n.type==='Input'&&n.props.accessibilityLabel===label);assert.ok(n,label);n.props.onChangeText(value);};
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
const unmount=()=>{cleanups.forEach(fn=>fn?.());slots=[];deps=[];cleanups=[];effects=[];};
(async()=>{
 render();await flush();let t=render();button(t,'Σύνδεση').props.onPress();t=render();assert.ok(JSON.stringify(t).includes('έγκυρο email'));
 input(t,'Email','test@example.com');input(t,'Κωδικός πρόσβασης','somepassword');t=render();fail='invalid_credentials';button(t,'Σύνδεση').props.onPress();await flush();t=render();assert.ok(JSON.stringify(t).includes('δεν είναι σωστός'));assert.equal(nodes(t).find(n=>n.props?.accessibilityLabel==='Κωδικός πρόσβασης').props.value,'');
 fail=null;button(t,'Δεν έχω λογαριασμό — Εγγραφή').props.onPress();t=render();input(t,'Κωδικός πρόσβασης','somepassword');t=render();
 const signup=button(t,'Δημιουργία λογαριασμού');signup.props.onPress();signup.props.onPress();await flush();t=render();assert.equal(calls.filter(c=>c[0]==='signup').length,1);assert.equal(pending,'test@example.com');
 assert.ok(!JSON.stringify(t).includes('επιβεβαίωσε από τον σύνδεσμο'),'no broken-link instruction');
 const cooldown=nodes(t).find(n=>n.props?.label?.startsWith('Νέος κωδικός σε'));assert.equal(cooldown.props.disabled,true);
 input(t,'Κωδικός επιβεβαίωσης email','123');t=render();button(t,'Επιβεβαίωση email').props.onPress();await flush();assert.equal(calls.filter(c=>c[0]==='verify').length,0,'incomplete codes must not call API');
 // Leave/reopen remembers only email and returns directly to confirmation.
 unmount();render();await flush();t=render();assert.ok(nodes(t).some(n=>n.props?.accessibilityLabel==='Κωδικός επιβεβαίωσης email'));button(t,'Αποστολή νέου κωδικού').props.onPress();await flush();t=render();assert.equal(calls.filter(c=>c[0]==='resend').length,1);
 input(t,'Κωδικός επιβεβαίωσης email',' 123 456 ');t=render();fail='otp_expired';button(t,'Επιβεβαίωση email').props.onPress();await flush();t=render();assert.ok(JSON.stringify(t).includes('έληξε'));
 fail=null;button(t,'Επιβεβαίωση email').props.onPress();await flush();t=render();assert.equal(pending,null);assert.equal(calls.filter(c=>c[0]==='verify').at(-1)[1].type,'email');assert.equal(calls.filter(c=>c[0]==='verify').at(-1)[1].token,'123456');assert.ok(JSON.stringify(t).includes('test@example.com'));
 assert.equal(nodes(t).filter(n=>n.type==='CloudBackupPanel').length,0,'advanced tools collapsed by default');
 button(t,'Αποσύνδεση από αυτή τη συσκευή').props.onPress();await flush();t=render();button(t,'Σύνδεση');
 input(t,'Email','test@example.com');input(t,'Κωδικός πρόσβασης','somepassword');t=render();fail='email_not_confirmed';button(t,'Σύνδεση').props.onPress();await flush();t=render();assert.ok(nodes(t).some(n=>n.props?.accessibilityLabel==='Κωδικός επιβεβαίωσης email'),'unconfirmed sign-in leads to code recovery');
 button(t,'Χρησιμοποίησα λάθος email').props.onPress();t=render();assert.equal(pending,null);button(t,'Δημιουργία λογαριασμού');
 unmount();configured=false;t=render();assert.ok(JSON.stringify(t).includes('δεν είναι διαθέσιμη'));unmount();
 // The actual persistence helper stores only a validated email and tolerates disk failures.
 const map=new Map(),storage={getItem:async k=>map.get(k)??null,setItem:async(k,v)=>map.set(k,v),removeItem:async k=>map.delete(k)};
 const util=load('src/utils/pendingSignup.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:storage}});
 await util.rememberSignup('test@example.com');assert.equal(await util.pendingSignup(),'test@example.com');assert.deepEqual([...map.values()],['test@example.com']);await util.rememberSignup(null);assert.equal(await util.pendingSignup(),null);
 storage.getItem=async()=>{throw Error('full');};assert.equal(await util.pendingSignup(),null);
 console.log('Account checks passed: code-only signup, pending-email resume, unconfirmed sign-in recovery, resend cooldown, OTP validation/expiry, password clearing, duplicate taps, session/sign-out, collapsed advanced controls, missing configuration and email-only persistence. Auth/native mocked; delivery needs live SMTP test.');
})().catch(e=>{console.error(e);process.exitCode=1;});
