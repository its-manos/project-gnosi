# Gnosi — Phase 2 / Ancient Greece lessons 15–16: citizenship and courts

**2026-11-03.** Branch `content/curriculum-v1`. **Status: Integrated, QA pending**, not Validated/Approved. No changes to the production quiz engine, scoring, audio, Supabase, lesson path, images or `main`.

## Lesson 15 — `athens-who-voted`

**Title retained:** «Αθήνα: ποιοι αποφάσιζαν, ποιοι ανήκαν». Keeps all **25 paragraph IDs** in six sections, six checkpoint anchors **4/9/13/17/21/25**, the Pnyx cover, Attica demes map, Euphron stele, all credits, references and original question IDs. Opening now contrasts Assembly voters with nonvoting residents and separates descent, deme registration, public religion and actual presence. Paragraph 6 clarifies the changing legal conditions of deme registration; paragraph 12 avoids inventing attendance statistics; paragraph 16 uses Josine Blok's distinction between political franchise and other forms of civic participation; conclusion links decisions to those affected but excluded.

**Research checks:**
- [Josine Blok, *Citizenship in Classical Athens* (Cambridge University Press, 2017), publisher excerpt](https://assets.cambridge.org/97805211/91456/excerpt/9780521191456_excerpt.pdf): women's civic standing and participation in cult cannot be reduced to assembly voting; neither may they be assumed to possess the male franchise. The publicly available excerpt—not the paywalled full text—was used.
- [Athenaion Politeia 42, Greek Language Center](https://www.greek-language.gr/digitalResources/ancient_greek/anthology/literature/browse.html?text_id=331) for later registration practice. Do not backdate all late-fourth-century rules to Solon.
- [Athenaion Politeia 26.4](https://classics.mit.edu/Aristotle/athenian_const.2.2.html) and [historical study of the 451/450 citizenship restriction](https://www.iranicaonline.org/articles/pericles/) for the difference between Kleisthenes' deme system (508/507) and the two-parent descent rule (451/450). Exact motives and later administrative implementation remain debated.
- [Politeia (University of Milan), Demosthenes 57](https://politeia.unimi.it/en/2025/05/08/demosth-57-41-57-54-prove-di-cittadinanza-nella-contro-eubulide-la-funzione-dellengye-e-della-testimonianza-orale-345-a-c/) for adversarial citizenship testimony, not an official census.

**Reworked quiz v2, original six IDs**, types matching → ordering → spot-the-mistake → fill-in-the-blank → spot-the-mistake → single choice. Numeric fallbacks `[2,1,3,0,2,2]`. Tests distinguish legal eligibility, chronological change, observed attendance and women's civic versus voting roles. The old pre-phase2 version-1 questions are frozen; ***the much older four-question pre-editorial fingerprint*** `q_470dac57` is also preserved in the existing `quiz-before-editorial-20261030.json` fixture, not attached as an alias.

## Lesson 16 — `athens-law-courts`

**Title retained:** «Αθήνα: από την καταγγελία στην ψήφο». Keeps all **28 paragraphs** and six checkpoints **4/10/15/20/24/28**, section boundaries, cover and two credited inline images, original source list, question IDs and chapter order. The opening takes the reader through legal access, juror selection, persuasive speeches and the ballot. Paragraph 2 clarifies the stone's formal republication of Draco's earlier law. Paragraph 13 separates a judge-identification `pinakion` from a verdict ballot. Paragraph 21 identifies the pierced vote as in favor of the prosecutor and solid vote for the defendant in the *late-fourth-century* procedure. Conclusion focuses on access and inequalities, not anachronistic professional juries.

**Research checks:**
- [Attic Inscriptions Online, IG I³ 104](https://atticinscriptions.com/inscription/IGI3/104) gives the republication decree of **409/8 BCE** for the homicide law traditionally assigned to Draco in the late seventh century. That is not a surviving original late-seventh-century stone.
- [Harris & Canevaro, *Towards a New Text of Draco's Law on Homicide* (2023)](https://www.persee.fr/doc/reg_0035-2039_2023_num_136_1_8758): textual restoration and the original's precise reading remain disputed; a secondary compiler's editorial restorations cannot be treated as fully legible words on stone.
- [Athenaion Politeia 68–69, open English translation](https://avalon.law.yale.edu/ancient/athe7.asp): pierced and solid bronze ballot stems and two urns, jury voting and the three-obol juror pay procedure. The text describes its own time; do not assume unchanged procedures back in Solon's Athens.
- The pre-existing references on commercial court access and fifth/fourth-century law and decree remain; individual standing was procedure-dependent, rather than a universal equal right of access.

**Reworked quiz v2, original six IDs**, types matching → fill-in-the-blank → matching → spot-the-mistake → ordering → single choice. Numeric fallbacks `[1,2,3,2,1,2]`. The ordering question concerns the **recorded juror voting procedure**, not the chronological invention of different Athenian legal institutions. The matching question separates law, decree, verdict and republication; another separates pίνακιο, kleroterion and textual description.

## Compatibility and migration

- Freeze all pre-edit v1 questions at `scripts/fixtures/ancient-greece-pair-15-16-before-phase2-20261103.json`, preserving their exact wording and numeric answers. No aliases for incompatible fingerprints. Both current quizzes are now **v2** with the same lesson/question/paragraph/checkpoint IDs.
- The prior **pre-editorial** Lesson 15 `q_470dac57` and subsequent `q_22487292` (where applicable) remain historically meaningful; unchanged legacy completion IDs, XP/reward events and missed-answer activity must not be rewritten. Old v1 or earlier unfinished submissions may be discarded as **stale**, while old completion/bookmarks are preserved. Old review activities must be marked changed rather than misapplied to new questions.
- Typed matching/ordering responses are saved in `typedCheckpointAnswers` with immutable question versions; canonical numeric fallback supports existing XP and weekly multiple-choice reviews. `requireCurrentAttemptQuiz: true` remains enforced.
- As with other phase2 batches, clients running old binaries without typed sidecar support remain a real synchronization rollout risk.

## Validation

**Done in connector environment:** original branch/lesson/fixture inspection, primary-source and publicly accessible scholarly checking, staged structural, stable IDs and JavaScript syntax checks. **Not executed:** local Node npm/typecheck/content validator, Android/iOS native, first-question sounds, cross-device authenticated Supabase, offline persist, remote image URL display or final Greek specialist proofread. Lessons #13–14 user-reported local tests passed immediately before this batch. Lessons #9–10 still lack separate explicit local report; don't conflate statuses.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-15-16.cjs
node scripts/test-athens-who-voted.cjs
node scripts/test-athens-law-courts.cjs
node scripts/test-ancient-greece-phase2-13-14.cjs
node scripts/test-ancient-greece-phase2-11-12.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

**Device checklist:** complete / replay the six checkpoints in each; confirm before grading/XP/sound, wrong and right feedback, matching and ordering restoration after exit, no duplication of historic completion or XP, old Athens q_470dac57 and newer quiz fingerprints not reused, old weekly mistakes visible only as appropriate, mobile image zoom/captions/credits, app text resizing, offline restart, and signed-in sync. Status stays **Integrated** until actual reports.

**Next pair:** #17 `greek-war-hoplites` and #18 `greek-sanctuaries-games` after local QA, with no alteration of #15–16 by default.
