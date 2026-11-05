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
const jsx=(type,props)=>({type,props});
const react={useMemo:fn=>fn(),useState:init=>[typeof init==='function'?init():init,()=>{}]};
const native=Object.fromEntries(['View','Text','Pressable','ScrollView','FlatList','TextInput'].map(n=>[n,n]));native.StyleSheet={create:x=>x};native.Keyboard={dismiss(){}};
const componentStubs=['KnowledgeProgress','ActionButton','AppHeader','LessonResultChart','ReportContentButton','LessonCard','LessonCover',
 'AtlasCard','ProfileSectionHeader','ProgressGradientBackground','ProgressTrack'];
let profileReady=true;
let profile={level:5,earned:240,required:500,remaining:260,totalXP:1140};
const stubs={react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':native,
 '../hooks/useKnowledgeProfile':{useKnowledgeProfile:()=>({profile,ready:profileReady})},
 ...Object.fromEntries(componentStubs.map(n=>['../components/'+n,{__esModule:true,default:n,profileSectionLayout:{horizontal:18,top:8,below:13}}]))};
const {lessons}=load('src/data/lessons.ts');
const {getSubcategoryPath}=load('src/utils/lessonPath.ts');
const Screen=load('src/screens/ResultsScreen.tsx',stubs).default;
const [lesson,next,locked]=getSubcategoryPath(lessons,'ancient-greece').slice(3,6);
assert.deepEqual([lesson.id,next.id,locked.id],['greek-chronology','greek-geography-seas','aegean-bronze-age']);
assert.equal(lesson.questions.length,4,'results fixture requires an actual four-question lesson');
const nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.props?.children):'';
const named=(tree,id)=>nodes(tree).find(n=>n.props?.testID===id);
const virtualCards=tree=>{const list=nodes(tree).find(n=>n.type==='FlatList');assert.ok(list,'expected a virtualized lesson list');return list.props.data.flatMap((item,index)=>nodes(list.props.renderItem({item,index})).filter(n=>n.type==='LessonCard'));};
const render=props=>Screen(props);
let home=0,drill=0,replay=0,weekly=0,browse=0;const opened=[];
const props={lesson,score:4,earnedXP:102,highestCombo:4,nextLesson:next,
 pathProgress:{title:'Αρχαία Ελλάδα',completed:1,total:4},
 onHome:()=>home++,onReadAgain:()=>replay++,onReviewMistakes:()=>drill++,
 onWeeklyReview:()=>weekly++,onOpenLesson:id=>opened.push(id),onBrowse:()=>browse++,
 lessonScores:{best:4,mastered:4,total:4,hasDetails:true},
 review:{status:'perfect',indices:[],result:{questionCount:4,correctCount:4}}};
let tree=render(props);
assert.ok(named(tree,'lesson-results-screen'));
assert.ok(nodes(tree).some(n=>n.type==='ProgressGradientBackground'),'Midnight Atlas background');
assert.ok(!nodes(tree).some(n=>n.type==='LessonResultChart'),'large donut is gone');
assert.ok(!nodes(tree).some(n=>n.type==='KnowledgeProgress'),'no separate old XP panel');
const header=nodes(tree).find(n=>n.type==='ProfileSectionHeader');
assert.equal(header.props.title,'Αποτελέσματα');
header.props.onAction();assert.equal(home,1);
assert.ok(!named(tree,'lesson-result-details'),'no more bulky expanded information');
const nextAction=named(tree,'lesson-next-action');
assert.equal(nextAction.type,'Pressable','hero itself is a large tap target');
assert.ok(nextAction.props.accessibilityLabel.includes(next.title),'play target names the next lesson');
assert.ok(text(nextAction).includes('▶'),'decorative star is replaced with play glyph');
assert.ok(text(nextAction).includes(next.title),'next lesson title shown alongside play glyph');
nextAction.props.onPress();assert.deepEqual(opened,[next.id]);
assert.equal(nodes(tree).filter(n=>n.props?.testID==='lesson-next-action').length,1,'no competing next CTAs');
assert.equal(named(tree,'lesson-result-score').type,'AtlasCard');
const score=nodes(named(tree,'lesson-result-score'));
assert.ok(score.some(n=>n.props?.accessibilityLabel?.includes('4 από 4')),'score is accessible');
assert.ok(score.some(n=>n.props?.accessibilityRole==='progressbar'),'accuracy rail has semantics');
const progression=named(tree,'lesson-progression');
assert.ok(progression,'XP and path progression always on main screen');
assert.ok(text(progression).includes('Επίπεδο 5'));
assert.ok(text(progression).includes('240 / 500 XP'));
assert.ok(text(progression).includes('260 XP μέχρι το επόμενο επίπεδο'));
assert.ok(text(progression).includes('+102 XP'),'new reward shown in progress card rather than duplicated with accuracy');
assert.ok(named(tree,'lesson-path-progress'));
assert.equal(nodes(progression).filter(n=>n.type==='ProgressTrack').length,2,'level and path are two distinct rails');
assert.ok(nodes(progression).some(n=>n.props?.accessibilityLabel==='Πρόοδος μέχρι το επόμενο επίπεδο'));
assert.ok(nodes(tree).some(n=>n.type==='ReportContentButton'),'reporting available without disclosure');
assert.ok(named(tree,'lesson-replay-action')&&named(tree,'lesson-review-action'),'secondary actions are visible');
named(tree,'lesson-replay-action').props.onPress();assert.equal(replay,1);
named(tree,'lesson-review-action').props.onPress();assert.equal(weekly,1);
for(let value=0;value<=4;value++){
 const state={...props,score:value,review:value===4?props.review:{status:'available',
  indices:Array.from({length:4-value},(_,i)=>i),result:{questionCount:4,correctCount:value}}};
 tree=render(state);
 const chart=nodes(named(tree,'lesson-result-score'));
 const scoreRow=chart.find(n=>n.type==='View'&&n.props?.accessibilityLabel?.includes('σωστές απαντήσεις'));
 assert.ok(scoreRow.props.accessibilityLabel.includes(value+' από 4'));
 assert.ok(named(tree,'lesson-next-action'),'next lesson visible regardless of score');
 assert.equal(text(tree).includes('Τα πέτυχες όλα!'),value===4);
 if(value<4){
  const practice=named(tree,'lesson-practice-action');
  assert.ok(practice,'practice remains available, not forced as a primary CTA');
  assert.ok(practice.props.accessibilityLabel.includes(''+(4-value)));
  practice.props.onPress();
 }else assert.ok(!named(tree,'lesson-practice-action'),'do not show practice when there are no mistakes');
}
assert.equal(drill,4);
tree=render({...props,score:1,returning:true,review:{...props.review,result:{questionCount:4,correctCount:1}}});
assert.ok(nodes(named(tree,'lesson-result-score')).some(n=>n.props?.accessibilityLabel?.includes('4 από 4')),'returning uses saved best, not last');
assert.ok(!text(named(tree,'lesson-progression')).includes('+102 XP'),'do not imply fresh XP for historical attempt');
tree=render({...props,returning:true,lessonScores:{best:null,mastered:0,total:4,hasDetails:false},
 review:{status:'changed',indices:[],result:{correctCount:4,questionCount:4}}});
assert.ok(text(tree).includes('Δεν υπάρχει συγκρίσιμος παλιότερος βαθμός'));
assert.ok(!nodes(named(tree,'lesson-result-score')).some(n=>n.props?.accessibilityRole==='progressbar'),'old unverifiable result has no made-up accuracy');
tree=render({...props,score:1,earnedXP:0});
assert.ok(!text(named(tree,'lesson-progression')).includes('+102 XP'),'zero reward does not display an invented new reward');
profileReady=false;tree=render(props);
assert.ok(text(named(tree,'lesson-progression')).includes('Φόρτωση προόδου'));
assert.ok(nodes(named(tree,'lesson-progression')).some(n=>n.props?.accessibilityValue?.text==='Φόρτωση επιπέδου'));
profileReady=true;
tree=render({...props,nextLesson:null,pathProgress:{title:'Μυθολογία',completed:1,total:1}});
assert.ok(!named(tree,'lesson-next-action'));
assert.ok(named(tree,'lesson-browse-action'),'finished paths lead to exploration from same hero');
named(tree,'lesson-browse-action').props.onPress();assert.equal(browse,1);
assert.ok(text(tree).includes('Ολοκλήρωσες αυτή τη διαδρομή!'));
tree=render({...props,score:1,practiceComplete:true,review:{status:'available',indices:[0,1,2],
 result:{questionCount:4,correctCount:1}}});
assert.ok(text(tree).includes('Ολοκλήρωσες την εξάσκηση'));
assert.ok(named(tree,'lesson-practice-action'),'practice can still be repeated after completion');
// Exercise the actual chart output, including zero/full results and screen-reader text.
const Chart=load('src/components/LessonResultChart.tsx',{...stubs,'react-native-svg':{__esModule:true,default:'Svg',Circle:'Circle'}}).default;
for(const correct of [0,1,3,4]){const graph=Chart({correct,total:4,label:'Αυτή η προσπάθεια'});assert.ok(graph.props.accessibilityLabel.includes(`${correct} από 4`));for(const circle of nodes(graph).filter(n=>n.type==='Circle'&&n.props.strokeDasharray))assert.ok(!circle.props.strokeDasharray.includes('NaN'));assert.equal(nodes(graph).filter(n=>n.type==='Circle').length,correct?2:1);}
// Full-catalogue access rules also apply when only a later lesson was bookmarked.
const Saved=load('src/screens/SavedLessonsScreen.tsx',stubs).default;
const base={lessons:[locked],catalogue:lessons,completedLessonIds:[],inProgressLessonIds:[],progressLoaded:true,onBack(){},onOpenLesson(){},onRemoveSavedLesson(){}};
tree=Saved(base);assert.ok(virtualCards(tree).find(n=>n.type==='LessonCard').props.lockedReason.includes(next.title));
tree=Saved({...base,inProgressLessonIds:[locked.id]});assert.equal(virtualCards(tree).find(n=>n.type==='LessonCard').props.lockedReason,undefined);
// Adventure-path layout and unlock behavior are independently covered by test-home-layout and test-lesson-path.
const Card=load('src/components/LessonCard.tsx',{...stubs,'./LessonCover':{__esModule:true,default:'Cover'}}).default;
const card=Card({lesson:locked,onPress(){},lockedReason:'Ολοκλήρωσε πρώτα το προηγούμενο μάθημα'});assert.equal(card.props.disabled,true);assert.equal(card.props.accessibilityState.disabled,true);
console.log('Lesson results passed: accessible next-play action, visible level/XP and path progression, current/old scores, score and reward separation, low-score review access, and locked lesson cards. Native views mocked.');

