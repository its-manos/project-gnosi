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
const { worldHistoryLessons } = require(root + '/src/data/worldHistoryLessons.ts');
const { worldHistoryArticleMedia } = require(root + '/src/data/worldHistoryMedia.ts');
const before = require('./fixtures/before-world-history-photos.json');
const rights = require('./fixtures/world-history-photo-rights.json');
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const changed = new Set(before.changedIds);
assert.equal(changed.size, 20);
assert.deepEqual(lessons.map(l => l.id), before.lessons.map(l => l.id), 'catalogue IDs and order unchanged');
assert.equal(worldHistoryLessons.length, 20);
const mapping = fs.readFileSync(root + '/src/data/bundledLessonImages.ts', 'utf8');
for (const l of lessons) {
  const old = before.lessons.find(old => old.id === l.id);
  if (!changed.has(l.id)) assert.equal(sha(l), old.sha256, l.id + ': exact old lesson');
  const learningFields = Object.fromEntries(Object.entries(l).filter(([key]) => !before.mediaFields.includes(key)));
  assert.equal(sha(learningFields), old.contentSha256, l.id + ': all text, quizzes, sources and progress IDs exact');
  assert.notEqual(l.coverKind, 'editorial', 'no current lesson remains on a generic cover');
  assert.ok(l.imageUrl?.startsWith('https://'), l.id + ': image cover present');
  assert.ok(mapping.includes(JSON.stringify(l.imageUrl)), l.id + ': cover bundled offline');
}
assert.equal(rights.length, 20);
assert.equal(rights.filter(r => r.reusedFrom).length, 5);
for (const l of worldHistoryLessons) {
  const record = rights.find(r => r.lessonId === l.id);
  assert.ok(record);
  assert.match(record.license, /^(Public domain|CC0|CC BY)/);
  assert.ok(record.creator && record.metadata && record.sourceUrl);
  assert.equal(record.sourceUrl, l.imageCreditUrl);
  assert.ok(l.imageCredit.includes(record.license));
  assert.ok(l.imageCaption.length > 60);
  const bytes = fs.readFileSync(root + '/' + record.assetPath);
  assert.ok(bytes.length > 1000);
  assert.deepEqual([...bytes.subarray(0, 3)], [255, 216, 255], 'cover is a real JPEG');
  assert.ok(worldHistoryArticleMedia[l.id]?.length, 'existing inline diagram retained');
}
assert.match(worldHistoryLessons.find(l => l.id === 'world-mongols-plague').imageCaption, /1430–1434/, 'manuscript description, not misleading filename, determines date');
assert.match(worldHistoryLessons.find(l => l.id === 'world-farming').imageCaption, /Σύγχρονη/);
assert.match(worldHistoryLessons.find(l => l.id === 'world-connected-present').imageCaption, /υποθετικό/);
console.log('World-history photos passed: 20 photographic/archival covers, 15 new and 5 reused assets, all 81 covers bundled, all learning text/questions and existing diagrams preserved.');
