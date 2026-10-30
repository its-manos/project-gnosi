/* global __dirname */
// Mocked UI/API interaction checks. No network calls, users or emails.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let slots=[], cursor=0, effect, callback, configured=true, calls=[], fail=false;
const session={user:{id:'user-a',email:'test@example.com'}};
const emit = value => callback('SIGNED_IN',value);
const client={auth:{
 getSession:async()=>({data:{session:null}}),
 onAuthStateChange(fn){callback=fn;return {data:{subscription:{unsubscribe(){calls.push('cleanup');}}}};},
 signInWithPassword:async()=>{calls.push('signin');if(fail)return {error:{code:'invalid_credentials'}};emit(session);return {};},
 signUp:async()=>{calls.push('signup');return {data:{session:null}};},
 verifyOtp:async args=>{calls.push(args.type);emit(session);return {};},
 resend:async()=>({}),
 signOut:async args=>{assert.equal(args.scope,'local');emit(null);return {};},
},from(table){assert.equal(table,'profiles');return {
 upsert:async(row,options)=>{assert.equal(row.user_id,'user-a');assert.ok(options.ignoreDuplicates);return {};},
 select:()=>({eq:()=>({single:async()=>({data:{user_id:'user-a'}})})}),
};}};
const mod={exports:{}};
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/components/AccountPanel.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require(id){
 if(id==='react')return {
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
 useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
 useEffect(fn){effect??=fn;},
 };
 if(id==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 if(id==='react-native')return {Text:'Text',View:'View',TextInput:'Input',ActivityIndicator:'Spinner',KeyboardAvoidingView:'Keyboard',Platform:{OS:'android'},StyleSheet:{create:x=>x}};
 if(id==='../lib/supabase')return {get supabase(){return configured?client:null;}};
 if(id==='../theme')return {colors:{}};
 if(id==='./CloudBackupPanel')return {__esModule:true,default:'CloudBackupPanel'};
 if(id==='./ActionButton')return {__esModule:true,default:'Button'};
 throw new Error(id);
}});
const render=()=>{cursor=0;return mod.exports.default();};
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const button=(t,label)=>{const b=nodes(t).find(n=>n.type==='Button'&&n.props.label===label);assert.ok(b,label);return b;};
const input=(t,label,value)=>{const n=nodes(t).find(n=>n.type==='Input'&&n.props.accessibilityLabel===label);assert.ok(n,label);n.props.onChangeText(value);};
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
(async()=>{
 let t=render();const cleanup=effect();await flush();t=render();assert.equal(calls.length,0);
 button(t,'Σύνδεση').props.onPress();t=render();assert.ok(JSON.stringify(t).includes('έγκυρο email'));
 input(t,'Email','test@example.com');input(t,'Κωδικός πρόσβασης','somepassword');t=render();fail=true;
 button(t,'Σύνδεση').props.onPress();await flush();t=render();assert.ok(JSON.stringify(t).includes('δεν είναι σωστός'));
 assert.equal(nodes(t).find(n=>n.props?.accessibilityLabel==='Κωδικός πρόσβασης').props.value,'');fail=false;
 button(t,'Δεν έχω λογαριασμό — Εγγραφή').props.onPress();t=render();input(t,'Κωδικός πρόσβασης','somepassword');t=render();
 const b=button(t,'Δημιουργία λογαριασμού');b.props.onPress();b.props.onPress();await flush();t=render();assert.equal(calls.filter(c=>c==='signup').length,1);
 input(t,'Κωδικός επιβεβαίωσης email','123456');t=render();button(t,'Επιβεβαίωση email').props.onPress();await flush();t=render();assert.ok(calls.includes('email'));
 button(t,'Έλεγχος σύνδεσης με τη βάση').props.onPress();await flush();t=render();assert.ok(JSON.stringify(t).includes('Η σύνδεση με τη βάση λειτουργεί'));
 button(t,'Αποσύνδεση από αυτή τη συσκευή').props.onPress();await flush();t=render();button(t,'Σύνδεση');cleanup();assert.ok(calls.includes('cleanup'));
 slots=[];effect=null;configured=false;t=render();const stop=effect();assert.ok(JSON.stringify(t).includes('Δεν έχει ρυθμιστεί'));stop();
 console.log('Account checks passed: guest, input validation, auth error, password clearing, duplicate taps, signup confirmation, profile request, local sign-out, cleanup, missing configuration. Mocked UI/API only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
