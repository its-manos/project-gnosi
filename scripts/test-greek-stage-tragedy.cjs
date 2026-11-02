/* Ancient Greece / Chapter V / Lesson 25 — Node-only additive integration contract. */
/* Run after npm ci. Does not verify image delivery, historian sign-off or native UI. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(
  ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true
  }}).outputText, file
);
const root = path.resolve(__dirname, '..');
const { lessons } = require(root + '/src/data/lessons.ts');
const { inlineArticleMedia } = require(root + '/src/data/articleMedia.ts');
const pathing = require(root + '/src/utils/lessonPath.ts');
const progress = require(root + '/src/utils/lessonProgress.ts');
const { quizFingerprint, lessonQuizMatches } = require(root + '/src/utils/learningActivity.ts');
const { parseLearningBackup } = require(root + '/src/utils/learningBackup.ts');
const id = 'greek-stage-tragedy';
const lesson = lessons.find(l => l.id === id);
assert.ok(lesson, 'Lesson 25 must be in exported catalogue exactly once');
assert.equal(lessons.filter(l => l.id === id).length, 1);
assert.equal(lesson.categoryId, 'history');
assert.equal(lesson.subcategoryId, 'ancient-greece');
assert.equal(lesson.title, 'Το θέατρο ως δημόσια εμπειρία');
assert.equal(lesson.requireCurrentAttemptQuiz, true);
assert.equal(lesson.compatibleQuizKeys, undefined, 'new lesson has no historical quiz aliases');
const paragraphs = lesson.sections.flatMap(section => section.paragraphs);
assert.equal(lesson.sections.length, 6);
assert.equal(paragraphs.length, 30);
assert.deepEqual(paragraphs.map(p => p.id),
  Array.from({ length: 30 }, (_, i) => 'stage-' + String(i + 1).padStart(2, '0')));
assert.ok(paragraphs.every(p => p.text.length > 120));
assert.equal(lesson.questions.length, 7);
assert.equal(new Set(lesson.questions.map(q => q.id)).size, 7);
assert.ok(lesson.questions.every(q => q.id.startsWith('stage-') &&
  q.version === '1' && q.difficulty === 'hard' &&
  q.answers.length === 4 && new Set(q.answers).size === 4 &&
  q.correctIndex >= 0 && q.correctIndex < 4 && q.explanation.length >= 80));
assert.deepEqual(lesson.checkpoints.map(c => c.questionId), lesson.questions.map(q => q.id));
assert.deepEqual(progress.getQuestionPlacements(lesson).map(p => p.afterParagraphNumber), [4, 8, 12, 17, 21, 25, 30]);
assert.equal(progress.getVisibleParagraphLimit(lesson, {}), 4);
assert.equal(progress.getResumeParagraphNumber(lesson, { 0: lesson.questions[0].correctIndex }), 5);
assert.equal(progress.getVisibleParagraphLimit(lesson, Object.fromEntries(lesson.questions.map((q,i) => [i, q.correctIndex]))), 30);
const images = inlineArticleMedia[id];
assert.equal(images.length, 2);
assert.deepEqual(images.map(i => i.afterParagraphId), ['stage-10', 'stage-14']);
assert.ok(images.every(i => i.resizeMode === 'contain' &&
  i.url.includes('commons.wikimedia.org/wiki/Special:FilePath/') &&
  i.creditUrl.includes('commons.wikimedia.org/wiki/File:') &&
  i.caption.length > 80));
assert.ok(lesson.imageUrl.includes('Special:FilePath/') && lesson.imageCreditUrl.includes('commons.wikimedia.org/wiki/File:'));
assert.ok(lesson.sources.length >= 10 && lesson.sources.every(s => s.url.startsWith('https://')));
const seq = pathing.getSubcategoryPath(lessons, 'ancient-greece');
assert.deepEqual(seq.slice(23, 27).map(l => l.id),
  ['alexander-conquests-context', 'greek-stage-tragedy', 'greek-philosophy-in-context', 'antikythera-gears']);
assert.equal(pathing.getNextPathLesson(lessons.find(l => l.id === 'alexander-conquests-context'), lessons, ['alexander-conquests-context'])?.id, id);
assert.equal(pathing.getNextPathLesson(lesson, lessons, [id])?.id, 'greek-philosophy-in-context');
assert.ok(pathing.getLessonAccess(lesson, lessons, ['alexander-conquests-context']).unlocked);
assert.ok(!pathing.getLessonAccess(lesson, lessons, ['macedon-philip']).unlocked);
assert.ok(pathing.getLessonAccess(lesson, lessons, [id]).unlocked);
const fingerprint = quizFingerprint(lesson.questions);
assert.ok(fingerprint.startsWith('q_'));
for (const old of ['q_470dac57','q_22487292',...['alexander-conquests-context','athens-who-voted','greek-sanctuaries-games'].map(pid=>quizFingerprint(lessons.find(l=>l.id===pid).questions))]) {
  assert.equal(lessonQuizMatches(lesson, old), false, 'unrelated quiz fingerprint must not match');
}
const backup = parseLearningBackup({ schemaVersion: 1, completedIds: ['athens-who-voted','alexander-conquests-context'], savedIds: ['greek-stage-tragedy','athens-who-voted'], attempts: {} });
assert.ok(backup.completedIds.includes('athens-who-voted'));
assert.ok(backup.completedIds.includes('alexander-conquests-context'));
assert.ok(backup.savedIds.includes('greek-stage-tragedy'));
console.log('Greek theatre lesson 25: catalogue, 30 paragraphs, 7 anchored questions, two attributed media, path adjacency, progress and quiz isolation passed (Node only).');
