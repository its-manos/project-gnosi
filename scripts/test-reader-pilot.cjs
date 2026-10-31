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
const react = {
  useState: initial => {
    const i = stateIndex++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useRef: value => { const i = refIndex++; return refs[i] ??= { current: value }; },
};
const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Platform: { OS: 'android' }, Linking: { openURL: async () => {} }, StyleSheet: { create: s => s } };
const analyticsScrollEvents = [];
const common = {
  '../play/preferences': { motionAllowed: () => true, playPreferences: { getSnapshot: () => ({}) } },
  '../play/motion': { AnswerMotion: 'AnswerMotion' },
  './QuizReveal': { __esModule: true, default: 'QuizReveal' }, '../state/BetaAnalytics': {useBetaAnalytics: () => ({analytics:{progress:async value => {analyticsScrollEvents.push(value);}}})}, react, './ReportContentButton': { __esModule: true, default: 'ReportContentButton' }, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': native,
  'react-native-svg': { __esModule: true, default: 'Svg', Path: 'Path' } };
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
const data = compile('src/data/lessons.ts', { './additionalLessons': addition, './greekWorldLessons': compile('src/data/greekWorldLessons.ts'), './greekEvidenceLessons': compile('src/data/greekEvidenceLessons.ts'), './greekChronologyLessons': compile('src/data/greekChronologyLessons.ts'), './greekGeographyLessons': compile('src/data/greekGeographyLessons.ts'), './aegeanBronzeAgeLessons': compile('src/data/aegeanBronzeAgeLessons.ts'), './minoanCreteLessons': compile('src/data/minoanCreteLessons.ts'), './mycenaeanPalacesLessons': compile('src/data/mycenaeanPalacesLessons.ts'), './palaceCollapseLessons': compile('src/data/palaceCollapseLessons.ts'), './catalogueExpansion': expansion, './architectureLessons': compile('src/data/architectureLessons.ts'), './astronomyLessons': compile('src/data/astronomyLessons.ts'), './worldHistoryLessons': compile('src/data/worldHistoryLessons.ts'), './geologyLessons': compile('src/data/geologyLessons.ts'), './perceptionLessons': compile('src/data/perceptionLessons.ts'), './perceptionAttentionLessons': compile('src/data/perceptionAttentionLessons.ts') });
const media = compile('src/data/articleMedia.ts', { './architectureMedia': compile('src/data/architectureMedia.ts'), './astronomyMedia': compile('src/data/astronomyMedia.ts'), './worldHistoryMedia': compile('src/data/worldHistoryMedia.ts'), './supplementaryMedia': compile('src/data/supplementaryMedia.ts') });
const theme = compile('src/theme.ts');
const stubs = Object.fromEntries(['KnowledgeProgress','ZoomableLessonImage','ActionButton','ArticleFigure','InlineQuestionCard','LessonCover','SourceLink','AppHeader','ReportContentButton'].map(name => ['../components/'+name, { __esModule: true, default: name }]));
const rewardEngine = compile('src/quiz/engine.ts');
const rewardRules = compile('src/gamification/rules.ts');
const rewardLogic = compile('src/gamification/rewards.ts', { '../quiz/engine': rewardEngine, './rules': rewardRules });
const rewardAdapters = compile('src/quiz/adapters.ts', { './engine': rewardEngine });
const imports = { '../gamification/rewards': rewardLogic, '../quiz/adapters': rewardAdapters, ...stubs, '../data/articleMedia': media, '../theme': theme, '../utils/lessonProgress': progress, '../utils/contentReports': { lessonReportTarget: (lesson, questionIndex = null) => ({ itemId: lesson.id, questionIndex }) } };
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
reset();
assert.equal(Entry(props).type, Reader);
let tree = render();
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
assert.equal(nodes(tree).find(n => n.type === 'InlineQuestionCard').props.readingSize,24);
for(let i=0;i<8;i++) { press(tree,'Μικρότερο κείμενο άρθρου'); tree=render(); }
assert.equal(states[0],16);
press(tree,'Αποθήκευση άρθρου'); press(tree,'Επιστροφή στα άρθρα');
assert.ok(calls.some(c => c[0]==='save' && c[1]===lesson.id)); assert.ok(calls.some(c => c[0]==='back'));
props = { ...props, bookmarksLoaded:false }; tree=render();
assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === 'Αποθήκευση άρθρου').props.disabled,true);
const total = progress.getInlineQuestionCount(lesson);
for(let i=0;i<total;i++) {
  const q=nodes(tree).filter(n => n.type === 'InlineQuestionCard').at(-1);
  assert.equal(q.props.questionNumber,i+1);
  assert.equal(q.props.reportTarget.itemId,lesson.id);
  assert.equal(q.props.reportTarget.questionIndex,i,'question reporting uses canonical checkpoint index');
  const choice=i===0 ? (q.props.question.correctIndex+1)%q.props.question.answers.length : q.props.question.correctIndex;
  q.props.onSelectAnswer(choice,q.props.question.correctIndex);
  assert.deepEqual(calls.at(-1),['answer',i,choice,q.props.question.correctIndex]);
  props={ ...props, checkpointAnswers: { ...props.checkpointAnswers,[i]:choice } }; tree=render();
  assert.equal(nodes(tree).find(n => n.props?.accessibilityRole === 'progressbar').props.accessibilityValue.now,i+1);
  if(i<total-1) assert.ok(byId(tree,`reader-paragraph-${progress.getQuestionPlacements(lesson)[i].afterParagraphNumber+1}`), 'Any answer unlocks next paragraphs.');
}
assert.ok(byId(tree,'reader-finish')); assert.ok(!byId(tree,'reader-locked'));
assert.ok(!calls.some(c=>c[0]==='finish'), 'Reading/answering alone never marks completion.');
nodes(tree).find(n => n.type === 'ActionButton' && n.props.label.startsWith('Ολοκλήρωση')).props.onPress();
assert.deepEqual(calls.at(-1),['finish']);
// Continue must work when child paragraph layout fires before parent section layout.
const paragraph=byId(tree,'reader-paragraph-4');
lay(paragraph,66);
const continuation=nodes(tree).find(n => n.type==='ActionButton' && n.props.label==='Συνέχεια ανάγνωσης ↓');
continuation.props.onPress();
const section=nodes(tree).find(n => n.props?.onLayout && nodes(n).includes(paragraph) && n!==paragraph && n.type==='View');
lay(section,820);
assert.equal(scrolls.at(-1).y,808,'Continue keeps the new section heading visible.');
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
const Card=compile('src/components/InlineQuestionCard.tsx',{'../theme':theme}).default;
const feedback=Card({question:lesson.questions[0],questionNumber:1,selectedAnswer:0,readingSize:24,onSelectAnswer:()=>{}});
assert.ok(nodes(feedback).some(n=>n.props?.accessibilityLiveRegion==='polite'));
assert.ok(nodes(feedback).filter(n=>n.type==='Pressable').every(n=>n.props.disabled));
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
    const limit=progress.getVisibleParagraphLimit(article,props.checkpointAnswers);
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
const lessonPath=compile('src/utils/lessonPath.ts');
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
console.log(`Reader checks passed for ${data.lessons.length} articles: every paragraph/checkpoint boundary, ${notes} content notes, ${figures} inline figures, source retention, text controls, resume, completion and next-lesson routing. Native views mocked.`);
