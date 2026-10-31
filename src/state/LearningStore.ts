import { calculateChoiceResults, evaluateChoice } from "../quiz/engine";
import { lessons } from "../data/lessons";
import { mergeCompletionEvents, parseCompletionEvents, quizFingerprint, type CompletionEvents } from "../utils/learningActivity";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { mergeWeeklyAnswers, weeklyPlan, type WeeklyAnswers } from "../utils/weeklyReview";
import { mergeLearningBackups, type LearningBackup, type BackupAttempt } from "../utils/learningBackup";
import { parseCompletedLessonIds, parseSavedAttempts } from "../utils/legacyLearning";
import { emptySyncDocument, mergeSyncDocuments, parseSyncDocument, seedSyncBackup, syncBackup, type SyncDocument, type ProgressValue } from "../utils/syncDocument";
export type SyncTransport = { pull: () => Promise<{ doc: SyncDocument; revision: number } | null>; seed: () => Promise<LearningBackup | null>; push: (doc: SyncDocument, revision: number) => Promise<void> };
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type SyncStatus = "loading" | "local" | "queued" | "syncing" | "saved" | "waiting" | "error" | "local-error";
export type LearningSnapshot = { ready: boolean; backup: LearningBackup; activity: CompletionEvents; weeklyReviews: WeeklyAnswers; status: SyncStatus; error: string; userId: string | null };
const known = new Set(lessons.map(l => l.id));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export class LearningStore {
  readonly key: string;
  private doc = emptySyncDocument();
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
  private snapshot: LearningSnapshot;
  constructor(readonly userId: string | null, private storage: Storage, private transport: SyncTransport | null = null) {
    this.key = `@gnosi/learning-v2/${userId ?? "guest"}`;
    this.snapshot = this.makeSnapshot();
  }
  private makeSnapshot(): LearningSnapshot { return { ready: this.ready, backup: syncBackup(this.doc), activity: this.doc.activity, weeklyReviews: this.doc.weeklyReviews ?? {}, status: this.status, error: this.error, userId: this.userId }; }
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
    let stage = "L01";
    try {
      const storedDevice = await this.storage.getItem("@gnosi/sync-device-id");
      this.device = storedDevice && /^[a-zA-Z0-9_-]{1,100}$/.test(storedDevice) ? storedDevice : `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
      stage = "L02";
      await this.storage.setItem("@gnosi/sync-device-id", this.device);
      stage = "L03";
      const raw = await this.storage.getItem(this.key);
      if (raw) {
        stage = "L04";
        const local = JSON.parse(raw);
        stage = "L05";
        if (local.format !== 1 || local.userId !== this.userId || typeof local.dirty !== "boolean") throw new Error("invalid_sync");
        stage = "L06";
        this.doc = parseSyncDocument(local.doc); this.dirty = local.dirty;
      } else if (!this.userId) {
        stage = "L07";
        // Legacy device data has no reliable account owner. Preserve it as guest
        // data and require explicit import before associating it with an account.
        const [completedRaw, attemptsRaw, savedRaw] = await Promise.all(["@gnosi/completed-lesson-ids", "@gnosi/in-progress-lesson-attempts", "@gnosi/saved-lesson-ids"].map(key => this.storage.getItem(key)));
        stage = "L08";
        const completedIds = parseCompletedLessonIds(completedRaw);
        const saved: unknown = savedRaw ? JSON.parse(savedRaw) : [];
        const savedIds = Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string" && known.has(id)) : [];
        this.doc = seedSyncBackup({ schemaVersion: 1, completedIds, savedIds, attempts: parseSavedAttempts(attemptsRaw, completedIds) });
      }
      stage = "L09";
      await this.persist();
      this.ready = true; this.status = this.userId ? "queued" : "local"; this.error = ""; this.emit();
    } catch (error) {
      const reason = typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);
      console.warn(`Could not load local article progress (${stage}):`, reason);
      const kind = ["invalid_sync", "invalid_backup", "unknown_catalogue"].includes(reason) ? reason : stage === "L04" ? "JSON" : "READ_WRITE";
      this.status = "local-error";
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
  private change(doc: SyncDocument) {
    if (!this.ready) throw new Error("local_not_ready");
    this.doc = parseSyncDocument(doc); this.dirty = Boolean(this.userId); this.status = this.userId ? "queued" : "local"; this.error = "";
    this.emit(); void this.persist(); this.schedule();
  }
  private stamp(): [number, string] {
    if (!Number.isSafeInteger(this.doc.clock + 1)) throw new Error("invalid_sync");
    return [this.doc.clock + 1, this.device];
  }
  setProgress(id: string, value: ProgressValue) {
    if (!known.has(id)) return;
    const stamp = this.stamp();
    this.change({ ...this.doc, clock: stamp[0], progress: { ...this.doc.progress, [id]: { stamp, value } } });
  }
  setBookmark(id: string, value: boolean) {
    if (!known.has(id) || this.doc.bookmarks[id]?.value === value) return;
    const stamp = this.stamp();
    this.change({ ...this.doc, clock: stamp[0], bookmarks: { ...this.doc.bookmarks, [id]: { stamp, value } } });
  }
  answer(id: string, attempt: BackupAttempt) { this.setProgress(id, { completed: this.doc.progress[id]?.value.completed ?? false, attempt }); }
  complete(id: string, run?: { id: string; answers: Record<number, number> }) {
    if (!run) { this.setProgress(id, { completed: true, attempt: null }); return; }
    const lesson = lessons.find(item => item.id === id);
    if (!lesson || !/^[a-zA-Z0-9_-]{1,100}$/.test(run.id)) throw new Error("invalid_completion");
    const eventId = `${this.device}_${run.id}`;
    // The completion button may fire twice before navigation. One run is one event.
    if (this.doc.activity[eventId]) return;
    const questionCount = getInlineQuestionCount(lesson);
    if (questionCount < 1) throw new Error("invalid_completion");
    const result = calculateChoiceResults(lesson.questions.slice(0, questionCount), run.answers);
    if (!result.complete) throw new Error("incomplete_quiz");
    const correctCount = result.correctCount, missedQuestionIndices = result.incorrectIndices;
    const activity = parseCompletionEvents({ ...this.doc.activity, [eventId]: {
      lessonId: id, at: Date.now(), wasCompleted: this.doc.progress[id]?.value.completed ?? false,
      correctCount, questionCount, quizKey: quizFingerprint(lesson.questions), missedQuestionIndices,
    } });
    const stamp = this.stamp();
    // The event and completion share one local write and one sync revision.
    this.change({ ...this.doc, clock: stamp[0], activity, progress: { ...this.doc.progress, [id]: { stamp, value: { completed: true, attempt: null } } } });
  }
  clearAttempt(id: string) { this.setProgress(id, { completed: this.doc.progress[id]?.value.completed ?? false, attempt: null }); }
  answerWeekly(id: string, answerIndex: number): boolean {
    if (this.doc.weeklyReviews?.[id]) return false;
    const item = weeklyPlan(this.doc.activity, this.doc.weeklyReviews, getAthensDateKey()).find(q => q.id === id);
    if (!item || !evaluateChoice(item.lesson.questions[item.questionIndex], answerIndex).valid) return false;
    const stamp = this.stamp();
    this.change({ ...this.doc, clock: stamp[0], weeklyReviews: { ...this.doc.weeklyReviews, [id]: {
      sourceId: item.sourceId, questionIndex: item.questionIndex, week: item.week, answerIndex, at: Date.now(),
    } } });
    return true;
  }
  async restoreProgress(incoming: LearningBackup) {
    const merged = mergeLearningBackups(this.snapshot.backup, incoming);
    for (const id of new Set([...merged.completedIds, ...Object.keys(merged.attempts)])) {
      const value = { completed: merged.completedIds.includes(id), attempt: merged.attempts[id] ?? null };
      if (!same(this.doc.progress[id]?.value, value)) this.setProgress(id, value);
    }
    await this.latestWrite;
  }
  async restoreBookmarks(ids: string[]) { for (const id of ids) this.setBookmark(id, true); await this.latestWrite; }
  async importGuest(incoming: LearningBackup, events: CompletionEvents, reviews: WeeklyAnswers = {}) {
    const merged = mergeLearningBackups(this.snapshot.backup, incoming);
    const activity = mergeCompletionEvents(this.doc.activity, events);
    const stamp = this.stamp(), progress = { ...this.doc.progress }, bookmarks = { ...this.doc.bookmarks };
    for (const id of new Set([...merged.completedIds, ...Object.keys(merged.attempts)])) {
      const value = { completed: merged.completedIds.includes(id), attempt: merged.attempts[id] ?? null };
      if (!same(progress[id]?.value, value)) progress[id] = { stamp, value };
    }
    for (const id of merged.savedIds) if (!bookmarks[id]?.value) bookmarks[id] = { stamp, value: true };
    this.change({ ...this.doc, clock: stamp[0], progress, bookmarks, activity, weeklyReviews: mergeWeeklyAnswers(this.doc.weeklyReviews, reviews) });
    await this.latestWrite;
  }
  async resetGuestProgress() {
    if (this.userId) throw new Error("guest_only_reset");
    this.change({ ...this.doc, progress: {}, activity: {}, weeklyReviews: {} }); await this.latestWrite;
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
        let combined = remote ? mergeSyncDocuments(this.doc, remote.doc) : this.doc;
        if (!remote) {
          const seed = await this.transport.seed(); if (!current()) return;
          // Reading the legacy backup can take time. Include edits made while
          // that request was pending, rather than the pre-request snapshot.
          combined = seed ? mergeSyncDocuments(this.doc, seedSyncBackup(seed)) : this.doc;
        }
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
        const permanent = Boolean(code && code !== "40001") || ["invalid_sync", "invalid_backup", "unknown_catalogue", "account_changed"].includes(message);
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
