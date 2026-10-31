# Phase 4 validation

Validated in the supplied project snapshot on 2026-10-31. This environment is not the user's Git checkout, Supabase project, or installed beta.

## Automated results

- `npm run typecheck`: passed.
- ESLint over every changed TypeScript/TSX file and test: zero errors. One existing `AppNavigator` analytics-effect dependency warning remains, unchanged from the baseline; the analytics lifecycle was not rewritten.
- Full suite: **47 of 49 scripts passed**. All four new Phase 4 scripts passed. Two existing beta configuration tests fail identically to the supplied baseline: `test-beta-build.cjs` and `test-beta-updates.cjs`. The fixture lacks the expected fingerprint runtime policy, automatic update settings and EAS project linkage. No user-specific Expo configuration was guessed or replaced.
- The actual navigator's new review route/origin/analytics assertions were also run successfully after the full suite.

| New script | Checks |
| --- | --- |
| `test-knowledge-mastery.cjs` | Three spaced successes, difficulty intervals, early practice, wrong-answer reset, weak/legacy/version-safe evidence, Athens DST, bounded merge laws, complete-topic requirement, daily frozen masks, Architecture bar, payload bound |
| `test-knowledge-review-store.cjs` | Fresh account, first answers, offline restart/resume, pinned batch, required/invalid/duplicate/stale taps, completion XP dedup, practice without XP, old-client merge, session tombstones/ties, stopped scope, account separation, explicit guest import/reset |
| `test-knowledge-review-ui.cjs` | Due/practice launcher, empty state, locked answers, explanation and original source props, baseline feedback, results/XP/next dates, content-revision and date guards, subject bars, topic expansion, return callback |
| `test-knowledge-reviews-sql.cjs` | Real PostgreSQL through PGlite: rerunnable 013 migration after existing migrations, old-client omission, first-answer/tail merge parity, session stamps/tombstones/ties, malformed fields and bounds, CAS revision rejection, RLS/account separation, helper/bypass denial, anonymous rejection |

Existing checks passed for the unified quiz engine/integration, daily selection and Phase 3 result UI, automatic sync, learning activity, weekly review, backups, permanent XP, live player titles, home/progress layouts, onboarding, content reports, analytics, content banks, editorial compatibility and reading paths. Native component tests use mocked React Native views. PGlite validates PostgreSQL behavior locally; it is not a remote Supabase deployment test.

No Android/iOS simulator or physical device was exercised here. No production dependency, Expo configuration, native directory, live SQL, Git commit, push, OTA release or beta build was changed.

## Expo / beta checklist

1. Fresh account: complete a lesson or daily quiz. Progress shows Learning, not instant Mastered. Confirm the bar is explicitly separate from articles-read progress and permanent XP.
2. Open free practice immediately. Answer correctly several times on the same date. No additional mastery or XP appears. Try wrong answers and inspect the explanation/source link. A newly recorded wrong review comes back tomorrow; an already-recorded same-day answer is not overwritten.
3. With due questions, start a scheduled batch (at most five). Answer one, go back, return, force-close and reopen offline. The same question order, selected/locked answer and index should remain. Continue without connection and reconnect later.
4. Rapidly tap an answer and Next. The question cannot be answered twice or skipped. Finish multiple due batches on one date; the completion bonus totals at most 10 XP. Existing weekly question XP remains separate. On Monday, the weekly completion bonus shares the same daily completion receipt.
5. At a real due date, answer correctly. Check Learning → Familiar, later Familiar → Mastered only after three spaced successes. The next date extends according to difficulty. Voluntary early correct practice does not advance mastery; a new wrong review returns sooner.
6. Inspect subject bars including Ιστορία, Αρχιτεκτονική, Επιστήμη and Γεωγραφία. Expand learning units. One mastered question must not mark a whole multi-question unit Mastered. Reading-progress bars still describe articles separately.
7. Use older progress with no per-question masks or dated activity. It must not fabricate correctness, success intervals or historical mastery. The first dated recall establishes a baseline.
8. Open a review, let the Athens date change or return after midnight. The stale batch cannot accept new answers; close it and start from current due work. If a scored question revision changes, the saved batch must not be regraded against the new key.
9. Test guest → explicit account import. Recall evidence transfers after the import action; an unfinished guest batch does not replace the account session. Switch accounts during/offline after a review: no progress leakage or active old callback writes.
10. Use two devices offline, answer the same question/date differently, reconnect and sync. The earliest recorded answer wins; the highest score is not selected. Closing a batch must not resurrect it after an older client syncs. Test with 013 applied before installing the update.
11. Cross a level threshold from a review completion: title and level update immediately on Progress, without restarting. Reopen the completed result: XP must not be paid again.
12. Android system Back, on-screen Back and bottom tabs should preserve the session. Check iOS/Android source links, small screens, large text, VoiceOver/TalkBack reading order, contrast and button reachability. No new animation is required by this feature.

The next phase is additional question formats. Stop here until Phase 4 has been tested and the user confirms continuing.
