# Multiplayer screen space audit

Reviewed on 13 November 2026. Scope: multiplayer setup, room lobby, countdown,
question, three-second reveal and final standings. The audit preserves the
existing gameplay, server timing, confirmation, sounds and saved-name behavior.

## Findings and changes

| Screen | Space cost | Change |
| --- | --- | --- |
| Returning setup | Welcome illustration/copy repeated above the saved identity; seven categories always expanded | Returning players start with their saved identity and create/join tabs. The current topic stays visible; its choices open on demand and close after selection. |
| New-player setup | Large artwork and lengthy introduction | Smaller shared artwork and a short introduction; explicit name save/edit/cancel remain. |
| Room settings | Question count and time occupied separate full-width sections | Two compact groups share a row at normal text sizes and stack at larger text sizes. |
| Lobby | Room code, invitation, nested topic card, repeated instructions, large seats and separate readiness panel | Code and Invite share a row; topic metadata is inline. Smaller seats and readiness/start actions share the team panel. Larger text stacks the code/Invite and uses full-width seats. |
| Question | Tall scoreboard, repeated card padding, oversized option badges, lengthy instruction, duplicate exit button | One score strip, tighter padding/badges and shorter guidance. Question text stays 21/30 and answer text stays 16/23 (font size/line height). Confirm remains pinned to a safe-area-aware footer. |
| Reveal | All four options competed with the explanation during the three-second result window | Shows the correct option and the player's option when different, followed by feedback, explanation and sources. Timing and answer outcomes are unchanged. |
| Results | Large artwork/stat blocks and a repeated explanation of scoring | Smaller artwork/stat blocks and a direct winner/score/place summary with the existing leaderboard and rematch. |
| Navigation | Large exit action repeated at the bottom of every room screen | The existing header and Android Back retain their leave confirmation. |

## Measured before and after

Browser rendering of the actual React Native screen through adapters, using the
same two-player fixture at **390 × 740** and normal text size. Coordinates are
pixels from the top of the viewport, before scrolling. This is layout evidence;
native rendering, safe areas and hardware accessibility still need device QA.

| Measurement | Before | After |
| --- | ---: | ---: |
| Bottom of Create Room action | 1,091 | 444 |
| Bottom of Start Game action | 864 | 499 |
| Bottom of Rematch action | 513 | 357 |
| Setup content extending below its scroll viewport | 406 | 0 |
| Lobby content extending below its scroll viewport | 303 | 0 |
| Question content extending below its scroll viewport | 212 | 0 |
| Reveal content extending below its scroll viewport | 209 | 0 |
| Results content extending below its scroll viewport | 142 | 0 |

At **320 × 700**, setup and lobby no longer require scrolling in the two-player
fixture. The long-question fixture retains 39 pixels of scrolling, down from 355;
the pinned confirmation control stays visible. Longer content and larger text
retain natural scrolling.

## Verification

- Before/after layout captures: five phases at 320, 390, 430 and 768 pixels wide.
- Four-player checks: five phases at 320/390/430 pixels, at normal and simulated
  1.5× text size (30 cases). Buttons/tabs retain at least 44 × 44 pixel targets,
  controls remain inside horizontal bounds, and the confirmation footer remains
  within the viewport. Large text stacks room settings and lobby controls.
- Interaction checks retain name save/edit/cancel, topic selection/collapse,
  thematic question-count restrictions, join-code normalization, selection and
  explicit confirmation.
- The preview's native motion, audio and server transport are mocked. Its browser
  dependencies live outside the application; the app's dependencies are unchanged.

Device acceptance should cover both platforms, four players, a 24-character name,
the largest system text size, a short phone in landscape, and reading/confirming
the longest questions. Scrollable content is expected when the text cannot fit.

## Foundation controls (2026-11-13)

Lobby rule editing stays behind **Αλλαγή ρυθμίσεων** and reuses the compact
creation controls. Saving closes the editor; cancel preserves the current rules.
The finished screen adds one review action. The personal review uses the same
question typography, correct/incorrect colors and source links, with return
controls above and below the list. A host rematch does not replace the open review
or reset its scroll position.

The browser adapter checks passed the existing 15 phase/viewport cases and 30
four-player density cases, plus six combinations of 320/390/768px widths and
normal/1.5× text for settings save/cancel, missed-answer review, host rematch while
reading and return to the lobby. Actual native motion, sound and network transport
remain outside these browser layout checks.
