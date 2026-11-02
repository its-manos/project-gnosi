/* Android Wikimedia integration: mocked native/network; real device test still required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/components/ResolvedCommonsImage.tsx');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const jsx = (type, props) => ({ type, props });
const platform = { OS: 'android' };
const base = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const cdn = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Test.jpg/960px-Test.jpg';
const bundled = `${base}Local.png?width=1200`;
const calls = [];
const warnings = [];
let currentSlots, cursor = 0, effects = [];
const react = {
  useState(initial) {
    const index = cursor++;
    if (!currentSlots[index]) currentSlots[index] = { value: typeof initial === 'function' ? initial() : initial };
    return [currentSlots[index].value, update => {
      currentSlots[index].value = typeof update === 'function' ? update(currentSlots[index].value) : update;
    }];
  },
  useEffect(fn, deps) {
    const index = cursor++;
    const previous = currentSlots[index]?.deps;
    if (!previous || deps.some((value, i) => value !== previous[i])) {
      currentSlots[index] = { deps };
      effects.push(fn);
    }
  },
};
const render = (component, props, slots) => {
  currentSlots = slots; cursor = 0;
  return component(props);
};
const nodes = item => item && typeof item === 'object'
  ? [item, ...[item.props?.children].flat(Infinity).flatMap(nodes)] : [];
const mock = { exports: {} };
vm.runInNewContext(code, {
  module: mock, exports: mock.exports, console: { warn: (...args) => warnings.push(args) }, Number,
  require(id) {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (id === 'expo-image') return { Image: 'ExpoImage' };
    if (id === 'react-native') return {
      Platform: platform, View: 'View', ActivityIndicator: 'Spinner',
      StyleSheet: { create: value => value, absoluteFill: { position: 'absolute' } },
    };
    if (id === './ResilientImage') return {
      __esModule: true, default: 'LegacyImage', ImageStatusPlaceholder: 'ErrorPlaceholder',
    };
    if (id === '../data/bundledLessonImages') return { bundledLessonImages: { [bundled]: 42 } };
    // Mirror the real helper: Commons redirect URLs carry headers; direct CDN URLs do not.
    if (id === '../utils/commonsImage') return { remoteImageCandidates: uri => uri.startsWith(base)
      ? [{ uri: `${base}Test.jpg?width=960`, headers: { 'User-Agent': 'GnosiMobile/1.0', 'Api-User-Agent': 'GnosiMobile/1.0' } }]
      : [{ uri }] };
    if (id === '../utils/commonsImageResolver') return {
      isCommonsFilePath: uri => uri.startsWith(base),
      commonsFilename: uri => uri.slice(base.length),
      resolveCommonsThumbnail: uri => {
        calls.push(uri);
        return uri.includes('Failure.jpg') ? Promise.reject(new Error('HTTP 403')) : Promise.resolve(cdn);
      },
    };
    if (id === '../theme') return { colors: { accentLight: '#fff', surfaceSoft: '#222' } };
    throw new Error(`Unmocked dependency: ${id}`);
  },
});
const Wrapper = mock.exports.default;
const tick = async () => { const queue = effects; effects = []; queue.forEach(fn => fn()); await Promise.resolve(); await Promise.resolve(); };
(async () => {
  const props = { uri: `${base}Test.jpg?width=1200`, style: { width: 320, height: 240 },
    resizeMode: 'contain', accessibilityLabel: 'Test illustration', loadingLabel: 'Loading',
    fallbackLabel: 'Unavailable', onDimensions: size => calls.push(size) };
  const rootSlots = [], imageSlots = [];
  let tree = render(Wrapper, props, rootSlots);
  assert.equal(tree.type, 'View', 'metadata loading keeps a reserved frame');
  assert.equal(nodes(tree).filter(n => n.type === 'Spinner').length, 1);
  await tick();
  tree = render(Wrapper, props, rootSlots);
  assert.equal(calls[0], props.uri, 'Android requests thumbnail metadata for remote Commons');
  assert.equal(typeof tree.type, 'function', 'after metadata, render the Android-only Expo component');
  const ImageComponent = tree.type;
  let rendered = render(ImageComponent, tree.props, imageSlots);
  let image = nodes(rendered).find(n => n.type === 'ExpoImage');
  assert.ok(image, 'Android Wikimedia thumbnails must use Expo Image, not Fresco');
  assert.equal(image.props.source.uri, cdn, 'use API-resolved direct CDN URL');
  assert.ok(image.props.source.headers['User-Agent'].startsWith('GnosiMobile'));
  assert.ok(image.props.source.headers['Api-User-Agent'].startsWith('GnosiMobile'));
  assert.equal(image.props.cachePolicy, 'memory-disk');
  assert.equal(image.props.contentFit, 'contain');
  assert.equal(image.props.accessibilityLabel, props.accessibilityLabel);
  assert.ok(nodes(rendered).some(n => n.props?.accessibilityLabel === 'Loading'));
  image.props.onLoad({ source: { width: 960, height: 640 } });
  rendered = render(ImageComponent, tree.props, imageSlots);
  assert.ok(!nodes(rendered).some(n => n.props?.accessibilityLabel === 'Loading'), 'loading badge removed after success');
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), { width: 960, height: 640 }, 'zoom uses real Expo Image dimensions');
  image = nodes(rendered).find(n => n.type === 'ExpoImage');
  image.props.onError({ error: 'HTTP 403' });
  rendered = render(ImageComponent, tree.props, imageSlots);
  assert.ok(nodes(rendered).some(n => n.type === 'ErrorPlaceholder'), 'failed Expo load has a visible fallback');
  assert.equal(warnings.length, 1, 'final network error is logged');
  assert.equal(nodes(rendered).find(n => n.type === 'ErrorPlaceholder').props.label, 'Unavailable');
  rendered = render(ImageComponent, { ...tree.props, url: `${cdn}?v=2`, resizeMode: 'cover' }, imageSlots);
  assert.ok(!nodes(rendered).some(n => n.type === 'ErrorPlaceholder'), 'URI change does not retain failure state');
  assert.equal(nodes(rendered).find(n => n.type === 'ExpoImage').props.contentFit, 'cover');

  platform.OS = 'ios';
  assert.equal(render(Wrapper, props, []).type, 'LegacyImage', 'iOS stays on proven renderer');
  platform.OS = 'android';
  assert.equal(render(Wrapper, { ...props, uri: bundled }, []).type, 'LegacyImage', 'bundled Commons images remain local');
  assert.equal(render(Wrapper, { ...props, uri: 'https://example.org/other.png' }, []).type, 'LegacyImage', 'non-Commons retain existing path');
  assert.equal(calls.filter(x => typeof x === 'string').length, 1, 'no metadata requests for iOS/local/non-Commons');

  const failedSlots = [];
  tree = render(Wrapper, { ...props, uri: `${base}Failure.jpg` }, failedSlots);
  await tick();
  tree = render(Wrapper, { ...props, uri: `${base}Failure.jpg` }, failedSlots);
  assert.equal(tree.type, 'LegacyImage', 'metadata failure exposes fallback without redirect loop');
  assert.equal(tree.props.uri, null);
  assert.equal(warnings.length, 2);
  const source = fs.readFileSync(path.join(root, 'src/screens/ReaderLessonScreen.tsx'), 'utf8');
  assert.ok(!source.includes('AndroidImageProbe'), 'manual diagnostic no longer rendered in lessons');
  console.log('Expo Image Android integration passed: direct Wikimedia CDN, original headers, disk-memory cache, loading/errors, dimensions, iOS/local bypass and diagnostic removal. Native/network mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
