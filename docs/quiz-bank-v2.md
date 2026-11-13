# Daily, Quick Quiz and PvP expansion v2

The 30-question Quick/PvP bank repeated quickly and supported only five questions in a single category. The Daily pool contained 109 questions and could not supply 30 days of seven fresh questions. This release adds **437 original Greek questions**: 227 Daily-only and 210 shared by Quick/PvP.

| Pool | Categories | Easy/category | Medium/category | Hard/category | Total |
|---|---:|---:|---:|---:|---:|
| Daily | 8 | 12 | 18 | 12 | 336 |
| Quick/PvP | 8 | 12 | 12 | 6 | 240 |

The eight play categories are History, Science, Geography, Technology, Culture, Nature, Sports and Everyday Knowledge. Sports and Everyday Knowledge now appear in PvP and Quick selection. Culture adds film, theatre, literature and music; Science adds cells, genetics, chemistry and human biology. Guided lesson taxonomy is unaffected.

## Authored content and generation

`content/quiz/v2/*.psv` is the source of truth for additions. Each UTF-8 row has these fields:

`pool|difficulty|slug|subtopic|sourceId|prompt|correctAnswer|distractor1|distractor2|distractor3|explanation`

`D` is reserved for Daily. `Q` is eligible for both Quick and PvP. No generation API runs during builds or gameplay. Keep pool IDs, source IDs and slugs stable once published. The generator validates all 48 category/difficulty/pool cells, unique IDs and normalized prompts against both original banks, distinct answer choices, source references, and concise timed wording. New Quick/PvP questions have at most 220 prompt characters and 260 total prompt/choice characters. Four answer positions are balanced across additions; Quick retains its per-round answer shuffle.

- `npm run quiz:generate`: generate the app banks, Daily manifest and schedule, pilot, inventory and new PvP migration.
- `npm run quiz:check`: verify checked-in outputs and the immutable original PvP seed.
- `npm run test:quiz-expansion`: run generated-file checks, content/rotation compatibility and real Postgres PvP tests through PGlite.
- `python scripts/audit-quiz-sources.py`: refresh retrieval evidence (Python standard library plus Poppler's `pdftotext` for PDFs). Source text stays in ignored `.cache/quiz-source-pages`.

The `Quiz bank checks` GitHub workflow runs the generated-file, selection, reporting and PvP regressions on relevant pull requests.

The [48-question pilot](quiz-v2-pilot.md) contains one addition per category/difficulty/pool, included in the full release rather than duplicated. The [inventory](quiz-v2-inventory.md) lists all additions. The fixture `scripts/fixtures/play-banks-before-v2.json` freezes all 139 original question objects; tests compare them exactly, including answer order and revisions.

Sources favour institutional textbooks, museums, rulebooks and standards bodies. Encyclopedia articles supply selected definitions. The source audit records final URL, retrieval date, body hash and extracted length. Successful retrieval is **not** independent factual verification. Editorial review covered answer uniqueness, stated conditions, numerical examples, source relevance and repeated concepts; difficulty remains an estimate requiring player data. No human review or player calibration is claimed. No copyrighted assessment wording or images were imported.

## Difficulty and selection

Easy questions test familiar facts or a direct inference. Medium questions apply a concept or distinguish a common confusion. Hard questions add conditions, interpret evidence or connect facts. The question's length alone does not establish difficulty.

Daily v2 uses a frozen 48-day cycle starting on the Athens calendar date **14 November 2026**. All 336 questions occur exactly once in that cycle. Every day has two easy, three medium and two hard questions across four categories, with at most two questions per category. Any rolling 30-day window within shared-v2 therefore contains 210 distinct question IDs, including across cycle boundaries. This guarantee does not include the transition from shared-v1 or play on older app versions. The cycle is deterministic offline and independent of account/preferences. Questions repeat after 48 days; it is not an unlimited freshness guarantee.

Earlier dates retain `shared-v1` selection. Already-started and completed attempts retain their stored IDs, answer meaning and selection version. Both published manifests remain checked in. Editing/removing a published scored question fails the relevant pool closed. Appending unpublished questions does not silently alter a published challenge. Different app versions can use different pool versions; deploy the same version to players expected to share a set.

Quick keeps its 2 easy / 2 medium / 1 hard mix. The first question is easy; the other four are shuffled after selection. Interests, mistake recall, choice shuffle and the recent-question gap still apply. The saved snapshot preserves both question and option order on resume. The larger bank exposed an existing category-diversity edge case, now fixed by prioritizing three subjects before ordinary freshness ties while protecting the recent-question gap. Daily retains its published progression and schedule.

PvP now offers five or ten questions from one, several or all selected categories, with 15- or 30-second timers. Category chips stay open for multiple selections; All resets the filter, and clearing the last selected chip restores All. The lobby and host editor display the full selected list. A changed category set increments the settings revision and clears readiness; merely reordering the same set does not. Server draws only use selected categories and enforce 2/2/1 or 4/4/2 quotas. Each new match starts easy, then shuffles the remaining questions once on the server. All players share that saved order; retries and matches already in progress retain their decks. Unseen questions are preferred; room history avoids repeats until the eligible inventory is exhausted, then cycles older questions. Mixed draws favour category variety. Existing server ownership checks, membership checks, snapshots and unrevealed-answer protection remain in force.

## Rollout

1. Review and merge the application code and the new migrations through the normal repository workflow.
2. Apply `supabase/migrations/20261113124440_quiz_bank_v2.sql`, then `supabase/migrations/20261113152838_pvp_multi_category.sql`, then `supabase/migrations/20261113180919_pvp_mixed_difficulty_order.sql`, to the intended Supabase environment **before** distributing the new app/update. The first appends 210 questions and updates balanced drawing. The second backfills canonical category arrays, adds explicit multi-category RPCs, and keeps scalar create/configure APIs for installed builds. The third varies difficulty order for new matches. Legacy count/timer edits preserve a newer room’s selected subset. Older builds display the scalar fallback label, so distribute the updated app for full category-list visibility. These migrations do not modify existing room decks, answers or archived reviews.
3. Ship the app through the existing Expo/EAS release workflow. Source-only checks do not publish an update. Check mixed/single-category 5/10 matches and Daily resume on installed devices.

The old seed and all older migrations remain immutable. After v2 is released, freeze its outputs and author a new release/migration for further changes. The current generators are for this unreleased v2; they must not rewrite it after deployment.

For subsequent calibration, collect correctness, response time and timeouts only through the app's established consent model. Compare within mode and category while accounting for player skill; do not infer difficulty from a small raw sample. Analytics schema/instrumentation is outside this content release.
