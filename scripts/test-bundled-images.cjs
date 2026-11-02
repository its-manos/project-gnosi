/* global __dirname */
// Node-only regression coverage for the hybrid bundled/remote lesson image catalogue.
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const cache = new Map();
const assets = [];

function load(file, imports = {}) {
  if (!Object.keys(imports).length && cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, console, require: id => {
    if (id in imports) return imports[id];
    const resolved = path.normalize(path.join(path.dirname(file), id));
    if (/\.(?:jpe?g|png)$/i.test(id)) {
      const filePath = path.resolve(root, resolved);
      assert.ok(filePath.startsWith(path.resolve(root, 'assets') + path.sep), `bundled image stays under assets/: ${resolved}`);
      const bytes = fs.readFileSync(filePath);
      assert.ok(bytes.length > 100, `bundled image contains actual bytes: ${resolved}`);
      if (/\.png$/i.test(id)) {
        assert.ok(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `valid PNG header: ${resolved}`);
        assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `PNG has IHDR: ${resolved}`);
        assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, `PNG has positive dimensions: ${resolved}`);
        assert.equal(bytes.subarray(-8).toString('hex'), '49454e44ae426082', `PNG ends with IEND: ${resolved}`);
      } else {
        assert.ok(bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])), `valid JPEG header: ${resolved}`);
        assert.ok(bytes.includes(Buffer.from([255, 218])), `JPEG has start-of-scan marker: ${resolved}`);
        assert.equal(bytes.subarray(-2).toString('hex'), 'ffd9', `JPEG ends with EOI: ${resolved}`);
      }
      assets.push(resolved);
      return assets.length;
    }
    if (id.startsWith('.')) return load(resolved + (fs.existsSync(path.join(root, resolved + '.ts')) ? '.ts' : '.tsx'));
    throw Error('Unexpected module: ' + id);
  } });
  if (!Object.keys(imports).length) cache.set(file, mod.exports);
  return mod.exports;
}

const { lessons } = load('src/data/lessons.ts');
const { inlineArticleMedia } = load('src/data/articleMedia.ts');
const { bundledLessonImages } = load('src/data/bundledLessonImages.ts');
const { remoteImageCandidates } = load('src/utils/commonsImage.ts');
const commonsPrefix = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const urlIsBundled = url => Object.prototype.hasOwnProperty.call(bundledLessonImages, url);
const covers = lessons.filter(lesson => lesson.coverKind !== 'editorial').map(lesson => lesson.imageUrl);
const figures = Object.values(inlineArticleMedia).flat().map(figure => figure.url);
const urls = [...new Set([...covers, ...figures])];
const bundledUrls = urls.filter(urlIsBundled);
const remoteUrls = urls.filter(url => !urlIsBundled(url));
const originalDiagrams = figures.filter(url => typeof url === 'string' && /^#gnosi-(?:diagram|supplementary)-[a-z0-9-]+$/.test(new URL(url).hash));

function httpsUrl(value, context) {
  assert.equal(typeof value, 'string', `${context}: URL is a string`);
  assert.ok(value && !/[\s\u0000-\u001f\u007f]/.test(value), `${context}: nonempty URL without whitespace/control characters`);
  let parsed;
  assert.doesNotThrow(() => { parsed = new URL(value); }, `${context}: valid URL`);
  assert.equal(parsed.protocol, 'https:', `${context}: HTTPS only`);
  assert.ok(parsed.hostname.includes('.') && !parsed.username && !parsed.password, `${context}: valid host without credentials`);
  assert.ok(parsed.pathname.length > 1, `${context}: URL has a resource path`);
  return parsed;
}

assert.ok(urls.length > 0 && bundledUrls.length > 0 && remoteUrls.length > 0, 'catalogue has both bundled and remote images');
assert.equal(new Set(assets).size, assets.length, 'bundled paths are unique');
assert.equal(assets.length, Object.keys(bundledLessonImages).length, 'each bundle entry resolves to a checked JPEG/PNG');
for (const [url, source] of Object.entries(bundledLessonImages)) {
  httpsUrl(url, 'bundled source key');
  assert.ok(Number.isInteger(source) && source > 0, `bundled source is a native image asset: ${url}`);
}
for (const url of urls) httpsUrl(url, `catalogue image ${url}`);
for (const url of originalDiagrams) {
  assert.ok(urlIsBundled(url), `original Gnosi diagram must remain locally bundled: ${url}`);
}
assert.ok(originalDiagrams.length > 0, 'original Gnosi diagrams are checked');
for (const url of remoteUrls) {
  const parsed = httpsUrl(url, 'remote image');
  const candidates = remoteImageCandidates(url);
  assert.ok(Array.isArray(candidates) && candidates.length >= 1 && candidates.length <= 2, `remote image has a bounded set of candidates: ${url}`);
  for (const [index, candidate] of candidates.entries()) {
    assert.ok(candidate && typeof candidate === 'object', `remote candidate ${index} exists: ${url}`);
    httpsUrl(candidate.uri, `remote candidate ${index} for ${url}`);
  }
  if (url.startsWith(commonsPrefix)) {
    const filename = url.slice(commonsPrefix.length).split(/[?#]/, 1)[0];
    assert.ok(filename, `Commons URL specifies a filename: ${url}`);
    assert.doesNotThrow(() => decodeURIComponent(filename), `Commons filename uses valid percent encoding: ${url}`);
    assert.equal(candidates.length, 2, `Commons image has primary and fallback candidates: ${url}`);
    assert.equal(candidates[0].uri, `${commonsPrefix}${filename}?width=960`, `Commons primary requests standard thumbnail: ${url}`);
    assert.equal(candidates[1].uri, `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${filename}&width=960`, `Commons fallback requests standard thumbnail: ${url}`);
    for (const candidate of candidates) {
      assert.equal(new URL(candidate.uri).hostname, parsed.hostname, `Commons candidates stay on Wikimedia: ${url}`);
      assert.ok(candidate.headers?.['User-Agent']?.includes('GnosiMobile/1.0'), `Commons candidate identifies app: ${url}`);
    }
  } else {
    assert.equal(candidates.length, 1, `non-Commons remote URL has one candidate: ${url}`);
    assert.equal(candidates[0].uri, url, `non-Commons URL stays unchanged: ${url}`);
  }
}

// React hooks are kept across simulated renders, with separate state per test case.
const jsx = (type, props) => ({ type, props });
const native = {
  View: 'View', Image: 'Image', Text: 'Text', ActivityIndicator: 'Spinner',
  StyleSheet: { create: styles => styles, absoluteFill: {} },
};
let slots = [], cursor = 0;
const react = { useState: initial => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
  return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
} };
const Image = load('src/components/ResilientImage.tsx', {
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': native,
  '../data/bundledLessonImages': { bundledLessonImages },
  '../utils/commonsImage': { remoteImageCandidates },
  '../theme': { colors: {} },
}).default;
const nodes = tree => tree && typeof tree === 'object'
  ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
const render = (uri, props = {}) => { cursor = 0; return Image({ uri, ...props }); };
const restart = () => { slots = []; cursor = 0; };
const getImage = tree => nodes(tree).find(node => node.type === 'Image');
const loading = tree => nodes(tree).some(node => node.type === 'Spinner');
const errorPlaceholder = tree => nodes(tree).find(node => typeof node.type === 'function' && node.type.name === 'ImageStatusPlaceholder');
const bundled = bundledUrls.find(url => url.startsWith(commonsPrefix)) ?? bundledUrls[0];
const remoteCommons = remoteUrls.find(url => url.startsWith(commonsPrefix));
assert.ok(remoteCommons, 'at least one catalogue Commons URL uses remote delivery');

// Packaged assets win even when the key is an HTTPS URL.
restart();
let tree = render(bundled), img = getImage(tree);
assert.equal(img.props.source, bundledLessonImages[bundled], 'bundled asset takes priority over network');
assert.ok(loading(tree), 'bundled image starts in loading state');
img.props.onLoad({ nativeEvent: { source: { width: 1200, height: 800 } } });
tree = render(bundled);
assert.ok(!loading(tree) && !errorPlaceholder(tree), 'successful bundled load clears the spinner');

// Switching URLs immediately resets loading and selects the remote Commons candidate.
tree = render(remoteCommons);
img = getImage(tree);
assert.ok(loading(tree), 'changing from bundled to remote restarts loading');
assert.equal(img.props.source.uri, remoteImageCandidates(remoteCommons)[0].uri, 'remote catalogue image uses primary candidate');

// Native dimensions must be positive and finite before being reported (zoom depends on them).
restart();
const measured = [];
tree = render(bundled, { onDimensions: size => measured.push(size) });
getImage(tree).props.onLoad({ nativeEvent: { source: { width: 1200, height: 800 } } });
assert.deepEqual(measured.map(size => [size.width, size.height]), [[1200, 800]], 'valid bitmap dimensions reported');
tree = render(bundled, { onDimensions: size => measured.push(size) });
getImage(tree).props.onLoad({ nativeEvent: { source: { width: 0, height: 800 } } });
getImage(tree).props.onLoad({ nativeEvent: { source: { width: Infinity, height: 800 } } });
assert.equal(measured.length, 1, 'zero and nonfinite dimensions cannot enable zoom');

// Commons failure moves to the documented fallback without warning prematurely.
const warnings = [];
const originalWarn = console.warn;
try {
  console.warn = (...args) => warnings.push(args);
  restart();
  tree = render(remoteCommons);
  img = getImage(tree);
  img.props.onError({ nativeEvent: { error: 'primary HTTP 403' } });
  assert.equal(warnings.length, 0, 'the first remote failure does not warn');
  tree = render(remoteCommons);
  img = getImage(tree);
  assert.equal(img.props.source.uri, remoteImageCandidates(remoteCommons)[1].uri, 'fallback endpoint selected');
  assert.ok(loading(tree), 'retry keeps loading feedback');
  img.props.onLoad({ nativeEvent: { source: { width: 960, height: 640 } } });
  tree = render(remoteCommons);
  assert.ok(!loading(tree) && !errorPlaceholder(tree), 'successful fallback clears placeholder');

  restart();
  tree = render(remoteCommons);
  getImage(tree).props.onError({ nativeEvent: { error: 'primary HTTP 403' } });
  tree = render(remoteCommons);
  getImage(tree).props.onError({ nativeEvent: { error: 'fallback HTTP 403' } });
  tree = render(remoteCommons);
  assert.equal(warnings.length, 1, 'warning only after final remote attempt');
  const placeholder = errorPlaceholder(tree);
  assert.ok(placeholder, 'both remote attempts failed: explicit error placeholder');
  const resolved = placeholder.type(placeholder.props);
  assert.equal(resolved.props.accessibilityLabel, 'Η εικόνα δεν είναι διαθέσιμη', 'error placeholder has accessible label');
  assert.ok(nodes(resolved).some(node => node.type === 'Text' && node.props.children === 'Η εικόνα δεν είναι διαθέσιμη'), 'error placeholder has readable text');

  // Failed images never poison a different URI's status or attempt index.
  tree = render(bundled);
  assert.equal(getImage(tree).props.source, bundledLessonImages[bundled], 'URI change selects bundled asset after failure');
  assert.ok(loading(tree), 'URI change resets error to loading');
  getImage(tree).props.onLoad({ nativeEvent: { source: { width: 1200, height: 800 } } });
  tree = render(remoteCommons);
  assert.equal(getImage(tree).props.source.uri, remoteImageCandidates(remoteCommons)[0].uri, 'returning to remote URI resets fallback attempt');

  // A future non-Commons image keeps its original HTTPS URL and fails once.
  restart();
  const future = 'https://example.org/future.jpg';
  tree = render(future);
  assert.equal(getImage(tree).props.source.uri, future, 'non-Commons remote images keep direct URI');
  getImage(tree).props.onError({ nativeEvent: { error: 'HTTP 404' } });
  tree = render(future);
  assert.equal(warnings.length, 2, 'non-Commons remote failure does not retry');
  assert.ok(errorPlaceholder(tree), 'non-Commons failure has placeholder');

  // Bundled failure is final: no network retry, even though its key is HTTPS.
  restart();
  tree = render(bundled);
  getImage(tree).props.onError({ nativeEvent: { error: 'corrupt local image' } });
  tree = render(bundled);
  assert.equal(warnings.length, 3, 'failed bundled asset warns once without remote fallback');
  assert.ok(errorPlaceholder(tree), 'failed bundled asset shows placeholder');
} finally {
  console.warn = originalWarn;
}

for (const missing of [null, undefined, '', '   ']) {
  restart();
  tree = render(missing);
  assert.ok(!getImage(tree), `missing URL ${String(missing)} does not render native Image`);
  assert.ok(errorPlaceholder(tree), `missing URL ${String(missing)} renders fallback`);
  assert.ok(!loading(tree), `missing URL ${String(missing)} does not spin`);
}

console.log(`Hybrid image delivery passed: ${urls.length} unique catalogue URLs (${bundledUrls.length} bundled, ${remoteUrls.length} remote); ` +
  `${assets.length} local JPEG/PNG assets verified; ${originalDiagrams.length} original diagram references remain local; ` +
  'HTTPS candidates, Commons fallback, bundled priority, URI changes, dimensions and error/missing placeholders checked. Native rendering mocked.');
