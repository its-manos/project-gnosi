/* Deterministic resume coordinate tests independent of RN layout timing. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(__dirname, "..");
require.extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename,
);
const { lessons } = require(path.join(root, "src/data/lessons.ts"));
const { getReaderResumeAnchor, resolveReaderScrollY } = require(path.join(root, "src/utils/readerScrollPosition.ts"));

const athens = lessons.find(lesson => lesson.id === "ancient-athens");
assert.ok(athens);
assert.equal(getReaderResumeAnchor(athens, {}), null, "First visit must not jump");
const completedFirst = { 0: athens.questions[0].correctIndex };
const nextSection = getReaderResumeAnchor(athens, completedFirst);
assert.deepEqual(nextSection, { kind: "paragraph", number: 4 });
const sectionPositions = {
  sectionStarts: [1, 4, 7],
  sectionPositions: { 0: 100, 1: 930 },
  paragraphPositions: { 4: { sectionIndex: 1, y: 90 } },
  checkpointPositions: {},
  finishPosition: null,
};
assert.equal(resolveReaderScrollY(nextSection, sectionPositions), 938,
  "Next section should align its heading marker, not show the space above it");
assert.equal(resolveReaderScrollY(nextSection, { ...sectionPositions, sectionPositions: {} }), undefined,
  "Wait for anchor measurement before scrolling");
assert.equal(resolveReaderScrollY(nextSection, { ...sectionPositions, paragraphPositions: {} }), undefined,
  "Do not guess a position before the paragraph is laid out");

// Legacy midpoint checkpoints resume INSIDE a section; previously the reader
// could jump to the next section because its start was >= the paragraph.
const legacy = {
  sections: [
    { paragraphs: ["one", "two", "three", "four"] },
    { paragraphs: ["five", "six"] },
  ],
  questions: [{}, {}],
};
const withinSection = getReaderResumeAnchor(legacy, { 0: 0 });
assert.deepEqual(withinSection, { kind: "paragraph", number: 3 });
const inside = {
  sectionStarts: [1, 5],
  sectionPositions: { 0: 100, 1: 800 },
  paragraphPositions: { 3: { sectionIndex: 0, y: 290 } },
  checkpointPositions: {},
  finishPosition: null,
};
assert.equal(resolveReaderScrollY(withinSection, inside), 378,
  "Target the actual paragraph instead of selecting the next section");

// Several Ancient Greece chapters have consecutive questions at the same
// section ending. A partially answered group resumes at the question card.
const grouped = lessons.find(lesson => lesson.id === "greek-science-knowledge");
assert.ok(grouped);
const firstAnswered = { 0: grouped.questions[0].correctIndex };
const gate = getReaderResumeAnchor(grouped, firstAnswered);
assert.deepEqual(gate, { kind: "checkpoint", number: 6 });
const atCheckpoint = {
  sectionStarts: [1],
  sectionPositions: { 0: 130 },
  paragraphPositions: { 6: { sectionIndex: 0, y: 730 } },
  checkpointPositions: { 6: 260 },
  finishPosition: null,
};
assert.equal(resolveReaderScrollY(gate, atCheckpoint), 1108,
  "Resume at the question invitation, not the long paragraph above it");
assert.equal(resolveReaderScrollY(gate, { ...atCheckpoint, checkpointPositions: {} }), undefined,
  "Wait for the checkpoint card to be measured");

const completed = Object.fromEntries(athens.questions.map((q, i) => [i, q.correctIndex]));
const finish = getReaderResumeAnchor(athens, completed);
assert.deepEqual(finish, { kind: "finish" }, "Fully answered unfinished article resumes at completion");
assert.equal(resolveReaderScrollY(finish, { ...sectionPositions, finishPosition: 2600 }), 2588);
assert.equal(resolveReaderScrollY(finish, sectionPositions), undefined);
console.log("Reader resume anchors passed: first visit, section headings, mid-section paragraphs, grouped checkpoints, completion and deferred measurement.");
