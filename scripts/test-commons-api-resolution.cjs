/* Deterministic API/CDN and Android wrapper contract, no real network required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function compile(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.ok(Object.hasOwn(dependencies, id), `Missing mock ${id}`);
    return dependencies[id];
  }, module, module.exports);
  return module.exports;
}
const base = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const upload = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg';
const thumb = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg';
const util = compile('src/utils/commonsImageResolver.ts');
const sources = compile('src/utils/commonsImage.ts');
const url = `${base}Example.jpg?width=1200`;
assert.equal(util.commonsFilename(url), 'Example.jpg');
assert.equal(util.commonsFilename(`${base}A%20B%2C%20%CE%91.jpg?width=1200`), 'A B, Α.jpg');
assert.equal(util.commonsFilename(`${base}broken%ZZ.jpg`), null);
assert.equal(util.commonsFilename(`${base}foo%2Fbar.jpg`), null);
assert.equal(util.commonsFilename('https://example.org/foo.png'), null);
assert.equal(sources.remoteImageCandidates(upload)[0].uri, upload);
assert.ok(sources.remoteImageCandidates(upload)[0].headers['User-Agent'].startsWith('GnosiMobile/'));
assert.equal(sources.remoteImageCandidates(thumb)[0].uri, thumb, 'new thumbnail CDN is passed through');
assert.ok(sources.remoteImageCandidates(thumb)[0].headers['User-Agent'].startsWith('GnosiMobile/'), 'new CDN gets identifiable native request headers');
assert.deepEqual(sources.remoteImageCandidates('https://example.org/a.png').map(x => x.uri), ['https://example.org/a.png']);
let calls = 0;
let unblock;
const http = () => {calls++;return new Promise(resolve => {unblock=resolve;});};
(async () => {
  const one = util.resolveCommonsThumbnail(url, http);
  const two = util.resolveCommonsThumbnail(`${base}Example.jpg?width=960`, http);
  assert.equal(calls, 1, 'deduplicate simultaneous requests for the same file');
  unblock({ok:true, json:async()=>({query:{pages:[{title:'File:Example.jpg',imageinfo:[{thumburl:upload}]}]}})});
  assert.equal(await one, upload);
  assert.equal(await two, upload);
  assert.equal(await util.resolveCommonsThumbnail(url, http), upload);
  assert.equal(calls, 1, 'successful thumbnails are cached within the session');
  const newCdn = `${base}ThumbHost.jpg`;
  assert.equal(await util.resolveCommonsThumbnail(newCdn, async () => ({
    ok:true, json:async()=>({query:{pages:[{imageinfo:[{thumburl:thumb}]}]}}),
  })), thumb, 'official 2026 thumbnail host must be accepted');
  let encodedQuery = '';
  const svg = `${base}Diagram.svg?width=1200`;
  const svgPng = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Diagram.svg/960px-Diagram.svg.png';
  assert.equal(await util.resolveCommonsThumbnail(svg, async (apiUrl, options) => {
    encodedQuery = apiUrl;
    assert.ok(options.headers['Api-User-Agent'].includes('GnosiMobile/'));
    assert.equal(options.headers.Accept,'application/json');
    return {ok:true,json:async()=>({query:{pages:[{imageinfo:[{url:'https://upload.wikimedia.org/wikipedia/commons/1/12/Diagram.svg',thumburl:svgPng}]}]}})};
  }),svgPng,'SVG originals use their raster thumbnail');
  assert.equal(new URL(encodedQuery).searchParams.get('titles'),'File:Diagram.svg');
  assert.equal(new URL(encodedQuery).searchParams.get('iiurlwidth'),'960');
  await assert.rejects(util.resolveCommonsThumbnail(`${base}Missing.jpg`, async()=>({ok:true,json:async()=>({query:{pages:[{missing:true}]}})})),/No thumbnail/);
  await assert.rejects(util.resolveCommonsThumbnail(`${base}Unsafe.jpg`, async()=>({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:'https://example.org/unsafe.jpg'}]}]}})})),/Unexpected Wikimedia/);
  await assert.rejects(util.resolveCommonsThumbnail(`${base}Impostor.jpg`, async()=>({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:'https://thumb.wikimedia.org.evil.example/wikipedia/commons/thumb/a/ab/x.jpg'}]}]}})})),/Unexpected Wikimedia/, 'lookalike host must be rejected');
  await assert.rejects(util.resolveCommonsThumbnail(`${base}Original.jpg`, async()=>({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/original.jpg'}]}]}})})),/Unexpected Wikimedia/, 'full-resolution originals must not be requested');
  await assert.rejects(util.resolveCommonsThumbnail(`${base}Fail.jpg`, async()=>({ok:false,status:403})),/HTTP 403/);
  assert.equal(await util.resolveCommonsThumbnail(`${base}Fail.jpg`,async()=>({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:upload}]}]}})})),upload,'failed API requests may be retried');

  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  // Metadata requests must be throttled when several lesson cards mount together.
  const waiting = [];
  const slow = (_url, _options) => new Promise(resolve => waiting.push(resolve));
  const a = util.resolveCommonsThumbnail(`${base}QueueA.jpg`, slow);
  const b = util.resolveCommonsThumbnail(`${base}QueueB.jpg`, slow);
  const c = util.resolveCommonsThumbnail(`${base}QueueC.jpg`, slow);
  assert.equal(waiting.length, 2, 'at most two metadata requests in flight');
  waiting.shift()({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:upload}]}]}})});
  await a;
  await Promise.resolve();await Promise.resolve();
  assert.equal(waiting.length, 2, 'queued lookup starts once one finishes');
  waiting.shift()({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:upload}]}]}})});
  waiting.shift()({ok:true,json:async()=>({query:{pages:[{imageinfo:[{thumburl:upload}]}]}})});
  await Promise.all([b,c]);

  // Integration: resolving only on Android for remote, unbundled Commons images.
  const jsx = (type, props) => ({type,props});
  let slots=[],effects=[],cursor=0;
  let lastDeps=[],cleanups=[];
  const react={
    useState(initial) {const idx=cursor++;if(!(idx in slots))slots[idx]=initial;return [slots[idx],val=>{slots[idx]=typeof val==='function'?val(slots[idx]):val;}]},
    useEffect(fn,deps){const idx=cursor++;if(!lastDeps[idx]||deps.some((v,j)=>v!==lastDeps[idx][j])){
      cleanups[idx]?.(); lastDeps[idx]=deps; effects.push(()=>{cleanups[idx]=fn();});
    }},
  };
  const resolveCalls=[];
  const resolved = compile('src/components/ResolvedCommonsImage.tsx', {
    react, 'react/jsx-runtime':{jsx,jsxs:jsx},
    'react-native':{Platform:{OS:'android'},View:'View',ActivityIndicator:'ActivityIndicator',StyleSheet:{create:x=>x}},
    '../data/bundledLessonImages':{bundledLessonImages:{[`${base}Bundled.jpg`]:1}},
    '../utils/commonsImageResolver':{
      isCommonsFilePath:util.isCommonsFilePath,commonsFilename:util.commonsFilename,
      resolveCommonsThumbnail:uri=>{resolveCalls.push(uri); return Promise.resolve(upload);},
    },
    '../theme':{colors:{accentLight:'#fff',surfaceSoft:'#222'}},
    '../utils/commonsImage':{remoteImageCandidates:sources.remoteImageCandidates},
    'expo-image':{Image:'ExpoImage'},
    './ResilientImage':{__esModule:true,default:'ResilientImage',ImageStatusPlaceholder:'ErrorPlaceholder'},
  }).default;
  function draw(uri) {cursor=0;return resolved({uri,style:{width:400,height:200},accessibilityLabel:'Example'});}
  let tree=draw(url);
  assert.equal(tree.type,'View','remote image reserves space until metadata resolves');
  effects.splice(0).forEach(fn=>fn());
  await Promise.resolve();await Promise.resolve();
  tree=draw(url);
  assert.equal(typeof tree.type,'function','Android remote Commons uses an Expo Image wrapper');
  assert.equal(tree.props.url,upload,'wrapper receives the resolved Wikimedia CDN URL');
  assert.deepEqual(resolveCalls,[url]);
  tree=draw(`${base}Bundled.jpg`);
  assert.equal(tree.type,'ResilientImage');assert.equal(tree.props.uri,`${base}Bundled.jpg`);
  tree=draw('https://example.org/picture.png');
  assert.equal(tree.props.uri,'https://example.org/picture.png');
  tree=draw(`${base}Different.jpg`);
  assert.equal(tree.type,'View','switching images does not show stale image data');
  console.log('Wikimedia API resolution passed: filenames, 960px imageinfo, 2026 thumbnail host and legacy CDN, SVG, safe hosts, failures, promise/cache dedup, Android wrapper, bundled bypass and URL transitions (network/native mocked).');
})().catch(error=>{console.error(error); process.exitCode=1;});
