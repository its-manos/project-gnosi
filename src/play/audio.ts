import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import type { FeedbackKind } from "./events";
import { getSoundStatus, reportSoundStatus } from "./soundStatus";

const sources = {
  correct: require("../../assets/sounds/correct.wav"), incorrect: require("../../assets/sounds/incorrect.wav"),
  complete: require("../../assets/sounds/complete.wav"), mastered: require("../../assets/sounds/mastered.wav"),
  "level-up": require("../../assets/sounds/level-up.wav"),
  "question-open": require("../../assets/sounds/question-open.wav"),
  "lesson-preview": require("../../assets/sounds/lesson-preview.wav"),
  "lesson-open": require("../../assets/sounds/lesson-open.wav"),
  "world-open": require("../../assets/sounds/world-open.wav"),
  "island-open": require("../../assets/sounds/island-open.wav"),
};
// One loudness hierarchy for every learning mode; browsing remains quiet.
const volumes: Record<FeedbackKind, number> = {
  "world-open": .22, "island-open": .24, "lesson-preview": .36, "lesson-open": .36,
  "question-open": .32, correct: .46, incorrect: .44, complete: .52, mastered: .54, "level-up": .58,
};
const cueVolume = (kind: FeedbackKind) => volumes[kind];
/** One foreground cue at a time. Native status, rather than a 250 ms seek,
 * controls readiness. Packaged resources load directly on Android and iOS. */
export class FeedbackAudio {
  private players = new Map<FeedbackKind, AudioPlayer>();
  private subscriptions: { remove: () => void }[] = [];
  private failedKinds = new Set<FeedbackKind>();
  // Android reports isLoaded=false at STATE_ENDED. That means a completed cue
  // needs rewinding, not that its bundled source has disappeared.
  private preparedKinds = new Set<FeedbackKind>();
  // Native `playing` can lag behind play(), or be false at STATE_ENDED
  // while playWhenReady remains true. Track commands instead of polling it.
  private activePlayer: AudioPlayer | null = null;
  private usedPlayers = new Set<AudioPlayer>();
  private seeks = new Map<AudioPlayer, Promise<void>>();
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
      await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false, shouldRouteThroughEarpiece: false, allowsRecording: false, allowsBackgroundRecording: false });
      if (!this.alive) return;
      for (const kind of Object.keys(sources) as FeedbackKind[]) {
        // Loading a packaged source prepares it without playing a silent copy.
        const player = createAudioPlayer(sources[kind], { downloadFirst: false, keepAudioSessionActive: false });
        player.volume = cueVolume(kind);
        player.loop = false;
        this.players.set(kind, player);
        if (player.isLoaded) this.preparedKinds.add(kind);
        this.subscriptions.push(player.addListener("playbackStatusUpdate", status => {
          if (!this.alive) return;
          if (status.error) { this.failedKinds.add(kind); reportSoundStatus("error", "Ο ήχος δεν φορτώθηκε. Δοκίμασε ξανά."); return; }
          if (status.isLoaded || status.didJustFinish) this.preparedKinds.add(kind);
          if (status.playing) reportSoundStatus("playing", "Αναπαραγωγή · έλεγξε την αθόρυβη λειτουργία, την ένταση πολυμέσων και το Bluetooth.");
          else if (this.audioReady() && !this.pending && !this.failedKinds.size && getSoundStatus().phase !== "playing") reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
          this.pending?.();
        }));
      }
      if (this.audioReady()) reportSoundStatus("ready", "Ήχοι έτοιμοι · ένταση από τα πολυμέσα της συσκευής.");
    } catch {
      if (!this.alive) return;
      this.release();
      reportSoundStatus("error", "Δεν ξεκίνησε ο ήχος. Δοκίμασε ξανά ή έλεγξε ότι εγκατέστησες το νέο Android APK.");
    }
  }
  private audioReady() {
    return this.players.size > 0 && [...this.players.values()].every(player => player.isLoaded);
  }
  private rewind(player: AudioPlayer) {
    const pending = this.seeks.get(player);
    if (pending) return pending;
    // Clear Android's playWhenReady BEFORE seek: seeking an ended player can
    // otherwise restart it automatically, ahead of the guarded play() below.
    player.pause();
    const seek = player.seekTo(0).finally(() => {
      if (this.seeks.get(player) === seek) this.seeks.delete(player);
    });
    this.seeks.set(player, seek);
    return seek;
  }
  stop() {
    this.generation++; this.pending = null; clearTimeout(this.timer);
    const player = this.activePlayer;
    this.activePlayer = null;
    try { player?.pause(); } catch { /* Optional feedback. */ }
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
    const deadline = Date.now() + 500;
    const valid = () => this.alive && token === this.generation && allowed();
    const current = () => valid() && Date.now() < deadline;
    const failed = () => { if (valid()) reportSoundStatus("error", "Ο ήχος δεν ανταποκρίθηκε. Πάτησε «Δοκιμή ήχου» ξανά."); };
    // Drop stale effects rather than playing them seconds after the action.
    const timer = setTimeout(() => { failed(); if (token === this.generation) this.stop(); }, 500);
    this.timer = timer;
    const attempt = () => {
      if (!current() || this.pending !== attempt) return;
      try {
        const player = this.players.get(kind);
        if (!player) return;
        if (!player.isLoaded && !this.preparedKinds.has(kind)) return;
        this.pending = null;
        const begin = () => {
          if (!current()) return;
          try { this.activePlayer = player; this.usedPlayers.add(player); player.play(); clearTimeout(timer); } catch { clearTimeout(timer); failed(); }
        };
        // First playback is already at zero. Avoid an unnecessary native seek.
        if (!this.usedPlayers.has(player) && player.isLoaded && player.currentTime === 0 && !this.seeks.has(player)) begin();
        else void this.rewind(player).then(begin).catch(() => { clearTimeout(timer); failed(); });
      } catch { this.pending = null; clearTimeout(timer); failed(); }
    };
    this.pending = attempt;
    void this.start().then(attempt).catch(failed);
  }
  private release() {
    this.stop(); for (const sub of this.subscriptions) { try { sub.remove(); } catch { /* Already released. */ } } this.subscriptions = [];
    for (const player of this.players.values()) { try { player.remove(); } catch { /* Already released. */ } }
    this.players.clear();
    this.seeks.clear();
    this.usedPlayers.clear();
    this.failedKinds.clear();
    this.preparedKinds.clear();
  }
  dispose() { this.alive = false; this.release(); }
}
