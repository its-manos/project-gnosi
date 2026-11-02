/* Native image pipeline is mocked; verifies bounded selection and hidden preloading contract. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function compile(file, imports) {
  const mod = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', output)(id => {
    assert.ok(id in imports, `Unmocked import ${id} from ${file}`);
    return imports[id];
  }, mod, mod.exports);
  return mod.exports;
}
const urls = {
  first: 'https://commons.wikimedia.org/wiki/Special:FilePath/First.jpg?width=1200',
  later: 'https://commons.wikimedia.org/wiki/Special:FilePath/Later.jpg?width=1200',
  bundled: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bundled.jpg?width=1200',
};
const lesson = { id: 'fixture', sections: [{ paragraphs: [{ id: 'a' }, { id: 'b' }] }, { paragraphs: [{ id: 'c' }, { id: 'd' }] }] };
const media = { inlineArticleMedia: { fixture: [
  { afterParagraphId: 'd', url: urls.later },
  { afterParagraphId: 'a', url: urls.first },
  { afterParagraphId: 'unknown', url: 'https://example.org/not-in-lesson.jpg' },
  { afterParagraphCount: 2, url: urls.bundled },
] } };
const { nextPendingFigureUrl } = compile('src/utils/nextFigureWarmup.ts', {
  '../data/articleMedia': media,
  './lessonProgress': { getParagraphId: (paragraph, n) => paragraph.id ?? `paragraph-${n}` },
});
assert.equal(nextPendingFigureUrl(lesson, 0), urls.first, 'first unrevealed figure selected even when media is unordered');
assert.equal(nextPendingFigureUrl(lesson, 1), urls.bundled, 'numerical placement remains compatible');
assert.equal(nextPendingFigureUrl(lesson, 2), urls.later, 'advance after checkpoint, never repeat visible figures');
assert.equal(nextPendingFigureUrl(lesson, 4), null, 'no warmup after last figure');
assert.equal(nextPendingFigureUrl({ ...lesson, id: 'no-media' }, 0), null);
assert.equal(nextPendingFigureUrl({ ...lesson, sections: [] }, 0), null, 'stale anchors cannot trigger requests');
const jsx = (type, props) => ({ type, props });
const { default: NextImageWarmup } = compile('src/components/NextImageWarmup.tsx', {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { View: 'View', StyleSheet: { create: s => s } },
  '../data/bundledLessonImages': { bundledLessonImages: { [urls.bundled]: 1 } },
  './ResilientImage': { __esModule: true, default: 'ResilientImage' },
});
assert.equal(NextImageWarmup({ uri: null }), null);
assert.equal(NextImageWarmup({ uri: urls.bundled }), null, 'bundled assets must not be prefetched');
assert.equal(NextImageWarmup({ uri: urls.later }), null, 'speculative image requests stay disabled until CDN delivery is verified');
console.log('Image warmup passed: editorial placement and temporary network warmup disablement (native mocked).');
