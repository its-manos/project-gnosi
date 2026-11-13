# Psychology: mind and behaviour — Gnosi pilot

Audience: curious Greek-speaking young adults. Original Greek teaching, bounded
claims, conceptual progression and application are the publication standard.
This plan supersedes the earlier perception-only pilot as the next catalogue
priority. Existing lessons remain available pending individual audit; their
existence does not determine which material deserves inclusion here.

## Course promise and scope

**Ψυχολογία: νους και συμπεριφορά.** Understand selected mechanisms of thought and
behaviour, apply them to new situations, and judge psychological claims with
appropriate attention to evidence and uncertainty. This is a bounded foundation,
not a university qualification. Clinical assessment and treatment, lifespan
development, and deeper specialist courses need their own research and scope.

| Chapter | Intended capability | Illustrative next lesson questions |
| --- | --- | --- |
| How we explain behaviour | Separate observation, explanation, measurement, causality and generalisation | Τι μπορεί να μας πει μία έρευνα; Πώς μετράμε κάτι που δεν βλέπουμε άμεσα; |
| Attention and perception | Distinguish sensory availability, task goals and reported awareness | Γιατί αλλάζει η ερμηνεία μιας εικόνας; Πότε δυσκολεύει η εναλλαγή εργασιών; |
| Memory | Distinguish encoding, retention, retrieval, recognition and reconstructive errors | Πότε βοηθά μια ένδειξη; Μπορεί μια ειλικρινής ανάμνηση να είναι λανθασμένη; |
| Learning | Apply associative, consequence-based and observational learning with limits | Πώς οι συνέπειες αλλάζουν τη συμπεριφορά; Γιατί η αρνητική ενίσχυση δεν είναι τιμωρία; |
| Thinking and decisions | Compare explanations, uncertainty, framing and reasoning errors | Ποια στοιχεία θα σε έκαναν να αλλάξεις γνώμη; Πώς επηρεάζει η διατύπωση μια επιλογή; |
| Emotion and motivation | Relate bodily responses, appraisals, goals and circumstances | Γιατί η ίδια κατάσταση προκαλεί διαφορετικές αντιδράσεις; |
| Social influence | Examine norms, situations and group effects without universalising a study | Πότε αλλάζουμε γνώμη επειδή διαφωνεί η ομάδα; |
| Individual differences | Understand traits, measurement and person–situation relationships | Τι μπορεί να μας πει ένα χαρακτηριστικό προσωπικότητας; |

Brain/body mechanisms enter when needed to explain an outcome. Course syllabi and
OpenStax Psychology 2e inform coverage, not a fixed lesson count. Choose lesson
boundaries from prerequisites, evidence and distinct objectives; do not pad a path
to a quota. Reading minutes exclude questions. The pilot's intro/body word counts
are 529, 499 and 527; at the project's 190-word/minute estimate, each rounds up to
three reading minutes. Question time is additional.

## Opening pilot in the app

Location: **Επιστήμη & Διάστημα → Ψυχολογία: νους και συμπεριφορά**.

| Order | Stable ID | Outcome | Prerequisite |
| --- | --- | --- | --- |
| 1 | `psychology-explaining-behaviour` | Separate an observation from a causal explanation; match measurement to question; identify confounding | None |
| 2 | `psychology-selective-attention` | Distinguish inattentional blindness, task-switch costs and later recall; inspect experimental conditions | Lesson 1's evidence reasoning |
| 3 | `psychology-memory-processes` | Distinguish memory functions and limits of retrieval evidence; connect attention with encoding | Lessons 1–2 |

The opening traverses evidence → attention → memory. These are connected prototype
lessons; the rest of the chapters are a roadmap, not lessons advertised as available.
The same title in the older `brain-perception` path is deliberately retained there
for compatibility. Do not count the older draft as independently reviewed or silently
redirect its completed/saved IDs to a different question set.

## Teaching and assessment

Each prototype uses a concrete opening, four purposeful sections, and an applied
check after each section. Paragraph/question IDs are explicit and stable. Examples
and data invented for teaching are labelled hypothetical. Technical terms are
introduced before assessment. Optional self-explanation is not required to advance.

Use scenario choice, matching, spot-the-mistake and selected-word completion when
they fit the objective. Matching fallbacks contain complete plausible mappings so
the current weekly multiple-choice review still asks a coherent question. Do not
add multiple-select with several correct fallback options while review expects one.

The current app unlocks the next lesson on completion, and records evidence for
mistake practice. Completion is not mastery. This PR does **not** introduce fresh
psychology transfer variants into the mastery bank. Before evaluating retention or
claiming subject mastery, author and review distinct delayed application tasks
for each core outcome, using the existing concept scheduling model. Repeatedly
answering the same checkpoint is familiar practice, not independent evidence.

Future skip/entry challenges are product work, not implemented by this content PR.
Do not remove prerequisites only because an author considers them widely known.

## Editorial process and acceptance

1. Define the outcome and its dependencies.
2. Gather reputable sources and map exact supporting sections to claims/questions.
3. Draft original Greek and original teaching examples. Verify reuse rights separately.
4. Verify scientific claims, population/task boundaries, alternatives and evidence.
5. Have a fluent Greek editor and an appropriate subject reviewer assess the draft.
6. Run structural/progress checks and read the lessons on Android/iOS at large text sizes.
7. Test comprehension and later application with target learners, then revise.

No independent human subject or Greek-editor signoff is recorded for this pilot.
It is **Integrated / prototype**, not editorially Approved. No `editorialReviewedAt`
date is fabricated. Source work is documented in [the research dossier](psychology-pilot-research.md).

Expansion gate: sources support every instructional claim, answer keys and fallbacks
are unambiguous, no serious Greek/scientific errors remain, and device checks show
readable diagrams, reliable typed answers, persistence and sequential access.
Learning evaluation should compare prerequisite knowledge with fresh immediate
and delayed application tasks; record completion/drop-off separately.

## Device handoff

From an existing clone, use the PR number to fetch this branch:

```sh
gh pr checkout PR_NUMBER
npm ci
npx expo start --go --clear
```

Find the path through the Science category and complete lessons in order. Scan the
QR code with the SDK-58-compatible Expo Go. Use `npx expo start --go --tunnel` when
LAN connectivity fails; the current Expo tunnel requires Expo CLI sign-in. Physical
iOS Expo Go may also require CLI and device to use the same Expo account.

Device checks owned by the user for this PR: first-question gating; correct/wrong
feedback; matching two/three pairs; word selection and confirmation; large Greek
text; source links and image zoom; back/relaunch resume; next-lesson unlocking;
completed replay; guest/account isolation if testing accounts; offline images;
weekly mistake review's full matching fallback. Mocked Node checks are not evidence
that these have passed on a phone. Exact automated results go into the PR description.
