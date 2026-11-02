/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file);
const root = path.resolve(__dirname, '..');
const { lessons } = require(root + '/src/data/lessons.ts');
const { inlineArticleMedia } = require(root + '/src/data/articleMedia.ts');
const { supplementaryArticleMedia } = require(root + '/src/data/supplementaryMedia.ts');
const before = require('./fixtures/before-supplementary-images.json');
const rights = require('./fixtures/supplementary-image-rights.json');
const {assertPremergeCurriculum}=require('./helpers/assert-premerge-curriculum.cjs');
const historicalIds=new Set(before.lessons.map(l=>l.id));
assert.deepEqual(lessons.filter(l=>historicalIds.has(l.id)).map(l=>l.id),before.lessons.map(l=>l.id),
  'the original 81 lesson identities remain in order');
assertPremergeCurriculum(lessons,inlineArticleMedia);
for (const id of Object.keys(before.media)) assert.ok(historicalIds.has(id),id+': previous media belongs to a historical lesson');
assert.deepEqual(Object.keys(supplementaryArticleMedia).sort(), [...before.addedIds].sort());
assert.equal(rights.length, 40);
const mapping = fs.readFileSync(root + '/src/data/bundledLessonImages.ts', 'utf8');
const knownMissing=new Set(['perception-blind-spot','perception-color-context','perception-depth-two-eyes','perception-gestalt-whole','perception-inattentional-blindness','perception-expectations','perception-multitasking','perception-hidden-whole','geology-introduction','geology-what-is-rock','geology-rock-cycle','geology-deep-time','geology-fossil-evidence']);
assert.deepEqual(lessons.filter(l=>!inlineArticleMedia[l.id]?.length).map(l=>l.id).sort(),[...knownMissing].sort(),
  'exactly the 13 separately tracked supplementary-image gaps remain, with no regression');
for (const [id, figures] of Object.entries(supplementaryArticleMedia)) {
  const lesson = lessons.find(l => l.id === id);
  assert.ok(lesson);
  assert.equal(figures.length, 1);
  const fig = figures[0];
  assert.equal(fig.resizeMode, 'contain', 'retain complete documents, diagrams and photos');
  assert.ok(fig.afterParagraphCount > 0 && fig.afterParagraphCount <= lesson.sections.reduce((n, s) => n + s.paragraphs.length, 0));
  assert.equal(fig.afterParagraphCount % 2, 0, 'placement follows the taught paragraph pair');
  assert.ok(mapping.includes(JSON.stringify(fig.url)) || fig.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'),
  'either original bundled image or authorized Commons remote delivery');
  const record = rights.find(a => a.lessonId === id);
  assert.ok(record?.sourceUrl && record.creator && record.license);
  assert.equal(fig.creditUrl, record.sourceUrl);
  assert.ok(mapping.includes(record.file) || (record.file.endsWith('.jpg') && fig.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/')),
  'bundled original art, or deliberately remote licensed photograph');
  const file = root + '/assets/lesson-images/' + record.file;
  assert.ok(fs.statSync(file).size > 1000, 'real asset bytes');
  if (record.file.endsWith('.jpg')) {
    assert.match(record.license, /^(Public domain|CC0|CC BY)/);
    assert.ok(record.metadata, 'retain original file-page licensing metadata');
    assert.ok(fig.credit.includes(record.license), 'visible derivative licence');
  } else {
    assert.equal(record.license, 'Original project asset');
    assert.ok(fig.caption.startsWith('Πρωτότυπο'));
  }
}
assert.equal(rights.filter(r => r.file.endsWith('.jpg')).length, 27);
assert.equal(rights.filter(r => r.file.endsWith('.png')).length, 13);
assert.match(supplementaryArticleMedia['lascaux-looking-back'][0].caption, /αντίγραφο/);
assert.match(supplementaryArticleMedia['dictatorship-censorship-greece'][0].caption, /2019/);
assert.match(supplementaryArticleMedia['eugenics-scientific-authority'][0].caption, /δεν αποτελεί απόδειξη/);
assert.match(supplementaryArticleMedia['astronomy-exoplanet-evidence'][0].caption, /υποθετικές/);
assert.match(supplementaryArticleMedia['ai-bias-context'][0].caption, /90\/90.*5\/10.*95\/100/);
console.log('Supplementary images passed: 27 attributed source pictures, 13 original diagrams, 40 placements and rights, 116 frozen full-content and figure snapshots; exactly 13 known missing inline-photo cases.');
