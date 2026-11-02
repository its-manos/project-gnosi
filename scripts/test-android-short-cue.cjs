/* Regression: Android's very short wrong-answer WAV can end with isLoaded=false.
 * A native unmute acknowledgement must still release the first requested cue.
 * This harness mocks expo-audio; it does NOT replace device/audio QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/play/audio.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
} }).outputText;
const players = [];
let startupPlayCount = 0;
class MockPlayer {
  constructor() {
    this.isLoaded = false;
    this.currentTime = 0;
    this.playing = false;
    this.volume = 0;
    this._muted = false;
    this.listeners = new Set();
    this.silentPlays = 0;
    this.audiblePlays = 0;
    players.push(this);
  }
  get muted() { return this._muted; }
  set muted(value) {
    this._muted = value;
    queueMicrotask(() => this.emit({ mute: value, isLoaded: this.isLoaded, playing: this.playing }));
  }
  emit(status = {}) {
    for (const fn of this.listeners) fn({
      mute: this.muted, isLoaded: this.isLoaded,
      didJustFinish: false, playing: this.playing, error: null, ...status,
    });
  }
  addListener(event, fn) {
    assert.equal(event, 'playbackStatusUpdate');
    this.listeners.add(fn);
    return { remove: () => this.listeners.delete(fn) };
  }
  replace(source) {
    assert.ok(source);
    this.isLoaded = true;
    queueMicrotask(() => this.emit({ mute: true, isLoaded: true }));
  }
  play() {
    startupPlayCount++;
    if (this.muted) {
      this.silentPlays++;
      // Android can report isLoaded=false on STATE_ENDED, including after
      // seeking to zero. Native muted=false will also report isLoaded=false.
      this.isLoaded = false;
      this.currentTime = 0.16;
      this.playing = false;
      this.emit({ mute: true, didJustFinish: true, isLoaded: false, playing: false });
    } else {
      this.audiblePlays++;
      this.playing = true;
      this.emit({ mute: false, isLoaded: this.isLoaded, playing: true });
    }
  }
  pause() { this.playing = false; }
  seekTo(time) {
    this.currentTime = time;
    // Deliberately leave isLoaded=false to reproduce Android's ended state.
    return Promise.resolve();
  }
  remove() { this.listeners.clear(); }
}
const soundStatus = { phase: 'loading' };
const status = {
  getSoundStatus: () => soundStatus,
  reportSoundStatus: (phase) => { soundStatus.phase = phase; },
};
const moduleShim = { exports: {} };
vm.runInNewContext(js, {
  module: moduleShim, exports: moduleShim.exports,
  require: name => {
    if (name === 'expo-audio') return {
      createAudioPlayer: () => new MockPlayer(),
      setAudioModeAsync: async () => {},
    };
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (name === './soundStatus') return status;
    if (name.endsWith('.wav')) return 1;
    throw Error('unexpected import ' + name);
  },
  setTimeout, clearTimeout,
});
const { FeedbackAudio } = moduleShim.exports;
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

(async () => {
  const audio = new FeedbackAudio();
  await audio.start();
  await tick();
  assert.equal(players.length, 5);
  assert.equal(startupPlayCount, 0, 'opening app must not prime/play any sound');
  audio.play('incorrect', () => true);
  await tick();
  assert.equal(players[1].silentPlays, 1, 'first wrong cue safely primes muted');
  assert.equal(players[1].audiblePlays, 1, 'wrong cue must play once after muted=false even when isLoaded=false');
  assert.equal(players[1].volume, .65, 'wrong-answer sound should be as audible as success sound');
  audio.play('correct', () => true);
  await tick();
  assert.equal(players[0].silentPlays, 1);
  assert.equal(players[0].audiblePlays, 1);
  audio.play('incorrect', () => true);
  await tick();
  assert.equal(players[1].silentPlays, 1, 'same cue should not warm up a second time');
  assert.equal(players[1].audiblePlays, 2, 'repeated wrong answers should still make a sound');
  audio.play('incorrect', () => false);
  await tick();
  assert.equal(players[1].audiblePlays, 2, 'disabled sound remains silent');
  audio.dispose();
  assert.equal(soundStatus.phase === 'error', false, 'no silent-priming timeout or failure');
  console.log('Android short-cue regression passed: silent startup, ended-state unmute, first/repeated wrong answer, correct answer and muted preference.');
})().catch(error => { console.error(error); process.exitCode = 1; });
