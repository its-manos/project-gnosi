/* Shared original warm-pluck synthesis for all Gnosi sound assets. */
const RATE = 22050;
const D = 587.33, F = 739.99, A = 880, HIGH_D = 1174.66, LOW_A = 440;
// Android Media3 can discard a very short clip fully buffered while paused
// before its first play (expo/expo#52724, fixed upstream by #52732). Keep
// the audible waveform intact and append PCM silence; never delay its onset.
const MIN_FILE_SECONDS = 1.1;
function render(seconds, notes, amplitude, minimumSeconds = MIN_FILE_SECONDS) {
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
  const fileFrames = Math.max(count, Math.ceil(minimumSeconds * RATE));
  const out = Buffer.alloc(44 + fileFrames * 2);
  out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(RATE,24);out.writeUInt32LE(RATE*2,28);
  out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(fileFrames*2,40);
  samples.forEach((v,i)=>out.writeInt16LE(Math.round(v/peak*amplitude*32767),44+i*2));
  return out;
}

module.exports = { render, D, F, A, HIGH_D, LOW_A };
