# Private quiz games with friends

From Home → **Μίνι παιχνίδια → Με φίλους**, sign in and choose a display name.
The name is saved once per account on this device. Returning players see their
saved identity with an **Αλλαγή** action; edits require an explicit save and can
be cancelled. Failed reads/writes show a retry message without replacing the
last saved name. Resuming an older room also remembers its existing player name.

Create a room, share its six-character code, and have friends join from their own
signed-in accounts. The host chooses a category, 5 or 10 questions (thematic games
have 5), and 15 or 30 seconds per question. Two to four players must all be ready.

Every player gets the same question and option order. A correct answer earns one
point; response speed does not affect points. Tapping saves a private, changeable
selection; **Επιβεβαίωση απάντησης** makes it final. At the server deadline, the
last saved selection automatically becomes final, including after a disconnect.
An unsaved/offline selection cannot be guaranteed; the UI reports pending saves.
Answers, explanations and updated scores appear after everyone confirms or time
expires. After three seconds, the next question starts automatically when a client
refreshes the room. Final standings support shared places on ties and a host-led
rematch. These private points do not award learning XP or change saved progress.

Every client keeps a received reveal visible for at least three seconds, even if
a later poll has already advanced the server. The question bar disappears during
reveal; its separate result countdown never refills the question timer. Drafts and
confirmations carry the displayed match/question token so a delayed tap cannot
answer the next question.
The confirmation button stays in a safe-area-aware footer so it remains reachable
while reading longer answers on small screens.

## Multiplayer presentation and sound

The mode reuses the Midnight Atlas backdrop, bundled faceted characters/category
artwork, Atlas action cards and reduced-motion-aware screen entrances. Create/join
tabs keep setup short, the lobby has four seat cards, and rounds show a compact
score strip, countdown, clear answer states and a low-time warning. Results
highlight shared winners and the player's score/place. Each new question resets
the scroll position so an explanation cannot leave the next prompt offscreen.

The [screen-space audit](pvp-layout-audit.md) records the compact layouts and
before/after measurements: saved-identity-first setup, on-demand topic choices,
inline settings, smaller lobby/score cards, focused reveals and accessible
large-text stacking.

Question-open, correct/incorrect reveal and match-complete cues use the existing
practice sound pipeline, including its mute/background preferences. Correctness
is sounded only after the server reveals it. A phase tracker suppresses duplicate
poll sounds, restored results, stale snapshots and background/reconnect replays.
These sounds never award XP or write learning progress.

Name preferences use AsyncStorage under `@gnosi/pvp-name/v1/account:<user-id>`;
they are device preferences, not cloud profile fields. No new dependency, database
migration or native sound module is needed for this polish.

## Backend rollout

Use the **existing Supabase project used by the intended beta build**. After the
existing migrations, apply these tracked SQL files in order through the project's
normal migration workflow or SQL editor:

1. `supabase/migrations/202611120016_friends_pvp.sql`
2. `supabase/migrations/202611120017_friends_pvp_bank.sql`
3. `supabase/migrations/20261112235514_pvp_confirm_and_reveal.sql`

All are transactional and rerunnable. The second migration freezes the existing
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

### Verified deployment — 13 November 2026

The foundation and confirmation migrations are installed in `project-gnosi` (`qrbwrtzmhyuogtvxivhs`). The
hosted migration service recorded these versions; they map to the tracked source
files above and do not need to be applied again to this project:

| Tracked source | Hosted version | Hosted name |
| --- | --- | --- |
| `202611120016_friends_pvp.sql` | `20261112231544` | `friends_pvp` |
| `202611120017_friends_pvp_bank.sql` | `20261112231559` | `friends_pvp_bank` |
| `20261112235514_pvp_confirm_and_reveal.sql` | `20261112235915` | `pvp_confirm_and_reveal` |

The existing application schema was present with no recorded migration history
before this rollout. Baseline that history before adopting a CLI-driven workflow;
do not blindly replay the older application migrations against this database.

Live verification confirmed 30 questions, RLS on all five PvP tables, no raw table
grants to `anon`/`authenticated`, ten intended authenticated RPCs, and no anonymous
PvP RPC grants. An authenticated-role database smoke test used two existing account
identities to check create/join, readiness, countdown, five shared rounds, hidden
solutions, first-answer-only scoring, final standings, rematch, stale-match
rejection and host transfer. Its transaction rolled back all game data; zero test
rooms, answers or throttle rows remained. No accounts were created or changed.

Requests to the actual REST endpoints using the public publishable key confirmed
that anonymous access to `pvp_resume_room` and `pvp_questions` is rejected with
`401 / 42501`. This checks API/schema visibility and anonymous denial; it does not
replace a signed-in mobile end-to-end test.

Security and performance advisors were reviewed. The
[authenticated definer-function notices](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
describe the ten intentional, identity-checked RPC entry points. The
[RLS-without-policy notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
describe deliberately inaccessible tables: callers use RPCs rather than direct
table policies. Internal helpers remain revoked. New foreign keys have supporting
indexes; their initial unused-index notices are expected before gameplay traffic.

The confirmation update also passed a live rollback test for mutable/private
selections, all-selected-but-unconfirmed rounds staying open, immutable confirmed
answers, deadline auto-lock/scoring, three-second reveal, stale-round rejection
and anonymous denial. It used an isolated temporary room and left no test rows.
Existing client `pvp_answer` requests remain compatible and confirm immediately;
older stored answers default to confirmed.

The backend is ready. Distribution of this client to an installed beta and the
Android/iOS device acceptance checks below remain pending.

## Protocol and lifecycle

- Membership-checked RPCs are the only authenticated interface. Raw tables and
  internal helpers are inaccessible to `anon` and `authenticated`. RLS is enabled.
- One room row lock serializes joins, answers, start, leave, rematch and transitions.
  A per-account advisory lock prevents concurrent create/join requests from acquiring
  seats in multiple rooms. Creation and repeat joins are safe to retry.
- Players submit only their choice plus room, match and question identifiers.
  The server checks membership, phase, start time and deadline, evaluates the frozen
  correct index, and keeps confirmed answers immutable. Drafts are private and
  unscored until confirmation or the deadline. Points match the shared engine's
  `correctCount`; clients cannot submit a score or another player's identity.
- Snapshots contain only the current public question. Solutions, sources, other
  players' choices and current-round points remain concealed until reveal. The
  authored bank is shipped in the app for solo play, so this is casual friends
  competition, not a claim of tamper-proof tournament play.
- The app polls every 1.5 seconds while foregrounded in a room and refreshes at question/reveal deadlines; no polling runs
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

The three-second reveal displays the explanation and source links.
If everyone backgrounds the app, no autonomous timer job runs. The next refresh
advances from the stored phase and starts the next question with its full duration.

## Rematches, lobby rules and reviews

The foundations migration `20261113103027_pvp_foundations.sql` keeps a private,
ordered question history per room. Deals prefer unseen eligible questions, then
least recently dealt questions when that category is exhausted. History survives
rematches and category changes until the room is deleted. It does not follow an
account into a different room. The question bank is unchanged: a five-question
theme necessarily repeats on a thematic rematch; mixed games rotate all 30.

Hosts can expand **Αλλαγή ρυθμίσεων** in the lobby and save or cancel. A real
change resets everyone's readiness, including the host's. New readiness requests
carry the displayed match and settings revision; a stale device cannot acknowledge
old rules. A no-op save preserves readiness. Older clients work in unchanged
lobbies but must update before acknowledging modified rules.

After 15 seconds without a heartbeat, a lobby player is shown as reconnecting and
loses readiness. Their seat is held until the existing 90-second lobby timeout.
Returning players ready up again. Match timers continue during a disconnect;
the screen explains that the latest saved choice is retained and offers retry.

**Απαντήσεις & εξηγήσεις** opens a personal review after completion. It shows each
reached question, the player's confirmed choice (or no answer), the correct answer,
explanation and original sources. An early finish excludes unreached questions
and unconfirmed drafts. Reviews are archived privately with the original match
participants and frozen question versions. They remain readable if the host
rematches while someone is reviewing; room heartbeats continue. Back returns to
the room without leaving it. Access ends at room expiry, and archives cascade when
the room is deleted. The UI opens the just-finished game; no historical-game
browser or permanent account history is added.

Deploy this migration before publishing the updated client. Do not replay earlier
app migrations to resolve unrelated migration-history differences.

## Verification

`npm run test:pvp` checks the seed, client behavior and PostgreSQL rules using
PGlite. Client tests exercise the real hook and native screen with mocked React
Native/transport. SQL tests execute real RPCs as authenticated users and verify
permissions, room capacity, readiness, hidden answers, shared-engine scoring,
countdown/deadline enforcement, immutable answers, stale requests, rematches,
reconnect, host transfer and expiration. Foundation tests also run seven rematches
to verify exhaustion and repeat rotation, settings revision guards, personal review
privacy, review retention through rematches, early completion and deletion cascades. These tests use a local database with
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

Additional device checks for the foundations:

1. Edit lobby rules as host; verify every player must ready again. Cancel an edit
   and verify rules/readiness stay unchanged. Try a stale second device.
2. Disconnect a ready player for 16–30 seconds; verify reconnect status and
   readiness reset, then resume and ready again.
3. Play consecutive mixed-topic rematches; verify unseen questions are preferred.
4. Open the review, inspect wrong/missed answers and source links, and have the
   host rematch on another phone. Return to the new lobby with Android Back or
   the visible return button. Repeat with large text and narrow screens.

Lobby feedback uses short join/leave/ready cues and a four-second announcement in
the waiting line. Ready counts and waiting names remain visible after it clears.
Countdown ticks follow the displayed server clock; answer locks and one low-time
warning have distinct cues, while reveals keep their existing result sounds.
Countdown, seat, score and result pulses respect reduced motion. See
[sound feedback](sound-feedback.md#private-game-feedback) for timing and device QA.
