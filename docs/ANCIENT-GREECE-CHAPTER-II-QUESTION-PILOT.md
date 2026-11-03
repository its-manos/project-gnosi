# Ancient Greece — Chapter II assessment improvements (lessons 6–11)

Base: content/curriculum-v1 after merged PR #11 (3e23b3d20b350f8e322d53f862c5b16dc5d1357b).
Working branch: feat/ancient-greece-chapter2-question-improvements.
Approval: draft PR and Android/iPhone QA required; do not merge without explicit approval. All 30 lessons remain **Integrated**.

## Scope and assessment balance

Reviewed all **27 existing graded questions** in Chapter II; revise **10** scored question objects. Preserve 17 others, particularly existing matching and ordering tasks that already demand multi-step reasoning. Introduce **four genuine multiple-select** cards; the overall Ancient Greece course then has **six out of 164** (two from Chapter I plus four from Chapter II). All four use exact-set all-or-nothing grading, not partial credit.

| # | Lesson | Revised question(s) | Old fingerprint | Proposed |
|---|---|---|---|---|
| 6 | aegean-bronze-age | bronze-exchange-proof (multiple-select 0,2) | q_3d04acd6 | q_cb0022e1 |
| 7 | minoan-crete | minoan-power-inference (spot mistake); minoan-town-work (multiple-select 1,3) | q_6b4e0ee0 | q_38c2a466 |
| 8 | mycenaean-palaces | mycenae-offices (lawagetas); mycenae-local-models (comparison) | q_95869c9d | q_57747df5 |
| 9 | linear-b-decipherment | linear-b-tripod-test (1953 independent check); linear-b-limits (multiple-select 0,2) | q_d2096ce | q_761471e6 |
| 10 | palace-collapse | palace-pylos-archive (preservation); palace-evidence-scales (multiple-select 0,2) | q_6904655c | q_be2339b5 |
| 11 | geometric-greece | geo-trade-inference (manufacture vs deposition date, not repeated direct-travel claim) | q_dacbf4e8 | q_18e5d8f5 |

**Unchanged:** 17 other questions, all paragraphs, covers, images and rights metadata, authored checkpoints and section-end placement. Hard/medium labels await measured adult-learner results rather than quota-driven reclassification.

## Selected evidence supporting new wording

- **Melos:** [Tsampiri 2018, Bulletin of the Geological Society of Greece](https://doi.org/10.12681/bgsg.18588) documents obsidian sources and prehistoric exchange; [Perlès et al., Journal of Field Archaeology](https://doi.org/10.1179/009346910X12707321242313) reports geochemical confirmation of Melian origin. Material provenance, deposition date and exact quarrying/travel history are separate inferences.
- **Malia:** [Poursat, Hieroglyphic Documents and Sealings from Mallia, Quartier Mu](https://electronicsandbooks.com/edt/manual/Magazine/A/Aegaeum%20US/Aegaeum%205%20%281990%29.%20Aegean%20Seals%2C%20Sealings%20and%20Administration/Poursat.pdf) and [Quartier Mu workshop study](https://scholarworks.iu.edu/journals/index.php/sdh/article/view/36158/43762) support multiple administrative/production contexts, without proving every workshop was directly run by the palace.
- **Pylos titles:** [American Journal of Archaeology companion review](https://ajaonline.org/book-review/639/) and [J. Bennet, Pylos](https://doi.org/10.2307/jj.30116074.31) support landholding associations for wanax and lawagetas; the title alone does not imply exclusively military function.
- **Linear B:** [Cambridge decipherment introduction](https://www.classics.cam.ac.uk/research/projects/mycep/decipherment) and [Cambridge process account](https://www.classics.cam.ac.uk/system/files/documents/process.pdf) support the 1952 decipherment and 1953 PY Ta 641 tripod test of earlier phonetic values.
- **Climate:** [Finné et al., PLOS ONE 2017](https://doi.org/10.1371/journal.pone.0189447) report little or no unequivocal synchronism of dryness and the Pylos palace fire; correlation cannot prove mechanism, and lack of synchronism cannot disprove all other environmental effects.
- **Lefkandi:** [National Archaeological Museum's Cypriot krater account](https://www.namuseum.gr/en/hidden_museum/the-urn-krater-of-the-lefkandi-lord/) dates the vessel around 1100 BCE versus its later 10th-century burial; [British School at Athens, Irene Lemos](https://www.bsa.ac.uk/2019/01/24/lefkandi-textile-on-display-in-the-national-archaeological-museum/) provides context.

These are targeted factual checks, **not** independent line-by-line validation of all 27 questions or complete lesson narratives.

## Data, test and device QA gates

- Only 10 revised questions advance from **v2 to v3**. Existing IDs, order, numeric correctIndex, checkpoints, section-ending reading flow, image positions and other lesson data remain unchanged.
- Historical fingerprints are incompatible and are **not** aliased. Preserve old completed/saved IDs, immutable events and XP; reject incompatible partially completed attempts safely.
- Frozen old 27 question objects, original fingerprints and checkpoints in scripts/fixtures/ancient-greece-chapter2-pre-pilot-20261103.json.
- scripts/test-ancient-greece-chapter2-questions.cjs verifies exact changed IDs, old/new keys, all answers and typed responses, all-or-nothing partial submissions, duplicate-submission guard, persistence and XP projection. CI also executes prior Chapter I and Phase 2 and full reader/backup/sync/audio/typecheck/content tests.
- Android/iPhone still required: all four multi-select cards with correct/partial/wrong answers and confirmation/audio/XP; ordinary revised questions; old progress/resume/review, account sync, offline behavior and section endings.

No merge, Validated/Approved promotion, or main update without explicit owner approval.
