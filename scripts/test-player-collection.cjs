const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { playerTrophies } = load('src/gamification/trophies.ts');
let open = false;
const jsx = (type, props) => ({ type, props });
const { default: Collection } = load('src/components/PlayerCollection.tsx', {
  react: { useState: () => [open, value => { open = value; }] },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Modal: 'Modal', Pressable: 'Button', ScrollView: 'Scroll', Text: 'Text', View: 'View', StyleSheet: { create: x => x } },
  'react-native-svg': { __esModule: true, default: 'Svg', Circle: 'Circle', Path: 'Path' },
  './ProgressTrack': { __esModule: true, default: 'ProgressTrack' },
  './PlayerCharacter': { __esModule: true, default: 'Character' },
});
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const trophies = playerTrophies({ lessons: 15, worlds: 3, daily: 7, streak: 7, revision: 0, hangman: 0 });
let chosen;
const props = { trophies, ready: true, level: 5, variant: 'female', onChooseVariant: async value => { chosen = value; return true; } };
(async () => {
let tree = Collection(props);
assert.equal(nodes(tree).filter(n => n.type === 'Modal').length, 0, 'Closed gallery does not mount its images/tiles');
const button = nodes(tree).find(n => n.props?.accessibilityLabel === 'Όλες οι διακρίσεις');
button.props.onPress();
tree = Collection(props);
assert.equal(nodes(tree).filter(n => n.type === 'Modal').length, 1);
assert.equal(nodes(tree).filter(n => n.props?.trophy).length, 28, '24 collection tiles, 3 showcase tiles and next goal icon');
nodes(tree).find(n => n.type === 'Modal').props.onRequestClose();
assert.equal(open, false, 'Android back closes collection');
tree = Collection({ ...props, mode: 'character' });
assert.equal(nodes(tree).filter(n => n.type === 'Character').length, 1);
nodes(tree).find(n => n.props?.accessibilityLabel === 'Επίλεξε εμφάνιση χαρακτήρα').props.onPress();
tree = Collection({ ...props, mode: 'character' });
assert.equal(nodes(tree).filter(n => n.type === 'Character').length, 3, 'Only the current class and its two variants mount when opened');
const options = nodes(tree).filter(n => n.props?.accessibilityRole === 'radio');
assert.equal(options.length, 2);
assert.equal(options[1].props.accessibilityState.checked, true);
assert.ok(nodes(tree).filter(n => n.type === 'Character').every(n => n.props.level === 5), 'Never show earlier/later class artwork');
await options[0].props.onPress();
assert.equal(chosen, 'male');
assert.equal(open, false, 'Successful choice closes the picker');
open = true;
tree = Collection({ ...props, mode: 'character', onChooseVariant: async () => false });
await nodes(tree).find(n => n.props?.accessibilityLabel === 'Εμφάνιση 1').props.onPress();
assert.equal(open, true, 'Failed save leaves the picker available for retry');
tree = Collection({ ...props, mode: 'character', saving: true });
assert.ok(nodes(tree).filter(n => n.props?.accessibilityRole === 'radio').every(n => n.props.disabled));
nodes(tree).find(n => n.props?.accessibilityLabel === 'Κλείσιμο συλλογής').props.onPress();
assert.equal(open, false);
tree = Collection({ ...props, ready: false });
assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === 'Όλες οι διακρίσεις').props.disabled, true);
console.log('Player collection discovery, lazy mounting, loading and modal dismissal passed');

})().catch(error => { console.error(error); process.exitCode = 1; });
