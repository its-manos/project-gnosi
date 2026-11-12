const assert = require("node:assert/strict"), { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
// Expand the pure shared learning components, without invoking stateful screens.
let subjectTileComponent, detailSectionComponents = [];
const resolveTile = tree => tree && typeof tree === "object"
  && typeof tree.type === "function"
  && (tree.type === subjectTileComponent || detailSectionComponents.includes(tree.type))
  ? tree.type(tree.props) : tree;
const nodes = tree => {
  const node = resolveTile(tree);
  return node && typeof node === "object"
    ? [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] : [];
};
const text = tree => typeof tree === "string" || typeof tree === "number"
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join("")
  : tree && typeof tree === "object" ? text(resolveTile(tree).props?.children) : "";

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
let screenWidth = 390;
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView",
  ActivityIndicator: "Spinner", StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: screenWidth, height: 810, fontScale: 1 }),
  useWindowDimensions: () => ({ width: screenWidth, height: 810, fontScale: 1 }),
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
  trophies: [],
  badges: [
    { id: "first", title: "Πρώτη γνώση", unlocked: true, current: 1, target: 1 },
    { id: "curious", title: "Περιέργεια", unlocked: false, current: 1, target: 3 },
  ],
  learningXP: 300, challengeXP: 20, recallXP: 0, explorationXP: 0,
};
const common = {
  react, "react/jsx-runtime": { jsx, jsxs: jsx },
  "../utils/screenLayout": { availableScreenHeight: (viewport, window) => viewport > 0 ? viewport : Math.max(0, window - 130), stableLayoutHeight: (old, next) => next > 0 && Math.abs(old - next) >= 1 ? next : old }, "react-native": native,
  "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle", Path: "Path" },
  "../state/LearningSession": {
    useLearningSnapshot: () => learning,
    useLearningDataSnapshot: () => learning,
    useDailySnapshot: () => daily,
    useDailyDataSnapshot: () => daily,
    useLearningSession: () => ({ email: learning.userId ? "player@example.test" : null }),
  },
  "../hooks/usePlayerAvatar": { usePlayerAvatar: () => ({ variant: "female", ready: true, saving: false, error: null, choose: async () => true }) },
  "../hooks/useKnowledgeProfile": { useKnowledgeProfile: () => ({ profile: player, ready: true }) },
  "../gamification/rules": { playerTitle: level => "Παίκτης " + level },
  "../utils/dailyChallenge": { getAthensDateKey: () => "2026-10-30" },
  "../utils/dailySyncDocument": { dailyHistory: () => history },
  "../components/AppHeader": { __esModule: true, default: "Header" },
  "../components/ProfileSectionHeader": { __esModule: true, default: "SectionHeader", profileSectionLayout: { horizontal: 18, top: 8, below: 13 } },
  "../components/SyncStatus": { __esModule: true, default: "Sync" },
  "../components/AppBackground": { __esModule: true, default: "AppBackground" },
  "../components/AtlasCard": { __esModule: true, default: "MotionView" },
  "../components/NavigationTile": { __esModule: true, default: "NavigationTile" },
  "../components/PlayerCollection": { __esModule: true, default: "PlayerCollection" },
  "../components/MetricCard": { __esModule: true, default: "MetricCard" },
  "../components/ProgressTrack": { __esModule: true, default: "ProgressTrack" },
  "../components/XpRules": { __esModule: true, default: "XpRules" },
  "../components/HomeMotion": { MotionView: "MotionView", MotionXpCircle: "MotionXpCircle", MotionPressable: "MotionPressable" },
};
let calls = [];
const profileProps = {
  onBack() {}, onStats: () => calls.push("stats"),
  onAccount: () => calls.push("account"),
  onInterests: () => calls.push("interests"),
  onSaved: () => calls.push("saved"),
  onGuide: () => calls.push("guide"),
};
const Profile = load("src/screens/ProfileScreen.tsx", common).default;
const renderProfile = () => { cursor = 0; return Profile(profileProps); };
let tree = renderProfile();
assert.ok(text(tree).includes("επισκέπτης"), "Guest identity remains visible");
assert.ok(nodes(tree).some(n => n.props?.testID === "profile-identity"));
const avatarPicker = nodes(tree).find(n => n.type === "PlayerCollection" && n.props?.mode === "character");
assert.equal(avatarPicker.props.variant, "female", "Profile uses the saved appearance");
assert.equal(avatarPicker.props.level, player.level, "Picker follows the current class level");
const profileHeader = nodes(tree).find(n => n.type === "SectionHeader");
assert.equal(profileHeader?.props.title, "Το προφίλ σου");
assert.equal(profileHeader.props.onAction, profileProps.onAccount);
profileHeader.props.onAction();
assert.equal(calls.at(-1), "account", "The header Settings button still opens Account");
assert.ok(nodes(tree).some(n => n.type === "PlayerCollection" && n.props?.mode !== "character"));
assert.equal(nodes(tree).filter(n => n.props?.accessibilityRole === "progressbar").length, 1, "Profile should show one XP progress indicator");
assert.ok(!nodes(tree).some(n => n.type === "MotionXpCircle"), "Do not repeat XP progress in a second ring");
const pressProfile = label => {
  const item = nodes(tree).find(n => typeof n.type === "function" && n.type.name === "QuickLink" && n.props?.title === label);
  assert.ok(item, "Profile shortcut should exist: " + label);
  const button = item.type(item.props);
  assert.equal(button.type, "NavigationTile", "Shortcut should render the shared navigation tile");
  button.props.onPress();
};
const shortcuts = nodes(tree).filter(n => typeof n.type === "function"
  && n.type.name === "QuickLink");
assert.equal(shortcuts.length, 4, "Ο χώρος σου keeps a balanced four-tile grid");
assert.deepEqual(shortcuts.map(n => n.props.title),
  ["Δραστηριότητα", "Αποθηκευμένα", "Ενδιαφέροντα", "Οδηγός"]);
assert.ok(!shortcuts.some(n => n.props.title === "Λογαριασμός"),
  "The redundant Account tile is removed");
for (const label of ["Δραστηριότητα", "Αποθηκευμένα", "Ενδιαφέροντα", "Οδηγός"]) pressProfile(label);
assert.deepEqual(calls, ["account", "stats", "saved", "interests", "guide"]);
const savedShortcut = shortcuts.find(n => n.props.title === "Αποθηκευμένα");
assert.equal(savedShortcut.type(savedShortcut.props).props.testID, "profile-saved-link",
  "Saved lessons uses the same accessible shortcut component as the other tiles");
assert.ok(!nodes(tree).some(n => n.props?.accessibilityLabel === "Πώς κερδίζω XP;"), "XP help is removed from Profile");
assert.ok(!text(tree).includes("σερί"), "Profile no longer repeats the streak");
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
assert.equal(nodes(tree).filter(n => n.type === "SectionHeader" && n.props?.title === "Δραστηριότητα").length, 1,
  "Statistics should use one shared page header");
assert.ok(!text(tree).includes("Η δραστηριότητά σου"), "Redundant activity introduction should be removed");
assert.ok(!nodes(tree).some(n => n.props?.testID === "progress-daily-details"));
const getStatsScroll = tree => nodes(tree).find(n => n.type === "ScrollView");
assert.equal(getStatsScroll(tree)?.props.scrollEnabled, false, "Default Statistics overview should not scroll");
assert.ok(nodes(tree).some(n => n.props?.testID === "stats-fixed-dashboard"));
screenWidth = 320;
tree = render();
assert.equal(getStatsScroll(tree)?.props.scrollEnabled, true,
  "Narrow screens should use the scrollable statistics layout to avoid clipping");
screenWidth = 390;
tree = render();
assert.equal(getStatsScroll(tree)?.props.scrollEnabled, false, "Normal viewport stays fixed");
// Content-based overflow must work even on a wide phone, without stretching the gaps.
nodes(tree).find(n => n.props?.testID === "player-stats-screen").props.onLayout({
  nativeEvent: { layout: { height: 580 } },
});
getStatsScroll(tree).props.onContentSizeChange(390, 720);
tree = render();
assert.equal(getStatsScroll(tree)?.props.scrollEnabled, true,
  "Content taller than the viewport should enable scrolling");
nodes(tree).find(n => n.props?.testID === "player-stats-screen").props.onLayout({
  nativeEvent: { layout: { height: 820 } },
});
tree = render();
assert.equal(getStatsScroll(tree)?.props.scrollEnabled, false,
  "Scrolling should turn off when the content fits again");
const quizToggle = nodes(tree).find(n => n.type === "MotionPressable" && text(n).includes("Καθημερινά quiz"));
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
let model={pending:[],subjects:[],rows:[],total:0,revised:0,unavailable:0},ready=true;
const modelHook={'../hooks/useMistakesModel':{useMistakesModel:()=>({model,today:'2026-10-30',ready})}};
learning={...learning,mistakeSession:null};
let pending=[];
const Review=load('src/components/ReviewActions.tsx',{...common,...modelHook,'../utils/weeklyReview':{weeklyPlan:()=>pending},'./ActionButton':{__esModule:true,default:'Action'},'./ProgressMotion':{ProgressActionHighlight:'ActionHighlight'}}).default;
const actions={onReview:()=>calls.push('review'),onExplore:()=>calls.push('explore')};
tree=Review(actions);assert.equal(nodes(tree).filter(n=>n.type==='Action').length,1);assert.ok(!text(tree).endsWith('0'));nodes(tree).find(n=>n.type==='Action').props.onPress();assert.equal(calls.at(-1),'explore');
model={...model,pending:[{}]};tree=Review(actions);nodes(tree).find(n=>n.type==='Action').props.onPress();assert.equal(calls.at(-1),'review');
learning={...learning,mistakeSession:{quiz:{completed:false}}};tree=Review(actions);assert.ok(text(tree).includes('Συνέχισε εκεί που έμεινες'));
learning={...learning,mistakeSession:null};model={...model,pending:[]};pending=[{id:'miss'}];tree=Review(actions);assert.ok(text(tree).includes('Δεν έχεις εκκρεμείς επαναλήψεις')); assert.ok(!text(tree).includes('παλιά λάθη'),'legacy repeat prompts are retired');
ready=false;tree=Review(actions);assert.equal(nodes(tree).filter(n=>n.type==='Action').length,0);ready=true;
// Mistake detail reports real correction counts and exposes saved wrong choices.
const detailSections=load('src/components/LearningDetailSections.tsx', {...common});
detailSectionComponents=Object.values(detailSections).filter(value=>typeof value==='function');
subjectTileComponent=load('src/components/SubjectProgressTile.tsx',{
 ...common,'./HomeMotion':{MotionPressable:'MotionPressable'},'./ProgressMotion':{ProgressBarFill:'ProgressBarFill'},'./ProgressTrack':{__esModule:true,default:'ProgressTrack'},
}).default;
const Map=load('src/components/KnowledgeMastery.tsx',{...common,...modelHook,'./ActionButton':{__esModule:true,default:'Action'}}).default;
slots=[];cursor=0;
tree=Map({onOpen(){},detail:true});assert.ok(text(tree).includes('0 συνολικά λάθη'));
assert.ok(!text(tree).includes('τρεις σωστές'));
model={...model,pending:[],total:4,revised:4,subjects:[{id:'history',title:'Ιστορία',emoji:'',total:4,revised:4}]};
cursor=0;tree=Map({onOpen(){},detail:true});assert.ok(text(tree).includes('4 / 4 διορθωμένα'));
assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='progressbar'));

// Reading tiles reuse the same native press feedback, but report actual
// completed lessons rather than the knowledge success-stage percentage.
let readingSnapshot={backup:{completedIds:[lessons[0].id]}};
const Reading=load('src/components/LearningActivityPanel.tsx',{
  ...common,
  '../state/LearningSession':{
    useLearningSnapshot:()=>readingSnapshot,
    useLearningDataSnapshot:()=>readingSnapshot,
    useDailySnapshot:()=>daily,
    useDailyDataSnapshot:()=>daily,
  },
  '../utils/dailySyncDocument':{dailyHistory:()=>[]},
  '../utils/learningActivity':{activityBuckets:()=>[],activitySummary:()=>({})},
  '../utils/dailyChallenge':{getAthensDateKey:()=> '2026-10-30'},
  './HomeMotion':{MotionPressable:'MotionPressable'},
  './MetricCard':{__esModule:true,default:'MetricCard'},
  './SubjectProgressTile':{__esModule:true,default:subjectTileComponent},
  './LearningDetailSections':detailSections,
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
model={...model,pending:[]};ready=true;
learning={...learning,mistakeSession:null};
const withLesson={...actions,inProgressLesson:lessons[0],lessonProgressLoaded:true,
  inProgressAnsweredCount:2,inProgressQuestionCount:4,onResumeLesson:id=>resumed.push(id)};
tree=Review(withLesson);
assert.equal(nodes(tree).filter(n=>n.type==='Action').length,1);
assert.equal(nodes(tree).find(n=>n.type==='Action').props.label,'Συνέχισε το μάθημα');
nodes(tree).find(n=>n.type==='Action').props.onPress();
assert.equal(resumed.at(-1),lessons[0].id);
model={...model,pending:[{}]};
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

