# Phase 2 validation report

- TypeScript: passed (`npm run typecheck`).
- ESLint: zero errors on changed source and new tests, using Expo rules and a temporary local config. One existing analytics-hook dependency warning remains in AppNavigator; it predates these changes. No lint config/dependency changes are shipped.
- Test scripts: **39 passed out of 41**.
- The two failures are the previously documented baseline `test-beta-build.cjs` and `test-beta-updates.cjs` configuration/fixture failures, unrelated to XP. They also fail on the unchanged Phase 1 baseline. No app.json, eas.json or production package configuration is changed.

## New test coverage

`test-xp-rewards.cjs` validates difficulty, wrong-answer credit, completion/perfect rewards, combo cap/reset, level titles, seen-question claims, legacy migration without loss, monotonic/idempotent/conflict merges, replay and duplicate rejection, interruption/restart, account isolation, repeated guest imports, daily credit persistence and weekly completion.

It also tests the deliberate distinction between the canonical daily result and permanent day-XP credit after conflicting offline completions. Result selection keeps its prior policy; higher XP already earned is retained.

`test-xp-rewards-sql.cjs` ran against local PostgreSQL through a test-only PGlite runtime. It validates repeatable migration, old-client omission, higher-credit preservation, reward bounds and domain checks, invalid dates, stale revisions, blocked bypass functions, direct-write denial, RLS/account isolation and anonymous rejection. No live Supabase database was modified.

`test-xp-ui.cjs` renders actual components with native views mocked. It checks Greek player titles, rule explanation, retained totals, separate daily points and XP, active combo feedback and lesson reward feedback. The reader test additionally exercises actual reward/adapter imports across all 81 articles.

## Passing regression scripts

- `scripts/test-account-panel.cjs`
- `scripts/test-architecture-path.cjs`
- `scripts/test-article-images.cjs`
- `scripts/test-astronomy-path.cjs`
- `scripts/test-automatic-sync.cjs`
- `scripts/test-beta-analytics-retention.cjs`
- `scripts/test-beta-analytics-sql.cjs`
- `scripts/test-beta-analytics-ui.cjs`
- `scripts/test-beta-analytics.cjs`
- `scripts/test-bundled-images.cjs`
- `scripts/test-content-reports.cjs`
- `scripts/test-daily-bank-expansion.cjs`
- `scripts/test-daily-challenge-history.cjs`
- `scripts/test-daily-challenge.cjs`
- `scripts/test-daily-sync.cjs`
- `scripts/test-editorial-compatibility.cjs`
- `scripts/test-home-layout.cjs`
- `scripts/test-image-zoom.cjs`
- `scripts/test-knowledge-scoring.cjs`
- `scripts/test-learning-activity.cjs`
- `scripts/test-learning-backup.cjs`
- `scripts/test-lesson-mistakes.cjs`
- `scripts/test-lesson-path.cjs`
- `scripts/test-lesson-results.cjs`
- `scripts/test-progress-layout.cjs`
- `scripts/test-progress-stats.cjs`
- `scripts/test-quiet-sync-status.cjs`
- `scripts/test-quiz-engine.cjs`
- `scripts/test-quiz-integration.cjs`
- `scripts/test-reader-pilot.cjs`
- `scripts/test-reading-discovery.cjs`
- `scripts/test-supplementary-images.cjs`
- `scripts/test-weekly-review.cjs`
- `scripts/test-welcome.cjs`
- `scripts/test-world-history-path.cjs`
- `scripts/test-world-history-photos.cjs`
- `scripts/test-xp-rewards-sql.cjs`
- `scripts/test-xp-rewards.cjs`
- `scripts/test-xp-ui.cjs`

## Remaining verification

Run the included SQL migration in the app's Supabase project before publishing. Test existing-profile migration, new rewards in a separate test profile, offline resume, repeated result opening, guest import, two-device sync and Android/iOS text layout using APPLY-XP-PHASE-2.md. Native views/network transports are mocked in automated UI tests; real installed-device checks remain manual.
