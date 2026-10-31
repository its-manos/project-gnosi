# Research audit — greek-world-not-a-country (2026-11-01)

**Status:** Integrated on `content/curriculum-v1`; not Validated or Approved (full npm tests and iOS/Android QA unavailable in connector editing).
**Lesson:** Chapter I, 2/30 — `greek-world-not-a-country`.
**Retitled:** «Ένας ελληνικός κόσμος, όχι ένα κράτος» (planned: «Οι Έλληνες χωρίς ένα ελληνικό κράτος»).
**Rationale:** the final title avoids suggesting that a fixed modern national category always existed, while foregrounding political fragmentation and real common ties. Reconsider only on editorial feedback without changing the stable ID.
**Learning objective:** distinguish a dispersed set of Greek-speaking communities, shared cultural practices and local political communities; resist anachronistic modern nation-state projections.
**Narrative:** map and conceptual comparison, not an archaeological-household case study; 5 sections / 15 uniquely anchored paragraphs / 3 contextual questions after paragraphs 3, 9 and 12 / approx. 7 minutes.
**Non-overlap:** no House Θ, detailed democracy or civic procedure, Linear B decipherment, Mycenaean palaces, colonization mechanics, polis formation, or historical source methodology. Herodotus is presented briefly as a contextualized example; lesson 3 will treat sources and biases in depth.

## Claim-to-evidence audit

| Paragraph anchors | Evidence / reading | Editorial interpretation and limits |
| --- | --- | --- |
| `map-not-borders`, `local-belonging` | [British Museum / Smarthistory — Ancient Greece, an introduction](https://smarthistory.org/ancient-greece-an-introduction/); [Yale Open Courses — Introduction to Ancient Greek History](https://oyc.yale.edu/classics/clcv-205) | Separate political communities are not equivalent to one nation-state. The example of three people is an explicitly hypothetical comparison, **not** a reconstructed conversation. Poleis are not treated as the only political form. |
| `map-shores`, `neighbors-and-mixing`, `connections`, `independent-networks` | [Met Museum — Ancient Greek Colonization and Trade](https://www.metmuseum.org/essays/ancient-greek-colonization-and-trade-and-their-influence-on-greek-art); [British Museum / Smarthistory](https://smarthistory.org/ancient-greece-an-introduction/) | Geographic distribution is period-dependent; contacts with local populations were diverse and can include coercion. Do not presume every settlement was homogeneously Greek or politically controlled by its place of origin. Specific colonization history is reserved for lesson 13. |
| `dialects`, `identity-changes` | [Oxford Academic — Hellenophones or barbarophones? (2025)](https://doi.org/10.1093/llc/fqaf119); [Joseph E. Skinner, Mapping Identities (2012)](https://doi.org/10.1093/acprof:oso/9780199793600.003.0004) | Linguistic varieties, local/collective identities, and historical variation matter. These publications are scholarly **analyses**, not direct eyewitness evidence for every community. |
| `sanctuaries`, `shared-not-identical` | [UNESCO — Archaeological Site of Olympia](https://whc.unesco.org/en/list/517); [Oxford Research Archive — Herodotos and Greek sanctuaries](https://ora.ox.ac.uk/objects/uuid:cf106c48-5008-46c2-a0e8-fcc94b20f159) | Shared sanctuaries hosted participants from different communities and involved political dimensions; they were not instruments of a unified Greek state. Local religious variation is not erased. |
| `herodotus-voice`, `modern-labels` | **Primary ancient passage:** [Herodotus, *Histories* 8.144](https://folio2.furman.edu/dramaturg/Herodotus/pages/chunk_1007.html); **modern interpretation:** [D. I. Kyrtatas (2001), Η έννοια του «έθνους» στον Ηρόδοτο](https://grissh.gr/article/54b3977dd36a3601520002df), [S. Tufano (2018), Removing the Nationality Paradigm](https://doi.org/10.1515/tc-2018-0023) | Distinguish **Herodotus' account** of words he attributes to Athenians addressing Spartans from a verbatim archival transcript and from a timeless definition. This is a political/diplomatic episode in the Persian Wars, not a modern census. Historians debate its significance. |
| `more-than-poleis`, `allegiances` | [Yale Open Courses](https://oyc.yale.edu/classics/clcv-205), [Met — Asia Minor chronology](https://www.metmuseum.org/toah/ht/04/waa.html) | Political forms and dependencies varied across eras and regions. No unsupported single-state or universal-independence claim. |
| `takeaway` | Synthesis of above | Neither 'ancient Greek nation-state' nor 'no shared identity whatsoever' follows from the evidence. |

## Media licences and placement

1. **Cover**, [Delphi-Archaeological Site.jpg](https://commons.wikimedia.org/wiki/File:Delphi-Archaeological_Site.jpg): F. Harbin, 2012 photograph, **CC BY 3.0**, JPEG 5472 × 3080, landscape/cover. Modern view of Delphi sanctuary (not a photograph of antiquity). Photo documentation on Commons; licence [terms](https://creativecommons.org/licenses/by/3.0/). Crop, if used, should be noted as UI framing and comply with BY-SA.
2. **Inline after `map-shores`**, [Greek Colonization Archaic Period.png](https://commons.wikimedia.org/wiki/File:Greek_Colonization_Archaic_Period.png): Regaliorum (based on Times History Atlas), **CC0 1.0 / public-domain dedication**, PNG 684 × 388. Original cartographic attribution on Commons; modern and simplified *Archaic-period* depiction, not proof of uniform territorial control. Used as **contain** and zoomable due to small labels. Original attribution indicates adapted atlas model: editorial licence/accuracy check is limited to Commons' claims; replace if provenance is challenged.
3. **Inline after `sanctuaries`**, [Stadium at Olympia.jpg](https://commons.wikimedia.org/wiki/File:Stadium_at_Olympia.jpg): Anna Tziaki, 2016 photograph, **CC BY-SA 4.0**, JPEG 3471 × 2736. Shows the present site, not a reconstruction. Caption excludes the notion of a national capital. Licence [terms](https://creativecommons.org/licenses/by-sa/4.0/).
4. All media use existing Commons FilePath remote URL helper. **No local image assets were added**; the live thumbnail redirect, network/offline loading, display crop, attribution accessibility and zoom remain untested on Android/iOS. Do not mark Validated on web-source checks alone.

## Checkpoint contract and compatibility

- Stable lesson ID: `greek-world-not-a-country` (new, no historical completions expected).
- Paragraph IDs are unique and stable. Question IDs/version: `greek-world-belonging` v1 at p3; `greek-world-herodotus-context` v1 at p9; `greek-world-links` v1 at p12.
- All four-option distractors target a distinct misconception; correct answers are at indices 1, 2, 0. Every answer has a substantive explanation.
- Reader uses `checkpoints` anchors and `requireCurrentAttemptQuiz: true`. Unversioned/incompatible attempt indices are not reused; unchanged data model, sync schema, XP/sound/rewards logic.
- `getSubcategoryPath` now places this after `ancient-athens` and before existing old drafts. Previously completed/in-progress older lessons should remain accessible per existing access rule; test on devices. The 30-lesson curriculum is **planning**, not 30 published articles.

## Verification record (2026-11-01)

- Passed via connector-side static inspections before commit: stable new ID, 15 unique paragraph IDs, three ordered checkpoint anchors at 3/9/12, all distinct answer choices/valid correct indexes, HTTP(S) media/source links, no changes to existing quiz definitions, no changes to data persistence, XP, audio, Supabase code, or reward logic.
- Updated existing reader and lesson-path tests that still assumed four paired checkpoints for `ancient-athens`; extended anchor/migration assertions for lesson 2.
- **Not executed** in this environment (no local repository checkout, Node/npm dependencies or device simulator available): `npm run typecheck`, `npm run validate:content`, `node scripts/test-flexible-editorial.cjs`, `node scripts/test-reader-pilot.cjs`, `node scripts/test-lesson-path.cjs`, `node scripts/test-editorial-compatibility.cjs`, `node scripts/test-article-images.cjs`, `node scripts/test-xp-rewards.cjs`, `node scripts/test-answer-sound-route.cjs`, `node scripts/test-play-feedback-ui.cjs`; iOS/Android Expo Go/preview. These remain gating checks, **not passes**.
- Lesson 1 `ancient-athens` remains **Integrated** with original unresolved QA ([notes](ancient-athens-research.md)); no claim of lesson 1 validation is made.
- To verify locally: `npm ci && npm run typecheck && npm run validate:content && node scripts/test-flexible-editorial.cjs && node scripts/test-reader-pilot.cjs && node scripts/test-lesson-path.cjs && node scripts/test-editorial-compatibility.cjs && node scripts/test-article-images.cjs && node scripts/test-xp-rewards.cjs && node scripts/test-answer-sound-route.cjs && node scripts/test-play-feedback-ui.cjs`. Test additional audio/XP sync/Supabase suites and device issues from tracker.

**Next, not started:** Chapter I lesson 3 — `greek-history-through-evidence`, «Ποιος μας αφηγείται την αρχαία ιστορία;». The historical source passage in lesson 2 is a short illustration, not the future article's evidence-method narrative.
