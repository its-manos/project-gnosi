# Ancient Greece — questions at section endings (PR QA)

**Scope:** the 30 lessons in the Ancient Greece path. **Status:** implementation proposed; editorial statuses remain **Integrated**, not Validated or Approved. This PR does not update `main`.

## Interpretation and behavior

The five **curriculum chapters** group lessons. Within each lesson the reader has authored, titled `sections`; the app labels each `ΕΝΟΤΗΤΑ`. Questions now appear after the final paragraph and its inline images **within their existing lesson section**, rather than after an intermediate paragraph. They do **not** move to the end of the whole lesson or of one of the five curriculum chapters.

The reader uses `getReadingQuestionPlacements` for display and the corresponding reading visibility/resume helpers. The existing `getQuestionPlacements` is still the authored, historical mapping. Existing section-end questions stay exactly where they were. If multiple questions belong to the same section, they share its ending and are confirmed **one at a time**, in canonical question order. The next section stays locked until all pending questions at the preceding ending have been confirmed; correctness is not a requirement for advancing.

`Lesson.questionPlacement: "section-end"` is an explicit opt-in that the assembled catalogue applies only to the Ancient Greece subcategory. Other reading paths keep their pre-existing placement behavior.

## Preserved by design

- **No edits to any lesson narrative, question, answer, explanation, source or image metadata.**
- No mutation of `lesson.checkpoints`, paragraph IDs, section order, inline image anchors, `questions[]` order, question versions, or `quizFingerprint`.
- Answer storage remains indexed by canonical question index, including typed-answer versioned sidecars, report IDs and weekly review references.
- XP/completion/attempts, saved lessons, historic activity, synchronization and backwards-compatible progress formats are unchanged.
- All existing confirmation, feedback, audio and wrong-answer progression callbacks are reused.
- The reader's scroll-resume helper returns the shared section ending when another unanswered question sits there, rather than skipping ahead to a locked paragraph.

## Automated validation

The PR adds a dedicated Node regression command and pull-request CI.

```bash
cd ~/Documents/project-gnosi
git fetch origin
git switch feat/ancient-greece-section-end-questions
git pull --ff-only origin feat/ancient-greece-section-end-questions
npm ci
npm run typecheck
npm run validate:content
npm run test:section-end-questions
node scripts/test-reader-pilot.cjs
node scripts/test-flexible-editorial.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-learning-backup.cjs
node scripts/test-automatic-sync.cjs
node scripts/test-typed-lesson-integration.cjs
node scripts/test-typed-lesson-audio.cjs
node scripts/test-answer-sound-route.cjs
npm run test:question-types
```

CI confirms structural placement, question identity/order, unchanged authored anchors, grouped-question visibility, resume, inline figures, typed-answer callbacks and existing quiz/learning compatibility. **Node mocks and typecheck do not substitute for native device QA.** Do not mark tests passed without their actual output.

## Android / iPhone verification

Use `npx expo start --clear` after checks. On **both Android and iPhone**:

1. Open an Ancient Greece lesson with a moved checkpoint (for example `greek-history-through-evidence` or `greek-science-knowledge`). Read an entire section, including its images, before the question appears.
2. Open `greek-science-knowledge`, which has two questions that now meet at paragraph 6. Confirm the first and verify that the second appears **before** the next section. The continue button must appear only after the second answer is confirmed. Also spot-check `greek-philosophy-in-context`, `greek-stage-tragedy`, and `greek-sanctuaries-games`.
3. Try each current question type (single choice, spot-the-mistake, fill-in-the-blank, multiple select, ordering, matching). Unconfirmed selections must never score, unlock or play answer audio. Confirm correct and incorrect answers; ensure feedback, explanation, audio and XP fire once.
4. Close and reopen after confirming only the first of two questions sharing an ending. Resume at that section ending and answer the second; then complete the lesson. Test an old saved attempt created before this PR and an already completed lesson.
5. Check paragraph text, section titles, inline image alignment, image zoom, credits and source links. Recheck at larger reader font sizes, with screen reader / Android back and scroll-to-next behavior.
6. Verify bookmarks, guest restart, account isolation, import/restore and two-device synchronization without changing question indexes or duplicating XP. Check completion, weekly mistake review and historical progress.
7. Open a non-Ancient-Greece lesson and verify the previous mid-article checkpoint behavior is unchanged.

Record observed results separately for Android and iPhone, including device/OS/build, failing lesson/question, expected and actual behavior. Only advance audit status after documented evidence.

## Remaining editorial audit (separate tasks)

After the technical PR is reviewed: evaluate question difficulty and distractor quality; reduce repeated objectives across the 30 lessons; fact-check historical claims and primary/secondary-source nuance against the five chapter reports; resolve the two remaining image-rights human-review flags; perform complete Android/iPhone reader, quiz, media, offline/resume and sync QA; then sign off lesson-by-lesson editorial validation. Do not merge the technical placement PR automatically.
