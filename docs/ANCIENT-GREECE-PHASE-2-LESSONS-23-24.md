# Gnosi — Phase 2 Ancient Greece Lessons 23–24: Philip II and Alexander III

**Date:** 2026-11-03. **Branch:** `content/curriculum-v1`. **Status:** Integrated, not Validated or Approved. No `main` merge or production quiz/audio/XP/Supabase changes. User reports local tests for Lessons #21–22 passed before this batch, but native/final editorial QA remains open.

## Lesson 23 — `macedon-philip`
**Title unchanged:** «Φίλιππος Β΄: πώς η Μακεδονία άλλαξε τις ισορροπίες». Keeps **33 paragraph IDs**, sections, seven checkpoints after **4/9/16/21/26/30/33**, original seven question IDs, sources, cover and two credited inline photographs. The new opening contrasts succession insecurity at 359 with the later 338 victory rather than treating the outcome as inevitable. Targeted refinements:
- `philip-06`: later traditions on succession are not a fully agreed contemporary account.
- `philip-09`: military power cannot be reduced to sarissa; funding, training, cavalry and supply matter.
- `philip-15`: Olynthian archaeological destruction is distinguishable from rhetorical claims of betrayal.
- `philip-21`: Philip received the Phocian **two Amphictyonic votes** after the Third Sacred War settlement in 346.
- `philip-30`: the 338/7 **League of Corinth oath** promises peace and protection for established constitutions, while the military force behind enforcement remained unequal.
- `philip-33`: 336 inheritance brought resources and unresolved succession decisions, not foreknowledge of Alexander's campaigns.

Research checks and accessible sources:
- [Attic Inscriptions Online, IG II² 236 / IG II³ 1 318, 338/7 BCE](https://www.atticinscriptions.com/inscription/IGII2/236): the translated surviving fragments explicitly mention the oath, nonaggression, constitutions, the king and the leader's response to violators. **A fragmentary oath, not a complete founding charter.**
- [Oxford Academic, Harris, *Aeschines and Athenian Politics*, ch. 5, public abstract (1995)](https://academic.oup.com/book/47008/chapter-abstract/422641016): the Philocrates Peace and Sacred War resolution occur in a changing multi-party situation. Restricted complete chapter not claimed read.
- [Yale Open Courses, Twilight of the Polis, chronology](https://oyc.yale.edu/sites/default/files/files/13twilightofthepolis_1.pdf): dates and procedural history of the transfer of two Phocian votes in 346. This is teaching material, not an ancient primary record.
- Existing source and media bibliography in `docs/macedon-philip-research.md` is retained; those image URLs and rights were not rechecked on physical devices in this batch.

Seven **v2** questions, original IDs and original numeric fallback slots **`[2,1,1,3,0,2,3]`**, using Spot the Mistake → Matching → Matching → Fill in the Blank → Spot the Mistake → Matching → Multiple Choice. Questions distinguish resources versus their control, cooperation of military functions, Olynthus' independent policy, diplomacy and religious institutions in 346, limits of the Chaeronea battle reconstruction and treaty's asymmetry.

## Lesson 24 — `alexander-conquests-context`
**Title unchanged:** «Αλέξανδρος: οι κατακτήσεις και οι άνθρωποι πίσω από τον χάρτη». Keeps **42 paragraph IDs**, nine checkpoints after **4/10/15/20/25/30/36/39/42**, original nine question IDs, eight sections, sources and two attributed inline photographs (and cover). New introduction begins with the **331 BCE Babylonian Astronomical Diary** as a near-contemporary counterpoint to later royal narratives. The point is that conquest involved diverse actors and inherited administration; it was not a single leader's predetermined itinerary. Targeted refinements:
- `alexander-03`: the common-peace agreement is not a pan-Hellenic democracy.
- `alexander-19`: negotiated continuity of local Babylonian authority is not evidence for universal consent.
- `alexander-20`: burning of parts of Persepolis is physical evidence, not a clear statement of the king's emotional motive.
- `alexander-25`: imperial reliefs predate Alexander, not battlefield images.
- `alexander-36`: Hyphasis refusal reveals fatigue and limits of king's control.
- `alexander-40`: a contemporary Babylonian diary records the death in 323, not its medical cause or the subsequent map of kingdoms.
- `alexander-41`: Arrian's source choices are not a guarantee of accuracy.

Source boundaries:
- [Babylonian diary on Gaugamela, Livius translation](https://www.livius.org/sources/content/oriental-varia/a-contemporary-account-of-the-battle-of-gaugamela/): dated battle of **1 October 331 BCE**; tablet fragmentary and interpretation of king/troops desertion differs from later Arrianic traditions. It is near-contemporary, not a complete war diary.
- [Babylonian Astronomical Diary on Alexander's death, Livius](https://www.livius.org/sources/content/oriental-varia/a-contemporary-account-of-the-death-of-alexander/): laconic note of death at Babylon, **11 June 323 BCE**; cannot establish illness or poisoning.
- [Encyclopaedia Iranica, Badian, Gaugamela](https://www.iranicaonline.org/articles/gaugamela-/): scholarly dating, warns precise site is not securely identified.
- [Posen Library, Alexander Sarcophagus](https://www.posenlibrary.com/entry/alexander-great-sarcophagus): late-fourth-century Sidonian sarcophagus *depicts* Alexander but is **not his own burial**. Existing Commons photo credit retained.
- Earlier research ledger `docs/alexander-conquests-context-research.md` holds further published bibliography including editor-accessible summaries. No paywalled full-text reading claimed.

Nine **v2** questions, original IDs and numeric fallback **`[1,2,0,3,1,2,3,0,1]`**, types Spot → Matching → Fill → Matching → Matching → Spot → Ordering → Fill → Multiple Choice. Tests source genre, inherited Achaemenid capacity, liberation claims, Gaugamela, negotiated administration, Central Asian resistance, chronological sequence from Granicus to Hyphasis, 323 death record and uncertain succession.

## Non-destructive versioning
- Snapshot **exact old v1 question objects** before any rewrite: `scripts/fixtures/ancient-greece-pair-23-24-before-phase2-20261103.json`.
- Keep all old completion, bookmark and XP/event identity unchanged; changed quiz fingerprints are explicitly **not aliases**. Old incompatible incomplete attempts may be dropped safely, without reassigning their answers to new questions. `requireCurrentAttemptQuiz: true` preserved.
- Both lessons begin with `spot-the-mistake`, restored from the current matching numeric index **only with a current quiz fingerprint**. Matching and Ordering use full typed sidecars with stable question version, answer IDs and validated backups. Canonical numeric XP/review fallback remains valid.
- No change to React Native reader, quiz engine/card UI, sound host, external images, saved history, XP scoring, Supabase or release dependencies.

## Verification
**Done:** branch/source inspection, claim-to-source cross-checking, staged stable-IDs/paragraph/checkpoint/source/quiz-shape checks, JavaScript test syntax readback. **Not done:** local Node execution, `npm run typecheck`, `npm run validate:content`, device QA, remote image availability, all first-answer sounds, cross-device Supabase/offline storage, reward replay and final Greek proofreading. Retain **Integrated**, not Validated/Approved.

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
npm run test:question-types
npm run test:typed-lesson-integration
npm run test:typed-lesson-audio
node scripts/test-ancient-greece-phase2-23-24.cjs
node scripts/test-macedon-philip.cjs
node scripts/test-alexander-conquests-context.cjs
node scripts/test-ancient-greece-phase2-21-22.cjs
node scripts/test-ancient-greece-phase2-19-20.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-learning-backup.cjs
node scripts/test-xp-rewards.cjs
npx expo start --clear
```

**Device QA:** verify each checkpoint (7 then 9), confirm before grading and playing right/wrong audio; matching and ordering exit/resume/offline, cached and online images/zoom/attributions, old completion and bookmarks, weekly reviews, no duplicate XP on replay, signed-in/out account isolation and Supabase merges.

**Next pair:** #25 `greek-stage-tragedy` and #26 `greek-philosophy-in-context` after local test confirmation. Do not merge `main` without explicit request.
