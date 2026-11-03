# Ancient Greece — Chapter I question improvement pilot (draft)

**Base:** content/curriculum-v1 at PR #10 merge 3ef1f6630a5927bc7c7b41bd25b3b02cdb422d31.
**Branch:** feat/ancient-greece-chapter1-question-pilot.
**Editorial status:** all 30 Ancient Greece lessons remain **Integrated**. Do not merge without owner approval.

## Scope — five revised scored questions, not a full-course rewrite

| Lesson | Question ID | Change | Historic v3 key | New v4 key |
|---|---|---|---|---|
| #1 ancient-athens | athens-agora-evidence | Genuine multiple-select (3 correct) of source classes in the Agora | q_9589f6f | q_f94af77e |
| #2 greek-world-not-a-country | greek-world-herodotus-context | Distinguish appeals to common identity and request for aid from conditional surrender | q_2f407fde | q_edbf04f0 |
| #3 greek-history-through-evidence | greek-evidence-speeches | False inference from general sense of a speech to verbatim attribution | q_acea3480 | q_4f37b78f |
| #4 greek-chronology | greek-time-overlap | Replace all-Crete absolutism with unsupported transfer of Knossos' archive dating to other centres | q_96c1cc27 | q_8e3a2d65 |
| #5 greek-geography-seas | aegean-geography-not-destiny | Genuine multiple-select (2 correct) of shelter/weather vs unsupported direct-route/landing conclusions | q_a0c67062 | q_69c72c2e |

All other questions, IDs, paragraph contents, checkpoints and section-ending presentation remain unchanged. **164 total questions, 2 genuine multiple-select** after the pilot. No sweeping reclassification of difficulty was undertaken; the hard labels remain candidates for adult-player calibration.

## Source rationale (bounded verification)

- #1: [American School of Classical Studies at Athens — Agora excavations](https://dataservices.ascsa.org/excavations/athenian-agora/about-the-excavations) distinguishes public inscriptions, weight standards and surrounding domestic pottery. Do not treat inscriptions as a transaction-volume ledger.
- #2: [Herodotus 8.144, Greek text](https://folio2.furman.edu/dramaturg/Herodotus/pages/chunk_1007.html). The Athenian reply both rejects agreement with Xerxes and requests timely movement of Spartan forces toward Boeotia.
- #3: [Thucydides 1.22.1, Perseus](https://beta.perseus.tufts.edu/urn%3Acts%3AgreekLit%3Atlg0003.tlg001.1st1K-eng1%3A1.22.1). Fidelity to general sense does not establish the precise words of speeches.
- #4: The lesson's regional archive / archaeological chronology research distinguishes Knossos' Linear B evidence from independent local dating at other Cretan centres. No claim of a uniquely certain pan-Cretan transition is made.
- #5: The lesson's maritime archaeology and navigation research distinguish viable coastal approaches, wind exposure, object mobility and undocumented exact journeys.

These are **five question-specific editorial improvements**, not proof that all 164 answers have been independently verified.

## Data compatibility and release gates

- **Explicit version 4 only on the five rewritten question IDs.** Old question IDs, index slots, lesson IDs and authored paragraph anchors do not move.
- Each revised lesson's scored quiz fingerprint changes. Prior incompatible keys are not added to compatibleQuizKeys or silently used to interpret old missed indices.
- Frozen pre-pilot full question snapshots are kept in scripts/fixtures/ancient-greece-chapter1-pre-pilot-20261103.json.
- Completed lessons, saved IDs and immutable historical events/XP must survive. Old incompatible partial attempts must not resume into new versions.
- Multiple-select has correct typed-answer sidecars and a correct/incorrect numeric legacy score projection, with all-or-nothing grading and duplicate-submit protection.
- Run npm run typecheck, npm run validate:content, npm run test:section-end-questions, npm run test:question-types, the new pilot regression, historic Phase 2 tests for #1–6, and existing reader/editorial/backup/sync tests.
- **Manual QA pending:** Android + iPhone correct, incorrect and partial multiple-select answers; explicit confirmation, audio, XP once, resume after restart, old saved/completed lessons, same-ending questions, weekly review and cloud merge/account isolation. Record device/build and results before approval.

Do not treat a green Node suite as device or historical-editorial sign-off. No merge to content/curriculum-v1 or main without explicit owner approval.
