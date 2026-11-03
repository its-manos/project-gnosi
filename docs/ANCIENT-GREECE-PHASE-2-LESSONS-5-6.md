# Gnosi — Phase 2, Ancient Greece Lessons 5–6

**Date:** 2026-11-03. **Repository:** `its-manos/project-gnosi`. **Branch:** `content/curriculum-v1`. **State:** research-first **Integrated**, not yet Validated or Approved.

## Editorial review

**5/30 — `greek-geography-seas`: «Βουνά, όρμοι και άνεμοι: οι δρόμοι του αρχαίου Αιγαίου».** Kept title, 18 stable paragraph IDs, four original checkpoint anchors after paragraphs 4/9/13/17, five existing sources, and existing credited media. Reframed opening as a real navigational problem on the difficult western coastline of Samos in the seventh–sixth centuries BCE. Shortened the wind/seasonality explanation and corrected «στο χάρτη» to «στον χάρτη». No speculative exact travel times or observed cargo routes introduced.

**6/30 — `aegean-bronze-age`: «Σπίτια, εργαστήρια και δίκτυα: το Αιγαίο της Εποχής του Χαλκού».** Kept title, 19 stable paragraphs, original four checkpoints after paragraphs 5/10/15/18, existing media and bibliography. More engaging opening with spindle whorl, bronze craft and sealing evidence; replaced a misleading 'ancient passports' analogy with a precise explanation of regional archaeological period labels. Clarified what Lerna sealings actually show and tightened the description of unnamed production workers. Unlike Lesson 5 (transport geography), this lesson focuses on material production and social organization before the palaces.

## Historical cross-check and source limits

- Michael Loy, *The Coastal Landscape of West Samos in the Seventh and Sixth Centuries BCE: Possible Landing Points and Routes* (2024): [Cambridge open accepted manuscript and abstract](https://www.repository.cam.ac.uk/items/a77d566a-8db2-4ac8-9575-c63b3ee2a79d), [journal article](https://doi.org/10.1080/00253359.2024.2331910). Geography and seasonal sailing possibilities, **not documented individual journeys**. The coastline was linked to networks despite hazardous north/west winds and scarce landing areas. Research assumes and tests plausible route conditions; it does not certify exact ships or fixed schedules.
- Oded Tammuz, *Mare clausum? Sailing Seasons in the Mediterranean in Early Antiquity* (2005), [published abstract](https://doi.org/10.1080/09518960500481024). Winter navigation practices differ by route; do not assert total year-round Mediterranean closure. No inaccessible full article presumed read.
- [Ephorate of Antiquities of Argolida — Lerna, House of Tiles](https://www.argolisculture.gr/en/list-of-monuments/archaeological-site-of-lerna-house-of-tiles-stone-enclosure/): over 150 clay sealings bearing about 60 seal impressions. Evidence of storage/central organization, but no identity for a particular ruler established by the sealings alone.
- [British School at Athens — Cambridge Keros Project 2007](https://digital.bsa.ac.uk/fieldwork.php?project=1999) documents workshop and non-local Naxos building stone at Dhaskalio; interpretation of authority remains limited.
- [Museum of Cycladic Art — Raw materials](https://cycladic.gr/en/essay/ylika-tou-kykladikoy-politimoy/), [archaeology of the Cyclades](https://cycladic.gr/en/essay/i-arxaiologia-ton-kykladon-tin-proimi-epoxi-tou-xalkoy/) corroborate regional metallurgical evidence and longstanding obsidian circulation. The site's broader interpretive narrative is not proof of identity of individual Bronze Age travelers.

Earlier research dossiers `greek-geography-seas-research.md` and `aegean-bronze-age-research.md` retain credits and research details. No exhaustive individual source license/URL check or native media delivery audit occurred during this phase.

## Quiz redesign and compatibility

Previous Lesson 5 v2 correct slots `[2,1,3,2]` contain one demonstrable incorrect answer in slot 4: the description of navigation and maintained contact supports option 0, not 2. Lesson 6 v1 correct slots `[1,2,0,3]` were consistent with their explanations, but the questions have been reauthored to better test inference. Frozen original questions at `scripts/fixtures/ancient-greece-pair-5-6-before-phase2-20261103.json`.

| Lesson | Checkpoints in order | Version | Numeric fallback keys |
| --- | --- | --- | --- |
| 5 | ordering cargo transfer → spot the mistake about tailwind and return → matching evidence with warranted inferences → single-choice on western Samos networks | 3 | `[2,1,3,0]` |
| 6 | spot the mistake about archaeological labels → matching sites with archaeological finds → single-choice about Melian obsidian → fill in the blank about selective archives | 2 | `[2,1,0,0]` |

All legacy fallbacks are independently meaningful questions; typed prompts use the same canonical question text. No misleading multiple-select question was inserted solely for variety, since the existing weekly review still needs a **single defensible correct answer**. Every new typed correct solution projects to the old numeric XP/score contract; the full ordering or matching answer is kept in `typedCheckpointAnswers`.

Stable lesson IDs, question IDs, paragraph IDs, checkpoints, sources, images, sync schema, XP and sound host are unchanged. As quiz fingerprints have changed, previous unfinished attempts may be discarded safely rather than reinterpreted. Completed IDs, history, reward ledger and bookmarks stay intact. Do not add aliases to previous incompatible quiz versions. An older installed app that rewrites a synced attempt without the typed sidecar remains a rollout limitation.

## Validation

Connector-side source preflight and JavaScript test syntax do **not** establish npm, Android/iOS or Supabase passes. Lessons 5–6 remain **Integrated, not Validated/Approved** until the user's independent tests and phone QA.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-5-6.cjs
node scripts/test-greek-intro-redesign.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

On phone: narrow width, large font, reorder/match interactions, confirmation before XP/sound/unlock, correct/wrong audio first submission, replay/no duplicate rewards, save/restart after a typed checkpoint, offline/sync across accounts, legacy completion, media zoom/captions and weekly mistake fallback.

**Next in path:** Lessons 7–8, Minoan Crete and Mycenaean palaces, only after new batch QA is separately recorded.
