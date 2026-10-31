# Phase 3 — Shared daily challenge and results

## Implemented experience

New daily challenges use one date-based set of seven questions, independent of account, interests or preferred difficulty. The published `shared-v1` pool supplies two easy, three medium and two hard questions across four categories, with no category appearing more than twice. Difficulty increases through the seven-question sequence.

The quiz shows answered progress, seven status markers, category/difficulty, locked first answers, immediate educational feedback, sources and existing combo feedback. Short native opacity transitions respect reduced motion and do not delay interaction or scoring.

Results show:

- Correct answers out of seven and the existing /700 quiz points.
- Accuracy, permanent credited day XP and the highest consecutive-correct combo.
- A strongest category only when it has at least two questions and a uniquely higher accuracy than the other eligible categories. Ties and tiny samples do not produce a winner. The card explicitly describes this as today's small sample, not mastery.
- All-answer review with explanations, chosen/correct answers, source links and reporting for compatible recorded questions.
- Missed-only unscored practice, plus short explanations of up to two mistakes directly on the result screen.
- A relevant, currently accessible unfinished lesson, or a weekly-review action when no unfinished lesson is available. Recommendations respect the existing guided paths and prefer related topics, then saved interests.

Product text is Greek. Existing XP values, permanent reward identities, per-date limits and player titles remain unchanged. The live player-title display fix remains intact.

## Selection and date policy

`src/data/sharedDailyPool.ts` freezes both the published IDs and scored-content revisions of the 109-question pool. Ranking uses the pool version, Athens calendar date and stable identifiers. Input array order and appended unpublished questions cannot change a published set. The 366-date test verifies seven unique questions, the 2/3/2 difficulty sequence, four categories and deterministic results.

A missing/edited published question invalidates this pool rather than silently producing a different shared challenge. Publish reviewed pool/content changes under a new pool version. Keep old scored question records available for already-started sessions; appending new IDs is safer than changing the answer positions of existing questions. A shared set means the same published pool version, not arbitrary older beta builds.

The day continues to use **Europe/Athens**, including DST. Travel or a device timezone change does not introduce another reward date. Existing started/completed dates keep their saved question IDs, answer order and result. An older personal challenge is labelled as the saved challenge rather than being replaced by the new shared set.

Interests now affect post-quiz lesson recommendations. Onboarding, Home and the preferences screen explain that distinction. The existing stored difficulty field is retained for compatibility, but its control is hidden because it cannot change the shared challenge.

## Compact persistence and compatibility

New records optionally store `selectionVersion` and seven question revisions. At completion, the existing daily write also saves a compact `details` object: revision IDs, seven correctness flags and category/subcategory IDs. Combo and category summaries derive from those original flags; they are not regraded from a future answer key.

This adds compact arrays, not seven copies of question text/images per day. The update introduces no new tables, production dependencies or additional synchronization requests. The existing Phase 2 daily RPC accepts and preserves this metadata; the PostgreSQL regression test verifies its actual write/read round trip. No new SQL migration is required.

Client merge rules preserve matching optional metadata for the same attempt while keeping the established whole-attempt winner. Metadata cannot replace another attempt's answers or frozen score. Parsing validates the detail lengths, types, correct-count consistency and revision correspondence. Merge tests cover commutativity, associativity, idempotency, partial progress, omitted metadata and alternate revisions.

Older clients can omit unknown optional metadata when writing their documents. Updated clients retain their matching local metadata during reconciliation. If that metadata is unavailable on a device, the UI preserves score/XP and marks combo/category detail as unavailable rather than inventing a historical breakdown. A legacy answer review offers current explanations without claiming those option texts were the person's original choices. Legacy practice remains unscored and is labelled as the current edition.

Changed or unavailable question revisions do not display a new question's explanation as part of an old attempt. A versioned active session with changed scored content is kept but cannot continue against a different answer key. The publish-time frozen-pool checks and retaining old bank entries are the preventive strategy.

## Reused architecture and changed files

| Area | Files |
| --- | --- |
| Published selection | `src/data/sharedDailyPool.ts`, `src/utils/sharedDailyChallenge.ts` |
| Result evidence and recommendations | `src/utils/dailyResults.ts` |
| Record parsing, merge and atomic completion | `src/utils/dailyChallenge.ts`, `src/utils/dailySyncDocument.ts`, `src/state/DailyStore.ts` |
| Start/resume integration | `src/hooks/useDailyChallenge.ts`, `src/utils/firstRun.ts` |
| Quiz, preferences and onboarding | `src/screens/DailyChallengeScreen.tsx`, `DailyChallengePreferencesScreen.tsx`, `HomeScreen.tsx`, `WelcomeScreen.tsx` |
| Existing route callbacks | `src/navigation/AppNavigator.tsx` |
| Reusable answer review and motion | `src/components/DailyAnswerReview.tsx`, `src/components/QuizReveal.tsx` |
| New tests | `scripts/test-daily-phase3.cjs`, `test-daily-phase3-ui.cjs`, `test-quiz-reveal.cjs` |
| Existing tests | Daily-bank/parser import allowlists, representative result fixtures, metadata-aware legacy conflict fixture and SQL metadata round-trip assertions |

No Phase 4 concept-mastery/review scheduling, quests, new question formats or social/leaderboard features were added. Quiz points remain personal offline results; this phase does not make them authoritative competitive scores.

## Expo and beta manual checks

Follow APPLY-DAILY-CHALLENGE-PHASE-3.md. Existing daily progress should not be reset just to test the new set. An already-started challenge stays on its original set; test the new shared set on the next unstarted date or a separate fresh test profile.

1. Compare new challenges on two accounts with different saved interests/difficulties: the seven question IDs/order should match for the same day and pool version.
2. Answer, leave during feedback, close/reopen offline and continue. Check the same question, locked answer, combo and status markers.
3. Complete the set. Check /7, /700, accuracy, retained XP, highest combo and a supported category summary. Reopen results: no additional XP.
4. Open all answers and missed-only practice. Check explanations, sources and reporting. Return to results: score and XP stay unchanged.
5. Follow the recommended lesson. Check its title and that it is actually accessible in the existing path. If every lesson is complete, check the weekly-review action.
6. Test an older saved/completed challenge. Confirm that questions are not replaced and historical score/XP survives when detail is unavailable.
7. Test Athens midnight rollover, account switching and two-device sync. A previous day's review must not cover the new day's challenge.
8. On Android and iOS, check large text/narrow screens and reduced-motion settings. Automated native views are mocked; installed-device verification remains necessary.

After testing, confirm before Phase 4. No beta or live database change was performed automatically.
