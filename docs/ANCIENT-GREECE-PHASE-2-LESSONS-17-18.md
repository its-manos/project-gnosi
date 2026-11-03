# Gnosi — Phase 2 Ancient Greece lessons 17–18: Hoplites and Panhellenic sanctuaries

**Date:** 2026-11-03. **Branch:** `content/curriculum-v1`. **State:** Integrated, *not* Validated or Approved. No release or merge into `main`.

## Lesson 17 — `greek-war-hoplites`

**Existing title retained:** «Πίσω από την ασπίδα: οι οπλίτες των ελληνικών πόλεων». The introduction now stages the puzzle of disparate armour in a single museum display versus the unsupported conclusion of a standard panoply, phalanx or political reform. Sections, all **24 original paragraph IDs**, six anchors **4/8/12/16/20/24**, sources and photographed attributed images remain unchanged. Targeted improvements to paragraphs 05/11/14/21/24 clarify that shield hardware, formation, bodily pushing (*othismos*), and any downstream changes to political access must be evaluated as separate propositions. A mechanical reconstruction informs the debate but isn't a field report of seventh-century fighting.

Research-access scope:
- [Viggiano and van Wees, *Men of Bronze* (Princeton, 2013) publicly available abstract](https://academic.oup.com/princeton-scholarship-online/book/23988/chapter-abstract/185350181): distinctive double-grip round shield attested around **700 BCE**; whether adoption implies dense phalanx is debated. **Abstract only**, not entire restricted chapter.
- [Peter Krentz, *The Cambridge Companion to Archaic Greece* (Cambridge, chapter summary)](https://www.cambridge.org/core/books/abs/cambridge-companion-to-archaic-greece/warfare-and-hoplites/24015E0775DBF6E85244EB1EDB80044A): reconstructs the traditional “hoplite revolution” model and later critiques; no one dated object establishes democracy across all poleis. **Summary inspected**, not full restricted volume.
- [Hans van Wees, “Archaic Age” (Wiley, summary)](https://doi.org/10.1002/9781444350302.wbhe0127) documents varied bronze armour adoption and contested implications for phalanx formation.
- [Lanphier, *Greece & Rome* (2025)](https://www.cambridge.org/core/journals/greece-and-rome/article/bronze-hoplite-panoply-and-the-othismos-in-the-early-phalanx/D9FF97DD10E5D55E7B6DFB9E648AE774) offers contemporary mechanical modelling as a **theory-supporting interpretation**, not proof of a unique formation adopted everywhere.
- Original references on the Chigi olpe, Tyrtaeus and Xenophon preserved; their genres and relative dates must not be confused with contemporary battle diagrams.

Question versions move from 1 → **2**, original IDs preserved, fallback answer slots `[2,3,0,2,0,1]`:
1. Spot the mistake: museum juxtaposition doesn't establish common findspot/battle.
2. Matching: porpax, antilabe, spear, bronze survival → distinct justified inferences.
3. Fill in blank: art and poetry show group action but not precise military instructions.
4. Ordering: a **reasoning exercise** for terrain adaptation, not a claim about Xenophon's literal orders.
5. Multiple choice: equipment alone cannot infer a city's citizen franchise.
6. Matching: compare archaeological arms, images, poetry and institutional sources before claiming one sudden political and tactical revolution.

## Lesson 18 — `greek-sanctuaries-games`

**Existing title retained:** «Ολυμπία και Δελφοί: τόποι συνάντησης και ανταγωνισμού». Retains **24 original paragraphs**, six anchors **3/8/13/17/21/24**, all credited media, titles, source list and chapter path. Revised opening contrasts early Zeus altar offerings with visible Delphic civic dedications. Paragraph 05 distinguishes **776 BCE as later victory-list chronology**, not a surviving contemporary record of the absolute first games; paragraph 08 makes clear the Olympic truce protects festival access, not all hostilities; paragraph 11 treats Herodotus' oracles as **literary narratives**, not transcribed recordings; paragraph 20 clarifies Kyniska was **victorious owner, not chariot driver**. Last paragraph returns to shared worship and open rivalry without assuming one Greek government.

Research-access scope:
- [Hellenic Heritage, Olympia](https://www.hh.gr/en/destinations/ancient-olympia/), Ministry of Culture heritage material: early altar cult and later architecture; the major Zeus temple is **470–456 BCE**.
- [UNESCO Olympia](https://whc.unesco.org/en/list/517), periodisation of successive sanctuary structures; no conflation with an eighth-century fully built temple.
- [IOC spectator history by Paul Christesen](https://www.olympics.com/ioc/ancient-olympic-games/spectators): the ancient **ekecheiria did not stop all fighting**; even the sanctuary was involved in fighting in **364 BCE**. This narrower historical reading matters because some institutional accounts of the modern Olympic ideal use broader and potentially misleading truce rhetoric.
- [Oxford Handbook, “Globalization, Transnationalism and the Local”](https://academic.oup.com/edited-volume/43505/chapter/364128564) interprets the truce as forbidding armed entry into sacred territory and supporting safe passage.
- [Cambridge, “Oracular Tales before Historiography” (2023)](https://www.cambridge.org/core/books/abs/divination-and-prophecy-in-the-ancient-greek-world/oracular-tales-before-historiography/0C10C0ADFBED4CD5BAC8F86E5E892091) examines how Herodotus' oracles work within their surrounding narrative. **Publisher abstract/summary**, not full book chapter.
- Previous citations for Pythian competitions and Pausanias' late account of female Heraia runners retained; Kyniska's ownership victory is historically exceptional, not an assertion of general equal eligibility.

Question versions 1 → **2**, original IDs preserved, numeric keys `[0,1,1,3,3,1]`:
1. Fill in blank: altar offerings indicate cult before temple.
2. Spot the mistake: the truce did *not* stop every war.
3. Matching: Herodotus, architectural strata, votive inscriptions and Amphictyony, with source-specific limits.
4. Multiple choice: a dedication announces a particular public prestige claim, not an independent casualty census.
5. Matching: Pythian music/sports, Zeus' Olympics, Kyniska and retrospective Heraia evidence.
6. Multiple choice: joint cult sites enabled ongoing rivalry as well as encounter.

## Identity and compatibility contract

- Freeze the pre-Phase-2 lesson 17/18 version-1 question objects exactly in `scripts/fixtures/ancient-greece-pair-17-18-before-phase2-20261103.json`.
- Preserve lesson IDs, every section/paragraph ID, every question ID, six checkpoint locations each, source record/attribution and media order, stable subcategory slots **16 and 17** (zero-based), course unlock and navigation.
- No alias for the incompatible old quiz fingerprint. Old incomplete sessions with version-1 fingerprints may be safely discarded, preserving old completion IDs, saved lessons, prior XP and immutable score/review events.
- Matching/ordering typed responses persist in the versioned sidecar; canonical numerical answers remain meaningful fallback for existing XP and weekly choice-review UX. First question in #17 uses the existing spot-the-mistake and in #18 fill-in-the-blank, so legacy numeric-only first-question attempts are restorable **only** when they possess the new quiz fingerprint, unlike matching first checkpoints in the Athens pair.
- Production reader, quiz engine, audio host, rewards, login, Supabase synchronization and images are **untouched**. Old app binaries without typed sidecar persistence remain cross-client rollout risk.

## Verification boundaries

**Staged source checks / GitHub readback, local JavaScript syntax check:** included. **Unverified:** actual npm TypeScript/content validation, Node tests executing, native Android/iOS question sound and confirmation, media URL delivery and rights in production, logged-in Supabase/offline sessions, cross-version sync, final Greek proofreading. State stays **Integrated** without actual QA reports. User reported local Athens 15/16 regressions and dedicated fixtures passed immediately before this batch.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-17-18.cjs
node scripts/test-greek-war-hoplites.cjs
node scripts/test-greek-sanctuaries-games.cjs
node scripts/test-ancient-greece-phase2-15-16.cjs
node scripts/test-athens-who-voted.cjs
node scripts/test-athens-law-courts.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Android/iOS QA: confirm first/wrong/correct responses and no audio on draft; six checkpoint positions each; typed save/resume and offline restarts; prior lesson completion, XP, review and bookmark consistency; image captions and zoom; text scaling; signed-in cross-device/account isolation and sync. Don't promote to **Validated** until documented.

**Next pair**: #19 `persian-wars-greek-world` and #20 `athenian-empire` only after reported local QA.
