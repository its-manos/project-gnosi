/* global __dirname */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file,overrides={}){
 if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Intl,Date,require:id=>{
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const f=path.normalize(path.join(path.dirname(file),id));return load(fs.existsSync(path.join(root,f+'.ts'))?f+'.ts':f+'.tsx');}throw Error(id);
 }});if(!Object.keys(overrides).length)cache.set(file,m.exports);return m.exports;
}
let slots=[],cursor=0;
const jsx=(type,props)=>({type,props});
const react={useMemo:fn=>fn(),useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];}};
const native=Object.fromEntries(['View','Text','Pressable','ScrollView','TextInput'].map(n=>[n,n]));native.StyleSheet={create:x=>x};native.Keyboard={dismiss(){}};
const stubs={react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':native,...Object.fromEntries(['KnowledgeProgress','ActionButton','AppHeader','LessonResultChart','ReportContentButton','LessonCard','LessonCover'].map(n=>['../components/'+n,{__esModule:true,default:n}]))};
const {lessons,categories,subcategories}=load('src/data/lessons.ts');
const {getSubcategoryPath}=load('src/utils/lessonPath.ts');
const Screen=load('src/screens/ResultsScreen.tsx',stubs).default;
const [lesson,next,locked]=getSubcategoryPath(lessons,'ancient-greece');
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.props?.children):'';
const action=(tree,label)=>nodes(tree).find(n=>n.type==='ActionButton'&&n.props.label===label);
const render=(component,props)=>{cursor=0;return component(props);};
let home=0,drill=0,replay=0,weekly=0,browse=0;const opened=[];
const props={lesson,score:4,nextLesson:next,pathProgress:{title:'Αρχαία Ελλάδα',completed:1,total:4},onHome:()=>home++,onReadAgain:()=>replay++,onReviewMistakes:()=>drill++,onWeeklyReview:()=>weekly++,onOpenLesson:id=>opened.push(id),onBrowse:()=>browse++,lessonScores:{best:4,mastered:4,total:4,hasDetails:true},review:{status:'perfect',indices:[],result:{questionCount:4,correctCount:4}}};
let tree=render(Screen,props);
assert.ok(text(tree).includes('Τα πέτυχες όλα!'));assert.ok(!action(tree,'Πλήρης επανάληψη μαθήματος'));
assert.ok(!nodes(tree).some(n=>n.type==='ReportContentButton'),'secondary details are collapsed');
assert.ok(text(tree).split(/\s+/).length<100,'primary result stays concise');
action(tree,'Επόμενο μάθημα').props.onPress();assert.deepEqual(opened,[next.id]);
action(tree,'Επιστροφή στην αρχική').props.onPress();assert.equal(home,1);
assert.ok(!action(tree,'Επόμενο μάθημα').props.secondary,'next is primary on success');
assert.ok(nodes(tree).findIndex(n=>n.props?.label==='Επόμενο μάθημα')<nodes(tree).findIndex(n=>n.props?.accessibilityRole==='progressbar'),'actions precede supplementary path chart');
nodes(tree).find(n=>n.type==='Pressable'&&n.props.accessibilityState?.expanded===false).props.onPress();tree=render(Screen,props);
action(tree,'Πλήρης επανάληψη μαθήματος').props.onPress();assert.equal(replay,1);action(tree,'Εβδομαδιαία επανάληψη').props.onPress();assert.equal(weekly,1);
assert.ok(nodes(tree).some(n=>n.type==='ReportContentButton'),'reporting remains available');
for(let score=0;score<=4;score++){
 slots=[];const p={...props,score,review:score===4?props.review:{status:'available',indices:Array.from({length:4-score},(_,i)=>i),result:{questionCount:4,correctCount:score}}};tree=render(Screen,p);
 const chart=nodes(tree).find(n=>n.type==='LessonResultChart');assert.equal(chart.props.correct,score);assert.equal(chart.props.total,4);
 assert.ok(action(tree,'Επόμενο μάθημα'));assert.ok(action(tree,'Επιστροφή στην αρχική'));
 assert.equal(text(tree).includes('Τα πέτυχες όλα!'),score===4);
 if(score<4){const practice=action(tree,`Εξάσκηση στα λάθη (${4-score})`);assert.ok(practice);practice.props.onPress();}
 if(score<3)assert.equal(!!action(tree,`Εξάσκηση στα λάθη (${4-score})`).props.secondary,false,'practice is primary for a low score');
}
assert.equal(drill,4);
slots=[];tree=render(Screen,{...props,score:1,returning:true,review:{...props.review,result:{questionCount:4,correctCount:1}}});assert.equal(nodes(tree).find(n=>n.type==='LessonResultChart').props.correct,4,'returning uses best, not latest');
slots=[];tree=render(Screen,{...props,returning:true,lessonScores:{best:null,mastered:0,total:4,hasDetails:false},review:{status:'changed',indices:[],result:{correctCount:4,questionCount:4}}});assert.ok(!nodes(tree).some(n=>n.type==='LessonResultChart'),'changed historical quiz is not displayed as a current result');
slots=[];tree=render(Screen,{...props,nextLesson:null,pathProgress:{title:'Μυθολογία',completed:1,total:1}});assert.ok(!action(tree,'Επόμενο μάθημα'));assert.ok(text(tree).includes('Ολοκλήρωσες αυτή τη διαδρομή!'));
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Διάλεξε άλλη θεματική')).props.onPress();assert.equal(browse,1);
// Exercise the actual chart output, including zero/full results and screen-reader text.
const Chart=load('src/components/LessonResultChart.tsx',{...stubs,'react-native-svg':{__esModule:true,default:'Svg',Circle:'Circle'}}).default;
for(const correct of [0,1,3,4]){const graph=Chart({correct,total:4,label:'Αυτή η προσπάθεια'});assert.ok(graph.props.accessibilityLabel.includes(`${correct} από 4`));for(const circle of nodes(graph).filter(n=>n.type==='Circle'&&n.props.strokeDasharray))assert.ok(!circle.props.strokeDasharray.includes('NaN'));assert.equal(nodes(graph).filter(n=>n.type==='Circle').length,correct?2:1);}
// Full-catalogue access rules also apply when only a later lesson was bookmarked.
const Saved=load('src/screens/SavedLessonsScreen.tsx',stubs).default;
const base={lessons:[locked],catalogue:lessons,completedLessonIds:[],inProgressLessonIds:[],progressLoaded:true,onBack(){},onOpenLesson(){},onRemoveSavedLesson(){}};
tree=Saved(base);assert.ok(nodes(tree).find(n=>n.type==='LessonCard').props.lockedReason.includes(next.title));
tree=Saved({...base,inProgressLessonIds:[locked.id]});assert.equal(nodes(tree).find(n=>n.type==='LessonCard').props.lockedReason,undefined);
const Sub=load('src/screens/SubcategoryScreen.tsx',stubs).default;
tree=Sub({...base,lessons:[locked,next,lesson],subcategory:subcategories.find(s=>s.id==='ancient-greece'),category:categories[0]});
const cards=nodes(tree).filter(n=>n.type==='LessonCard');assert.deepEqual(cards.map(c=>c.props.lesson.id),[lesson.id,next.id,locked.id]);assert.equal(cards[0].props.lockedReason,undefined);assert.ok(cards[1].props.lockedReason);
const Card=load('src/components/LessonCard.tsx',{...stubs,'./LessonCover':{__esModule:true,default:'Cover'}}).default;
const card=Card({lesson:locked,onPress(){},lockedReason:'Ολοκλήρωσε πρώτα το προηγούμενο μάθημα'});assert.equal(card.props.disabled,true);assert.equal(card.props.accessibilityState.disabled,true);
console.log('Lesson result UI passed: brief copy, exact score chart, success/low-score priorities, next/home callbacks, persistent mistake practice, collapsed replay/weekly/report options, best-vs-latest, changed/legacy results, final lesson and locked saved/subcategory cards. Native views mocked.');

assert.equal(nodes(render(Screen,props)).filter(n=>n.type==='KnowledgeProgress').length,1,'exactly one XP card on the result screen');
