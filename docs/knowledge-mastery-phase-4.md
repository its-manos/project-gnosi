# Phase 4 — Knowledge mastery and spaced reviews

XP remains permanent participation credit. Mastery is a separate, derived estimate of retention. No change to level thresholds, player titles, daily quiz selection, lesson completion, or existing XP receipts.

## Content and topics

`src/knowledge/model.ts` indexes the 442 currently playable normalized questions (333 lesson checkpoints and 109 daily questions). It reuses the Phase 1 adapters and scored revisions. The 105 learning units are lesson objectives grouped by lesson, plus daily editorial subtopics. These are practical topic groupings, not a new claim that every question has a finely curated scientific concept annotation. No existing content or source reference is rewritten.

Question states are New / Learning / Familiar / Mastered (Νέο / Μαθαίνεται / Οικείο / Κατακτημένο). A topic is Mastered only when all its questions are Mastered, Familiar only when all are at least Familiar, and otherwise Learning if any question has been encountered. Unseen questions remain in the denominator.

Subject bars combine question state weights 0/1/2/3, divided by the maximum possible weight. This is a progress index, not an accuracy, confidence, or articles-read percentage. Architecture has its own subject bar; its questions are excluded from the remaining Culture bar to avoid counting them twice. Reading progress remains separately available.

## Scheduling

Calendar dates use Europe/Athens, with UTC calendar arithmetic through DST. Initial dated exposure establishes a baseline; it cannot be a spaced success. A correct recall on or after the next due date adds one success. Three successes across increasing intervals are required for Mastered. One or two successes are Familiar.

| Observation | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Initial correct baseline: next review | 2 days | 1 day | 1 day |
| First due correct recall: next review | 4 days | 3 days | 2 days |
| Second due correct recall: next review | 9 days | 7 days | 5 days |
| Third/subsequent due correct recall: next review | 18 days | 14 days | 11 days |
| New wrong recall | 1 day | 1 day | 1 day |

Wrong recalls reset successive successes and return to Learning, including an early voluntary wrong answer. Early correct practice does not move the due date or advance mastery. At most one observation per question per Athens date participates. Overdue work does not remove XP or reduce mastery by itself. Difficulty defaults for older lesson questions remain explicitly `legacy-default`.

This is a transparent scheduling heuristic, not a calibrated memory model or a guarantee of long-term competence. Multiple-choice recognition remains the available assessment format. Phase 5 is not implemented.

## Existing evidence

- Matching lesson quiz revisions (including declared editorial aliases) seed initial exposure. A lesson replay while reading does not count as independent recall.
- Per-question missed masks or perfect legacy scores can identify initial correctness. A non-perfect total without a mask cannot identify individual correct answers.
- Completion IDs without dated activity provide weak exposure, due now. The first dated review supplies the baseline, not a fabricated interval or success.
- A known incompatible lesson revision does not silently become exposure to the current questions.
- Phase 3 daily correctness masks count only with matching saved question revisions. Repeated daily questions on later due dates can demonstrate recall. Older totals without snapshots provide weak exposure, never reconstructed correctness.
- Valid weekly second-chance answers can count as later recall. Existing weekly records and rewards are retained. Its old one-answer “mastered” wording has been corrected.
- New recall records are first answers per question/date. When several sources share a date, deterministic priority is lesson/daily exposure, then weekly, then the new review mode; earliest time breaks ties within the same source priority. This is conservative when a historic daily completion time is unavailable.

## Review mode and rewards

Home offers a compact due/resume card after the exploration map. Progress offers the full subject profile and expandable learning units. The dedicated screen offers scheduled review and voluntary practice. Sessions contain at most five encountered questions, with overdue and weaker questions first. Explanations, original source links, current state, next review date, and before/after feedback remain available.

Scheduled completion with at least one newly answered due question awards up to 10 XP once per date. Voluntary practice awards no XP, even when answering a question that happens to be due. All modes may update retention when the spacing conditions are met. Same-day repeated answers cannot replace the first answer or increase mastery.

The existing `review:YYYY-MM-DD` receipt is reused to retain Phase 2 client compatibility. Monday's existing weekly-completion bonus shares that receipt; the combined completion bonus for that date remains 10 XP. A historical zero-valued migration sentinel may be upgraded by a genuinely completed due review. Existing per-question weekly rewards are unchanged. This is not a server-authoritative anti-cheat system: like existing offline XP, clients submit structurally validated evidence.

## Offline storage, sync and bounds

The learning schema stays version 1 with two optional fields:

- `knowledgeReviews`: question ID → Athens date → `{version, answerIndex, at, mode}`. Latest 32 dates per question, at most 1,000 archived question IDs. Equal dates choose the earliest answer time, then a fixed lexical tie. A bounded union of the newest dates is commutative, associative and idempotent. Changed or unavailable question revisions remain archived but are ignored for current mastery.
- `knowledgeSession`: one whole-session logical-clock register. Stores question IDs and revisions, numeric answer slots, index, completion, before states, qualified indices and actual earned completion XP. Later register wins; null is a persistent close tombstone. Equal stamps use the same canonical ASCII ordering in TypeScript and PostgreSQL.

The latest 32 reviews are a rolling scheduling history. Oldest evidence eventually falls out of the heuristic; it is not an unlimited attempt log. Legacy activity and daily evidence retain their established formats. The full current question catalogue at the 32-date review cap stays below 1.8 MB in the payload-size test; the existing overall 2 MiB RPC limit still applies to the whole document, so very large older activity histories can still hit that pre-existing limit.

Answer, recall fact, session advancement and completion reward use the existing learning store/outbox. No extra database request per answer, table, background service, dependency, or raw analytics event stream. Debounced sync and existing revision retries remain in place. Analytics maps the route to the already accepted `review` screen value.

The new optional fields survive old-client omission in client merges and in SQL migration 013. Backend validation retains the existing auth/RLS/revision/payload validators and XP wrapper. Bypass helpers are not executable by public, anonymous or authenticated roles. Apply 013 after the existing migration 012 and before releasing Phase 4.

Account scopes stay separate. Explicit guest import transfers recall evidence alongside normal progress; it deliberately does not transfer an active guest session into the account. Going back preserves an unfinished session; restarting resumes it. Changed question versions block regrading and offer an explicit close/restart. Date changes block stale answer/Next callbacks. Guest development reset clears its review evidence/session too, while preserving daily data as before.

## Files

Core: `src/knowledge/{records,model,session}.ts`. Persistence: learning store, learning sync document and explicit guest-import UI. Interface: `KnowledgeMastery`, `KnowledgeReviewScreen`, `useKnowledgeModel`, Home/Progress/navigation. Existing XP profile now reads the retention model for the later-recall count; the live player-title fix remains intact. Activity-day summaries include saved review dates. The Athens formatter is reused instead of reconstructed for each evidence row.

Validation and device steps: [knowledge-mastery-phase-4-validation.md](knowledge-mastery-phase-4-validation.md). Installation and commit: [../APPLY-KNOWLEDGE-MASTERY-PHASE-4.md](../APPLY-KNOWLEDGE-MASTERY-PHASE-4.md).
