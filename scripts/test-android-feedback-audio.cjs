const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const kinds = ['correct', 'incorrect', 'complete', 'mastered', 'level-up', 'question-open', 'lesson-preview', 'lesson-open', 'world-open', 'island-open'];
function fixture({ loaded = true } = {}) {
  const players = [], seeks = [];
  const { FeedbackAudio } = load('src/play/audio.ts', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-audio': {
      setAudioModeAsync: async () => {},
      createAudioPlayer(source) {
        assert.ok(source, 'bundled source prepares directly');
        const p = {
          isLoaded: loaded, currentTime: 0, playing: false, intent: false,
          plays: 0, pauses: 0, automatic: 0,
          addListener(_event, listener) { this.status = listener; return { remove() {} }; },
          play() { this.intent = true; this.plays++; /* native playing status intentionally lags */ },
          pause() { this.intent = false; this.pauses++; },
          end() { this.playing = false; this.isLoaded = false; this.currentTime = .25; this.status({ didJustFinish: true, isLoaded: false }); },
          seekTo() {
            return new Promise(resolve => seeks.push(() => {
              if (this.intent) this.automatic++;
              this.isLoaded = true; this.currentTime = 0;
              this.status({ isLoaded: true });
              resolve();
            }));
          },
          remove() {},
        };
        players.push(p); return p;
      },
    },
    ...Object.fromEntries(kinds.map((kind, i) => ['../../assets/sounds/' + kind + '.wav', i + 1])),
  });
  return { audio: new FeedbackAudio(), players, seeks, resolve() { assert.ok(seeks.length); seeks.shift()(); } };
}
(async () => {
  let f = fixture(); await f.audio.start();
  assert.ok(f.players.every(p => p.plays === 0), 'initialization stays quiet');
  f.audio.play('correct', () => true); await flush();
  const p = f.players[0];
  assert.equal(p.plays, 1, 'first Android cue uses one play, without warm-up');
  assert.equal(f.seeks.length, 0, 'cold prepared source needs no seek');
  f.audio.stop(); assert.equal(p.intent, false, 'stop clears intent despite playing=false');
  f.audio.play('correct', () => true); await flush(); f.resolve(); await flush();
  p.end();
  assert.equal(p.intent, true, 'mock retains Android playWhenReady at STATE_ENDED');
  f.audio.play('correct', () => true); await flush(); f.resolve(); await flush();
  assert.equal(p.automatic, 0, 'rewind never auto-resumes ended Android playback');
  assert.equal(p.plays, 3, 'one audible play per request');
  p.end();
  f.audio.play('correct', () => true); await flush();
  f.audio.play('correct', () => true); await flush();
  assert.equal(f.seeks.length, 1, 'same-player requests share the in-flight rewind');
  f.resolve(); await flush();
  assert.equal(p.plays, 4, 'only latest replay starts after shared seek');
  p.end(); f.audio.play('correct', () => true); await flush();
  f.audio.play('incorrect', () => true); await flush();
  assert.equal(f.players[1].plays, 1);
  f.resolve(); await flush(); assert.equal(p.plays, 4, 'superseded seek stays silent');
  f.audio.dispose();

  f = fixture(); await f.audio.start(); f.players[0].currentTime = .1;
  f.audio.play('correct', () => true); await flush();
  const now = Date.now;
  try {
    const later = now() + 600; Date.now = () => later;
    f.resolve(); await flush();
    assert.equal(f.players[0].plays, 0, 'deadline guards a late seek even before timer runs');
  } finally { Date.now = now; f.audio.dispose(); }

  f = fixture({ loaded: false }); await f.audio.start();
  f.audio.play('incorrect', () => true); await flush();
  f.audio.stop();
  f.players[1].isLoaded = true; f.players[1].status({ isLoaded: true }); await flush();
  assert.equal(f.players[1].plays, 0, 'background/mute cancels delayed readiness');
  f.audio.dispose();
  console.log('Android audio passed: one cold play, retained play intent, lagging status, shared rewinds, supersession, deadline and cancellation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
