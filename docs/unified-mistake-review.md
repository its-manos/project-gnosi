# Unified mistake review

## Behavior

The Γνώσεις card reports corrected / total **distinct scored question revisions** with mistakes. Repeated wrong answers do not inflate the total. A later wrong answer reopens the same entry. This metric describes personal mistakes, not a percentage of a subject mastered.

Lesson checkpoints, standalone lesson quizzes, lesson mistake practice, weekly practice, Daily Quiz (including its practice screen), and Quick Quiz feed the same list. Shared typed cards preserve matching, ordering, multiple select, false-statement and word-bank questions. Quick Quiz selections are normalized back to bank indices before persistence.

A single correct answer in any of these flows clears a mistake immediately. Review batches contain up to five distinct pending questions, oldest first. A wrong review answer moves its last-error time forward so other waiting questions get a turn. There is no mandatory same-round retry or calendar delay. Leaving midway preserves corrections and the active session; a changed scored revision asks the user to start a new batch.

Finishing a batch awards 10 XP at most once per Athens date, provided it corrects at least one question that has never qualified for this bonus. Existing `review:DATE` entitlements remain shared with historical reviews. `seen:revision:QUESTION_ID` markers prevent the same question paying this bonus again, including after a content revision. All-wrong batches earn no XP. Ordinary lesson and daily scoring remain governed by their existing reward rules.

## Persistence and compatibility

`SyncDocument.mistakes` stores two monotonic facts per question revision: the latest wrong answer (typed selection and timestamp), and the latest correct timestamp. Repeated attempts consume no additional history rows. Correct-only facts allow later offline merges to retain corrections. Both client and PostgreSQL use max timestamps and deterministic ties. A timestamp tie conservatively retains pending status.

Lesson answers and mistake facts share the same state write. A review answer and its resumable session share a write; completion and its XP share a write. Daily Quiz retains its independently persisted source record, and a callback mirrors each new answer into the learning store. Quick Quiz adds at most five per-round answer timestamps as a durable handoff; loading replays them idempotently if the app closed between source and learning writes.

Existing compatible lesson completion details and versioned Daily Quiz history seed missing records. Historical numeric weekly responses resolve typed questions through their established correctness projection. When historical data only identifies the missed question, the saved selection is explicitly unknown. Completion-only saves cannot recover mistakes. Older Quick Quiz data can recover its outstanding missed IDs and current round, not discarded past rounds. Existing records are never overwritten by inferred completion/scroll timestamps. Old mastery evidence and sessions remain preserved for compatibility but no longer drive the user-facing Γνώσεις feature.

The detail view shows per-category correction totals and optional pending/corrected lists with saved wrong choices. Obsolete scored revisions remain in historical totals and are excluded from answerable batches.

Guest/account scopes stay isolated. Explicit guest import includes mistake facts and rewards, without transferring an active review session. Guest reset clears the new data.

## Rollout

Apply `supabase/migrations/202611070014_unified_mistakes.sql` **before releasing the app update**. The migration is rerunnable, preserves fields when older clients save, validates bounded payloads, retains owner/RLS/CAS protections and revokes direct access to internal helpers. It does not introduce a new native dependency. This change has not been applied to a hosted Supabase project from this workspace.

## Verification

The new `test-unified-mistakes.cjs`, `test-unified-mistakes-sql.cjs`, and updated `test-knowledge-review-ui.cjs` exercise one-answer correction, reopening, typed formats, shuffled choices, invalid/stale/duplicate submissions, early exits, resume, daily XP limits, old-client preservation, SQL/client merge parity, migration, account isolation and explicit guest import. UI tests mock native surfaces.

Device acceptance: miss one lesson question, one Daily Quiz question and one Quick Quiz question; confirm the Γνώσεις count; inspect the saved selections; answer each correctly once; leave midway and restart; confirm corrections remain; finish an all-wrong batch and then a correct batch; verify audio, confirmation footers, long Greek text and large font settings on Android and iPhone.

## Final audit

The follow-up audit makes weekly answers, rewards and mistake facts share one local write. Unrelated edits retain validated mistake/reading section identities, and a no-data sync preserves data selectors. The mistake model uses the data-only subscription. Quick Quiz removes resolved recall hints before choosing its next round. Daily Quiz links use the unified review name.

`test-unified-mistakes-sync.cjs` simulates two account-scoped devices through offline edits, sync convergence, correct-answer propagation, later reopening and the daily XP cap. It also checks stable data selectors and the single-write weekly path. The Progress dashboard workflow runs these store, PostgreSQL and handoff regressions on relevant pull requests. These checks do not substitute for a hosted Supabase/device verification.
