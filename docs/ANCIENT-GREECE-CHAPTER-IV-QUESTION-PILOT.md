# Ancient Greece — Chapter IV question improvements (lessons 19–24)

**Base:** `content/curriculum-v1` after merged PR #13, commit `827a50f2290a380b24ca0e61d9fc95a6437202db`.
**Working branch:** `feat/ancient-greece-chapter4-question-improvements`.
**Approval boundary:** draft PR and Android/iPhone device QA required before any merge. All 30 lessons remain **Integrated**.

## Scope

Reviewed all **42** Chapter IV questions and revised **12** scored items (exactly two per lesson). The remaining **30** questions are unchanged, including substantive matching and ordering exercises. **Five** new genuine two-correct-answer multiple-select questions use exact-set grading. The 164-question Ancient Greece path now contains **16 genuine multiple-select cards** (Chapters I/II/III/IV = 2/4/5/5).

| # | Lesson | Question IDs changed | Old fingerprint | New fingerprint |
|---|---|---|---|---|
| 19 | persian-wars-greek-world | persian-ionia-agency **multi** (3,2); persian-victory-memory | q_6ccad4fd | q_1129f9fd |
| 20 | athenian-empire | empire-foundation-choices **multi** (1,3); empire-tribute-evidence | q_49226ec1 | q_bf314fd7 |
| 21 | peloponnesian-war | war-melos-source; war-404-not-end **multi** (2,0) | q_e47c350b | q_9f59b5e4 |
| 22 | greek-crises-fourth-century | crisis-amnesty-limits; crisis-mantinea-boundary **multi** (3,1) | q_4d818ce6 | q_bcd2bde9 |
| 23 | macedon-philip | philip-terrain-royal-power; philip-336-open-future | q_87f0f8b3 | q_86098248 |
| 24 | alexander-conquests-context | alexander-death-source; alexander-323-open-succession **multi** (1,3) | q_50d3d83b | q_9ed44534 |

The numeric correctIndex stays unchanged for every question; the new multiple-select question's correctIndices array places that index first for the legacy XP projection. **The learner's selection order is immaterial.**

## Historical and interpretive rationale

- **#19**: Ionians could be affected by both revolt and later Persian reassertion without their communities making identical choices. The changing commemorative emphasis of the Plataea serpent-column dedication reveals struggles over political credit, not a complete alliance contract. See the [Greek Ministry of Culture's object account](https://delphi.culture.gr/the-tripod-of-plataea/) and [the bounded Chapter IV audit](ANCIENT-GREECE-AUDIT-CHAPTER-IV.md).
- **#20**: The Delian League's collective naval undertaking could develop unequal contributions and coercion without a demonstrated original plan for a permanent empire. The [454/3 BCE tribute quota inscription, IG I³ 259](https://www.atticinscriptions.com/inscription/IGI3/259), records a **one-sixtieth portion** dedicated to Athena, not all Athenian government receipts or spending.
- **#21**: The Melian Dialogue is a rhetorically composed representation of a negotiation, not a stenographic transcript. The 404 BCE surrender preceded the Thirty and the 403 restoration; treating the two years as the same event distorts civic agency. See Thucydides 5.84–116 and the [Chapter IV audit](ANCIENT-GREECE-AUDIT-CHAPTER-IV.md).
- **#22**: The 403 BCE amnesty limited litigation with exceptions rather than erasing all memory or granting universal political participation. Xenophon's post-Mantinea uncertainty cannot be treated as a precise prediction of Philip's later rise; compare `Hellenica` 7.5.27 with other evidence.
- **#23**: Philip II's mining, timber and geographic advantages were useful but did not replace alliances, military organization and the uncertain succession after the assassination of 336. Retain the difference between historical advantage and inevitability.
- **#24**: [The Babylonian diary for Alexander's death](https://www.livius.org/sources/content/oriental-varia/a-contemporary-account-of-the-death-of-alexander/) records the event in 323 but no medical diagnosis, proven assassin or permanent division of future dynasties. The changed final card explicitly tests contingency and later developments.

These sources corroborate **selected claims**, not every factual assertion in the narratives. Source access varies (primary excerpts and independently examined inscription descriptions versus secondary summaries). **Do not** promote individual lessons to Validated or Approved on the strength of this pilot.

## Data safety and regression policy

- Frozen unchanged pre-pilot data: `scripts/fixtures/ancient-greece-chapter4-pre-pilot-20261103.json` (all 42 question objects, six historic quiz fingerprints and original checkpoints).
- Only the **12 edited questions** advance from version **2 → 3**. Preserve all lesson/question IDs, checkpoint order, source material, paragraph positions, section-ending question layout and existing images.
- Do not alias old quiz fingerprints. Prior historical completion events, saved/completed IDs and credited XP remain intact. Incompatible partial attempts must be invalidated safely rather than silently regraded.
- Contract: `scripts/test-ancient-greece-chapter4-questions.cjs` covers exact edits, typed correct/partial/invalid answers, duplicate-submit guards, old/new fingerprints, numeric XP shadow, history, restoration, original section anchors and total course count.
- Existing phase-2 pair contracts (#19–20, #21–22, #23–24), six standalone lesson tests, preceding Chapters I–III, TypeScript, content, reader, sound, backup/sync and question-type tests are included in CI.

## Unresolved gates

1. **Android and iPhone QA** on all five multi-select items, the revised conventional questions, section-end presentation, wrong/correct sounds, confirmation, XP once, resume, previous history and cross-account synchronization.
2. **Chapter IV reading-time calibration** (not changed here): the audit flags lessons #21–24 as possibly underestimating completion time. Time genuine full-length sessions before updating `readingMinutes` or splitting lessons.
3. Broader rights and historical claim validation are outside this pilot. All 30 lessons remain Integrated.

**No merge into `content/curriculum-v1` or `main` without the product owner's explicit approval.**
