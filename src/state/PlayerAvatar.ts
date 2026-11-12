import AsyncStorage from '@react-native-async-storage/async-storage';
export type AvatarVariant = 'male' | 'female';
type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
type Snapshot = { variant: AvatarVariant; ready: boolean; saving: boolean; error: string | null };
/** Device preference scoped to the current account/guest. No learning-data writes. */
export class PlayerAvatarStore {
  private snapshot: Snapshot = { variant: 'male', ready: false, saving: false, error: null };
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  constructor(private storage: Storage, private key: string) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(change: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...change };
    for (const listener of this.listeners) listener();
  }
  load(): Promise<void> {
    if (this.snapshot.ready) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const raw = await this.storage.getItem(this.key);
        this.update({ variant: raw === 'female' ? 'female' : 'male', ready: true });
      } catch {
        this.update({ ready: true, error: 'Δεν φορτώθηκε η επιλογή χαρακτήρα. Μπορείς να επιλέξεις ξανά.' });
      }
    })();
    return this.loading;
  }
  choose = async (variant: AvatarVariant): Promise<boolean> => {
    if (variant !== 'male' && variant !== 'female') return false;
    await this.load();
    if (this.snapshot.saving) return false;
    if (variant === this.snapshot.variant && !this.snapshot.error) return true;
    this.update({ saving: true, error: null });
    try {
      await this.storage.setItem(this.key, variant);
      this.update({ variant, saving: false });
      return true;
    } catch {
      this.update({ saving: false, error: 'Δεν αποθηκεύτηκε η επιλογή. Δοκίμασε ξανά.' });
      return false;
    }
  };
}
const stores = new Map<string, PlayerAvatarStore>();
export function getPlayerAvatarStore(userId: string | null) {
  const key = `@gnosi/player-avatar/v1/${userId ? `account:${userId}` : 'guest'}`;
  let store = stores.get(key);
  if (!store) { store = new PlayerAvatarStore(AsyncStorage, key); stores.set(key, store); }
  return store;
}
