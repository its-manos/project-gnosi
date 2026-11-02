/* Component contracts for new cards; native keyboard/animations require phone QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.join(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;
const jsx = (type, props) => ({ type, props: props ?? {} });
const engine = { exports: {} };
vm.runInNewContext(transpile('src/quiz/engine.ts'), { module: engine, exports: engine.exports });
const colors = { accent: '#aae', accentLight: '#aae', accentSurface: '#224', textMuted: '#888',
  text: '#fff', textBody: '#ddd', surface: '#222', surfaceRaised: '#333', border: '#555',
  borderStrong: '#777', success: '#0d0', successSurface: '#141', error: '#f00', errorSurface: '#411', background: '#000' };
const nodes = tree => tree && typeof tree === 'object' ?
  [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const id = (tree, name) => nodes(tree).find(item => item.props?.testID === name);
function mount(file, question) {
  let states = [], cursor = 0;
  const react = {
    useState: initial => {
      const position = cursor++;
      if (!(position in states)) states[position] = typeof initial === 'function' ? initial() : initial;
      return [states[position], value => { states[position] = typeof value === 'function' ? value(states[position]) : value; }];
    },
    useEffect: () => {},
  };
  const imports = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Pressable: 'Pressable', Text: 'Text', TextInput: 'TextInput', View: 'View',
      StyleSheet: { create: x => x } },
    '../play/motion': { AnswerMotion: 'AnswerMotion' },
    '../quiz/engine': engine.exports,
    '../theme': { colors },
    './QuizReveal': { __esModule: true, default: 'QuizReveal' },
  };
  const module = { exports: {} };
  vm.runInNewContext(transpile(file), { module, exports: module.exports,
    require: name => { if (!(name in imports)) throw Error('unexpected import ' + name); return imports[name]; } });
  const Component = module.exports.default;
  const submitted = [];
  let props = { question, questionNumber: 4, onSubmit: value => submitted.push(value) };
  return { render: () => { cursor = 0; return Component(props); },
    setAnswer: answer => { props = { ...props, answer }; }, submitted };
}
const mistakeQuestion = {
  id: 'mistake', version: '1', type: 'spot-the-mistake', prompt: 'Τι είναι λάθος?',
  explanation: 'Η θητεία δεν ήταν ισόβια.', content: {
    segments: [{ id: 'a', text: 'Η Βουλή' }, { id: 'b', text: 'είχε ισόβια θητεία' },
      { id: 'c', text: 'στην Αθήνα.' }],
    incorrectSegmentId: 'b', correction: 'Η θητεία ήταν ετήσια.' },
};
const spot = mount('src/components/SpotMistakeQuestionCard.tsx', mistakeQuestion);
let tree = spot.render();
assert.equal(id(tree, 'spot-mistake-feedback'), undefined);
id(tree, 'spot-mistake-segment-a').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(spot.submitted)), ['a']);
assert.equal(id(tree, 'spot-mistake-segment-b').props.accessibilityRole, 'button');
spot.setAnswer('a');
tree = spot.render();
assert.ok(id(tree, 'spot-mistake-feedback'), 'wrong answer reveals correct segment and correction');
assert.equal(id(tree, 'spot-mistake-segment-b').props.disabled, true);
const spotCorrect = mount('src/components/SpotMistakeQuestionCard.tsx', mistakeQuestion);
spotCorrect.setAnswer('b');
assert.ok(id(spotCorrect.render(), 'spot-mistake-feedback'), 'correct response also explains the sentence');
const blankQuestion = {
  id: 'blank', version: '1', type: 'fill-in-the-blank', prompt: 'Συμπλήρωσε:',
  explanation: 'Η συνέλευση των πολιτών.', content: {
    before: 'Η συνέλευση ονομαζόταν', after: '.',
    acceptedAnswers: ['Εκκλησία του Δήμου'], displayAnswer: 'Εκκλησία του Δήμου',
  },
};
const blank = mount('src/components/FillBlankQuestionCard.tsx', blankQuestion);
tree = blank.render();
assert.equal(id(tree, 'fill-blank-confirm').props.disabled, true);
assert.equal(id(tree, 'fill-blank-input').props.maxLength, 80);
id(tree, 'fill-blank-input').props.onChangeText('  ΕΚΚΛΗΣΙΑ ΤΟΥ ΔΗΜΟΥ ');
tree = blank.render();
assert.equal(id(tree, 'fill-blank-confirm').props.disabled, false);
id(tree, 'fill-blank-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(blank.submitted)), ['ΕΚΚΛΗΣΙΑ ΤΟΥ ΔΗΜΟΥ']);
assert.equal(id(tree, 'fill-blank-feedback'), undefined, 'feedback must wait for confirmed parent answer');
blank.setAnswer('ΕΚΚΛΗΣΙΑ ΤΟΥ ΔΗΜΟΥ');
tree = blank.render();
assert.ok(id(tree, 'fill-blank-feedback'));
assert.equal(id(tree, 'fill-blank-input').props.editable, false);
assert.equal(id(tree, 'fill-blank-confirm'), undefined);
const wrongBlank = mount('src/components/FillBlankQuestionCard.tsx', blankQuestion);
wrongBlank.setAnswer('Βουλή');
assert.ok(id(wrongBlank.render(), 'fill-blank-feedback'), 'wrong response reveals authored answer');
console.log('Spot-mistake and fill-blank cards passed: phrase tap, wrong/correct feedback, text entry, disabled confirmation, parent ownership and locking.');
