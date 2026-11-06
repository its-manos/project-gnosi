import AsyncStorage from "@react-native-async-storage/async-storage";

export const READER_TEXT_SIZE_KEY = "@gnosi/reader-text-size-v1";
export const READER_TEXT_SIZE_MIN = 16;
export const READER_TEXT_SIZE_MAX = 24;
export const READER_TEXT_SIZE_DEFAULT = 18;

type Storage = Pick<typeof AsyncStorage, "getItem" | "setItem">;

function validTextSize(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
    && value >= READER_TEXT_SIZE_MIN && value <= READER_TEXT_SIZE_MAX
    && (value - READER_TEXT_SIZE_MIN) % 2 === 0;
}

/** Device-only, global reader preference. Never writes into lesson progress. */
export class ReaderTextSizeStore {
  private size = READER_TEXT_SIZE_DEFAULT;
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  private loaded = false;
  private revision = 0;
  private writes: Promise<void> = Promise.resolve();

  constructor(private storage: Storage) {}

  getSnapshot = () => this.size;
  getReadySnapshot = () => this.loaded;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private emit() { for (const listener of this.listeners) listener(); }

  private update(next: number) {
    if (next === this.size) return;
    this.size = next;
    this.emit();
  }

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loading) return this.loading;
    const startRevision = this.revision;
    this.loading = (async () => {
      try {
        const raw = await this.storage.getItem(READER_TEXT_SIZE_KEY);
        if (raw !== null) {
          const size: unknown = JSON.parse(raw);
          // An early user adjustment must win over any pending storage read.
          if (this.revision === startRevision && validTextSize(size)) this.update(size);
        }
      } catch {
        // Corrupt/missing device preference is non-fatal: keep the default
        // or the latest user-selected value.
      } finally {
        this.loaded = true;
        // Even when the stored size equals the default, the reader can now
        // restore its scroll position against fully hydrated text metrics.
        this.emit();
      }
    })().finally(() => { this.loading = null; });
    return this.loading;
  }

  adjust = (delta: -2 | 2) => {
    const next = Math.max(READER_TEXT_SIZE_MIN, Math.min(READER_TEXT_SIZE_MAX, this.size + delta));
    if (next === this.size) return;
    this.revision += 1;
    this.update(next);
    // Serialize writes: two rapid taps must not persist in reverse order.
    const write = this.writes.then(() => this.storage.setItem(READER_TEXT_SIZE_KEY, JSON.stringify(next)));
    this.writes = write.catch(() => {});
  };
}

export const readerTextSize = new ReaderTextSizeStore(AsyncStorage);
// Reader imports load during app startup, before a lesson is usually opened.
void readerTextSize.load();
