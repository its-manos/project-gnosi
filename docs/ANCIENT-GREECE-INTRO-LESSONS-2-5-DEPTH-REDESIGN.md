# Ancient Greece Lessons 2–5 — depth and engagement redesign

**Date:** 2026-11-02 · **Repository:** `its-manos/project-gnosi` · **Branch:** `content/curriculum-v1`  
**Editorial status:** **Integrated**, not Validated or Approved. New quiz revisions require local/device QA; do not merge into `main` without approval.

## Editorial problem and decision

The original introductions placed several orientation articles in sequence. They were not objectively too short, but their early paragraphs often repeated school-level descriptions of Greek political fragmentation, source criticism, chronology and Aegean geography. The redesign makes a historically grounded problem the centre of each lesson. **No padding or arbitrary word-count increase.** The sequence, lesson IDs, progress paths and media attachments stay in place.

| # | Stable ID | Current title | Paragraphs revised / total | Prose words incl. intro, before → after | Quiz |
|---:|---|---|---:|---:|---|
| 2 | `greek-world-not-a-country` | Έλληνες, αλλά όχι πάντα σύμμαχοι | 10 / 15 | ~808 → ~769 | 3 questions, version **2** |
| 3 | `greek-history-through-evidence` | Τι μπορεί να αποδείξει ένα σπασμένο αγγείο; | 10 / 18 | ~1,008 → ~944 | 3 questions, version **2** |
| 4 | `greek-chronology` | Από τα ανάκτορα στις πόλεις: οι εποχές της αρχαίας Ελλάδας | 11 / 22 | ~1,254 → ~1,282 | 4 questions, version **2** |
| 5 | `greek-geography-seas` | Βουνά, όρμοι και άνεμοι: οι δρόμοι του αρχαίου Αιγαίου | 10 / 18 | ~1,071 → ~1,067 | 4 questions, version **2** |

Word counts are approximate Unicode word counts for introduction and paragraph prose only; interleaved questions, sources and media pauses are separate. Existing editorial `readingMinutes` values were retained because lengths did not materially change.

## Concrete research-led improvements

**#2 — identity as a political choice.** Begins with differing decisions of Greek communities in the Persian campaign, not a hypothetical modern border map. Uses Herodotus 8.144 for the diplomatic invocation of shared language/religion, and 7.132 for divergence within Boeotia. Preserves distinctions among shared practice, local citizenship, foreign rule and choice of allies. Detailed military chronology remains in lesson #19; sanctuary administration in #18, settlement mechanics in #13.

**#3 — evidence as an investigation.** Centres the group of roughly 190 ostraka naming Themistocles: the attribution of handwriting to 14 people was a published scholarly reconstruction, *not* a certain census of scribes; alternative interpretations exist. The group was apparently not used in a vote, so the items do not establish the result of an ostracism. Compares this with a public decree, Thucydides' explanation of reconstructed speeches (1.22) and the funerary stele of Plangon. Avoid inventing a vote, private motives or reconstructed conversation.

**#4 — chronological change with a surprising hinge.** Contrasts Greek written on Mycenaean Linear B administrative tablets with the earliest surviving Greek alphabetic inscriptions centuries later. Makes clear that a gap in surviving Greek writing does not prove Greek vanished as a spoken language or that communities ceased living and trading. Ceramics, relative chronology and radiocarbon illustrate how conventions are constructed; Bronze Age and Classical dates remain background rather than the whole lesson.

**#5 — real coastal research.** Centres Michael Loy's investigation of possible landing points along western Samos in the 7th–6th centuries BCE. Separates *plausible routes* identified from landscape/weather analysis from *documented contacts* through artifacts. A hypothetical transport chain is explicitly marked illustrative, not a claimed historical voyage. Avoids inventing travel times, routes, sailors or ship manifests.

### Representative before/after reframings

- #2 former opener: modern Greece on a map with borders → specific historical problem, why Greek-speaking communities could be on different sides of a war.
- #3 former opener: generic statement that records are incomplete → the Themistocles ostraka, disputed hands and question of unused ballots.
- #4 former opener: a catalogue of periods → Greek writing in Linear B versus later alphabetic inscriptions, with the intervening social transformations.
- #5 former opener: general wind-and-island distance comparison → a documented problem of exposed coastline and limited safe landing points on Samos.

## Sources and research-access limits

New or focal references consulted:
- [Herodotus 8.144](https://folio2.furman.edu/dramaturg/Herodotus/pages/chunk_1007.html) and [7.132](https://lexundria.com/hdt/7.132/mcly), contemporary perspectives presented within a later historical literary work.
- [Open University OpenLearn on Themistocles ostraka](https://www.open.edu/openlearn/mod/oucontent/view.php?id=114240&section=9.1); [James P. Sickinger, *New Ostraka from the Athenian Agora* (2017)](https://ascsa.edu.gr/publications/hesperia/article/86/3/443-508), for methodology and evidence, not to misidentify the specific 190-item deposit.
- [Carter and Antonaccio, *Cambridge Companion to the Greek Iron Age*, introduction (2026)](https://www.cambridge.org/core/books/abs/cambridge-companion-to-the-greek-iron-age/introduction/EA37C0A78204DEE46F507AFB826A9E00); [Met chronology](https://www.metmuseum.org/de/toah/ht/04/eusb); [Met Geometric art](https://www.metmuseum.org/it/essays/geometric-art-in-ancient-greece).
- [Michael Loy, western Samos peer-reviewed article, Cambridge repository (2024)](https://www.repository.cam.ac.uk/items/a77d566a-8db2-4ac8-9575-c63b3ee2a79d); [Papageorgiou, Aegean seafaring study](https://www.cambridge.org/core/journals/european-journal-of-archaeology/article/abs/marine-environment-and-its-influence-on-seafaring-and-maritime-routes-in-the-prehistoric-aegean/8BC71242614354E05B908EF2541BB258).

Publicly accessible abstracts, source excerpts and existing lesson research ledgers supported a targeted verification, **not unrestricted access to all full paywalled publications**. Where source interpretation is contested (#3 handwriting and #4 absolute chronology), prose explicitly leaves space for dispute. No fictional ancient conversations or unverifiable sailing metrics were introduced.

## Quiz change policy and backward compatibility

The 14 changed questions retain their **stable question IDs and conceptual IDs** and stay at the same checkpoint anchors and paragraph order. Their wording, distractors and answer explanations were edited to demand stronger comparison or inference. All 14 question `version` values changed from `1` to `2`, and no old quiz fingerprint was added to `compatibleQuizKeys`.

**Important trade-off:** old in-progress answers against version 1 are intentionally not reused. Completed lesson IDs and saved lesson IDs remain; old XP/completion events are not rewritten. Existing history is not assigned a newly correct answer or newly valid weekly-mistake index. Users with an unfinished lesson may need to re-answer its questions.

Historical baseline fixture: `scripts/fixtures/ancient-greece-intro-quizzes-before-redesign-20261102.json`. New regression: `scripts/test-greek-intro-redesign.cjs`. Existing `scripts/test-flexible-editorial.cjs` expects version 2 and derives the correct answer dynamically.

Connector-side checks compared current definitions to the pre-redesign commit `1dedb9630bb740abe9ec070292f4ad6821091588`: paragraph counts, paragraph IDs, checkpoint anchors, media fields, question IDs, concept IDs and catalogue links remained unchanged. All four sources parsed and retained valid four-option, version-2 questions. **This is source-level validation, not a Node, TypeScript, Android, iOS or Supabase test.**

## Run locally

```bash
npm run typecheck
npm run validate:content
node scripts/test-flexible-editorial.cjs
node scripts/test-greek-intro-redesign.cjs
node scripts/test-reader-pilot.cjs
node scripts/test-lesson-path.cjs
node scripts/test-editorial-compatibility.cjs
node scripts/test-article-images.cjs
node scripts/test-xp-rewards.cjs
node scripts/test-automatic-sync.cjs
node scripts/test-dev-lesson-unlock.cjs
```

Also verify Android and iOS reader flow, images, quiz difficulty, resume, previously completed lessons, old quiz attempts, weekly review and live Supabase sync. **No local Node/npm/device/backend execution occurred in the GitHub connector session.** Lesson statuses remain Integrated until those checks and editorial acceptance.

## Editorial follow-ups

- Native-speaking reader QA: check whether the first 2–3 minutes of each lesson deliver a genuinely new idea; confirm Greek idiom, pacing and accessibility.
- Investigate alternative scholarly interpretations of the number of distinct hands in the 190 Themistocles ostraka before relying on precise figures in marketing.
- Consider more varied interaction formats beyond four-option single-choice in a separate engine-compatible feature; do not change storage formats in this prose pass.
- Revisit question difficulty tags/reward balance in gameplay QA instead of silently changing XP rules.
- Keep the remaining Ancient Greece lessons distinct: #6 covers Bronze Age material networks; #13 specific settlement interactions; #18 sanctuaries; #19 Persian campaigns.
