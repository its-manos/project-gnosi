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
assert.equal(lessons.length, before.lessons.length);
// A later image-only update replaces the twenty world-history editorial covers.
// Preserve the original full-object snapshots for all other lessons and check
// every learning field of the twenty changed covers against its prior snapshot.
const photoBefore = require('./fixtures/before-world-history-photos.json');
const photoIds = new Set(photoBefore.changedIds);
assert.deepEqual(lessons.map(l => l.id), before.lessons.map(l => l.id));
for (const l of lessons) {
  const imageOnly = photoIds.has(l.id);
  const value = imageOnly ? Object.fromEntries(Object.entries(l).filter(([key]) => !photoBefore.mediaFields.includes(key))) : l;
  const expected = imageOnly ? photoBefore.lessons.find(old => old.id === l.id).contentSha256 : before.lessons.find(old => old.id === l.id).sha256;
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'), expected, l.id + ': learning content, sources and quizzes unchanged');
}
for (const [id, figures] of Object.entries(before.media)) assert.deepEqual(inlineArticleMedia[id], figures, id + ': existing figures unchanged');
assert.deepEqual(Object.keys(supplementaryArticleMedia).sort(), [...before.addedIds].sort());
assert.equal(rights.length, 40);
const mapping = fs.readFileSync(root + '/src/data/bundledLessonImages.ts', 'utf8');
for (const lesson of lessons) assert.ok(inlineArticleMedia[lesson.id]?.length, 'all current lessons now have contextual inline figures');
for (const [id, figures] of Object.entries(supplementaryArticleMedia)) {
  const lesson = lessons.find(l => l.id === id);
  assert.ok(lesson);
  assert.equal(figures.length, 1);
  const fig = figures[0];
  assert.equal(fig.resizeMode, 'contain', 'retain complete documents, diagrams and photos');
  assert.ok(fig.afterParagraphCount > 0 && fig.afterParagraphCount <= lesson.sections.reduce((n, s) => n + s.paragraphs.length, 0));
  assert.equal(fig.afterParagraphCount % 2, 0, 'placement follows the taught paragraph pair');
  assert.ok(mapping.includes(JSON.stringify(fig.url)), 'offline lookup registered');
  const record = rights.find(a => a.lessonId === id);
  assert.ok(record?.sourceUrl && record.creator && record.license);
  assert.equal(fig.creditUrl, record.sourceUrl);
  assert.ok(mapping.includes(record.file));
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
console.log('Supplementary images passed: 27 licensed sourced pictures, 13 exact original diagrams, all 40 placements registered offline, 81 unchanged learning-content snapshots and 41 unchanged existing figure lists; world-history cover-only changes allowed.');
