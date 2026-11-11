const assert = require('node:assert/strict');
const fs = require('node:fs');
const audio = fs.readFileSync('src/play/audio.ts', 'utf8');
function effectiveRms(kind) {
  const data = fs.readFileSync(`assets/sounds/${kind}.wav`);
  const volume = Number(audio.match(new RegExp(`\\b${kind}: (\\.\\d+)`))?.[1]);
  assert.ok(volume > 0 && volume <= .65);
  let energy = 0;
  for (let i = 44; i < data.length; i += 2) energy += (data.readInt16LE(i) / 32768) ** 2;
  return Math.sqrt(energy / ((data.length - 44) / 2)) * volume;
}
const correct = effectiveRms('correct'), incorrect = effectiveRms('incorrect');
assert.ok(incorrect >= correct * .75, 'Incorrect feedback must not become inaudible relative to correct feedback');
assert.ok(incorrect <= correct * 1.2, 'Incorrect feedback must not become a louder punishment');
console.log('Sound palette passed: incorrect/correct output levels remain comparable after player volume is applied. Hardware audibility still needs phone QA.');

// The original audible samples must survive padding byte-for-byte. This
// checks real PCM rather than a mocked player's play() count.
const { render, D } = require('./helpers/synthesize-feedback.cjs');
const raw = render(.075, [[0, D, .075]], .22, 0);
const padded = render(.075, [[0, D, .075]], .22);
assert.deepEqual(padded.subarray(44, raw.length), raw.subarray(44), 'padding preserves onset, envelope, pitch and gain');
assert.ok(padded.subarray(raw.length).every(byte => byte === 0), 'padding adds only trailing silence');
const audibleSeconds = { 'world-open': .075, 'island-open': .085, 'lesson-preview': .15, 'lesson-open': .24,
  'question-open': .13, correct: .24, incorrect: .23, complete: .56, mastered: .43, 'level-up': .74 };
for (const [kind, seconds] of Object.entries(audibleSeconds)) {
  const data = fs.readFileSync(`assets/sounds/${kind}.wav`);
  const rate = data.readUInt32LE(24), frameBytes = data.readUInt16LE(32);
  assert.equal(data.readUInt32LE(4), data.length - 8, kind + ' RIFF size');
  assert.equal(data.readUInt32LE(40), data.length - 44, kind + ' PCM size');
  assert.ok((data.length - 44) / frameBytes / rate >= 1.1, kind + ' avoids the short-clip Android path');
  const tail = data.subarray(44 + Math.round(seconds * rate) * frameBytes);
  assert.ok(tail.length > 0 && tail.every(byte => byte === 0), kind + ' has only silence after the audible cue');
}
console.log('Android asset safety passed: all ten cues have 1.1 s containers, unchanged audible samples and trailing PCM silence. Native first-play audibility still needs device QA.');
