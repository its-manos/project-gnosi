/* Inline lesson question card UI contract (native views mocked, no real-device rendering). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const jsx = (type, props) => ({ type, props: props ?? {} });
const themeModule = { exports: {} };
vm.runInNewContext(compile('src/theme.ts'), { module: themeModule, exports: themeModule.exports });
const { colors, reading } = themeModule.exports;
const imports = {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } },
  '../play/motion': { AnswerMotion: 'AnswerMotion' },
  '../theme': { colors, reading },
  './QuizReveal': { __esModule: true, default: 'QuizReveal' },
  './ReportContentButton': { __esModule: true, default: 'ReportContentButton' },
};
const mod = { exports: {} };
vm.runInNewContext(compile('src/components/InlineQuestionCard.tsx'), {
  module: mod, exports: mod.exports,
  require: id => {
    if (!(id in imports)) throw Error('unexpected component import: ' + id);
    return imports[id];
  },
});
const Card = mod.exports.default;
function nodes(tree) {
  if (tree === null || tree === undefined || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
const byId = (tree, testID) => nodes(tree).find(n => n.props?.testID === testID);
const flatStyles = (n, pressed = false) => {
  const raw = typeof n.props.style === 'function' ? n.props.style({ pressed }) : n.props.style;
  return Object.assign({}, ...[raw].flat(Infinity).filter(Boolean));
};
const question = {
  question: 'Ποιο όργανο συγκέντρωνε τους πολίτες στην αρχαία Αθήνα;',
  answers: ['Η Βουλή των Πεντακοσίων', 'Η Εκκλησία του Δήμου', 'Ο Άρειος Πάγος', 'Η Ηλιαία'],
  correctIndex: 1,
  explanation: 'Στην Εκκλησία του Δήμου συμμετείχαν οι πολίτες που είχαν πολιτικά δικαιώματα.',
};
const reportTarget = { itemId: 'ancient-athens', questionIndex: 0 };
const events = [];
const props = { question, questionNumber: 2, selectedAnswer: undefined, combo: 0, readingSize: 22,
  reportTarget, onSelectAnswer: (...args) => events.push(args) };

let tree = Card(props);
assert.ok(byId(tree, 'lesson-question-card'));
assert.equal(byId(tree, 'lesson-question-feedback'), undefined, 'no answer reveal before selection');
assert.equal(nodes(tree).filter(n => n.type === 'Pressable' && n.props.testID?.startsWith('lesson-question-option-')).length, 4);
for (let i = 0; i < 4; i++) {
  const option = byId(tree, `lesson-question-option-${i}`);
  assert.equal(option.props.disabled, false);
  assert.equal(option.props.accessibilityRole, 'button');
  assert.equal(option.props.accessibilityState.selected, false);
  assert.equal(flatStyles(option).borderColor, reading.border, 'unanswered options use shared reading tokens');
}
assert.equal(nodes(tree).find(n => n.type === 'ReportContentButton').props.target, reportTarget, 'report keeps canonical checkpoint target');
const header = nodes(tree).find(n => n.type === 'Text' && n.props.accessibilityRole === 'header');
assert.ok(header, 'question is announced as a header');
assert.equal(header.props.children, question.question);
assert.equal(header.props.style[1].fontSize, 22, 'question respects text size setting');

byId(tree, 'lesson-question-option-0').props.onPress();
assert.deepEqual(JSON.parse(JSON.stringify(events)), [[0, 1]], 'parent owns existing numeric scoring callback');
assert.equal(byId(tree, 'lesson-question-feedback'), undefined, 'feedback waits for parent answer state');
const restoredWrong = Card({ ...props, selectedAnswer: 0, combo: 2 });
const wrong = byId(restoredWrong, 'lesson-question-option-0');
const correct = byId(restoredWrong, 'lesson-question-option-1');
assert.equal(wrong.props.disabled, true, 'answered choices are locked');
assert.equal(correct.props.disabled, true);
assert.equal(wrong.props.accessibilityState.selected, true);
assert.equal(correct.props.accessibilityState.selected, false);
assert.equal(flatStyles(wrong).borderColor, colors.error);
assert.equal(flatStyles(correct).borderColor, colors.success);
assert.ok(byId(restoredWrong, 'lesson-question-feedback'), 'wrong answer shows explanation');
assert.ok(byId(restoredWrong, 'lesson-question-correction'), 'wrong answer explicitly shows correct choice');
assert.equal(byId(restoredWrong, 'lesson-question-correction').props.children, question.answers[1]);
wrong.props.onPress();
assert.equal(events.length, 1, 'restored locked cards do not resubmit');
assert.ok(nodes(restoredWrong).some(n => n.type === 'Text' && n.props.children === '✦  ΣΕΡΙ 2'),
  'existing combo feedback is preserved');

const restoredCorrect = Card({ ...props, selectedAnswer: 1 });
assert.ok(byId(restoredCorrect, 'lesson-question-feedback'));
assert.equal(byId(restoredCorrect, 'lesson-question-correction'), undefined,
  'no redundant correction after correct answer');
assert.equal(flatStyles(byId(restoredCorrect, 'lesson-question-option-1')).borderColor, colors.success);
assert.ok(!nodes(restoredCorrect).some(n => n.type === 'Text' && typeof n.props.children === 'string' && n.props.children.includes('ΣΕΡΙ')),
  'no streak badge when combo is not greater than one');
const noReport = Card({ ...props, reportTarget: undefined });
assert.equal(nodes(noReport).some(n => n.type === 'ReportContentButton'), false);

const source = fs.readFileSync(path.join(root, 'src/components/InlineQuestionCard.tsx'), 'utf8');
for (const forbidden of ['emitPlayFeedback', 'commitRecord', 'AsyncStorage', 'supabase', 'setCheckpointAnswers']) {
  assert.equal(source.includes(forbidden), false, `presentational card must not mutate progress: ${forbidden}`);
}
console.log('Inline lesson question card passed: answer layout, text scaling, palette, parent scoring, report, locked restore, correct/wrong reveal and streak.');
