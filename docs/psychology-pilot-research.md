# Psychology pilot: evidence and editorial dossier

Source inspection: 13 November 2026. Status: source-based draft integrated for a
new PR. No independent psychologist/Greek-editor acceptance or phone QA claimed.
Greek copy and diagrams are original; quoted passages and textbook art are not reused.

## Evidence hierarchy and limits

Use academic textbooks for scope/terminology, primary studies for specific results,
and reviews/replications when assessing strength/generalisation. A study's fame
does not establish robustness. Never turn one task into a universal claim about
all people. Scientific and native/structural acceptance are separate.

The Greek Kallipos catalogue identifies Vatakis/Thanopoulos' 2023 chapter
*Εισαγωγή στον Επιστημονικό Συλλογισμό: Η Ψυχολογία ως τρόπος σκέψης*:
https://www.openarchives.gr/aggregator-openarchives/edm/kallipos/000065-11419_11561.
Its underlying full text was access-denied during research. It is a candidate
terminology reference, **not** cited as verified evidence for a pilot claim.

## Source register

| Key | Exact source/location inspected | What it supports / boundary |
| --- | --- | --- |
| P | [OpenStax §1.1](https://openstax.org/books/psychology-2e/pages/1-1-what-is-psychology), definition and empirical methods | Scientific study of mind/behaviour; hypotheses and indirect evidence. Does not support any music result. |
| D | [Scollon, Noba: Research Designs](https://nobaproject.com/modules/research-designs), opening, Experimental Research, operational definitions, random assignment and confounds | Operationalisation, manipulation, random assignment and competing explanations. The pilot's music/task scenarios are invented. Random assignment balances in expectation, not identically in every finite sample. |
| F | [OpenStax §2.3](https://openstax.org/books/psychology-2e/pages/2-3-analyzing-findings), Correlational Research and Correlation Does Not Indicate Causation | Association alone does not establish a specific causal account; confounding; sampling vs assignment. Do not claim all observational causal inference is impossible. |
| A | [Simons & Chabris 1999](https://pubmed.ncbi.nlm.nih.gov/10694957/), abstract | Dynamic counting task and unexpected-event detection; detection depends on similarity/task difficulty. No universal missed-event rate, no diagnostic test, no claim all unattended processing ceases. Abstract inspected; no detailed percentages or full-method claims used. |
| S | [APA: Multitasking](https://www.apa.org/topics/research/multitasking), What the Research Shows | Task-repeat vs task-switch timing; difficulty/familiarity; predictable switching can still cost time. Institutional synthesis, not a new primary experiment. No blanket ban on concurrent activity. |
| M | [McDermott & Roediger, Noba: Memory](https://nobaproject.com/modules/memory-encoding-storage-retrieval), Three Stages, Encoding, Retrieval | Encoding/storage/retrieval, meaning and cues, interaction and difficulty locating a failure from one response. No fixed seven-item capacity, perfect recording or exact anatomy is taught. |
| H | [OpenStax §8.1](https://openstax.org/books/psychology-2e/pages/8-1-how-memory-functions), functions, encoding and retrieval | Meaningful encoding, retrieval vs recognition. Descriptions are functional simplifications, not literal boxes. |
| T | [Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/), abstract | Learning prose passages; restudy advantage at 5 minutes, prior testing advantage at 2 days/1 week. Pilot reports direction and tested delay distinction, not effect sizes or a universal optimal schedule. |

## Claim → paragraph → checkpoint mapping

IDs below omit each lesson's `psych-explanation-`, `psych-attention-` or
`psych-memory-` prefix for readability. Every checkpoint has its own source list
in `src/data/psychologyLessons.ts`, a difficulty, concept ID and explanation.

| Lesson / paragraphs | Sources | Checkpoint and misconception |
| --- | --- | --- |
| 1 observation, scope | P, D | q1: observation vs attributed cause |
| 1 measure, measure-limit | D | q2: understanding performance vs enjoyment or preference |
| 1 correlation, experiment | D, F | q3: simultaneous changes in music and text difficulty confound attribution |
| 1 generalise, transfer | P, D, F | q4: self-selection does not isolate causal influence or establish transfer to every task |
| 2 selection, blindness | A | q1: visual availability is not guaranteed reported noticing |
| 2 study, study-limit | A | q2: foreknowledge changes the unexpected-event condition |
| 2 switching, distinguish | A, S | q3: non-detection vs transition cost are different dependent observations |
| 2 recall-limit, next | A, M | q4: later failure to recall does not localise the original failure |
| 3 processes, name | M, H | q1: initial processing, retention and access are different questions |
| 3 meaning, specific | M, H | q2: semantic processing at study vs delay or test support |
| 3 cue, cue-limit | M, H | q3: a related retrieval cue concerns access, not proof of permanent/perfect storage |
| 3 testing, synthesis | T, M, D | q4: cue-dependent performance alone cannot establish complete storage or initial attention |

The final checkpoint transfers evidence reasoning from lesson 1 to a new memory
scenario. It is immediate in-course application; it must not be represented as
a separately administered delayed assessment.

## Answer and Greek-language review notes

- All invented scenarios are labelled hypothetical or introduced explicitly as an example.
- Question stems specify what can be inferred, not what is merely conceivable.
- Distractors represent causal attribution, measurement mismatch, overgeneralisation,
  process confusion or unwarranted localisation, rather than joke answers.
- Matching fallback options are complete mappings, one of which is correct.
  The typed and numeric forms share an objective and retain the existing score projection.
- Correct positions vary: lesson 1 `[2,0,3,1]`; lesson 2 `[1,2,3,0]`;
  lesson 3 `[2,3,0,1]`. No shuffle or historical key changes are introduced.
- Terms: προσοχή, απροσεξιακή τύφλωση, κόστος εναλλαγής, συσχέτιση,
  τυχαία ανάθεση, κωδικοποίηση, αποθήκευση/διατήρηση, ανάκτηση, ανάκληση,
  αναγνώριση. Ανάκτηση is the broad access function; ανάκληση names a recall task.
- Final native Greek and subject review remains outstanding. An AI source pass is
  not described as independent professional review.

## Media and rollout

Original SVG/PNG diagrams and licences: [asset manifest](../assets/lesson-images/psychology-attribution.md).
All covers/inline diagrams are statically bundled using the existing mapping.
The diagrams are explanatory, not experimental stimuli or measured data.

New IDs are additive. Existing lessons, sources, questions, path order, progress,
XP, auth and synchronization code are untouched. The old perception path remains
a separate, unaudited source of possible future rewrites. Planned chapters and
entry challenges are not advertised as implemented lessons.
