type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export const validPlayerName = (value: string) => value.trim().length >= 1 && value.trim().length <= 24 && !/[\u0000-\u001f\u007f]/.test(value);
type Snapshot = { name: string; ready: boolean; saving: boolean; error: string | null };
/** Device-local, account-scoped identity. A name is committed only after disk succeeds. */
export class PvpIdentityStore {
  private snapshot: Snapshot = { name: "", ready: false, saving: false, error: null };
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  constructor(private storage: Storage, private key: string) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(change: Partial<Snapshot>) { this.snapshot = { ...this.snapshot, ...change }; for (const listener of this.listeners) listener(); }
  load = async (): Promise<void> => {
    if (this.snapshot.ready) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const bytes = await this.storage.getItem(this.key);
        const saved = bytes === null ? null : JSON.parse(bytes);
        if (saved !== null && (saved.version !== 1 || typeof saved.name !== "string" || !validPlayerName(saved.name))) throw Error("invalid_identity");
        this.update({ name: saved?.name.trim() ?? "", ready: true, error: null });
      } catch { this.update({ error: "Δεν φορτώθηκε το όνομά σου. Δοκίμασε ξανά." }); }
    })();
    try { await this.loading; } finally { this.loading = null; }
  };
  choose = async (value: string): Promise<boolean> => {
    if (!validPlayerName(value)) return false;
    await this.load();
    if (!this.snapshot.ready || this.snapshot.saving) return false;
    const name = value.trim();
    if (name === this.snapshot.name) return true;
    this.update({ saving: true, error: null });
    try {
      await this.storage.setItem(this.key, JSON.stringify({ version: 1, name }));
      this.update({ name, saving: false }); return true;
    } catch { this.update({ saving: false, error: "Δεν αποθηκεύτηκε το όνομα. Δοκίμασε ξανά." }); return false; }
  };
}
