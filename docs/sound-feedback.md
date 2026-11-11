# Gnosi sound feedback

Gnosi uses quiet browsing, silent reading, clear answer feedback and brief milestones. Audio is cosmetic: scoring, XP, saved progress and sync must work identically with sound disabled.

## Shared cue matrix

| Action | Cue | Where it applies |
| --- | --- | --- |
| Select a world / island | Related 75 / 85 ms rounded ticks | Accepted forward browsing taps only |
| Select a lesson / confirm opening | 150 ms light D/F-sharp transition / 240 ms lower A/D transition | Home, paths, saved lessons, results, onboarding |
| Reveal an unanswered question | 130 ms soft F-sharp pluck | Reader checkpoints, Daily Quiz, onboarding, Quick Quiz, mistake review, weekly review, legacy quiz/review, Hangman round opening |
| Confirm a correct answer | 240 ms rising D/A plucks | Shared confirmed-answer pipeline; accepted Hangman letters |
| Confirm an incorrect answer | 230 ms descending F-sharp/D plucks | Same flows; no harsh buzzer or extra penalty sound |
| Finish a lesson, quiz or review / win a word | 560 ms D/F-sharp/A resolution | Accepted completion actions only; Hangman replaces the final letter cue with completion |
| Master an item | 430 ms A/high-D variant | Existing mastery event |
| Level up | 740 ms D/F-sharp/A/high-D resolution | Existing earned-XP level crossing |
| Read, scroll, select an unconfirmed quiz choice, change tabs, go back, hydrate or open saved results | Silent | Visual feedback stays available |

Hangman treats a submitted letter as an answer; repeated/disabled letters do not make a sound. Losing uses the ordinary incorrect cue, not a separate failure fanfare. No background music, startup jingle, per-XP tick or sound on automatic map positioning is introduced.

## Playback policy

- `FeedbackAudio` is the only native effects player. All modes use the same named assets and volume hierarchy. Learning plucks are original deterministic syntheses from `scripts/generate-learning-feedback.cjs`; navigation assets come from `scripts/generate-lesson-whooshes.cjs` (a historical filename; these are now tonal cues). Both generators use `scripts/helpers/synthesize-feedback.cjs` to keep the timbre and notes consistent. No external samples are used. Incorrect-answer output is checked against correct-answer RMS after the player volumes are applied, so it cannot silently become much quieter.
- `playsInSilentMode: false` respects iOS silent mode and Android silent/vibrate mode in the installed Expo SDK. `interruptionMode: "mixWithOthers"` avoids pausing or ducking other apps' music. Playback stays foreground-only, with no microphone use or lock-screen session.
- The existing device-local sound preference controls every cue, including the settings preview. A sound toggle does not affect motion or learning data. Settings explain that system silence still takes precedence.
- `SoundFeedbackQueue` selects the strongest cue emitted during one microtask: level-up > mastery > completion > answer > opening/navigation. It never queues a backlog of old sounds. Lower-priority transitions do not truncate a brief celebration; a new confirmed answer still gets feedback.
- Reward event deduplication and toast delivery remain separate. Sound priority does not remove XP popups or writes. Muting, backgrounding, account-boundary cleanup and sound-preview actions clear queued effects. Preferences loading retains only a recent highest-priority cue.
- Bundled sources prepare at initialization without `play()` or a silent first-play cycle. Playback commands track the active player rather than relying on delayed native `playing` status. Pausing before every rewind clears Android's retained play intent at `STATE_ENDED`; overlapping replays share an in-flight seek and only the latest request may play. Audio and preference-hydration requests expire after 500 ms, including when the JS thread delays timeout delivery.

API references: [Expo SDK 58 Audio](https://docs.expo.dev/versions/v58.0.0/sdk/audio/) and [Apple playing audio guidance](https://developer.apple.com/design/human-interface-guidelines/playing-audio).

## Android first-play failure

The installed `expo-audio` 58.0.11 uses Media3 1.9.1 and lacks Expo's `AudioRenderersFactory` fix. Expo issue [#52724](https://github.com/expo/expo/issues/52724) reproduces our exact SDK/package versions: a short clip entirely buffered while paused can have its AudioTrack stopped before first playback. Status can report successful playback and `didJustFinish` even though no sound was emitted. Later replays work. Expo merged the native fix in [#52732](https://github.com/expo/expo/pull/52732); the inspected published 58.0.12 package also lacks that fix, so simply upgrading to that patch does not resolve this.

All ten original PCM WAVs now have a 1.1-second container, with digital silence appended **after** the existing audible waveform. Audible timing and volume do not change; there is no leading silence or JS warm-up/retry. The shared generator preserves the original fade and normalization before padding. This is an asset workaround based on the [padding report in #42814](https://github.com/expo/expo/issues/42814), rather than proof of every device's buffer behavior. Priorities and cancellation still follow the short audible cue, not the padded duration. It adds roughly 350 KiB across the bundled files. No native dependency/configuration changes are required.

Mock tests cannot detect this silent AudioTrack failure: they verify commands, not speaker output. PCM tests now enforce container duration, valid WAV sizes, silence-only tails and unchanged synthesized audible samples. On Android, force-stop/relaunch, wait at least 3 seconds, and play **each different cue once**, then repeat after a 2-minute idle and background/foreground. Verify that a new cue can interrupt a previous silent tail immediately, and check iPhone behavior too.

## Verification

Node tests cover configuration, mute/background/unmount cancellation, one strongest cue per action, native replay readiness, feedback semantics, finite/non-clipping PCM and weekly question/completion triggers. Native playback is mocked; these checks do not prove hardware behavior.

On Android and iPhone:

1. With sound enabled, test the browse-to-lesson path, a lesson checkpoint, Daily Quiz, Quick Quiz and Hangman. Include correct, incorrect and completed states.
2. Test onboarding's first question and weekly/mistake review. Reopening an unanswered question should play once; expanding sources, changing font size or restoring completed results should stay quiet.
3. Trigger a level-up at completion. Hear the level-up cue without a cascade of answer/completion sounds. Confirm that the visual XP/result feedback remains correct.
4. Turn off the app's sound toggle. Repeat actions and the settings sound preview; all remain quiet. Toggle motion independently.
5. Turn the app's sound on but use iPhone silent mode, or Android silent/vibrate mode. Effects remain quiet. Return to normal mode and verify the next action plays normally.
6. Play music in another app, then browse, answer and complete a quiz in Gnosi. Music should continue at its existing volume.
7. Background the app during playback and while opening a question. No stale cue should resume later. Test the first cold opening as well as repeated playback.

Android regression checks: cold first cue has one native play call, repeated ended cues cannot auto-resume during seek, stop pauses even before native playing status arrives, overlapping same-player seeks cannot rewind a newer sound, and expired requests stay silent. On hardware, repeat correct/incorrect answers and rapid preview open/close/reopen, including after backgrounding. Confirm the first cue remains audible without warm-up.
