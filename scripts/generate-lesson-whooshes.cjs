/* Original, deterministic filtered-noise UI sweeps; no third-party samples.
 * Run from the repo root. Mono 22.05 kHz PCM keeps both assets under 20 KB. */
const fs = require('node:fs');
const path = require('node:path');
function whoosh(seconds, seed, falling) {
  const rate = 22050, count = Math.round(seconds * rate), samples = [];
  let noiseState = seed, low = 0, smooth = 0;
  for (let i = 0; i < count; i++) {
    noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
    const noise = noiseState / 2147483648 - 1, t = i / (count - 1);
    // A moving low-pass with the very low frequencies removed: airy, no click.
    const sweep = falling ? 1 - t : t;
    const cutoff = 650 + 2800 * sweep;
    low += (1 - Math.exp(-2 * Math.PI * 230 / rate)) * (noise - low);
    smooth += (1 - Math.exp(-2 * Math.PI * cutoff / rate)) * (noise - low - smooth);
    samples.push(smooth * Math.sin(Math.PI * t) ** 1.8);
  }
  const peak = Math.max(...samples.map(Math.abs));
  const bytes = Buffer.alloc(44 + count * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(count * 2, 40);
  samples.forEach((value, i) => bytes.writeInt16LE(Math.round(value / peak * 0.30 * 32767), 44 + i * 2));
  return bytes;
}
for (const [name, seconds, seed, falling] of [['lesson-preview', 0.16, 1907, false], ['lesson-open', 0.23, 5201, true]]) {
  fs.writeFileSync(path.join(__dirname, '../assets/sounds', name + '.wav'), whoosh(seconds, seed, falling));
}
