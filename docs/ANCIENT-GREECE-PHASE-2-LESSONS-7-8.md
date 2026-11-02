# Gnosi — Phase 2 / Ancient Greece 7–8: Minoan Crete and Mycenaean palaces

**Date:** 2026-11-03 · **Branch:** `content/curriculum-v1` · **Status:** Integrated pending Node + device QA, **not Validated / Approved**.

## Editorial scope

**Lesson 7 — `minoan-crete`**, «Πέρα από την Κνωσό: οι κόσμοι της μινωικής Κρήτης». Opening rewritten around a key question: why does today's Knossos look this way? The lesson still moves from the court and administration at Malia to workshop homes in Quartier Mu, Gournia's inhabited streets, the harbour setting at Zakros and the historical/modern layers of Knossos. **22 existing paragraph IDs, five sections, original 4/10/15/20 checkpoint anchors, image credits, sources and title unchanged.**

**Source-based factual corrections:** (1) the figurines known as Snake Goddesses were made of **painted faience**, not simply glazed clay, and were extensively restored; the [Heraklion Archaeological Museum object record](https://ca.heraklionmuseum.gr/ca/pawtucket/index.php/Detail/objects/408) specifies the restored sections. (2) the heavily restored entrance bastion criticised in the [Ashmolean reconstruction account](https://ashmolean.web.ox.ac.uk/article/rebuilding-the-palace-of-minos-at-knossos) is the **North Entrance Bastion** rather than a west entrance feature. (3) [École française d'Athènes on Quartier Mu](https://www.efa.gr/malia-le-quartier-mu-2/?lang=en) places the workshops roughly 300 m west of the palace, with major buildings and craft houses. These are targeted corrections, not a blanket validation of all old prose.

**Lesson 8 — `mycenaean-palaces`**, «Όσα μετρούσε το ανάκτορο: εξουσία και εργασία στη μυκηναϊκή Πύλο». Opening now starts with a clay tablet recording specific material movements; targeted wording edits avoid a full-inventory implication. Preserved the 25 paragraphs, five sections, 4/10/15/20/24 checkpoint positions, sources, captioned inline pictures and the title. The [Greek National Archaeological Museum-linked object description of PY Ub 1318](https://www.searchculture.gr/aggregator/edm/mnam/000150-463254?language=en) documents hide distributions to craftsmen. [Lisa M. Bendall's 2003 paper abstract](https://ajaonline.org/article/1363/) explicitly argues that the Northeastern Building was a storage/redistribution/administrative center, not simply a workshop. This remains a scholar's interpretation, not an independently reconstructed room-by-room workflow.

**Scope limits:** no new visual assets or source URL claims; no unsupported reconstruction of ruler identities, divine beliefs, travel itineraries, complete economies or social status from individual artifacts. Publisher abstracts and institutional object records were consulted openly; restricted complete papers were not treated as read. Preexisting image licenses and remote delivery have not been reverified on devices.

## Quiz design

All current lesson question IDs remain unchanged. V1 questions are frozen exactly in `scripts/fixtures/ancient-greece-pair-7-8-before-phase2-20261103.json`; the rewritten questions are **version 2**, with changed incompatible fingerprints and no aliases to historical v1 attempts. The old v1 keys were correct; this batch is a redesign, **not** a correction of earlier key errors.

| Lesson | Types in existing checkpoint order | Fallback correct indices |
| --- | --- | --- |
| #7 | matching (Minoan sites) → spot-the-mistake (unsupported island-wide rule) → multiple choice (town/work/harbour) → fill-in-the-blank (restoration versus original material) | `[2,2,1,0]` |
| #8 | fill-in-the-blank (PY Ub 1318) → ordering (archaeological/archival interpretation) → spot-the-mistake (wanax versus Homeric Nestor) → matching (record categories) → multiple choice (different mainland centres) | `[0,2,2,1,2]` |

All typed correct/wrong answers project to the canonical numeric fallback for existing XP and weekly-review bookkeeping. Ordering/matching draft values are restored from `typedCheckpointAnswers`; a numeric score alone cannot reconstruct them. Old completed lessons, bookmarks, XP/events and historical review events remain unchanged. Old v1 **unfinished answers may be cleared** on this edit to avoid misapplied answers. Older app clients without typed-sidecar handling must not overwrite current synced attempts during broader rollout.

## Validation

**Connector-side only:** cross-checked unchanged IDs, paragraph counts, titles, checkpoint positions, source arrays and source syntax; freeze original quizzes and stage dedicated Node regressions. This cannot establish runtime or device passes.

The user confirmed local checks for lessons **5–6** passed before this batch, but there is no independent report of Android/iOS native coverage. That report does not validate lessons 7–8.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-7-8.cjs
node scripts/test-minoan-crete.cjs
node scripts/test-mycenaean-palaces.cjs
node scripts/test-flexible-editorial.cjs
node scripts/test-ancient-greece-phase2-5-6.cjs
node scripts/test-greek-intro-redesign.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Android/iOS QA: open cover and inline source/caption/zoom; confirm layout with large Greek fonts; test all nine new checkpoints in both lessons, including a wrong answer, no XP before confirm, first-question audio, leave/restart during matching/ordering, offline revisit and account sync; verify no extra XP on replay, no old activity overwritten, and old weekly review displays meaningful single-choice fallback questions. Separate device verification is required before marking either lesson **Validated**.

**Next editorial pair:** #9 `linear-b-decipherment` and #10 `palace-collapse`; don't work on them before QA for these two has been reported.
