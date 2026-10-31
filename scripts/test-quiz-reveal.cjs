const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function fixture(){let effect,resolve,reject,listener,started=0,stopped=0,removed=0,config;
 const promise=new Promise((a,b)=>{resolve=a;reject=b;});
 class Value{constructor(n){this.n=n;}setValue(n){this.n=n;}}
 const jsx=(type,props)=>({type,props});
 const Component=load('src/components/QuizReveal.tsx',{
  '../play/motion':{usePlayMotion:()=>true},
  react:{useState:fn=>[fn(),()=>{}],useEffect:fn=>{effect=fn;}},'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-native':{Animated:{Value,View:'AnimatedView',timing:(_opacity,c)=>{config=c;return{start(){started++;},stop(){stopped++;}};}},AccessibilityInfo:{isReduceMotionEnabled:()=>promise,addEventListener:(event,fn)=>{assert.equal(event,'reduceMotionChanged');listener=fn;return{remove(){removed++;}};}}}
 }).default;
 const tree=Component({children:'quiz'}),cleanup=effect();
 return{tree,resolve,reject,cleanup,change:value=>listener(value),state:()=>({started,stopped,removed,config})};
}
(async()=>{
 let f=fixture();assert.equal(f.tree.props.style.opacity.n,1);f.resolve(false);await flush();assert.equal(f.state().started,1);assert.equal(f.state().config.duration,180);assert.equal(f.state().config.useNativeDriver,true);assert.equal(f.state().config.isInteraction,false);
 f.change(true);assert.equal(f.tree.props.style.opacity.n,1);assert.ok(f.state().stopped>0);f.cleanup();assert.equal(f.state().removed,1);
 f=fixture();f.resolve(true);await flush();assert.equal(f.state().started,0);f.cleanup();
 f=fixture();f.cleanup();f.resolve(false);await flush();assert.equal(f.state().started,0,'unmounted panels cannot start animations');
 f=fixture();f.change(true);f.resolve(false);await flush();assert.equal(f.state().started,0,'latest reduced-motion event wins over delayed query');f.cleanup();
 f=fixture();f.reject(Error('unsupported'));await flush();assert.equal(f.tree.props.style.opacity.n,1);assert.equal(f.state().started,0);f.cleanup();
 console.log('Quiz reveal passed: native 180ms opacity only, reduced motion, event/query race, query failure, unmount cancellation and listener cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
