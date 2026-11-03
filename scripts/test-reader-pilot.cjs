/* global __dirname */
// Interaction tests with mocked native views; device typography/scrolling need phone QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const jsx = (type, props) => ({ type, props });
let states = [], refs = [], stateIndex = 0, refIndex = 0;
const openingCues = [];
const react = {
  useState: initial => {
    const i = stateIndex++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useRef: value => { const i = refIndex++; return refs[i] ??= { current: value }; },
};
const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Modal: 'Modal', Platform: { OS: 'android' }, Linking: { openURL: async () => {} }, StyleSheet: { create: s => s } };
const analyticsScrollEvents = [];
const common = {
  '../play/preferences': { motionAllowed: () => true, playPreferences: { getSnapshot: () => ({}) } },
  '../play/soundStatus': { requestPracticeCue: kind => openingCues.push(kind) },
  '../play/motion': { AnswerMotion: 'AnswerMotion' },
  './QuizReveal': { __esModule: true, default: 'QuizReveal' }, '../state/BetaAnalytics': {useBetaAnalytics: () => ({analytics:{progress:async value => {analyticsScrollEvents.push(value);}}})}, react, './ReportContentButton': { __esModule: true, default: 'ReportContentButton' }, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': native,
  'react-native-svg': { __esModule: true, default: 'Svg', Path: 'Path' },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) } };
function compile(file, imports = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, Intl, requestAnimationFrame: fn => fn(),
    require: id => { if (id in imports) return imports[id]; if (id in common) return common[id]; throw Error(id); } });
  return mod.exports;
}
const progress = compile('src/utils/lessonProgress.ts');
const addition = compile('src/data/additionalLessons.ts');
const expansion = compile('src/data/catalogueExpansion.ts');
const data = compile('src/data/lessons.ts', { './additionalLessons': addition, './greekWorldLessons': compile('src/data/greekWorldLessons.ts'), './greekEvidenceLessons': compile('src/data/greekEvidenceLessons.ts'), './greekChronologyLessons': compile('src/data/greekChronologyLessons.ts'), './greekGeographyLessons': compile('src/data/greekGeographyLessons.ts'), './aegeanBronzeAgeLessons': compile('src/data/aegeanBronzeAgeLessons.ts'), './minoanCreteLessons': compile('src/data/minoanCreteLessons.ts'), './mycenaeanPalacesLessons': compile('src/data/mycenaeanPalacesLessons.ts'), './palaceCollapseLessons': compile('src/data/palaceCollapseLessons.ts'), './geometricGreeceLessons': compile('src/data/geometricGreeceLessons.ts'), './riseOfPolisLessons': compile('src/data/riseOfPolisLessons.ts'), './greekSettlementsLessons': compile('src/data/greekSettlementsLessons.ts'), './spartaSocietyLessons': compile('src/data/spartaSocietyLessons.ts'), './athensLawCourtsLessons': compile('src/data/athensLawCourtsLessons.ts'), './greekWarHoplitesLessons': compile('src/data/greekWarHoplitesLessons.ts'), './greekSanctuariesGamesLessons': compile('src/data/greekSanctuariesGamesLessons.ts'), './persianWarsGreekWorldLessons': compile('src/data/persianWarsGreekWorldLessons.ts'), './athenianEmpireLessons': compile('src/data/athenianEmpireLessons.ts'), './peloponnesianWarLessons': compile('src/data/peloponnesianWarLessons.ts'), './greekCrisesFourthCenturyLessons': compile('src/data/greekCrisesFourthCenturyLessons.ts'), './macedonPhilipLessons': compile('src/data/macedonPhilipLessons.ts'), './alexanderConquestsLessons': compile('src/data/alexanderConquestsLessons.ts'), './greekStageTragedyLessons': compile('src/data/greekStageTragedyLessons.ts'), './greekPhilosophyInContextLessons': compile('src/data/greekPhilosophyInContextLessons.ts'), './greekScienceKnowledgeLessons': compile('src/data/greekScienceKnowledgeLessons.ts'), './greekImagesSculptureLessons': compile('src/data/greekImagesSculptureLessons.ts'), './hellenisticKingdomsCitiesLessons': compile('src/data/hellenisticKingdomsCitiesLessons.ts'), './catalogueExpansion': expansion, './architectureLessons': compile('src/data/architectureLessons.ts'), './astronomyLessons': compile('src/data/astronomyLessons.ts'), './worldHistoryLessons': compile('src/data/worldHistoryLessons.ts'), './geologyLessons': compile('src/data/geologyLessons.ts'), './perceptionLessons': compile('src/data/perceptionLessons.ts'), './perceptionAttentionLessons': compile('src/data/perceptionAttentionLessons.ts') });
const media = compile('src/data/articleMedia.ts', { './architectureMedia': compile('src/data/architectureMedia.ts'), './astronomyMedia': compile('src/data/astronomyMedia.ts'), './worldHistoryMedia': compile('src/data/worldHistoryMedia.ts'), './supplementaryMedia': compile('src/data/supplementaryMedia.ts') });
const theme = compile('src/theme.ts');
const stubs = Object.fromEntries(['KnowledgeProgress','ZoomableLessonImage','ActionButton','ArticleFigure','InlineQuestionCard','QuizQuestionRenderer','LessonCover','NextImageWarmup','SourceLink','AppHeader','ReportContentButton'].map(name => ['../components/'+name, { __esModule: true, default: name }]));
const rewardEngine = compile('src/quiz/engine.ts');
const rewardRules = compile('src/gamification/rules.ts');
const rewardLogic = compile('src/gamification/rewards.ts', { '../quiz/engine': rewardEngine, './rules': rewardRules });
const rewardAdapters = compile('src/quiz/adapters.ts', { './engine': rewardEngine });
const nextFigureWarmup = compile('src/utils/nextFigureWarmup.ts', { '../data/articleMedia': media, './lessonProgress': progress });
const imports = { '../utils/nextFigureWarmup': nextFigureWarmup, '../gamification/rewards': rewardLogic, '../quiz/adapters': rewardAdapters, ...stubs, '../data/articleMedia': media, '../theme': theme, '../utils/lessonProgress': progress, '../utils/contentReports': { lessonReportTarget: (lesson, questionIndex = null) => ({ itemId: lesson.id, questionIndex }) } };
const Reader = compile('src/screens/ReaderLessonScreen.tsx', imports).default;
const Entry = compile('src/screens/LessonScreen.tsx', { ...imports, './ReaderLessonScreen': { __esModule: true, default: Reader } }).default;
const lesson = data.lessons.find(l => l.id === 'ancient-athens');
const calls = [], scrolls = [];
let props;
function reset(answers = {}) {
  states=[]; refs=[];
  props = { lesson, category: data.categories.find(c => c.id === lesson.categoryId), subcategory: data.subcategories.find(c => c.id === lesson.subcategoryId),
    isSaved:false, bookmarksLoaded:true, checkpointAnswers:answers, onToggleSaved: id => calls.push(['save',id]), onBack: () => calls.push(['back']),
    onAnswerCheckpoint: (...args) => calls.push(['answer',...args]), onFinishLesson: () => calls.push(['finish']) };
}
function render() { stateIndex=0; refIndex=0; return Reader(props); }
const nodes = t => t && typeof t === 'object' ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
const byId = (t,id) => nodes(t).find(n => n.props?.testID === id);
const press = (t,label) => nodes(t).find(n => n.type === 'Pressable' && n.props.accessibilityLabel === label).props.onPress();
const lay = (n,y) => n.props.onLayout({ nativeEvent: { layout: { y } } });
function openGate(t) {
  const gate = nodes(t).find(n => n.type === 'ActionButton' && n.props.label === 'Έτοιμος για ερωτήσεις →');
  assert.ok(gate, 'pending checkpoint offers an accessible full-screen entry');
  gate.props.onPress();
  const modalTree = render();
  assert.ok(byId(modalTree,'reader-question-screen'), 'question screen opens');
  assert.equal(nodes(modalTree).find(n => n.type === 'Modal').props.presentationStyle,'fullScreen');
  assert.equal(nodes(modalTree).find(n => n.type === 'ScrollView').props.scrollEnabled,false,
    'article scrolling stays disabled while answering');
  return modalTree;
}
reset();
assert.equal(Entry(props).type, Reader);
let tree = render();
assert.equal(nodes(tree).find(n => n.type === 'NextImageWarmup').props.uri, nextFigureWarmup.nextPendingFigureUrl(lesson, progress.getReadingVisibleParagraphLimit(lesson, props.checkpointAnswers)), 'reader passes only the next unrevealed figure to warmup');
const coverStyle = nodes(tree).find(n => n.type === 'LessonCover').props.style;
assert.equal(coverStyle.aspectRatio, 16 / 10, 'reader cover uses responsive framing');
assert.equal(coverStyle.height, undefined, 'no fixed reader cover height');
assert.equal(coverStyle.minHeight, 180);
assert.equal(coverStyle.maxHeight, 330);
const scroll = nodes(tree).find(n => n.type === 'ScrollView');
scroll.props.ref.current = { scrollTo: args => scrolls.push(args) };
assert.ok(byId(tree,'reader-paragraph-3')); assert.ok(!byId(tree,'reader-paragraph-4'));
assert.ok(!byId(tree,'reader-finish')); assert.ok(byId(tree,'reader-locked'));
assert.equal(nodes(tree).find(n => n.props?.accessibilityRole === 'progressbar').props.accessibilityValue.now, 0);
press(tree,'Πηγές άρθρου'); tree=render();
assert.ok(byId(tree,'reader-sources'), 'Sources are available before any answer.');
const source = nodes(byId(tree,'reader-sources')).find(n => typeof n.type === 'function');
assert.equal(nodes(source.type(source.props)).filter(n => n.type === 'SourceLink').length, lesson.sources.length);
press(tree,'Ρυθμίσεις ανάγνωσης'); tree=render();
for(let i=0;i<6;i++) { press(tree,'Μεγαλύτερο κείμενο άρθρου'); tree=render(); }
assert.equal(states[0],24);
assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === 'Μεγαλύτερο κείμενο άρθρου').props.disabled,true);
assert.equal(nodes(tree).filter(n => n.type === 'QuizQuestionRenderer' || n.type === 'InlineQuestionCard').length,0,
  'the article has no visible question content before opening the modal');
for(let i=0;i<8;i++) { press(tree,'Μικρότερο κείμενο άρθρου'); tree=render(); }
assert.equal(states[0],16);
press(tree,'Αποθήκευση άρθρου'); press(tree,'Επιστροφή στα άρθρα');
assert.ok(calls.some(c => c[0]==='save' && c[1]===lesson.id)); assert.ok(calls.some(c => c[0]==='back'));
props = { ...props, bookmarksLoaded:false }; tree=render();
assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === 'Αποθήκευση άρθρου').props.disabled,true);
const total = progress.getInlineQuestionCount(lesson);
for(let i=0;i<total;i++) {
  if (!byId(tree,'reader-question-screen')) tree=openGate(tree);
  const q=nodes(byId(tree,'reader-question-screen')).filter(n => n.type === 'InlineQuestionCard' || n.type === 'QuizQuestionRenderer').at(-1);
  assert.equal(q.props.questionNumber,i+1);
  const report= q.type === 'InlineQuestionCard' ? q.props.reportTarget :
    nodes(byId(tree,'reader-question-screen')).filter(n => n.type === 'ReportContentButton').at(-1).props.target;
  assert.equal(report.itemId,lesson.id);
  assert.equal(report.questionIndex,i,'question reporting uses canonical checkpoint index');
  const canonical=lesson.questions[i];
  const choice=i===0 ? (canonical.correctIndex+1)%canonical.answers.length : canonical.correctIndex;
  const multiple = canonical.presentation?.type === 'multiple-select';
  const typedValue = multiple ? [...canonical.presentation.correctIndices] : undefined;
  if(q.type === 'QuizQuestionRenderer') q.props.onSubmit(multiple ? typedValue : 'option-'+choice);
  else q.props.onSelectAnswer(choice,canonical.correctIndex);
  assert.deepEqual(calls.at(-1),multiple
    ? ['answer',i,choice,canonical.correctIndex,typedValue]
    : ['answer',i,choice,canonical.correctIndex]);
  props={ ...props, checkpointAnswers: { ...props.checkpointAnswers,[i]:choice },
    ...(multiple ? {typedCheckpointAnswers:{
      ...(props.typedCheckpointAnswers??{}),
      [i]:{questionVersion:q.props.question.version,value:typedValue},
    }} : {}) }; tree=render();
  assert.equal(nodes(tree).find(n => n.props?.accessibilityRole === 'progressbar').props.accessibilityValue.now,i+1);
  const advance=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='ActionButton' && (n.props.label.includes('Επόμενη ερώτηση') || n.props.label.includes('Συνέχεια ανάγνωσης')));
  assert.ok(advance,'answer feedback remains visible until the learner advances');
  advance.props.onPress(); tree=render();
  if(i<total-1) assert.ok(byId(tree,`reader-paragraph-${progress.getReadingQuestionPlacements(lesson)[i].afterParagraphNumber+1}`) ||
    progress.getReadingQuestionPlacements(lesson)[i].afterParagraphNumber === progress.getReadingQuestionPlacements(lesson)[i+1].afterParagraphNumber,
    'Any confirmed answer unlocks the next paragraph or next same-section question.');
}
assert.equal(openingCues.filter(c=>c==='question-open').length,total,
 'opening sound is emitted once for each question, never for reading or answer restoration');
assert.ok(byId(tree,'reader-finish')); assert.ok(!byId(tree,'reader-locked'));
assert.ok(!calls.some(c=>c[0]==='finish'), 'Reading/answering alone never marks completion.');
nodes(tree).find(n => n.type === 'ActionButton' && n.props.label.startsWith('Ολοκλήρωση')).props.onPress();
assert.deepEqual(calls.at(-1),['finish']);
// The original section layout/restore path remains intact after closing the modal.
const paragraph=byId(tree,'reader-paragraph-4');
lay(paragraph,66);
const section=nodes(tree).find(n => n.props?.onLayout && nodes(n).includes(paragraph) && n!==paragraph && n.type==='View');
lay(section,820);
// Resume uses the same position system, once per visit, with no new-answer auto jump.
reset({0:0}); tree=render();
nodes(tree).find(n=>n.type==='ScrollView').props.ref.current={scrollTo:args=>scrolls.push(args)};
const resumeParagraph=byId(tree,'reader-paragraph-4'); lay(resumeParagraph,45);
const resumeSection=nodes(tree).find(n=>n.props?.onLayout && nodes(n).includes(resumeParagraph) && n!==resumeParagraph && n.type==='View');
lay(resumeSection,930); assert.equal(scrolls.at(-1).y,918); assert.equal(scrolls.at(-1).animated,false);
const before=scrolls.length;
props={...props,checkpointAnswers:{0:0,1:0}}; tree=render();
nodes(tree).find(n=>n.type==='ScrollView').props.onContentSizeChange(); assert.equal(scrolls.length,before);
// Shared card keeps explanations visible and disables repeat answers.
const Card=compile('src/components/InlineQuestionCard.tsx',{
  './SingleChoiceQuestionCard': { __esModule:true, default:'SingleChoiceQuestionCard' },
}).default;
const feedback=Card({question:lesson.questions[0],questionNumber:1,selectedAnswer:0,readingSize:24,onSelectAnswer:()=>{}});
assert.equal(feedback.type,'SingleChoiceQuestionCard');
assert.equal(feedback.props.answer,0,'restored answer stays parent-owned');
assert.equal(feedback.props.question,lesson.questions[0].question);
assert.equal(feedback.props.readingSize,24);
assert.equal(feedback.props.correctIndex,lesson.questions[0].correctIndex);
 // The second pilot lesson also connects the new spot-the-mistake renderer to numeric persistence.
reset(); const greekWorld=data.lessons.find(l=>l.id==='greek-world-not-a-country');
props={...props,lesson:greekWorld,category:data.categories.find(c=>c.id===greekWorld.categoryId),subcategory:data.subcategories.find(c=>c.id===greekWorld.subcategoryId)};
tree=render();
tree=openGate(tree);
const worldSpot=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='QuizQuestionRenderer');
assert.equal(worldSpot.props.question.type,'spot-the-mistake');
worldSpot.props.onSubmit('option-1');
assert.deepEqual(calls.at(-1),['answer',0,1,greekWorld.questions[0].correctIndex]);
// A section may own two questions. Both are after the same last paragraph,
 // but only the first pending question can be answered.
const grouped=data.lessons.find(l=>l.id==='greek-science-knowledge');
assert.ok(grouped && grouped.questionPlacement==='section-end');
const display=progress.getReadingQuestionPlacements(grouped);
assert.equal(display[0].afterParagraphNumber,6);
assert.equal(display[1].afterParagraphNumber,6);
reset();
props={...props,lesson:grouped,category:data.categories.find(c=>c.id===grouped.categoryId),subcategory:data.subcategories.find(s=>s.id===grouped.subcategoryId)};
tree=render();
assert.ok(byId(tree,'reader-paragraph-6'));
assert.ok(!byId(tree,'reader-paragraph-7'));
assert.ok(byId(tree,'reader-checkpoint-0'));
assert.ok(!byId(tree,'reader-checkpoint-1'),'later question at the same ending stays locked');
tree=openGate(tree);
assert.ok(byId(tree,'reader-modal-question-0'));
assert.ok(!byId(tree,'reader-modal-question-1'));
assert.ok(nodes(tree).some(n=>n.type==='Text'&&n.props.children==='Ερώτηση 1 / 2'));

props={...props,checkpointAnswers:{0:grouped.questions[0].correctIndex}};
tree=render();
assert.ok(byId(tree,'reader-modal-question-0'),'feedback stays on the first question until Continue');
const nextInGroup=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='ActionButton'&&n.props.label==='Επόμενη ερώτηση →');
assert.ok(nextInGroup); nextInGroup.props.onPress(); tree=render();
assert.ok(byId(tree,'reader-modal-question-1'),'the second question replaces the first');
assert.ok(nodes(tree).some(n=>n.type==='Text'&&n.props.children==='Ερώτηση 2 / 2'));
assert.ok(!byId(tree,'reader-paragraph-7'),'reading cannot skip the second question');
assert.equal(progress.getReadingResumeParagraphNumber(grouped,props.checkpointAnswers),6,
 'resume returns to the active question at this ending');
assert.ok(!nodes(byId(tree,'reader-question-screen')).some(n=>n.type==='ActionButton'&&n.props.label==='Συνέχεια ανάγνωσης →'),
 'no premature continue button between questions sharing a section ending');
props={...props,checkpointAnswers:{0:grouped.questions[0].correctIndex,1:grouped.questions[1].correctIndex}};
tree=render();
assert.ok(byId(tree,'reader-paragraph-7'),'subsequent text unlocks only after both confirmations');
assert.equal(progress.getReadingResumeParagraphNumber(grouped,props.checkpointAnswers),7);

// Exercise every real article, including content notes, long titles, media,
// all checkpoint boundaries and full source lists. No catalogue fixtures are substituted.
let notes=0, figures=0;
for(const article of data.lessons) {
  reset();
  props={ ...props, lesson:article, category:data.categories.find(c=>c.id===article.categoryId), subcategory:data.subcategories.find(c=>c.id===article.subcategoryId) };
  const entry=Entry(props);
  assert.equal(entry.type,Reader,article.id+' uses the shared reader');
  assert.equal(entry.props.lesson.id,article.id);
  const count=progress.getInlineQuestionCount(article);
  const paragraphs=article.sections.flatMap(s=>s.paragraphs);
  for(let answered=0;answered<=count;answered++) {
    props={...props,checkpointAnswers:Object.fromEntries(Array.from({length:answered},(_,i)=>[i,article.questions[i].correctIndex]))};
    tree=render();
    assert.ok(nodes(tree).some(n=>n.type==='Text' && n.props.children===article.title));
    if(article.contentNote) {
      assert.ok(nodes(tree).some(n=>n.type==='Text' && n.props.children===article.contentNote));
    }
    const limit=progress.getReadingVisibleParagraphLimit(article,props.checkpointAnswers);
    for(let number=1;number<=paragraphs.length;number++) {
      assert.equal(Boolean(byId(tree,`reader-paragraph-${number}`)),number<=limit,article.id+' paragraph '+number);
      if(number<=limit) assert.ok(nodes(byId(tree,`reader-paragraph-${number}`)).some(n=>n.type==='Text' && n.props.children===progress.getParagraphText(paragraphs[number-1])));
    }
    assert.equal(Boolean(byId(tree,'reader-finish')),answered===count,article.id+' completion gate');
    const visibleMedia=nodes(tree).filter(n=>n.type==='ArticleFigure').map(n=>n.props.figure);
    const expectedMedia=(media.inlineArticleMedia[article.id]??[]).filter(f=>f.afterParagraphId ? paragraphs.slice(0,limit).some((p,i)=>progress.getParagraphId(p,i+1)===f.afterParagraphId) : f.afterParagraphCount<=limit);
    assert.deepEqual(visibleMedia,Array.from(expectedMedia),article.id+' inline figures');
  }
  figures+=(media.inlineArticleMedia[article.id]??[]).length;
  if(article.contentNote)notes++;
  assert.equal(nodes(tree).filter(n=>n.type==='LessonCover').length,1);
  const sources=nodes(tree).find(n=>typeof n.type==='function');
  assert.deepEqual(nodes(sources.type(sources.props)).filter(n=>n.type==='SourceLink').map(n=>n.props.source.url),Array.from(article.sources,s=>s.url));
}
assert.ok(data.lessons.length>=45); assert.ok(notes>0); assert.ok(figures>0);
// Completion -> results -> next unlocked lesson uses the existing callback contract.
const lessonPath=compile('src/utils/lessonPath.ts', { './devLessonAccess': compile('src/utils/devLessonAccess.ts') });
const nextLesson=lessonPath.getNextPathLesson(lesson,data.lessons,[lesson.id]);
const Results=compile('src/screens/ResultsScreen.tsx',{...imports,'../components/LessonResultChart':{__esModule:true,default:'LessonResultChart'}}).default;
let destination=null;
const resultTree=Results({lesson,score:total,nextLesson,onHome:()=>{},onReadAgain:()=>{},onBrowse:()=>{},onOpenLesson:id=>{destination=id;}});
const pick=nodes(resultTree).find(n=>n.props?.label==='Επόμενο μάθημα'); assert.ok(pick);pick.props.onPress();
const next=data.lessons.find(l=>l.id===destination);
assert.ok(next && next.id!==lesson.id);
assert.equal(Entry({...props,lesson:next}).type,Reader);
// Last visible paragraph is observed through native scroll/layout callbacks.
reset(); tree=render();
const firstMeasuredParagraph=byId(tree,'reader-paragraph-1');
const firstMeasuredSection=nodes(tree).find(n=>n.type==='View'&&n.props?.onLayout&&n!==firstMeasuredParagraph&&nodes(n).includes(firstMeasuredParagraph));
lay(firstMeasuredSection,100);lay(firstMeasuredParagraph,20);lay(byId(tree,'reader-paragraph-2'),180);
const measuredScroll=nodes(tree).find(n=>n.type==='ScrollView');
measuredScroll.props.onScroll({nativeEvent:{contentOffset:{y:0},layoutMeasurement:{height:200}}});
measuredScroll.props.onScroll({nativeEvent:{contentOffset:{y:150},layoutMeasurement:{height:200}}});
assert.equal(analyticsScrollEvents.at(-1).last_paragraph,2);
const observedCount=analyticsScrollEvents.length;
measuredScroll.props.onScroll({nativeEvent:{contentOffset:{y:0},layoutMeasurement:{height:200}}});
assert.equal(analyticsScrollEvents.length,observedCount,'Scrolling back cannot lower the last-seen paragraph');
// The learner can finish reading, reread and scroll around the checkpoint without
// being interrupted by a question or hearing an opening cue.
reset(); tree=render();
const visibleGate=byId(tree,'reader-checkpoint-0');
const gateParagraph=byId(tree,'reader-paragraph-3');
const gateSection=nodes(tree).find(n=>n.type==='View'&&n.props?.onLayout&&n!==gateParagraph&&nodes(n).includes(gateParagraph));
assert.ok(visibleGate && gateSection);
assert.ok(nodes(visibleGate).some(n=>n.type==='Text' &&
  n.props.children==='Έτοιμος να δοκιμάσεις όσα έμαθες;'));
lay(gateSection,120); lay(gateParagraph,320);
const gateScroll=nodes(tree).find(n=>n.type==='ScrollView');
const cueBefore=openingCues.length, callsBefore=calls.length;
gateScroll.props.onScroll({nativeEvent:{contentOffset:{y:0},layoutMeasurement:{height:260}}});
gateScroll.props.onScroll({nativeEvent:{contentOffset:{y:400},layoutMeasurement:{height:300}}});
gateScroll.props.onScroll({nativeEvent:{contentOffset:{y:0},layoutMeasurement:{height:260}}});
gateScroll.props.onContentSizeChange();
tree=render();
assert.equal(byId(tree,'reader-question-screen'),undefined,'scrolling over a checkpoint must never open questions');
assert.equal(openingCues.length,cueBefore,'scrolling and layout must never play the question sound');
assert.equal(calls.length,callsBefore,'reading and scrolling must not save answers or award progress');
assert.equal(nodes(tree).find(n=>n.type==='ScrollView').props.scrollEnabled,true,
 'reader remains scrollable until the learner deliberately opens questions');
const button=nodes(visibleGate).find(n=>n.type==='ActionButton' &&
  n.props.label==='Έτοιμος για ερωτήσεις →');
assert.ok(button);
button.props.onPress();
tree=render();
assert.ok(byId(tree,'reader-question-screen'),'tapping the button opens the full-screen question');
assert.equal(openingCues.length,cueBefore+1,'the opening cue plays only after the tap');
button.props.onPress(); tree=render();
assert.equal(openingCues.length,cueBefore+1,'double tapping cannot replay the cue');
nodes(tree).find(n=>n.type==='Modal').props.onRequestClose();
assert.deepEqual(calls.at(-1),['back'],'Android hardware Back invokes the existing leave guard');
assert.ok(byId(render(),'reader-question-screen'),'declining the leave warning does not reveal the article');
// An already saved answer must restore the next pending checkpoint, without
// opening its modal or playing a cue until the learner taps the button.
reset({ 0: lesson.questions[0].correctIndex });
tree=render();
const previousCues=openingCues.length;
assert.equal(byId(tree,'reader-question-screen'),undefined,'resume does not automatically open a question');
assert.equal(openingCues.length,previousCues,'resume does not replay an old opening cue');
assert.ok(byId(tree,'reader-checkpoint-1'),'the next question is still available after resume');
tree=openGate(tree);
assert.ok(byId(tree,'reader-modal-question-1'),'manual resume enters the next pending question');
assert.equal(openingCues.length,previousCues+1,'resume plays the cue only on the new tap');
// Three-format lesson pilot on an in-memory copy, preserving published data.
const typedPilot={ ...lesson, questions: lesson.questions.map(q=>({...q})) };
assert.ok(typedPilot.questions.length>=3);
typedPilot.questions[0].presentation={type:'multiple-select',correctIndices:[0,2]};
typedPilot.questions[1].presentation={type:'ordering',items:[
  {id:'first',label:'Πρώτη'}, {id:'second',label:'Δεύτερη'}, {id:'third',label:'Τρίτη'}
],correctOrder:['first','second','third']};
typedPilot.questions[2].presentation={type:'matching',pairs:[
  {leftId:'assembly',leftLabel:'Εκκλησία',rightId:'citizens',rightLabel:'Πολίτες'},
  {leftId:'council',leftLabel:'Βουλή',rightId:'prepare',rightLabel:'Προετοιμασία'}
]};
reset();
props={...props,lesson:typedPilot,typedCheckpointAnswers:{}};
const piloted=[
  [0,'multiple-select',[0,2]],
  [1,'ordering',['third','second','first']],
  [2,'matching',{assembly:'citizens',council:'prepare'}],
];
for(const [index,type,value] of piloted){
 tree=render();
 if (!byId(tree,'reader-question-screen')) tree=openGate(tree);
 const q=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='QuizQuestionRenderer'&&n.props.questionNumber===index+1);
 assert.ok(q,'the '+type+' checkpoint appears after its paragraph');
 assert.equal(q.props.question.type,type);
 assert.equal(q.props.answer,undefined);
 const beforeCalls=calls.length;
 q.props.onSubmit(value);
 const expected=rewardAdapters.projectInteractiveLessonAnswer(typedPilot,index,value);
 assert.equal(calls.length,beforeCalls+1,'confirmed structured answer submits once');
 assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))),['answer',index,expected,typedPilot.questions[index].correctIndex,value],
  'typed response and numeric projection reach the existing parent checkpoint callback');
 const typed=rewardAdapters.adaptInteractiveLessonQuestion(typedPilot,index);
 props={...props,
   checkpointAnswers:{...props.checkpointAnswers,[index]:expected},
   typedCheckpointAnswers:{...props.typedCheckpointAnswers,[index]:{questionVersion:typed.version,value}}
 };
 tree=render();
 const restored=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='QuizQuestionRenderer'&&n.props.questionNumber===index+1);
 assert.deepEqual(JSON.parse(JSON.stringify(restored.props.answer)),value,'same typed response restored');
 const advance=nodes(byId(tree,'reader-question-screen')).find(n=>n.type==='ActionButton'&&
   (n.props.label==='Επόμενη ερώτηση →'||n.props.label==='Συνέχεια ανάγνωσης →'));
 assert.ok(advance); advance.props.onPress();
}
assert.ok(byId(tree,'reader-finish'),'all structured answers unlock the original finish gate');
props={...props,enableReporting:false}; tree=render();
assert.equal(nodes(tree).filter(n=>n.type==='ReportContentButton').length,0,
  'dev pilot never offers real content reporting for synthetic questions');

console.log(`Reader checks passed for ${data.lessons.length} articles: every paragraph/checkpoint boundary, ${notes} content notes, ${figures} inline figures, source retention, text controls, resume, completion, typed-checkpoint pilot and next-lesson routing. Native views mocked.`);
