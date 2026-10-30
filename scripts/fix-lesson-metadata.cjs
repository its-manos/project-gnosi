const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname, '../src/data/lessons.ts');
const source = fs.readFileSync(target, 'utf8');
const pattern = /export type Lesson = \{([\s\S]*?)\n\};/g;
const matches = [...source.matchAll(pattern)];
if (matches.length !== 1) throw new Error('Expected exactly one Lesson type. No file was changed.');
const fields = {
  contentNote: '  contentNote?: string;',
  coverKind: '  coverKind?: "photo" | "editorial";',
  editorialReviewedAt: '  editorialReviewedAt?: string;',
};
const additions = Object.entries(fields)
  .filter(([name]) => !new RegExp('\\b' + name + '\\??\\s*:').test(matches[0][1]))
  .map(([, declaration]) => declaration);
if (!additions.length) {
  console.log('Lesson metadata fields are already present.');
} else {
  const original = matches[0][0];
  const replacement = original.replace(/\n\};$/, '\n' + additions.join('\n') + '\n};');
  fs.writeFileSync(target, source.slice(0, matches[0].index) + replacement + source.slice(matches[0].index + original.length));
  console.log('Added missing Lesson metadata fields. Article data was preserved.');
}
