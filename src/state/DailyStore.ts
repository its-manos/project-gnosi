import { parseDailyChallengePreferences, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { DAILY_CHALLENGE_STORAGE_KEY, getAthensDateKey, parseDailyChallengeRecord, type DailyChallengeRecord } from "../utils/dailyChallenge";
import { createCompletedHistoryEntry, DAILY_CHALLENGE_HISTORY_STORAGE_KEY, parseDailyChallengeHistory } from "../utils/dailyChallengeHistory";
import { emptyDailyDocument, mergeDailyDocuments, parseDailyDocument, dailyPreferences, type DailyDocument, type DailyDay } from "../utils/dailySyncDocument";
import type { Stamp } from "../utils/syncDocument";
import type { SyncStatus } from "./LearningStore";
export type DailyTransport = { pull: () => Promise<{ doc: DailyDocument; revision: number } | null>; push: (doc: DailyDocument, revision: number) => Promise<void> };
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type DailySnapshot = { ready: boolean; doc: DailyDocument; status: SyncStatus; error: string; userId: string | null };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export class DailyStore {
  readonly key: string;
  private doc = emptyDailyDocument();
  private dirty = false;
  private ready = false;
  private status: SyncStatus = "loading";
  private error = "";
  private device = "";
  private listeners = new Set<() => void>();
  private writeQueue: Promise<void> = Promise.resolve();
  private latestWrite: Promise<void> = Promise.resolve();
  private loading: Promise<void> | null = null;
  private running = false;
  private active = false;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: DailySnapshot;
  constructor(readonly userId: string | null, private storage: Storage, private transport: DailyTransport | null = null) {
    this.key = `@gnosi/daily-v2/${userId ?? "guest"}`;
    this.snapshot = this.makeSnapshot();
  }
  private makeSnapshot(): DailySnapshot { return { ready: this.ready, doc: this.doc, status: this.status, error: this.error, userId: this.userId }; }
  private emit() { this.snapshot = this.makeSnapshot(); for (const listener of this.listeners) listener(); }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  async start(): Promise<void> {
    this.active = true; this.generation += 1;
    if (!this.ready) {
      this.status = "loading"; this.error = ""; this.emit();
      if (!this.loading) this.loading = this.load().finally(() => { this.loading = null; });
      await this.loading;
    }
    if (this.active && this.ready && this.userId) void this.sync();
  }
  stop() { this.active = false; this.generation += 1; if (this.timer) clearTimeout(this.timer); this.timer = null; }
  private async load() {
    let stage = "D01";
    try {
      const storedDevice = await this.storage.getItem("@gnosi/sync-device-id");
      this.device = storedDevice && /^[a-zA-Z0-9_-]{1,100}$/.test(storedDevice) ? storedDevice : `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
      stage = "D02";
      await this.storage.setItem("@gnosi/sync-device-id", this.device);
      stage = "D03";
      const raw = await this.storage.getItem(this.key);
      if (raw) {
        stage = "D04";
        const local = JSON.parse(raw);
        stage = "D05";
        if (local.format !== 1 || local.userId !== this.userId || typeof local.dirty !== "boolean") throw new Error("invalid_daily");
        stage = "D06";
        this.doc = parseDailyDocument(local.doc); this.dirty = local.dirty;
      } else if (!this.userId) {
        stage = "D07";
        const [prefsRaw, recordRaw, historyRaw] = await Promise.all(["@gnosi/daily-challenge-preferences-v1", DAILY_CHALLENGE_STORAGE_KEY, DAILY_CHALLENGE_HISTORY_STORAGE_KEY].map(key => this.storage.getItem(key)));
        stage = "D08";
        const migrated = emptyDailyDocument();
        if (prefsRaw) migrated.preferences = { stamp: [0, "legacy"], value: parseDailyChallengePreferences(prefsRaw) };
        for (const history of parseDailyChallengeHistory(historyRaw)) migrated.days[history.dateKey] = { run: [0, "legacy"], edit: [0, "legacy"], history, record: { dateKey: history.dateKey, started: true, completed: true, currentIndex: 6, questionIds: history.questionIds, answers: history.answers } };
        const date = getAthensDateKey();
        const record = parseDailyChallengeRecord(recordRaw, date);
        if (record?.started) {
          const history = createCompletedHistoryEntry(record);
          const day = { run: [0, "legacy"] as Stamp, edit: [0, "legacy"] as Stamp, record, history };
          migrated.days[date] = migrated.days[date]?.history ? migrated.days[date] : day;
        }
        stage = "D08";
        this.doc = parseDailyDocument(migrated);
      }
      stage = "D09";
      await this.persist();
      this.ready = true; this.status = this.userId ? "queued" : "local"; this.error = ""; this.emit();
    } catch (error) {
      // Keep the stored bytes intact, but expose the actual failure in the
      // Metro/device logs so storage, parsing and quota problems are distinct.
      const reason = typeof error === "object" && error !== null && "message" in error
        ? String(error.message) : String(error);
      console.warn(`Could not load local daily progress (${stage}):`, reason);
      this.status = "local-error";
      const kind = stage === "D04" ? "JSON" : reason === "invalid_daily" ? "VALIDATION" : "READ_WRITE";
      this.error = `Δεν φορτώθηκε η τοπική πρόοδος. Δοκίμασε ξανά. Αν το πρόβλημα συνεχίζεται, στείλε μας τον κωδικό ${stage}/${kind}. Τα αποθηκευμένα δεδομένα διατηρήθηκαν.`;
      this.emit();
    }
  }
  private persist(): Promise<void> {
    const serialized = JSON.stringify({ format: 1, userId: this.userId, doc: this.doc, dirty: this.dirty });
    const write = this.writeQueue.then(() => this.storage.setItem(this.key, serialized));
    this.latestWrite = write;
    this.writeQueue = write.catch(() => { this.status = "local-error"; this.error = "Η πρόοδος παραμένει στη μνήμη αλλά δεν αποθηκεύτηκε στη συσκευή. Ελευθέρωσε χώρο και πάτησε επανάληψη."; this.emit(); });
    return write;
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    if (this.active && this.userId) this.timer = setTimeout(() => { this.timer = null; void this.sync(); }, 1000);
  }
  private change(doc: DailyDocument) {
    if (!this.ready) throw new Error("local_not_ready");
    this.doc = parseDailyDocument(doc); this.dirty = Boolean(this.userId); this.status = this.userId ? "queued" : "local"; this.error = "";
    this.emit(); void this.persist(); this.schedule();
  }
  private stamp(): [number, string] {
    if (!Number.isSafeInteger(this.doc.clock + 1)) throw new Error("invalid_daily");
    return [this.doc.clock + 1, this.device];
  }
  async savePreferences(value: DailyChallengePreferences): Promise<boolean> {
    const stamp = this.stamp();
    this.change({ ...this.doc, clock: stamp[0], preferences: { stamp, value: dailyPreferences(value) } });
    return this.flushLocal();
  }
  commitRecord(record: DailyChallengeRecord, expected: DailyDay | undefined): boolean {
    const current = this.doc.days[record.dateKey];
    if (!same(current, expected) || current?.record.completed) return false;
    const stamp = this.stamp();
    const history = record.completed ? createCompletedHistoryEntry(record) : null;
    if (record.completed && !history) throw new Error("invalid_daily");
    this.change({ ...this.doc, clock: stamp[0], days: { ...this.doc.days, [record.dateKey]: { run: current?.run ?? stamp, edit: stamp, record, history } } });
    return true;
  }
  async importGuest(incoming: DailyDocument) {
    const validated = parseDailyDocument(incoming);
    const additions = { ...validated, days: Object.fromEntries(Object.entries(validated.days).filter(([date]) => !this.doc.days[date]?.record.completed)) };
    this.change(mergeDailyDocuments(this.doc, additions));
    // Importing preferences is an explicit user choice, hence a new local edit.
    if (incoming.preferences) await this.savePreferences(incoming.preferences.value);
    await this.latestWrite;
  }
  async resetGuestDate(date: string) {
    if (this.userId) throw new Error("guest_only_reset");
    const days = { ...this.doc.days }; delete days[date];
    this.change({ ...this.doc, days }); await this.latestWrite;
  }
  async flushLocal() { try { await this.latestWrite; return true; } catch { return false; } }
  async retry() {
    if (!this.ready) { await this.start(); return; }
    try { await this.persist(); this.error = ""; this.status = this.userId ? "queued" : "local"; this.emit(); if (this.userId) await this.sync(); }
    catch { /* persist exposes storage failure without discarding memory */ }
  }
  async sync(): Promise<void> {
    if (!this.ready || !this.active || !this.userId || !this.transport || this.running) return;
    this.running = true; const generation = this.generation;
    const current = () => this.active && generation === this.generation;
    this.status = "syncing"; this.error = ""; this.emit();
    try {
      for (let tries = 0; tries < 3; tries += 1) {
        const remote = await this.transport.pull(); if (!current()) return;
        const combined = remote ? mergeDailyDocuments(this.doc, remote.doc) : this.doc;
        this.doc = combined;
        this.dirty = !remote || !same(combined, remote.doc);
        // Persist pulled data and the outbox before writing to the network.
        await this.persist(); if (!current()) return;
        if (!this.dirty) { this.status = "saved"; this.emit(); return; }
        const sent = combined;
        try { await this.transport.push(sent, remote?.revision ?? 0); }
        catch (error) { if ((error as { code?: string })?.code === "40001" && tries < 2) continue; throw error; }
        if (!current()) return;
        this.dirty = !same(this.doc, sent);
        await this.persist(); if (!current()) return;
        this.status = this.dirty ? "queued" : "saved"; this.emit(); if (this.dirty) this.schedule(); return;
      }
    } catch (reason) {
      if (!current()) return;
      const code = (reason as { code?: string })?.code;
      const message = (reason as Error)?.message;
      if (this.getSnapshot().status !== "local-error") {
        const permanent = Boolean(code && code !== "40001") || ["invalid_daily", "account_changed"].includes(message);
        this.status = permanent ? "error" : "waiting";
        this.error = permanent ? "Ο συγχρονισμός χρειάζεται έλεγχο. Ενημέρωσε την εφαρμογή, έλεγξε τη σύνδεση λογαριασμού και δοκίμασε ξανά." : "Αναμονή σύνδεσης. Θα ξαναδοκιμάσουμε όσο η εφαρμογή είναι ανοιχτή.";
        this.emit();
      }
    } finally {
      this.running = false;
      if (this.active && generation !== this.generation) this.schedule();
    }
  }
}
