/* Original Gnosi learning palette: warm damped plucks in D major.
 * All modes use these same six cues. No external samples/dependencies.
 * Regenerate from the repo root; navigation swishes are maintained separately. */
const fs = require('node:fs'), path = require('node:path');
const RATE = 22050;
const D = 587.33, F = 739.99, A = 880, HIGH_D = 1174.66;
function render(seconds, notes, amplitude) {
  const count = Math.round(seconds * RATE), samples = [];
  for (let i = 0; i < count; i++) {
    const t = i / RATE;
    let value = 0;
    for (const [start, frequency, length, gain = 1] of notes) {
      const age = t - start;
      if (age < 0 || age > length) continue;
      const envelope = Math.min(1, age / .008) * Math.exp(-5 * age / length) * Math.max(0, Math.sin(Math.PI * age / length)) ** .5;
      const phase = 2 * Math.PI * frequency * age;
      value += gain * envelope * (Math.sin(phase) + .12 * Math.sin(2 * phase) + .025 * Math.sin(3 * phase));
    }
    // Fade the file boundary even when the last pluck's tail reaches it.
    samples.push(value * Math.min(1, (count - 1 - i) / (RATE * .012)));
  }
  const peak = Math.max(...samples.map(Math.abs));
  if (!Number.isFinite(peak) || peak <= 0) throw Error("invalid_sound_samples");
  const out = Buffer.alloc(44 + count * 2);
  out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(RATE,24);out.writeUInt32LE(RATE*2,28);
  out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(count*2,40);
  samples.forEach((v,i)=>out.writeInt16LE(Math.round(v/peak*amplitude*32767),44+i*2));
  return out;
}
const cues = [
  ['question-open', .13, [[0,F,.13]], .20],
  ['correct', .24, [[0,D,.18],[.07,A,.17,.8]], .30],
  ['incorrect', .18, [[0,440,.18]], .24],
  ['complete', .56, [[0,D,.27],[.09,F,.3],[.18,A,.38]], .33],
  ['mastered', .43, [[0,A,.28],[.1,HIGH_D,.33,.8]], .32],
  ['level-up', .74, [[0,D,.3],[.1,F,.3],[.2,A,.35],[.33,HIGH_D,.41,.9]], .35],
];
for (const [name,seconds,notes,amplitude] of cues) fs.writeFileSync(path.join(__dirname,'../assets/sounds',name+'.wav'),render(seconds,notes,amplitude));
