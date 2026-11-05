/* Interaction contracts with native components mocked. Phone typography still needs device QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const code = file => ts.transpileModule(read(file), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
function compile(file, imports) {
  const module = { exports: {} };
  vm.runInNewContext(code(file), { module, exports: module.exports,
    require: id => { if (!(id in imports)) throw Error('unexpected import ' + id); return imports[id]; } });
  return module.exports.default;
}
const jsx = (type, props) => ({ type, props: props ?? {} });
const engine = compileEngine();
function compileEngine() {
  const module = { exports: {} };
  vm.runInNewContext(code('src/quiz/engine.ts'), { module, exports: module.exports });
  return module.exports;
}
const colors = { accentLight: '#ddc5a0', textMuted: '#999999', text: '#ffffff',
  border: '#555555', surface: '#111111', textBody: '#eeeeee', successSurface: '#114422' };
const reading = { surface: '#111111', border: '#555555', muted: '#aaaaaa', text: '#eeeeee' };
const treeNodes = tree => tree && typeof tree === 'object' ?
  [tree, ...[tree.props?.children].flat(Infinity).flatMap(treeNodes)] : [];
const id = (tree, name) => treeNodes(tree).find(node => node.props?.testID === name);

function mount(file, question) {
  let states = [], cursor = 0;
  const react = {
    useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect: () => {},
  };
  const imports = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: x => x } },
    '../quiz/engine': engine, '../theme': { colors, reading },
    '../play/motion': { AnswerMotion: 'AnswerMotion' },
    './QuizReveal': { __esModule: true, default: 'QuizReveal' },
    './QuestionFeedbackPanel': { __esModule: true, default: 'QuestionFeedbackPanel', AnswerSummaryText: 'AnswerSummaryText' },
  };
  const shared = { exports: {} };
  vm.runInNewContext(code('src/components/questionCardStyles.ts'), {
    module: shared, exports: shared.exports,
    require: name => {
      if (name === 'react-native') return imports['react-native'];
      if (name === '../theme') return imports['../theme'];
      throw Error('unexpected shared style import ' + name);
    },
  });
  imports['./questionCardStyles'] = shared.exports;
  const Card = compile(file, imports);
  const submitted = [];
  let props = { question, questionNumber: 2, onSubmit: value => submitted.push(value) };
  const render = () => { cursor = 0; return Card(props); };
  return { submitted, render, setAnswer: value => { props = { ...props, answer: value }; } };
}
const ordering = {
  id: 'order', version: '1', type: 'ordering', prompt: 'Σειρά;', explanation: 'Έτσι είναι.',
  content: { items: [{ id: 'a', label: 'Α' }, { id: 'b', label: 'Β' }, { id: 'c', label: 'Γ' }],
    correctOrder: ['b', 'a', 'c'] },
};
const o = mount('src/components/OrderingQuestionCard.tsx', ordering);
let tree = o.render();
assert.equal(id(tree, 'ordering-up-a').props.disabled, true);
assert.equal(id(tree, 'ordering-down-c').props.disabled, true);
id(tree, 'ordering-down-a').props.onPress();
tree = o.render();
assert.equal(treeNodes(id(tree, 'ordering-item-b')).length > 0, true);
assert.equal(id(tree, 'ordering-up-b').props.disabled, true, 'first item changes after move');
assert.equal(o.submitted.length, 0, 'ordering arrows edit only a draft, not the scored answer');
id(tree, 'ordering-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(o.submitted)), [['b', 'a', 'c']]);
assert.equal(id(tree, 'ordering-feedback'), undefined, 'feedback requires parent-accepted answer');
o.setAnswer(['b', 'a', 'c']);
tree = o.render();
assert.ok(id(tree, 'ordering-feedback'));
assert.equal(id(tree, 'ordering-confirm'), undefined);
const matching = {
  id: 'match', version: '1', type: 'matching', prompt: 'Ζευγάρια;', explanation: 'Αιτιολόγηση.',
  content: { pairs: [
    { leftId: 'a', leftLabel: 'Α', rightId: 'x', rightLabel: 'Χ' },
    { leftId: 'b', leftLabel: 'Β', rightId: 'y', rightLabel: 'Υ' },
  ] },
};
const m = mount('src/components/MatchingQuestionCard.tsx', matching);
tree = m.render();
assert.equal(id(tree, 'matching-confirm').props.disabled, true);
assert.equal(id(tree, 'matching-right-x').props.disabled, true, 'select a left first');
id(tree, 'matching-left-a').props.onPress();
tree = m.render();
assert.equal(id(tree, 'matching-right-x').props.disabled, false);
id(tree, 'matching-right-x').props.onPress();
tree = m.render();
assert.equal(id(tree, 'matching-confirm').props.disabled, true);
id(tree, 'matching-left-b').props.onPress();
tree = m.render();
id(tree, 'matching-right-y').props.onPress();
tree = m.render();
assert.equal(id(tree, 'matching-confirm').props.disabled, false);
assert.equal(m.submitted.length, 0, 'pairing all options is still an unsubmitted draft');
id(tree, 'matching-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(m.submitted)), [{ a: 'x', b: 'y' }]);
m.setAnswer({ a: 'x', b: 'y' });
tree = m.render();
assert.ok(id(tree, 'matching-feedback'));
assert.equal(id(tree, 'matching-confirm'), undefined);
assert.equal(id(tree, 'matching-left-a').props.disabled, true);

// Changing an already connected right-hand option must detach its prior
// owner rather than creating duplicate links or enabling premature scoring.
const rematch = mount('src/components/MatchingQuestionCard.tsx', matching);
let retree = rematch.render();
id(retree, 'matching-left-a').props.onPress();
retree = rematch.render();
id(retree, 'matching-right-x').props.onPress();
retree = rematch.render();
id(retree, 'matching-left-b').props.onPress();
retree = rematch.render();
id(retree, 'matching-right-x').props.onPress();
retree = rematch.render();
assert.equal(id(retree, 'matching-confirm').props.disabled, true, 'reassignment detaches previous owner');
id(retree, 'matching-left-a').props.onPress();
retree = rematch.render();
id(retree, 'matching-right-y').props.onPress();
retree = rematch.render();
assert.equal(id(retree, 'matching-confirm').props.disabled, false);
id(retree, 'matching-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(rematch.submitted)), [{ b: 'x', a: 'y' }]);
rematch.setAnswer({ b: 'x', a: 'y' });
retree = rematch.render();
assert.ok(id(retree, 'matching-feedback'), 'incorrect mapping also shows explanation');

const renderer = compile('src/components/QuizQuestionRenderer.tsx', {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { View: 'View', Text: 'Text', StyleSheet: { create: x => x } },
  '../theme': { colors },
  './SingleChoiceQuestionCard': { __esModule: true, default: 'SingleChoiceQuestionCard' },
  './OrderingQuestionCard': { __esModule: true, default: 'OrderingQuestionCard' },
  './MatchingQuestionCard': { __esModule: true, default: 'MatchingQuestionCard' },
  './SpotMistakeQuestionCard': { __esModule: true, default: 'SpotMistakeQuestionCard' },
  './FillBlankQuestionCard': { __esModule: true, default: 'FillBlankQuestionCard' },
  './MultipleSelectQuestionCard': { __esModule: true, default: 'MultipleSelectQuestionCard' },
  './QuizReveal': { __esModule: true, default: 'QuizReveal' },
});
const r = (question, answer) => renderer({ question, questionNumber: 2, answer, onSubmit: () => {} });
assert.equal(r(ordering).type, 'OrderingQuestionCard');
assert.equal(r({ id: 'spot', type: 'spot-the-mistake', content: { segments: [], incorrectSegmentId: 'x', correction: '' } }).type, 'SpotMistakeQuestionCard');
assert.equal(r({ id: 'fill', type: 'fill-in-the-blank', content: { before: '', after: '', acceptedAnswers: [], displayAnswer: '' } }).type, 'FillBlankQuestionCard');
assert.equal(r(matching).type, 'MatchingQuestionCard');
assert.equal(r({ id: 'multi', type: 'multiple-select', content: { answers: ['a', 'b'], correctIndices: [0] } }).type, 'MultipleSelectQuestionCard');
assert.equal(r({ id: 'choice', type: 'multiple-choice', prompt: 'a', content: { answers: ['a', 'b'], correctIndex: 1 } }).type, 'SingleChoiceQuestionCard');
console.log('Question card interfaces passed: accessible ordering controls, matching pairs, parent-controlled answers, feedback and type dispatch.');
