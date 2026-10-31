import { parseContentReport, reportDeliveryError, reportTargetKey, type ContentReport, type ReportReason, type ReportTarget } from "../utils/contentReports";
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type ReportSnapshot = { ready: boolean; items: ContentReport[]; error: string; busy: boolean };
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;

/** Separate account/guest outboxes. Only an explicit submit/retry contacts the server. */
export class ReportOutbox {
  readonly key: string;
  private clientId = "";
  private snapshot: ReportSnapshot = { ready: false, items: [], error: "", busy: false };
  private listeners = new Set<() => void>();
  private loading: Promise<void> | null = null;
  private locked = false;
  constructor(readonly userId: string | null, private storage: Storage, private deliver: (report: ContentReport) => Promise<void>) {
    this.key = `@gnosi/report-outbox-v1/${userId ?? "guest"}`;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<ReportSnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; for (const listener of this.listeners) listener(); }
  async start(): Promise<void> {
    if (this.snapshot.ready) return;
    if (this.loading) return this.loading;
    this.loading = this.load().finally(() => { this.loading = null; });
    return this.loading;
  }
  private async load() {
    try {
      const raw = await this.storage.getItem(this.key);
      let items: ContentReport[] = [];
      if (raw) {
        const value = JSON.parse(raw);
        if (value.version !== 1 || value.userId !== this.userId || typeof value.clientId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.clientId) || !Array.isArray(value.items)) throw new Error("invalid_outbox");
        this.clientId = value.clientId; items = value.items.map(parseContentReport);
        if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => item.clientId !== this.clientId)) throw new Error("invalid_outbox");
      } else this.clientId = newId("c");
      this.update({ ready: true, items, error: "" });
    } catch { this.update({ error: "Δεν φορτώθηκαν οι αναφορές σε αναμονή. Τα αποθηκευμένα δεδομένα διατηρήθηκαν. Δοκίμασε ξανά." }); }
  }
  private async save(items: ContentReport[]) {
    await this.storage.setItem(this.key, JSON.stringify({ version: 1, userId: this.userId, clientId: this.clientId, items }));
    this.update({ items });
  }
  async submit(target: ReportTarget, reason: ReportReason, note: string): Promise<boolean> {
    if (this.locked) return false;
    await this.start();
    if (!this.snapshot.ready || this.locked) return false;
    const existing = this.snapshot.items.find(item => reportTargetKey(item.target) === reportTargetKey(target));
    if (existing) return this.retry(existing.id);
    const report = parseContentReport({ id: newId("r"), clientId: this.clientId, createdAt: Date.now(), target, reason, note: note.trim() });
    this.locked = true; this.update({ busy: true, error: "" });
    try {
      // Durable first: a lost network acknowledgement can safely retry the same ID.
      await this.save([...this.snapshot.items, report]);
      return await this.send(report);
    } catch { this.update({ error: "Η αναφορά δεν στάλθηκε και δεν μπόρεσε να αποθηκευτεί. Κράτησε το κείμενο και δοκίμασε ξανά." }); return false; }
    finally { this.locked = false; this.update({ busy: false }); }
  }
  private async send(report: ContentReport): Promise<boolean> {
    try { await this.deliver(report); await this.save(this.snapshot.items.filter(item => item.id !== report.id)); this.update({ error: "" }); return true; }
    catch (error) { this.update({ error: reportDeliveryError(error) }); return false; }
  }
  async retry(id?: string): Promise<boolean> {
    if (this.locked) return false;
    await this.start();
    if (!this.snapshot.ready || this.locked) return false;
    this.locked = true; this.update({ busy: true, error: "" });
    try {
      for (const report of [...this.snapshot.items]) if ((!id || report.id === id) && !await this.send(report)) return false;
      return true;
    } finally { this.locked = false; this.update({ busy: false }); }
  }
}
