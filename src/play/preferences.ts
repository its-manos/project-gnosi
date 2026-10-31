type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type PlayPreferences = { ready: boolean; sound: boolean; animations: boolean; reducedMotion: boolean; motionReady: boolean; error: boolean };
export const PLAY_PREFERENCES_KEY = "@gnosi/play-feedback-v1";
/** Device preferences contain no account or learning data and cause no cloud writes. */
export class PlayPreferencesStore {
  private snapshot: PlayPreferences = { ready: false, sound: true, animations: true, reducedMotion: true, motionReady: false, error: false };
  private listeners = new Set<() => void>();
  private storage: Storage | null = null;
  private loading: Promise<void> | null = null;
  private writes: Promise<void> = Promise.resolve();
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(change: Partial<PlayPreferences>) { this.snapshot = { ...this.snapshot, ...change }; for (const listener of this.listeners) listener(); }
  async load(storage: Storage): Promise<void> {
    this.storage = storage;
    if (this.loading) return this.loading;
    if (this.snapshot.ready && !this.snapshot.error) return;
    this.loading = (async () => {
      try {
        const bytes = await storage.getItem(PLAY_PREFERENCES_KEY);
        const value = bytes ? JSON.parse(bytes) : { version: 1, sound: true, animations: true };
        if (value.version !== 1 || typeof value.sound !== "boolean" || typeof value.animations !== "boolean") throw Error("invalid_feedback_preferences");
        this.update({ ready: true, sound: value.sound, animations: value.animations, error: false });
      } catch { this.update({ ready: true, sound: false, animations: false, error: true }); }
    })().finally(() => { this.loading = null; });
    return this.loading;
  }
  setMotion(reducedMotion: boolean) { this.update({ reducedMotion, motionReady: true }); }
  async set(key: "sound" | "animations", value: boolean) {
    if (!this.snapshot.ready || !this.storage) return;
    this.update({ [key]: value });
    const bytes = JSON.stringify({ version: 1, sound: this.snapshot.sound, animations: this.snapshot.animations });
    const storage = this.storage;
    const write = this.writes.then(() => storage.setItem(PLAY_PREFERENCES_KEY, bytes));
    this.writes = write.catch(() => {});
    try { await write; this.update({ error: false }); } catch { this.update({ error: true }); }
  }
}
export const playPreferences = new PlayPreferencesStore();
export const motionAllowed = (p: PlayPreferences) => p.ready && p.motionReady && p.animations && !p.reducedMotion;
