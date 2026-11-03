# Gnosi — full-screen lesson questions (draft PR #14)

## Scope

All existing **lesson reader** checkpoints, including the 30 Ancient Greece lessons.
This changes the **presentation only**. It does not move any question anchor,
change lesson narratives, create new answer formats, or affect the standalone
daily quiz.

## Reader behavior

1. The learner reads until the current visible checkpoint. The existing
   `getReadingVisibleParagraphLimit` gate still prevents access to subsequent
   paragraphs until that question is confirmed.
2. When the checkpoint gateway enters the actual viewport, the app opens a
   **full-screen native modal**. A manual `Άνοιγμα ερωτήσεων` button at that
   checkpoint is an accessibility and low-scroll fallback. The reader stays
   mounted behind the modal, with scrolling disabled and its text hidden.
3. When several questions share an ending, the header shows `Ερώτηση X / Y`
   and a segmented progress indicator. Answers are collected in the original
   canonical index order, one at a time.
4. The existing card requires **explicit confirmation**. Once confirmed, the
   existing success/wrong feedback and explanation remain visible until the
   learner taps `Επόμενη ερώτηση` or `Συνέχεια ανάγνωσης`. Wrong answers are
   allowed to unlock the next segment, as before.
5. Closing the final feedback screen returns to the preserved article and
   scrolls to the next paragraph or its end summary. Android system Back and
   the visible exit control go through the existing lesson-leave guard.
6. A saved partial attempt reopens at its existing reading/resume checkpoint.
   A group containing earlier answered questions starts at its first pending
   question with the original X/Y numbering.

## Compatibility invariants

- Same `lesson.questions[]` order, question IDs, authored section/checkpoint
  positions, `quizFingerprint`, typed-answer sidecars, and numeric historical
  answer slots.
- Same parent `onAnswerCheckpoint` callback and one-write confirmation guards,
  XP and completion calculations, weekly mistake review, content reporting,
  account separation, backups and automatic synchronization.
- Source links, inline images and paragraph offsets stay attached to the
  reader rather than being copied into the modal.
- A native modal is deliberately used rather than adding a nested navigation
  route, so returning does not reset the article component.

## Audio

- `assets/sounds/question-open.wav`: 0.46 s, 22,050 Hz, mono, signed
  PCM 16-bit; a shortened, softly faded derivative of the already bundled
  `assets/sounds/mastered.wav`. It uses the **same existing sound source**,
  not a new provider or unverified external download.
- Playback is requested through `requestPracticeCue("question-open")`
  and the existing `FeedbackAudio` player. It is non-scoring and does not
  create an XP event, toast, persistence write or synchronization event.
- The user's sound preference, foreground gate, iOS silent-mode behavior,
  Android muted first-play warm-up and playback cancellation remain shared
  with the existing sound effects. The new cue plays only when a question is
  opened, not during app startup, hydration, or restoring answers.
- The original `mastered.wav` creator/license metadata should be retained
  with the existing audio library when such provenance is documented.

## Verification

Automated CI includes `npm run typecheck`, `npm run validate:content`,
`npm run test:section-end-questions`, `node scripts/test-reader-pilot.cjs`,
`node scripts/test-play-audio.cjs`, `node scripts/test-answer-sound-route.cjs`,
typed-answer, question-format, editorial, backup and sync regressions.
Native device verification is still required before merge.

On **Android and iPhone**, test:
- Scroll to a checkpoint versus opening the article: modal must open only when
  reached; opening cue once, no automatic sound on app startup.
- Sound enabled/disabled, app background/foreground, Android first-play,
  correct/incorrect cues after confirmation, no double-submit/XP.
- `greek-science-knowledge` questions 1 and 2 at paragraph 6: X/Y indicator,
  no premature paragraph 7 access, first answer remains visible until Next.
- Single-choice, multiple-select, ordering, matching, spot-the-mistake and
  fill-blank; show explanation before advancing.
- Android hardware Back, cancel exit confirmation, article scroll restoration,
  large font settings and screen-reader focus inside the modal.
- Close/reopen after the first of several questions, old completed attempts,
  weekly mistake review, account isolation, backups and cross-device sync.

Do not merge PR #14 before documented device QA and explicit approval.
