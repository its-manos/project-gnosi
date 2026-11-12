# Private quiz games with friends

From Home → **Μίνι παιχνίδια → Με φίλους**, sign in and choose a display name.
Create a room, share its six-character code, and have friends join from their own
signed-in accounts. The host chooses a category, 5 or 10 questions (thematic games
have 5), and 15 or 30 seconds per question. Two to four players must all be ready.

Every player gets the same question and option order. A correct answer earns one
point; response speed does not affect points. The first accepted answer is final.
Answers, explanations and updated scores appear after everyone answers or time
expires. After seven seconds, the next question starts automatically when a client
refreshes the room. Final standings support shared places on ties and a host-led
rematch. These private points do not award learning XP or change saved progress.

## Backend rollout

Use the **existing Supabase project used by the intended beta build**. After the
existing migrations, apply these tracked SQL files in order through the project's
normal migration workflow or SQL editor:

1. `supabase/migrations/202611120016_friends_pvp.sql`
2. `supabase/migrations/202611120017_friends_pvp_bank.sql`

Both are transactional and rerunnable. The second migration freezes the existing
30 Quick Quiz questions, including authored revisions and sources, after validation
with the shared quiz engine. Live rooms keep a private snapshot of their dealt
questions, so a later bank update cannot change an ongoing answer's meaning.
After rollout, publish bank updates as **new migrations**; do not regenerate an
already-applied historical migration. `scripts/generate-pvp-bank.cjs` is the seed's
build-time generator and its `--check` mode detects divergence during development.

No new native module, service-role key, Realtime publication or background job is
required. The existing public Supabase configuration and account session are used.
Guests get a sign-in prompt; an unconfigured client keeps all solo modes available.
Missing backend functions produce a friendly unavailable/retry message.

The implementation and tests do **not** establish that these migrations have been
applied to the live service, or that an installed beta has received this client.
Apply and test the backend before distributing the corresponding app update.

## Protocol and lifecycle

- Membership-checked RPCs are the only authenticated interface. Raw tables and
  internal helpers are inaccessible to `anon` and `authenticated`. RLS is enabled.
- One room row lock serializes joins, answers, start, leave, rematch and transitions.
  A per-account advisory lock prevents concurrent create/join requests from acquiring
  seats in multiple rooms. Creation and repeat joins are safe to retry.
- Players submit only their choice plus room, match and question identifiers.
  The server checks membership, phase, start time and deadline, evaluates the frozen
  correct index, and stores only the first answer. Points match the shared engine's
  `correctCount`; clients cannot submit a score or another player's identity.
- Snapshots contain only the current public question. Solutions, sources, other
  players' choices and current-round points remain concealed until reveal. The
  authored bank is shipped in the app for solo play, so this is casual friends
  competition, not a claim of tamper-proof tournament play.
- The app polls every 1.5 seconds while foregrounded in a room; no polling runs
  in the background. Server timestamps provide the displayed countdown offset.
  A stale connection disables answers, requests time out after 10 seconds, and
  foregrounding immediately refreshes. A foreground action queues behind a poll
  while keeping its original match/question token. Duplicate taps are ignored.
- Reopening the mode resumes the account's active room without relying on device
  storage. Lobby seats expire after 90 seconds without a heartbeat. During a match,
  disconnected seats remain eligible to resume, and missed questions time out.
- The host transfers on explicit departure or after 90 seconds disconnected.
  With fewer than two remaining seats a match finishes early. Leaving on Android
  Back uses the same confirmation and server departure as the visible exit action.
- Rooms expire two hours after creation. They are private by membership and room
  code, with up to 20 join attempts per account per minute and three newly created
  rooms per minute. Failed code guesses commit their rate counters.
- Expired rooms, answer rows and throttle rows are not automatically deleted.
  Operators can delete expired `pvp_rooms` under their retention policy (child rows
  cascade) and old `pvp_join_limits` rows. No scheduled cleanup is provisioned.

The seven-second reveal allows time to read the explanation and source links.
If everyone backgrounds the app, no autonomous timer job runs. The next refresh
advances from the stored phase and starts the next question with its full duration.

## Verification

`npm run test:pvp` checks the seed, client behavior and PostgreSQL rules using
PGlite. Client tests exercise the real hook and native screen with mocked React
Native/transport. SQL tests execute real RPCs as authenticated users and verify
permissions, room capacity, readiness, hidden answers, shared-engine scoring,
countdown/deadline enforcement, immutable answers, stale requests, rematches,
reconnect, host transfer and expiration. These tests use a local database with
stubbed Supabase identities; they do not contact the production database.

Before release, use actual Android/iOS devices and the intended Supabase instance:

1. Sign into two, three and four distinct accounts; create/join by typed and shared
   code. A fifth account must be rejected. Check a narrow phone and large text.
2. Toggle readiness, start as host, and verify identical questions/deadlines.
   Submit mixed correct/wrong answers, answer twice, and let a question time out.
   Verify choices and new points stay hidden until reveal, including on reconnect.
3. Background or interrupt the network on one phone; verify stale-answer blocking,
   recovery, and room restoration after process death. Background all devices and
   resume; verify a fresh full-duration next question.
4. Leave as host and disconnect a host for over 90 seconds. Verify host transfer,
   departing-player labels, early finish with one remaining player, and lobby seat
   expiration. Sign out/change account and verify room data stays account-scoped.
5. Finish a game, verify shared-rank ties, rematch with the same group, and retry a
   request after losing its response. Old-match answers must never reach a new game.
6. Verify room sharing, Android hardware Back, iOS keyboard/safe areas, explanation
   links, offline errors, and successful solo play without Supabase configuration.
