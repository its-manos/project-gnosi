# XP balance v3 and mini-game rewards

This supersedes the current-rewards section of `xp-phase-2.md`. Existing earned
receipts, legacy migration amounts, level thresholds and player titles stay intact.
New lesson completions use 60 XP plus 10/15/20 XP per eligible easy/medium/hard
answer. Lesson combos rise by 2 per consecutive correct answer, capped at 6 per
answer. A three-question medium lesson with all correct answers earns 111 XP,
before the one-time 25 XP category reward.

Daily Quiz pays 20 XP on completion, 5 for each correct answer and 10 for a
perfect result: 20–65 XP per Athens date. Questions seen on earlier dates remain
eligible; wrong answers and daily combos award no extra XP. Existing saved day
rewards are never recalculated. Pending answer feedback remains distinct from
XP committed at completion. Weekly delayed recall retains its earlier one-time
answer/combo rules. Scheduled review and mistake review keep their existing
shared 10 XP daily completion allowance.

Hangman awards 10 XP per distinct word won per Athens date, up to 30 XP/day.
Losses, unfinished words and repeat wins of the same word do not pay. Quick Quiz
awards 2 XP per distinct question's first answer per Athens date if correct, up to
20 XP/day. A wrong first answer consumes that question's daily eligibility;
immediate correction cannot earn XP. Game receipts do not consume lesson/daily
question eligibility or update the Daily Quiz streak. Both games remain playable
after their limits, and result panels show today's credited XP.

## Persistence and synchronization

Each game receipt uses `game:<hangman|quick>:<YYYY-MM-DD>:<content-id>` in the
existing learning reward ledger. Quick Quiz wrong first attempts use zero-valued
receipts. At the daily cap further play needs no reward writes. Receipt values
merge by maximum, and distinct identities merge by union. `totalRewardXP` clamps
each game/date bucket after union to 30/20. Thus two offline devices can retain
different wins without either losing distinct progress or exceeding a cap.
The Profile games subtotal uses this same projection; do not sum raw game receipt
values to calculate XP. Merge order, repeat imports and retries do not change totals.

Quick Quiz persists the answer and original timestamp before handing it to the
learning store, where mistake tracking and XP enter the same write. Reloading the
saved round recovers a missing handoff without rewarding an answer twice; the
original answer date determines its allowance. Older rounds without timestamps
remain non-rewarded practice. Hangman commits its win receipt immediately; round
state itself remains session-only. Hydration/import/sync do not emit reward sounds.
Local accepted wins/answers use the existing feedback channel, including level-up
checks, without sending duplicate sound cues.

## Deployment

Apply `supabase/migrations/202611110015_game_xp_balance.sql` to the app's Supabase
project **before releasing the client**. It extends the existing reward validator
without changing RPC interfaces, RLS or historical receipt limits. It is rerunnable.
The migration has been exercised locally with PostgreSQL-compatible PGlite; it
has not been applied to production by this change.

Update devices to this client together: older clients' strict learning-ledger
parsers do not recognize game receipt keys. The new server still preserves XP
omitted from a request, but that does not add parsing support to old app builds.
No native dependencies/configuration changed; use the existing beta release flow.

## Verification

Automated checks include first-attempt limits, midnight in Europe/Athens, daily
question recurrence, legacy XP preservation, shuffled Quick Quiz choices, rapid
taps, offline receipt unions/caps, restart recovery, repeated guest imports,
account isolation and SQL migration/validation/RLS behavior. UI checks mock native
views and do not establish hardware layout/audio behavior.

On Android and iPhone:

1. Confirm an existing profile keeps its total XP and level after updating.
2. Finish a new lesson; verify its answer popups plus completion reward match the
   banked result. Replay it and verify zero new XP.
3. Complete a perfect Daily Quiz: 65 XP, including when its questions occurred on
   earlier dates. Reopen its results: no duplicate reward.
4. Win three distinct Hangman words: 10 XP each, then no further XP. Repeat a word,
   lose a round and leave a word unfinished: no extra reward. Check one win sound.
5. Answer Quick Quiz questions correctly: 2 XP each up to 20. Revisit a wrong
   question that day: correcting it does not pay. Restart mid-round and verify no
   duplicated XP. At midnight/next launch, the new date has fresh allowances.
6. Import guest progress twice and sync two devices after different offline wins;
   verify all clients agree on capped totals. Check the Profile games subtotal.
7. Cross a level threshold in either game and verify the existing level-up cue.

## Reward popup

Positive completion XP now shows in the same popup as answer rewards, whether or
not it crosses a level threshold. Sound priority may coalesce cues but cannot
suppress an earned reward. Navigation and zero-XP completion events leave the
current reward visible; a zero-XP answer still dismisses an older answer popup.
The card uses the Midnight Atlas surface, violet border and gold reward accent.
It remains visible longer, supports reduced motion and never intercepts touches.

Lesson questions live in a native Modal above the main app window. A modal host
now presents the same transient popup there through React context; the root host
yields while that host is mounted. This does not resubscribe to scoring events,
reissue XP or replay sounds. Closing the modal restores the root host for any
remaining display time. Device QA should check both legacy and typed lesson
questions, returning to the reader while a popup is visible, game completion,
muted audio, reduced motion and large text.
