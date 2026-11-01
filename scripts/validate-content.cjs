#!/usr/bin/env node
/* global __dirname */
/**
 * Validate the ΓΝΩΣΗ lesson catalogue without a test framework.
 * Uses the project's existing TypeScript dependency to load the data files.
 * This checks structural consistency; it does not verify factual accuracy,
 * remote URL availability, image licences, or native UI behavior.
 */
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = function loadTypeScript(module, filename) {
  const fs = require('node:fs');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(compiled, filename);
};

const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'src/data/lessons.ts'));
const mediaData = require(path.join(root, 'src/data/articleMedia.ts'));
const { categories, subcategories, lessons } = data;
const inlineArticleMedia = mediaData.inlineArticleMedia ?? {};

const errors = [];
const warnings = [];
const ok = (message) => console.log(`  ✓ ${message}`);
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const uniqueIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) {
      fail(`${label}: item has a missing/empty id`);
      continue;
    }
    if (seen.has(item.id)) fail(`${label}: duplicate id "${item.id}"`);
    seen.add(item.id);
  }
  return seen;
};
const isHttpsUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
};
const paragraphCount = (lesson) => (lesson.sections ?? []).reduce(
  (total, section) => total + (Array.isArray(section.paragraphs) ? section.paragraphs.length : 0),
  0,
);

console.log('\nΓΝΩΣΗ content validation\n');

if (!Array.isArray(categories) || !Array.isArray(subcategories) || !Array.isArray(lessons)) {
  console.error('Could not load categories, subcategories, and lessons as arrays.');
  process.exit(2);
}

const categoryIds = uniqueIds(categories, 'Categories');
const subcategoryIds = uniqueIds(subcategories, 'Subcategories');
const lessonIds = uniqueIds(lessons, 'Lessons');

for (const subcategory of subcategories) {
  if (!categoryIds.has(subcategory.categoryId)) {
    fail(`Subcategory "${subcategory.id}" references unknown category "${subcategory.categoryId}"`);
  }
}

for (const subcategory of subcategories) {
  if (!lessons.some((lesson) => lesson.subcategoryId === subcategory.id)) {
    fail(`Subcategory "${subcategory.id}" has no articles`);
  }
}
for (const category of categories) {
  const expansion = lessons.filter((lesson) => lesson.categoryId === category.id && lesson.editorialReviewedAt);
  if (expansion.length < 5) fail(`Category "${category.id}" needs at least five new reviewed articles`);
}

for (const lesson of lessons) {
  if (!categoryIds.has(lesson.categoryId)) {
    fail(`Lesson "${lesson.id}" references unknown category "${lesson.categoryId}"`);
  }
  if (!subcategoryIds.has(lesson.subcategoryId)) {
    fail(`Lesson "${lesson.id}" references unknown subcategory "${lesson.subcategoryId}"`);
  }
  const subcategory = subcategories.find((item) => item.id === lesson.subcategoryId);
  if (subcategory && subcategory.categoryId !== lesson.categoryId) {
    fail(`Lesson "${lesson.id}" category does not match subcategory "${subcategory.id}"`);
  }

  for (const field of ['title', 'summary', 'intro', 'imageCaption', 'imageCredit']) {
    if (typeof lesson[field] !== 'string' || !lesson[field].trim()) {
      fail(`Lesson "${lesson.id}" is missing required field "${field}"`);
    }
  }
  if (lesson.coverKind !== 'editorial' && !isHttpsUrl(lesson.imageUrl)) fail(`Lesson "${lesson.id}" has an invalid HTTPS imageUrl`);
  if (lesson.coverKind !== 'editorial' && !isHttpsUrl(lesson.imageCreditUrl)) fail(`Lesson "${lesson.id}" has an invalid HTTPS imageCreditUrl`);
  if (lesson.editorialReviewedAt) {
    if (!Number.isInteger(lesson.questions?.length) || lesson.questions.length < 1) {
      fail(`Reviewed lesson "${lesson.id}" must have at least one meaningful checkpoint`);
    }
    for (const question of lesson.questions ?? []) {
      if (question.answers?.length !== 4 || new Set(question.answers).size !== 4) {
        fail(`New lesson "${lesson.id}" needs four distinct answer choices per question`);
      }
    }
  }
  if (lesson.categoryId === 'difficult-history' && !lesson.contentNote?.trim()) {
    fail(`Difficult-history lesson "${lesson.id}" needs a content note`);
  }
  if (lesson.coverKind === 'editorial' && (lesson.imageUrl || lesson.imageCreditUrl)) {
    fail(`Illustrated lesson "${lesson.id}" unexpectedly declares a remote photo`);
  }
  if (lesson.editorialReviewedAt && !/^\d{4}-\d{2}-\d{2}$/.test(lesson.editorialReviewedAt)) {
    fail(`Lesson "${lesson.id}" has an invalid editorial date`);
  }
  if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
    fail(`Lesson "${lesson.id}" has no sections`);
  }
  for (const [sectionIndex, section] of (lesson.sections ?? []).entries()) {
    if (!section.title?.trim()) fail(`Lesson "${lesson.id}" section ${sectionIndex + 1} has no title`);
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
      fail(`Lesson "${lesson.id}" section "${section.title ?? sectionIndex + 1}" has no paragraphs`);
    }
    for (const [paragraphIndex, paragraph] of (section.paragraphs ?? []).entries()) {
      const text = typeof paragraph === "string" ? paragraph : paragraph?.text;
      if (typeof text !== "string" || text.trim().length < 20) {
        fail(`Lesson "${lesson.id}" paragraph ${paragraphIndex + 1} in "${section.title}" is empty or suspiciously short`);
      }
    }
  }

  const flattenedParagraphs = (lesson.sections ?? []).flatMap(s => s.paragraphs ?? []);
  const explicitIds = flattenedParagraphs.filter(p => typeof p === "object" && p !== null).map(p => p.id);
  if (explicitIds.some(id => typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) || new Set(explicitIds).size !== explicitIds.length) {
    fail(`Lesson "${lesson.id}" has invalid or duplicate stable paragraph IDs`);
  }
  if (lesson.checkpoints !== undefined) {
    if (!Array.isArray(lesson.checkpoints) || lesson.checkpoints.length !== lesson.questions?.length) fail(`Lesson "${lesson.id}" explicit checkpoints must match the question count`);
    else {
      const qids = lesson.questions.map(q => q.id);
      if (qids.some(id => typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) || new Set(qids).size !== qids.length) fail(`Lesson "${lesson.id}" needs stable unique question IDs`);
      const anchors = new Map(flattenedParagraphs.map((p, i) => [typeof p === "string" ? `legacy-paragraph-${i + 1}` : p.id, i + 1]));
      let previousAnchor = 0;
      lesson.checkpoints.forEach((checkpoint, i) => {
        const anchor = anchors.get(checkpoint.afterParagraphId);
        if (checkpoint.questionId !== qids[i] || !anchor || anchor <= previousAnchor) fail(`Lesson "${lesson.id}" has invalid or out-of-order checkpoint ${i + 1}`);
        else previousAnchor = anchor;
      });
    }
  }
  if (!Array.isArray(lesson.questions) || lesson.questions.length === 0) {
    fail(`Lesson "${lesson.id}" has no checkpoint questions`);
  } else {
    const paragraphTotal = paragraphCount(lesson);
    const availableCheckpoints = Math.floor(paragraphTotal / 2);
    if (!lesson.checkpoints && lesson.questions.length > availableCheckpoints) {
      warn(`Lesson "${lesson.id}" has ${lesson.questions.length} questions but only ${availableCheckpoints} paragraph-pair checkpoints; some questions may not appear inline`);
    }
    for (const [index, question] of lesson.questions.entries()) {
      if (!question.question?.trim()) fail(`Lesson "${lesson.id}" question ${index + 1} has no prompt`);
      if (!Array.isArray(question.answers) || question.answers.length < 2) {
        fail(`Lesson "${lesson.id}" question ${index + 1} needs at least 2 answers`);
      } else {
        if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.answers.length) {
          fail(`Lesson "${lesson.id}" question ${index + 1} has out-of-range correctIndex ${question.correctIndex}`);
        }
        question.answers.forEach((answer, answerIndex) => {
          if (typeof answer !== 'string' || !answer.trim()) {
            fail(`Lesson "${lesson.id}" question ${index + 1} answer ${answerIndex + 1} is empty`);
          }
        });
      }
      if (!question.explanation?.trim()) fail(`Lesson "${lesson.id}" question ${index + 1} has no explanation`);
    }
  }

  if (!Array.isArray(lesson.sources) || lesson.sources.length === 0) {
    fail(`Lesson "${lesson.id}" has no sources`);
  } else {
    for (const [index, source] of lesson.sources.entries()) {
      if (!source.title?.trim() || !source.publisher?.trim()) {
        fail(`Lesson "${lesson.id}" source ${index + 1} needs a title and publisher`);
      }
      if (!isHttpsUrl(source.url)) fail(`Lesson "${lesson.id}" source ${index + 1} has an invalid HTTPS URL`);
    }
  }
}

const mediaLessonIds = Object.keys(inlineArticleMedia);
for (const lessonId of mediaLessonIds) {
  if (!lessonIds.has(lessonId)) fail(`Article media references unknown lesson "${lessonId}"`);
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) continue;
  const totalParagraphs = paragraphCount(lesson);
  for (const [index, figure] of (inlineArticleMedia[lessonId] ?? []).entries()) {
    const ids = new Set(lesson.sections.flatMap(s => s.paragraphs).map((p, i) => typeof p === "string" ? `legacy-paragraph-${i + 1}` : p.id));
    const byId = typeof figure.afterParagraphId === "string" && ids.has(figure.afterParagraphId);
    const byNumber = Number.isInteger(figure.afterParagraphCount) && figure.afterParagraphCount >= 1 && figure.afterParagraphCount <= totalParagraphs;
    if ((figure.afterParagraphId !== undefined && !byId) || (figure.afterParagraphCount !== undefined && !byNumber) || (figure.afterParagraphId === undefined && figure.afterParagraphCount === undefined)) {
      fail(`Inline image ${index + 1} for "${lessonId}" has an invalid paragraph placement`);
    }
    if (!isHttpsUrl(figure.url)) fail(`Inline image ${index + 1} for "${lessonId}" has an invalid HTTPS URL`);
    if (!isHttpsUrl(figure.creditUrl)) fail(`Inline image ${index + 1} for "${lessonId}" has an invalid credit URL`);
    if (!figure.caption?.trim() || !figure.credit?.trim()) {
      fail(`Inline image ${index + 1} for "${lessonId}" needs a caption and credit`);
    }
  }
}

for (const lesson of lessons) {
  if (lesson.coverKind !== 'editorial' && !Object.prototype.hasOwnProperty.call(inlineArticleMedia, lesson.id)) {
    warn(`Lesson "${lesson.id}" has no supplementary inline images (main cover image is separate)`);
  }
}

if (errors.length === 0) {
  ok(`${categories.length} unique categories`);
  ok(`${subcategories.length} unique subcategories with valid category references`);
  ok(`${lessons.length} unique lessons with consistent category/subcategory links`);
  ok('Lesson prompts, answer indexes, explanations, sources, and image metadata are structurally valid');
  ok(`${mediaLessonIds.length} lesson IDs referenced by inline media`);
}

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((message) => console.log(`  ! ${message}`));
}

if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((message) => console.error(`  ✗ ${message}`));
  console.error('\nContent validation failed. Fix the errors above before committing lesson data.');
  process.exit(1);
}

console.log('\nContent structure validation passed.');
console.log('Note: this does not verify remote URL availability, image licences, factual accuracy, or native UI behavior.\n');
