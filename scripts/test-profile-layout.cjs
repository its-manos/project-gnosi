const assert = require("node:assert/strict"), { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === "object" ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
  : tree && typeof tree === "object" ? text(tree.props?.children) : "";

let slots = [], cursor = 0;
const react = {
  useState: init => {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof init === "function" ? init() : init;
    return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
  },
  useMemo: fn => fn(),
  useEffect() {},
};
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  ActivityIndicator: "Spinner", StyleSheet: { create: value => value },
  useWindowDimensions: () => ({ width: 390, height: 810, fontScale: 1 }),
};
const { lessons } = load("src/data/lessons.ts");
const { quizFingerprint } = load("src/utils/learningActivity.ts");
let learning = {
  ready: true, userId: null,
  backup: { completedIds: [lessons[0].id] },
  activity: {
    a: { lessonId: lessons[0].id, at: Date.parse("2026-10-22T12:00:00Z"),
      wasCompleted: false, correctCount: 2, questionCount: 4,
      quizKey: quizFingerprint(lessons[0].questions), missedQuestionIndices: [1, 3] },
  },
  weeklyReviews: {},
};
let history = [
  { dateKey: "2026-10-30", correctCount: 5, score: 500 },
  { dateKey: "2026-10-29", correctCount: 4, score: 400 },
];
let daily = { ready: true, doc: {} };
const player = {
  level: 2, earned: 120, required: 200, totalXP: 320,
  badges: [
    { id: "first", title: "Πρώτη γνώση", unlocked: true, current: 1, target: 1 },
    { id: "curious", title: "Περιέργεια", unlocked: false, current: 1, target: 3 },
  ],
  learningXP: 300, challengeXP: 20, recallXP: 0, explorationXP: 0,
};
const common = {
  react, "react/jsx-runtime": { jsx, jsxs: jsx }, "react-native": native,
  "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle", Path: "Path" },
  "../state/LearningSession": {
    useLearningSnapshot: () => learning,
    useDailySnapshot: () => daily,
    useLearningSession: () => ({ email: learning.userId ? "player@example.test" : null }),
  },
  "../hooks/useKnowledgeProfile": { useKnowledgeProfile: () => ({ profile: player, ready: true }) },
  "../gamification/rules": { playerTitle: level => "Παίκτης " + level },
  "../utils/dailyChallenge": { getAthensDateKey: () => "2026-10-30" },
  "../utils/dailySyncDocument": { dailyHistory: () => history },
  "../components/AppHeader": { __esModule: true, default: "Header" },
  "../components/SyncStatus": { __esModule: true, default: "Sync" },
  "../components/ProgressGradientBackground": { __esModule: true, default: "Gradient" },
  "../components/XpRules": { __esModule: true, default: "XpRules" },
  "../components/HomeMotion": { MotionView: "MotionView", MotionXpCircle: "MotionXpCircle", MotionPressable: "MotionPressable" },
};
let calls = [];
const profileProps = {
  onBack() {}, onStats: () => calls.push("stats"),
  onAccount: () => calls.push("account"),
  onInterests: () => calls.push("interests"),
  onGuide: () => calls.push("guide"),
};
const Profile = load("src/screens/ProfileScreen.tsx", common).default;
const renderProfile = () => { cursor = 0; return Profile(profileProps); };
let tree = renderProfile();
assert.ok(text(tree).includes("επισκέπτης"), "Guest identity remains visible");
assert.ok(nodes(tree).some(n => n.props?.testID === "profile-identity"));
assert.ok(nodes(tree).some(n => n.props?.testID === "profile-achievements"));
assert.ok(nodes(tree).some(n => n.type === "MotionXpCircle"), "Level retains its progress ring");
const pressProfile = label => {
  const item = nodes(tree).find(n => typeof n.type === "function" && n.type.name === "QuickLink" && n.props?.title === label);
  assert.ok(item, "Profile shortcut should exist: " + label);
  const button = item.type(item.props);
  assert.equal(button.type, "Pressable", "Shortcut should render a pressable control");
  button.props.onPress();
};
for (const label of ["Δραστηριότητα", "Λογαριασμός", "Ενδιαφέροντα", "Οδηγός"]) pressProfile(label);
assert.deepEqual(calls, ["stats", "account", "interests", "guide"]);
const xpHelp = nodes(tree).find(n => n.props?.accessibilityLabel === "Πώς κερδίζω XP;");
assert.ok(xpHelp && !xpHelp.props.accessibilityState.expanded);
xpHelp.props.onPress();
tree = renderProfile();
assert.ok(nodes(tree).some(n => n.type === "XpRules"), "Shared XP rules remain available");
learning = { ...learning, userId: "user" };
tree = renderProfile();
assert.ok(text(tree).includes("player@example.test"), "Account identity updates");

const Stats = load("src/screens/PlayerStatsScreen.tsx", {
  ...common,
  "../components/LearningActivityPanel": { __esModule: true, default: "Activity" },
}).default;
slots = [];
const render = () => { cursor = 0; return Stats({ onBack() {} }); };
tree = render();
const activity = nodes(tree).find(n => n.type === "Activity");
assert.ok(activity && activity.props.dashboard === true, "Stats should lead with the compact weekly chart");
assert.equal(nodes(tree).filter(n => n.props?.children === "Η δραστηριότητά σου").length, 1,
  "Statistics should only have one activity heading");
assert.ok(!nodes(tree).some(n => n.props?.testID === "progress-daily-details"));
const quizToggle = nodes(tree).find(n => n.type === "Pressable" && text(n).includes("Καθημερινά quiz"));
assert.ok(quizToggle, "Quiz details stay discoverable");
quizToggle.props.onPress();
tree = render();
assert.ok(nodes(tree).some(n => n.props?.testID === "progress-daily-details"));
assert.ok(text(tree).includes("5 / 7 σωστές απαντήσεις"), "Quiz history remains accessible");
assert.ok(text(tree).includes("ΜΕΓΑΛΥΤΕΡΟ ΣΕΡΙ"), "Historical streak record remains accessible");
assert.ok(text(tree).includes("ΑΚΡΙΒΕΙΑ QUIZ"), "Quiz accuracy remains accessible");
history = [];
tree = render();
assert.ok(text(tree).includes("Η πρώτη σου πρόκληση σε περιμένει"));
assert.ok(text(tree).includes("ΑΚΡΙΒΕΙΑ QUIZ—"), "Fresh history should not invent accuracy");
console.log("Profile/Statistics fourth-tab tests passed: player identity, XP, achievements, links, activity hierarchy, expandable quiz history and empty accuracy.");

// One review action, optional practice/weekly links, and no stray numeric zero.
let model={due:[],practice:[],categories:[],topics:[]},ready=true;
const modelHook={'../hooks/useKnowledgeModel':{useKnowledgeModel:()=>({model,today:'2026-10-30',ready})}};
learning={...learning,knowledgeSession:null};
let pending=[];
const Review=load('src/components/ReviewActions.tsx',{...common,...modelHook,'../utils/weeklyReview':{weeklyPlan:()=>pending},'./ActionButton':{__esModule:true,default:'Action'},'./ProgressMotion':{ProgressActionHighlight:'ActionHighlight'}}).default;
const actions={onReview:()=>calls.push('review'),onExplore:()=>calls.push('explore')};
tree=Review(actions);assert.equal(nodes(tree).filter(n=>n.type==='Action').length,1);assert.ok(!text(tree).endsWith('0'));nodes(tree).find(n=>n.type==='Action').props.onPress();assert.equal(calls.at(-1),'explore');
model={...model,due:[{}],practice:[{}]};tree=Review(actions);nodes(tree).find(n=>n.type==='Action').props.onPress();assert.equal(calls.at(-1),'review');
learning={...learning,knowledgeSession:{completed:false,date:'2026-10-30'}};tree=Review(actions);assert.ok(text(tree).includes('Συνέχισε εκεί που έμεινες'));
learning={...learning,knowledgeSession:null};model={...model,due:[]};pending=[{id:'miss'}];tree=Review(actions);assert.ok(text(tree).includes('ελεύθερη εξάσκηση'));assert.ok(!text(tree).includes('παλιά λάθη'),'legacy repeat prompts are retired');
ready=false;tree=Review(actions);assert.equal(nodes(tree).filter(n=>n.type==='Action').length,0);ready=true;
// The default learning map limits subjects without removing access to any subject or help.
model={...model,categories:Array.from({length:8},(_,i)=>({id:String(i),title:'Θεματική '+i,percent:i,mastered:0,total:10}))};slots=[];cursor=0;
const Map=load('src/components/KnowledgeMastery.tsx',{...common,...modelHook,
  './ActionButton':{__esModule:true,default:'Action'},
  './HomeMotion':{MotionPressable:'MotionPressable'},
  './ProgressMotion':{ProgressBarFill:'ProgressBarFill'}}).default;
const renderMap=()=>{cursor=0;return Map({onOpen(){},mapOnly:true});};tree=renderMap();assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='progressbar').length,3);assert.equal(nodes(tree).filter(n=>n.type==='Action').length,0,'no duplicate review CTA');assert.ok(!text(tree).includes('τρεις σωστές'));
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Όλες οι θεματικές')).props.onPress();tree=renderMap();assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='progressbar').length,8);
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Πώς μετριέται')).props.onPress();tree=renderMap();assert.ok(text(tree).includes('τρεις σωστές'));
console.log('Review/map disclosure passed: single next action, resume/due/practice/weekly/empty/loading states, three-subject preview, full expansion and optional explanation.');

slots=[];cursor=0;
const renderPreview=()=>{cursor=0;return Map({onOpen(){},mapOnly:true,preview:true});};
tree=renderPreview();
assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='progressbar').length,3);
assert.ok(!text(tree).includes("Πώς μετριέται"),"secondary disclosures stay out of the initial viewport");
assert.ok(!text(tree).includes("έννοιες κατακτημένες"),"preview rows use one compact label");
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Αναλυτική εικόνα')).props.onPress();
tree=renderPreview();
assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='progressbar').length,8,"all subject rows remain reachable");
assert.ok(text(tree).includes("Πώς μετριέται"));
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes("Πίσω στη σύνοψη")).props.onPress();
tree=renderPreview();
assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='progressbar').length,3);

// Detail mode keeps all subjects visible as compact tiles without repeating
// the explanatory essay; methodology stays one tap away.
slots=[];cursor=0;
const renderKnowledgeTiles=()=>{cursor=0;return Map({onOpen(){},mapOnly:true,detail:true});};
tree=renderKnowledgeTiles();
const tileGrid=nodes(tree).find(n=>n.props.testID==='knowledge-tile-grid');
assert.ok(tileGrid,'detail layout uses subject tiles');
assert.equal(nodes(tileGrid).filter(n=>n.type==='MotionPressable').length,4,
  'initial knowledge view has four tactile subject tiles');
assert.ok(nodes(tileGrid).every(n=>n.type!=='MotionPressable'||n.props.accessibilityRole==='button'),
  'each interactive tile has an accessible button role');
const firstKnowledgeTile=nodes(tileGrid).find(n=>n.type==='MotionPressable');
const firstKnowledgeId=firstKnowledgeTile.props.testID;
assert.equal(firstKnowledgeTile.props.accessibilityState.selected,false);
firstKnowledgeTile.props.onPress();tree=renderKnowledgeTiles();
assert.equal(nodes(tree).find(n=>n.props.testID===firstKnowledgeId).props.accessibilityState.selected,true);
assert.ok(text(nodes(tree).find(n=>n.props.testID==='knowledge-selected-subject')).includes('πρώτη κατακτημένη έννοια'),
  'selected empty subject offers a truthful first milestone');
nodes(tree).find(n=>n.props.testID===firstKnowledgeId).props.onPress();tree=renderKnowledgeTiles();
assert.ok(!nodes(tree).some(n=>n.props.testID==='knowledge-selected-subject'),
  'tapping a selected tile collapses its short insight');
assert.ok(!text(tileGrid).includes('0%'), 'zero subjects do not repeat 0% labels');
const showAll=nodes(tree).find(n=>n.props.testID==='knowledge-all-subjects');
assert.ok(showAll,'all subjects remain reachable');
assert.equal(showAll.props.accessibilityState.expanded,false);
showAll.props.onPress();tree=renderKnowledgeTiles();
assert.equal(nodes(tree).find(n=>n.props.testID==='knowledge-all-subjects').props.accessibilityState.expanded,true);
assert.equal(nodes(nodes(tree).find(n=>n.props.testID==='knowledge-tile-grid')).filter(n=>n.type==='MotionPressable').length,8,
  'expanded knowledge view renders all interactive subjects');
nodes(tree).find(n=>n.props.testID==='knowledge-all-subjects').props.onPress();
tree=renderKnowledgeTiles();
assert.equal(nodes(nodes(tree).find(n=>n.props.testID==='knowledge-tile-grid')).filter(n=>n.type==='MotionPressable').length,4,
  'knowledge view can collapse to its short overview');
assert.ok(!text(tree).includes('Η κατάκτηση χρειάζεται'),
  'long methodology is collapsed initially');
assert.equal(nodes(tree).filter(n=>n.type==='Pressable'&&text(n).includes('Όλες οι θεματικές')).length,1,
  'all subjects remain accessible through one compact disclosure');
nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Πώς μετριέται')).props.onPress();
tree=renderKnowledgeTiles();
assert.ok(text(tree).includes('τρεις σωστές δοκιμές'),
  'methodology remains available on demand');

// Real mastery data changes can distinguish progress from completion without
// any new persisted achievement or fabricated reward.
const originalCategories=model.categories;
model={...model,categories:[{...model.categories[0],percent:100,mastered:10,total:10},...model.categories.slice(1)]};
tree=renderKnowledgeTiles();
const completedTile=nodes(tree).find(n=>n.props.testID==='knowledge-subject-0');
assert.ok(text(completedTile).includes('✓'), 'fully mastered subject gains a restrained checkmark');
assert.ok(nodes(completedTile).some(n=>n.type==='ProgressBarFill'&&n.props.percent===100),
  'native fill reflects real review progress');
completedTile.props.onPress();tree=renderKnowledgeTiles();
assert.ok(text(nodes(tree).find(n=>n.props.testID==='knowledge-selected-subject')).includes('Όλες οι έννοιες'),
  'completion insight describes actual mastered concepts');
model={...model,categories:originalCategories};

// Reading tiles reuse the same native press feedback, but report actual
// completed lessons rather than the knowledge success-stage percentage.
let readingSnapshot={backup:{completedIds:[lessons[0].id]}};
const Reading=load('src/components/LearningActivityPanel.tsx',{
  ...common,
  '../state/LearningSession':{
    useLearningSnapshot:()=>readingSnapshot,
    useDailySnapshot:()=>daily,
  },
  '../utils/dailySyncDocument':{dailyHistory:()=>[]},
  '../utils/learningActivity':{activityBuckets:()=>[],activitySummary:()=>({})},
  '../utils/dailyChallenge':{getAthensDateKey:()=> '2026-10-30'},
  './HomeMotion':{MotionPressable:'MotionPressable'},
  './ProgressMotion':{ProgressBarFill:'ProgressBarFill'},
}).CategoryProgress;
slots=[];cursor=0;
const renderReadingTiles=()=>{cursor=0;return Reading({detail:true});};
tree=renderReadingTiles();
let readingTiles=nodes(tree).filter(n=>n.type==='MotionPressable');
assert.equal(readingTiles.length,4,'reading detail shows four tappable categories initially');
assert.ok(readingTiles.every(n=>n.props.accessibilityRole==='button'),
  'reading tiles are accessible buttons');
const readingFirst=readingTiles.find(n=>n.props.testID==='reading-subject-'+lessons[0].categoryId);
assert.ok(readingFirst,'completed lesson category is in the prioritized overview');
readingFirst.props.onPress();tree=renderReadingTiles();
assert.ok(nodes(tree).some(n=>n.props.testID==='reading-selected-subject'));
assert.ok(text(nodes(tree).find(n=>n.props.testID==='reading-selected-subject')).includes('Απομένουν'),
  'selected reading category shows its real remaining lesson count');
assert.equal(nodes(tree).find(n=>n.props.testID==='reading-subject-'+lessons[0].categoryId).props.accessibilityState.selected,true);
nodes(tree).find(n=>n.props.testID==='reading-subject-'+lessons[0].categoryId).props.onPress();
tree=renderReadingTiles();
assert.ok(!nodes(tree).some(n=>n.props.testID==='reading-selected-subject'),
  'selected reading tile can collapse');
const categoryLessons=lessons.filter(l=>l.categoryId===lessons[0].categoryId);
readingSnapshot={backup:{completedIds:categoryLessons.map(l=>l.id)}};
tree=renderReadingTiles();
const completeReadingTile=nodes(tree).find(n=>n.props.testID==='reading-subject-'+lessons[0].categoryId);
assert.ok(text(completeReadingTile).includes('✓'),
  'a completely read category gets a quiet checkmark');
assert.ok(nodes(completeReadingTile).some(n=>n.type==='ProgressBarFill'&&n.props.percent===100));
completeReadingTile.props.onPress();tree=renderReadingTiles();
assert.ok(text(nodes(tree).find(n=>n.props.testID==='reading-selected-subject')).includes('Ολοκλήρωσες όλα'),
  'reading milestone is grounded in the live completed lesson count');
const allReading=nodes(tree).find(n=>n.props.testID==='reading-all-subjects');
assert.ok(allReading,'all categories remain reachable through disclosure');
allReading.props.onPress();tree=renderReadingTiles();
assert.equal(nodes(tree).filter(n=>n.type==='MotionPressable').length,7,
  'expanded reading detail preserves all seven category tiles');

let resumed=[];
model={...model,due:[],practice:[]};ready=true;
learning={...learning,knowledgeSession:null};
const withLesson={...actions,inProgressLesson:lessons[0],lessonProgressLoaded:true,
  inProgressAnsweredCount:2,inProgressQuestionCount:4,onResumeLesson:id=>resumed.push(id)};
tree=Review(withLesson);
assert.equal(nodes(tree).filter(n=>n.type==='Action').length,1);
assert.equal(nodes(tree).find(n=>n.type==='Action').props.label,'Συνέχισε το μάθημα');
nodes(tree).find(n=>n.type==='Action').props.onPress();
assert.equal(resumed.at(-1),lessons[0].id);
model={...model,due:[{}]};
tree=Review(withLesson);
assert.equal(nodes(tree).find(n=>n.type==='Action').props.label,'Ξεκίνα την επανάληψη');
assert.ok(nodes(tree).some(n=>n.props.testID==='progress-resume'),"resume remains available as secondary action");
nodes(tree).find(n=>n.props.testID==='progress-resume').props.onPress();
assert.equal(resumed.length,2);
ready=false;tree=Review(withLesson);
assert.equal(nodes(tree).find(n=>n.type==='Action').props.label,'Συνέχισε το μάθημα',
  "hydrating review data does not hide the known in-progress lesson");
ready=true;
console.log('Progress Phase 1 action/map tests passed: preview disclosure, one primary action, review priority, resume accessibility, and hydration.');

