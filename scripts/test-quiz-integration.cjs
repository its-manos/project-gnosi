/* global __dirname */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}) {
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Intl,Date,console,setTimeout,clearTimeout,__DEV__:true,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.'))return load(path.normalize(path.join(path.dirname(file),id))+'.ts');
  throw Error(id);
 }});
 if(!Object.keys(overrides).length)cache.set(file,module.exports);return module.exports;
}
const {LearningStore}=load('src/state/LearningStore.ts'),{lessons}=load('src/data/lessons.ts'),{getInlineQuestionCount}=load('src/utils/lessonProgress.ts');
function harness(store) {
 let slots=[],cursor=0;
 const react={useRef:init=>{const i=cursor++;return slots[i]??={current:init};},useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect(){}};
 const useApp=load('src/hooks/useLearningApp.ts',{react,'../state/LearningSession':{useLearningSession:()=>({store}),useLearningSnapshot:()=>store.getSnapshot()}}).useLearningApp;
 return()=>{cursor=0;return useApp();};
}
const stores=[];
(async()=>{
 const map=new Map(),storage={getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{map.set(k,v);}};
 const store=new LearningStore(null,storage);stores.push(store);await store.start();
 const render=harness(store),lesson=lessons[0],q=lesson.questions[0],wrong=(q.correctIndex+1)%q.answers.length;
 let app=render();app.openLesson(lesson.id);app=render();
 app.answerCheckpoint(1,lesson.questions[1].correctIndex,lesson.questions[1].correctIndex);
 app.answerCheckpoint(0,99,q.correctIndex);
 assert.equal(Object.keys(store.getSnapshot().backup.attempts).length,0,'invalid or out-of-order answers cannot unlock a passage');
 app.answerCheckpoint(0,wrong,wrong);app.answerCheckpoint(0,q.correctIndex,q.correctIndex);
 assert.equal(store.getSnapshot().backup.attempts[lesson.id].checkpointAnswers[0],wrong,'before-render double tap preserves the first answer');
 app=render();assert.equal(app.score,0,'caller-provided correctIndex cannot determine correctness');
 await store.flushLocal();
 const reopened=new LearningStore(null,storage);stores.push(reopened);await reopened.start();const resume=harness(reopened);let resumed=resume();resumed.openLesson(lesson.id);resumed=resume();
 assert.equal(resumed.checkpointAnswers[0],wrong);assert.equal(resumed.score,0);
 for(let i=1;i<getInlineQuestionCount(lesson);i++){resumed.answerCheckpoint(i,lesson.questions[i].correctIndex,lesson.questions[i].correctIndex);resumed=resume();}
 resumed.finishInlineLesson();resumed.finishInlineLesson();await reopened.flushLocal();
 assert.equal(Object.keys(reopened.getSnapshot().activity).length,1,'completion button retry produces one persisted event');
 const event=Object.values(reopened.getSnapshot().activity)[0];assert.equal(event.correctCount,getInlineQuestionCount(lesson)-1);
 resumed=resume();resumed.startQuiz();resumed=resume();
 resumed.chooseAnswer(wrong,wrong);resumed.chooseAnswer(q.correctIndex,q.correctIndex);resumed=resume();
 assert.equal(resumed.score,0,'standalone quiz validates its own answer key');assert.equal(resumed.selectedAnswer,wrong);
 resumed.nextQuestion(999);resumed.nextQuestion(999);resumed=resume();assert.equal(resumed.questionIndex,1,'double Next and forged questionCount cannot skip questions');
 const oldChoice=resumed.chooseAnswer;
 resumed.restartLesson();resumed=resume();oldChoice(lesson.questions[1].correctIndex,lesson.questions[1].correctIndex);resumed=resume();
 assert.equal(Object.keys(resumed.checkpointAnswers).length,0,'stale callbacks after restart cannot write to the new run');
 for(const s of stores)s.stop();
 console.log('Quiz integration passed: canonical grading, invalid/out-of-order answers, before-render duplicate taps, offline interrupted lesson resume, atomic completion, standalone progression and stale restart callbacks.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
