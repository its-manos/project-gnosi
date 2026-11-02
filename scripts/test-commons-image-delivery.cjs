/* Node-only: Wikimedia thumbnail CDN compliance and resilient native image fallback. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const transpile = (p, jsx = false) => ts.transpileModule(
  fs.readFileSync(path.join(root, p), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: jsx ? ts.JsxEmit.ReactJSX : undefined } },
).outputText;
const moduleFrom = (p, imports, jsx = false) => {
  const mod = { exports: {} };
  vm.runInNewContext(transpile(p, jsx),
    { module: mod, exports: mod.exports, console, require: id => {
      if (id in imports) return imports[id];
      throw new Error('Unmocked dependency ' + id);
    } });
  return mod.exports;
};
const { remoteImageCandidates } = moduleFrom('src/utils/commonsImage.ts', {});
const commons = 'https://commons.wikimedia.org/wiki/Special:FilePath/Athens%20Acropolis%20Museum%20Excavation.jpg?width=1200';
const expected = 'https://commons.wikimedia.org/wiki/Special:FilePath/Athens%20Acropolis%20Museum%20Excavation.jpg?width=960';
const direct = remoteImageCandidates(commons);
assert.equal(direct.length, 2);
assert.equal(direct[0].uri, expected, 'nonstandard 1200px is replaced at request time');
assert.ok(direct[1].uri.includes('/w/index.php?title=Special:Redirect/file/'), 'documented Commons fallback');
assert.ok(direct[1].uri.endsWith('&width=960'));
assert.ok(direct.every(x => x.headers['User-Agent'].includes('GnosiMobile/1.0')));
const svg = remoteImageCandidates('https://commons.wikimedia.org/wiki/Special:FilePath/Human%20photoreceptor%20distribution.svg?width=1200');
assert.ok(svg.every(x => x.uri.includes('width=960')), 'SVG thumbnail requests use standard bucket too');
const regular = 'https://example.org/image.png?width=1200';
assert.equal(remoteImageCandidates(regular).length, 1);
assert.equal(remoteImageCandidates(regular)[0].uri, regular, 'third party URLs not rewritten');
const empty = remoteImageCandidates('https://commons.wikimedia.org/wiki/Special:FilePath/');
assert.equal(empty.length, 1);
assert.equal(empty[0].uri, 'https://commons.wikimedia.org/wiki/Special:FilePath/', 'empty file path untouched');
const jsx = (type, props) => ({ type, props });
const native = {
  View: 'View', Text: 'Text', Image: 'Image', ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: styles => styles, absoluteFill: { position: 'absolute' } },
};
let states = [], cursor = 0, warnings = [];
const react = { useState: initial => {
  const n = cursor++;
  if (!(n in states)) states[n] = initial;
  return [states[n], value => {
    states[n] = typeof value === 'function' ? value(states[n]) : value;
  }];
} };
const bundled = { 'https://example.org/local.png': 99 };
const { default: ResilientImage } = moduleFrom('src/components/ResilientImage.tsx', {
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
  'react-native': native,
  'expo-image': { Image: 'Image' },
  '../theme': { colors: { accent: '#abc', accentLight: '#def', surfaceSoft: '#123', textMuted: '#456', border: '#789' } },
  '../data/bundledLessonImages': { bundledLessonImages: bundled },
  '../utils/commonsImage': { remoteImageCandidates },
  '../utils/imageCdn': { imageCdnUrl: () => null },
}, true);
const nodes = root => root && typeof root === 'object'
  ? [root, ...[root.props?.children].flat(Infinity).flatMap(nodes)] : [];
const render = uri => {cursor = 0;return ResilientImage({uri,style:{width:300,height:200}})};
// The JSX mock represents function components as nodes; it does not automatically
// render them. Expand the placeholder explicitly before asserting native labels.
const placeholders = tree => nodes(tree)
  .filter(node => typeof node.type === 'function' && node.type.name === 'ImageStatusPlaceholder')
  .map(node => node.type(node.props));
const originalWarn = console.warn;
try {
  console.warn = (...args) => warnings.push(args);
  let tree = render(commons), img = nodes(tree).find(x => x.type === 'Image');
  assert.equal(img.props.source.uri, expected);
  assert.equal(img.props.accessibilityLabel, undefined);
  img.props.onError({ error: '403' });
  assert.equal(warnings.length, 0, 'first error retries without premature user-facing failure');
  tree = render(commons); img = nodes(tree).find(x => x.type === 'Image');
  assert.ok(img.props.source.uri.includes('Special:Redirect/file/'), 'next render uses alternative endpoint');
  img.props.onLoad({ source: { width: 960, height: 700 } });
  tree = render(commons);
  assert.equal(placeholders(tree).length, 0, 'fallback success removes placeholder');
  // Separate failed image, both sources exhausted: visible error state.
  states = [];
  tree = render(commons); img = nodes(tree).find(x => x.type === 'Image');
  img.props.onError({error:'403'});
  tree = render(commons); img = nodes(tree).find(x => x.type === 'Image');
  img.props.onError({error:'403'});
  tree = render(commons);
  assert.equal(warnings.length, 1, 'warn only after the final attempt');
  const errors = placeholders(tree);
  assert.equal(errors.length, 1, 'final failure renders the error placeholder component');
  assert.equal(errors[0].type, 'View', 'placeholder resolves to a native View');
  assert.equal(errors[0].props.accessibilityLabel, 'Η εικόνα δεν είναι διαθέσιμη', 'explicit error placeholder');
  assert.ok(nodes(errors[0]).some(x => x.type === 'Text' && x.props?.children === 'Η εικόνα δεν είναι διαθέσιμη'), 'fallback also displays readable text');
  // Local image MUST never become a network request.
  states = [];
  tree = render('https://example.org/local.png');
  img = nodes(tree).find(x => x.type === 'Image');
  assert.equal(img.props.source, 99, 'bundled image always wins');
  img.props.onError({error:'bad local asset'});
  tree = render('https://example.org/local.png');
  assert.equal(warnings.length, 2, 'bundled asset fails once, no remote retry');
  // New URL must start fresh instead of inheriting the failed URI state.
  tree = render(commons);
  img = nodes(tree).find(x => x.type === 'Image');
  assert.equal(img.props.source.uri, expected, 'URI changes reset derived attempt index');
} finally { console.warn = originalWarn; }
console.log('Commons image delivery passed: standard 960px buckets, UA, redirect retry, local priority, error placeholders, URI reset (native Image mocked).');
