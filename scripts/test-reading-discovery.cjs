/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
function compile(file, imports) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: id => {
    if (id in imports) return imports[id]; throw Error('Unexpected import: ' + id);
  } });
  return mod.exports;
}
const discovery = compile('src/utils/readingDiscovery.ts', {});
const catalogue = Object.freeze([
  { id: 'a', categoryId: 'one', subcategoryId: 'topic-a' },
  { id: 'b', categoryId: 'one', subcategoryId: 'topic-a' },
  { id: 'c', categoryId: 'one', subcategoryId: 'topic-b' },
  { id: 'd', categoryId: 'two', subcategoryId: 'topic-c' },
  { id: 'e', categoryId: 'three', subcategoryId: 'topic-d' },
].map(Object.freeze));
const completed = Object.freeze(['a', 'unknown']);
const inProgress = Object.freeze(['c']);
const ids = rows => Array.from(rows, row => row.lesson?.id ?? row.id);
const date = '2026-10-30';
const home = discovery.getHomeDiscovery(catalogue, completed, inProgress, date);
const selected = [home.featured, ...home.suggestions];
assert.equal(new Set(ids(selected)).size, 3);
assert.ok(ids(selected).every(id => !['a', 'c'].includes(id)));
assert.equal(new Set(selected.map(l => l.categoryId)).size, 3, 'Home favours different categories.');
assert.equal(JSON.stringify(home), JSON.stringify(discovery.getHomeDiscovery([...catalogue].reverse(), completed, inProgress, date)), 'Picks must not change because the input order changed.');
assert.notEqual(discovery.getHomeDiscovery(catalogue, [], [], date).featured.id, discovery.getHomeDiscovery(catalogue, [], [], '2026-10-31').featured.id, 'Feature rotates with the Athens date.');
let related = discovery.getRelatedLessons(catalogue[0], catalogue, ['a'], [], date);
assert.deepEqual(ids(related), ['b', 'c']);
assert.equal(related[0].reason, 'same-topic'); assert.equal(related[1].reason, 'same-category');
related = discovery.getRelatedLessons(catalogue[0], catalogue, ['a','b','c'], [], date);
assert.ok(related.every(r => r.reason === 'explore'));
assert.ok(!ids(related).includes('a'), 'Never recommend the article just finished.');
assert.equal(discovery.getRelatedLessons(catalogue[0], catalogue, catalogue.map(l => l.id), [], date).length, 0);
assert.equal(discovery.getHomeDiscovery([], [], [], date).featured, null);
assert.equal(discovery.getHomeDiscovery(catalogue, catalogue.map(l => l.id), [], date).suggestions.length, 0);
assert.equal(discovery.getReadingState('a', ['a'], ['a']), 'in-progress', 'A replay remains resumable.');
assert.equal(discovery.getReadingState('b', ['a'], []), 'unread');
assert.equal(discovery.getHomeDiscovery([catalogue[0], catalogue[0]], [], [], date).suggestions.length, 0);
assert.equal(discovery.getHomeDiscovery(catalogue, [], [], 'bad-date').featured !== null, true);

// Exercise the public search UI with mocked hooks/native views; no native device.
let slots = [], cursor = 0;
const jsx = (type, props) => ({ type, props });
const search = compile('src/screens/SearchScreen.tsx', {
  '../utils/readingDiscovery': discovery,
  react: { useMemo: fn => fn(), useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; } },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Keyboard: { dismiss() {} }, View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', TextInput: 'Input', StyleSheet: { create: s => s } },
  '../components/AppHeader': { __esModule: true, default: 'Header' },
  '../components/LessonCard': { __esModule: true, default: 'Card' },
  '../theme': { colors: {} },
});
const articles = catalogue.map((l, i) => ({ ...l, title: i === 0 ? 'Κόσμος' : 'Δοκιμή', summary: '', intro: '', sections: [], sources: [] }));
const props = { lessons: articles, categories: [{ id: 'one', title: 'Πρώτη' }, { id: 'two', title: 'Δεύτερη' }], subcategories: [], completedLessonIds: ['a'], inProgressLessonIds: ['c'], progressLoaded: true, onBack() {}, onOpenLesson() {} };
const render = () => { cursor = 0; return search.default(props); };
const nodes = t => t && typeof t === 'object' ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
const cards = t => nodes(t).filter(n => n.type === 'Card');
const press = (t, text) => { const n = nodes(t).find(n => n.type === 'Pressable' && nodes(n).some(x => x.type === 'Text' && x.props.children === text)); assert.ok(n, text); n.props.onPress(); };
let tree = render(); assert.equal(cards(tree).length, 5);
press(tree, 'Πρώτη'); tree = render(); assert.equal(cards(tree).length, 3);
press(tree, 'Σε εξέλιξη'); tree = render(); assert.deepEqual(cards(tree).map(c => c.props.lesson.id), ['c']);
press(tree, 'Ολοκληρωμένα'); tree = render(); assert.deepEqual(cards(tree).map(c => c.props.lesson.id), ['a']);
nodes(tree).find(n => n.type === 'Input').props.onChangeText('κοσμοσ'); tree = render(); assert.equal(cards(tree).length, 1, 'Greek accents and final sigma are normalized.');
press(tree, 'Δεύτερη'); tree = render(); assert.equal(cards(tree).length, 0);
press(tree, 'Εμφάνιση όλων των μαθημάτων'); tree = render(); assert.equal(cards(tree).length, 5, 'Reset clears query and both filters.');
console.log('Discovery checks passed: rotation, unread selection, topic ranking, diversity, no duplicates, replay state, empty/exhausted catalogues, combined search filters and reset. Mocked search UI.');
