const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{load}=require('./helpers/load-typescript.cjs');
const {questions}=load('src/data/questions.ts'),{lessons}=load('src/data/lessons.ts'),shared=load('src/utils/sharedDailyChallenge.ts'),results=load('src/utils/dailyResults.ts');
const jsx=(type,props)=>({type,props}),nodes=t=>t&&typeof t==='object'?[t,...[t.props?.children].flat(Infinity).flatMap(nodes)]:[];
const text=t=>typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):'';
let slots=[],cursor=0,next=0,homes=0,opened=[];
const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef:initial=>{const i=cursor++;return slots[i]??={current:initial};},useMemo:factory=>factory()};
const native={View:'View',Text:'Text',ScrollView:'ScrollView',Pressable:'Pressable',ActivityIndicator:'Spinner',Linking:{openURL:async()=>{}},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:390,height:844,fontScale:1})};
const stubs=Object.fromEntries(['QuizReveal','KnowledgeProgress','DailyAnswerReview','DailyMistakeReview',
  'ActionButton','AnswerOption','ProfileSectionHeader','DailyMissionMap','DailyJourneyTrack','ReportContentButton',
  'SingleChoiceQuestionCard','ProgressGradientBackground','QuestionStageFooter']
  .map(n=>['../components/'+n,{__esModule:true,default:n}]));
const record={...shared.createSharedDailyRecord('2026-10-31'),currentIndex:6,completed:true};
record.answers=Object.fromEntries(record.questionIds.map((id,i)=>{const q=questions.find(q=>q.id===id);return[i,[2,4].includes(i)?(q.correctIndex+1)%4:q.correctIndex];}));
const details=results.createDailyResultDetails(record,questions),frozen=JSON.stringify(record);
let challenge={record,resultDetails:details,isLoading:false,currentQuestion:null,selectedAnswer:null,correctCount:5,rewardXP:143,questionsCompatible:true,rewardSummary:{combo:2,highestCombo:2,rows:[]},nextQuestion:async()=>{next++;},answerQuestion:async()=>{},startChallenge:async()=>{}};
const Screen=load('src/screens/DailyChallengeScreen.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},
  ...stubs,
  '../components/ProfileSectionHeader':{__esModule:true,default:'ProfileSectionHeader',profileSectionLayout:{horizontal:18,top:8,below:13}},
  '../hooks/useAdaptiveQuestionScroll':{useAdaptiveQuestionScroll:()=>({scrollEnabled:false,onLayout:()=>{},onContentSizeChange:()=>{}})},
  '../hooks/useQuestionStageAction':{useQuestionStageAction:()=>({action:null,onActionChange:()=>{}})},
  '../hooks/useDailyChallenge':{useDailyChallenge:()=>challenge},
  }).default;
const props={onHome(){homes++;},onOpenPreferences(){},onOpenLesson:id=>opened.push(id),preferences:{topicIds:['history','science','culture'],difficulty:'hard'},preferencesLoaded:true};
const render=()=>{cursor=0;return Screen(props);};const action=(t,label)=>nodes(t).find(n=>n.type==='ActionButton'&&n.props.label===label);
let tree=render();assert.ok(text(tree).includes('5 / 7'));assert.ok(text(tree).includes('71%'));
assert.ok(text(tree).includes('143'));assert.ok(text(tree).includes('XP ημέρας'));
assert.ok(text(tree).includes('Καλύτερο σερί'));assert.ok(text(tree).includes('Η ΘΕΜΑΤΙΚΗ ΠΟΥ ΞΕΧΩΡΙΣΕΣ'));
const bestTopic=results.dailyResultAnalysis(record,questions,5,details).strongest;
assert.ok(bestTopic,'the frozen test result has a distinct strongest topic');
assert.ok(text(tree).includes(`Σωστές απαντήσεις: ${bestTopic.correct} από ${bestTopic.total}`),
  'the topic card explains that its score refers only to this topic');
assert.ok(!text(tree).includes('ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ ΣΗΜΕΡΑ'),
  'avoid suggesting a personal record from a single quiz');
assert.equal(nodes(tree).filter(n=>n.type==='KnowledgeProgress').length,0,'daily results avoid duplicating global knowledge progress');
assert.ok(!text(tree).includes('500 / 700'),'results show one clear score, not a redundant points ratio');
const finishedTrack=nodes(tree).find(n=>n.type==='DailyJourneyTrack');
assert.equal(finishedTrack.props.mode,'result','results show the finished seven-stop route');
assert.equal(finishedTrack.props.correctMask.filter(Boolean).length,5,'route uses frozen scored answers');
assert.equal(finishedTrack.props.correctMask.filter(v=>v===false).length,2,'route distinguishes the two missed stops');
assert.ok(!action(tree,'Επιστροφή στην αρχική'),'fixed shared header replaces duplicate home action');
assert.equal(nodes(tree).find(n=>n.type==='ProfileSectionHeader').props.title,'Αποτέλεσμα');
assert.equal(nodes(tree).filter(n=>n.type==='ActionButton').length,1,
  'results have one prominent primary CTA, with review and lesson actions visually secondary');
const recommend=nodes(tree).find(n=>n.props?.testID==='daily-recommendation');
assert.ok(recommend&&recommend.type==='Pressable','recommended lesson remains a single accessible tap target');
assert.match(recommend.props.accessibilityLabel,/Άνοιξε το μάθημα:/);
recommend.props.onPress();assert.ok(lessons.some(l=>l.id===opened[0]));
assert.equal(nodes(recommend).filter(n=>n.type==='ActionButton').length,0,'no nested redundant lesson CTA');
assert.equal(nodes(tree).filter(n=>n.props?.testID==='daily-mistake-action').length,1,
  'mistake practice is a compact but independent action');
action(tree,'Δες όλες τις απαντήσεις →').props.onPress();tree=render();let review=nodes(tree).find(n=>n.type==='DailyAnswerReview');assert.equal(review.props.rows.length,7);assert.equal(review.props.rows.filter(r=>r.correct===false).length,2);
const Review=load('src/components/DailyAnswerReview.tsx',{react,'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,'./ActionButton':{__esModule:true,default:'ActionButton'},'./SourceLink':{__esModule:true,default:'SourceLink'},'./ReportContentButton':{__esModule:true,default:'ReportContentButton'}}).default;
const reviewed=Review(review.props);assert.equal(nodes(reviewed).filter(n=>n.type==='SourceLink').length,7);assert.equal(nodes(reviewed).filter(n=>n.type==='ReportContentButton').length,7);
for(const q of record.questionIds.map(id=>questions.find(q=>q.id===id)))assert.ok(text(reviewed).includes(q.explanation));
review.props.onDone();tree=render();
const practice=nodes(tree).find(n=>n.props?.testID==='daily-mistake-action');
assert.ok(practice.props.accessibilityRole==='button');
practice.props.onPress();tree=render();const drill=nodes(tree).find(n=>n.type==='DailyMistakeReview');assert.equal(drill.props.questions.length,2);drill.props.onDone();tree=render();assert.equal(JSON.stringify(record),frozen,'answer review/practice do not mutate persisted quiz/rewards');
challenge={...challenge,resultDetails:undefined,record:{...record,selectionVersion:undefined,questionVersions:undefined}};tree=render();assert.ok(text(tree).includes('Δεν υπάρχει αποθηκευμένη ανάλυση σερί'));assert.ok(!text(tree).includes('Η ΘΕΜΑΤΙΚΗ ΠΟΥ ΞΕΧΩΡΙΣΕΣ'),'legacy results do not fabricate a category award');
assert.ok(nodes(tree).find(n=>n.type==='DailyJourneyTrack').props.correctMask.every(value=>value===null),
  'legacy results do not fabricate correctness for individual stops');
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
assert.equal(pageHeader.props.title,'Ημερήσιο quiz');
assert.equal(pageHeader.props.title,'Ημερήσιο quiz');
pageHeader.props.onAction();assert.equal(homes,1);
const active={...shared.createSharedDailyRecord('2026-11-01'),answers:{}};const first=questions.find(q=>q.id===active.questionIds[0]);active.answers[0]=first.correctIndex;
challenge={...challenge,record:active,currentQuestion:first,selectedAnswer:first.correctIndex,correctCount:1,rewardSummary:{combo:1,highestCombo:1,rows:[{eligible:true,comboXP:0}]}};tree=render();assert.equal(nodes(tree).find(n=>n.type==='SingleChoiceQuestionCard').props.answer,first.correctIndex,
  'answered choice stays parent-owned and locked');
assert.equal(nodes(tree).find(n=>n.type==='SingleChoiceQuestionCard').props.onActionChange !== undefined,true,
  'daily choice registers its confirmation with the fixed footer');
const questionTrack=nodes(tree).find(n=>n.type==='DailyJourneyTrack');
assert.equal(questionTrack.props.mode,'question');
assert.equal(questionTrack.props.answeredCount,1);
assert.equal(questionTrack.props.currentIndex,0);
assert.equal(nodes(tree).filter(n=>n.type==='ProgressBar').length,0,'route replaces the old progress bar');
assert.ok(text(tree).includes('ΕΡΩΤΗΣΗ 01 / 07')===false,'question card owns the question number; route owns progress');
assert.ok(!text(tree).includes('Απαντημένες:'),'stage no longer duplicates the progress indicator');
assert.equal(nodes(tree).find(n=>n.type==='ProfileSectionHeader').props.title,'Ημερήσιο quiz');
const footer=nodes(tree).find(n=>n.type==='QuestionStageFooter');
assert.equal(footer.props.action.label,'Επόμενη ερώτηση →',
  'answered daily question keeps Next visible outside the ScrollView');
footer.props.action.onPress();assert.equal(next,1);
// The journey component remains passive and accurately maps current/legacy completion.
const Journey=load('src/components/DailyJourneyTrack.tsx',{
  react:{memo:fn=>fn},'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,
}).default;
const stageJourney=Journey({mode:'question',answeredCount:1,currentIndex:1,shared:true});
assert.equal(nodes(stageJourney).filter(n=>/^daily-journey-stop-/.test(n.props?.testID??'')).length,7);
assert.equal(nodes(stageJourney).find(n=>n.props?.accessibilityRole==='progressbar').props.accessibilityValue.now,1);
assert.equal(nodes(stageJourney).find(n=>n.props?.accessibilityRole==='progressbar').props.accessibilityLabel,
  'Απαντημένες: 1 από 7 ερωτήσεις.');
const resultJourney=Journey({mode:'result',correctMask:[true,true,false,true,false,true,true],shared:true});
assert.equal(nodes(resultJourney).find(n=>n.props?.accessibilityRole==='progressbar').props.accessibilityValue.now,7);
assert.equal(nodes(resultJourney).find(n=>n.props?.accessibilityRole==='progressbar').props.accessibilityLabel,
  'Αποτελέσματα: 5 σωστές, 2 λανθασμένες απαντήσεις.');
assert.ok(text(resultJourney).includes('✓')&&text(resultJourney).includes('×'),'frozen result shows both outcomes');
const legacyJourney=Journey({mode:'result',correctMask:Array(7).fill(null),shared:false});
assert.ok(!text(legacyJourney).includes('✓')&&!text(legacyJourney).includes('×'),'older results stay neutral when answer keys are unknown');
assert.equal(nodes(legacyJourney).find(n=>n.props?.accessibilityRole==='progressbar').props.accessibilityLabel,
  'Η διαδρομή ολοκληρώθηκε. Δεν υπάρχουν αναλυτικά αποτελέσματα για κάθε ερώτηση.',
  'screen reader must not infer correctness for legacy attempts');
// Preview the exact intro after today's attempt has already started. This is read-only.
let previewContinues=0,previewCloses=0,liveStarts=0;
challenge={...challenge,startChallenge:async()=>{liveStarts++;}};
const savedStarted=JSON.stringify(challenge.record);
const renderPreview=()=>{cursor=0;return Screen({...props,previewIntro:true,
  onHome:()=>{previewCloses++;},onPreviewContinue:()=>{previewContinues++;}});};
tree=renderPreview();
assert.equal(nodes(tree).filter(n=>n.props?.testID==='daily-intro').length,1,
  'the intro preview takes precedence over an in-progress daily attempt');
assert.equal(nodes(tree).filter(n=>n.type==='DailyMissionMap').length,1,
  'preview shares the real seven-stop intro component');
assert.equal(nodes(tree).filter(n=>n.type==='SingleChoiceQuestionCard').length,0,
  'preview does not display the saved live question');
assert.equal(nodes(tree).filter(n=>n.type==='QuestionStageFooter').length,0,
  'preview cannot submit a live quiz answer');
assert.equal(nodes(tree).find(n=>n.type==='ProfileSectionHeader').props.actionLabel,'‹ Εργαλεία');
action(tree,'Συνέχισε την πρόκληση →').props.onPress();
assert.equal(previewContinues,1,'preview CTA hands control to the real quiz');
assert.equal(liveStarts,0,'preview CTA does not start or reset a daily attempt');
nodes(tree).find(n=>n.type==='ProfileSectionHeader').props.onAction();
assert.equal(previewCloses,1,'preview returns to developer settings');
assert.equal(JSON.stringify(challenge.record),savedStarted,'preview does not mutate stored answers');
const savedCompleted=JSON.stringify(record);
challenge={...challenge,record,currentQuestion:null,selectedAnswer:null,correctCount:5};
tree=renderPreview();
assert.equal(nodes(tree).filter(n=>n.props?.testID==='daily-intro').length,1,
  'preview remains available after all seven answers are completed');
assert.equal(JSON.stringify(challenge.record),savedCompleted);
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
assert.match(navigationSource,/!isDevQuizPreviewOpen && !isDevDailyIntroPreviewOpen && app\.screen !== "quiz"/,
  'both developer previews hide bottom tabs');
assert.match(previewSource,/backLabel="ΕΡΓΑΛΕΙΑ"/,'pilot returns to dev settings');
assert.match(devSource,/onPress=\{onOpenDailyIntroPreview\}/,'dev settings expose intro preview');
assert.match(settingsSource,/if \(__DEV__ && dailyIntroPreview\)/,'intro preview is dev-only');
assert.match(settingsSource,/<DailyChallengeScreen previewIntro/,'settings reuse real intro screen, not a copy');
assert.match(navigationSource,/if \(isDevDailyIntroPreviewOpen\) \{ setIsDevDailyIntroPreviewOpen\(false\); return true; \}/,
  'Android Back exits daily intro preview before settings');
assert.match(navigationSource,/setIsDevDailyIntroPreviewOpen\(false\);/,
  'intro preview navigation can restore settings');
console.log('Daily Atlas UI passed: compact intro, single score/progress treatment, accurate XP/combo, category highlight, lesson callback, answer review/practice, legacy/revised content, rollover and locked choice footer. Native views mocked.');
