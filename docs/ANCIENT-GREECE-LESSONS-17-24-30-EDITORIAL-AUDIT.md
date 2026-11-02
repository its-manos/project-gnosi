# Gnosi — Ancient Greece Lessons 17–24 and 30: editorial audit

**Date:** 2026-11-02 · **Branch:** `content/curriculum-v1` · **Repository:** `its-manos/project-gnosi`  
**Scope requested:** #17–24 and #30 only. **Completed in this bounded pass:** #17, #18, #30. **Still requiring full proofreading:** #19–24 (six lessons).  
**Status:** prose changes integrated on development branch; **not** a claim of automated validation, installed-device QA or product-owner approval.

## 1. Coverage and editorial status

A current-definition inspection covered identity, opening/closing text, paragraph/checkpoint counts and broad cross-lesson scope for all nine targets. Only #17, #18 and #30 received a complete prose read, targeted revisions and post-edit checks. The other six remain **not proofread in this pass**.

| # | Stable ID | Current title | Prior status | Paragraphs | Checkpoints | Completed here |
|---:|---|---|---|---:|---:|---|
| 17 | `greek-war-hoplites` | Πίσω από την ασπίδα: οι οπλίτες των ελληνικών πόλεων | Integrated | 24 | 6 | **Full read + 9 targeted edits** |
| 18 | `greek-sanctuaries-games` | Ολυμπία και Δελφοί: τόποι συνάντησης και ανταγωνισμού | Integrated | 24 | 6 | **Full read + 9 targeted edits** |
| 19 | `persian-wars-greek-world` | Περσικοί Πόλεμοι: αυτοκρατορία, πόλεις και επιλογές | Integrated | 25 | 6 | **Outstanding**: structure/intro/end sampled only |
| 20 | `athenian-empire` | Από τη Δήλο στην αθηναϊκή ηγεμονία | Integrated | 26 | 6 | **Outstanding**: structure/intro/end sampled only |
| 21 | `peloponnesian-war` | Πελοποννησιακός Πόλεμος: φόβος, επιλογές και εξάντληση | Integrated | 35 | 7 | **Outstanding**: structure/intro/end sampled only |
| 22 | `greek-crises-fourth-century` | Μετά το 404: συμμαχίες, επεμβάσεις και εύθραυστες ειρήνες | Integrated | 34 | 7 | **Outstanding**: structure/intro/end sampled only |
| 23 | `macedon-philip` | Φίλιππος Β΄: πώς η Μακεδονία άλλαξε τις ισορροπίες | Integrated | 33 | 7 | **Outstanding**: structure/intro/end sampled only |
| 24 | `alexander-conquests-context` | Αλέξανδρος: οι κατακτήσεις και οι άνθρωποι πίσω από τον χάρτη | Integrated | 42 | 9 | **Outstanding**: structure/intro/end sampled only |
| 30 | `antikythera-gears` | Ένας ουρανός μέσα σε γρανάζια | **Drafted**, older live article | 10 | **0 explicit; 4 legacy questions** | **Full read + 6 targeted edits** |

The older Lesson #30 has plain-string paragraphs, no explicit question IDs or `checkpoints`, an existing `compatibleQuizKeys` entry (`q_7ffb549e`) and an older `editorialReviewedAt` field. Its historical state and compatibility key were retained. Do not interpret that metadata as research-first approval.

**Totals:** 3 thoroughly reviewed and revised; 0 thoroughly reviewed but unchanged; 6 outstanding. Lessons #1–16, #25–29 and every other subcategory were left unedited. No titles were changed; reading-minute estimates remained the same because length changes were modest.

## 2. Writing issues and implemented improvements

### #17 — `greek-war-hoplites`
- Corrected grammar in `hoplite-02` (`την μεγάλη`) and recast the definition in idiomatic Greek while retaining other military roles.
- Removed a doubled museum-provenance explanation from introduction/`hoplite-01`; made the distinction between separate exhibited objects and a single excavated set more direct.
- Replaced anachronistic “printed equipment specifications” language in `hoplite-04` with historical variation in equipment.
- Corrected the misleading phrase `χάλκινος πήχης` in `hoplite-06`: the surviving material is a bronze **component**, not a person's forearm.
- Changed `φωτογραφική περιγραφή`, `μοναχική εικόνα` and a generic methodological closing into natural wording focused on equipment, testimony and historical variation.
- Kept evidence restrictions (Chigi olpe and Tyrtaeus are not field manuals, dated 418 BCE tactics are not universally projected backwards) and scholarly debate intact.

### #18 — `greek-sanctuaries-games`
- Replaced repetitious opening phrasing about not being “a list of marble temples” with a concrete contrast between early votives and later built remains.
- Improved definition of `ιερό`/`τέμενος` and the everyday language of Elean festival administration.
- Changed lecturer-like phrasing about 776 BCE while preserving the distinction between traditional victory lists and uncertain earliest practices.
- Clarified the Delphic temple's present **fourth-century BCE rebuilding** (after the older building) using the Ministry of Culture's site account.
- Made the Pythia consultation and gender/age categories grammatically more natural.
- Tightened the evidence warning on unrecorded sanctuary labour; replaced the generic conclusion with Delphi's competing dedications and Olympia's uneven resources.
- Preserved nuanced limitations on sacred truce, Kyniska's ownership-based victory, Pausanias as later witness, Amphictyony, and ancient/modern restoration.

### #30 — `antikythera-gears`
- Replaced formulaic “Κι όμως” opening with specific surviving gear teeth and inscriptions; retained chronology and scholarly uncertainty.
- Removed “piece of a puzzle” cliché; distinguished research-based reconstruction of functions from the unknown workshop and owner.
- Removed a second-person instruction and repeated numerical example from the gear-ratio exposition. The 20-to-40 tooth worked example remains in the closing section unchanged.
- Shortened the digital-computer contrast and a repeated paragraph about ignorance of workshop/owner/circulation.
- Fixed the awkward closing “με περισσότερα από μία εντυπωσιακή ιδέα” without changing the substantive expectation that reconstructions fit material evidence.
- **Important:** No paragraph objects/IDs were added to the old article; no quiz or historical compatibility migration.

## 3. Examples: before / after

**#17 — equipment**
- Before: «Ο οπλίτης ήταν βαρύς πεζός πολεμιστής, με χαρακτηριστικό την μεγάλη στρογγυλή ασπίδα.»
- After: «Ο οπλίτης πολεμούσε ως βαριά οπλισμένος πεζός, με χαρακτηριστικό του τη μεγάλη στρογγυλή ασπίδα.»

**#17 — anachronism**
- Before: «Δεν σώζεται κανένα γενικό έντυπο προδιαγραφών για όλους τους οπλίτες των ελληνικών πόλεων.»
- After: «Ο εξοπλισμός δεν ήταν πανομοιότυπος σε κάθε πόλη και σε κάθε εποχή.»

**#18 — traditional 776 BCE**
- Before: «Δεν είναι σωστό να τη μετατρέπουμε σε πιστοποιητικό της στιγμής που επινοήθηκε ο θεσμός...»
- After: «Δεν χρονολογεί όμως με βεβαιότητα την ίδρυση των αγώνων...»

**#18 — Pythia**
- Before: «Άνθρωποι και πόλεις απευθύνονταν για οδηγίες και αποφάσεις.»
- After: «Άνθρωποι και πόλεις ζητούσαν συμβουλή πριν από σημαντικές αποφάσεις.»

**#30 — the final sentence**
- Before: «Μια πειστική ανακατασκευή πρέπει να συμφωνεί με περισσότερα από μία εντυπωσιακή ιδέα.»
- After: «Μια πειστική ανακατασκευή πρέπει να εξηγεί όσα διασώζουν τα θραύσματα, όχι απλώς να παρουσιάζει μια εντυπωσιακή ιδέα.»

## 4. Historical verification and limitations

The three edited articles were checked against their original research ledgers (where present) and targeted external institutional/scholarly pages. This is **not** a claim that every linked publication, inaccessible full text, image endpoint or underlying archaeological report was independently examined.

| Claim or caution | Evidence checked | Finding |
|---|---|---|
| Hoplite equipment and tactical variation | [Met, *Warfare in Ancient Greece*](https://www.metmuseum.org/de/essays/warfare-in-ancient-greece); [Hurwit (2002), *Reading the Chigi Vase*](https://www.ascsa.edu.gr/publications/hesperia/article/71/1/1-22); [Krentz (2002)](https://ascsa.edu.gr/publications/hesperia/open-access) | Chigi imagery interpreted as wider social/ritual composition; avoid extracting fixed formation details. No independent re-resolution of contested “hoplite revolution” scholarship claimed. |
| Olympia sacred site and major building phases | [UNESCO Olympia](https://whc.unesco.org/en/list/517) | Early cult predates Classical temple; temple of Zeus dates around 470–457 BCE. Traditional 776 BCE games date is not proof of an archaeological “founding day.” |
| Apollo temple at Delphi | [Greek Ministry of Culture: Temple of Apollo](https://delphi.culture.gr/the-temple-of-apollo/); [site evolution](https://delphi.culture.gr/archaelogical-site/site-history/the-historical-evolution-of-delphi/) | Later temple rebuilding belongs to fourth century; more specific chronological framing in prose. |
| Antikythera discovery, dating, functions and reconstructions | [Seiradakis & Edmunds (2018)](https://www.nature.com/articles/s41550-017-0347-2); [Freeth et al. (2006)](https://www.nature.com/articles/nature05357); [Freeth et al. (2021)](https://www.nature.com/articles/s41598-021-84310-w); [MPIWG](https://antikythera.mpiwg-berlin.mpg.de/) | Wreck found 1900; device identified 1902; second-century-BCE dating broadly supported; rear cycles better evidenced than many missing front mechanisms. No reconstruction is represented as completely preserved. |

**Confirmed correction:** #17 replaced the misleading “bronze forearm” expression with “bronze component.” **Confirmed chronological clarification:** #18 changed the clumsy reference to the fourth-century Apollo temple into an explicit reconstruction period. No fabricated quantitative facts, claimed quotations or new battle reconstructions were added. No source metadata or URLs were replaced. The question of the precise first appearance of hoplite formations and detailed oracle procedures remains part of the scholarly-debate/verification backlog, not a newly “settled” fact here.

### Image captions, credits, uncertainty
- #17 cover Commons author George E. Koronaios, licensed CC BY-SA 4.0; the documented museum exhibition shows separate objects, some lent from other museums. The caption correctly denies one unified excavated panoply. [Commons file page](https://commons.wikimedia.org/wiki/File:Ancient_Greek_arms_and_armor_at_the_National_Archaeological_Museum_on_October_6,_2021.jpg).
- #18 cover is the 22 October 2020 Olympia aerial by dronepicr, CC BY 2.0; it shows archaeological phases, not a single ancient “snapshot.” [Commons file page](https://commons.wikimedia.org/wiki/File:Top_down_aerial_of_the_archaeological_site_of_Olympia,_Greece_(51222351617).jpg).
- #30 cover Commons author Tilemahos Efthimiadis, CC BY 2.0, photographed at the National Archaeological Museum; image caption is compatible with the file description. [Commons file page](https://commons.wikimedia.org/wiki/File:The_Antikythera_Mechanism_(3471161471).jpg).
- No license strings were edited and no image replaced. The attribution records were inspected, but **runtime HTTP image loading, licences of every inline image, and visual cropping on actual Android/iOS devices were not tested**.

## 5. Cross-lesson focus and repetition map

The #17/#18/#30 columns reflect full reviews. The other lesson descriptions below follow their defined introductions/endings and research-ledger descriptions only; **they remain unproofread**.

| Lessons | Overlap or risk | Editorial boundary / treatment |
|---|---|---|
| #14–16 ↔ #17 | Military participation vs political rights | #17 still treats arms/formation/service, without re-teaching Athenian courts or Spartan social hierarchy. |
| #2, #13 ↔ #18 | Common Greek practices vs shared state | #18 now closes with rival dedications and unequal resources rather than a generic “not one government” moral. |
| #17 ↔ #19 | Hoplite formation vs wars with Persia | #17 retains material evidence/tactics; #19's stated focus is political choices and Achaemenid perspectives. |
| #18 ↔ #19 | Delphi and victory memorials | #18 is cult, offerings and festivals; #19 has commemorative politics of 479. No #19 prose rewrite yet. |
| #19 ↔ #20 | Persian campaigns vs Delian League | #19 ends before the League institutions; #20 opens post-479 alliance financing (sampled only). |
| #20 ↔ #21 | Empire and war | #20 develops tribute/coercion; #21 follows changing conflict phases and civilian costs (sampled only). |
| #21 ↔ #22 | Defeat of 404 and aftermath | #21 ends with defeat; #22 begins with surrender and the constitutional crises of 404–403 (sampled only). |
| #22 ↔ #23 ↔ #24 | Fourth-century alliances, Philip, Alexander | #22 ends in 362; #23 explains Philip's 359–336 political rise; #24 begins his successor's contested accession in 336 (sampled only). |
| #30 ↔ earlier Greek historical lessons | Scientific evidence, inscriptions, dating | #30 specifically teaches geared astronomical calculation and reconstructions; avoided generic lessons about sources. |

## 6. Separate question-design backlog — **no edits applied**

Stable IDs for #17–18 are preserved exactly. #30's legacy questions have no explicit `id` field: indexes below are **positional references, not stable question IDs**.

| Lesson/question | Issue to revisit in separate assessment pass |
|---|---|
| `greek-war-hoplites` / `hoplite-assemblage` | Most distractors are implausible absolutes; could require comparing conflicting provenance notes instead. |
| `greek-war-hoplites` / `hoplite-aspis-mechanics` | Negative `ΔΕΝ` wording and the absurdly fixed eight-row distractor make correct answer unusually obvious. |
| `greek-war-hoplites` / `hoplite-service-rights` | Extreme incorrect choices allow elimination without following social-history argument. |
| `greek-sanctuaries-games` / `sanctuary-altar-before-temple` | Immediate recall and three obvious overclaims; stronger comparison of dating evidence possible. |
| `greek-sanctuaries-games` / `sanctuary-herodotus-oracle` | Checkpoint comes after paragraph 13, while the direct oracular-evidence discussion is paragraphs 10–11. Inspect learner pacing before changing anchors. |
| `greek-sanctuaries-games` / `sanctuary-dedication-message` | Checkpoint comes after paragraph 17, although inscription analysis is concentrated in paragraphs 13–15; also has implausible extreme distractors. |
| `greek-sanctuaries-games` / `sanctuary-pythian-kyniska` | Combines two topics and is asked after paragraph 21; Kyniska appears in paragraph 20. Other answers are easy to eliminate. |
| `greek-sanctuaries-games` / `sanctuary-common-not-unified` | A useful core concept, but false answers are unambiguously extreme. |
| `antikythera-gears` / legacy question **3** (positional) | “Mechanical computer, without electronics” is largely definitional and easily guessed. |
| `antikythera-gears` / legacy question **4** (positional) | Correct choice is a conspicuous absolute, not a strong test of evidentiary reasoning. |

**#19–24 question banks have not been reviewed in depth:** their individual question-quality backlog is outstanding and must not be marked complete.

## 7. Compatibility verification

After each edit, the complete lesson-definition array was re-parsed from the TypeScript data module in a connector-side JavaScript check. These checks confirmed:
- the affected stable lesson ID, category/subcategory, title and reading-time metadata remained constant;
- the sequence of section titles, paragraph IDs (or absent IDs for #30), paragraph counts, and checkpoint anchors remained exactly identical;
- the full `questions` arrays (question text, options, indexes, explanations, versions, metadata) remained byte-for-byte equivalent as parsed JSON;
- the `sources`, image metadata, `requireCurrentAttemptQuiz`, `compatibleQuizKeys` and `editorialReviewedAt` remained unchanged;
- for the shared `catalogueExpansion.ts` file, every other lesson object parsed identical before and after the #30 edit.

This is a **connector-side structural comparison**, not a TypeScript compiler, npm test runner or real-device replay. No change was made to navigation, progression, XP, audio, Supabase, DEV unlock-all, Lesson 15 fingerprints, saved records or quiz migrations.

### Tests **not executed**
The GitHub connector can read/write source but cannot launch the repository's local npm/Node/Expo environment. The repository scripts were checked for existence (all requested scripts except an optional dedicated Antikythera-specific script were present). These commands remain to be run locally:

```bash
npm ci
npm run typecheck
npm run validate:content
for test in \
  test-flexible-editorial test-reader-pilot test-lesson-path \
  test-editorial-compatibility test-article-images \
  test-xp-rewards test-answer-sound-route test-play-feedback-ui \
  test-automatic-sync test-greek-war-hoplites \
  test-greek-sanctuaries-games test-persian-wars-greek-world \
  test-athenian-empire test-peloponnesian-war \
  test-greek-crises-fourth-century test-macedon-philip \
  test-alexander-conquests-context test-dev-lesson-unlock
do
  node "scripts/${test}.cjs" || exit 1
done
```

**Actual results:** connector-side identity/content comparisons **passed** for three modified definitions. **No Node/npm tests were run**; there are no claimed test passes or failures. Native Android/iOS paragraph/resume/checkpoint placement, first-answer sound, XP/replay, offline resume, media load/zoom and Supabase sync remain to be verified on installed builds.

## 8. GitHub record and next action

**Branch:** `content/curriculum-v1`. **No merge to `main`.** Prose commits made:
- `2e105ede07fc798e1f27a7dc09ec545887b0bf62` — #17.
- `352fad71476ebc1a38bdca645230b9a458f090e4` — #18.
- `29a6e20e41d7861c11df9e027d2aab7b0c57cdee` — #30.

**Remaining scope:** #19–24 (six full prose reads/fact/source checks and separate question backlogs). Then run the local test suite, inspect devices and consider whether the three edited lessons qualify for status changes based on actual QA and product approval. Maintain current **Integrated** for #17–18 and **Drafted** for #30 until applicable review and acceptance criteria are met.
