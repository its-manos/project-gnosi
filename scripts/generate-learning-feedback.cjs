/* Original Gnosi learning palette: warm damped plucks in D major.
 * All modes use these same six cues. No external samples/dependencies.
 * Regenerate from the repo root; navigation cues share the synthesis helper. */
const fs = require('node:fs'), path = require('node:path');
const { render, D, F, A, HIGH_D } = require("./helpers/synthesize-feedback.cjs");
const cues = [
  ['question-open', .13, [[0,F,.13]], .20],
  ['correct', .24, [[0,D,.18],[.07,A,.17,.8]], .30],
  ['incorrect', .23, [[0,F,.17],[.06,D,.17,.85]], .30],
  ['complete', .56, [[0,D,.27],[.09,F,.3],[.18,A,.38]], .33],
  ['mastered', .43, [[0,A,.28],[.1,HIGH_D,.33,.8]], .32],
  ['level-up', .74, [[0,D,.3],[.1,F,.3],[.2,A,.35],[.33,HIGH_D,.41,.9]], .35],
];
for (const [name,seconds,notes,amplitude] of cues) fs.writeFileSync(path.join(__dirname,'../assets/sounds',name+'.wav'),render(seconds,notes,amplitude));
