/* global __dirname */
const { Buffer } = require('node:buffer');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const root = path.join(__dirname, '..'), cache = new Map(), assets = [];
function load(file, imports = {}) {
  if (!Object.keys(imports).length && cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, console, require: id => {
    if (id in imports) return imports[id];
    const resolved = path.normalize(path.join(path.dirname(file), id));
    if (/\.(png|jpg)$/.test(id)) {
      const bytes = fs.readFileSync(path.join(root, resolved));
      assert.ok(bytes.length > 100, 'image contains actual bytes');
      assert.ok(bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) || bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'native image is JPEG or PNG, never SVG/XML or an HTML error');
      if (bytes[0] === 137) assert.equal(bytes.subarray(-8).toString('hex'), '49454e44ae426082', 'PNG ends with a complete IEND chunk');
      else assert.equal(bytes.subarray(-2).toString('hex'), 'ffd9', 'JPEG ends with its image terminator');
      assets.push(resolved); return assets.length;
    }
    if (id.startsWith('.')) return load(resolved + (fs.existsSync(path.join(root, resolved + '.ts')) ? '.ts' : '.tsx'));
    throw Error(id);
  } });
  if (!Object.keys(imports).length) cache.set(file, mod.exports);
  return mod.exports;
}
const { lessons } = load('src/data/lessons.ts'), { inlineArticleMedia } = load('src/data/articleMedia.ts');
const { bundledLessonImages } = load('src/data/bundledLessonImages.ts');
const urls = [...lessons.filter(l => l.coverKind !== 'editorial').map(l => l.imageUrl), ...Object.values(inlineArticleMedia).flat().map(f => f.url)];
for (const url of urls) assert.equal(typeof bundledLessonImages[url], 'number', 'every current cover and inline figure is bundled: ' + url);
assert.equal(Object.keys(bundledLessonImages).length, new Set(urls).size);
assert.equal(new Set(assets).size, assets.length);
let state, initialized = false;
const jsx = (type, props) => ({ type, props });
const native = { View: 'View', Image: 'Image', Text: 'Text', ActivityIndicator: 'Spinner', StyleSheet: { create: x => x, absoluteFill: {} } };
const Image = load('src/components/ResilientImage.tsx', { react: { useState: initial => { if (!initialized) { state = initial; initialized = true; } return [state, value => { state = value; }]; } }, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native, '../data/bundledLessonImages': { bundledLessonImages }, '../theme': { colors: {} } }).default;
const nodes = t => t && typeof t === 'object' ? [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)] : [];
let tree = Image({ uri: urls[0] }), img = nodes(tree).find(n => n.type === 'Image');
assert.equal(img.props.source, bundledLessonImages[urls[0]], 'bundled asset takes priority over network');
img.props.onLoad(); tree = Image({ uri: urls[0] }); assert.ok(!nodes(tree).some(n => n.type === 'Spinner'));
tree = Image({ uri: urls[1] }); assert.ok(nodes(tree).some(n => n.type === 'Spinner'), 'changed image returns to loading');
assert.equal(nodes(tree).find(n => n.type === 'Image').props.source, bundledLessonImages[urls[1]]);
tree = Image({ uri: 'https://example.org/future.jpg' }); assert.equal(nodes(tree).find(n => n.type === 'Image').props.source.uri, 'https://example.org/future.jpg', 'future images keep network support');
tree = Image({ uri: null }); assert.ok(!nodes(tree).some(n => n.type === 'Image'), 'missing image keeps placeholder');
const measured=[];
tree = Image({uri:urls[0],onDimensions:size=>measured.push(size)});
nodes(tree).find(n=>n.type==='Image').props.onLoad({nativeEvent:{source:{width:1200,height:800}}});
assert.deepEqual(measured.map(s=>[s.width,s.height]),[[1200,800]],'Dimensions come from the native bitmap loader');
tree = Image({uri:urls[0],onDimensions:size=>measured.push(size)});
nodes(tree).find(n=>n.type==='Image').props.onLoad({nativeEvent:{source:{width:0,height:800}}});
assert.equal(measured.length,1,'Invalid dimensions cannot enable zoom');
console.log(`Bundled images passed: ${urls.length} catalogue images resolve to packaged JPEG/PNG assets, local assets take priority, load/URI changes and future remote/missing images remain supported. Native rendering mocked.`);
