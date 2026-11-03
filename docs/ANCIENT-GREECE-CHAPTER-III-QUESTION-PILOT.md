# Ancient Greece — Chapter III question-improvement pilot (lessons 12–18)

**Base:** content/curriculum-v1 at PR #12 merge 9a888f4e5067ff3629f10fd85698d4421fab5935.
**Branch:** feat/ancient-greece-chapter3-question-improvements.
**Review boundary:** draft PR, automated CI and real Android+iPhone QA before any merge. All 30 lessons remain **Integrated**, not Validated/Approved.

## Editorial scope

Reviewed all **40** scored Chapter III questions, retaining **28** as written (including the substantive matching and ordering interactions). Revised **12** weak-distractor or repeated-assessment questions in all seven lessons; **five** of those are real multiple-select (correct two-of-four answers, exact-set all-or-nothing grading). In the proposed branch the Ancient Greece path has **11 of 164** multiple-select cards (Chapter I 2, Chapter II 4, Chapter III 5); no other question format is removed or globally downgraded.

| Slot | Lesson | Changed question IDs | Previous quiz key | New quiz key |
|---|---|---|---|---|
| 12 | rise-of-polis | polis-zagora-public-work **multi** (3,1) | q_203ea6a0 | q_557f18bf |
| 13 | greek-settlements-networks | settlements-massalia-myth; settlements-no-single-model **multi** (2,0) | q_fc7d588c | q_da29d210 |
| 14 | sparta-society | sparta-perioikoi-property; sparta-women-education **multi** (0,2) | q_f46c1607 | q_7c0b36cc |
| 15 | athens-who-voted | athens-women-civic-roles; athens-inscription-limits | q_993b38c5 | q_652940d2 |
| 16 | athens-law-courts | athens-courts-standing; athens-courts-limits | q_29ee24e3 | q_3942bbcf |
| 17 | greek-war-hoplites | hoplite-service-rights **multi** (0,2) | q_ab4005e6 | q_6f3a69dd |
| 18 | greek-sanctuaries-games | sanctuary-dedication-message; sanctuary-common-not-unified **multi** (1,3) | q_d132f775 | q_83e20e08 |

The ordering of correctIndices in the first two multi-select questions places the existing numeric correctIndex first; **selection order is not part of the learner's correct answer**.

## Historical reasoning improved

- **#12:** archaeological coordination of labor at Zagora, as distinct from proof of a particular voting system; avoid assuming surviving inscriptions exhaust local rules.
- **#13:** differentiate Thucydides' later report of Sicel removal, Pithekoussai material evidence, and Massalia's later founding narratives instead of assuming identical "colonisation" outcomes; see [Thucydides 6.3 at Perseus](https://beta.perseus.tufts.edu/urn:cts:greekLit:tlg0003.tlg001.perseus-eng6/chapter:6.3/) and [Archaeology and Ethnicity in Western Greece](https://www.persee.fr/doc/dha_2108-1433_2014_sup_10_1_3727).
- **#14:** distinguish substantial property holdings for some Spartan women from political franchise, and evaluate Xenophon/Aristotle's differing vantage points. [Aristotle, Politics II.9, historical text](https://sourcebooks.web.fordham.edu/ancient/aristotle-spartanwomen.asp); [E. G. Millender, Spartan Women, scholarly chapter abstract](https://onlinelibrary.wiley.com/doi/10.1002/9781119072379.ch19).
- **#15:** differentiate public religious roles, gender and civic identity; distinguish documented individual naturalization from automatic franchise in earlier centuries. Keep separate old citizenship quiz keys q_470dac57 and q_22487292, and never alias them to the current scored content. See [Cambridge University Press study on deme membership and civic status](https://www.cambridge.org/core/books/abs/democracy-and-participation-in-athens/privileges-and-the-opportunities-of-the-citizen/14CA33DF157137C6845754E4555F8FA1).
- **#16:** commercial suits accessible to some noncitizen litigants did *not* grant eligibility to be a juror or vote in the Assembly. [Adriaan Lanni, Maritime Cases (Cambridge University Press)](https://www.cambridge.org/core/books/abs/law-and-justice-in-the-courts-of-classical-athens/maritime-cases/060FDA3DBADC7A7FF376976E570F20D8).
- **#17:** shared military equipment does not date changes in political participation; the debated "hoplite revolution" requires independently dated evidence. [Peter Krentz, Warfare and Hoplites, Cambridge Companion abstract](https://doi.org/10.1017/CCOL9780521822008.004).
- **#18:** shared Delphi sanctuaries, competitive civic dedications, and limited amphictyonic institutions are distinct from a general Greek government. An inscription recording victory is evidence of a public claim, not proof of every element of the battle. See [Chapter III first-pass audit](ANCIENT-GREECE-AUDIT-CHAPTER-III.md).

**Evidence limit:** these are bounded checks against named sources and the existing lesson bibliography; some scholarship is only accessible via published abstracts. This is not independent fact checking of every line in the 40 question explanations or all historical claims in the seven lesson narratives.

## Immutable progress and QA

- All 40 original questions and authored checkpoints frozen in scripts/fixtures/ancient-greece-chapter3-pre-pilot-20261103.json. New question versions on the 12 changed objects are **v3**, unchanged 28 remain **v2**.
- Original lesson IDs, chapter path positions #12–18, all 40 question IDs, scoring indices, paragraphs, authored checkpoints, section-ending placement and images are unchanged. Exact-set multi-select answers save typed sidecars and continue to project to the legacy numeric XP field.
- Historical lesson fingerprints are intentionally incompatible. Preserve completed/saved states, prior credit, historical completion events and weekly mistake history, but do not apply an incompatible partially completed attempt to changed questions.
- scripts/test-ancient-greece-chapter3-questions.cjs checks keys, untouched questions, checkpoints, typed correct/partial/invalid submissions, duplicate guard, numeric XP, backup, history and key isolation. Previous Chapter I/II tests and phase2 pairs must pass too.
- Device QA gate: Android + iPhone, all five new multiple-select cards (correct, partial and wrong answers; confirmation, sound, feedback, one XP/completion), revised standard questions in #13–16 and #18, previous Athens #15 history, old resume, section-ending, offline restart and cross-account sync. Record any observation before requesting a merge.

**No merge to content/curriculum-v1 or main without explicit owner approval.**
