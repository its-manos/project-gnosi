import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
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
  private generation = 0;
  private alive = true;
  private starting: Promise<void> | null = null;
  private pending: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  start(): Promise<void> {
    if (!this.alive || this.players.size) return Promise.resolve();
    if (this.starting) return this.starting;
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
          if (status.playing) reportSoundStatus("playing", "Αναπαραγωγή · έλεγξε την ένταση πολυμέσων και τη σύνδεση Bluetooth.");
          else if (status.isLoaded && !this.pending && !this.failedKinds.size && getSoundStatus().phase !== "playing") reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
          this.pending?.();
        }));
      }
      if ([...this.players.values()].every(p => p.isLoaded)) reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
    } catch {
      if (!this.alive) return;
      this.release();
      reportSoundStatus("error", "Δεν ξεκίνησε ο ήχος. Δοκίμασε ξανά ή έλεγξε ότι εγκατέστησες το νέο Android APK.");
    }
  }
  stop() {
    this.generation++; this.pending = null; clearTimeout(this.timer);
    for (const player of this.players.values()) { try { player.pause(); } catch { /* Optional feedback. */ } }
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
    const timer = setTimeout(() => { failed(); if (token === this.generation) this.stop(); }, 1500);
    this.timer = timer;
    const attempt = () => {
      if (!current() || this.pending !== attempt) return;
      try {
        const player = this.players.get(kind);
        if (!player || (!player.isLoaded && !this.preparedKinds.has(kind))) return;
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
    this.failedKinds.clear();
    this.preparedKinds.clear();
  }
  dispose() { this.alive = false; this.release(); }
}
