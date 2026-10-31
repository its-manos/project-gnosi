import { emitPlayFeedback, type FeedbackKind } from "../play/events";
import { buildKnowledgeModel } from "../knowledge/model";
import { mergeKnowledgeReviews, type KnowledgeReviews, type KnowledgeSession } from "../knowledge/records";
import { isCurrentKnowledgeSession, restoreKnowledgeQuiz } from "../knowledge/session";
import { legacyAnswerSlots } from "../quiz/compatibility";
import type { QuestionToken } from "../quiz/types";
import type { DailyDocument } from "../utils/dailySyncDocument";
import { awardQuiz, hasReward, mergeRewardLedgers, quizRewardSummary, totalRewardXP, type RewardLedger } from "../gamification/rewards";
import { migrateLearningRewards } from "../gamification/migration";
import { REWARD_RULES } from "../gamification/rules";
import { adaptLessonQuestion } from "../quiz/adapters";
import { advanceQuizSession, submitQuizAnswer, calculateChoiceResults, evaluateChoice } from "../quiz/engine";
import { lessons } from "../data/lessons";
import { mergeCompletionEvents, parseCompletionEvents, quizFingerprint, lessonQuizMatches, type CompletionEvents } from "../utils/learningActivity";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { mergeWeeklyAnswers, weeklyPlan, type WeeklyAnswers } from "../utils/weeklyReview";
import { mergeLearningBackups, type LearningBackup, type BackupAttempt } from "../utils/learningBackup";
import { parseCompletedLessonIds, parseSavedAttempts } from "../utils/legacyLearning";
import { emptySyncDocument, mergeSyncDocuments, parseSyncDocument, seedSyncBackup, syncBackup, type SyncDocument, type ProgressValue } from "../utils/syncDocument";
export type SyncTransport = { pull: () => Promise<{ doc: SyncDocument; revision: number } | null>; seed: () => Promise<LearningBackup | null>; push: (doc: SyncDocument, revision: number) => Promise<void> };
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type SyncStatus = "loading" | "local" | "queued" | "syncing" | "saved" | "waiting" | "error" | "local-error";
export type LearningSnapshot = { ready: boolean; knowledgeReviews: KnowledgeReviews; knowledgeSession: KnowledgeSession | null; backup: LearningBackup; activity: CompletionEvents; weeklyReviews: WeeklyAnswers; rewards: RewardLedger; status: SyncStatus; error: string; userId: string | null };
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
  private makeSnapshot(): LearningSnapshot { return { ready: this.ready, knowledgeReviews: this.doc.knowledgeReviews ?? {}, knowledgeSession: this.doc.knowledgeSession?.value ?? null, backup: syncBackup(this.doc), activity: this.doc.activity, weeklyReviews: this.doc.weeklyReviews ?? {}, rewards: this.doc.rewards ?? {}, status: this.status, error: this.error, userId: this.userId }; }
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
      this.doc.rewards = migrateLearningRewards(lessons, syncBackup(this.doc).completedIds, this.doc.activity, this.doc.weeklyReviews ?? {}, this.doc.rewards);
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
    if (doc.rewards !== undefined) doc = { ...doc, rewards: migrateLearningRewards(lessons, syncBackup(doc).completedIds, doc.activity, doc.weeklyReviews ?? {}, doc.rewards) };
    this.doc = parseSyncDocument(doc); this.dirty = Boolean(this.userId); this.status = this.userId ? "queued" : "local"; this.error = "";
    this.emit(); void this.persist(); this.schedule();
  }
  private stamp(): [number, string] {
    if (!Number.isSafeInteger(this.doc.clock + 1)) throw new Error("invalid_sync");
    return [this.doc.clock + 1, this.device];
  }
  private feedback(kind: FeedbackKind, id: string, xp = 0, label?: string, answerXP?: number, pendingXP = false) {
    if (this.active) emitPlayFeedback({ kind, id, scope: this.userId ?? "guest", xp, label, answerXP, pendingXP });
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
  answer(id: string, attempt: BackupAttempt) {
    const previous = this.doc.progress[id]?.value.attempt?.checkpointAnswers ?? {};
    this.setProgress(id, { completed: this.doc.progress[id]?.value.completed ?? false, attempt });
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;
    const ledger = this.doc.rewards ?? {};
    const rows = quizRewardSummary(lesson.questions.map((_, i) => adaptLessonQuestion(lesson, i)), attempt.checkpointAnswers, "lesson", ledger).rows;
    for (const [slot, answer] of Object.entries(attempt.checkpointAnswers)) {
      if (previous[Number(slot)] !== undefined) continue;
      const question = lesson.questions[Number(slot)], result = question && evaluateChoice(question, answer);
      const row = rows[Number(slot)], answerXP = hasReward(ledger, `lesson:${id}`) ? 0 : (row?.baseXP ?? 0) + (row?.comboXP ?? 0);
      if (result?.valid) this.feedback(result.correct ? "correct" : "incorrect", `inline:${this.device}:${id}:${attempt.updatedAt}:${slot}`, 0, undefined, answerXP, answerXP > 0);
    }
  }
  complete(id: string, run?: { id: string; answers: Record<number, number> }) {
    if (!run) { this.setProgress(id, { completed: true, attempt: null }); return 0; }
    const lesson = lessons.find(item => item.id === id);
    if (!lesson || !/^[a-zA-Z0-9_-]{1,100}$/.test(run.id)) throw new Error("invalid_completion");
    const eventId = `${this.device}_${run.id}`;
    // The completion button may fire twice before navigation. One run is one event.
    if (this.doc.activity[eventId]) return 0;
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
    const before = totalRewardXP(this.doc.rewards ?? {});
    const rewards = { ...awardQuiz(this.doc.rewards ?? {}, `lesson:${id}`, lesson.questions.slice(0, questionCount).map((_, i) => adaptLessonQuestion(lesson, i)), run.answers, "lesson") };
    if (!hasReward(rewards, `category:${lesson.categoryId}`)) rewards[`category:${lesson.categoryId}`] = REWARD_RULES.category;
    // Reward, event and completion share one write and one sync revision.
    this.change({ ...this.doc, clock: stamp[0], rewards, activity, progress: { ...this.doc.progress, [id]: { stamp, value: { completed: true, attempt: null } } } });
    const earned = totalRewardXP(this.doc.rewards ?? {}) - before;
    this.feedback("complete", `lesson-complete:${eventId}`, earned, lesson.title);
    return earned;
  }
  clearAttempt(id: string) { this.setProgress(id, { completed: this.doc.progress[id]?.value.completed ?? false, attempt: null }); }
  answerWeekly(id: string, answerIndex: number): boolean {
    if (this.doc.weeklyReviews?.[id]) return false;
    const item = weeklyPlan(this.doc.activity, this.doc.weeklyReviews, getAthensDateKey()).find(q => q.id === id);
    if (!item || !evaluateChoice(item.lesson.questions[item.questionIndex], answerIndex).valid) return false;
    const beforeXP = totalRewardXP(this.doc.rewards ?? {});
    const stamp = this.stamp();
    const weeklyReviews = { ...this.doc.weeklyReviews, [id]: {
      sourceId: item.sourceId, questionIndex: item.questionIndex, week: item.week, answerIndex, at: Date.now(),
    } };
    const rewards = { ...this.doc.rewards };
    const ordered = Object.entries(weeklyReviews).filter(([, a]) => { const source = this.doc.activity[a.sourceId], lesson = source && lessons.find(l => l.id === source.lessonId); return a.week === item.week && lesson && lessonQuizMatches(lesson, source.quizKey) && lesson.questions[a.questionIndex]; }).sort(([aId, a], [bId, b]) => a.at - b.at || (aId < bId ? -1 : aId > bId ? 1 : 0));
    const normalized = ordered.map(([, a]) => { const source = this.doc.activity[a.sourceId]; const lesson = lessons.find(l => l.id === source.lessonId)!; return adaptLessonQuestion(lesson, a.questionIndex); });
    const answers = Object.fromEntries(ordered.map(([, a], i) => [i, a.answerIndex]));
    const summary = quizRewardSummary(normalized, answers, "review");
    const row = summary.rows[ordered.findIndex(([key]) => key === id)];
    const recallKey = `recall:${item.lesson.id}:${item.questionIndex}`;
    if (row?.correct && !hasReward(rewards, recallKey)) rewards[recallKey] = row.baseXP + row.comboXP;
    const plan = weeklyPlan(this.doc.activity, weeklyReviews, getAthensDateKey());
    if (plan.length && plan.every(q => weeklyReviews[q.id]) && !hasReward(rewards, `review:${item.week}`)) rewards[`review:${item.week}`] = REWARD_RULES.review;
    this.change({ ...this.doc, clock: stamp[0], weeklyReviews, rewards });
    const earned = totalRewardXP(this.doc.rewards ?? {}) - beforeXP;
    this.feedback(row?.correct ? "correct" : "incorrect", `weekly-answer:${id}`, earned, undefined, earned);
    return true;
  }
  startKnowledgeReview(mode: "scheduled" | "practice", daily: DailyDocument): boolean {
    if (!this.ready || !this.active) return false;
    const date = getAthensDateKey(), current = this.doc.knowledgeSession?.value;
    if (current && !current.completed && current.date === date) {
      try { if (!isCurrentKnowledgeSession(current)) return false; restoreKnowledgeQuiz(current); return true; } catch { return false; }
    }
    const model = buildKnowledgeModel({ ...this.snapshot.backup, activity: this.doc.activity, weeklyReviews: this.doc.weeklyReviews ?? {}, knowledgeReviews: this.doc.knowledgeReviews }, daily, date);
    const items = (mode === "scheduled" ? model.due : model.practice).slice(0, 5);
    if (!items.length) return false;
    const stamp = this.stamp();
    const value: KnowledgeSession = { id: `kr2:${this.device}:${stamp[0]}`, date, mode, questionIds: items.map(i => i.question.id), questionVersions: items.map(i => i.question.version), answers: {}, currentIndex: 0, completed: false, beforeStates: items.map(i => i.state), qualifiedIndices: [], earnedXP: 0 };
    this.change({ ...this.doc, clock: stamp[0], knowledgeSession: { stamp, value } });
    return true;
  }
  closeKnowledgeReview(expectedId?: string) {
    if (!this.ready || !this.active || (expectedId !== undefined && this.doc.knowledgeSession?.value?.id !== expectedId)) return;
    const stamp = this.stamp(); this.change({ ...this.doc, clock: stamp[0], knowledgeSession: { stamp, value: null } });
  }
  answerKnowledgeReview(id: string, token: QuestionToken, answerIndex: number, daily: DailyDocument): boolean {
    const saved = this.doc.knowledgeSession?.value, now = Date.now();
    if (!this.ready || !this.active || !saved || saved.id !== id || !isCurrentKnowledgeSession(saved) || saved.date !== getAthensDateKey(new Date(now))) return false;
    let quiz; try { quiz = restoreKnowledgeQuiz(saved); } catch { return false; }
    const result = submitQuizAnswer(quiz, token, answerIndex); if (!result.changed) return false;
    const model = buildKnowledgeModel({ ...this.snapshot.backup, activity: this.doc.activity, weeklyReviews: this.doc.weeklyReviews ?? {}, knowledgeReviews: this.doc.knowledgeReviews }, daily, saved.date);
    const item = model.items.find(i => i.question.id === token.id)!;
    const firstToday = saved.mode === "scheduled" && item.isAssessment && item.novel && !item.reviewedToday && !this.doc.knowledgeReviews?.[token.id]?.[saved.date];
    const qualified = firstToday && item.due !== null && item.due <= saved.date;
    const knowledgeReviews = firstToday ? mergeKnowledgeReviews(this.doc.knowledgeReviews, { [token.id]: { [saved.date]: { version: token.version, answerIndex, at: now, mode: saved.mode } } }) : this.doc.knowledgeReviews;
    const value = { ...saved, answers: legacyAnswerSlots(result.session), qualifiedIndices: qualified ? [...saved.qualifiedIndices, saved.currentIndex] : saved.qualifiedIndices };
    const stamp = this.stamp(); this.change({ ...this.doc, clock: stamp[0], knowledgeReviews, knowledgeSession: { stamp, value } });
    const after = firstToday ? buildKnowledgeModel({ ...this.snapshot.backup, activity: this.doc.activity, weeklyReviews: this.doc.weeklyReviews ?? {}, knowledgeReviews: this.doc.knowledgeReviews }, daily, saved.date).items.find(i => i.question.id === token.id) : item;
    const mastered = item.state !== "mastered" && after?.state === "mastered";
    const correct = evaluateChoice(quiz.questions[quiz.currentIndex].content as { answers: string[]; correctIndex: number }, answerIndex).correct;
    this.feedback(mastered ? "mastered" : correct ? "correct" : "incorrect", `knowledge-answer:${id}:${saved.currentIndex}`, 0, mastered ? item.topicTitle : undefined, 0);
    return true;
  }
  advanceKnowledgeReview(id: string, token: QuestionToken): boolean {
    const saved = this.doc.knowledgeSession?.value;
    if (!this.ready || !this.active || !saved || saved.id !== id || !isCurrentKnowledgeSession(saved) || saved.date !== getAthensDateKey()) return false;
    let quiz; try { quiz = restoreKnowledgeQuiz(saved); } catch { return false; }
    const result = advanceQuizSession(quiz, token); if (!result.changed) return false;
    const rewards = { ...this.doc.rewards }, key = `review:${saved.date}`;
    const earnedXP = result.session.completed && saved.mode === "scheduled" && saved.qualifiedIndices.length > 0 ? Math.max(0, REWARD_RULES.review - (rewards[key] ?? 0)) : 0;
    if (earnedXP) rewards[key] = REWARD_RULES.review;
    const value = { ...saved, currentIndex: result.session.currentIndex, completed: result.session.completed, earnedXP };
    const stamp = this.stamp(); this.change({ ...this.doc, clock: stamp[0], rewards, knowledgeSession: { stamp, value } });
    if (result.session.completed) this.feedback("complete", `knowledge-complete:${id}`, earnedXP, saved.mode === "practice" ? "Η εξάσκηση ολοκληρώθηκε" : "Η δοκιμή κατανόησης ολοκληρώθηκε");
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
  async importGuest(incoming: LearningBackup, events: CompletionEvents, reviews: WeeklyAnswers = {}, guestRewards: RewardLedger = {}, guestKnowledge: KnowledgeReviews = {}) {
    const merged = mergeLearningBackups(this.snapshot.backup, incoming);
    const activity = mergeCompletionEvents(this.doc.activity, events);
    const stamp = this.stamp(), progress = { ...this.doc.progress }, bookmarks = { ...this.doc.bookmarks };
    for (const id of new Set([...merged.completedIds, ...Object.keys(merged.attempts)])) {
      const value = { completed: merged.completedIds.includes(id), attempt: merged.attempts[id] ?? null };
      if (!same(progress[id]?.value, value)) progress[id] = { stamp, value };
    }
    for (const id of merged.savedIds) if (!bookmarks[id]?.value) bookmarks[id] = { stamp, value: true };
    this.change({ ...this.doc, clock: stamp[0], knowledgeReviews: mergeKnowledgeReviews(this.doc.knowledgeReviews, guestKnowledge), progress, bookmarks, activity, rewards: mergeRewardLedgers(this.doc.rewards, guestRewards), weeklyReviews: mergeWeeklyAnswers(this.doc.weeklyReviews, reviews) });
    await this.latestWrite;
  }
  async resetGuestProgress() {
    if (this.userId) throw new Error("guest_only_reset");
    const stamp = this.stamp();
    this.change({ ...this.doc, clock: stamp[0], knowledgeReviews: {}, knowledgeSession: { stamp, value: null }, progress: {}, activity: {}, weeklyReviews: {}, rewards: {} }); await this.latestWrite;
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
