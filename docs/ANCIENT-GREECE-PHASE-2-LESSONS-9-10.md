# Gnosi — Phase 2 Ancient Greece lessons 9–10: Linear B and palatial collapse

**Date:** 2026-11-03. **Branch:** `content/curriculum-v1`. **Status:** Integrated, awaiting npm + native QA; **not Validated / Approved**. No merge to `main`.

## Lesson 9 / 30 — `linear-b-decipherment`

**Title kept:** «Γραμμική Β: τα μοτίβα που αποκάλυψαν ελληνικά». Distinct from the previous Pylos-palace lesson: emphasizes scholarly method and independent verification. Revised intro opens with the independent Pylos tripod-tablet test rather than a general description of the process. Simplified the hypothetical Kober syllabic grid and clarified the distinction between sign reading, product ideograms and individual word interpretation. **21 original anchored paragraphs, section boundaries, source list, existing attributed images and checkpoints at 4/8/13/17/21 unchanged**.

Source checks:
- [Cambridge Faculty of Classics — decipherment introduction](https://www.classics.cam.ac.uk/research/projects/mycep/decipherment) attributes the 1952 breakthrough to Michael Ventris and subsequent work with John Chadwick, while recognising other scholars' essential foundations.
- [Cambridge research account (2012)](https://www.cam.ac.uk/research/news/cracking-the-code-the-decipherment-of-linear-b-60-years-on) describes Ventris's 1952 work and Alice Kober's contribution. Her discovery was systematic relationships among endings, **not** a completed translation.
- [John Chadwick, *The Decipherment and the Critics* (accessible publisher chapter summary)](https://www.cambridge.org/core/books/abs/decipherment-of-linear-b/decipherment-and-the-critics/02E5F5DE5204E1DBC5D591D9CD13D1F7): in May 1953 Carl Blegen tested the proposed sign values on 1952 Pylos tablets, reporting `ti-ri-po-de`, accompanying tripod imagery and counts; this was an **independent test** rather than source data that Ventris used for his initial hypothesis. No inaccessible whole book is claimed as read.

**Five rewritten questions, version 2:** spot-the-mistake on ideograms versus pronunciation → matching Bennett, Kober, grids and transcription → ordering the evidence/test method → fill-in the blank on PY Ta 641 independent confirmation → single-choice on decipherment limits. Numeric fallback `[2,0,2,0,0]`.

## Lesson 10 / 30 — `palace-collapse`

**Title kept:** «Το τέλος των μυκηναϊκών ανακτόρων δεν ήταν μία στιγμή». Reworked intro to contrast Pylos destruction with Tyrins postpalatial habitation. Edited the date-paragraph to describe the **scholarly chronology as a proposed reassessment**, without pretending the new date is established at exact calendar-year precision. The isotope passage explicitly states local climatic inference limits; the ending avoids repeating the same abstract conclusion. **27 original paragraphs, existing section names, sources, credited cover/inline media and checkpoints at 4/9/14/21/27 unchanged**.

Research checks:
- [Vitale, Stocker & Davis (2022), *Synchronizing the Destructions of the Mycenaean Palaces*](https://austriaca.at/?arp=0x003de486): publication abstract describes a proposal to assign the final Pylian destruction to the **very beginning of LH IIIC**, based on pottery assemblages. This is an interpretation within a debated regional chronology.
- [Finné et al. (2017), *PLOS ONE* full open article](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0189447): Mavri Trypa stalagmite suggests a dry phase decades before the palace fire, but **generally wetter conditions at the destruction**, followed by longer aridity. Isotopes do not identify arsonists, battle participants or an exact institutional cause.
- [Hinzen et al. (2018), HERACLES earthquake-hypothesis abstract](https://doi.org/10.1785/0120170348): no new convincing evidence supports a single damaging earthquake at Tiryns and Midea. The paper does not prove that **no** local earthquakes occurred.

**Five rewritten questions, version 2:** spot-the-mistake about conflating palace destruction with mass disappearance → fill-in-the-blank on fired Pylos clay archives → matching the regional trajectories of Pylos, Mycenae, Tiryns and LH IIIC pottery → single-choice on the limits of stalagmite evidence → single-choice synthesis of institutional versus cultural continuity. Numeric fallback `[2,0,2,0,3]`.

## Compatibility and tracking

- Preserved every original lesson, question, paragraph and checkpoint ID, source, credit, image anchor and path position.
- Old v1 versions frozen at `scripts/fixtures/ancient-greece-pair-9-10-before-phase2-20261103.json`. New v2 versions intentionally change the quiz fingerprint. **No compatibility aliases**: obsolete v1 in-progress attempts must be rejected, rather than mapped to new meanings.
- Historical completion IDs, saved articles, past XP/reward events and existing score ledger remain unaffected. Typed ordering and matching responses are stored through `typedCheckpointAnswers`; only a numeric fallback is used for XP and existing weekly mistake-review cards. Current production reader, native sound host, Supabase schema and gamification algorithms are unchanged.
- Dedicated legacy lesson tests updated for version and numeric answers; new regression checks typed correct/wrong answers, projection, backup restore, stale attempt isolation and XP summary contract.
- Older installed clients lacking typed sidecar support may overwrite current rich drafts during sync. Treat cross-version rollout as a release gate.

## Verification gates

**Performed in GitHub editing environment:** source inspection, static metadata checks, JavaScript regression syntax and staged blob readback. **Not run here:** local Node/typecheck/validator, Android/iOS, Expo native audio, live cross-account sync, remote image delivery/license, final specialist historical and Greek proofreading.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-9-10.cjs
node scripts/test-linear-b-decipherment.cjs
node scripts/test-palace-collapse.cjs
node scripts/test-ancient-greece-phase2-7-8.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

On phone: test positions 4/8/13/17/21 and 4/9/14/21/27, confirmation-before-reward/audio, wrong answer response, matching and ordering persistence after restart, first cue sound, no repeated completion XP, old lesson completion/bookmarks, source captions and zoom, variable text sizes, offline and Supabase sync. Older weekly review is still a canonical choice fallback, not a replay of the original typed widget. Maintain status **Integrated** until both automated and native QA pass.

**Next Phase 2 pair:** lessons 11–12: Geometric Greece and Rise of the Polis.
