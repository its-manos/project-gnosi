# Lesson paths and completion screen

The completion screen now leads with short Greek feedback and a ring chart for
the current attempt. Returning to a completed lesson shows the best recorded
score. An unknown or incompatible historical score is not drawn as a current
result; a full replay is offered instead.

The main actions are **Επόμενο μάθημα** and **Επιστροφή στην αρχική**. At 0–2/4,
mistake practice is the primary action, while continuing remains possible. At
3–4/4, the next lesson is primary. This feedback threshold does not change the
existing definition of lesson completion or scoring.

The subcategory progress bar follows these actions. Best-score/mastery details,
full replay, weekly review and content reporting are available under
**Περισσότερες επιλογές**. Completing focused practice does not rewrite the
original score. Existing weekly recovery and replay rules remain in place.

## Unlock rule

- Every subcategory starts independently with its first lesson available.
- Completing a lesson unlocks its immediate successor, at any score.
- All previously completed lessons and saved unfinished attempts stay accessible.
- A bookmark alone does not unlock a lesson.
- Paths use explicit stable editorial ordering in `src/utils/lessonPath.ts`.
  Unlisted future lessons append in ID order. Keep published ordering stable.
- At the end of a path, the next-lesson action is replaced by an invitation to
  choose another topic. Existing gaps can be offered as the next unread step.

Locks are visible on subcategory, search and saved cards. Home and related
recommendations exclude locked lessons. The central lesson-opening handler also
checks access after progress hydration, using the current store snapshot. It
redirects a locked lesson to its subcategory rather than starting an attempt.

Unlocks derive from the account-scoped completion and attempt records already
stored locally and synced. No additional persistent state, SQL migration or
dependency installation is required. Account changes and progress reset therefore
use the appropriate path state automatically.

## Validation

Run:

```bash
npm run typecheck
node scripts/test-lesson-path.cjs
node scripts/test-lesson-results.cjs
node scripts/test-lesson-mistakes.cjs
node scripts/test-reading-discovery.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-weekly-review.cjs
```

Path tests cover all 45 positions and 21 independent starts, wrong-answer
completion, skip prevention, queued taps before hydration, old unfinished
attempts, offline restart, account isolation, reset and recommendation filtering.
Screen tests cover 0–4/4 results, next/home callbacks, practice priority,
collapsed options, old-score handling, final lessons, chart accessibility and
locked saved/subcategory cards. Existing reader, score, sync, reporting, account
and navigation regressions are also checked.

Native views are mocked in interaction tests. Phone QA should check the result
screen at normal/large text sizes, the transition into the next lesson, the last
lesson in a subcategory, mistake practice and the locked-card explanations.
