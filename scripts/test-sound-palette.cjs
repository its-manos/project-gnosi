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
