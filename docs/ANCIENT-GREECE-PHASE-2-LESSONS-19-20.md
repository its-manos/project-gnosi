# Gnosi — Ancient Greece Phase 2 Lessons 19–20: Persian Wars / Athenian Empire

**Date:** 2026-11-03. Branch `content/curriculum-v1`. **Integrated, not Validated or Approved.** No changes to `main`, production quiz engine, reader, sound, XP, Supabase or media delivery.

## Lesson 19 `persian-wars-greek-world`
**Retained title:** «Περσικοί Πόλεμοι: αυτοκρατορία, πόλεις και επιλογές». Reworked the introduction to contrast Darius' Behistun royal claim, Persepolis administrative tablets, Aeschylus' tragedy and Herodotus' much later narrative. All 25 paragraph IDs, six checkpoints after **4/8/12/17/21/25**, question IDs, sections, 4 inline images and cover attribution, sources and historical path order preserved.

Refinements: paragraph `persian-03` explicitly distinguishes royal legitimation vs economic accounting from a missing Persian campaign chronicle; `persian-08` avoids retroactively forcing Ionian populations into one national allegiance; `persian-11` distinguishes a funeral mound from a battle plan and Herodotus' reported 192 dead from a modern archaeological census; `persian-17` distinguishes Athens drama from ship logs; `persian-21` states Persia's ongoing Anatolian presence rather than treating the 479 battles as collapse of Achaemenid rule.

References and research-access limitations:
- [University of Chicago Persepolis Fortification Archive](https://persepolis.uchicago.edu/) documents the administrative purpose and the administrative network, not evidence of the Greek mainland campaign battles.
- [Livius, Behistun inscription](https://www.livius.org/articles/place/behistun/), an Achaemenid royal self-presentation in multiple languages; primary text genre and dating do not imply contemporary independent battlefield reportage.
- [Metropolitan Museum of Art, Achaemenid Empire](https://www.metmuseum.org/toah/hd/acha/hd_acha.htm): supports multinational and culturally diverse imperial governance rather than two monolithic blocs.
- [Herodotus, *Histories* 6 (Perseus)](https://www.perseus.tufts.edu/hopper/text?doc=Hdt.%206.117) for narrative report of Athenian casualties at Marathon; treat as ancient authorial statement, not count verified from excavated burials.
- [Aeschylus, *Persians* (472 BCE)](https://www.britannica.com/topic/The-Persians-by-Aeschylus), an Athenian dramatic work staged eight years after Salamis; not a Persian government record.
- Original lesson academic bibliography/source URLs remain untouched. Publisher or museum summaries and available ancient editions were used; no complete paywalled book was claimed read.

Six v2 questions, original stable IDs and canonical fallback `[2,3,1,2,0,1]`: matching four source genres → multiple choice on diverse Ionian decisions after 494 → spot-the-mistake on Marathon's mound → ordering 480/479 events, **grouping Plataea and Mycale in the same year without claiming independently proven same day** → fill-in-the-blank on evaluating logistics → multiple choice on political contest over the Serpent Column's public dedication. Old v1 questions frozen and intentionally incompatible.

## Lesson 20 `athenian-empire`
**Retained title:** «Από τη Δήλο στην αθηναϊκή ηγεμονία». New introduction uses the fragmentary Athenian tribute-quota list to investigate how a common maritime alliance became an unequal political relationship. All **26 paragraphs**, checkpoints **4/8/13/18/22/26**, original images (tribute-list monument, modern Delos archaeological plan, second tribute-list stone), sources, question IDs and lesson order preserved.

Refinements: paragraph `empire-04` clarifies how common assemblies are different from equal political power; `empire-08` describes uneven dependence on naval resources; `empire-16` treats missing epigraphic entries as evidence gaps, not proof a given city refused tribute; `empire-19` acknowledges that the Erythrai decree's original stone is lost and readings rely on transcripts; `empire-26` avoids retroactively projecting empire as the original purpose of every member.

References and limitations:
- [Thucydides 1.99 (Perseus)](https://beta.perseus.tufts.edu/urn%3Acts%3AgreekLit%3Atlg0003.tlg001.1st1K-eng1/chapter%3A1.99/) explains (as a later historical account) how money-for-ships could fund an Athenian fleet while allies' naval capacity diminished. It does not establish the attitude of every individual ally.
- [Attic Inscriptions Online: Tribute list 454/3 BCE, IG I³ 259](https://www.atticinscriptions.com/inscription/IGI3/259) documents an *aparchē*, a one-sixtieth portion dedicated to Athena, not a complete state budget or disbursement schedule. The multi-year monument is reconstructed from fragments.
- [Attic Inscriptions Online, Erythrai IG I³ 14](https://www.atticinscriptions.com/inscription/IGI3/14), lost original transmitted by older copies; it records locally applicable intervention, with restoration/dating uncertainty.
- [Attic Inscriptions Online, Chalkis IG I³ 40](https://www.atticinscriptions.com/inscription/IGI3/40) contains particular mutual commitments, not empire-wide uniform law. Scholarly date still debated.
- Original academic research and rights ledgers kept unchanged. Available translations/abstracts consulted; paywalled academic publications not claimed read.

Six v2 questions, numeric fallback `[1,3,0,2,0,0]`: classic choice on alliance vs hegemony → matching different ship/money contributions → ordering a **reasoned sequence of expanding coercive relations**, not falsely precise dates for Naxos and Thasos → spot-the-mistake on full budgets inferred from the recorded one-sixtieth dedication, which is not a complete budget → fill-in-the-blank on Erythrai as *local* evidence → classic choice on persistent Persian power without justifying all Athenian interventions. The fallbacks remain meaningful for the existing XP/weekly review and matching/ordering use versioned typed response storage.

## Compatibility safeguards
- Freeze version-1 questions at `scripts/fixtures/ancient-greece-pair-19-20-before-phase2-20261103.json` (unchanged historic question IDs and numeric slots). Intentional new quiz fingerprints with version 2; **no aliases** for incompatible old v1 questions. `requireCurrentAttemptQuiz` maintained.
- Keep every stable lesson/paragraph/question/checkpoint ID, cover and inline-media credit/source, sources array, order, progress, bookmarks, completion, XP, and review events. Old incomplete attempts must not be attached to new meanings. Versioned matching/ordering persist only when typed sidecars are present.
- First checkpoint of Lesson 19 is **matching**; dedicated Node test explicitly rejects numeric-only backup and accepts a matching sidecar, informed by the previous Athens QA fix. First Lesson 20 checkpoint is classic choice, so ordinary numeric restore remains supported. Old lesson history and old Athens fingerprint `q_470dac57` are not reused.
- Older installed apps without typed-answer support remain possible cross-device rollout risk. No production storage code changed.

## Verification and release boundary
Already performed: inspect branch baseline and earlier tests; research sources; GitHub staged source structure, immutability, type schema and JS script syntax. *Not performed:* actual npm commands, Node test execution, Android/iOS Expo verification, audio after cold startup, zoom/licence/web delivery, offline/resume, live cross-account Supabase, XP popup/replay duplicate check, external historian editorial signoff. The user reports **lessons 17–18 local tests passed**, but those tests are not a native QA report.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-19-20.cjs
node scripts/test-persian-wars-greek-world.cjs
node scripts/test-athenian-empire.cjs
node scripts/test-ancient-greece-phase2-17-18.cjs
node scripts/test-ancient-greece-phase2-15-16.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

Device checklist: check 6 checkpoint positions each, confirm-before-grading/XP/audio, matching/ordering save/resume and wrong-answer correction, use of prior completion/XP, old weekly review fingerprints marked changed, offline and signed-in sync/account isolation, credited images and contain/zoom, long explanations and app text scaling.

**Next planned pair:** #21 `peloponnesian-war` and #22 `greek-crises-fourth-century` after this pair's local tests. Both #19–20 remain **Integrated** until their own logged QA.
