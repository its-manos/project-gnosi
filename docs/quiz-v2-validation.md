# Quiz v2 validation — 13 November 2026

- Reproducible `npm ci` installation from the unchanged lockfile.
- All **167** `scripts/test-*.cjs` regression scripts passed in the final full run.
- TypeScript, lesson content validation, beta configuration and generated-bank/migration checks passed.
- 740 dates exercised the actual Daily selector, including leap dates and 48-day cycle boundaries. Every rolling 30-day window contained 210 unique questions with the 2/3/2 difficulty mix and four categories per day.
- All 48 category/difficulty/pool quotas reached the agreed targets. The 48-question pilot is part of the 437 additions. All 139 original question objects and the original PvP seed compare exactly with their fixtures.
- Real Postgres behavior through PGlite verified idempotent migration, matching 240-question server/client banks, preservation of an active pre-update deck, 5/10-question matches across all eight categories plus mixed, both timers, difficulty quotas, full inventory rotation, repeat exhaustion and private solutions.
- PvP screen tests verified Sports/Everyday options and ten-question single-category selection without resetting the chosen count.
- Existing Daily reporting tests cover all 336 questions. They caught an incompatible draft ID format; new Daily IDs now follow the existing report protocol, enforced by the generator.
- All 148 source references returned usable source bodies in the retrieval audit. Rule references include FIBA 2026, ITF 2026, FIVB 2025–2028, ITTF 2025 and current IFAB pages. Retrieval evidence is not independent factual certification; difficulty labels remain editorial estimates.
- Android Metro/Hermes export passed. No installed-device UI or player difficulty calibration is claimed.

Expo Doctor completed 17/20 checks. The same three failures were reproduced on an untouched worktree of main (`b6ada700577310618abeda9aa48c156aa721cf2d`) using the same lockfile/dependencies: the Expo schema API connection failed, React Native Directory metadata validation failed, and five installed Expo packages were behind currently recommended patch versions. This release changes no dependency versions or native configuration.

Validation ran locally. No hosted migration, app publication, EAS build/update or main-branch merge was performed.
