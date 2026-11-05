/* Lightweight React Native component contract; typography and taps still need on-device QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const engineModule = { exports: {} };
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = (file, jsx) => ts.transpileModule(source(file), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  jsx: jsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
} }).outputText;
vm.runInNewContext(transpile('src/quiz/engine.ts', false), { module: engineModule, exports: engineModule.exports });
const jsx = (type, props) => ({ type, props: props ?? {} });
let states = [], cursor = 0;
const react = {
  useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  },
  // A static fixture: changing question identity is exercised during device QA.
  useEffect: () => {},
};
const colors = { accentLight: '#ddc5a0', textMuted: '#999999', text: '#ffffff' };
const reading = { surface: '#111111', border: '#555555', muted: '#aaaaaa', text: '#eeeeee' };
const imports = {
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: value => value } },
  '../play/motion': { AnswerMotion: 'AnswerMotion' },
  '../quiz/engine': engineModule.exports,
  '../theme': { colors, reading },
  './QuizReveal': { __esModule: true, default: 'QuizReveal' },
    './QuestionFeedbackPanel': { __esModule: true, default: 'QuestionFeedbackPanel', AnswerSummaryText: 'AnswerSummaryText' },
};
const sharedModule = { exports: {} };
vm.runInNewContext(transpile('src/components/questionCardStyles.ts', false), {
  module: sharedModule, exports: sharedModule.exports,
  require: id => {
    if (id === 'react-native') return imports['react-native'];
    if (id === '../theme') return imports['../theme'];
    throw Error('unexpected shared style import ' + id);
  },
});
imports['./questionCardStyles'] = sharedModule.exports;
const componentModule = { exports: {} };
vm.runInNewContext(transpile('src/components/MultipleSelectQuestionCard.tsx', true), {
  module: componentModule, exports: componentModule.exports,
  require: id => { if (!(id in imports)) throw Error('unexpected import ' + id); return imports[id]; },
});
const Card = componentModule.exports.default;
const question = {
  id: 'test', type: 'multiple-select', prompt: 'Τι ισχύει;', explanation: 'Αυτός είναι ο λόγος.',
  content: { answers: ['Α', 'Β', 'Γ'], correctIndices: [0, 2] }, version: '1',
};
const submissions = [];
let props = { question, questionNumber: 1, onSubmit: value => submissions.push(value) };
const render = () => { cursor = 0; return Card(props); };
const nodes = tree => tree && typeof tree === 'object' ?
  [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const id = (tree, name) => nodes(tree).find(n => n.props?.testID === name);

let tree = render();
assert.equal(id(tree, 'multiple-select-confirm').props.disabled, true, 'cannot confirm an empty selection');
id(tree, 'multiple-select-option-2').props.onPress();
tree = render();
assert.equal(id(tree, 'multiple-select-confirm').props.disabled, false);
assert.equal(id(tree, 'multiple-select-option-2').props.accessibilityState.checked, true);
id(tree, 'multiple-select-option-0').props.onPress();
tree = render();
id(tree, 'multiple-select-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(submissions)), [[2, 0]], 'submits chosen option indices without prescoring');
assert.equal(id(tree, 'multiple-select-feedback'), undefined, 'feedback awaits persisted answer from parent');
props = { ...props, answer: [2, 0] };
tree = render();
assert.ok(id(tree, 'multiple-select-feedback'), 'shows feedback after parent confirms');
assert.equal(id(tree, 'multiple-select-option-0').props.disabled, true, 'cannot edit submitted answer');
assert.equal(id(tree, 'multiple-select-confirm'), undefined, 'confirmation disappears after answer');
console.log('Multiple-select question card contract passed: selection, confirmation, parent-owned answer, explanation, and disable-on-submit.');
