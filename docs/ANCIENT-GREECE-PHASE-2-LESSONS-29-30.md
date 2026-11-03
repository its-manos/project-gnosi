# Gnosi — Phase 2 Ancient Greece lessons 29–30: Ancient inquiry / Antikythera Mechanism

**Date:** 2026-11-03 · **Repository:** `its-manos/project-gnosi` · **Branch:** `content/curriculum-v1` · **Editorial state:** **Integrated, NOT Validated or Approved**. `main`, production quiz/audio/XP/navigation/Supabase code and old completions are deliberately unchanged.

## Position in live path
#29 `greek-science-knowledge`, «Πώς ήξεραν ότι είχαν δίκιο;», then #30 `antikythera-gears`, «Μια μηχανή που υπολόγιζε τον ουρανό». The full Ancient Greece path remains **30 lessons in stable order**, ending after #30. Existing separate older editorial plans' indices are not authoritative.

## #29 — Greek science / the limits of knowledge

**Identity:** original 24 paragraph IDs, four sections, all six questions and anchors **4/6/12/16/18/24**, media and images after `science-09`/`science-14`, source URLs, credits, difficulty and canonical numeric correct answer indices **`[0,2,1,3,1,2]` unchanged**. Original six v1 questions are frozen exactly in the before-Phase-2 fixture.

The revised opening poses an epistemological problem rather than a parade of famous scientists: the unknown author of *On the Sacred Disease* critically describes epilepsy while erroneously arguing for phlegm. Other precise textual changes:
- `science-06`: the many *Hippocratic* texts cannot be assigned automatically to one author or system.
- `science-09`: the Oxyrhynchus Euclid papyrus is a later copy; public catalogues disagree on its exact date. Do not present a precise single century as independently settled.
- `science-15`: Babylonian observations and numbers could be reused in different Greek-language astronomical purposes without assuming identical cosmologies or a one-way cultural miracle.
- `science-17`: an accurate apparent planetary position does not confirm the entire geocentric physical picture. Ptolemy is correctly placed in the 2nd century **CE**, not Classical Greece.
- `science-20`: Cleomedes' **250,000 stades** and the other ancient **252,000 stades** tradition both need source and unit evaluation.
- `science-24`: close by returning to what observation can support, what was explained and what would count against a theory.

Sources and research-access scope:
- [Walshe, *On the Sacred Disease* (Oxford 2016, publicly accessible abstract)](https://academic.oup.com/book/24377/chapter-abstract/187290488): the author criticizes certain supernatural causation and ascribes seizures to humours; this is not modern epilepsy knowledge. **Abstract only**; complete restricted chapter not read.
- [History of epilepsy clinical concepts, open full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC7049807/): approximate author/date, phlegm and bile, and caveats; a retrospective medical history rather than an individual ancient clinical case record.
- [Clay Mathematics Institute, Euclid's Elements](https://www.claymath.org/online-resources/euclids-elements/): surviving textual editions, distinctions between proofs, diagrams and subsequent copying; not the autograph of Euclid.
- [Carman & Evans, *The Two Earths of Eratosthenes*, *Isis* 2015](https://www.journals.uchicago.edu/doi/full/10.1086/681034): **abstract publicly verified**, full paper access restricted. The 250,000/252,000 distinction is genuine and its simple rounding/revision explanations cannot be taken as known facts.
- [James Evans, University of Puget Sound lecture summary](https://www.pugetsound.edu/two-earths-eratosthenes): public explanation of the authors' interpretation and the limits of the familiar Cleomedes narrative.
- Babylonian, Rhind and Ptolemy research sources already in the existing research ledger and `sources` array; no claim to new full Akkadian tablet transcription or paywalled book access.

**Version-2 quiz:** six questions, **Spot → Matching → Ordering → Matching → Fill in the Blank → Multiple Choice**. Conceptual challenges: observation versus phlegm explanation; comparing heterogeneous Hippocratic authorship; hypothetical proof steps from assumptions to general proposition (pedagogical sequence, not a claim about Euclid's original drafting); diaries/tables/Greek geometric adaptation; prediction versus ontology; Eratosthenes number transmission. The canonical numeric fallback options were freshly checked for coherent correct/wrong meanings. `readingMinutes` remains **10**, including a conservative allowance for checkpoints.

## #30 — Antikythera / historical reconstruction

**Identity:** 27 original paragraphs, six sections, original six question IDs, anchors **4/9/14/19/24/27**, original media and credits after `antikythera-11`/`antikythera-25`, original bibliography, stable last-course position, six numeric correctIndices **`[2,1,1,3,0,2]` unchanged**. `readingMinutes=8` for **1437** whitespace-delimited narrative words after revision, excluding quiz time.

The original shipped quiz from the pre-research rewrite has fingerprint **`q_7ffb549e`** (historical fixture `scripts/fixtures/quiz-before-editorial-20261030.json`). The research-first question set immediately preceding this Phase 2 audit was **version 2**; its exact six original question objects are newly frozen in `scripts/fixtures/ancient-greece-pair-29-30-before-phase2-20261103.json`. The new typed quiz is **version 3** so it is not confused with either historical state. Old quiz-key aliases remain forbidden.

The opening and paragraphs `antikythera-02`, `antikythera-07`, `antikythera-17`, `antikythera-18`, `antikythera-27` were refined to keep *manufacture ≠ shipwreck* and *measured fragments ≠ proposed missing gearwork*. Chronology of experimental reconstruction is shown without claiming the 2021 front model or any 2026 alternative is a proven exact copy. The ending connects the whole 30-lesson journey to proof, observation, calculation and changing hypotheses.

Sources and research-access scope:
- [Antikythera Mechanism Research Project, *Nature* 2008 calendrical/eclipses paper](https://www.nature.com/articles/nature07130): published **abstract** states upper Metonic dial 19 years/235 months and lower Saros 223 months with eclipse glyphs. Some Nature full text may require institutional access; **no full article access claimed**.
- [Anastasiou et al., 2016 back dial and plate inscriptions, AMRP abstract](https://www.antikythera-mechanism.gr/bibliography/749): Metonic, Saros, three-sector Exeligmos and Games dial in the researchers' description. **Abstract**, not a new complete reading of original inscriptions.
- [Freeth et al. 2021, *Scientific Reports*, open full article](https://www.nature.com/articles/s41598-021-84310-w): the researchers themselves state the planetary reconstruction is **not a replica** because much of the physical evidence has disappeared. This full open paper and its author correction page are available.
- [Lin 2026, *Results in Engineering*, open abstract](https://www.sciencedirect.com/science/article/pii/S2590123025046766) and [Voulgaris et al. 2026, *Heritage*, open article/abstract](https://www.mdpi.com/2571-9408/9/3/95) give distinct **competing reconstruction proposals**. They do not settle every missing gear, the front calendar subdivisions or an exact common original layout.
- [AMRP 2016 *Inscriptions*, NYU institutional archive](https://archive.nyu.edu/handle/2451/71597) has an **August 9, 2026 corrigendum** to paper 6. The [one-page correction, read and visually checked](https://archive.nyu.edu/jspui/bitstream/2451/71597/11/IAM%206A%20Corrigendum%2020260809.pdf) concerns misprinted formulas for β and Δλ_STN for inferior/superior planets on pages 282–283, and explicitly states that **the numerical tables on pp. 283–284 were correctly calculated**. This is *not* a new correction to the dates of the shipwreck, 235-/223-month back dials or proof of a complete front-face mechanism. Do not use the superseded formulas from the original 2016 printing.
- [NYU Institute for the Study of the Ancient World introduction](https://isaw.nyu.edu/research/antikythera-mechanism) emphasizes the uncertainties of date, provenance and missing planetary gearing. Existing source and media ledger retained; commercial image rights and remote Android loading **not** rechecked.

**Version-3 quiz:** six stable IDs, **Spot → Matching → Fill in the Blank → Matching → Multiple Choice → Ordering**. Evidence tasks: shipwreck versus construction date; analogy of gear transmission and non-live sensors; Saros does *not* guarantee local eclipse visibility; directly measured fragments, CT, inscriptions and a conjectural full front must be ranked by evidence; complexity shows expert knowledge not universal everyday use; order **1900 wreck → 1902 gears → 2005 CT → 2021 proposal**.

## Compatibility and historical history
- All prior lesson/paragraph/question IDs, checkpoint position and media/source records are identical. No past completions, bookmarks, reviewed answers, earned XP, historical activity events or Supabase data were modified.
- New fingerprints separate *Science v1 → v2* and *Antikythera v2 → v3*, as well as Antikythera's older **shipped v1 `q_7ffb549e`**. **Never alias** old incompatible quiz slots to new meaning. The old Antikythera shipped history and its immutable events remain as historical records, not active mistake indices.
- Both first checkpoints are Spot the Mistake; only attempts with the new current fingerprint can restore numeric answers without a typed sidecar. Matching/Ordering require the exact versioned typed answer sidecar to restore; unversioned/numeric-only incomplete rich attempts are rejected, not guessed. Typed format metadata and canonical numeric shadows remain valid for weekly review and XP.
- Production quiz engine, confirmation, sounds, Supabase, XP, animations, lesson unlock and routing remain untouched. Final lesson still terminates the 30-slot path. No `main` merge.

## QA boundary
**Completed in assistant/connector environment:** remote branch/source inspection, open source review including the actual August 2026 correction page, stable paragraph and checkpoint audits, frozen prior quizzes, new typed/fallback consistency and JavaScript static parse. **Not run:** local `npm run typecheck`, `validate:content`, Node regressions, actual Expo Android/iOS, successful sound on first question and completion, image licences/downloads, remote + offline sync/backups, replay XP caps, human scholarly editorial signoff.

The user reported 27–28 tests passed **except** for a strict-equality-of-Set assertion in the Philosophy standalone test; that test-only assertion was patched in `cdc1615e`, but no subsequent local retest result was provided before the request to proceed. Do **not** mark #27–28 fully validated from this conversation.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1

npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio

node scripts/test-ancient-greece-phase2-29-30.cjs
node scripts/test-greek-science-knowledge.cjs
node scripts/test-antikythera-gears.cjs
node scripts/test-ancient-greece-phase2-27-28.cjs
node scripts/test-greek-philosophy-in-context.cjs
node scripts/test-ancient-greece-phase2-25-26.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs

npx expo start --clear
```

**Device QA:** run every checkpoint both right/wrong, confirmation before grading, sound once on accept and completion, no sound before submit, resumable Matching and Ordering after restart/offline, no duplicate XP or changed history, image zoom/credit on Android and iOS, cross-account and Supabase merges. Explicitly test complete and prior-incomplete Antikythera progress under both obsolete v1/v2 fingerprints and the new v3 fingerprint.

## Next phase after local QA
The **30-slot Ancient Greece path** is edited end-to-end under Phase 2, not automatically QA-approved. Next conduct an independent full-curriculum 1–30 audit for factual consistency, Greek clarity, repeated concepts, true difficulty, source access, copyright/image licences, typed screens, all historical fingerprints and a real signed-in device/release regression. Keep **Integrated** until each scope is verified and signed off, not a blanket change to Validated. Do not merge `main` without the user's request.
