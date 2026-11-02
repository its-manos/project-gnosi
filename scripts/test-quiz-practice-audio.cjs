/* Non-scoring preview audio: emitted once per accepted action, never on mount or duplicates. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.join(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const code = transpile(file);
  vm.runInNewContext(code, { module, exports: module.exports,
    require: id => {
      if (!id.startsWith('.')) throw Error('unexpected external import ' + id);
      return load(path.normalize(path.join(path.dirname(file), id)) + '.ts');
    },
  });
  cache.set(file, module.exports);
  return module.exports;
}
const engine = load('src/quiz/engine.ts');
const flow = load('src/quiz/previewFlow.ts');
const status = load('src/play/soundStatus.ts');
const questions = load('src/quiz/previewQuestions.ts').previewQuestions;
const acceptedCues = [];
const good = status.subscribePracticeCue(kind => acceptedCues.push(kind));
const erroring = status.subscribePracticeCue(() => { throw Error('Audio is optional'); });
const answerFor = q => q.type === 'multiple-select' ? [...q.content.correctIndices] :
  q.type === 'ordering' ? [...q.content.correctOrder] :
  Object.fromEntries(q.content.pairs.map(pair => [pair.leftId, pair.rightId]));
let session = engine.createQuizSession('preview:quiz-question-types', 'challenge', questions);
assert.deepEqual(acceptedCues, [], 'mount never plays any sound');
let change = flow.submitPreviewAnswer(session, null);
assert.equal(change.changed, false);
assert.equal(change.cue, null);
assert.equal(engine.advanceQuizSession(session, engine.questionToken(session)).changed, false);
change = flow.submitPreviewAnswer(session, answerFor(questions[0]));
assert.equal(change.changed, true);
assert.equal(change.cue, 'correct');
session = change.session;
status.requestPracticeCue(change.cue);
change = flow.submitPreviewAnswer(session, answerFor(questions[0]));
assert.equal(change.changed, false);
assert.equal(change.cue, null);
change = flow.advancePreview(session);
assert.equal(change.changed, true);
assert.equal(change.cue, null);
session = change.session;
const wrongOrder = questions[1].content.items.map(item => item.id);
assert.equal(engine.evaluateAnswer(questions[1], wrongOrder).correct, false);
change = flow.submitPreviewAnswer(session, wrongOrder);
assert.equal(change.changed, true);
assert.equal(change.cue, 'incorrect');
session = change.session;
status.requestPracticeCue(change.cue);
session = flow.advancePreview(session).session;
change = flow.submitPreviewAnswer(session, answerFor(questions[2]));
assert.equal(change.changed, true);
assert.equal(change.cue, 'correct');
session = change.session;
status.requestPracticeCue(change.cue);
change = flow.advancePreview(session);
assert.equal(change.changed, true);
assert.equal(change.session.completed, true);
assert.equal(change.cue, 'complete');
session = change.session;
status.requestPracticeCue(change.cue);
assert.equal(flow.advancePreview(session).cue, null);
assert.equal(flow.submitPreviewAnswer(session, answerFor(questions[2])).cue, null);
assert.deepEqual(JSON.parse(JSON.stringify(acceptedCues)), ['correct', 'incorrect', 'correct', 'complete']);
good(); erroring();
status.requestPracticeCue('correct');
assert.equal(acceptedCues.length, 4, 'unsubscribing prevents stale listeners');
const player = fs.readFileSync(path.join(root, 'src/play/PlayFeedback.tsx'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'src/screens/QuizTypesPreviewScreen.tsx'), 'utf8');
assert.match(player, /subscribePracticeCue\(kind =>/);
assert.match(player, /audio\.play\(kind, allowed\)/);
assert.match(player, /unsubscribePractice\(\)/);
assert.match(preview, /sessionRef\.current = transition\.session;[\s\S]*?requestPracticeCue\(transition\.cue\)/);
assert.doesNotMatch(preview, /emitPlayFeedback|commitRecord|useDailyChallenge|useLearningSession/);
console.log('Practice audio passed: accepted correct/incorrect and completion cues, no mount/invalid/duplicate sounds, safe listeners, shared player with settings, and no XP writes.');
