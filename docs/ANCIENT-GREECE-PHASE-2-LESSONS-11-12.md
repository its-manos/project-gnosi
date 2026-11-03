# Gnosi — Phase 2 / Ancient Greece 11–12: Geometric Greece and the Polis

**2026-11-03.** Branch `content/curriculum-v1`. Status **Integrated, awaiting QA**, not Validated/Approved. No change to `main` or to production reader, sound, XP, sync, or question engine.

## Lesson 11 — `geometric-greece`

**Title retained:** «Από τα αγγεία στα γράμματα: οι κοινότητες του Αιγαίου». Keep all **13 paragraph IDs** and four checkpoint positions **3/7/10/13**, credited media, sources, and lesson-path order. A narrative opening now starts with the unusual Lefkandi Toumba burial and the contrast with eighth-century inscribed vessels; it does not assume the deceased were named royalty or conflate different archaeological centuries. The Protogeometric pottery description is simplified; the Cypriot bronze cremation urn is clearly older than its reuse; Lefkandi's atypical architecture is not generalised to every village; the uncertain readings of early inscriptions remain uncertain.

**Research verification:** [British School at Athens, Lefkandi textile and Toumba](https://www.bsa.ac.uk/2019/01/24/lefkandi-textile-on-display-in-the-national-archaeological-museum/) documents the ca. 950 BCE 50 m building, two human burials, four horses, and the Cypriot vessel with a rare textile. The [National Archaeological Museum on the Lefkandi bronze krater](https://www.namuseum.gr/en/hidden_museum/the-urn-krater-of-the-lefkandi-lord/) documents Cypriot manufacture around 1100 BCE, later funerary reuse, and restoration. A museum label calling the man a 'lord' does not establish his formal political title in a known constitution. [Oxford *Closing the Gap*](https://doi.org/10.1093/oso/9780198908746.003.0005) distinguishes early inscribed vessels like the Dipylon inscription and Nestor's Cup from any proven date of alphabet invention. Published research and publicly available chapters were consulted; this isn't a full specialist audit of every source or date.

**Question version 2, numeric correct slots `[1,2,1,0]`:** ordering ceramic phases → matching Lefkandi discoveries to warranted claims → spot the mistake about a supposedly proven direct Cypriot voyage → fill-in-the-blank on earliest surviving alphabetic inscription versus first use. A meaningful single-choice fallback for each original stable question ID remains available for weekly mistakes review. Questions avoid implying that pottery chronology is a single political chronology.

## Lesson 12 — `rise-of-polis`

**Title retained:** «Πόλις: άνθρωποι, γη και κοινοί κανόνες». All **23 existing paragraph IDs**, five checkpoint positions **4/9/14/19/23**, original media and sources, and existing reading order preserved. Opening contrasts a written political rule at Dreros with coordinated public works at Zagora, without equating either with universal democracy. Text now qualifies the standard ten-year interpretation of the law of Dreros with the real alternative reading: limitations on continued post-term exercise of an office's functions. Architectural coordination does not establish the decision-making institution. The conclusion removes an abstract repeat.

**Research verification:** [Università degli Studi di Milano, Politeia: Dreros law](https://politeia.unimi.it/en/2024/02/09/gagarin-perlman-dr1-nomima-i-81-legge-di-dreros-sul-divieto-di-reiterazione-della-carica-di-kosmos-prima-di-dieci-anni-meta-vii-secolo-a-c-ca/) documents a mid-seventh-century BCE inscription, the usual ten-year interpretation, and scholarly alternatives; it also explains uncertainties about who ratified the measure and the meaning of penalties. [Zagora Archaeological Project: About Zagora](https://zagoraarchaeologicalproject.org/the-site/about-zagora/) confirms ninth/eighth century BCE houses, neighbourhoods, an impressive fortification wall, and an outdoor sanctuary. Neither material source proves a voting system.

**Question version 2, numeric correct slots `[2,1,3,0,2]`:** spot-the-mistake on the Dreros law versus universal voting → matching `ἄστυ`, `χώρα`, citizen and noncitizen resident → single choice on Zagora's common works and political uncertainty → fill-in-the-blank on Homeric poetry versus meeting minutes → single-choice synthesis on distinct ways political communities developed. Original question IDs all remain stable.

## Compatibility safeguards

- Original v1 questions frozen in `scripts/fixtures/ancient-greece-pair-11-12-before-phase2-20261103.json`. New v2 questions intentionally produce different fingerprints; old v1 unfinished attempts **cannot be mapped** to the updated meanings and must not be aliased.
- Stable lesson IDs, paragraph IDs, question IDs, checkpoint anchors, cited images and original historical completion IDs remain untouched. Historical XP, saved lesson records, mistake events and Supabase account records are not rewritten.
- `typedCheckpointAnswers` preserves rich ordering/matching values; canonical numeric projection drives current XP and conventional review cards. Existing confirmed-answer mechanics remain unchanged.
- Old app versions that don't know typed-answer sidecars remain an explicit release risk during cross-device rollout.

## QA / release gates

**Already done:** GitHub source/branch inspection, institutional and scholarly cross-checks, staged structural and JS syntax preflight; no local/npm/native command can be claimed as run remotely.

**Not yet done:** TypeScript, content validation, regression tests, real Android/iOS question/audio/confirm, image delivery/captions/zoom, account sync/offline, completion and XP duplicate-protection, editorial acceptance. Both lessons remain **Integrated**.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-11-12.cjs
node scripts/test-geometric-greece.cjs
node scripts/test-rise-of-polis.cjs
node scripts/test-ancient-greece-phase2-9-10.cjs
node scripts/test-flexible-editorial.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

**Native check:** 4+5 checkpoint placements; sound and confirm on first wrong and correct answer, no reward before confirm, matching/ordering persistence after leaving, correct XP/weekly review projection, previous completions and bookmarks, Android/iOS text sizes, source captions and image zoom, offline behavior and signed-in Supabase synchronization.

**Review status of lessons 9–10:** still Integrated, because no new passing test report was supplied before the request to proceed. Earlier lessons 1–8 have user-reported local test passes, not automatic native acceptance.

**Next Phase 2 batch:** lessons 13–14 (`greek-settlements-networks`, `sparta-society`), pending the user's test report for 11–12.
