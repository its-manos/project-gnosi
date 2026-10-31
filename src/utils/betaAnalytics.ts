/** Pseudonymous, opt-in beta telemetry. No account IDs or arbitrary text. */
export const ANALYTICS_KEY = '@gnosi/beta-analytics-v1';
export const ANALYTICS_CONSENT_KEY = '@gnosi/beta-analytics-consent-v1';
export const ANALYTICS_REVISION = 'beta-analytics-1';
export const SESSION_GAP_MS = 30 * 60 * 1000;
const TTL = 7 * 86400000;
const MAX_QUEUE = 300;
export const ANALYTICS_EVENTS = ['session_started', 'session_backgrounded', 'screen_viewed', 'onboarding_step_viewed', 'onboarding_completed', 'onboarding_skipped', 'lesson_started', 'lesson_progress', 'lesson_completed', 'lesson_left', 'lesson_interrupted'] as const;
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[number];
export const ANALYTICS_SCREENS = ['home', 'progress', 'category', 'subcategory', 'lesson', 'quiz', 'results', 'review', 'weekly-review', 'account', 'saved', 'search', 'daily', 'daily-preferences', 'welcome'] as const;
export type AnalyticsScreen = typeof ANALYTICS_SCREENS[number];
export type AnalyticsProperties = {
  screen?: AnalyticsScreen; lesson_id?: string; category_id?: string; subcategory_id?: string;
  attempt_id?: string; answered_count?: number; total_questions?: number; last_paragraph?: number;
  onboarding_step?: number; replay?: boolean; resumed?: boolean;
  reason?: 'navigation' | 'background' | 'cold_start' | 'timeout' | 'account_change';
};
export type AnalyticsEvent = {
  event_id: string; install_id: string; session_id: string; event_name: AnalyticsEventName;
  occurred_at: string; environment: 'beta' | 'development'; platform: 'android' | 'ios' | 'web' | 'other';
  revision: string; properties: AnalyticsProperties;
};
type Snapshot = { ready: boolean; enabled: boolean; error: boolean };
type Disk = { consent: boolean; installId: string | null; queue: AnalyticsEvent[]; activeLesson: AnalyticsProperties | null };
type Deps = {
  storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
  send(events: AnalyticsEvent[], signal: AbortSignal): Promise<void>;
  now?: () => number; id?: () => string; environment: AnalyticsEvent['environment']; platform: AnalyticsEvent['platform'];
};
// IDs identify events for retry deduplication; they are never credentials.
export function analyticsId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const n = Math.floor(Math.random() * 16); return (c === 'x' ? n : (n & 3) | 8).toString(16);
  });
}
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,119}$/;
export function cleanAnalyticsProperties(value: unknown): AnalyticsProperties {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result: Record<string, unknown> = {};
  for (const key of ['lesson_id', 'category_id', 'subcategory_id']) if (typeof v[key] === 'string' && ID.test(v[key])) result[key] = v[key];
  if (typeof v.attempt_id === 'string' && UUID.test(v.attempt_id)) result.attempt_id = v.attempt_id;
  if (ANALYTICS_SCREENS.includes(v.screen as AnalyticsScreen)) result.screen = v.screen;
  for (const key of ['answered_count', 'total_questions', 'last_paragraph']) if (Number.isInteger(v[key]) && (v[key] as number) >= 0 && (v[key] as number) <= 10000) result[key] = v[key];
  if (Number.isInteger(v.onboarding_step) && (v.onboarding_step as number) >= 1 && (v.onboarding_step as number) <= 4) result.onboarding_step = v.onboarding_step;
  for (const key of ['replay', 'resumed']) if (typeof v[key] === 'boolean') result[key] = v[key];
  if (['navigation', 'background', 'cold_start', 'timeout', 'account_change'].includes(v.reason as string)) result.reason = v.reason;
  return result as AnalyticsProperties;
}
function validEvent(e: AnalyticsEvent, now: number, install: string): boolean {
  return !!e && UUID.test(e.event_id) && e.install_id === install && UUID.test(e.session_id)
    && ANALYTICS_EVENTS.includes(e.event_name) && ['beta', 'development'].includes(e.environment)
    && ['android', 'ios', 'web', 'other'].includes(e.platform) && e.revision === ANALYTICS_REVISION
    && Number.isFinite(Date.parse(e.occurred_at)) && Date.parse(e.occurred_at) >= now - TTL && Date.parse(e.occurred_at) <= now + 60000;
}
export class BetaAnalytics {
  private state: Snapshot = { ready: false, enabled: false, error: false };
  private listeners = new Set<() => void>();
  private disk: Disk = { consent: false, installId: null, queue: [], activeLesson: null };
  private serial: Promise<unknown> = Promise.resolve();
  private loading: Promise<void> | null = null;
  private generation = 0;
  private sessionId: string | null = null;
  private backgroundAt: number | null = null;
  private backgrounded = false;
  private sending: Promise<void> | null = null;
  private abort: AbortController | null = null;
  private screen: AnalyticsScreen | null = null;
  private now: () => number;
  private id: () => string;
  constructor(private deps: Deps) { this.now = deps.now ?? Date.now; this.id = deps.id ?? analyticsId; }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private publish(value: Partial<Snapshot>) { this.state = { ...this.state, ...value }; this.listeners.forEach(l => l()); }
  private work(action: () => Promise<void>) {
    const run = this.serial.then(action).catch(() => { /* Optional event writes never affect play or consent UI. */ });
    this.serial = run; return run;
  }
  private persist() { return this.deps.storage.setItem(ANALYTICS_KEY, JSON.stringify(this.disk)); }
  start(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = this.work(async () => {
      try {
        const consent = await this.deps.storage.getItem(ANALYTICS_CONSENT_KEY);
        const raw = consent === "yes" ? await this.deps.storage.getItem(ANALYTICS_KEY) : null;
        if (raw) {
          const d = JSON.parse(raw) as Disk;
          if (d.consent === true && typeof d.installId === 'string' && UUID.test(d.installId)) {
            this.disk = { consent: true, installId: d.installId, queue: Array.isArray(d.queue) ? d.queue.filter(e => validEvent(e, this.now(), d.installId!)).map(e => ({ event_id: e.event_id, install_id: e.install_id, session_id: e.session_id, event_name: e.event_name, occurred_at: e.occurred_at, environment: e.environment, platform: e.platform, revision: e.revision, properties: cleanAnalyticsProperties(e.properties) })).slice(-MAX_QUEUE) : [], activeLesson: d.activeLesson ? cleanAnalyticsProperties(d.activeLesson) : null };
          }
        }
        if (this.disk.consent) {
          const interrupted = this.disk.activeLesson;
          this.sessionId = this.id(); this.append('session_started', {});
          if (interrupted?.lesson_id) this.append('lesson_interrupted', { ...interrupted, reason: 'cold_start' });
          this.disk.activeLesson = null;
          await this.persist();
        }
        this.publish({ ready: true, enabled: this.disk.consent, error: false });
      } catch { this.disk = { consent: false, installId: null, queue: [], activeLesson: null }; this.publish({ ready: true, enabled: false, error: true }); }
    });
    return this.loading;
  }
  async setEnabled(enabled: boolean): Promise<void> {
    // Fence queued work and abort transport immediately when withdrawing consent.
    const version = ++this.generation;
    if (!enabled) { this.publish({ enabled: false }); this.abort?.abort(); }
    await this.start();
    await this.work(async () => {
      if (version !== this.generation) return;
      if (enabled === this.disk.consent && enabled === this.state.enabled && !this.state.error) return;
      this.disk = { consent: enabled, installId: enabled ? this.id() : null, queue: [], activeLesson: null };
      this.sessionId = enabled ? this.id() : null;
      if (enabled) this.append('session_started', this.screen ? { screen: this.screen } : {});
      let markerSaved = false, dataSaved = false;
      // Two independent records make a single failed disk write fail closed on
      // restart: startup requires BOTH an affirmative marker and consent data.
      if (!enabled) {
        try { await this.deps.storage.setItem(ANALYTICS_CONSENT_KEY, "no"); markerSaved = true; } catch { /* try primary record too */ }
      }
      try { await this.persist(); dataSaved = true; } catch { /* never block play */ }
      if (enabled && dataSaved) {
        try { await this.deps.storage.setItem(ANALYTICS_CONSENT_KEY, "yes"); markerSaved = true; } catch { /* fail closed */ }
      }
      if (enabled && (!markerSaved || !dataSaved)) this.disk.consent = false;
      this.publish({ enabled: enabled && markerSaved && dataSaved, error: enabled ? !markerSaved || !dataSaved : !markerSaved && !dataSaved });
    });
    if (enabled) void this.flush();
  }
  private append(name: AnalyticsEventName, properties: AnalyticsProperties) {
    if (!this.disk.consent || !this.disk.installId || !this.sessionId || !ANALYTICS_EVENTS.includes(name)) return;
    this.disk.queue = this.disk.queue.filter(e => Date.parse(e.occurred_at) >= this.now() - TTL);
    this.disk.queue.push({ event_id: this.id(), install_id: this.disk.installId, session_id: this.sessionId, event_name: name, occurred_at: new Date(this.now()).toISOString(), environment: this.deps.environment, platform: this.deps.platform, revision: ANALYTICS_REVISION, properties: cleanAnalyticsProperties(properties) });
    this.disk.queue = this.disk.queue.slice(-MAX_QUEUE);
  }
  track(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
    const version = this.generation;
    return this.work(async () => {
      if (!this.state.enabled || version !== this.generation || this.backgrounded) return;
      this.append(name, properties); await this.persist();
    });
  }
  view(screen: AnalyticsScreen) {
    this.screen = screen;
    return this.track('screen_viewed', { screen });
  }
  lesson(lesson: AnalyticsProperties | null, reason: 'navigation' | 'account_change' = 'navigation') {
    const version = this.generation;
    return this.work(async () => {
      if (!this.state.enabled || version !== this.generation) return;
      const previous = this.disk.activeLesson;
      if (previous?.lesson_id !== lesson?.lesson_id) {
        if (previous?.lesson_id) this.append('lesson_left', { ...previous, reason });
        if (lesson?.lesson_id) {
          lesson = { ...lesson, attempt_id: this.id(), resumed: (lesson.answered_count ?? 0) > 0 };
          this.append('lesson_started', lesson);
        }
      } else if (previous && lesson) lesson = { ...previous, ...lesson };
      this.disk.activeLesson = lesson ? cleanAnalyticsProperties(lesson) : null;
      await this.persist();
    });
  }
  progress(properties: AnalyticsProperties) {
    const version = this.generation;
    return this.work(async () => {
      if (!this.state.enabled || version !== this.generation || !this.disk.activeLesson || this.backgrounded) return;
      const old = this.disk.activeLesson;
      const next = cleanAnalyticsProperties({ ...old, ...properties, last_paragraph: Math.max(old.last_paragraph ?? 0, properties.last_paragraph ?? 0) });
      if (next.answered_count === old.answered_count && next.last_paragraph === old.last_paragraph) return;
      this.disk.activeLesson = next; this.append('lesson_progress', next); await this.persist();
    });
  }
  completeLesson() {
    const version = this.generation;
    return this.work(async () => {
      if (!this.state.enabled || version !== this.generation || !this.disk.activeLesson) return;
      this.append('lesson_completed', this.disk.activeLesson); this.disk.activeLesson = null; await this.persist();
    });
  }
  background() {
    return this.work(async () => {
      if (!this.state.enabled || this.backgrounded) return;
      this.backgrounded = true; this.backgroundAt = this.now();
      this.append('session_backgrounded', { ...(this.disk.activeLesson ?? {}), screen: this.screen ?? undefined, reason: 'background' });
      await this.persist();
    });
  }
  foreground() {
    return this.work(async () => {
      if (!this.state.enabled) return;
      const timeout = this.backgroundAt !== null && this.now() - this.backgroundAt >= SESSION_GAP_MS;
      this.backgrounded = false;
      if (timeout) {
        if (this.disk.activeLesson) this.append('lesson_interrupted', { ...this.disk.activeLesson, reason: 'timeout' });
        this.sessionId = this.id(); this.append('session_started', { screen: this.screen ?? undefined });
        if (this.disk.activeLesson) {
          this.disk.activeLesson = { ...this.disk.activeLesson, attempt_id: this.id(), resumed: true };
          this.append('lesson_started', this.disk.activeLesson);
        }
      }
      this.backgroundAt = null;
      if (this.screen) this.append('screen_viewed', { screen: this.screen });
      await this.persist();
    });
  }
  flush(): Promise<void> {
    if (this.sending) return this.sending;
    const version = this.generation;
    this.sending = (async () => {
      await this.serial;
      if (!this.state.enabled || !this.disk.queue.length || version !== this.generation) return;
      const batch = this.disk.queue.slice(0, 50);
      this.abort = new AbortController();
      try {
        await this.deps.send(batch, this.abort.signal);
        await this.work(async () => {
          if (version !== this.generation || !this.state.enabled) return;
          const sent = new Set(batch.map(e => e.event_id));
          this.disk.queue = this.disk.queue.filter(e => !sent.has(e.event_id)); await this.persist();
        });
      } catch { /* Offline/missing migration: retain bounded queue; learning continues. */ }
      finally { this.abort = null; }
    })().finally(() => { this.sending = null; });
    return this.sending;
  }
}
