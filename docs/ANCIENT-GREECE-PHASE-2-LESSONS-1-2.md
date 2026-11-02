# Ancient Greece — Phase 2 / Lessons 1–2 editorial and question-format pilot

**Branch:** `content/curriculum-v1` • **Date:** 2026-11-02 • **Status:** research-first Integrated; **not** Validated or Approved.
**Scope:** `ancient-athens` and `greek-world-not-a-country`. Titles retained, paragraphs selectively polished, questions revised and reader pilot adapted for two new single-choice formats. Do not merge to `main` before local/device QA.

## Titles and narrative

**#1 «Η Αθήνα πίσω από τον Παρθενώνα».** Keep. It matches the documented household archaeological case instead of promising a complete general history of Athens. The opening separates monuments from ordinary material culture and introduces chronology. Three targeted Greek edits: replace a didactic exclamation about the workshop with a concrete observation about successive uses; clarify that metics lacked citizen rights rather than speaking of an ambiguous «αθηναϊκή πολιτεία»; simplify the epistemic distinction between objects and hypotheses. The final paragraph still returns to the house and works as a thematic close.

**#2 «Έλληνες, αλλά όχι πάντα σύμμαχοι».** Keep. The first paragraph's Persian-Wars example is a concrete political tension, not a broad claim that speakers of Greek always belonged to one nation. The text progresses from political communities to dialects, mixed settlements, shared sanctuaries and the situated rhetoric of Herodotus. Replace the compressed statement about «συγγενικούς θεούς» with plain Greek about language and shared traditions; qualify the modern-citizenship comparison; and simplify the closing claim about diplomatic identity. Keep the later Persian Wars lesson responsible for military chronology and the settlements lesson for colonization.

**Cross-lesson relationship.** #1 teaches material evidence, stratigraphy and who is visible in the archaeological record; #2 shifts to political membership and diplomacy. The transition is appropriate and does not repeat examples unnecessarily. The reader should understand «πόλις» as a community with institutions, not modern nationality.

## Evidence spot-check and limits

- [Acropolis Museum — House Θ](https://www.emfc.gr/en/node/16452): foundation in late fifth century BCE, successive phases, andron and third-century basins, water installations and cautiously proposed laundry/workshop.
- [Herodotus 8.144 Greek text](https://folio2.furman.edu/dramaturg/Herodotus/pages/chunk_1007.html): Athenian appeal to shared Greek language, worship and customs occurs in diplomatic response to Sparta.
- [Herodotus 7.132 Greek text](https://folio2.furman.edu/dramaturg/Herodotus/pages/chunk_832.html): explicitly distinguishes Thespians and Plataeans from Thebans and other Boeotians in the passage.
- The existing research ledgers remain authoritative for other claims, credits and source access. This was a **targeted** verification, not a complete source-link, image-license, paywalled-publication or native-delivery audit.

## Question integrity and version safety

The prior #2 v2 quiz had **all three answer keys incorrect** relative to its written prompts and explanations:
1. Political dependence: actual answer option C (index **2**) but stored index **1**.
2. Herodotus and the «ελληνικόν»: actual answer option A (index **0**) but stored index **2**.
3. Boeotian differing alignments: actual answer option D (index **3**) but stored index **0**.

Both lessons now use three version-3 questions with stable question IDs and unchanged checkpoint anchors. Lesson #1 has [selectable fill-in, improved single-choice, spot-the-mistake]; Lesson #2 has [spot-the-mistake, improved single-choice, selectable fill-in]. Correct indices are [0,3,2] and [1,0,0] respectively. Exactly one answer is defensible per item; spot-the-mistake displays a topic and four full claims, while fill-in displays a sentence and four selectable phrases without free typing.

The reader converts `option-N` chosen on either specialized card back into the **existing numeric checkpoint answer index**. That preserves current storage, scoring, sounds, combo/XP, history and synchronization contracts. Only these two single-choice formats can use this bridge; **multiple-select, ordering and matching** need a separate typed persistence and reader migration before appearing in live lessons. The fingerprint now includes a question's optional presentation metadata while leaving historical multiple-choice fingerprints unchanged.

Previous quiz fingerprints must **not** be declared compatible with these meaningfully changed questions. The old v2 questions are frozen in `scripts/fixtures/ancient-greece-pair-before-phase2-20261102.json`. Completed IDs, bookmarks, existing historical XP and activity events remain unchanged; unfinished v2 attempts are not reused as v3. No schema, lesson ID, media, paragraph ID, path order, sound implementation or Supabase change.

## QA and acceptance checklist

**Connector-side only:** verified edited source shape, unchanged 15-paragraph counts and existing checkpoints, distinct answers, frozen historical keys, and no main-branch changes. This does not count as TypeScript/Node/native verification.

Execute:
```bash
npm run typecheck
npm run validate:content
node scripts/test-ancient-greece-phase2-pair.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-greek-intro-redesign.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-xp-rewards.cjs
node scripts/test-answer-sound-route.cjs
node scripts/test-automatic-sync.cjs
```

On Android and iOS: verify both new card layouts (including narrow devices and large font), correct/wrong sounds on first answer, feedback, progress, resume, marks/completion/XP, weekly review, source reporting, previously completed lessons, stale old attempts, offline restart and account isolation. Promote status only after separately documented tests and editorial approval.
