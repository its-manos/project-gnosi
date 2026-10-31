const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}) {
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,Date,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const f=path.normalize(path.join(path.dirname(file),id));return load(f+'.ts');}throw Error(id);
 }});if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;
}
const {knowledgeProfile:profile,levelProgress,dailyXP}=load('src/utils/knowledgeScoring.ts');
const {lessons}=load('src/data/lessons.ts'),{quizFingerprint}=load('src/utils/learningActivity.ts');
const lesson=lessons[0], today='2026-10-31',at=Date.parse('2026-10-22T12:00:00Z');
const event={lessonId:lesson.id,at,wasCompleted:false,questionCount:4,correctCount:2,missedQuestionIndices:[1,3],quizKey:quizFingerprint(lesson.questions)};
const p=(ids=[],events={},reviews={},history=[])=>profile(lessons,ids,events,reviews,history,today);
assert.equal(p().totalXP,0);assert.equal(p().level,1);
assert.equal(p([lesson.id]).totalXP,65,'legacy completion earns base + category, no invented accuracy');
const first=p([lesson.id],{a:event});assert.equal(first.totalXP,85);assert.equal(first.recalled,0,'lesson answers are not delayed recall');
assert.equal(p([lesson.id,lesson.id],{a:event,b:{...event,at:at+1}}).totalXP,85,'offline first completions deduplicate by lesson');
assert.equal(p([lesson.id],{a:event,b:{...event,at:at+1,wasCompleted:true,correctCount:4,missedQuestionIndices:[]}}).totalXP,85,'perfect replay cannot farm accuracy XP');
assert.equal(p([lesson.id],{a:{...event,wasCompleted:true}}).totalXP,65,'legacy replay cannot claim first-attempt bonus');
const review={sourceId:'a',questionIndex:1,week:'2026-10-26',answerIndex:lesson.questions[1].correctIndex,at:Date.parse('2026-10-28T12:00:00Z')};
const remembered=p([lesson.id],{a:event},{r:review});assert.equal(remembered.recalled,1);assert.equal(remembered.totalXP,100);
assert.equal(p([lesson.id],{a:event},{r:review,r2:{...review,week:'2026-10-26'}}).totalXP,100,'same recall across imports counts once');
assert.equal(p([lesson.id],{a:event},{r:{...review,answerIndex:(review.answerIndex+1)%4}}).recalled,0);
assert.equal(p([lesson.id],{a:event},{r:{...review,week:'2026-10-19'}}).recalled,0,'same-week answers are not delayed recall');
assert.equal(p([lesson.id],{a:{...event,quizKey:'changed'}},{r:review}).recalled,0,'changed answer keys do not imply mastery');
const daily={dateKey:today,questionIds:[],answers:{},correctCount:5,score:500};
assert.equal(p([],{}, {},[daily,daily]).challengeXP,70,'one daily reward per date');
assert.equal(dailyXP(0),20,'completion rewarded even at zero accuracy');assert.equal(dailyXP(7),90);
assert.equal(p([],{}, {},[{...daily,dateKey:'2026-11-01'}]).totalXP,0,'future records excluded');
const other=lessons.find(l=>l.categoryId!==lesson.categoryId);
assert.equal(p([lesson.id,other.id]).explorationXP,50,'new category reward once');
assert.equal(p([lesson.id]).badges.filter(b=>b.unlocked).length,1);
for(let level=1;level<=20;level++){
 const start=100*(level-1)*level,end=100*level*(level+1);
 assert.equal(levelProgress(start).level,level);assert.equal(levelProgress(end-1).level,level);assert.equal(levelProgress(end).level,level+1);
 assert.equal(levelProgress(start).remaining,end-start);
}
assert.equal(p([lesson.id],JSON.parse(JSON.stringify({a:event})),JSON.parse(JSON.stringify({r:review}))).totalXP,remembered.totalXP,'restart/import yields identical rewards');
// Render the actual card and verify disclosure, loading, compact and accessibility.
let expanded=false,ready=true;
const jsx=(type,props)=>({type,props});
const Card=load('src/components/KnowledgeProgress.tsx',{
 react:{useState:()=>[expanded,v=>{expanded=typeof v==='function'?v(expanded):v;}]},
 'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x}},
 '../hooks/useKnowledgeProfile':{useKnowledgeProfile:()=>({profile:remembered,ready})}
}).default;
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
let tree=Card({});assert.ok(nodes(tree).some(n=>n.props?.accessibilityRole==='progressbar'));
nodes(tree).find(n=>n.type==='Pressable').props.onPress();tree=Card({});assert.equal(expanded,true);
assert.ok(nodes(tree).find(n=>n.type==='Pressable').props.accessibilityState.expanded);
assert.equal(nodes(Card({compact:true})).filter(n=>n.type==='Pressable').length,0);
ready=false;assert.equal(nodes(Card({})).filter(n=>n.props?.accessibilityRole==='progressbar').length,0);
console.log('Knowledge scoring passed: levels, legacy progress, first-attempt accuracy, zero-score participation, offline/import/replay deduplication, delayed recall, changed keys, daily rewards, exploration and card states.');
const data=load('src/data/questions.ts');
const challenge=data.questions.slice(0,7);
const Screen=load('src/screens/DailyChallengeScreen.tsx',{
 react:{useState:init=>[init,()=>{}],useRef:()=>({current:null})},
 'react/jsx-runtime':{jsx,jsxs:jsx},
 'react-native':{View:'View',Text:'Text',ScrollView:'ScrollView',Pressable:'Pressable',ActivityIndicator:'Spinner',Linking:{openURL:async()=>{}},StyleSheet:{create:x=>x}},
 '../hooks/useDailyChallenge':{useDailyChallenge:()=>({record:{dateKey:today,completed:true,answers:Object.fromEntries(challenge.map((q,i)=>[String(i),q.correctIndex]))},challengeQuestions:challenge,currentQuestion:null,correctCount:5,isLoading:false,reviewAvailable:true})},
 ...Object.fromEntries(['KnowledgeProgress','ActionButton','AnswerOption','AppHeader','ProgressBar','DailyMistakeReview','ReportContentButton'].map(n=>['../components/'+n,{__esModule:true,default:n}]))
}).default;
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
const result=Screen({preferences:{topicIds:[],difficulty:'medium'},preferencesLoaded:true,onHome(){},onOpenPreferences(){}});
assert.ok(text(result).includes('500 / 700'),'daily points remain unchanged');
assert.ok(text(result).includes('XP ημέρας: 70 XP'),'daily XP is distinct from quiz points');
assert.equal(nodes(result).filter(n=>n.type==='KnowledgeProgress'&&n.props.compact).length,1);
console.log('Daily result integration passed: separate points/XP and one compact progress card.');
