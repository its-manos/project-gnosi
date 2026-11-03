# Gnosi — Ancient Greece Phase 2, Lessons 25–26: Hellenistic cities and ancient theatre

**Date:** 2026-11-03 · Branch `content/curriculum-v1` · **Integrated, not Validated/Approved**. The user confirms the automated local suite for lessons 23–24 passed; those lessons are *not* automatically device-validated.

## Path numbering: resolved against the actual 30-slot list

The source branch has #25 `hellenistic-kingdoms-cities`, #26 `greek-stage-tragedy`, #27 `greek-images-sculpture`, #28 `greek-philosophy-in-context`, #29 `greek-science-knowledge` and #30 `antikythera-gears`. Earlier handoff wording that called theatre #25 and philosophy #26 reflected obsolete editorial planning; it is **not** the current app order. This batch edits *only* the real slots 25 and 26 and does **not** skip the Hellenistic kingdoms lesson.

## Lesson 25 — `hellenistic-kingdoms-cities`

Existing title unchanged: «Μετά τον Αλέξανδρο: ποιος όριζε τη ζωή μιας πόλης;». **29 paragraph IDs**, six checkpoints after **5/10/15/20/25/29**, six original question IDs, existing references, sources, cover and two attributed inline images remain stable.

The new opening compares a *third-century* Zenon archive tax record to the *208/7 BCE* Magnesia diplomatic dossier and specifically asks what different documents hide about social experience. Targeted text updates in paragraphs 02, 07, 09, 16, 19, 27 and 29 clarify:
- the division into dynasties was not fixed in 323 BCE;
- Magnesia used embassies to several power centres and selected favourable documents for public display;
- a museum photograph / object label does not allow us to invent the exact unpaid tax sum or each debtor's opinion;
- the later Greek/demotic papyrus in Turin is **not** contemporary with the earlier Zenon archive and bilingual practice is not evidence of universal equality;
- the Roman victory at Pydna in **168 BCE** ended the Antigonid monarchy's rule in Macedon, not all Hellenistic institutions or kingdoms overnight.

Source checks:
- [Royal Correspondence RC 31, Antiochos III to Magnesia, 208/7](https://www.attalus.org/docs/rc/s31.html): accessible English ancient letter, approving Artemision games and offering cooperation.
- [RC 34, Attalos I to Magnesia, 208/7](https://attalus.org/docs/rc/s34.html): king recognises games and mentions contribution and communication with cities under his influence. Final lines damaged; **no asserted fulfilment of payments**.
- [Attic Inscriptions Online, IG II³ 1 1170 / I Magnesia 37](https://atticinscriptions.com/inscription/IMagnesia/37): accessible full translation and commentary of the **Athenian decree**; actual copy inscribed on a Magnesian portico wall and original Athenian phrasing not fully certain.
- Earlier bibliography for papyri, economy and bilingual archive retains separate museum-provenance restrictions. Academic chapter abstracts don't stand in for full restricted books. This pass did not claim remote image URLs or licences were revalidated on phones.

Original six question IDs now **v2**; numeric indices **unchanged `[1,0,2,3,0,1]`**. Formats Spot → Matching → Ordering → Fill in the Blank → Matching → Multiple Choice. Questions distinguish 323 dynastic hindsight, Magnesia's letters and display, a process of local embassy requests and answers, what a tax entry does *not* prove, Greek and demotic writing systems, and source triangulation. The `readingMinutes` metadata changes from **9 to 10** to reflect the now **1,713-word** intro+paragraph body and the existing 190-word/minute calculation. Does not include quiz deliberation.

## Lesson 26 — `greek-stage-tragedy`

Existing title unchanged: «Το θέατρο ως δημόσια εμπειρία». **30 stable paragraph IDs**, seven checkpoint anchors **4/8/12/17/21/25/30**, seven question IDs, two in-article media (Lysicrates monument and Pronomos vase), cover, existing source/attribution records and chapter placement preserved. Updated the opening and paragraphs 04, 09, 12, 14, 16, 24 and 29:
- the City Dionysia were a civic-religious competition, not a single government-authored statement;
- judges, rather than a general-population vote, decided prizes; dedications don't measure all audience reactions;
- chorus was singing/movement and the surviving words aren't recorded sound or full choreography;
- Pronomos vessel is an art object around 400 BCE, not a backstage photo;
- the extant stone Theatre of Dionysus is largely later in form than Aeschylus' fifth-century productions;
- evidence for women's actual attendance is disputed; male performers playing women says nothing certain about spectators;
- Aristotle's later `Poetics` cannot recover lost performance acoustics or every playwright.

Source checks:
- [Cambridge, David Wiles, *Tragedy in Athens*, chapter 2, public excerpt](https://www.cambridge.org/core/books/abs/tragedy-in-athens/theatre-of-dionysus/6E7374D8BAAF92826071EC6135013995): excavated early phases scant; original orchestra and auditorium reconstruction debated. Full paywalled chapter not claimed read.
- [Athens Official Guide, Theatre of Dionysus](https://www.thisisathens.org/antiquities/theatre-dionysus): dates extensive tiered stone seating from the fourth century; not a fifth-century photograph.
- [UNESCO Ancient Greek Theatres](https://whc.unesco.org/en/tentativelists/5869): archaeological description of later phases, but the site's generalized origin narrative is **not** a conclusive solution of the origins of tragedy.
- Prior scholarly research and original sources in `docs/greek-stage-tragedy-research.md` retained. Female attendance, performance space and judging remain qualified where evidence is incomplete.

Seven version-2 questions, **original numeric fallbacks unchanged `[2,0,3,1,2,3,1]`**. Formats Spot → Matching → Fill → Ordering → Matching → Spot → Multiple Choice. Covers public vs official statement, the archon/choregos/performer/judges, nonreducible music of chorus, fifth-century-to-later chronology, genre/source interpretation, audience uncertainty and survival bias.

## Compatibility and migration

- Frozen exact pre-edit version-1 questions at `scripts/fixtures/ancient-greece-pair-25-26-before-phase2-20261103.json`. No mapping of the new question fingerprints onto old incompatible answers.
- All lesson IDs, original question IDs, paragraph/checkpoint anchors, cover/in-article image URLs, captions, licences/credits and source arrays preserved. Existing completion, saved lesson IDs, XP, historical weekly wrong answers, question events and synchronization schema untouched.
- Both first questions use `spot-the-mistake` and can restore current-fingerprint numeric answers via the existing adapter; a stale/unknown quiz fingerprint is discarded safely while old completions/bookmarks remain. Matching/ordering questions use **versioned typed sidecar** responses and canonical numeric projections for XP/review without changing production game code.
- Only lesson data, editorial docs, frozen pre-edit snapshot and Node regression/dedicated test scripts changed. No UI/audio/XP/Supabase/release dependencies modified.

## Verification boundary

Completed in connector environment: checking live branch/path, published primary and scholarly excerpt sources, staged structural integrity, original answer positions, test-script JavaScript parsing and GitHub blob readback. **Not executed:** actual local npm TypeScript and content checks, new dedicated or combined Node contracts, Expo Android/iOS, first-answer sound/confirmation, image delivery/rights on device, logged-in cross-device sync, offline restarts or XP replay, independent Greek specialist proofread. Stay **Integrated**, not Validated or Approved until documented.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-25-26.cjs
node scripts/test-hellenistic-kingdoms-cities.cjs
node scripts/test-greek-stage-tragedy.cjs
node scripts/test-ancient-greece-phase2-23-24.cjs
node scripts/test-ancient-greece-phase2-21-22.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Device QA: all six and seven checkpoints, confirm-before-scoring and no mount/duplicate sound, typed matching/order wrong-answer and correct-answer restoration, text sizing, live credited images and zoom, old completion/XP history, replay cap and offline + authenticated Supabase/account isolation. New 10-minute Hellenistic reader estimate should render correctly.

**Next sequential pair:** #27 `greek-images-sculpture` and #28 `greek-philosophy-in-context`. No merge to `main` without explicit instruction.
