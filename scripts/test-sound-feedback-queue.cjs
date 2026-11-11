const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { SoundFeedbackQueue } = load('src/play/SoundFeedbackQueue.ts');
const tick = () => Promise.resolve();
(async () => {
  let now = 1000; const heard=[];
  const queue = new SoundFeedbackQueue(kind=>heard.push(kind),()=>now);
  queue.enqueue('correct');queue.enqueue('complete');queue.enqueue('level-up');queue.enqueue('question-open');
  await tick();assert.deepEqual(heard,['level-up'],'One action plays its strongest cue');
  now+=50;queue.enqueue('world-open');queue.enqueue('complete');await tick();
  assert.deepEqual(heard,['level-up'],'A transition does not truncate a celebration');
  queue.enqueue('incorrect');queue.enqueue('question-open');await tick();assert.equal(heard.at(-1),'incorrect','A newly confirmed answer still receives feedback');
  now+=500;queue.enqueue('question-open');await tick();assert.equal(heard.at(-1),'question-open');
  queue.enqueue('correct');queue.clear();await tick();assert.equal(heard.at(-1),'question-open','Mute/background/dispose cancel queued audio');
  queue.enqueue('complete');queue.clear();queue.enqueue('lesson-preview');await tick();
  assert.equal(heard.at(-1),'lesson-preview','An old microtask cannot consume a later cue');
  const broken = new SoundFeedbackQueue(()=>{throw Error('native unavailable');});broken.enqueue('correct');await tick();
  console.log('Sound queue passed: single strongest cue, celebration priority, new answer feedback, cancellation, recovery and failure isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
