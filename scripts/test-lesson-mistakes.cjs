/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map(),stores=[];
function compile(file,overrides={}){
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,Date,setTimeout,clearTimeout,__DEV__:true,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const target=path.normalize(path.join(path.dirname(file),id));return compile(fs.existsSync(path.join(__dirname,'..',target+'.ts'))?target+'.ts':target+'.tsx');}
  throw Error(id);
 }});
 if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;
}
const data=compile('src/data/lessons.ts'),activity=compile('src/utils/learningActivity.ts'),reviewUtil=compile('src/utils/lessonReview.ts'),{LearningStore}=compile('src/state/LearningStore.ts');
const lesson=data.lessons[0];
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
function disk(){const map=new Map([['@gnosi/sync-device-id','phone']]);return{map,getItem:async k=>map.get(k)??null,setItem:async(k,v)=>{map.set(k,v);}};}
function harness(store){
 let slots=[],cursor=0,deps=[],effects=[];
 const react={useRef:init=>{const i=cursor++;if(!(i in slots))slots[i]={current:init};return slots[i];},useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect:(fn,d)=>{const i=cursor++;if(!deps[i]||d.some((v,j)=>v!==deps[i][j])){deps[i]=d;effects.push(fn);}}};
 const hook=compile('src/hooks/useLearningApp.ts',{react,'../data/lessons':data,'../state/LearningSession':{useLearningSession:()=>({store}),useLearningSnapshot:()=>store.getSnapshot()}}).useLearningApp;
 return()=>{cursor=0;const result=hook();const next=effects;effects=[];next.forEach(fn=>fn());return result;};
}
(async()=>{
 const storage=disk(),store=new LearningStore(null,storage);stores.push(store);await store.start();
 const render=harness(store);let app=render();app.setScreen('saved');app=render();app.openLesson(lesson.id);app=render();assert.equal(app.screen,'lesson');assert.equal(app.lessonBackScreen,'saved','reader remembers entry from saved lessons');
 for(let i=0;i<4;i++){const correct=lesson.questions[i].correctIndex;app.answerCheckpoint(i,[1,3].includes(i)?(correct+1)%4:correct,correct);app=render();}
 app.finishInlineLesson();await flush();app=render();assert.equal(app.screen,'results');assert.equal(app.score,2);assert.equal(app.review.status,'available');assert.deepEqual(plain(app.review.indices),[1,3]);
 const original=plain(store.getSnapshot().activity);assert.deepEqual(Object.values(original)[0].missedQuestionIndices,[1,3]);
 app.startMistakeReview();app=render();assert.equal(app.screen,'review');assert.deepEqual(plain(app.reviewIndices),[1,3]);
 app.answerReview((lesson.questions[1].correctIndex+1)%4);app=render();app.nextReviewQuestion();app=render();assert.equal(app.reviewIndex,0,'wrong answer cannot advance');
 app.retryReviewQuestion();app=render();assert.equal(app.reviewAnswer,null);
 app.answerReview(lesson.questions[1].correctIndex);app=render();const staleNext=app.nextReviewQuestion;staleNext();staleNext();app=render();assert.equal(app.reviewIndex,1,'duplicate Next must not skip a question');
 app.answerReview(lesson.questions[3].correctIndex);app=render();app.nextReviewQuestion();app=render();assert.equal(app.reviewIndex,2);app.endMistakeReview();app=render();assert.equal(app.screen,'results');assert.equal(app.practiceComplete,true);assert.equal(app.score,2);
 assert.deepEqual(plain(store.getSnapshot().activity),original,'focused practice never changes history or replay counts');
 assert.equal(activity.activitySummary(store.getSnapshot().activity,[lesson.id],[],'2100-01-01').questions,4,'review answers must not inflate accuracy denominator');
 const restart=new LearningStore(null,storage);stores.push(restart);await restart.start();const reopen=harness(restart);let returned=reopen();returned.openLesson(lesson.id);returned=reopen();assert.equal(returned.screen,'results');assert.equal(returned.resultMode,'returning');assert.deepEqual(plain(returned.review.indices),[1,3]);
 returned.startMistakeReview();returned=reopen();returned.endMistakeReview();returned=reopen();assert.equal(returned.practiceComplete,false,'leaving an incomplete drill must not claim mastery');
 returned.restartLesson();returned=reopen();assert.equal(returned.screen,'lesson');assert.equal(Object.keys(returned.checkpointAnswers).length,0,'full replay still starts all checkpoints');

 const key=Object.keys(original)[0],old={...original[key]};delete old.missedQuestionIndices;
 assert.equal(reviewUtil.lessonReview(lesson,{[key]:old}).status,'missing-details');
 assert.equal(reviewUtil.lessonReview(lesson,{}).status,'no-result');
 const changed={...original[key],quizKey:'q_changed'};assert.equal(reviewUtil.lessonReview(lesson,{[key]:changed}).status,'changed');
 const perfect={...original[key],correctCount:4,missedQuestionIndices:[]};assert.equal(reviewUtil.lessonReview(lesson,{[key]:perfect}).status,'perfect');
 assert.deepEqual(plain(activity.mergeCompletionEvents({[key]:old},original)),original);
 assert.deepEqual(plain(activity.mergeCompletionEvents(original,{[key]:old})),original,'old writer cannot strip details on merge');
 assert.throws(()=>activity.parseCompletionEvents({[key]:{...original[key],missedQuestionIndices:[3,1]}}));
 assert.throws(()=>activity.parseCompletionEvents({[key]:{...original[key],missedQuestionIndices:[1,1]}}));
 assert.throws(()=>activity.parseCompletionEvents({[key]:{...original[key],missedQuestionIndices:[1]}}));

 // The real screens expose separate actions and branch correctly on feedback.
 const jsx=(type,props)=>({type,props});
 let resultDetails=false;
 const natives={'../components/KnowledgeProgress':{default:'KnowledgeProgress',__esModule:true},react:{useState:()=>[resultDetails,v=>{resultDetails=typeof v==='function'?v(resultDetails):v;}]},'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{Pressable:'Pressable',ScrollView:'ScrollView',View:'View',Text:'Text',StyleSheet:{create:x=>x}},'../components/LessonResultChart':{default:'Chart',__esModule:true},'../components/ReportContentButton':{default:'ReportContentButton',__esModule:true},'../components/ActionButton':{default:'ActionButton',__esModule:true},'../components/AppHeader':{default:'AppHeader',__esModule:true},'../components/AnswerOption':{default:'AnswerOption',__esModule:true},'../components/ReadingPick':{default:'ReadingPick',__esModule:true}};
 const Results=compile('src/screens/ResultsScreen.tsx',natives).default,Drill=compile('src/screens/ReviewMistakesScreen.tsx',natives).default;
 const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
 const props={lesson,score:2,review:reviewUtil.lessonReview(lesson,original),recommendations:[],onReviewMistakes(){},onReadAgain(){},onHome(){},onOpenLesson(){},onBrowse(){}};
 let tree=Results(props);assert.ok(nodes(tree).some(n=>n.props?.label==='Εξάσκηση στα λάθη (2)'));assert.ok(!nodes(tree).some(n=>n.props?.label==='Πλήρης επανάληψη μαθήματος'));
 nodes(tree).find(n=>n.type==='Pressable'&&n.props.accessibilityState?.expanded===false).props.onPress();tree=Results(props);assert.ok(nodes(tree).some(n=>n.props?.label==='Πλήρης επανάληψη μαθήματος'),'full replay remains available under More options');resultDetails=false;
 tree=Results({...props,review:reviewUtil.lessonReview(lesson,{[key]:perfect})});assert.ok(!nodes(tree).some(n=>n.props?.label?.startsWith('Εξάσκηση στα λάθη')));
 const drillProps={lesson,indices:[1,3],index:0,selected:null,onChoose(){},onRetry(){},onNext(){},onBack(){}};
 tree=Drill(drillProps);assert.equal(nodes(tree).filter(n=>n.type==='AnswerOption').length,4);
 tree=Drill({...drillProps,selected:(lesson.questions[1].correctIndex+1)%4});assert.equal(nodes(tree).find(n=>n.props?.label==='Δοκίμασε ξανά').props.onPress,drillProps.onRetry);
 tree=Drill({...drillProps,selected:lesson.questions[1].correctIndex});assert.equal(nodes(tree).find(n=>n.props?.label==='Επόμενη ερώτηση').props.onPress,drillProps.onNext);
 tree=Drill({...drillProps,index:2});assert.equal(nodes(tree).filter(n=>n.type==='AnswerOption').length,0);
 console.log('Lesson mistake checks passed: missed-only drill, correct-before-advance, duplicate Next guard, unchanged original score/activity, restart/reopen persistence, full-replay choice, legacy/changed-quiz handling, richer-record sync merge and actual results/drill screen controls. Native views mocked.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>stores.forEach(s=>s.stop()));
