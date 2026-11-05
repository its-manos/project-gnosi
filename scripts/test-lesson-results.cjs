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
const native=Object.fromEntries(['View','Text','Pressable','ScrollView','FlatList','TextInput'].map(n=>[n,n]));native.StyleSheet={create:x=>x};native.Keyboard={dismiss(){}};
const componentStubs=['KnowledgeProgress','ActionButton','AppHeader','LessonResultChart','ReportContentButton','LessonCard','LessonCover',
 'AtlasCard','ProfileSectionHeader','ProgressGradientBackground','ProgressTrack'];
const stubs={react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':native,
 ...Object.fromEntries(componentStubs.map(n=>['../components/'+n,{__esModule:true,default:n,profileSectionLayout:{horizontal:18,top:8,below:13}}]))};
const {lessons,categories,subcategories}=load('src/data/lessons.ts');
const {getSubcategoryPath}=load('src/utils/lessonPath.ts');
const Screen=load('src/screens/ResultsScreen.tsx',stubs).default;
const [lesson,next,locked]=getSubcategoryPath(lessons,'ancient-greece').slice(3,6);
assert.deepEqual([lesson.id,next.id,locked.id],['greek-chronology','greek-geography-seas','aegean-bronze-age']);
assert.equal(lesson.questions.length,4,'results fixture requires an actual four-question lesson');
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.props?.children):'';
const action=(tree,label)=>nodes(tree).find(n=>n.type==='ActionButton'&&n.props.label===label);
const named=(tree,id)=>nodes(tree).find(n=>n.props?.testID===id);
const virtualCards=tree=>{const list=nodes(tree).find(n=>n.type==='FlatList');assert.ok(list,'expected a virtualized lesson list');return list.props.data.flatMap((item,index)=>nodes(list.props.renderItem({item,index})).filter(n=>n.type==='LessonCard'));};
const render=(component,props)=>{cursor=0;return component(props);};
let home=0,drill=0,replay=0,weekly=0,browse=0;const opened=[];
const props={lesson,score:4,nextLesson:next,pathProgress:{title:'Αρχαία Ελλάδα',completed:1,total:4},onHome:()=>home++,onReadAgain:()=>replay++,onReviewMistakes:()=>drill++,onWeeklyReview:()=>weekly++,onOpenLesson:id=>opened.push(id),onBrowse:()=>browse++,lessonScores:{best:4,mastered:4,total:4,hasDetails:true},review:{status:'perfect',indices:[],result:{questionCount:4,correctCount:4}}};
let tree=render(Screen,props);
assert.ok(text(tree).includes('Τα πέτυχες όλα!'));
assert.ok(named(tree,'lesson-results-screen')&&named(tree,'lesson-result-hero'));
assert.ok(nodes(tree).some(n=>n.type==='ProfileSectionHeader'),'result shares fixed Midnight Atlas header');
assert.ok(nodes(tree).some(n=>n.type==='ProgressGradientBackground'));
assert.ok(!nodes(tree).some(n=>n.type==='LessonResultChart'),'oversized score donut removed');
assert.ok(!nodes(tree).some(n=>n.type==='KnowledgeProgress'),'XP detail card stays out of main result');
assert.ok(!nodes(tree).some(n=>n.type==='ReportContentButton'),'secondary details are collapsed');
const header=nodes(tree).find(n=>n.type==='ProfileSectionHeader');
header.props.onAction();assert.equal(home,1);
named(tree,'lesson-next-action').props.onPress();assert.deepEqual(opened,[next.id]);
assert.equal(named(tree,'lesson-result-score').type,'AtlasCard');
assert.ok(named(tree,'lesson-path-progress'),'compact path progress survives');
assert.ok(!action(tree,'Επιστροφή στην αρχική'),'no duplicate Home CTA');
assert.ok(!nodes(tree).some(n=>n.type==='ActionButton'),'completed result has a single next-lesson destination');
named(tree,'lesson-result-details').props.onPress();tree=render(Screen,props);
assert.ok(nodes(tree).some(n=>n.type==='KnowledgeProgress'));
action(tree,'Προαιρετική επανάληψη μαθήματος').props.onPress();assert.equal(replay,1);
action(tree,'Νέες δοκιμές κατανόησης').props.onPress();assert.equal(weekly,1);
assert.ok(nodes(tree).some(n=>n.type==='ReportContentButton'),'reporting remains available');
for(let score=0;score<=4;score++){
 slots=[];const p={...props,score,review:score===4?props.review:{status:'available',indices:Array.from({length:4-score},(_,i)=>i),result:{questionCount:4,correctCount:score}}};tree=render(Screen,p);
 const card=named(tree,'lesson-result-score');assert.ok(card);
 assert.ok(nodes(card).some(n=>n.props?.accessibilityRole==='progressbar'),'known result has accessible accuracy');
 const scoreRow=nodes(card).find(n=>n.type==='View'&&n.props?.accessibilityLabel?.includes('σωστές απαντήσεις'));
 assert.ok(scoreRow.props.accessibilityLabel.includes(score+' από 4'));
 assert.ok(named(tree,'lesson-next-action'));
 assert.equal(text(tree).includes('Τα πέτυχες όλα!'),score===4);
 if(score<3){
  const practice=action(tree,'Εξάσκηση στα λάθη ('+(4-score)+') →');assert.ok(practice,'mistake practice is the primary action on low scores');
  assert.ok(!practice.props.secondary);practice.props.onPress();
 }else{
  assert.ok(!action(tree,'Εξάσκηση στα λάθη ('+(4-score)+') →'));
 }
}
assert.equal(drill,3);
slots=[];tree=render(Screen,{...props,score:1,returning:true,review:{...props.review,result:{questionCount:4,correctCount:1}}});
assert.ok(nodes(named(tree,'lesson-result-score')).some(n=>n.props?.accessibilityLabel?.includes('4 από 4')),'returning uses best not latest');
assert.ok(!text(named(tree,'lesson-result-score')).includes('XP απονομής'),'returning does not imply a new XP reward');
slots=[];tree=render(Screen,{...props,returning:true,lessonScores:{best:null,mastered:0,total:4,hasDetails:false},review:{status:'changed',indices:[],result:{correctCount:4,questionCount:4}}});
assert.ok(text(tree).includes('δεν υπάρχει συγκρίσιμος αναλυτικός βαθμός'),'changed historical quiz is not fabricated');
assert.ok(!nodes(named(tree,'lesson-result-score')).some(n=>n.props?.accessibilityRole==='progressbar'));
slots=[];tree=render(Screen,{...props,nextLesson:null,pathProgress:{title:'Μυθολογία',completed:1,total:1}});
assert.ok(!named(tree,'lesson-next-action'));assert.ok(text(tree).includes('Ολοκλήρωσες αυτή τη διαδρομή!'));
action(tree,'Διάλεξε άλλη θεματική →').props.onPress();assert.equal(browse,1);
slots=[];tree=render(Screen,{...props,score:1,nextLesson:null,pathProgress:{title:'Μυθολογία',completed:1,total:1},review:{status:'available',indices:[0,1,2],result:{questionCount:4,correctCount:1}}});
assert.ok(action(tree,'Εξάσκηση στα λάθη (3) →'));
assert.ok(action(tree,'Διάλεξε άλλη θεματική →').props.secondary,'browse stays secondary when mistake practice is primary');
// Exercise the actual chart output, including zero/full results and screen-reader text.
const Chart=load('src/components/LessonResultChart.tsx',{...stubs,'react-native-svg':{__esModule:true,default:'Svg',Circle:'Circle'}}).default;
for(const correct of [0,1,3,4]){const graph=Chart({correct,total:4,label:'Αυτή η προσπάθεια'});assert.ok(graph.props.accessibilityLabel.includes(`${correct} από 4`));for(const circle of nodes(graph).filter(n=>n.type==='Circle'&&n.props.strokeDasharray))assert.ok(!circle.props.strokeDasharray.includes('NaN'));assert.equal(nodes(graph).filter(n=>n.type==='Circle').length,correct?2:1);}
// Full-catalogue access rules also apply when only a later lesson was bookmarked.
const Saved=load('src/screens/SavedLessonsScreen.tsx',stubs).default;
const base={lessons:[locked],catalogue:lessons,completedLessonIds:[],inProgressLessonIds:[],progressLoaded:true,onBack(){},onOpenLesson(){},onRemoveSavedLesson(){}};
tree=Saved(base);assert.ok(virtualCards(tree).find(n=>n.type==='LessonCard').props.lockedReason.includes(next.title));
tree=Saved({...base,inProgressLessonIds:[locked.id]});assert.equal(virtualCards(tree).find(n=>n.type==='LessonCard').props.lockedReason,undefined);
const Sub=load('src/screens/SubcategoryScreen.tsx',stubs).default;
tree=Sub({...base,lessons:[locked,next,lesson],subcategory:subcategories.find(s=>s.id==='ancient-greece'),category:categories[0]});
const cards=virtualCards(tree);assert.deepEqual(cards.map(c=>c.props.lesson.id),[lesson.id,next.id,locked.id]);assert.equal(cards[0].props.lockedReason,undefined);assert.ok(cards[1].props.lockedReason);
const Card=load('src/components/LessonCard.tsx',{...stubs,'./LessonCover':{__esModule:true,default:'Cover'}}).default;
const card=Card({lesson:locked,onPress(){},lockedReason:'Ολοκλήρωσε πρώτα το προηγούμενο μάθημα'});assert.equal(card.props.disabled,true);assert.equal(card.props.accessibilityState.disabled,true);
console.log('Lesson result UI passed: Midnight Atlas hierarchy, accessible compact score, single next action, mistake-first logic, XP details, old and changed scores, path completion, optional actions, and locked cards. Native views mocked.');

