# Gnosi — Ancient Greece Phase 2, batch 2: Lessons 3 and 4

**Date:** 2026-11-03. **Branch:** `content/curriculum-v1`. **Editorial state:** Integrated, pending local Node/Expo and final historical proofread — **not Validated / Approved**.

## Editorial scope

**Lesson 3:** `greek-history-through-evidence` — «Τι μπορεί να αποδείξει ένα σπασμένο αγγείο;». Keep the title and 18 paragraph IDs, 5 sections and questions after 5/10/16. Intro now explicitly notes that Broneer's attribution of the c. 190 Themistocles ostraka to 14 hands is disputed. A shorter conclusion and a clarified description of Thucydides' reconstructed speeches avoid presenting interpretations as direct evidence. The Plangon stele is a commemorative representation, not the child's preserved personal voice. This lesson applies source criticism, distinct from lesson 1's daily-life archaeology.

**Lesson 4:** `greek-chronology` — «Από τα ανάκτορα στις πόλεις: οι εποχές της αρχαίας Ελλάδας». Keep the timeline title, 22 anchored paragraphs, 5 sections and questions after 5/11/17/20. Tone down an overly subjective phrase about Linear B; replace an ungrounded comparison with modern state lifespans; make the final sequence read more naturally. Dates are broad scholarly conventions, not a claim of simultaneous cultural change across Greece. Do not duplicate the specialist Minoan, Mycenaean, Linear B or polis chapters.

## Research spot-check — what was actually examined

- [Bryn Mawr Classical Review (2011), *Literacy and Democracy in Fifth-Century Athens* review](https://bmcr.brynmawr.edu/2011/2011.11.02/): full accessible review excerpt; documents Missiou's challenge to attribution of 191 ostraka to fourteen hands. This is a book **review**, not independent access to the full monograph. [Open University's teaching notes](https://www.open.edu/openlearn/mod/oucontent/view.php?id=114240&section=9.1) summarize the earlier handwriting interpretation. Do **not** claim to identify the actual writers or the exact vote count.
- [Perseus / Tufts, Thucydides 1.22 translation and Greek](https://beta.perseus.tufts.edu/urn:cts:greekLit:tlg0003.tlg001.perseus-eng6/chapter:1.22/): directly inspected. The author distinguishes competing eyewitness accounts and the difficulty of reproducing speeches word for word. No invented verbatim speeches in this article.
- [The Met, *Ancient Greece, 1000 B.C.–1 A.D.*](https://www.metmuseum.org/toah/ht/04/eusb.html): directly inspected chronology page; uses Geometric ca. 900–700, Archaic ca. 700–480, Classical ca. 480–323 and Hellenistic ca. 323–31 BCE. Dating categories vary by scholarly convention; do not imply calendar-date certainty for any local community.
- [Plangon funerary stele, Commons object metadata](https://commons.wikimedia.org/wiki/File:Funerary_stele_of_Plangon_(inscription_%CE%A1%CE%9B%CE%91N%CE%93%CE%A9%CE%9D).jpg): photo metadata dated ca. 310 BCE. Rights, image delivery, museum identification and attribution from pre-existing research dossiers remain pending independent release checks.

**Access limits:** No paywalled monograph was read in full, no unpublished archaeological dossier inspected, and no live native app/device verification took place here. Earlier research dossiers remain available. The spot-check is not a general factual warranty.

## Quiz review and new interactions

The **published version-2 keys for lesson 3 were incorrect in all three slots** compared with their question wording and explanations: prior `[2,1,3]` should have indicated `[0,2,1]` for the old v2 answers. Lesson 4's fourth v2 key was also wrong: stored `2` rather than intended `0`. We do not silently replace these historical answer meanings: v2 is frozen in `scripts/fixtures/ancient-greece-pair-3-4-before-phase2-20261103.json`, and both lesson quizzes are now **version 3**. No `compatibleQuizKeys` aliases are added.

- **Lesson 3**: [ordering the steps of historical inference; spot the false statement about Thucydides; matching types of evidence to what they can establish]. Correct numeric fallback slots `[2,1,2]`.
- **Lesson 4**: [spot the false statement about uniform political change in Crete; selectable fill-in about life after palatial archives; chronological ordering of four periods; single-choice question about the meaning of the 323 BCE boundary]. Correct numeric slots `[2,0,0,0]`.

Typed ordering/matching answers are saved through the existing `typedCheckpointAnswers` sidecar and also projected into the existing **numeric answer fallback for XP and weekly mistake review**. The numeric fallback is a meaningful independent single-choice question, not a placeholder; old completion IDs, events, XP, bookmarks and synced records remain immutable. Changed in-progress v2 quiz answers may be discarded rather than reinterpreted; the old historical activity is not destroyed. No code changes to reader, stores, audio, Supabase, visuals, media or path order are part of this batch.

**Known rollout caution:** Older app binaries unaware of `typedCheckpointAnswers` can discard those richer drafts when rewriting synced progress. Hold broad releases until compatible app versions or a sync-versioned migration are adopted.

## Validation

**Source-level only:** stable IDs/paragraphs/sections/media/checkpoints inspected; authored typed formats validated against documented current contracts and updated Node test sources staged. Not executed here: npm/typecheck, actual Node suites, Android/iOS, Supabase live account sync or audio playback.

Execute:
```bash
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-3-4.cjs
node scripts/test-greek-intro-redesign.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
node scripts/test-answer-sound-route.cjs
```

Device checks: render all four typed styles, confirm-only scoring, wrong/correct audio on first answer, progress after checkpoints 5/10/16 and 5/11/17/20, restart during a matching/ordering checkpoint, offline reload and Supabase sync, old completed/saved lessons, no reward duplication, weekly-review fallback, large-font line wrapping and source/media credits. Do not promote either lesson above Integrated until this is independently documented.
