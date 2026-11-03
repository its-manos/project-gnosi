# Ancient Greece 30/30 — independent curriculum audit

**Opened:** 2026-11-03  
**Source baseline:** `content/curriculum-v1` at `ba99bab24ed0273b0bb1b4e99dead0807633c217`  
**Audit work branch:** `audit/ancient-greece-curriculum-30`  
**Editorial state:** **30 Integrated, 0 Validated, 0 Approved.** No production content, quiz keys, XP, history, account sync or media entries were changed to open this audit. Do not merge to `main` without explicit authorization.

## Substantive chapter-review reports — first comparative pass complete

- [Chapter I (#1–5) — everyday Athens, identity, evidence, chronology and geography](ANCIENT-GREECE-AUDIT-CHAPTER-I.md).
- [Chapter II (#6–11) — Bronze Age, palaces, Linear B, collapse and Geometric cultures](ANCIENT-GREECE-AUDIT-CHAPTER-II.md).
- [Chapter III (#12–18) — polis, settlements, Sparta, democracy, justice, warfare and sanctuaries](ANCIENT-GREECE-AUDIT-CHAPTER-III.md).
- [Chapter IV (#19–24) — Persian wars, Athenian empire, the Peloponnesian War, crisis, Philip and Alexander](ANCIENT-GREECE-AUDIT-CHAPTER-IV.md).
- [Chapter V (#25–30) — Hellenistic states, tragedy, sculpture, philosophy, science and Antikythera](ANCIENT-GREECE-AUDIT-CHAPTER-V.md).

**Status as of 2026-11-03:** **30/30 first-pass cross-lesson reviews completed**, all **164 question objects** examined for assessment shape and plausible difficulty concerns, and multiple **selected** archaeological/institutional/epigraphic claims spot-checked against direct sources. The audit has **not** revalidated every statement of the 43,312 words, every question key against scholarship, all 88 image licences, remote URLs or physical Android/iPhone behavior. **0/30 independently signed off, 0/30 Validated, 0/30 Approved**. Local diagnostic was executed successfully and its output supplied by the product owner; other native/full regression checks remain separate.

### Cross-curriculum priority synthesis

| Priority | Scope | Decision/action before editorial approval |
|---|---|---|
| **P0 — Rights** | #29 Euclid papyrus now credited under its primary Penn Museum/OPenn **CC BY-SA 2.0** collection grant (Commons still displays a conflicting 4.0); #27 stele uses special commercial attribution permission | Resolve exact rights, document source provenance and licence/grants; review all **88** placements (including #30 NYU archive **noncommercial publication contents**, which are not current Commons assets) |
| **P0 — Device and compatibility** | All 30 + legacy #15/#30 fingerprints | Physical Android+iPhone with real signed-in/cloud/offline flows, all question formats, credits, audio, typed resume and XP/sync; then production-like build regression |
| **P1 — Duration and packaging** | #21–24 and #25–30 especially | User-time reading+checkpoints+feedback with one consistent `readingMinutes` definition; #24 2,539 words/9 checkpoints advertised 13 min versus illustrative 17.9 |
| **P1 — Assessment** | 135/164 hard-labelled, all #18–30 labelled hard | Test real matching/ordering cards, then rewrite only answer sets with implausible wrong distractors; preserve score versions/old completions |
| **P2 — Semantic overlap** | #4/#10/#11 archive gap, #2/#12/#18 common Greek civic identity, #24/#25 successor states | Remove repetitions **without** deleting meaningful prerequisite retrieval or local historical evidence; explicitly reference prior lessons |
| **P2 — Complete scholarly sign-off** | 43,312 narrative words and 164 checks, 339 lesson source entries | Per-claim traceability to actually accessible text; review disputed causality/chronology and all graded explanations. Current reports include bounded **spot checks only** |

**Do not call the first-pass reports an external historian certification or a full rights/device audit.** Findings are candidates for verified corrective edits; the release gates below remain in force. Lesson files and production systems have not been changed.

## Audit rules

1. The authoritative 30-slot order is `src/utils/lessonPath.ts`, not older research-document slot numbering. Chapter divisions: I #1–5; II #6–11; III #12–18; IV #19–24; V #25–30.
2. Every claim must distinguish **observed evidence**, **contemporary testimony**, **later tradition**, **modern interpretation**, and **hypothetical example**. Do not attribute access to full paywalled works when only abstracts are accessible. For disputed points, preserve real uncertainty without false equivalence.
3. Assess adult-Greek learner challenge from actual reasoning, not only `difficulty` labels. Distractors must be plausible but demonstrably wrong; feedback should explain evidence. Do not weaken questions just to get a desired hard/medium ratio.
4. Repetition is a defect only when a later paragraph/question repeats without adding a new mechanism, source, contrast or application. Intentional retrieval of a prerequisite should be labelled as such.
5. An image's `credit` and `creditUrl` in code prove **metadata presence, not legal rights**. Verify the original file and upstream source, author, commercial permission, licence version, licence link, modifications, museum/third-party constraints and remote availability **for each placement**.
6. Node test results, actual Android device results, actual iOS device results, scholarly/editorial acceptance and product-owner approval are **five different kinds of evidence**. Never promote them automatically.

## Baseline static inventory (not a final audit verdict)

Read the current 30 lesson definitions, their question metadata, path ordering and `articleMedia.ts`. Narrative word count uses introduction + article paragraphs, excluding questions, feedback and captions.

- **30/30 present** and documented as research-first Integrated; local suites were reported passing by the owner, but this is **not** an independent captured test or physical-device certification.
- **43,312 narrative words** across 30 lessons; range **713–2,539**. **164 questions**; **135 marked hard** (82.3%). All questions in **#18–30** are marked hard.
- **339 source entries** are declared in lesson data (not necessarily distinct publications, verified alive, or all read in full).
- **88 image placements**: **30 covers + 58 inline**. Remote Commons delivery and rights still require direct verification.
- Advertised `readingMinutes` range from 6 to 16 minutes, but not consistently inclusive of checkpoint interaction. #21–24 deserve a timed-device review. #24 (Alexander) contains about **2,539 narrative words and nine checkpoints** with 13 displayed minutes; at 190 words/minute the narrative alone takes about 13.4 minutes.
- First spot check: the Acropolis Museum supports the Peplos Kore's red underpainting for final brown hair, so this specific #27 distinction is independently corroborated. That does not independently validate the other 29 lessons or even every claim in #27.

### Stable-path lesson matrix

**Legend:** `Q/H` = total checkpoints / marked hard; `Editorial` = independent factual/consistency/difficulty review; `A` = Android end-to-end; `I` = iPhone end-to-end. All review/device cells begin **Pending**.

| # | Lesson ID | Words | Q/H | Displayed min | Editorial | A | I |
|---:|---|---:|---:|---:|---|---|---|
| 1 | `ancient-athens` | 836 | 3/1 | 6 | Pending | Pending | Pending |
| 2 | `greek-world-not-a-country` | 776 | 3/1 | 7 | Pending | Pending | Pending |
| 3 | `greek-history-through-evidence` | 956 | 3/3 | 7 | Pending | Pending | Pending |
| 4 | `greek-chronology` | 1286 | 4/2 | 8 | Pending | Pending | Pending |
| 5 | `greek-geography-seas` | 1067 | 4/2 | 7 | Pending | Pending | Pending |
| 6 | `aegean-bronze-age` | 1177 | 4/2 | 9 | Pending | Pending | Pending |
| 7 | `minoan-crete` | 1526 | 4/2 | 12 | Pending | Pending | Pending |
| 8 | `mycenaean-palaces` | 1368 | 5/3 | 13 | Pending | Pending | Pending |
| 9 | `linear-b-decipherment` | 1186 | 5/3 | 12 | Pending | Pending | Pending |
| 10 | `palace-collapse` | 1607 | 5/3 | 16 | Pending | Pending | Pending |
| 11 | `geometric-greece` | 713 | 4/2 | 10 | Pending | Pending | Pending |
| 12 | `rise-of-polis` | 1158 | 5/4 | 12 | Pending | Pending | Pending |
| 13 | `greek-settlements-networks` | 1482 | 5/3 | 12 | Pending | Pending | Pending |
| 14 | `sparta-society` | 1559 | 6/5 | 14 | Pending | Pending | Pending |
| 15 | `athens-who-voted` | 1413 | 6/4 | 12 | Pending | Pending | Pending |
| 16 | `athens-law-courts` | 1328 | 6/4 | 11 | Pending | Pending | Pending |
| 17 | `greek-war-hoplites` | 1188 | 6/5 | 12 | Pending | Pending | Pending |
| 18 | `greek-sanctuaries-games` | 1457 | 6/6 | 13 | Pending | Pending | Pending |
| 19 | `persian-wars-greek-world` | 1774 | 6/6 | 14 | Pending | Pending | Pending |
| 20 | `athenian-empire` | 1709 | 6/6 | 15 | Pending | Pending | Pending |
| 21 | `peloponnesian-war` | 2208 | 7/7 | 12 | Pending | Pending | Pending |
| 22 | `greek-crises-fourth-century` | 2014 | 7/7 | 11 | Pending | Pending | Pending |
| 23 | `macedon-philip` | 1973 | 7/7 | 11 | Pending | Pending | Pending |
| 24 | `alexander-conquests-context` | 2539 | 9/9 | 13 | Pending | Pending | Pending |
| 25 | `hellenistic-kingdoms-cities` | 1723 | 6/6 | 10 | Pending | Pending | Pending |
| 26 | `greek-stage-tragedy` | 1618 | 7/7 | 11 | Pending | Pending | Pending |
| 27 | `greek-images-sculpture` | 1426 | 6/6 | 8 | Pending | Pending | Pending |
| 28 | `greek-philosophy-in-context` | 1548 | 7/7 | 11 | Pending | Pending | Pending |
| 29 | `greek-science-knowledge` | 1256 | 6/6 | 10 | Pending | Pending | Pending |
| 30 | `antikythera-gears` | 1441 | 6/6 | 8 | Pending | Pending | Pending |

## Finding register — preliminary, not automatically release-blocking

| ID | Priority | Evidence / scope | Decision needed |
|---|---|---|---|
| AG-01 | High | 135/164 hard-labelled; all of #18–30 hard | Review cognitive tasks and distractors against prerequisites. Calibrate metadata and challenge with player results or timed pilot; do not change labels blindly. |
| AG-02 | High | Several long lessons; #21–24 show particularly tight stated reading times | Timed on-device narrative + checkpoint + feedback. Define whether `readingMinutes` means reading only or full lesson, then make display consistent. |
| AG-03 | High | #29 Commons file box says CC BY-SA 4.0, but Penn Museum's original collection 0016 and EXIF explicitly grant CC BY-SA 2.0 (item prose has version errors) | App credit now uses original **CC BY-SA 2.0** grant; preserve links to the original collection and source image, fulfil 2.0 attribution/ShareAlike obligations, and separately sign off conflicting source wording + Android/iOS display. |
| AG-04 | Medium | #27 Piraeus painted stele photo uses Commons' custom commercial attribution permission, not a standardized CC grant | Retain original photographer credit and permission record; obtain publication-rights sign-off and validate app link. |
| AG-05 | High | 88 remotely hosted images, with prior Android Commons availability issues; not tested end-to-end on current iOS/Android builds | Confirm each image loads, zooms, displays caption/credit, handles offline/fallback, and opens its rights page on both platforms. |
| AG-06 | Medium | 30 research ledgers carry historical evidence and access limits; source entries total 339 | Independent claim-level recheck; distinguish credible source already reviewed from inaccessible paywalled text; find actual contradictory claims before recommending edits. |
| AG-07 | Medium | Multiple deliberate topical handoffs may risk redundant explanation | Examine overlap pairs below with narrative/quiz side-by-side; identify *actual* repeated learning objective before rewriting. |
| AG-08 | High | Automated QA was owner-reported; no full 1–30 physical-device or sync sign-off is documented | Record and run the comprehensive regression matrix below, including historical fingerprints and release builds. |

### Priority overlap pairs to compare — hypotheses, not detected plagiarism or confirmed duplicates

- #1 vs #15–16: Athens everyday lives versus citizenship, assembly and legal procedure.
- #2 vs #13 and #19: common Hellenic language/identity versus settlements, alliances and Persian wars.
- #3 vs #27–29: archaeology as historical method versus evidence for pigments, written schools, medicine and astronomy.
- #6–10: Minoan/Mycenaean exchange, palace accounting, Linear B and collapse should each teach a **different inference** from the surviving record.
- #17–20: hoplite fighting, pan-Hellenic sanctuaries, Persian Wars and the Athenian empire should not assume a single united Greek political identity.
- #20–24: preserve clear chronology from imperial power to war, postwar instability, Philip and Alexander, without repeatedly recounting the same campaigns.
- #24–25: Alexander's conquest is not the same subject as later Hellenistic civic life; check that #25 starts new learning.
- #28–30: philosophy, mathematical/medical inquiry and the mechanism revisit evidence but require different skills and cases.

### Independent factual-review checklist

For each of the 30: (a) extract the *actual* high-impact assertions and every question key; (b) annotate source and **access scope** per claim; (c) check dates, names, geography, translation, ancient terminology, causality and modern debates; (d) record severity and a minimal evidence-based correction; (e) verify whether an answer/version/compatibility key must change; (f) get a second read for Greek fluency and historical framing. Do **not** equate the `editorialReviewedAt` property with independent approval.

Cross-chapter continuity focus: Persian War allegiances and nonuniform Greek identities; ancient versus Roman-era Greek science; chronology of the 404 BCE aftermath, Philip, 323 BCE, Hellenistic successor states; ancient-object date versus date of its surviving copy/photo; primary material remains versus reconstructed original appearances.

### Image-rights and delivery ledger protocol

For each of the 88 placements: lesson ID, cover/inline anchor, exact Commons `File:` page, underlying institution/photographer, displayed licence, **underlying source metadata**, required creator/title and link, any crop/edit/translation, commercial and ShareAlike obligations, screenshot of visible app credit, actual Android/iOS image load and source tap, reviewer/date/decision. A credit URL alone is insufficient proof. Preserve the remote `Special:FilePath` setup until a separate delivery decision is made.

Source pages for current priorities:
- [Peplos Kore — official Acropolis Museum](https://www.theacropolismuseum.gr/en/node/22292)
- [Painted stele photo — Commons custom attribution permission](https://commons.wikimedia.org/wiki/File:7550_-_Piraeus_Arch._Museum%2C_Athens_-_Painted_stele_-_Photo_by_Giovanni_Dall%27Orto%2C_Nov_14_2009.jpg)
- [Euclid papyrus — Commons](https://commons.wikimedia.org/wiki/File:P.Penn._Museum_inv._E02748_Euclid%27s_Elements_2.5.jpg) and [institutional OPenn catalogue](https://openn.library.upenn.edu/Data/0016/html/e2748.html)
- [Creative Commons BY-SA 2.0 requirements](https://creativecommons.org/licenses/by-sa/2.0/) and [attribution FAQ](https://creativecommons.org/faq/)

## Image-rights evidence and external metadata screening

- [Priority rights review: Giovanni Dall'Orto stele and Penn Euclid papyrus](ANCIENT-GREECE-IMAGE-RIGHTS-TRIAGE.md). The former has a documented custom grant permitting commercial use with attribution. For Penn E02748, the original institution's [OPenn collection 0016](https://openn.library.upenn.edu/html/0016.html) grants **CC BY-SA 2.0**; the app credit has been corrected accordingly. Its catalogue/Commons version disagreement remains a human review flag. Neither record has final app/device release sign-off.
- `scripts/audit-ancient-greece-commons-online.cjs`: read-only live Commons API screening for the full image set. Compares in-app licence labels to current Commons metadata and flags absent/mismatched/custom cases, **without interpreting label matches as legal approval**. The product owner **ran the live Commons checker successfully on 2026-11-03**: 88 placements, 88 unique Commons files, 81 API label matches, 5 source-page multi-licence cases, 2 human-review flags. Results confirm the tool's metadata comparison, **not** release rights clearance.

```bash
node scripts/audit-ancient-greece-commons-online.cjs
node scripts/audit-ancient-greece-commons-online.cjs --csv > /tmp/gnosi-ancient-greece-commons-screen.csv
```

### Completed direct page comparison: five API false positives

After the product owner's initial live result of **81 short-label matches + 7 flags**, [direct file-page review](ANCIENT-GREECE-COMMONS-MULTILICENSE-REVIEW.md) confirmed five **different but valid multi-licensed choices** (Persepolis #19, two Athenian tribute photos #20, and two Antikythera photos #30). The in-app credits already reflect options expressly granted on the relevant pages. The product owner's second live run (2026-11-03) **confirmed 81 label matches / 5 file-page-checked multi-licences / 2 human-review flags**. All **88 remain UNVERIFIED** for full release. The two flags are custom permission at #27 (photographer's grant documented) and original-institution-versus-Commons version wording at #29 (original 2.0 grant subsequently identified). The five multi-licence images needed **no** changes; the #29 image credit was subsequently corrected to **CC BY-SA 2.0**. The image URL, caption and all lesson/quiz/progress material remain unchanged.

## Image-rights ledger (generated, initially all **UNVERIFIED**)

Use the read-only `scripts/audit-ancient-greece-image-rights.cjs` helper to export **all 88 placements**, including exact lesson and paragraph anchor, caption, image request URL, credited Commons page, current in-app credit, and a **declared** licence label:

```bash
node scripts/audit-ancient-greece-image-rights.cjs
node scripts/audit-ancient-greece-image-rights.cjs --csv > /tmp/gnosi-ancient-greece-image-rights.csv
```

The resulting CSV has blank reviewer and device-result fields. **Do not mark cleared** simply because the source page exists, the app declares CC, or the thumbnail loads. Confirm original licence and upstream grant, creator/credit, appropriate commercial reuse, ShareAlike/adaptation terms, and Android/iPhone caption/zoom/attribution. The two high-risk entries are flagged. This script was syntax-checked **but not executed with installed modules** in the connector environment.

### Android image viewer — first-pass owner test (2026-11-03)

**PASS (owner-reported):** image loading, pinch-to-zoom/double-tap, caption readability, photographer/licence credit presentation, and source-link opening. Evidence: [Android manual five-check report](ANCIENT-GREECE-ANDROID-IMAGE-FIRST-PASS.md). These are category-level results; the owner did not supply a per-placement list, screenshots, device/OS or build identifier. **This is not sign-off for all 88 Android image placements**, source/licence legal compliance or any iPhone behavior. Both full 88-image device matrices and the whole lesson/quiz/regression QA remain pending; 0 lessons independently Validated/Approved.

## Actual-device acceptance matrix

**Global protocol:** record branch commit/build channel, OS/device versions, guest versus signed-in, network, screenshots/recording, test date and linked bug. Development-unlocked lessons are acceptable for visual QA **but cannot prove normal sequential unlock rules**.

**Each of the 30, on Android and iPhone:** open article in correct path order, inspect all sections and 88 total photo placements, enlarge/tap credits and sources, submit a checkpoint only after confirmation, inspect correct/wrong/explanation/sound, complete and return, check saved/reopen/replay, ensure no double award or error, verify scrolling and large-text accessibility. Every format must render correctly; in particular Matching, Ordering, Fill-in-the-Blank and Spot-the-Mistake.

**Targeted destructive/resume cases:** kill app mid-lesson; restart offline; resume after a correct and a wrong answer; sign out/switch accounts and verify isolation; restore a backup; reconnect and validate Supabase sync/merges, XP and mistake review; verify Android hardware Back; check iPhone safe areas and large text. Verify first-question audio, single completion cue and no sound before submit.

**Legacy-progression gate:** test completed and in-progress `ancient-athens`, #15 `athens-who-voted` (fingerprints `q_470dac57` / `q_22487292`) and #30 `antikythera-gears` (older shipped `q_7ffb549e`, subsequent research-first v2, now v3). Old completions/bookmarks/XP/events must survive while stale incompatible unfinished answers must not be silently reinterpreted.

**Unlock gate:** with dev unlock **OFF** on a clean guest, complete #1, verify only #2 becomes available; repeat all 30 in order, confirm end-of-path after #30. Test that bookmarks do not bypass prerequisites. With dev unlock ON, separately inspect all 30 images/questions quickly.

**Release gate:** rerun on a production-like Android APK and iOS TestFlight build after Expo testing, since SDK code paths, asset loading, OTA updates and store builds can differ.

## Reproducible static test commands

```bash
cd ~/Documents/project-gnosi
git fetch origin
git switch audit/ancient-greece-curriculum-30
git pull --ff-only origin audit/ancient-greece-curriculum-30
npm ci
node scripts/audit-ancient-greece-curriculum.cjs
node scripts/audit-ancient-greece-curriculum.cjs --json > /tmp/gnosi-ancient-greece-audit.json
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-pair.cjs
for pair in 3-4 5-6 7-8 9-10 11-12 13-14 15-16 17-18 19-20 21-22 23-24 25-26 27-28 29-30; do
  node "scripts/test-ancient-greece-phase2-${pair}.cjs" || exit 1
done
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
node scripts/test-article-images.cjs
npx expo start --clear
```

The new diagnostic script is read-only: it measures current words/questions/rights metadata and proposes **lexical** overlap candidates for manual assessment. It cannot establish historical truth, quality, real licences, HTTP availability or device success. At this initial audit commit it has been **syntax-checked, not executed against an installed local checkout**.

## Exit criteria

- All 30 receive documented independent factual, Greek-prose, difficulty and nonredundancy verdicts, with per-finding evidence and resolved compatibility tests.
- All **88** images receive placement-specific licence/right/source and Android/iOS rendering sign-off; unresolved third-party provenance prevents approval of that placement.
- Every new/preserved question format and the historical quiz-key cases pass automated QA; any compatible/incompatible version change is deliberate.
- All 30 pass the physical-device matrix on both platforms, plus progression/account/offline/sync/XP smoke checks and signed-build verification.
- An explicit owner review promotes only evidence-backed lessons from Integrated → Validated → Approved. **No blanket status promotion and no merge into main during this audit.**
