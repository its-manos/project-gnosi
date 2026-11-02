/* Real development fixtures must use exactly the same validated session engine. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const code = file => ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const engineModule = { exports: {} };
vm.runInNewContext(code('src/quiz/engine.ts'), { module: engineModule, exports: engineModule.exports });
const engine = engineModule.exports;
const previewModule = { exports: {} };
vm.runInNewContext(code('src/quiz/previewQuestions.ts'), {
  module: previewModule, exports: previewModule.exports,
  require: id => { if (id !== './engine') throw Error(id); return engine; },
});
const questions = previewModule.exports.previewQuestions;
assert.equal(questions.length, 3);
assert.deepEqual(Array.from(questions, q => q.type), ['multiple-select', 'ordering', 'matching']);
let session = engine.createQuizSession('preview:quiz-question-types', 'challenge', questions);
const answerFor = q => {
  if (q.type === 'multiple-select') return [...q.content.correctIndices].reverse();
  if (q.type === 'ordering') return [...q.content.correctOrder];
  if (q.type === 'matching') return Object.fromEntries(q.content.pairs.map(pair => [pair.leftId, pair.rightId]));
  throw Error('unexpected type');
};
for (const question of questions) {
  const token = engine.questionToken(session);
  assert.equal(token.id, question.id);
  const next = engine.submitQuizAnswer(session, token, answerFor(question));
  assert.equal(next.reason, 'accepted');
  session = engine.advanceQuizSession(next.session, token).session;
}
const completed = engine.restoreQuizSession(engine.serializeQuizSession(session));
assert.equal(completed.completed, true);
assert.equal(engine.calculateQuizResults(completed).correctCount, 3);
const previewFile = fs.readFileSync(path.join(__dirname, '..', 'src/screens/QuizTypesPreviewScreen.tsx'), 'utf8');
assert.equal(previewFile.includes('useDailyChallenge'), false, 'preview must not use saved daily quiz hook');
assert.equal(previewFile.includes('useLearningSession'), false, 'preview must not write account progress');
assert.equal(previewFile.includes('commitRecord'), false, 'preview must not write daily records');
console.log('Mixed-format dev preview passed: valid sourced fixtures, 3 complete steps, serialization and isolation from daily progress.');
