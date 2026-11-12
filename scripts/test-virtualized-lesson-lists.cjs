/* Node-only regression checks for the virtualized saved-lesson list; native views mocked. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const jsx = (type, props) => ({ type, props });
const native = {
  FlatList: 'FlatList', Pressable: 'Pressable', Text: 'Text', View: 'View',
  StyleSheet: { create: values => values },
};
function compile(file, imports) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: id => {
    if (id in imports) return imports[id];
    throw Error('Unexpected import ' + file + ': ' + id);
  } });
  return mod.exports;
}
const pathRules = compile('src/utils/lessonPath.ts', {
  '../data/lessonPaths': compile('src/data/lessonPaths.ts', {}),
  './devLessonAccess': { devLessonsUnlocked: () => false },
});
const discovery = compile('src/utils/readingDiscovery.ts', { './lessonPath': pathRules });
const common = {
  '../utils/readingDiscovery': discovery,
  '../utils/lessonPath': pathRules,
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': native,
  '../components/AppBackground': { __esModule: true, default: 'AppBackground' },
  '../components/ProfileSectionHeader': { __esModule: true, default: 'ProfileSectionHeader',
    profileSectionLayout: { horizontal: 18, top: 8, below: 13 } },
  '../components/LessonCard': { __esModule: true, default: 'LessonCard' },
  '../components/ActionButton': { __esModule: true, default: 'ActionButton' },
  'react-native-svg': { __esModule: true, default: 'Svg', Path: 'Path' },
  '../theme': { colors: {} },
};
const SavedLessonsScreen = compile('src/screens/SavedLessonsScreen.tsx', common).default;
const nodes = tree => tree && typeof tree === 'object'
  ? [tree, ...[tree.props?.children, tree.props?.ListHeaderComponent, tree.props?.ListEmptyComponent]
    .flat(Infinity).flatMap(nodes)] : [];
function list(tree, testID, length) {
  const flatList = nodes(tree).find(node => node.type === 'FlatList');
  assert.ok(flatList, testID + ' must virtualize the primary vertical scroll');
  assert.equal(flatList.props.testID, testID);
  assert.equal(flatList.props.data.length, length);
  assert.ok(flatList.props.initialNumToRender > 0 && flatList.props.initialNumToRender < 10);
  assert.ok(flatList.props.windowSize > 0 && flatList.props.windowSize < 10);
  assert.ok(flatList.props.maxToRenderPerBatch > 0 && flatList.props.maxToRenderPerBatch < 10);
  assert.equal(nodes(flatList).filter(node => node.type === 'LessonCard').length, 0,
    'only FlatList may mount image cards');
  return flatList.props;
}
const ids = pathRules.lessonPaths['ancient-greece'];
assert.ok(ids.length >= 20, 'use a genuine long editorial path');
const catalogue = ids.map((id, index) => ({ id, title: `Lesson ${index + 1}`, categoryId: 'history', subcategoryId: 'ancient-greece' }));
const opened = [], removed = [], backs = [];
const base = { completedLessonIds: [ids[0]], inProgressLessonIds: [ids[3]], progressLoaded: true,
  onBack: () => backs.push('back'), onOpenLesson: id => opened.push(id) };
const saved = [catalogue[0], catalogue[4], catalogue[3]];
const savedProps = { ...base, lessons: saved, catalogue: [...catalogue].reverse(), onRemoveSavedLesson: id => removed.push(id) };
const tree = SavedLessonsScreen(savedProps);
assert.equal(tree.props.testID, 'saved-lessons-screen');
assert.ok(nodes(tree).some(node => node.type === 'AppBackground'));
const flat = list(tree, 'saved-lessons-list', saved.length);
const header = nodes(flat.ListHeaderComponent).find(node => node.type === 'ProfileSectionHeader');
assert.equal(header.props.title, 'Αποθηκευμένα');
assert.equal(header.props.actionLabel, '‹ Προφίλ');
header.props.onAction(); assert.deepEqual(backs, ['back']);
assert.deepEqual(Array.from(flat.data, lesson => flat.keyExtractor(lesson)), saved.map(lesson => lesson.id));
const savedRow = flat.renderItem({ item: saved[1], index: 1 });
const card = nodes(savedRow).find(n => n.type === 'LessonCard');
assert.match(card.props.lockedReason, /Lesson 4/, 'saved bookmarks retain editorial prerequisites');
card.props.onPress(); assert.deepEqual(opened, [ids[4]]);
const readingCard = index => nodes(flat.renderItem({ item: saved[index], index }))
  .find(node => node.type === 'LessonCard');
assert.equal(readingCard(0).props.readingState, 'completed');
assert.equal(readingCard(2).props.readingState, 'in-progress');
assert.equal(readingCard(2).props.lockedReason, undefined, 'unfinished lessons remain resumable');
const loading = list(SavedLessonsScreen({ ...savedProps, progressLoaded: false }), 'saved-lessons-list', saved.length);
const loadingCard = nodes(loading.renderItem({ item: saved[0], index: 0 })).find(node => node.type === 'LessonCard');
assert.equal(loadingCard.props.lockedReason, 'Φόρτωση προόδου…');
assert.equal(loadingCard.props.readingState, undefined);
const remove = nodes(savedRow).find(n => n.type === 'Pressable');
assert.ok(remove && nodes(remove).some(n => n.type === 'Text' && n.props.children === 'Αφαίρεση'));
assert.match(remove.props.accessibilityLabel, /Lesson 5/);
remove.props.onPress(); assert.deepEqual(removed, [ids[4]]);
const afterRemove = SavedLessonsScreen({ ...savedProps, lessons: saved.filter(lesson => lesson.id !== ids[4]) });
list(afterRemove, 'saved-lessons-list', 2);
const emptySaved = SavedLessonsScreen({ ...savedProps, lessons: [] });
const empty = list(emptySaved, 'saved-lessons-list', 0);
const back = nodes(empty.ListEmptyComponent).find(n => n.type === 'ActionButton');
assert.equal(back.props.label, 'Επιστροφή στο προφίλ'); back.props.onPress();
assert.deepEqual(backs, ['back', 'back']);
console.log('Saved lesson list passed: bounded rendering, stable keys, prerequisites, resumed access, saved removal, hydration, and empty-state navigation. Native views mocked.');
