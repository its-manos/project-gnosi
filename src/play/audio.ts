import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { Platform } from "react-native";
import type { FeedbackKind } from "./events";
import { getSoundStatus, reportSoundStatus } from "./soundStatus";

const sources = {
  correct: require("../../assets/sounds/correct.wav"), incorrect: require("../../assets/sounds/incorrect.wav"),
  complete: require("../../assets/sounds/complete.wav"), mastered: require("../../assets/sounds/mastered.wav"),
  "level-up": require("../../assets/sounds/level-up.wav"),
};
/** One foreground cue at a time. Native status, rather than a 250 ms seek,
 * controls readiness. Packaged resources load directly on Android and iOS. */
export class FeedbackAudio {
  private players = new Map<FeedbackKind, AudioPlayer>();
  private subscriptions: { remove: () => void }[] = [];
  private failedKinds = new Set<FeedbackKind>();
  // Android reports isLoaded=false at STATE_ENDED. That means a completed cue
  // needs rewinding, not that its bundled source has disappeared.
  private preparedKinds = new Set<FeedbackKind>();
  // A real Android device can silently consume the FIRST play() of each player,
  // even when isLoaded is true. Warm every native player at volume zero once.
  private primedKinds = new Set<FeedbackKind>();
  private priming = new Map<FeedbackKind, "playing" | "rewinding">();
  private primeTimers = new Map<FeedbackKind, ReturnType<typeof setTimeout>>();
  private generation = 0;
  private alive = true;
  private starting: Promise<void> | null = null;
  private pending: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  start(): Promise<void> {
    if (!this.alive) return Promise.resolve();
    if (this.starting) return this.starting;
    if (this.players.size) return Promise.resolve();
    this.starting = this.initialize().finally(() => { this.starting = null; });
    return this.starting;
  }
  private async initialize() {
    reportSoundStatus("loading", "Φόρτωση ήχων…");
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers", shouldPlayInBackground: false, shouldRouteThroughEarpiece: false, allowsRecording: false, allowsBackgroundRecording: false });
      if (!this.alive) return;
      for (const kind of Object.keys(sources) as FeedbackKind[]) {
        const player = createAudioPlayer(sources[kind], { downloadFirst: false, keepAudioSessionActive: false });
        player.volume = kind === "incorrect" ? .45 : .65; player.loop = false;
        this.players.set(kind, player);
        if (player.isLoaded) this.preparedKinds.add(kind);
        this.subscriptions.push(player.addListener("playbackStatusUpdate", status => {
          if (!this.alive) return;
          if (status.error) { this.failedKinds.add(kind); reportSoundStatus("error", "Ο ήχος δεν φορτώθηκε. Δοκίμασε ξανά."); return; }
          if (status.isLoaded || status.didJustFinish) this.preparedKinds.add(kind);
          if (this.priming.get(kind) === "playing" && status.didJustFinish) {
            this.finishPrime(kind);
            return;
          }
          if (Platform.OS === "android" && status.isLoaded && !this.primedKinds.has(kind)) this.prime(kind);
          if (!this.priming.has(kind) && status.playing) reportSoundStatus("playing", "Αναπαραγωγή · έλεγξε την ένταση πολυμέσων και τη σύνδεση Bluetooth.");
          else if (this.audioReady() && !this.pending && !this.failedKinds.size && getSoundStatus().phase !== "playing") reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
          this.pending?.();
        }));
      }
      if (Platform.OS === "android") {
        for (const kind of Object.keys(sources) as FeedbackKind[]) this.prime(kind);
      } else if (this.audioReady()) reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
    } catch {
      if (!this.alive) return;
      this.release();
      reportSoundStatus("error", "Δεν ξεκίνησε ο ήχος. Δοκίμασε ξανά ή έλεγξε ότι εγκατέστησες το νέο Android APK.");
    }
  }
  private audioReady() {
    return [...this.players.keys()].every(kind => this.players.get(kind)?.isLoaded &&
      (Platform.OS !== "android" || this.primedKinds.has(kind)));
  }
  private prime(kind: FeedbackKind) {
    if (!this.alive || Platform.OS !== "android" || this.primedKinds.has(kind) || this.priming.has(kind) || this.failedKinds.has(kind)) return;
    const player = this.players.get(kind);
    if (!player?.isLoaded) return;
    this.priming.set(kind, "playing");
    // Muted playback initializes Android's output/decoder; a loaded player
    // alone isn't reliable for the first very short effect.
    player.volume = 0;
    this.primeTimers.set(kind, setTimeout(() => this.finishPrime(kind), 1200));
    try { player.play(); } catch { this.finishPrime(kind); }
  }
  private finishPrime(kind: FeedbackKind) {
    if (this.priming.get(kind) !== "playing") return;
    this.priming.set(kind, "rewinding");
    const timeout = this.primeTimers.get(kind);
    if (timeout) clearTimeout(timeout);
    this.primeTimers.delete(kind);
    const player = this.players.get(kind);
    if (!player) { this.priming.delete(kind); return; }
    try { if (player.playing) player.pause(); } catch { /* May already be ended. */ }
    // Rewind only AFTER the silent native playback finishes. Seeking during
    // startup can temporarily make isLoaded false on Android.
    void player.seekTo(0).then(() => {
      if (!this.alive || this.players.get(kind) !== player) return;
      player.volume = kind === "incorrect" ? .45 : .65;
      this.priming.delete(kind);
      this.primedKinds.add(kind);
      if (this.audioReady() && !this.failedKinds.size) reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
      this.pending?.();
    }).catch(() => {
      if (!this.alive || this.players.get(kind) !== player) return;
      this.priming.delete(kind);
      this.failedKinds.add(kind);
      reportSoundStatus("error", "Ο ήχος δεν προετοιμάστηκε. Δοκίμασε ξανά.");
    });
  }
  stop() {
    this.generation++; this.pending = null; clearTimeout(this.timer);
    // Never interrupt a muted warm-up for a real answer; that answer is queued.
    for (const [kind, player] of this.players) { try { if (!this.priming.has(kind) && player.playing) player.pause(); } catch { /* Optional feedback. */ } }
  }
  preview(allowed: () => boolean) {
    // Exercise the same cached-player path used by answers. Rebuild only after
    // an actual failure; rebuilding every preview concealed Android replay bugs.
    if (this.failedKinds.size || getSoundStatus().phase === "error") this.release();
    this.play("correct", allowed);
  }
  play(kind: FeedbackKind, allowed: () => boolean) {
    this.stop();
    if (!this.alive || !allowed()) return;
    const token = this.generation;
    const current = () => this.alive && token === this.generation && allowed();
    const failed = () => { if (current()) reportSoundStatus("error", "Ο ήχος δεν ανταποκρίθηκε. Πάτησε «Δοκιμή ήχου» ξανά."); };
    // Cold Android players can take longer than a warm preview to prepare.
    const timer = setTimeout(() => { failed(); if (token === this.generation) this.stop(); }, 2500);
    this.timer = timer;
    const attempt = () => {
      if (!current() || this.pending !== attempt) return;
      try {
        const player = this.players.get(kind);
        if (!player) return;
        if (Platform.OS === "android" && !this.primedKinds.has(kind)) { this.prime(kind); return; }
        if (!player.isLoaded && !this.preparedKinds.has(kind)) return;
        this.pending = null;
        const begin = () => {
          if (!current()) return;
          try { player.play(); clearTimeout(timer); } catch { clearTimeout(timer); failed(); }
        };
        // First playback is already at zero. Avoid an unnecessary native seek.
        if (player.isLoaded && player.currentTime === 0) begin();
        else void player.seekTo(0).then(begin).catch(() => { clearTimeout(timer); failed(); });
      } catch { this.pending = null; clearTimeout(timer); failed(); }
    };
    this.pending = attempt;
    void this.start().then(attempt).catch(failed);
  }
  private release() {
    this.stop(); for (const sub of this.subscriptions) { try { sub.remove(); } catch { /* Already released. */ } } this.subscriptions = [];
    for (const player of this.players.values()) { try { player.remove(); } catch { /* Already released. */ } }
    this.players.clear();
    for (const timeout of this.primeTimers.values()) clearTimeout(timeout);
    this.primeTimers.clear();
    this.priming.clear();
    this.primedKinds.clear();
    this.failedKinds.clear();
    this.preparedKinds.clear();
  }
  dispose() { this.alive = false; this.release(); }
}
