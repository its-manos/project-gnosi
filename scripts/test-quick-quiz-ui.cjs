const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { emptyQuickQuiz, startQuickQuiz } = load('src/quiz/quickQuiz.ts');

const jsx = (type, props) => ({ type, props });
const nodes = tree => tree && typeof tree === 'object'
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const text = tree => typeof tree === 'string' || typeof tree === 'number' ? String(tree)
  : Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : '';
let slots, cursor, effects, dirty, progress, updates, failSave, homes, retries, feedback, cues;
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], next => {
      const value = typeof next === 'function' ? next(slots[index]) : next;
      if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
    }];
  },
  useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
  useEffect(callback, deps) {
    const index = cursor++, previous = slots[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous[i]))) {
      slots[index] = deps;
      effects.push(callback);
    }
  },
};
const native = {
  View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', ActivityIndicator: 'Spinner',
  StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
  BackHandler: { addEventListener: () => ({ remove() {} }) },
};
const stubs = Object.fromEntries(['GameXpStatus', 'ActionButton', 'ProfileSectionHeader', 'AppBackground',
  'DailyMissionMap', 'DailyJourneyTrack', 'QuizReveal', 'QuestionStageFooter', 'SingleChoiceQuestionCard', 'SourceLink']
  .map(name => ['../components/' + name, { __esModule: true, default: name }]));
const flowStyles = load('src/components/quizFlowStyles.ts', {
  'react-native': native, './ProfileSectionHeader': { profileSectionLayout: { horizontal: 18, top: 8, below: 13 } },
});
const Screen = load('src/screens/QuickQuizScreen.tsx', {
  react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native, ...stubs,
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 21 }) },
  '../components/quizFlowStyles': flowStyles,
  '../hooks/useAdaptiveQuestionScroll': { useAdaptiveQuestionScroll: () => ({ scrollEnabled: false }) },
  '../hooks/useQuestionStageAction': { useQuestionStageAction: () => ({
    action: { label: 'Επιβεβαίωση →', disabled: true, onPress() {} }, onActionChange() {},
  }) },
  '../play/events': { emitPlayFeedback: event => feedback.push(event) },
  '../play/soundStatus': { requestPracticeCue: kind => cues.push(kind) },
}).default;
const game = {
  get progress() { return progress; }, busy: false, error: null,
  async update(change) {
    updates++;
    if (failSave) { game.error = 'save'; throw Error('save'); }
    const next = change(progress);
    if (next === progress) return null;
    progress = next;
    game.error = null;
    return { ...next, creditedXP: 2 };
  }, retryLoad() { retries++; },
};
function reset(saved = emptyQuickQuiz()) {
  slots = []; progress = saved; updates = homes = retries = 0;
  effects = []; feedback = []; cues = []; failSave = false; game.busy = false; game.error = null;
}
function render() {
  let tree, attempts = 0;
  do {
    cursor = 0; effects = []; dirty = false;
    tree = Screen({ game, scope: 'guest', preferredTopicIds: ['science'], onHome() { homes++; } });
    effects.forEach(effect => effect());
    assert.ok(++attempts < 10, 'effects settle without a render loop');
  } while (dirty);
  return tree;
}
const byType = (tree, type) => nodes(tree).find(node => node.type === type);
const action = (tree, label) => nodes(tree).find(node => node.type === 'ActionButton' && node.props.label === label);
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  reset();
  let tree = render();
  assert.ok(nodes(tree).some(node => node.props?.testID === 'quick-quiz-intro'));
  assert.ok(text(tree).includes('5 στάσεις γνώσης.'));
  assert.equal(byType(tree, 'DailyMissionMap').props.variant, 'quick');
  assert.equal(updates, 0, 'opening the intro never deals or saves a round');
  assert.deepEqual(cues, [], 'intro is silent');
  assert.equal(byType(tree, 'QuestionStageFooter'), undefined);
  byType(tree, 'ProfileSectionHeader').props.onAction();
  assert.equal(homes, 1, 'intro retains its Home action');

  failSave = true;
  action(tree, 'Ξεκίνα τον γύρο →').props.onPress(); await flush(); tree = render();
  assert.equal(progress.round, null, 'a failed start preserves stored progress');
  assert.ok(nodes(tree).some(node => node.props?.testID === 'quick-quiz-intro'));
  assert.ok(text(tree).includes('δεν αποθηκεύτηκε'));
  failSave = false;
  action(tree, 'Ξεκίνα τον γύρο →').props.onPress(); await flush(); tree = render();
  assert.equal(progress.round.questions.length, 5);
  assert.equal(byType(tree, 'DailyJourneyTrack').props.variant, 'quick');
  assert.equal(byType(tree, 'QuestionStageFooter').props.bottomInset, 21);
  assert.equal(byType(tree, 'QuestionStageFooter').props.action.disabled, true);
  assert.equal(byType(tree, 'SingleChoiceQuestionCard').props.onActionChange instanceof Function, true);
  assert.deepEqual(cues, ['question-open']);

  for (let index = 0; index < 5; index++) {
    const card = byType(tree, 'SingleChoiceQuestionCard');
    const correct = card.props.correctIndex;
    await card.props.onConfirm(index === 2 ? (correct + 1) % 4 : correct);
    tree = render();
    assert.equal(byType(tree, 'SingleChoiceQuestionCard').props.answer,
      index === 2 ? (correct + 1) % 4 : correct, 'saved answers stay parent-owned');
    const footer = byType(tree, 'QuestionStageFooter');
    assert.equal(footer.props.action.label, index === 4 ? 'Δες το αποτέλεσμα →' : 'Επόμενη ερώτηση →');
    const mainScroll = byType(tree, 'ScrollView');
    assert.ok(!nodes(mainScroll).includes(footer), 'question action stays outside the scrolling content');
    if (index === 0) {
      const saved = progress;
      reset(saved); tree = render();
      assert.equal(updates, 0, 'returning to an unfinished round never starts a replacement');
      assert.equal(byType(tree, 'SingleChoiceQuestionCard').props.answer, correct);
    }
    byType(tree, 'QuestionStageFooter').props.action.onPress(); await flush(); tree = render();
  }
  assert.ok(nodes(tree).some(node => node.props?.testID === 'quick-quiz-results'));
  assert.ok(text(tree).includes('4 / 5') && text(tree).includes('80%'));
  assert.equal(byType(tree, 'ProfileSectionHeader').props.title, 'Αποτέλεσμα');
  assert.equal(byType(tree, 'QuestionStageFooter'), undefined);
  const route = byType(tree, 'DailyJourneyTrack');
  assert.equal(route.props.correctMask.filter(Boolean).length, 4);
  const completed = JSON.stringify(progress);
  nodes(tree).find(node => node.type === 'Pressable' && text(node).includes('Δες τα λάθη')).props.onPress();
  tree = render();
  assert.equal(nodes(tree).filter(node => node.type === 'SingleChoiceQuestionCard').length, 1);
  assert.equal(byType(tree, 'QuestionStageFooter'), undefined);
  assert.equal(JSON.stringify(progress), completed, 'review never changes answers or rewards');
  byType(tree, 'ProfileSectionHeader').props.onAction(); tree = render();
  assert.ok(action(tree, 'Νέος γύρος →'));
  game.busy = true; tree = render();
  assert.equal(action(tree, 'Νέος γύρος →').props.disabled, true, 'saving guards the next-round action');
  game.busy = false;

  const finished = progress;
  reset(finished); tree = render();
  assert.ok(nodes(tree).some(node => node.props?.testID === 'quick-quiz-intro'));
  assert.equal(updates, 0, 'reopening after completion waits for an explicit new-round action');
  assert.equal(JSON.stringify(progress), JSON.stringify(finished));
  reset(null); game.error = 'load'; tree = render();
  action(tree, 'Δοκίμασε ξανά').props.onPress(); assert.equal(retries, 1);

  const componentStubs = { react: { memo: component => component },
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native };
  const Map = load('src/components/DailyMissionMap.tsx', componentStubs).default;
  const map = Map({ variant: 'quick' });
  assert.equal(nodes(map).filter(node => /^quick-route-station-/.test(node.props?.testID ?? '')).length, 5);
  for (const tier of ['2 εύκολες', '2 μεσαίες', '1 δύσκολη']) assert.ok(text(map).includes(tier));
  const Track = load('src/components/DailyJourneyTrack.tsx', componentStubs).default;
  const track = Track({ variant: 'quick', mode: 'result', correctMask: [true, true, false, true, true] });
  const announcement = nodes(track).find(node => node.props?.accessibilityRole === 'progressbar');
  assert.equal(announcement.props.accessibilityValue.max, 5);
  assert.match(announcement.props.accessibilityLabel, /4 σωστές, 1 λανθασμένες/);
  console.log('Quick Quiz UI passed: explicit intro/start, saved resume, save retry, shared five-stop question/result layout, fixed action footer, frozen review and loading states. Native views mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
