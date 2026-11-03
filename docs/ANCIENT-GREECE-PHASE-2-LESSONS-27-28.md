# Gnosi — Ancient Greece Phase 2 Lessons 27–28: Sculpture and Philosophy

**Date:** 2026-11-03. Branch `content/curriculum-v1`. Both lessons **Integrated, not Validated or Approved**. User reports the local tests for lessons 25–26 passed; local and device QA for 27–28 remain outstanding. No merge to main.

## Lesson 27 — `greek-images-sculpture`

**Existing title:** «Τι έβλεπαν μπροστά σε ένα αρχαίο άγαλμα;». Existing 28 paragraph IDs, six anchored questions at **5/10/14/19/24/28**, image source/credits (Peplos Kore, Riace bronze, painted funerary stele), sections and six original question IDs are preserved.

The new introduction and targeted edits to `images-03`, `images-05`, `images-11`, `images-17`, `images-21`, `images-24` distinguish **observed red underpainting from original brown hair**, an uncertain interpretation of the Kore as Artemis, present-day patina from bronze's original appearance, painted stele photos from laboratory characterisation, the localized discovery of Egyptian blue from hypothetical complete color, and scientific reconstruction from observation. Other content is preserved.

**Evidence / research access**
- [Acropolis Museum, Peplos Kore, Acr. 679](https://www.theacropolismuseum.gr/en/node/22292): direct full accessible museum object record. Explicitly states red hair is undercoat for brown and documents missing metal attachments; possible deity identity remains a *hypothesis*.
- [Acropolis Museum “Archaic Colors” information](https://www.theacropolismuseum.gr/sites/default/files/2020-02/B_side%20engl.pdf): public PDF summary; no unsupported laboratory specifics inferred beyond directly visible text.
- [Metropolitan Museum, Colette and Seán Hemingway, bronze statuary technique](https://www.metmuseum.org/ko/essays/the-technique-of-bronze-statuary-in-ancient-greece): full museum essay on lost-wax, hollow casting, joins and inlays; it notes reuse/remelting.
- [Verri et al., *Antiquity* 2023, Parthenon polychromy](https://www.cambridge.org/core/journals/antiquity/article/goddess-new-clothes-the-carving-and-polychromy-of-the-parthenon-sculptures/9D7277925E339AC98642081CBAAD8794): published open scholarly article identifies Egyptian blue at **measured locations** on select pieces. It does not establish the complete original scheme for every statue.
- Existing research ledger `docs/greek-images-sculpture-research.md` carries fuller bibliography and image rights. This batch has not rechecked live Commons download response or licences on Android/iOS. Some academic article pages are represented by public abstract only, not falsely claimed full access.

**Quiz:** six questions v2, old IDs and numerical fallback `[1,2,0,3,2,2]` **unchanged**, formats **Spot → Matching → Matching → Fill in the Blank → Spot → Multiple Choice**. Distinguish observed pigment vs final color, labour phases/anonymous contributors, cast components, epitaph/base provenance, one localized pigment detection vs uniform blue, and Roman marble replica vs lost Greek bronze.

## Lesson 28 — `greek-philosophy-in-context`

**Existing title:** «Πού γινόταν η φιλοσοφία;». All 30 paragraph IDs, seven checkpoints at **4/8/12/16/20/25/30**, seven question IDs, two credited inline images and original sources retained. The new opening poses literary scene versus educational access, and targeted edits to `phil-01`, `phil-05`, `phil-10`, `phil-13`, `phil-16`, `phil-18`, `phil-23`, `phil-27`, `phil-29` clarify:
- Plato's *Protagoras* is literary drama, not a verbatim teaching roster; sophists were varied thinkers and professional teachers, not one standardized school.
- Derveni's **surviving fourth-century papyrus** must not be confused with the original composition date of its text.
- Plato's and Xenophon's Socrates and Aristophanes' caricature are **incompatible genres**, with no surviving Socratic autograph.
- Academy/Lyceum were preexisting physical locales as well as later intellectual associations, not universities with diplomas.
- A critique of writing in Plato's *Phaedrus* occurs within a written dialogue and is not a ban on books.
- Aristotle's systematic zoology must be distinguished from verified modern experiments.
- Diotima as a dramatic character is not independent proof of historical existence; surviving textual tradition is selective.

**Evidence / research access**
- [SEP, “The Sophists”](https://plato.stanford.edu/entries/sophists/), open entry on varied paid professional teachers, the literary lens of Plato and uneven access.
- [SEP, “Socrates”](https://plato.stanford.edu/entries/socrates/), open article describing the Socratic problem and differences of Plato, Xenophon and Aristophanes.
- [SEP, “Aristotle's Biology”](https://plato.stanford.edu/entries/aristotle-biology/), open scholarly reference on method and limitations.
- [Hellenic Heritage, Lyceum](https://www.hh.gr/en/destinations/aristotle-lyceum/), archaeology for place and later structures rather than reconstructed exact classroom.
- [Plato, *Phaedrus*](https://adfonteslibrary.org/work-plato-phaedrus), publicly available ancient text. Dialogue's position is not directly a transcription of real teaching.
- Restricted Oxford entries on the Academy, women thinkers, Derveni are not represented as fully read; use publicly available extracts only. Original source list unchanged.

**Quiz:** seven v2 questions, original IDs and numeric fallbacks `[0,1,2,2,1,2,3]` unchanged; **Spot → Ordering → Matching → Fill → Matching → Spot → Multiple Choice**. Includes evidence genres, relative chronology of thinkers, papyrus and later doxography, academy anachronisms, writing, empirical claims and missing voices.

## Compatibility
- Frozen exact version-1 questions at `scripts/fixtures/ancient-greece-pair-27-28-before-phase2-20261103.json`; no aliases of incompatible old fingerprints.
- Keep same lesson IDs, paragraph IDs, checkpoint anchors, question IDs, source/cover/inline media records, order #27/28, and accumulated completed XP/bookmarks/answers/reviews. The first question for each is Spot the Mistake, so current-fingerprint numeric restore is supported; matching/ordering persist typed sidecar with versioned question information. No production quiz/XP/audio/Supabase changes.
- Old incomplete attempts with obsolete quiz fingerprints are isolated rather than attached to new meanings. No new standalone identity or XP storage IDs.

## Verification
**Done:** repository branch/path confirmation, accessible museum/SEP reference check, staged source ID/format compatibility check and JS regression syntax. **Not done:** Node/npm typecheck and content validation, local new test execution, native iOS/Android confirmations or sound, color/media license URL delivery, zoom and source interactions, offline resumes, Supabase sync/account isolation and historian final approval.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-27-28.cjs
node scripts/test-greek-images-sculpture.cjs
node scripts/test-greek-philosophy-in-context.cjs
node scripts/test-ancient-greece-phase2-25-26.cjs
node scripts/test-ancient-greece-phase2-23-24.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Next lesson pair by real 30-slot path is #29 `greek-science-knowledge` and #30 `antikythera-gears`. Lesson 30's prior editorial provenance and fingerprint compatibility must be separately inspected. Both remain Integrated pending QA, `main` untouched.
