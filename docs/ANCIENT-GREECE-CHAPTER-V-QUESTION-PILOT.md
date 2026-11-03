# Ancient Greece — Chapter V question-improvement pilot and provisional lesson times

**Base:** `content/curriculum-v1` after merged PR #15, commit `9828994720602cbc7bf712db66cda111cb3a165c`.
**Working branch:** `feat/ancient-greece-chapter5-question-improvements`.
**Status:** draft assessment updates; **no merge without owner approval**. All 30 lessons remain **Integrated**, not independently Validated/Approved.

## Assessment scope

Reviewed all **38 scored questions** in lessons #25–30. Revised exactly **12** (2 per lesson); left **26** unchanged, especially substantial matching/ordering exercises. Added **five genuine multiple-select** questions with two correct choices each; the Ancient Greece course consequently has **21 / 164** genuine multi-select cards (I 2; II 4; III 5; IV 5; V 5). Confirmation, exact-set all-or-nothing grading and XP behavior are unchanged.

| # | Lesson ID | Revised questions | Old fingerprint | Proposed fingerprint |
|---:|---|---|---|---|
| 25 | hellenistic-kingdoms-cities | `hellenistic-succession`; `hellenistic-source-triangle` **multi** (1,3) | `q_80077d4d` | `q_49effde3` |
| 26 | greek-stage-tragedy | `stage-festival-frame`; `stage-audience-unknown` **multi** (3,1) | `q_fb629180` | `q_bb9222d0` |
| 27 | greek-images-sculpture | `images-peplos-traces`; `images-pigment-method-limit` **multi** (2,0) | `q_2e30a084` | `q_41c8ba87` |
| 28 | greek-philosophy-in-context | `phil-paid-teaching`; `phil-academy-place` | `q_c47687e6` | `q_31c6a510` |
| 29 | greek-science-knowledge | `science-sacred-disease`; `science-eratosthenes-uncertainty` **multi** (2,0) | `q_5bbf7ce2` | `q_bc722720` |
| 30 | antikythera-gears | `antikythera-saros-visibility`; `antikythera-workshop-claims` **multi** (0,2) | `q_51bf6b4` | `q_8638613a` |

Correct-indices arrays start with the unchanged numeric `correctIndex` to preserve the existing XP projection. **User selection order does not matter.**

### New historical-reasoning emphasis

- **#25**: 323 BCE satrapy assignments were not the fixed map of later dynasties. Royal letters, civic decrees and tax receipts document distinct **public actions**, not every inhabitant's opinions. Compare [Antiochus III's Magnesia letter](https://www.attalus.org/docs/rc/s31.html), [Attalus I's response](https://www.attalus.org/docs/rc/s34.html) and [Athenian decree on Magnesia](https://www.atticinscriptions.com/inscription/IMagnesia/37).
- **#26**: civic organization of Dionysia does not make every theatrical character a government spokesperson. Attendance and social status of diverse spectators cannot be exhaustively reconstructed from surviving records.
- **#27**: the [Acropolis Museum's Peplos Kore entry](https://www.theacropolismuseum.gr/en/node/22292) identifies red undercoat with a final brown hair layer; detection of pigment at specific locations **cannot** establish a complete original palette or uniform coverage.
- **#28**: [Stanford Encyclopedia of Philosophy on Socrates](https://plato.stanford.edu/entries/socrates/) illustrates the limits of treating dialogue as literal transcript. The Academy was not a modern degree-granting university; the portrayal of paid instruction must account for unequal access.
- **#29**: in *On the Sacred Disease*, successful symptom description is independent of the incorrect phlegm-causation explanation. Eratosthenes' **250,000/252,000 stadia** require cautious treatment of later testimony and unknown unit conversion, without invalidating the estimation methodology.
- **#30**: the [Antikythera 2021 mathematical reconstruction](https://www.nature.com/articles/s41598-021-84310-w) is a model, not proof of all lost physical parts. A Saros prediction does not establish local visibility; detailed gearing and inscriptions support *some* reconstructed functions, but neither named maker nor universal distribution.

**Research access:** findings are bounded to the cases cited by the pre-existing [Chapter V comparative audit](ANCIENT-GREECE-AUDIT-CHAPTER-V.md), original museum/institutional entries and existing lesson source ledgers. They are **not** independent scholarly sign-off on all narration, all questions or specialist epigraphy.

## Approximate complete-lesson durations (not device measurements)

The displayed `readingMinutes` is a **rounded planning estimate for reading + answering questions + brief feedback**. Approximate heuristic: narrative word count / **190 words per minute**, plus **30 seconds per question**, plus roughly **30 seconds of buffer**, rounded up; not a claim about actual session duration. The product owner explicitly elected to use estimates rather than hold work for timed sessions.

| Lesson | Old estimate | Proposed estimate |
|---:|---:|---:|
| #21 Peloponnesian War | 12 min | **16 min** |
| #22 Fourth-century crises | 11 min | **15 min** |
| #23 Philip II | 11 min | **15 min** |
| #24 Alexander's conquests | 13 min | **19 min** |
| #25 Hellenistic kingdoms | 10 min | **13 min** |
| #26 Greek theatre | 11 min | **13 min** |
| #27 Sculpture | 8 min | **11 min** |
| #28 Philosophy | 11 min | **13 min** |
| #29 Science | 10 min | **11 min** |
| #30 Antikythera | 8 min | **12 min** |

No lesson split, new IDs, XP change or time-gating mechanism is introduced.

## Historical compatibility and device QA

- Freeze all pre-pilot Chapter V questions, old six quiz fingerprints and authored checkpoints in `scripts/fixtures/ancient-greece-chapter5-pre-pilot-20261103.json`.
- Only 10 scored questions advance **v2 → v3**, while the two changed #30 Antikythera questions advance **v3 → v4**. Unchanged questions stay at their prior version.
- The historically shipped #30 quiz fingerprint **`q_7ffb549e`** remains obsolete and separate from both pre-pilot and current fingerprints. No aliases or reinterpretation of missed question indices.
- Preserve all lesson IDs, question IDs, positions, original numeric correctIndex, sections, anchors, images, completion/XP/event history and saved bookmarks. Incompatible stale attempts invalidate safely.
- `scripts/test-ancient-greece-chapter5-questions.cjs` checks frozen history, exact revisions, multi-select partial/invalid/duplicate answers, typed restore, numeric XP projection, chapter position, times and old/new keys.
- Require green CI and physical **Android + iPhone** checks: five new multi-select cards, revised ordinary cards, confirm/feedback/sound, exact-set partial grading, one XP/completion, mid-lesson resume, saved historic #30 and #15 completion, weekly review, account sync and media viewing.

### Unresolved separate release obligations

The existing image-rights audit flags (1) the #27 painted funerary stele's atypical original photographer permission and (2) the #29 Penn Euclid papyrus's inconsistent rights metadata; **neither is legally cleared by this PR**. All other placements also need per-file rights review. NYU 2016 Antikythera publication figures remain noncommercial-licensed and must not be imported to a commercial app without further rights. The first-pass audit is *not* editorial or legal approval.

**This proposal must remain a draft PR; do not merge without explicit product-owner authorization.**
