/* Historical entry point: now generates warm tonal transitions, not noise
 * whooshes. Shares the same synthesis and notes as learning feedback. */
const fs = require('node:fs'), path = require('node:path');
const { render, D, F, LOW_A } = require('./helpers/synthesize-feedback.cjs');
const cues = [
  // Preview rises lightly; entering a lesson has a lower, slower resolution.
  ['lesson-preview', .15, [[0,D,.12],[.035,F,.115,.7]], .26],
  ['lesson-open', .24, [[0,LOW_A,.18],[.09,D,.15,.85]], .28],
  ['world-open', .075, [[0,D,.075]], .22],
  ['island-open', .085, [[0,F,.085]], .22],
];
for (const [name, seconds, notes, amplitude] of cues) {
  fs.writeFileSync(path.join(__dirname, '../assets/sounds', name + '.wav'), render(seconds, notes, amplitude));
}
