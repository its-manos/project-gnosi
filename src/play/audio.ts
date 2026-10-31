import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import type { FeedbackKind } from "./events";

const sources = {
  correct: require("../../assets/sounds/correct.wav"), incorrect: require("../../assets/sounds/incorrect.wav"),
  complete: require("../../assets/sounds/complete.wav"), mastered: require("../../assets/sounds/mastered.wav"),
  "level-up": require("../../assets/sounds/level-up.wav"),
};
/** Bundled original tones. One player may sound at a time; late seeks are dropped. */
export class FeedbackAudio {
  private players = new Map<FeedbackKind, AudioPlayer>();
  private generation = 0;
  private alive = true;
  private configured = false;
  async start() {
    try {
      await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false, allowsRecording: false, allowsBackgroundRecording: false });
      if (!this.alive) return;
      for (const kind of Object.keys(sources) as FeedbackKind[]) {
        const player = createAudioPlayer(sources[kind], { downloadFirst: true, keepAudioSessionActive: false });
        player.volume = kind === "incorrect" ? .28 : .42; player.loop = false; this.players.set(kind, player);
      }
      this.configured = true;
    } catch { this.dispose(); }
  }
  stop() { this.generation++; for (const player of this.players.values()) { try { player.pause(); } catch { /* Optional native feedback. */ } } }
  play(kind: FeedbackKind, allowed: () => boolean) {
    this.stop(); const token = this.generation, started = Date.now(), player = this.players.get(kind);
    if (!this.alive || !this.configured || !allowed() || !player?.isLoaded) return;
    void player.seekTo(0).then(() => {
      if (this.alive && token === this.generation && allowed() && Date.now() - started < 250) player.play();
    }).catch(() => { /* No sound is preferable to interrupting learning. */ });
  }
  dispose() { this.alive = false; this.stop(); for (const player of this.players.values()) { try { player.remove(); } catch { /* Already released. */ } } this.players.clear(); }
}
