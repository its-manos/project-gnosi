# Gnosi — learning activity and progress charts

Apply after the quiz revision and catalogue startup fix. Stop Expo first. Extract into your existing project root, allowing replacements:

```bash
unzip -o ~/Downloads/gnosi-learning-activity-update.zip -d .
npm run typecheck
node scripts/test-learning-activity.cjs
node scripts/test-automatic-sync.cjs
node scripts/test-daily-sync.cjs
node scripts/test-home-layout.cjs
```

## Before restarting: apply migration 005

1. Open https://supabase.com/dashboard and select the same Gnosi project used by your app.
2. Open SQL Editor → New query.
3. Paste the entire extracted file `supabase/migrations/202610300005_learning_activity.sql` and click Run.
4. Confirm success. It replaces the existing save function to preserve activity when older clients sync. It does not drop tables or reset rows. Leave RLS enabled. Do not rerun migrations 001–004.

The migration was exercised in local PostgreSQL; it has not been applied to your live Supabase project here. No npm installation, package upgrade, environment change or new native dependency is required.

Restart Expo and open the new session on the phone:

```bash
npx expo start -c
```

## What you will see

- The home map and its list alternative no longer display per-category article counts. Category names, icons, selection and the overall catalogue summary remain available.
- Progress opens with a compact sync status. Detailed sync and guest-import controls are inside the account section.
- New lessons and replays this week, active learning days, and accuracy across newly recorded lesson completions.
- A stacked activity chart: the last seven days or eight Monday-based calendar weeks. Tap a column for its breakdown. The current week includes activity up to today.
- Progress bars for all seven categories, counting unique completed lessons including older records.
- Daily-quiz stats remain separate from article-quiz accuracy. Active days include completed daily quizzes as well as dated lesson completions.

## Existing progress and first use

Older completions still count toward totals and category coverage. They cannot be assigned to a day or week because the app did not record their completion times. The chart may initially be empty; a note explains how many older completions have no date.

Complete an unread lesson to record a first completion. Replay a completed lesson to record a replay. Repeated taps on the finish button count once. The guest development reset also clears guest lesson activity; it leaves bookmarks, daily challenges and account data alone.

An account's dated activity follows that account through the existing automatic sync. Guest activity remains local until you explicitly preview and confirm guest-progress import; the preview includes the count of dated completions. Repeating the import does not duplicate its events, and the guest copy remains available.

The old manual cloud-backup snapshots still cover article progress and bookmarks, not dated activity. Restoring them does not fabricate dates. Automatic account sync carries the new activity records.

## Quick phone check

1. Check that all seven map categories still open and the per-category article-count text is gone.
2. On Progress, switch daily/weekly, tap columns and check the date and counts. Look at long Greek labels and increased system text size.
3. Complete one fresh lesson. Confirm one purple first-completion count, category coverage and the recorded article accuracy.
4. Replay it. Confirm a teal replay count without increasing unique lesson coverage. If you repeat the finish tap, the event should still appear once.
5. Relaunch; verify the same counts. With an account, wait for synced status, open a second updated device and verify the same history. Offline completions should survive a relaunch and sync on reconnect.
6. Check guest → account preview/cancel/confirm if you use guest mode. Signing into another account must show that account's own activity.

## Verification

Passed on a reconstructed current project: full TypeScript check; lint for changed TypeScript/TSX; activity unit/integration checks; automatic article sync and daily sync regressions; home map/list checks; content structure validation; Android/Hermes export; local PostgreSQL checks for migration 005, RLS isolation, revision conflicts, immutable event IDs, field validation and old-client history preservation.

The activity tests cover the actual learning store and chart component with mocked native views/transport, as well as the real hook's inline completion, replay and standalone-quiz routes. They include repeated finish taps, guest import/cancel/re-import, restart/offline/lost acknowledgement, old undated completions, frozen scores and Athens DST/year boundaries.

The content validator was updated from the obsolete six-paragraph/three-question rule to the current four-question format. It still reports 35 existing supplementary-inline-image warnings; those lessons have cover images. Native phone layout, live Supabase migration and real two-device connectivity still need the check above.
