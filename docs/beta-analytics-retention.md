# Automatic analytics retention

This is a database-only follow-up to the beta analytics patch. Nothing has been applied to the live Supabase project from here. No app update, APK, environment variable, additional app dependency or OTA publication is required.

## Apply

1. Extract this ZIP into your Gnosi project and overwrite matching files.
2. In Supabase, open **Integrations → Cron** and enable **pg_cron** if it is not already enabled.
3. In the same project's SQL Editor, run these files separately, in order:

   - `supabase/migrations/202610310010_beta_analytics_retention.sql`
   - `supabase/migrations/202610310011_beta_analytics_schedule.sql`

   The existing analytics migration `202610310009_beta_analytics.sql` must already be installed. File 010 creates private summaries, backfills the existing events and runs cleanup once. File 011 installs the daily job. Both files can be rerun; the named job updates in place.
4. Confirm the job exists and is active:

   ```sql
   select jobname, schedule, active
   from cron.job
   where jobname = 'gnosi-beta-analytics-retention'
     and username = current_user;
   ```

   Expect one active row with schedule `15 2 * * *` (02:15 UTC with Supabase's default cron timezone). If you customized cron's timezone, the schedule follows that setting instead.
5. Confirm initial maintenance succeeded:

   ```sql
   select * from public.beta_analytics_maintenance;
   ```

   `last_run_at` should be recent. Deleted counts may be zero because the beta is new.
6. After the next scheduled run, inspect its History in Cron, or use the diagnostic queries at the bottom of `supabase/reports/beta_analytics_trends.sql`.

## What is kept

| Data | Retention |
| --- | --- |
| Detailed beta events | Delete after 30 days since server receipt |
| Development events | Delete after seven days since server receipt |
| Finalized daily totals and D1/D7 cohort counts | Keep dates within the last 365 days |
| Compact installation cohort record | Keep until 365 days after that installation's last observed activity |
| This job's completed Cron run history | Delete after seven days |
| Maintenance status | One row, replaced at each run |
| Learning progress, accounts, saved lessons, reports and quiz results | Not touched by this cleanup |

Cleanup runs daily, so expired rows may remain until the next successful job. Delayed uploads use receipt time for raw retention; an event's occurrence timestamp may be several days older. If Cron fails or is disabled, data accumulates until maintenance resumes. Check the last-run timestamp when reviewing the beta.

The daily tables contain dates, counts, lesson IDs and screen names, not installation IDs or individual journeys. Cohort bookkeeping is **pseudonymous**, not anonymous: it contains one installation ID, first and last observed dates, and two booleans for D1/D7 return. That small record prevents a long-time returning installation from being misclassified as new after its raw events expire. An installation active throughout the year keeps this record; an inactive installation loses it after a year. Returns after that identity window become new observed cohorts. No email, auth user ID or answer data is added.

All new tables have RLS enabled and no app-role read/write grants. Only the owner/admin runs maintenance and the reports. The mobile insert RPC and opt-in behavior remain unchanged.

## Why summaries have a delay

The app retries offline uploads for seven days; the existing ingestion RPC permits timestamps up to eight days old. A day is finalized only when it is older than that acceptance window. Recent daily usage remains visible immediately in the raw report; archived daily totals normally begin appearing when a date is nine calendar days old.

Return rates have two stages:

- Young cohorts are reported from the compact installation records. An unfinished D1/D7 observation day still shows NULL rather than 0%.
- After D7 fully elapses and the upload buffer passes, a cohort's totals are frozen (at age 17 calendar days). Those totals survive deletion of the underlying raw events and later removal of inactive installation records.

A young installation's first date can move earlier when an offline upload arrives. Maintenance recalculates its D1/D7 flags in that case. Mature snapshots are not recalculated from a partial raw window, so retries and pruning do not reduce old totals or count old installations as new. Do not change the ingestion timestamp window without reviewing these finalization windows too.

The aggregation and deletion run in one transaction, protected against concurrent maintenance runs. A beta row is deleted only after a summary for its occurrence date exists. Repeated job executions do not add the same day twice. Date grouping uses Europe/Athens; the execution schedule uses the Cron timezone.

## Reports

Use the updated `supabase/reports/beta_analytics.sql` for recent detailed funnels, reader visits, exit points and stable D1/D7 retention. Reports 1–5 use retained raw events, so their detail is limited to the recent window. Cohort reporting reads the preserved identities/counts and refreshes nightly; run `select public.maintain_beta_analytics();` as owner if you need an immediate refresh.

Use `supabase/reports/beta_analytics_trends.sql` for finalized daily activity, daily onboarding outcomes, lesson start/completion event counts and screen-view totals across the year. Daily lesson completions can happen on a different day from their starts; the daily ratio is not a visit-cohort completion rate. Daily onboarding outcomes are distinct installations per outcome day excluding tour replays, not the original step-1 funnel. Do not add daily active-installation counts together and call the sum unique monthly people.

The patch preserves detailed recent analysis and compact historical trends; it does not archive paragraph-level journeys or raw answer data indefinitely. It cannot reconstruct events that were already manually deleted before this patch.

## Storage checks

The trend report includes actual table sizes including indexes. The daily tables have at most roughly a year of date rows, with per-lesson/screen counts stored together, while cohort metadata scales with installations observed during the last year. No exact free-plan capacity is promised: raw event volume still matters.

Deleting PostgreSQL rows makes space reusable; the allocated relation files may not immediately shrink. Avoid repeatedly running VACUUM FULL just to force a smaller size reading. Normal database vacuuming handles routine cleanup; use the size queries and Supabase usage dashboard to monitor the trend.

## Validation

Executed migrations and actual SQL reports in local PostgreSQL-compatible PGlite, including reruns, exact 30/7-day cutoff boundaries, pre-delete aggregation, exclusion of development traffic and onboarding replays, 365-day expiry, stable mature snapshots after raw deletion, an established installation returning after pruning, offline first-date correction, and rejection of app-role access/maintenance calls.

The scheduler test first verifies the missing-extension error, then uses an explicit pg_cron API fixture to check one-job idempotence, schedule/command wiring and cleanup of only this job's history. **The real Supabase Cron service was not exercised locally.** Confirm its active status and first scheduled run using the checks above.

Optional reproducible local SQL tests, from the project folder:

```bash
npm install --prefix /tmp/gnosi-analytics-sql-tests @electric-sql/pglite --ignore-scripts --no-audit --no-fund
GNOSI_PGLITE_MODULE=/tmp/gnosi-analytics-sql-tests/node_modules/@electric-sql/pglite node scripts/test-beta-analytics-retention.cjs
GNOSI_PGLITE_MODULE=/tmp/gnosi-analytics-sql-tests/node_modules/@electric-sql/pglite node scripts/test-beta-analytics-sql.cjs
```

References: [Supabase Cron installation](https://supabase.com/docs/guides/cron/install), [Cron quickstart and history cleanup](https://supabase.com/docs/guides/cron/quickstart), [PostgreSQL vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html).
