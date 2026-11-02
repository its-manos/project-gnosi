/* Node-only regression checks for virtualized lesson lists; native views mocked. */
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
  './devLessonAccess': { devLessonsUnlocked: () => false },
});
const discovery = compile('src/utils/readingDiscovery.ts', { './lessonPath': pathRules });
const common = {
  '../utils/readingDiscovery': discovery,
  '../utils/lessonPath': pathRules,
  '../utils/devLessonAccess': { devLessonsUnlocked: () => false },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': native,
  '../components/AppHeader': { __esModule: true, default: 'AppHeader' },
  '../components/LessonCard': { __esModule: true, default: 'LessonCard' },
  '../components/ActionButton': { __esModule: true, default: 'ActionButton' },
  '../theme': { colors: {} },
};
const SubcategoryScreen = compile('src/screens/SubcategoryScreen.tsx', common).default;
const SavedLessonsScreen = compile('src/screens/SavedLessonsScreen.tsx', common).default;
const nodes = tree => tree && typeof tree === 'object'
  ? [tree, ...[tree.props?.children, tree.props?.ListHeaderComponent, tree.props?.ListEmptyComponent]
    .flat(Infinity).flatMap(nodes)] : [];
function list(tree, testID, length) {
  assert.equal(tree.type, 'FlatList', testID + ' must virtualize the primary vertical scroll');
  assert.equal(tree.props.testID, testID);
  assert.equal(tree.props.data.length, length);
  assert.ok(tree.props.initialNumToRender > 0 && tree.props.initialNumToRender < 10);
  assert.ok(tree.props.windowSize > 0 && tree.props.windowSize < 10);
  assert.ok(tree.props.maxToRenderPerBatch > 0 && tree.props.maxToRenderPerBatch < 10);
  assert.equal(nodes(tree).filter(node => node.type === 'LessonCard').length, 0,
    'only FlatList may mount image cards');
  return tree.props;
}
const ids = pathRules.lessonPaths['ancient-greece'];
assert.ok(ids.length >= 20, 'use a genuine long editorial path');
const catalogue = ids.map((id, index) => ({ id, title: `Lesson ${index + 1}`, categoryId: 'history', subcategoryId: 'ancient-greece' }));
const category = { id: 'history', title: 'Ιστορία' };
const subcategory = { id: 'ancient-greece', title: 'Αρχαία Ελλάδα', description: 'Ιστορική διαδρομή' };
const opened = [], removed = [], backs = [];
const base = { completedLessonIds: [ids[0]], inProgressLessonIds: [ids[3]], progressLoaded: true,
  onBack: () => backs.push('back'), onOpenLesson: id => opened.push(id) };
const props = { ...base, category, subcategory, lessons: [...catalogue].reverse() };
let tree = SubcategoryScreen(props);
let flat = list(tree, 'subcategory-lessons-list', catalogue.length);
assert.deepEqual(Array.from(flat.data, lesson => lesson.id), Array.from(ids), 'editorial path ordering is unchanged');
assert.deepEqual(Array.from(flat.data, lesson => flat.keyExtractor(lesson)), Array.from(ids), 'stable lesson identity');
assert.ok(nodes(tree).some(n => n.type === 'Text' && n.props.children === 'Αρχαία Ελλάδα'));
let first = flat.renderItem({ item: flat.data[0], index: 0 });
assert.equal(first.type, 'LessonCard');
assert.equal(first.props.position, 1);
assert.equal(first.props.lockedReason, undefined, 'first lesson remains available');
first.props.onPress(); assert.deepEqual(opened, [ids[0]]);
let second = flat.renderItem({ item: flat.data[1], index: 1 });
assert.equal(second.props.lockedReason, undefined, 'completed predecessor unlocks the next');
let fourth = flat.renderItem({ item: flat.data[3], index: 3 });
assert.equal(fourth.props.lockedReason, undefined, 'existing unfinished lessons remain open');
let fifth = flat.renderItem({ item: flat.data[4], index: 4 });
assert.ok(fifth.props.lockedReason.includes('Lesson 4'));
assert.equal(fifth.props.position, 5);
let beforeHydration = SubcategoryScreen({ ...props, progressLoaded: false });
assert.ok(list(beforeHydration, 'subcategory-lessons-list', catalogue.length)
  .renderItem({ item: flat.data[0], index: 0 }).props.lockedReason.includes('Φόρτωση'));
let empty = SubcategoryScreen({ ...props, subcategory: { id: 'future', title: 'Μελλοντική', description: '' } });
list(empty, 'subcategory-lessons-list', 0);
assert.ok(nodes(empty.props.ListEmptyComponent).some(n => n.type === 'Text' && n.props.children === 'Νέα μαθήματα έρχονται'));

const saved = [catalogue[0], catalogue[4], catalogue[9]];
const savedProps = { ...base, lessons: saved, catalogue, onRemoveSavedLesson: id => removed.push(id) };
tree = SavedLessonsScreen(savedProps);
flat = list(tree, 'saved-lessons-list', saved.length);
assert.deepEqual(Array.from(flat.data, lesson => flat.keyExtractor(lesson)), saved.map(lesson => lesson.id));
const savedRow = flat.renderItem({ item: saved[1], index: 1 });
const card = nodes(savedRow).find(n => n.type === 'LessonCard');
assert.ok(card.props.lockedReason, 'saved bookmark does not bypass path locks');
card.props.onPress(); assert.deepEqual(opened, [ids[0], ids[4]]);
const remove = nodes(savedRow).find(n => n.type === 'Pressable');
assert.ok(remove && nodes(remove).some(n => n.type === 'Text' && n.props.children === 'Αφαίρεση από αποθηκευμένα'));
remove.props.onPress(); assert.deepEqual(removed, [ids[4]]);
const afterRemove = SavedLessonsScreen({ ...savedProps, lessons: saved.filter(lesson => lesson.id !== ids[4]) });
list(afterRemove, 'saved-lessons-list', 2);
const emptySaved = SavedLessonsScreen({ ...savedProps, lessons: [] });
list(emptySaved, 'saved-lessons-list', 0);
const back = nodes(emptySaved.props.ListEmptyComponent).find(n => n.type === 'ActionButton');
assert.equal(back.props.label, 'Επιστροφή στην αρχική'); back.props.onPress();
assert.deepEqual(backs, ['back']);
console.log('Virtualized lesson lists passed: bounded list rendering, stable keys/path order, progress locks, resumed access, saved removal, navigation, hydration and empty states. Native views mocked.');
