/* Old lesson checkpoints now share the exact single-choice UI with daily/typed quizzes.
 * Native React components are mocked; device font and scrolling still need QA.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const jsx = (type, props) => ({ type, props: props ?? {} });
function compile(file, requireFn) {
  const mod = { exports: {} };
  vm.runInNewContext(transpile(file), {
    module: mod, exports: mod.exports, Promise,
    require: requireFn,
  });
  return mod.exports;
}
const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } };
const theme = compile('src/theme.ts', () => { throw Error('theme has no imports'); });
const sharedStyles = compile('src/components/questionCardStyles.ts', id => {
  if (id === 'react-native') return native;
  if (id === '../theme') return theme;
  throw Error(id);
}).questionCardStyles;
let states = [], refs = [], stateIndex = 0, refIndex = 0;
const hooks = {
  useState: initial => {
    const i = stateIndex++;
    if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useRef: initial => {
    const i = refIndex++;
    return refs[i] ??= { current: initial };
  },
  useEffect: () => {},
};
const imports = {
  react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native,
  '../play/motion': { AnswerMotion: 'AnswerMotion' },
  '../theme': theme,
  './QuizReveal': { __esModule: true, default: 'QuizReveal' },
  './ReportContentButton': { __esModule: true, default: 'ReportContentButton' },
  './questionCardStyles': { questionCardStyles: sharedStyles },
};
const SingleChoice = compile('src/components/SingleChoiceQuestionCard.tsx', id => {
  if (!(id in imports)) throw Error('missing single-choice dependency: ' + id);
  return imports[id];
}).default;
const Inline = compile('src/components/InlineQuestionCard.tsx', id => {
  if (id === './SingleChoiceQuestionCard') return { __esModule: true, default: 'SingleChoiceQuestionCard' };
  if (id === 'react/jsx-runtime') return imports['react/jsx-runtime'];
  throw Error('missing inline dependency: ' + id);
}).default;
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
const byId = (tree, testID) => nodes(tree).find(n => n.props?.testID === testID);
const flatStyle = node => {
  const style = typeof node.props.style === 'function' ? node.props.style({ pressed: false }) : node.props.style;
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
};
const textChildren = value => Array.isArray(value) ? value.map(textChildren).join('') :
  (typeof value === 'string' || typeof value === 'number') ? String(value) :
  value && typeof value === 'object' ? textChildren(value.props?.children) : '';

const question = { id: 'q-example', question: 'Ποιο όργανο συνεδρίαζε στην Αθήνα;',
  answers: ['Η Βουλή', 'Η Εκκλησία του Δήμου', 'Ο Άρειος Πάγος', 'Η Ηλιαία'],
  correctIndex: 1, explanation: 'Οι πολίτες συμμετείχαν στην Εκκλησία του Δήμου.' };
const events = [];
const target = { itemId: 'ancient-athens', questionIndex: 0 };
let props = { question, questionNumber: 2, selectedAnswer: undefined, readingSize: 18,
  reportTarget: target, combo: 0, onSelectAnswer: (...args) => events.push(args) };
const bridge = () => Inline(props);
const render = () => { stateIndex = 0; refIndex = 0; return SingleChoice(bridge().props); };
const resetHooks = () => { states = []; refs = []; };
resetHooks();
const wrapper = bridge();
assert.equal(wrapper.type, 'SingleChoiceQuestionCard');
assert.equal(wrapper.props.answer, undefined);
assert.equal(wrapper.props.question, question.question);
assert.equal(wrapper.props.questionNumber, 2);
assert.equal(wrapper.props.reportTarget, target);
assert.equal(wrapper.props.testPrefix, 'lesson-question');
let tree = render();
assert.equal(byId(tree, 'lesson-question-card').type, 'View');
assert.equal(flatStyle(byId(tree, 'lesson-question-card')).backgroundColor, sharedStyles.card.backgroundColor,
  'legacy card reuses exact shared background');
assert.equal(flatStyle(byId(tree, 'lesson-question-card')).borderColor, sharedStyles.card.borderColor);
assert.equal(byId(tree, 'lesson-question-confirm').props.disabled, true);
assert.equal(nodes(tree).filter(n => n.props?.testID?.startsWith('lesson-question-option-')).length, 4);
assert.equal(byId(tree, 'lesson-question-feedback'), undefined);
assert.equal(nodes(tree).find(n => n.type === 'ReportContentButton').props.target, target);
const header = nodes(tree).find(n => n.type === 'Text' && n.props.accessibilityRole === 'header');
assert.equal(header.props.style[1], undefined, 'normal reading size must not override shared quiz typography');
assert.equal(flatStyle(header).fontSize, sharedStyles.question.fontSize);

byId(tree, 'lesson-question-option-0').props.onPress();
assert.equal(events.length, 0, 'tapping must not score or persist a draft');
tree = render();
assert.equal(byId(tree, 'lesson-question-option-0').props.accessibilityState.selected, true);
assert.equal(flatStyle(byId(tree, 'lesson-question-option-0')).borderColor, theme.colors.accent);
assert.equal(byId(tree, 'lesson-question-confirm').props.disabled, false);
byId(tree, 'lesson-question-option-1').props.onPress();
tree = render();
assert.equal(byId(tree, 'lesson-question-option-1').props.accessibilityState.selected, true,
  'the player may change the draft before confirming');
assert.equal(events.length, 0);
byId(tree, 'lesson-question-confirm').props.onPress();
byId(tree, 'lesson-question-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(events)), [[1, 1]], 'exactly one numeric legacy callback on confirmation');
tree = render();
assert.equal(byId(tree, 'lesson-question-confirm').props.disabled, true, 'double submission is locked pending parent state');
props = { ...props, selectedAnswer: 1, combo: 2 };
tree = render();
assert.equal(byId(tree, 'lesson-question-confirm'), undefined);
assert.equal(byId(tree, 'lesson-question-option-1').props.disabled, true);
assert.ok(byId(tree, 'lesson-question-feedback'));
assert.equal(byId(tree, 'lesson-question-correction'), undefined);
assert.ok(nodes(tree).some(n => n.type === 'Text' && textChildren(n.props.children) === '✦  ΣΕΡΙ 2'),
  'combo is visible for committed answers');

props = { ...props, selectedAnswer: 0 };
resetHooks();
tree = render();
assert.equal(flatStyle(byId(tree, 'lesson-question-option-0')).borderColor, theme.colors.error);
assert.equal(flatStyle(byId(tree, 'lesson-question-option-1')).borderColor, theme.colors.success);
assert.equal(byId(tree, 'lesson-question-correction').props.children, question.answers[1]);
byId(tree, 'lesson-question-option-0').props.onPress();
assert.equal(events.length, 1, 'restored wrong answer cannot be submitted twice');
props = { ...props, selectedAnswer: undefined, readingSize: 24 };
resetHooks();
tree = render();
const larger = nodes(tree).find(n => n.type === 'Text' && n.props.accessibilityRole === 'header');
assert.equal(larger.props.style[1].fontSize, 24, 'reader font controls scale consistently');
const src = fs.readFileSync(path.join(root, 'src/components/SingleChoiceQuestionCard.tsx'), 'utf8');
for (const forbidden of ['emitPlayFeedback', 'commitRecord', 'AsyncStorage', 'supabase', 'setCheckpointAnswers']) {
  assert.equal(src.includes(forbidden), false, 'UI must not own score or persistence: ' + forbidden);
}
console.log('Legacy choice card passed: exact shared styles, draft selection/change, confirmation-only callback, double-tap lock, restored answers, combo, report and text scaling.');
