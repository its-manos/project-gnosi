/* Original short plucks, sharing Gnosi's existing D-major sound palette.
 * Containers keep the shared trailing-silence workaround for Android. */
const fs = require('node:fs'), path = require('node:path');
const { render, D, F, A, LOW_A } = require('./helpers/synthesize-feedback.cjs');
const cues = [
  ['pvp-join', .22, [[0,D,.13],[.065,F,.15,.8]], .24],
  ['pvp-leave', .19, [[0,F,.12],[.06,LOW_A,.13,.7]], .20],
  ['pvp-ready', .18, [[0,F,.12],[.055,A,.125,.8]], .24],
  ['pvp-countdown', .09, [[0,A,.09]], .22],
  ['pvp-lock', .14, [[0,D,.14],[0,A,.10,.4]], .22],
  ['pvp-warning', .23, [[0,LOW_A,.10],[.12,LOW_A,.10,.8]], .22],
];
for (const [name,seconds,notes,amplitude] of cues) fs.writeFileSync(path.join(__dirname,'../assets/sounds',name+'.wav'),render(seconds,notes,amplitude));
