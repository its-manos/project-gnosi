const assert = require("node:assert/strict");
const { load } = require("./helpers/load-typescript.cjs");
const { categories, lessons } = load("src/data/lessons.ts");
const { categoryCompletionRows } = load("src/utils/categoryCompletion.ts");

const empty = categoryCompletionRows([]);
assert.equal(empty.length, categories.length);
assert.ok(empty.every(row => row.count === 0 && row.percent === 0));
assert.deepEqual(empty.map(row => row.category.id), categories.map(category => category.id));

const completed = [lessons[0].id, lessons[1].id, lessons[0].id];
const rows = categoryCompletionRows(completed);
for (const row of rows) {
  const categoryLessons = lessons.filter(lesson => lesson.categoryId === row.category.id);
  const count = categoryLessons.filter(lesson => new Set(completed).has(lesson.id)).length;
  assert.equal(row.total, categoryLessons.length);
  assert.equal(row.count, count);
  assert.equal(row.percent, row.total ? Math.round(count / row.total * 100) : 0);
}
const all = categoryCompletionRows(lessons.map(lesson => lesson.id));
assert.ok(all.every(row => row.total === 0 || row.percent === 100));
console.log("Category completion selector passed");
