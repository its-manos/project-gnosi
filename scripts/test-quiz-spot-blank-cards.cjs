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
  let states = [], refs = [], cursor = 0, refCursor = 0;
  const react = {
    useState: initial => {
      const position = cursor++;
      if (!(position in states)) states[position] = typeof initial === 'function' ? initial() : initial;
      return [states[position], value => { states[position] = typeof value === 'function' ? value(states[position]) : value; }];
    },
    useEffect: () => {},
    useRef: initial => {
      const position = refCursor++;
      if (!(position in refs)) refs[position] = { current: initial };
      return refs[position];
    },
  };
  const imports = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Pressable: 'Pressable', Text: 'Text', TextInput: 'TextInput', Keyboard: { dismiss: () => {} }, View: 'View',
      StyleSheet: { create: x => x } },
    '../play/motion': { AnswerMotion: 'AnswerMotion' },
    '../quiz/engine': engine.exports,
    '../theme': { colors },
    './QuizReveal': { __esModule: true, default: 'QuizReveal' },
    './QuestionFeedbackPanel': { __esModule: true, default: 'QuestionFeedbackPanel', AnswerSummaryText: 'AnswerSummaryText' },
  };
  const sharedModule = { exports: {} };
  vm.runInNewContext(transpile('src/components/questionCardStyles.ts'), {
    module: sharedModule, exports: sharedModule.exports,
    require: name => {
      if (name === 'react-native') return imports['react-native'];
      if (name === '../theme') return imports['../theme'];
      throw Error('unexpected shared style import ' + name);
    },
  });
  imports['./questionCardStyles'] = sharedModule.exports;
  const module = { exports: {} };
  vm.runInNewContext(transpile(file), { module, exports: module.exports,
    require: name => { if (!(name in imports)) throw Error('unexpected import ' + name); return imports[name]; } });
  const Component = module.exports.default;
  const submitted = [];
  let props = { question, questionNumber: 4, onSubmit: value => submitted.push(value) };
  return { render: () => { cursor = 0; refCursor = 0; return Component(props); },
    setAnswer: answer => { props = { ...props, answer }; }, submitted,
    sharedStyles: sharedModule.exports.questionCardStyles };
}
const mistakeQuestion = {
  id: 'mistake', version: '1', type: 'spot-the-mistake', prompt: 'Η Βουλή των Πεντακοσίων',
  explanation: 'Η θητεία δεν ήταν ισόβια.', content: {
    options: [
      { id: 'a', text: 'Αποτελούνταν από 500 πολίτες.' },
      { id: 'b', text: 'Τα μέλη της υπηρετούσαν ισόβια.' },
      { id: 'c', text: 'Προετοίμαζε θέματα για την Εκκλησία του Δήμου.' },
      { id: 'd', text: 'Τα μέλη επιλέγονταν κυρίως με κλήρωση.' },
    ],
    incorrectOptionId: 'b', correction: 'Η θητεία ήταν ετήσια.' },
};
const spot = mount('src/components/SpotMistakeQuestionCard.tsx', mistakeQuestion);
let tree = spot.render();
assert.equal(id(tree, 'spot-mistake-subject').props.children[0], 'Η Βουλή των Πεντακοσίων', 'subject is rendered before options');
assert.equal(id(tree, 'spot-mistake-card').props.style.backgroundColor, spot.sharedStyles.card.backgroundColor,
  'spot-mistake uses the exact shared card background');
assert.equal(id(tree, 'spot-mistake-card').props.style.borderColor, spot.sharedStyles.card.borderColor);
assert.equal(id(tree, 'spot-mistake-subject').props.style[0].fontSize, spot.sharedStyles.question.fontSize,
  'subject heading uses the same default font size as the other quiz cards');
assert.equal(id(tree, 'spot-mistake-option-a').props.style({ pressed: false })[0].fontSize, undefined,
  'answer tile is a container, not a custom text style');
const spotAnswerText = nodes(id(tree, 'spot-mistake-option-a')).find(n =>
  n.type === 'Text' && n.props.children === mistakeQuestion.content.options[0].text);
assert.equal(spotAnswerText.props.style[0].fontSize, spot.sharedStyles.answerText.fontSize,
  'spot-mistake options use the shared answer text typography');
assert.equal(id(tree, 'spot-mistake-option-d').props.accessibilityRole, 'radio', 'four standalone radio choices appear');
assert.equal(id(tree, 'spot-mistake-confirm').props.disabled, true, 'cannot confirm without selecting a claim');
assert.equal(id(tree, 'spot-mistake-feedback'), undefined);
id(tree, 'spot-mistake-option-a').props.onPress();
assert.deepEqual(spot.submitted, [], 'tapping a claim must not submit a scored answer');
tree = spot.render();
assert.equal(id(tree, 'spot-mistake-option-a').props.accessibilityState.selected, true);
assert.equal(id(tree, 'spot-mistake-confirm').props.disabled, false);
id(tree, 'spot-mistake-option-b').props.onPress();
tree = spot.render();
assert.equal(id(tree, 'spot-mistake-option-a').props.accessibilityState.selected, false,
  'changing a draft clears the previous claim');
assert.equal(id(tree, 'spot-mistake-option-b').props.accessibilityState.selected, true);
assert.deepEqual(spot.submitted, [], 'changing the selection is still draft-only');
id(tree, 'spot-mistake-option-a').props.onPress();
tree = spot.render();
id(tree, 'spot-mistake-confirm').props.onPress();
id(tree, 'spot-mistake-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(spot.submitted)), ['a'],
  'confirmation submits the stable claim ID once, even on a rapid double tap');
assert.equal(id(tree, 'spot-mistake-feedback'), undefined, 'reveal waits for the parent-owned answer');
tree = spot.render();
assert.equal(id(tree, 'spot-mistake-confirm').props.disabled, true, 'pending confirmation locks the card');
spot.setAnswer('a');
tree = spot.render();
assert.equal(id(tree, 'spot-mistake-confirm'), undefined, 'submitted answer hides confirmation');
assert.ok(id(tree, 'spot-mistake-feedback'), 'wrong answer reveals correct segment and correction');
assert.equal(id(tree, 'spot-mistake-option-b').props.disabled, true);
const spotCorrect = mount('src/components/SpotMistakeQuestionCard.tsx', mistakeQuestion);
spotCorrect.setAnswer('b');
assert.ok(id(spotCorrect.render(), 'spot-mistake-feedback'), 'correct response also explains the sentence');
const blankQuestion = {
  id: 'blank', version: '1', type: 'fill-in-the-blank', prompt: 'Συμπλήρωσε:',
  explanation: 'Η συνέλευση των πολιτών.', content: {
    before: 'Η συνέλευση ονομαζόταν', after: '.',
    options: [
      { id: 'council', text: 'Βουλή των Πεντακοσίων' },
      { id: 'assembly', text: 'Εκκλησία του Δήμου' },
      { id: 'court', text: 'Ηλιαία' },
      { id: 'areopagus', text: 'Άρειος Πάγος' },
    ],
    correctOptionId: 'assembly',
  },
};
const blank = mount('src/components/FillBlankQuestionCard.tsx', blankQuestion);
tree = blank.render();
assert.equal(id(tree, 'fill-blank-card').props.style.backgroundColor, blank.sharedStyles.card.backgroundColor,
  'fill-blank shares the same outer card surface');
assert.equal(id(tree, 'fill-blank-confirm').props.disabled, true, 'confirmation requires a selected tile');
assert.ok(id(tree, 'fill-blank-slot'), 'the empty slot is visible');
assert.equal(id(tree, 'fill-blank-input'), undefined, 'no keyboard or text field');
assert.equal(id(tree, 'fill-blank-option-assembly').props.accessibilityRole, 'button');
assert.equal(id(tree, 'fill-blank-option-assembly').props.accessibilityState.selected, false);
id(tree, 'fill-blank-option-council').props.onPress();
tree = blank.render();
assert.equal(id(tree, 'fill-blank-option-council').props.accessibilityState.selected, true);
assert.equal(id(tree, 'fill-blank-confirm').props.disabled, false);
assert.deepEqual(blank.submitted, [], 'tapping a choice alone never scores or plays the accepted-answer cue');
id(tree, 'fill-blank-option-assembly').props.onPress();
tree = blank.render();
assert.equal(id(tree, 'fill-blank-option-council').props.accessibilityState.selected, false, 'a different tile replaces the draft');
assert.equal(id(tree, 'fill-blank-option-assembly').props.accessibilityState.selected, true);
assert.ok(nodes(id(tree, 'fill-blank-slot')).some(n => n.props?.children === 'Εκκλησία του Δήμου'),
  'the chosen phrase is inserted into the sentence');
id(tree, 'fill-blank-confirm').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(blank.submitted)), ['assembly'], 'submit only the stable choice ID');
assert.equal(id(tree, 'fill-blank-feedback'), undefined, 'feedback waits for parent-accepted answer');
blank.setAnswer('assembly');
tree = blank.render();
assert.ok(id(tree, 'fill-blank-feedback'));
assert.equal(id(tree, 'fill-blank-confirm'), undefined);
assert.equal(id(tree, 'fill-blank-option-assembly'), undefined, 'scored choices collapse to the sentence');
assert.equal(id(tree, 'fill-blank-option-council'), undefined, 'no redundant locked option rows');
assert.ok(id(tree, 'fill-blank-slot'), 'chosen phrase remains in the completed sentence');
const wrongBlank = mount('src/components/FillBlankQuestionCard.tsx', blankQuestion);
wrongBlank.setAnswer('council');
tree = wrongBlank.render();
assert.ok(id(tree, 'fill-blank-feedback'), 'wrong tile reveals the correct authored choice');
assert.equal(id(tree, 'fill-blank-option-assembly'), undefined);
assert.equal(id(tree, 'fill-blank-feedback').props.solution.props.children,
  'Εκκλησία του Δήμου', 'incorrect answer reveals the authored correct phrase');
const blankSrc = fs.readFileSync(path.join(root, 'src/components/FillBlankQuestionCard.tsx'), 'utf8');
assert.doesNotMatch(blankSrc, /question\.prompt\}/, 'the sentence replaces a redundant prompt');
assert.doesNotMatch(blankSrc, /styles\.wordBankHeading|styles\.footHint|styles\.passageHeading/,
  'no duplicate instructions or headings above the choices');
assert.ok(nodes(id(tree, 'fill-blank-sentence')).some(n => n.type === 'View'),
  'the source sentence retains its distinct readable blank');
console.log('Spot-mistake and word-bank cards passed: draft/confirmation locks, one-shot scoring, compact sentence-first layout and corrected feedback.');
