# Research audit — ancient-athens (2026-11-01)

**Status:** Integrated; automated project tests, mobile QA and user approval pending.
**Lesson:** `ancient-athens` — «Η Αθήνα πίσω από τον Παρθενώνα» (formerly «Μια μέρα στην αρχαία Αθήνα»).
**Objective:** Interpret archaeological evidence for Athens' everyday life without confusing material traces, scholarly inferences or historical periods.
**Approach:** Archaeological case study, moving from House Θ to the Agora, then to unequal social positions and limits of our evidence.
**Opening:** Contrast the monumental Parthenon with the mundane fabric of an excavated home, without invented dialogue or invented people.
**Distinct contribution:** How to read actual domestic spaces and building reuse; neither a generic day-in-the-life fiction nor another democracy lesson.

## Claim-to-source notes
1. **House Θ** — [Acropolis Museum, House Θ](https://www.theacropolismuseum.gr/en/buildings/house-th): established in the last twenty years of fifth century BCE; survives to late sixth century CE. Andron, raised couch platform and mosaic are present; third century BCE courtyard conversion features three basins, water supply and drain. **Interpretation:** possible textile washing/fullonica; cannot assert exact workshop type.
2. **Site chronology** — [Acropolis Museum, Archaeological Excavation](https://www.theacropolismuseum.gr/en/exhibit-halls/archaeological-excavation): remains from successive periods, not a simultaneous Classical Athens scene.
3. **Agora as multi-use space** — [American School of Classical Studies at Athens, Athenian Agora excavations](https://www.ascsa.edu.gr/excavations/athenian-agora/about-the-excavations): religious, commercial, civic, and domestic contexts. Do not mistake the present archaeological park for one dated photograph.
4. **Gender roles and interpretive caution** — Colette Hemingway, [Women in Classical Greece](https://www.metmuseum.org/essays/women-in-classical-greece), Metropolitan Museum (2004).
5. **Social and legal-status distinctions** — Rebecca Futo Kennedy, [Metics](https://academic.oup.com/edited-volume/61673/chapter-abstract/549655953), Oxford Classical Dictionary, updated 2025; Cambridge Core, [What Do We Really Know about Athenian Society?](https://www.cambridge.org/core/journals/annales-histoire-sciences-sociales-english-edition/article/what-do-we-really-know-about-athenian-society/DF36DF0B855586709F75B8B401E14FC0). Avoid directly equating archaeological tool finds with a person's legal status.
6. **Simon the shoemaker** — contextual traditional designation for building near Agora, not secure identification of named resident. Verify additional excavation details in subsequent editorial review rather than inferring biography.

## Media licenses and editorial placement
- **Cover:** [Athens Acropolis Museum Excavation.jpg](https://commons.wikimedia.org/wiki/File:Athens_Acropolis_Museum_Excavation.jpg). Yair-haklai; own work photographed 24 Apr 2024; CC BY-SA 4.0; 4608 × 2184 JPEG. Source is a modern photograph of excavated remains, not a Classical-era illustration. Landscape image suits existing cover box; live device crop/loading untested.
- **After `theta-workshop`:** [Excavations under the Acropolis Museum 6.jpg](https://commons.wikimedia.org/wiki/File:Excavations_under_the_Acropolis_Museum_6.jpg). Marcus Cyron; photograph 2012; CC BY-SA 3.0; 3872 × 2592. Site overview, not claimed to show only House Θ.
- **After `agora-evidence`:** [Ancient agora of Athens.jpg](https://commons.wikimedia.org/wiki/File:Ancient_agora_of_Athens.jpg). SiaKou96; photograph 2018; CC BY-SA 4.0; 6016 × 4000. Current site view, not ancient photograph.
- All three files are currently linked by Commons Special:FilePath URLs. Confirm Expo iOS/Android remote redirects and thumbnail decoding, zoom and cropping; consider bundling local images for offline support. License URLs on Commons pages; adaptations (e.g. crops) must honor licenses.

## QA and progression
- Stable lesson ID: `ancient-athens`.
- 15 paragraphs with stable IDs; 3 checks anchored after paragraphs 3, 9, 13.
- Stable new question IDs: `athens-theta-phases`, `athens-agora-evidence`, `athens-social-evidence`; version 2.
- New lesson has `requireCurrentAttemptQuiz: true`: incompatible unversioned in-progress attempts will restart, while past completions and XP should remain intact subject to regression testing. Never re-award XP on replay.
- Existing older lesson used four questions and automatic pair placement. Replaced it with 3 explicitly anchored questions; the legacy regression script was updated for new anchors and must be executed.
- **Not run** in connector-only GitHub editing environment: `npm run typecheck`, `npm run validate:content`, `node scripts/test-flexible-editorial.cjs`, `node scripts/test-reader-pilot.cjs`, `node scripts/test-editorial-compatibility.cjs`, all saved-progress/XP/audio tests. Do not upgrade to Validated until these pass and Android/iOS are checked.
- QA devices: opening image, each contextual image, question placement, wrong answer explanations, scroll/resume, saved lesson, attempt migration, revisit no duplicate XP, first-answer audio and rewards popup only when XP > 0.
- **Boundaries:** civic franchise belongs to `athens-who-voted`; Linear B decipherment and Antikythera mechanism keep their existing articles; detailed archaeology methods belong to proposed `archaeology-methods`; do not reiterate House Θ in the next Greek-world lesson.

## Next
`greek-world-not-a-country` — «Οι Έλληνες χωρίς ένα ελληνικό κράτος», Chapter I, position 2/30, outline-only. Explain plural communities, geography and commonalities without translating ancient identities directly into a modern nation-state. Start with a distinct essay or map-based comparison instead of another excavated dwelling. Curriculum and tracker take precedence if editorial order changes.
