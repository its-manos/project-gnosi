const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const {LearningStore}=load('src/state/LearningStore.ts'),{emptyDailyDocument}=load('src/utils/dailySyncDocument.ts'),{getAthensDateKey}=load('src/utils/dailyChallenge.ts');
const {buildKnowledgeModel,knowledgeById}=load('src/knowledge/model.ts'),{lessons}=load('src/data/lessons.ts');
const jsx=(type,props)=>({type,props}),nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
const native={View:'View',Text:'Text',ScrollView:'ScrollView',Pressable:'Pressable',Linking:{openURL:async()=>{}},StyleSheet:{create:x=>x}};
let slots=[],cursor=0,today=getAthensDateKey(),backs=0;
const react={useEffect:()=>{},useRef:value=>({current:value}),useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];}};
(async()=>{
 const store=new LearningStore(null,{getItem:async()=>null,setItem:async()=>{}});await store.start();const daily=emptyDailyDocument();
 const modelHook=()=>({model:buildKnowledgeModel({...store.getSnapshot().backup,...store.getSnapshot()},daily,today),today,ready:store.getSnapshot().ready});
 const session={'../state/LearningSession':{useLearningSession:()=>({store}),useLearningSnapshot:store.getSnapshot,useDailySnapshot:()=>({ready:true,doc:daily})}};
 const components=Object.fromEntries(['ActionButton','AtlasCard','ProfileSectionHeader','ProgressGradientBackground','QuestionStageFooter','QuestionStageProgress','QuizReveal','SingleChoiceQuestionCard','SyncStatus','SourceLink'].map(n=>['../components/'+n,{__esModule:true,default:n,profileSectionLayout:{horizontal:18,top:8,below:13}}]));
 const Screen=load('src/screens/KnowledgeReviewScreen.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,...session,...components,'../hooks/useKnowledgeModel':{useKnowledgeModel:modelHook}}).default;
 const render=()=>{cursor=0;return Screen({onBack:()=>backs++});},button=(tree,label)=>nodes(tree).find(n=>n.type==='ActionButton'&&n.props.label===label);
 const card=tree=>nodes(tree).find(n=>n.type==='SingleChoiceQuestionCard');
 const footer=tree=>nodes(tree).find(n=>n.type==='QuestionStageFooter')?.props.action;
 const link=(tree,label)=>nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes(label));
 let tree=render();assert.ok(text(tree).includes('Ολοκλήρωσε ένα μάθημα'));assert.equal(card(tree),undefined);
 store.complete(lessons[0].id);tree=render();button(tree,'Ξεκίνα την επανάληψη').props.onPress();tree=render();
 const first=store.getSnapshot().knowledgeSession.questionIds[0],q=knowledgeById.get(first).question;
 const choice=card(tree).props;
 assert.ok(choice.commitOnSelect&&choice.compactAnswered,'preserve one-tap commit with compact feedback');
 assert.equal(footer(tree),undefined);
 assert.equal(nodes(tree).find(n=>n.type==='QuestionStageProgress').props.current,1);
 choice.onConfirm(choice.correctIndex);tree=render();
 assert.equal(card(tree).props.answer,choice.correctIndex,'saved answer maps back to the same display order');
 assert.equal(store.getSnapshot().knowledgeSession.answers[0],q.content.correctIndex);
 assert.equal(card(tree).props.explanation,q.explanation);
 assert.ok(text(card(tree).props.feedbackExtra).includes('0/3 διαφορετικές δοκιμές'),'first dated legacy review sets baseline, not fake recall');
 assert.equal(nodes(card(tree).props.feedbackExtra).filter(n=>n.type==='SourceLink').length,0,'sources start collapsed');
 const beforeExcerpt=JSON.stringify(store.getSnapshot().backup);
 link(card(tree).props.feedbackExtra,'Σχετική ενότητα').props.onPress();tree=render();
 assert.ok(nodes(card(tree).props.feedbackExtra).some(n=>n.props.testID==='review-teaching-section'));
 assert.equal(nodes(card(tree).props.feedbackExtra).filter(n=>n.type==='SourceLink').length,q.sources.length);
 assert.equal(JSON.stringify(store.getSnapshot().backup),beforeExcerpt,'reading explanation never changes completion');
 slots=[];tree=render();
 assert.equal(card(tree).props.answer,choice.correctIndex,'reopening preserves committed feedback');
 assert.ok(footer(tree),'reopening offers the next action');
 while(!store.getSnapshot().knowledgeSession.completed){
  tree=render();if(card(tree).props.answer===undefined)card(tree).props.onConfirm(0);
  tree=render();footer(tree).onPress();
 }
 tree=render();assert.ok(text(tree).includes('+10 XP'));assert.ok(!text(tree).includes('Επόμενη επανάληψη:'));
 link(tree,'Πρόοδος εννοιών').props.onPress();tree=render();assert.ok(text(tree).includes('Επόμενη επανάληψη:'));
 footer(tree).onPress();assert.equal(backs,1);
 link(tree,'Άλλη μικρή επανάληψη').props.onPress();tree=render();
 const practice=button(tree,'Θέλω λίγη εξάσκηση');
 if(practice)practice.props.onPress();else link(tree,'Ελεύθερη εξάσκηση').props.onPress();
 tree=render();assert.ok(nodes(tree).some(n=>n.type==='ProfileSectionHeader'&&n.props.title==='Εξάσκηση'));
 const saved=store.getSnapshot().knowledgeSession,record=knowledgeById.get(saved.questionIds[0]);
 record.question.version='changed-for-test';tree=render();assert.ok(text(tree).includes('ενημερώθηκαν οι ερωτήσεις'));
 assert.equal(card(tree),undefined,'changed scored content is never silently regraded');record.question.version=saved.questionVersions[0];
 today='2099-12-31';tree=render();assert.ok(text(tree).includes('Άλλαξε η ημέρα'));today=getAthensDateKey();
 slots=[];cursor=0;
 const Mastery=load('src/components/KnowledgeMastery.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,...session,'../hooks/useKnowledgeModel':{useKnowledgeModel:modelHook},'./ActionButton':{__esModule:true,default:'ActionButton'},
  './HomeMotion':{MotionPressable:'MotionPressable'},
  './SubjectProgressTile':{__esModule:true,default:'SubjectProgressTile'},
  './LearningDetailSections':{LearningSectionHeading:'Text',SubjectInsightPanel:'View',SubjectShowAll:'Pressable'},
  './ProgressMotion':{ProgressBarFill:'ProgressBarFill'}}).default;
 tree=Mastery({onOpen:()=>backs++});assert.ok(text(tree).includes('Δεν μετρούν άρθρα'));assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='progressbar'));nodes(tree).find(n=>n.type==='ActionButton').props.onPress();assert.equal(backs,2);
 nodes(tree).find(n=>n.type==='Pressable').props.onPress();cursor=0;tree=Mastery({onOpen(){}});assert.ok(text(tree).includes('Μαθαίνεται'));
 await store.flushLocal();store.stop();console.log('Knowledge UI passed: fresh profile, due/practice launch, locked answers, explanation/source, honest baseline feedback, saved results/XP/next dates, content and midnight guards, category bars, topic disclosure and back callbacks. Native views mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
