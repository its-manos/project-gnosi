const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{load}=require('./helpers/load-typescript.cjs');
const {questions}=load('src/data/questions.ts'),{lessons}=load('src/data/lessons.ts'),shared=load('src/utils/sharedDailyChallenge.ts'),results=load('src/utils/dailyResults.ts');
const jsx=(type,props)=>({type,props}),nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
let slots=[],cursor=0,next=0,homes=0,opened=[];
const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:initial=>{const i=cursor++;return slots[i]??={current:initial};}};
const native={View:'View',Text:'Text',ScrollView:'ScrollView',Pressable:'Pressable',ActivityIndicator:'Spinner',Linking:{openURL:async()=>{}},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:390,height:844,fontScale:1})};
const stubs=Object.fromEntries(['QuizReveal','KnowledgeProgress','DailyAnswerReview','DailyMistakeReview',
  'ActionButton','AnswerOption','ProfileSectionHeader','DailyMissionMap','ProgressBar','ReportContentButton',
  'SingleChoiceQuestionCard','ProgressGradientBackground','QuestionStageFooter']
  .map(n=>['../components/'+n,{__esModule:true,default:n}]));
const record={...shared.createSharedDailyRecord('2026-10-31'),currentIndex:6,completed:true};
record.answers=Object.fromEntries(record.questionIds.map((id,i)=>{const q=questions.find(q=>q.id===id);return[i,[2,4].includes(i)?(q.correctIndex+1)%4:q.correctIndex];}));
const details=results.createDailyResultDetails(record,questions),frozen=JSON.stringify(record);
let challenge={record,resultDetails:details,isLoading:false,currentQuestion:null,selectedAnswer:null,correctCount:5,rewardXP:143,questionsCompatible:true,rewardSummary:{combo:2,highestCombo:2,rows:[]},nextQuestion:async()=>{next++;},answerQuestion:async()=>{},startChallenge:async()=>{}};
const Screen=load('src/screens/DailyChallengeScreen.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},
  ...stubs,
  '../hooks/useAdaptiveQuestionScroll':{useAdaptiveQuestionScroll:()=>({scrollEnabled:false,onLayout:()=>{},onContentSizeChange:()=>{}})},
  '../hooks/useQuestionStageAction':{useQuestionStageAction:()=>({action:null,onActionChange:()=>{}})},
  '../hooks/useDailyChallenge':{useDailyChallenge:()=>challenge},
  }).default;
const props={onHome(){homes++;},onOpenPreferences(){},onOpenLesson:id=>opened.push(id),preferences:{topicIds:['history','science','culture'],difficulty:'hard'},preferencesLoaded:true};
const render=()=>{cursor=0;return Screen(props);};const action=(t,label)=>nodes(t).find(n=>n.type==='ActionButton'&&n.props.label===label);
let tree=render();assert.ok(text(tree).includes('5 / 7'));assert.ok(text(tree).includes('71%'));
assert.ok(text(tree).includes('143'));assert.ok(text(tree).includes('XP ημέρας'));
assert.ok(text(tree).includes('Καλύτερο σερί'));assert.ok(text(tree).includes('ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ ΣΗΜΕΡΑ'));
assert.equal(nodes(tree).filter(n=>n.type==='KnowledgeProgress').length,0,'daily results avoid duplicating global knowledge progress');
assert.ok(!text(tree).includes('500 / 700'),'results show one clear score, not a redundant points ratio');
action(tree,'Άνοιξε το μάθημα →').props.onPress();assert.ok(lessons.some(l=>l.id===opened[0]));
action(tree,'Δες όλες τις απαντήσεις →').props.onPress();tree=render();let review=nodes(tree).find(n=>n.type==='DailyAnswerReview');assert.equal(review.props.rows.length,7);assert.equal(review.props.rows.filter(r=>r.correct===false).length,2);
const Review=load('src/components/DailyAnswerReview.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'./ActionButton':{__esModule:true,default:'ActionButton'},'./SourceLink':{__esModule:true,default:'SourceLink'},'./ReportContentButton':{__esModule:true,default:'ReportContentButton'}}).default;
const reviewed=Review(review.props);assert.equal(nodes(reviewed).filter(n=>n.type==='SourceLink').length,7);assert.equal(nodes(reviewed).filter(n=>n.type==='ReportContentButton').length,7);
for(const q of record.questionIds.map(id=>questions.find(q=>q.id===id)))assert.ok(text(reviewed).includes(q.explanation));
review.props.onDone();tree=render();action(tree,'Επανάληψη λαθών (2) →').props.onPress();tree=render();const drill=nodes(tree).find(n=>n.type==='DailyMistakeReview');assert.equal(drill.props.questions.length,2);drill.props.onDone();tree=render();assert.equal(JSON.stringify(record),frozen,'answer review/practice do not mutate persisted quiz/rewards');
challenge={...challenge,resultDetails:undefined,record:{...record,selectionVersion:undefined,questionVersions:undefined}};tree=render();assert.ok(text(tree).includes('Δεν υπάρχει αποθηκευμένη ανάλυση σερί'));assert.ok(!text(tree).includes('ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ ΣΗΜΕΡΑ'),'legacy results do not fabricate a category award');
const oldDetails={...details,questionVersions:[...details.questionVersions]};oldDetails.questionVersions[0]='old:revision';challenge={...challenge,record,resultDetails:oldDetails};tree=render();action(tree,'Δες όλες τις απαντήσεις →').props.onPress();tree=render();review=nodes(tree).find(n=>n.type==='DailyAnswerReview');assert.equal(review.props.rows[0].question,null);assert.ok(text(Review(review.props)).includes('Η ερώτηση έχει αλλάξει'));
// Intro prioritizes the seven-question route and keeps its personalized-preferences caveat.
challenge={...challenge,record:load('src/utils/dailyChallenge.ts').emptyDailyChallengeRecord('2026-11-01'),resultDetails:undefined,correctCount:0};
tree=render();assert.ok(text(tree).includes('7 στάσεις γνώσης.'));
assert.ok(text(tree).includes('διαμορφώνουν τις προτάσεις μαθημάτων'));
assert.equal(nodes(tree).filter(n=>n.type==='DailyMissionMap').length,1,'daily intro renders native station map');
assert.equal(nodes(tree).find(n=>n.type==='DailyMissionMap').props.compact,true,'compact layout for phone dimensions');
const mission=load('src/components/DailyMissionMap.tsx',{
  react:{memo:fn=>fn},'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,
}).default({compact:true});
assert.equal(nodes(mission).filter(n=>/^daily-route-station-/.test(n.props?.testID??'')).length,7,'route always has seven stations');
for(const tier of ['2 εύκολες','3 μεσαίες','2 δύσκολες'])assert.ok(text(mission).includes(tier));
assert.ok(text(mission).includes('100 πόντοι / σωστή'));
assert.ok(!action(tree,'Όχι τώρα'),'top-left back navigation replaces the redundant close action');
assert.equal(nodes(tree).filter(n=>n.type==='QuizTypesPreviewScreen').length,0,'dev pilot no longer lives inside Daily Quiz');
assert.equal(nodes(tree).filter(n=>n.props?.testID==='daily-interests-link').length,1,'preferences use a compact accessible link');
assert.equal(nodes(tree).find(n=>n.type==='ScrollView').props.scrollEnabled,false,'normal phone intro stays non-scrollable');
// Athens rollover closes a previous day's answer review rather than presenting stale content.
challenge={...challenge,record:load('src/utils/dailyChallenge.ts').emptyDailyChallengeRecord('2026-11-01'),resultDetails:undefined,correctCount:0};tree=render();
const pageHeader=nodes(tree).find(n=>n.type==='ProfileSectionHeader');
assert.equal(pageHeader.props.eyebrow,'ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ');
assert.equal(pageHeader.props.title,'Ημερήσιο quiz');
pageHeader.props.onAction();assert.equal(homes,1);
const active={...shared.createSharedDailyRecord('2026-11-01'),answers:{}};const first=questions.find(q=>q.id===active.questionIds[0]);active.answers[0]=first.correctIndex;
challenge={...challenge,record:active,currentQuestion:first,selectedAnswer:first.correctIndex,correctCount:1,rewardSummary:{combo:1,highestCombo:1,rows:[{eligible:true,comboXP:0}]}};tree=render();assert.equal(nodes(tree).find(n=>n.type==='SingleChoiceQuestionCard').props.answer,first.correctIndex,
  'answered choice stays parent-owned and locked');
assert.equal(nodes(tree).find(n=>n.type==='SingleChoiceQuestionCard').props.onActionChange !== undefined,true,
  'daily choice registers its confirmation with the fixed footer');assert.ok(Math.abs(nodes(tree).find(n=>n.type==='ProgressBar').props.progress-100/7)<1e-10);
assert.ok(text(tree).includes('ΕΡΩΤΗΣΗ 01 / 07'),'stage displays one compact question counter');
assert.ok(!text(tree).includes('Απαντημένες:'),'stage no longer duplicates the progress indicator');
assert.equal(nodes(tree).find(n=>n.type==='ProfileSectionHeader').props.title,'Ημερήσιο quiz');
const footer=nodes(tree).find(n=>n.type==='QuestionStageFooter');
assert.equal(footer.props.action.label,'Επόμενη ερώτηση →',
  'answered daily question keeps Next visible outside the ScrollView');
footer.props.action.onPress();assert.equal(next,1);
// The dev-only question pilot belongs in Settings > Εργαλεία δοκιμών, not the learner quiz.
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const dailySource=read('src/screens/DailyChallengeScreen.tsx');
const devSource=read('src/components/LearningDevTools.tsx');
const settingsSource=read('src/screens/AccountScreen.tsx');
const navigationSource=read('src/navigation/AppNavigator.tsx');
const previewSource=read('src/screens/QuizTypesPreviewScreen.tsx');
assert.ok(!dailySource.includes('QuizTypesPreviewScreen')&&!dailySource.includes('Δοκίμασε τα νέα είδη ερωτήσεων (dev)'),'Daily Quiz never exposes dev tools');
assert.match(devSource,/onPress=\{onOpenQuestionPreview\}/,'dev section owns question pilot entry');
assert.match(settingsSource,/devPreviewOpen && onCloseDevPreview/,'settings keeps preview navigation inside mounted section');
assert.match(navigationSource,/if \(isDevQuizPreviewOpen\) \{ setIsDevQuizPreviewOpen\(false\); return true; \}/,'Android Back exits preview before settings');
assert.match(navigationSource,/!isDevQuizPreviewOpen && app\.screen !== "quiz"/,'full-screen pilot hides bottom tabs');
assert.match(previewSource,/backLabel="ΕΡΓΑΛΕΙΑ"/,'pilot returns to dev settings');
console.log('Daily Atlas UI passed: compact intro, single score/progress treatment, accurate XP/combo, category highlight, lesson callback, answer review/practice, legacy/revised content, rollover and locked choice footer. Native views mocked.');
