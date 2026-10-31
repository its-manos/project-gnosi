# Phase 1 — Unified question and quiz engine

## Audit of the existing application

- `src/data/lessons.ts` defines lesson questions as prompt, answer array, numeric correct index and explanation. Guided paths reuse these lessons. Sources belong to each lesson; some lessons have editorial fingerprint aliases preserving old results.
- `src/data/questions.ts` supplies daily questions with stable IDs, category/subcategory, difficulty, explanation and sources. Seven IDs are deterministically selected from the date and saved preferences. This phase preserves that personalized selection and the Europe/Athens date policy.
- Inline checkpoints use a consecutive numeric answer map and unlock article passages. `LearningStore` persists whole attempts and completion events, including the original question fingerprint and missed indices. Its completion run IDs deduplicate repeated Finish taps.
- The standalone quiz previously accumulated score using the answer key supplied by its UI callback. It now uses a canonical engine session and rejects duplicate/stale callbacks. Its unfinished session remains in memory, as the existing exit warning states.
- Daily attempts are pinned by date and question order. `DailyStore` and `DailyDocument` preserve one whole attempt/result per Athens date, including frozen completed history. Completed scores are not recalculated against subsequently edited/retired questions.
- Immediate lesson mistake practice is unscored and retryable. Weekly review stores one immutable answer per question/week and has its own eligibility, shuffle and merge policies.
- Existing scoring uses one correct-answer unit in lessons and 100 quiz points per correct daily answer. The previous XP foundation derives separate XP/levels/milestones from persisted activity. These policies remain unchanged in Phase 1.
- `LearningStore` and `DailyStore` maintain account-scoped AsyncStorage documents, queued local writes, logical revisions, offline retries and compare-and-swap sync. Existing Supabase `learning_sync`/`daily_sync` rows have ownership/RLS restrictions and revision-checked RPC writes. Guest import is explicit. There is no reason to duplicate these stores or introduce per-answer tables.

## Architecture and files

| File | Responsibility |
| --- | --- |
| `src/quiz/types.ts` | Normalized question metadata, optional media/sources, session, token and handler contracts |
| `src/quiz/engine.ts` | Pure answer validation, scoring, revision hashing, session transitions, results, JSON serialization/restoration |
| `src/quiz/adapters.ts` | Daily/lesson banks to normalized multiple-choice questions |
| `src/quiz/compatibility.ts` | Numeric legacy answers and daily records to/from engine sessions |
| `src/data/lessons.ts`, `src/data/questions.ts` | Optional metadata typing; published records unchanged |
| `src/hooks/useLearningApp.ts` | Engine-driven lesson/standalone answers, canonical grading, duplicate/stale-run guards and shared practice validation |
| `src/hooks/useDailyChallenge.ts` | Shared daily answer/progression transitions, retaining the expected-day store guard |
| `src/state/LearningStore.ts` | Shared completion scoring and weekly answer validation, retaining its existing atomic persistence |
| `src/utils/legacyLearning.ts`, `src/utils/learningBackup.ts` | Shared grading for current and restored lesson scores |
| `src/utils/dailyChallengeHistory.ts` | Shared daily-result scoring; frozen-history validation remains independent of current content |
| `scripts/test-quiz-engine.cjs` | All-bank adaptation, metadata/revisions, pure transitions, corruption, restoration and future-handler tests |
| `scripts/test-quiz-integration.cjs` | Actual learning hook/store tests for duplicate taps, canonical grading, restart/resume and stale runs |
| Three existing isolated tests | Added the real engine module to their explicit import allowlists |

The engine imports no React, React Native, Expo, AsyncStorage, Supabase, or question-bank runtime. Answer evaluation, progression and results can be tested without mounting the application.

## Question identity and revisions

Normalized multiple-choice questions contain:

- An ID, type, category/subcategory and concept IDs.
- Difficulty and whether it was editorially assigned or a legacy default.
- Prompt, explanation, answer options and correct index.
- Sources and optional image/media with alternative text.
- A revision combining an optional editorial version with a deterministic hash of the scored prompt/options/key.

Daily IDs are namespaced as `daily:<existing-id>`. Existing lesson slots receive `lesson:<lesson-id>:q<number>`, or an explicit `id` if one is added editorially. Neither format changes the existing stored bank IDs or positional answers.

A fallback lesson ID is stable while its slot represents the same question. Give questions explicit permanent IDs before reordering/replacing slots. Explanatory text/source-only changes do not change the scored revision; prompt, option order and answer-key edits do. Existing historical `quizFingerprint` values and compatible aliases remain unchanged.

Legacy lesson difficulty defaults to `medium`, explicitly marked `legacy-default`. It does not introduce difficulty-weighted XP. Fallback concept IDs identify the question itself; they are not a claim that an editorial concept taxonomy has been authored. Phase 4 must provide that taxonomy before making concept-mastery claims.

## Session rules

`createQuizSession` owns a normalized content snapshot. Submit and advance operations return a new state with a reason when accepted/rejected. A question token includes its ID and revision, preventing a callback for the preceding question from acting on the next one.

- Answers must match the registered question handler.
- A scored question accepts its first answer only, including when the first answer was wrong.
- Advancing requires an answer and cannot skip a question.
- Completed sessions cannot accept further answers or advances.
- Stale run callbacks in the learning hook are rejected after restart or navigation to another lesson.
- Results derive from validated answers, not cached correctness, XP or score fields.
- Restoring JSON rejects holes, future answers, unknown IDs/types, duplicate question IDs, invalid metadata, invalid choices and revision mismatches.
- New formats can register a content validator and answer evaluator without rewriting progression, serialization or results. Only multiple-choice is enabled in production in this phase.

Immediate mistake practice deliberately retains its own retry policy and does not create a scored engine completion. Weekly review retains its existing one-answer/week policy. Both use shared answer validation.

## Persistence and migration

This is an additive runtime migration, with no SQL or storage-key migration:

1. Existing bank objects are adapted in memory.
2. Daily and inline legacy answers are reconstructed as engine sessions when processing an action.
3. Accepted engine answers are converted back to the same numeric wire format.
4. Existing stores perform local writes, result deduplication, guest import, conflict resolution and Supabase synchronization.
5. Generic future sessions can use `serializeQuizSession`/`restoreQuizSession` to retain full snapshots, but Phase 1 does not upload a second copy of existing daily/lesson state.

No new XP balance or reward events are emitted. Existing lesson/date/question reward identities therefore continue preventing repeated rewards after navigation, restart or import. All earlier completion IDs, frozen scores, source references, compatible fingerprints, bookmarks and guided-path progress are preserved.

### Explicit boundaries

- Native generic session snapshots pin scored content and revisions. Legacy in-progress numeric records do not contain such snapshots; they keep the existing revalidation-against-current-content behavior. Do not reorder published legacy slots or edit an active question's answer positions without the existing editorial compatibility process. A later versioned wire-format migration is required to pin every legacy in-progress revision across devices.
- The legacy standalone quiz remains memory-only before completion. The primary inline lesson flow and daily challenge resume from device storage. It retains its existing leave warning.
- Scoring is suitable for personal offline progress. A client with editable local data is not a trusted public leaderboard authority. Server-validated competitive scoring is a later phase.
- Phase 2 must reconcile the previous derived XP foundation with the brief's never-decreasing reward accounting before introducing the new XP values and combo bonuses. Phase 1 intentionally does not rebalance or reset existing XP.

## Verification and manual testing

Run:

```bash
npm run typecheck
node scripts/test-quiz-engine.cjs
node scripts/test-quiz-integration.cjs
node scripts/test-automatic-sync.cjs
node scripts/test-daily-sync.cjs
node scripts/test-weekly-review.cjs
node scripts/test-knowledge-scoring.cjs
npx expo start --clear
```

Device checks (Android and iOS):

1. Continue an already-started lesson. Check that previous answers, score, passage position and saved status remain.
2. Tap an answer quickly twice. Confirm the first answer remains and the score changes once. Finish the lesson twice rapidly; check one completion/reward.
3. Exit after a checkpoint and reopen the app offline. Confirm the saved answer and next passage are restored.
4. Start/resume the daily challenge. Answer, exit during feedback, reopen and continue. Complete it and check the original /700 points plus unchanged XP behavior. Reopening must not add rewards.
5. Change daily preferences mid-session. Confirm its seven saved question IDs/order remain pinned.
6. Use immediate mistake practice and weekly review: confirm retry versus one-answer behavior remains unchanged.
7. Sign in and explicitly import guest progress; open a second device/account and check existing isolation/sync behavior.
8. Try standalone quiz rapid Answer/Next taps. Verify a wrong answer cannot be converted to correct through a second tap, and Next cannot skip questions.

Native views and remote transports are mocked in automated UI/sync tests. Installed-device checks remain necessary; no beta was published by this update.
