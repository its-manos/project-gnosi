# Gnosi — typed question formats in existing lessons

**Status:** integration pilot / Draft PR; do not mark lessons *Validated* or publish an editorial change until Node, device, and content QA pass.

## What now works

The reader can render all six built-in quiz components at existing paragraph checkpoints. The common confirmation flow submits through the same parent callback; choosing or reordering tiles before confirmation has no scoring effects.

Existing lesson records continue to use `checkpointAnswers[index]: number` for paragraph unlocking, score, XP, historical completion, and weekly review. A rich multiple-select / ordering / matching response additionally writes `typedCheckpointAnswers[index] = { questionVersion, value }` in the same `BackupAttempt` persisted and synchronized by the existing document. At restore, both parts must agree with current authored content. A stale or missing rich value cannot unlock a checkpoint based on guessed correctness.

The existing Spot the Mistake and Fill in the Blank formats continue to accept older numeric-only attempts, reconstructing their `option-N` identifiers.

## Authoring

Keep the existing `LessonQuestion` identity, paragraph checkpoint, `answers`, `correctIndex`, explanation, sources and difficulty. Add exactly one `presentation` object for a nonstandard interaction. The legacy choice answer must remain a meaningful standalone question: `answers` and `correctIndex` are still the fallback visible in older weekly review and provide the numeric compatibility score. Do **not** use nonsensical placeholders purely to satisfy the numeric schema.

New typed presentations:

```typescript
// Ask about multiple independently correct statements.
presentation: { type: "multiple-select", correctIndices: [0, 2] }

// These item IDs must be stable across edits; each value is unique.
presentation: {
  type: "ordering",
  items: [
    { id: "mycenaean", label: "Μυκηναϊκή περίοδος" },
    { id: "geometric", label: "Γεωμετρική περίοδος" },
    { id: "classical", label: "Κλασική περίοδος" },
  ],
  correctOrder: ["mycenaean", "geometric", "classical"],
}

// Unique left and right IDs; do not use displayed position as identity.
presentation: {
  type: "matching",
  pairs: [
    { leftId: "assembly", leftLabel: "Εκκλησία του Δήμου",
      rightId: "citizens", rightLabel: "Συνέλευση πολιτών" },
    { leftId: "council", leftLabel: "Βουλή",
      rightId: "prepares", rightLabel: "Προετοιμασία υποθέσεων" },
  ],
}
```

Spot the Mistake continues to use `{ type: "spot-the-mistake", correction: "…" }`. Fill in the Blank continues to use `{ type: "fill-in-the-blank", before: "…", after: "…" }`.

Avoid changing an existing question's meaning merely to switch formats. For an editorially different objective, use the existing changed-quiz policy; do not claim compatibility with older quiz fingerprints.

## Stale progress and backwards compatibility

- All existing completed lesson IDs, immutable activity events, reward ledger entries, historical XP and bookmarks stay unchanged.
- A changed presentation changes the editorial `quizFingerprint`, so incompatible **in-progress attempts for that lesson** may be dropped from active resume. This prevents old single-choice answers from being silently treated as multi-part answers; it does **not** delete completed-history records.
- The numeric slot is only a score/weekly-review projection. For rich formats, the original selected set/order/mapping is held in `typedCheckpointAnswers`. Never reconstruct a rich answer from a numeric slot.
- The older weekly mistake review still uses the canonical multiple-choice question wording/options. Before publishing new types in a lesson, verify the fallback is pedagogically equivalent; full typed weekly-review playback is separate follow-up work.
- Older installed clients do not understand the new typed sidecar and may discard it when rewriting synchronized progress. Keep rollout gated until supported app versions are in use, or migrate/version the sync protocol before broad release.
- A **development-only, local-state article pilot** is accessible from Daily Quiz → "Δοκίμασε τα νέα είδη ερωτήσεων (dev)" → "Δοκίμασε τα νέα είδη μέσα σε άρθρο (dev)". It uses a temporary copy of the Ancient Athens article with Multiple Select, Ordering and Matching checkpoints, without writing `LearningStore` progress/XP/completion or enabling reports for synthetic content. The production catalogue is unchanged. This is for Android/iOS reader QA only; do not publish these synthetic questions as editorial content.

## Checks

```bash
npm run typecheck
npm run test:typed-lesson-integration
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-editorial-compatibility.cjs
npm run test:question-types
npm run validate:content
```

Then on Android/iOS: unconfirmed answer has no reward or unlock; correct and incorrect confirmations; relaunch and resume after each format; two-account isolation; guest import and cloud sync; repeated confirm does not duplicate XP/sound; previous completed lessons still display; changed-quiz resume safe; no layout clipping at larger reader font sizes.

Keep this branch separate from `main` and from published Ancient Greece lesson edits until all checks are documented.
