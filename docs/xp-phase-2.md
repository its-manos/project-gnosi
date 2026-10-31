# Phase 2 — Permanent XP, combos and player titles

## Delivered

The existing question engine now feeds a permanent XP ledger. Difficulty rewards, session combos, Greek player titles and credited-XP feedback are enabled. The daily quiz still uses seven personalized questions, Athens calendar dates and 100 quiz points per correct answer. Mastery and article progress remain separate from XP.

## Current rules

All current rules are centralized in `src/gamification/rules.ts`. Legacy migration values are frozen separately in the same file.

| Activity | XP | Eligibility |
| --- | ---: | --- |
| Complete a lesson | 30 | First rewarded completion of that lesson |
| Correct easy / medium / hard question | 10 / 15 / 20 | New lesson questions or previously unseen daily questions |
| Wrong daily answer | 2 | Previously unseen daily question |
| Complete daily challenge | 20 | Once per Athens date |
| Perfect daily challenge | +20 | Once per Athens date |
| Complete weekly scheduled review | 10 | Once per week, when the available batch is finished |
| Correctly recall an old lesson mistake | Difficulty XP plus eligible combo | Once per lesson/question recall identity |
| Explore a category | 25 | First credited lesson in that category; retained from the earlier foundation |

A correct-answer streak begins at one. The first correct answer has no combo bonus, then bonuses are +2, +4, +6, +8 and at most +10 XP per eligible question. A wrong answer resets the streak. Unanswered questions have no reward. Daily, lesson and weekly batches have independent streaks; resuming an interrupted batch reconstructs its streak. Immediate mistake practice remains unscored.

Repeated daily questions can still contribute to the visible streak, but they do not earn additional question or combo XP. Completion and perfect-day rewards remain available. Lesson replays do not earn more XP. Weekly recall is a distinct delayed learning activity, with one lifetime reward per lesson/question. Claims use stable question IDs or the established lesson slots, without version-based XP resets.

Legacy lessons without an editorial difficulty use the engine's provisional medium difficulty, as explicitly marked in their metadata. New content should receive reviewed difficulty labels. XP is an engagement measure, not a measurement of learning quality or retention.

## Levels

The established thresholds remain 0, 200, 600, 1200, 2000 XP, using `100 × (level − 1) × level` to enter a level. Preserving this curve avoids lowering an existing player's level.

| From level | Greek title |
| --- | --- |
| 1 | Αρχάριος |
| 2 | Μαθητευόμενος |
| 5 | Εξερευνητής |
| 10 | Ερευνητής |
| 15 | Σοφός |

## Permanent reward accounting

Optional `rewards` maps now live inside the existing learning and daily sync documents. No new database tables, background jobs, native modules or production dependencies are introduced.

Reward identities are compact, for example:

- `lesson:ancient-athens`: the complete first lesson reward, including its question/combo contributions.
- `day:2026-10-31`: the daily completion, question, combo and perfect-day credit.
- `recall:ancient-athens:1`: a delayed recall credit.
- `review:2026-10-26`: a scheduled weekly batch completion.
- `category:history`: exploration credit.
- `seen:daily:planet-largest`: a zero-valued claim preventing repeat question rewards.

Local and server merges take the maximum saved value for a reward identity, never the sum of duplicate attempts. Valid zero claims are retained. Reward identities are domain-checked and capped. Future content edits do not recompute previously earned amounts. Each reward is committed atomically with its source lesson completion or daily result, or with the weekly answer that earns it, using the existing queued write and sync flow.

If two devices complete conflicting attempts offline, the established whole-attempt quiz-result policy remains unchanged. XP keeps the higher already-issued credit for that one reward identity. Therefore credited day XP can differ from the selected daily result's reconstructed reward. The UI says **XP ημέρας** rather than presenting this as a new payment each time the result opens. This max-register choice is necessary to preserve earned XP while deduplicating offline submissions; the outcome is deterministic on all updated devices.

These are personal offline progress scores. Bounded input validation and duplicate prevention are implemented; a client can still edit its own content/data. Public competitive scores require authoritative answer/session validation before leaderboards are introduced.

## Legacy migration and compatibility

On load, before the profile becomes ready, the app credits previously completed lessons, daily history, explored categories and successful delayed recall using the frozen v1 formulas. A reward is backfilled only if that identity has no receipt. This preserves old XP and prevents existing completions from being rewarded again under the new formula.

New clients reconcile newly arrived legacy activity from older devices without clearing already recorded rewards. Explicit guest-to-account import now includes the learning ledger; the existing daily import carries its ledger too. Repeated imports merge identities rather than adding balances. Switching accounts still switches the entire scoped profile.

Developer-only guest resets are the deliberate exception to permanent totals. Clearing lesson progress clears its learning ledger. Resetting one daily date clears that day's credit, while preserving seen-question claims. These controls are for tests, not player recovery or normal reward flows.

The SQL migration must be applied before publishing the client. It wraps the established revision-checked write functions, retains their validators and RLS behavior, preserves rewards omitted by older clients and removes direct access to the old bypass functions. It is safe to rerun. Future migrations replacing these RPCs must retain this permanent reward merge behavior.

## Files

- `src/gamification/rules.ts`, `rewards.ts`, `migration.ts`: centralized rules, pure calculations, validation/merge and one-time legacy credit.
- `src/state/LearningStore.ts`, `DailyStore.ts`: atomic reward writes, hydration and import integration.
- `src/utils/syncDocument.ts`, `dailySyncDocument.ts`: optional ledger parsing and deterministic merges.
- `src/utils/knowledgeScoring.ts`, `src/hooks/useKnowledgeProfile.ts`: live totals come from persisted rewards; the legacy projection remains for compatibility and migration checks.
- `src/hooks/useLearningApp.ts`, `useDailyChallenge.ts`: reward feedback and session combo reconstruction.
- `src/components/KnowledgeProgress.tsx`, `InlineQuestionCard.tsx`, `SyncStatus.tsx`: Greek rules/titles, inline combos and complete guest import.
- `src/screens/ReaderLessonScreen.tsx`, `DailyChallengeScreen.tsx`, `QuizScreen.tsx`, `ResultsScreen.tsx`, `WeeklyReviewScreen.tsx`, and `src/navigation/AppNavigator.tsx`: restrained session/result feedback through existing components and routes.
- `supabase/migrations/202610310012_xp_rewards.sql`: validated, monotonic, old-client-safe persistence.
- `scripts/test-xp-rewards.cjs`, `test-xp-rewards-sql.cjs`, `test-xp-ui.cjs`, and `scripts/helpers/load-typescript.cjs`: reward, PostgreSQL and UI coverage.
- Two existing tests were updated for the reader's new real imports and the day-XP label.

## Deployment and manual verification

Follow APPLY-XP-PHASE-2.md. Use the Supabase SQL editor to apply the included migration to the same project as the app, then test locally before updating the beta.

1. Open an existing profile and confirm its total XP/level has not decreased. Reopen and restart: totals stay the same.
2. Use a separate fresh test profile/installation to test new rewards. First complete a new lesson with a mixture of correct and wrong answers; check Greek combo feedback, resulting XP and the player title.
3. Replay it and rapidly tap Answer/Finish: completion and XP must not duplicate.
4. Start a daily quiz, answer several questions, restart offline and continue. Check that the streak resumes, a wrong answer resets it, and day XP is retained after completion/reopening.
5. Check a perfect daily challenge and a previously seen daily question. Only a new question earns question/combo XP, while completion/perfect-day rewards remain available.
6. Finish a weekly batch, including wrong answers. Check its persisted completion credit and one-time correct-recall credit.
7. Sign in and explicitly import guest progress twice. Check the same XP after both imports, then sync a second device and verify account isolation.
8. In a test environment, sync an older client after the updated client has earned XP. Reopen the updated client and confirm rewards remain. Older app versions may display their old derived totals; updated clients agree after sync.
9. Check narrow screens, large text and Android/iOS lifecycle behavior. The automated native UI tests use mocked views.

A scheduled review system for all concepts, achievements/quests and redesigned daily results remain later phases. No beta has been published automatically.
