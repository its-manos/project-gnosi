# Gnosi — Ancient Greece, Phase 2 Lessons 13–14

**Date:** 2026-11-03 · **Branch:** `content/curriculum-v1` · **Status:** **Integrated**, not Validated/Approved. No production engine, reader, XP, audio, Supabase or `main` change.

## Lesson 13 — `greek-settlements-networks`

**Title unchanged:** «Νέοι οικισμοί, παλιοί γείτονες: πέρα από το Αιγαίο». All **25 paragraph IDs**, five original checkpoint anchors at 5/10/15/20/25, source references, linked media, credited cover and existing chapter order retained. Rewrote the opening to contrast the materially mixed settlement on Ischia, Thucydides' account of Sicel expulsion at Syracuse and a later Massalia founding legend. The introduction avoids casting all settlements as neutral commerce or all indigenous communities as passive. The Pithekoussai mobility wording now distinguishes isotope observations from an individual's language/identity; the Berezan newly published lead-letter wording reflects its incomplete material condition, and the closing makes source inference more concrete.

Research:
- [iScience (2025): Pithekoussai strontium study](https://doi.org/10.1016/j.isci.2025.111927) investigated **71 people** and explicitly warns about the volcanic environmental baseline; isotope values cannot establish each individual's language or ethnic affiliation.
- [Thucydides 6.3.2, Greek and English](https://beta.perseus.tufts.edu/urn:cts:greekLit:tlg0003.tlg001.perseus-eng6:6.3.2/) states that Archias drove Sicels out of the island at Syracuse. The testimony was written long after the eighth-century foundation; it is not an eyewitness report or universal description of every settlement.
- [Chistov & Pavlichenko, *Hyperboreus* 25(2) (2019), Berezan letter](https://bop.unibe.ch/Hyperboreus/article/view/12085) describes a **twice-folded, fragmentary lead letter** excavated in **2017**, dated to first half or possibly second quarter of the sixth century BCE, likely concerning economic correspondence. These are distinct excavation, composition and publication dates.
- Preexisting Massalia bibliography, including an ancient founder-marriage tradition, retained; marriage remains an account of later foundation memory, not proven consent of all local communities.

Quiz design: five original stable IDs, **v2**, canonical numeric fallback keys `[1,2,0,0,2]`. Matching Pithekoussai finds and warranted conclusions → spot-the-mistake about allegedly uninhabited Syracuse → fill-in-the-blank on Massalia foundation narrative → ordering a **sequence of evidence-assessment steps**, not a claim that every item occurred sequentially in history → multiple-choice synthesis. Matching/ordering rich values are saved through the current typed sidecar. All single-choice alternatives remain independently defensible in ordinary weekly review.

## Lesson 14 — `sparta-society`

**Title unchanged:** «Σπάρτη: ποιοι στήριζαν την πόλη των «ομοίων»;». Kept **26 stable paragraph IDs**, six checkpoints **4/9/13/17/22/26**, all sources, media/attribution and path order. The new opening starts with who supplied the resources for Spartan common meals and asks how varying social groups participated. Simplified repetitive status terminology and the syssitia explanation. The Thucydidean disappearance account remains a report of a **particular fifth-century incident**, not proof of an immutable policy. The Orthia passage now explicitly contrasts earlier offerings with the much later Roman structure. No universal claim is made about class, gender or personhood of the ancients.

Research:
- [Thucydides 4.80.3–4](https://cts.perseids.org/read/greekLit/tlg0003/tlg001/perseus-eng6/4.80.1-4.80.5) describes approximately 2,000 helots who were selected and disappeared. Treat as an ancient report, with authorial perspective, not a complete cross-century census.
- [British School at Athens: Artemis Orthia 1906–10 excavations](https://www.bsa.ac.uk/2022/02/24/sparta-begins-1906-1910-bsa-sparta-excavations-in-the-sphs-collection/) documents substantial lead votives, terracotta masks and ivories, the archaic sanctuary **and Roman theatre**. [Engstrom & Braun (2022)](https://www.cambridge.org/core/journals/annual-of-the-british-school-at-athens/article/lead-figurines-from-the-sanctuary-of-artemis-orthia-at-sparta-in-the-art-gallery-of-greater-victoria-canada-problems-of-typology-and-collections-history/9D9CA8746118A184919AE46958BD3B15) distinguishes the chronological layers, finds and collection history.
- [Hodkinson, Oxford Classical Dictionary, syssitia](https://doi.org/10.1093/acrefore/9780199381135.013.6193) supports required contributions for common meals and the political consequences of inability to contribute. Restricted text beyond publicly available extracts is not represented as read.
- Other preserved sources include Xenophon, Aristotle, Tyrtaeus, Plutarch and recent research on changing Spartan/Lakedaimonian labels. Spartan women had differentiated property opportunities, not male-citizen political rights. Source chronology from Tyrtaeus to Plutarch is explicitly tested.

Quiz design: six stable question IDs, **v2**, numeric fallback `[1,2,0,0,2,1]`. Matching social positions → spot-the-mistake on overly broad extrapolation from helot suppression → fill-in-the-blank on syssitia contributions → multiple-choice on women and political rights → ordering Tyrtaeus/Xenophon/Aristotle/Plutarch by era → matching Artemis Orthia finds to evidence limits. This is not a claim that the underlying institutions themselves developed in that author order.

## Compatibility

The **old v1 questions are frozen** under `scripts/fixtures/ancient-greece-pair-13-14-before-phase2-20261103.json`. No original lesson, paragraph, section, question or checkpoint IDs were changed. Source entries, credited cover, inline media and navigation order unchanged. Quiz fingerprints change with v2 and new formats: old partial attempts are intentionally marked stale, not aliased. Completed lessons, historical XP, saved lessons, review history and Supabase accounts remain preserved by existing infrastructure. Numeric fallback choices remain meaningful and correct for classic review and XP while rich match/order answers use `typedCheckpointAnswers`.

Older installed app clients without typed sidecar remain a production rollout limitation if they write back to synced in-progress sessions.

## Verification

**Checked during GitHub editing:** source records and limited publisher text/open articles, original stable IDs and question keys, staged data structure, updated test JavaScript syntax. **Not run:** local Node, TypeScript, content validator, native Android/iOS, audio, Supabase account isolation, cross-version migration on real accounts, image remote delivery and final Greek editorial acceptability. Both lessons are **Integrated**, not Validated/Approved. Earlier lessons **11–12** have user-reported local test passes; **9–10** did not receive separate explicit local pass confirmation. No device-level inference.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-13-14.cjs
node scripts/test-greek-settlements.cjs
node scripts/test-sparta-society.cjs
node scripts/test-ancient-greece-phase2-11-12.cjs
node scripts/test-ancient-greece-phase2-9-10.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Device QA: confirmation before reveal/rewards, first-question audio on both platforms, matching/ordering restore after app restart, offline and logged-in account isolation, old completions/rewards, image captions and zoom in different font sizes, single-choice weekly fallback for all nine combined checkpoints. Never reaward XP by replay.

**Next pair, only after QA report:** #15 `athens-who-voted` and #16 `athens-law-courts`.
