/* global __dirname */
// Headless component checks. These do not replace device layout testing.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const jsx = (type, props) => ({ type, props });
const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', ActivityIndicator: 'Spinner', StyleSheet: { create: styles => styles } };
const svg = { __esModule: true, default: 'svg', Circle: 'circle', Defs: 'defs', G: 'g', LinearGradient: 'linearGradient', Path: 'path', Rect: 'rect', Stop: 'stop', Text: 'text' };
let showList = false;
const react = { useMemo: fn => fn(), useState: () => [showList, value => { showList = typeof value === 'function' ? value(showList) : value; }] };
function compile(file, extra = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const imports = { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native, 'react-native-svg': svg, ...extra };
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: id => { if (id in imports) return imports[id]; throw Error(id); } });
  return mod.exports.default;
}
const categories = [
  ['history','Ιστορία','🏛️'], ['science','Επιστήμη & Διάστημα','🚀'], ['nature','Φύση & Ζώα','🌿'],
  ['technology','Τεχνολογία','⚡'], ['culture','Τέχνες & Πολιτισμός','🎨'], ['geography','Γεωγραφία & Κοινωνία','🌍'], ['difficult-history','Ταμπού της Ιστορίας','🕯️'],
].map(([id, title, emoji]) => ({ id, title, emoji }));
const lessons = categories.map((c,i) => ({ id: String(i), categoryId: c.id, title: 'Άρθρο '+i }));
const home = compile('src/screens/HomeScreen.tsx', {
  '../data/lessons': { lessons }, '../theme': { colors: {} },
  '../components/FantasyMap': { __esModule: true, default: 'FantasyMap' },
  '../components/ReadingPick': { __esModule: true, default: 'ReadingPick' },
});
const nodes = t => t && typeof t === 'object' ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
const selected = [];
const props = { categories, featuredLesson: lessons[1], suggestedLessons: lessons.slice(2,4), progressLoaded: true, completedCount: 1, savedCount: 1, inProgressLesson: lessons[0], inProgressAnsweredCount: 1, inProgressQuestionCount: 3, onOpenCategory: id => selected.push(id), onResumeLesson: id => selected.push(id), onStartDailyChallenge: () => selected.push('daily'), onOpenDailyPreferences: () => selected.push('preferences'), onOpenSearch: () => selected.push('search'), onOpenSaved: () => selected.push('saved'), onOpenLesson: id => selected.push(id) };
let tree = home(props);
const direct = tree.props.children;
const exploration = direct.findIndex(n => n?.props?.testID === 'home-exploration');
const secondary = direct.findIndex(n => n?.props?.testID === 'home-secondary-content');
assert.ok(exploration >= 0 && exploration < secondary, 'Exploration must precede all reading/challenge cards.');
assert.ok(!nodes(direct[exploration]).some(n => n.type === 'ReadingPick'));
assert.equal(nodes(direct[secondary]).filter(n => n.type === 'ReadingPick').length, 3);
const press = label => nodes(tree).find(n => n.type === 'Pressable' && n.props.accessibilityLabel === label).props.onPress();
press('Αναζήτηση μαθημάτων'); press('Αποθηκευμένα μαθήματα: 1'); press('Συνέχισε το μάθημα Άρθρο 0');
assert.deepEqual(selected, ['search', 'saved', '0']);
const mapProps = nodes(tree).find(n => n.type === 'FantasyMap').props;
assert.equal(mapProps.overview, true);
const map = compile('src/components/FantasyMap.tsx');
let mapTree = map(mapProps);
const world = nodes(mapTree).find(n => n.type === 'svg');
assert.equal(world.props.viewBox, '0 0 360 416', 'Seven-category overview uses three rows.');
const targets = nodes(mapTree).filter(n => n.type === 'g' && n.props.onPress);
assert.equal(targets.length, 7); targets[6].props.onPress(); assert.equal(selected.at(-1), 'difficult-history');
nodes(mapTree).find(n => n.props?.accessibilityLabel === 'Προβολή ως λίστα').props.onPress();
mapTree = map(mapProps); assert.ok(!nodes(mapTree).some(n => n.type === 'svg'));
assert.equal(nodes(mapTree).filter(n => n.props?.accessibilityHint).length, 7);
nodes(mapTree).find(n => n.props?.accessibilityLabel === 'Προβολή χάρτη').props.onPress();
assert.ok(nodes(map(mapProps)).some(n => n.type === 'svg'));
const detailed = map({ ...mapProps, overview: false });
assert.equal(nodes(detailed).find(n => n.type === 'svg').props.viewBox, '0 0 360 600', 'Detailed map remains unchanged.');
tree = home({ ...props, progressLoaded: false, inProgressLesson: null });
assert.ok(nodes(tree).some(n => n.type === 'FantasyMap'), 'Progress loading must never hide exploration.');
console.log('Home layout checks passed: exploration first, secondary content retained, actions, compact seven-category map, list exclusivity, category selection, detailed map fallback and loading state. Mocked native views.');
// Optional exact SVG export for visual inspection (no screenshot of native views).
if (process.env.GNOSI_MAP_PREVIEW) {
  const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const attrs = { strokeWidth:'stroke-width',strokeOpacity:'stroke-opacity',fillOpacity:'fill-opacity',strokeDasharray:'stroke-dasharray',textAnchor:'text-anchor',fontSize:'font-size',fontWeight:'font-weight',stopColor:'stop-color',strokeLinejoin:'stroke-linejoin' };
  function xml(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (Array.isArray(node)) return node.map(xml).join('');
    if (typeof node !== 'object') return escape(node);
    const properties = Object.entries(node.props).filter(([k,v]) => k !== 'children' && k !== 'accessible' && !k.startsWith('accessibility') && typeof v !== 'function').map(([k,v]) => `${attrs[k]||k}="${escape(v)}"`).join(' ');
    return `<${node.type} ${properties}>${xml(node.props.children)}</${node.type}>`;
  }
  world.props.width=360;world.props.height=416;world.props.xmlns='http://www.w3.org/2000/svg';
  fs.writeFileSync(process.env.GNOSI_MAP_PREVIEW, xml(world));
}
