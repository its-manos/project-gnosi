# Beta analytics

**Retention follow-up:** apply migrations 010 and 011 using `docs/beta-analytics-retention.md` after the original setup. They schedule 30/7-day raw cleanup and preserve one year of compact trends. No app release is needed for this follow-up.

This adds opt-in usage measurement using the existing Supabase client. No new app dependency, native SDK, account requirement or database changes to learning progress. Apply migration `202610310009_beta_analytics.sql` before publishing the app update. Nothing has been deployed to your Supabase project automatically.

## Install and check

1. Extract the patch into the existing project and overwrite matching files.
2. In your Supabase project's SQL Editor, run all of `supabase/migrations/202610310009_beta_analytics.sql`. It creates the event table and the insert-only `ingest_beta_events` RPC. The migration can be rerun safely.
3. Run:

   ```bash
   npm run typecheck
   node scripts/test-beta-analytics.cjs
   node scripts/test-beta-analytics-ui.cjs
   node scripts/test-welcome.cjs
   node scripts/test-reader-pilot.cjs
   npx expo start --clear
   ```

4. On a phone, enable “Βοήθησε να βελτιώσουμε τη ΓΝΩΣΗ” on the welcome screen or at the bottom of Progress. Default is OFF; declining never prevents use. Existing beta users can enable it in Progress without resetting their learning data.
5. Complete or skip onboarding; open a lesson, answer a checkpoint, leave it, resume and finish it. Background and reopen the app. Test offline then reconnect. Allow at least 15 seconds in the foreground for an upload; up to 50 queued events are sent per pass.
6. In the SQL Editor, run:

   ```sql
   select event_name, environment, occurred_at, properties
   from public.beta_analytics_events
   order by received_at desc, occurred_at desc
   limit 50;
   ```

   Expo Go/development bundles use `environment = 'development'`. Installed release/preview beta bundles use `beta`. All supplied business reports exclude development events. A manually built release running on your own phone also counts as beta if you opt in: switch sharing off there if you want to avoid including yourself.
7. Switch sharing OFF and verify new activity stops arriving. An already committed request may have arrived before withdrawal; previously uploaded records are retained. The local pending queue and local identifier are cleared. Turning sharing back on creates a new identifier.
8. After phone QA, publish using the existing OTA-enabled beta:

   ```bash
   npm run beta:update:android -- --message "Add opt-in beta analytics"
   ```

   No new APK or environment variable is required for the existing OTA-enabled base. Users of older APKs without EAS Update still need that base APK. This patch does not publish anything on your behalf.

## Reading the reports

Open `supabase/reports/beta_analytics.sql`; run each SELECT separately in the SQL Editor as owner/admin. These are private developer reports, not screens exposed to testers.

| Report | What it answers | Important denominator |
| --- | --- | --- |
| Daily activity | Are testers opening or returning to the app? | Distinct opted-in installations seen on an Athens calendar day |
| Onboarding funnel | Do people reach modes, interests, send-off and completion? | Consenting first-run installations actually observed at step 1; tour replays excluded |
| Lesson visits | Which lessons get opened and finished? | Reader visits, including resumes/replays; saved results are not new completions |
| Exit detail | At which checkpoint/paragraph did a visit stop? | Explicit navigation exits or interruptions recovered on a later foreground/cold start |
| Last screen | Where was an inactive session last observed? | Sessions with no observed activity for at least 30 minutes; not confirmed app exits |
| D1/D7 return | Do observed installations return on exactly the next/seventh day? | Cohorts whose full return day has elapsed; later cohorts show NULL, not 0% |

After the retention follow-up, cohort dates use preserved first-observation metadata after opting in, not installation date or account creation; they do not reset when raw events are pruned. Inactive installation metadata expires after a year. There is no retroactive tracking. Users who do not share are absent from all reports, and people who enable sharing after leaving the first onboarding screen are not treated as observed step-1 starters. Reinstalling/clearing app data or opting out and back in creates another installation identity. Multiple people on one installation look like one device. Do not call these counts unique people or all beta users.

The SQL uses `Europe/Athens` dates. Events use the device's timestamp and the server also records `received_at`; delayed uploads can backfill earlier days. Allow a little time for offline testers to reconnect before interpreting a cohort. Device clocks may be inaccurate; ingestion rejects extreme timestamps and the queue expires after seven days.

A small beta gives directional evidence, not reliable population percentages. Start with:

- Many observed first-run users stop at interests: watch someone choose topics and check whether the minimum-three rule is obvious.
- Many reader visits stop before the first checkpoint: inspect the opening and first screen; ask testers what made them leave.
- A lesson attracts starts but few completed visits: inspect its checkpoint distribution and explanation length.
- Readers finish lessons but rarely return the next day: ask what they expected to see next and whether they noticed the daily challenge.

## Event contract

All events contain a UUID event ID, random installation ID, session ID, timestamp, platform, environment, and `beta-analytics-1` revision. Properties come from a strict allowlist in both client and database. Names, emails, auth user IDs, answer choices, correctness, passwords, search text, free text, IP addresses and advertising IDs are not added to event payloads. This is pseudonymous telemetry, not a promise of absolute anonymity; infrastructure request logs are separate.

| Event | Meaning |
| --- | --- |
| `session_started` | Cold start after consent, opt-in, or foreground after 30+ minutes away |
| `session_backgrounded` | App moved to background; captures last screen and active lesson context |
| `screen_viewed` | A top-level screen is shown, or app returns to foreground |
| `onboarding_step_viewed` | A numbered step is shown while sharing is enabled; carries replay flag |
| `onboarding_completed` | Preferences/welcome completion succeeded |
| `onboarding_skipped` | Skip succeeded; carries last step and replay flag |
| `lesson_started` | A reader/legacy quiz visit begins, with a fresh visit ID and resume flag |
| `lesson_progress` | Answered checkpoint count or last visible paragraph advances |
| `lesson_completed` | The active visit transitions to newly completed results |
| `lesson_left` | Navigation away from an unfinished visit, including an account-boundary unmount |
| `lesson_interrupted` | A persisted unfinished visit is recovered at cold start, or a 30-minute background gap ends it |

A visit's `attempt_id` is an analytics visit ID, not a scoring/progress record ID. Completion does not require a perfect score. Reopening saved results does not create a new start or completion. Question counts refer to inline lesson checkpoints. A scroll records the highest paragraph whose top entered the viewport; it is **not proof of reading**. A paragraph can be visible through automatic resume/continue scrolling. Without a scroll observation, the last paragraph may be unknown; checkpoint counts remain available.

The navigator excludes onboarding/preferences/daily overlays from lesson tracking while they are visible. It does not attach authentication identities. Account changes end the current visit but retain the installation pseudonym; the learning sync remains separately scoped to the account.

An iOS `inactive` transition (notification panel, switching state) is not an exit. A short background gap resumes the session; a 30-minute gap creates a new session and resumed lesson visit. A process kill has no guaranteed final callback. On next launch, the last persisted unfinished visit is reported as interrupted; if the app never returns, use the last-observation report. Unknown visits remain “open_or_unknown,” not fabricated abandonment.

## Reliability, access and maintenance

- Optional telemetry never blocks learning. Queue writes are serialized; events persist locally and retry on startup, foreground and every 15 seconds while active. Missing Supabase configuration/migration or network failures keep a bounded queue rather than breaking the app.
- At most 300 local events and seven days of pending history are retained. Oldest pending events can be discarded if the queue fills. Reports can therefore have incomplete visits.
- Stable event IDs plus `ON CONFLICT DO NOTHING` make retries and lost acknowledgements idempotent. An upload acknowledges only its own event IDs, preserving events created while it was in flight.
- Consent is OFF by default. Startup requires both an affirmative consent marker and matching consent data. Opt-out immediately fences queued callbacks, aborts an in-flight request where possible, and attempts to clear both records. If all local storage writes fail, the app reports that the choice could not be saved; retry it before closing the app.
- App roles have no SELECT, UPDATE, DELETE or direct INSERT privilege on `beta_analytics_events`. Only the validated insert RPC is granted to `anon` and `authenticated`. No service-role key belongs in the app.
- The RPC has an empty search path, fixed identifiers, bounded payloads, approved fields/enums and a per-installation 2,000-event/day ceiling. This is not bot-proof: a public guest endpoint can receive fabricated events. Keep this for private-beta product learning, not leaderboards, rewards or billing. Harden the collection endpoint before broad public growth if abuse appears.
- Automatic retention is installed by migrations 010 and 011; see `docs/beta-analytics-retention.md`. It prunes raw beta/development events after 30/seven days and keeps compact summaries for a year. Previously sent events are not immediately deleted by the app's OFF switch.
- Do not grant public access to the reports or add broad read policies. Evaluate aggregated results in the owner dashboard.

## Validation performed

TypeScript and Android bundle export passed. New engine tests cover default-off, payload filtering, offline restart, lost acknowledgements, bounded queues, DEV separation, revocation during transport and partial/total storage failures. UI tests run real welcome/navigator/provider code with mocked native views, including AppState transitions and the existing RPC. Reader tests exercise the real scroll/layout callback. Existing welcome, progress, 61-reader, daily/learning sync and OTA-configuration regressions passed.

The migration was executed twice in a local PostgreSQL-compatible PGlite database. Tests run as `anon` and `authenticated`, verify insert-only privileges, invalid-payload rejection, atomic rollback and duplicate retries, and execute all report SELECTs against known onboarding/completion/return fixtures. No live Supabase migration or event upload was performed here. Phone rendering and the live project's API path still need the smoke check above.

An optional reproducible SQL test is included as `scripts/test-beta-analytics-sql.cjs`. It requires PGlite only in a separate test directory, **not** as an app dependency:

```bash
npm install --prefix /tmp/gnosi-analytics-sql-tests @electric-sql/pglite --ignore-scripts --no-audit --no-fund
GNOSI_PGLITE_MODULE=/tmp/gnosi-analytics-sql-tests/node_modules/@electric-sql/pglite node scripts/test-beta-analytics-sql.cjs
```

Implementation references: [Supabase database functions](https://supabase.com/docs/guides/database/functions), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [React Native AppState](https://reactnative.dev/docs/appstate).
