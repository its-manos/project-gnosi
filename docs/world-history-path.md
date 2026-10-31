# Παγκόσμια ιστορία — guided path

## Scope and inspiration

An original Greek survey inspired by the broad chronological sweep of Bill Wurtz’s [history of the entire world, i guess](https://www.youtube.com/watch?v=xuCn8ux2gbs): early universe → Earth and life → humans → farming and cities → interregional exchange and empires → oceanic connections → industrial and political transformations → a connected modern world.

The official video is credited as structural inspiration in the opening lesson. It is not used as historical authority. The path does not reproduce its script, jokes, music, frames, or visual identity, and is not an official adaptation. References below supply factual background. The path is a selective introduction, not an exhaustive history or a reconstruction of the video scene by scene.

Twenty new lessons join the existing Pompeii and Silk Roads articles: 22 steps, 88 checkpoints (80 new), 20 original offline diagrams. Each new lesson has four sections, eight taught paragraphs and four questions, fitting the reader’s paragraph-pair gates. New lessons contain about 390–430 Greek words plus quizzes; the app estimates three minutes of reading at a deliberately modest 150 words/minute, excluding quiz time. Real reading pace varies.

## Editorial choices

- Begin with evidence, scale and causation, then follow the broad chronological arc. Regional side views intentionally overlap in time; the sequence is not a claim that one society replaced another globally.
- Teach interpretations and mechanisms: stockpiles and distribution, network dependencies, imperial administration, information circulation, rights and implementation. Questions follow the paragraph pair that teaches the needed idea.
- Distinguish the hot early universe from an explosion inside pre-existing space; distinguish very early life evidence from a solved origin-of-life mechanism; describe evolution as branching rather than a ladder.
- Include African origins, Han China, South Asian traditions, Islamic and Byzantine worlds, Mali, Great Zimbabwe, pre-contact Americas and Polynesian societies before European expansion.
- Name conquest, enslavement and genocide accurately. Avoid sensationalism and graphic images; supply content notes where appropriate. Religious history describes communities and institutions without adjudicating belief.
- Identify hypothetical models explicitly, including the workshop, railway, shipping records and final smartphone exercise. They are not archival discoveries, actual corporate supply chains or forecasts.
- Wrong options target misconceptions, and correct slots are evenly distributed across the 80 new questions. Explain reasoning rather than simply repeat the right option.
- The final synthesis returns to the everyday object from the introduction, connecting material resources, labour, information and energy. It does not predict an inevitable future.

## Integration and compatibility

The existing `world-history` subcategory under `history` owns the path; its ID is unchanged. Update its description and register order in `src/utils/lessonPath.ts`. Append new lesson objects to the catalogue rather than reordering its published objects. Every pre-existing lesson, quiz, answer slot and source object remains exact; the 61-object fixture tests this. Pompeii follows the empire lesson; Silk Roads follows the lesson on travelling beliefs.

Existing completions and unfinished attempts remain accessible through the existing access logic. Old results, mistakes and weekly review remain valid. A fresh reader starts with the introduction and unlocks sequentially; completion, including a zero score, unlocks the next step. Existing progress percentages will reflect the larger catalogue.

No dependencies, account schema, analytics events, SQL migrations or daily question-bank edits are required. Architecture and astronomy remain unchanged. Local diagrams use literal asset registrations and the existing image zoom flow. Their lookup keys combine a real research page URL with a `#gnosi-diagram-...` fragment; that string is an asset key, not a remote bitmap endpoint. Do not remove registrations or PNGs.

## Verification

Passed: content validation for 81 lessons; new 22-step progression including all 88 checkpoints, completion guards, zero-score unlocks and offline restart; exact preservation of 61 old lesson objects; old resume, results, mistakes and weekly eligibility; existing architecture and astronomy tests; reader boundaries/source retention/content notes; article-image and bundled-image checks; image-zoom tests; learning backup and automatic-sync tests; daily bank and daily challenge tests (109 questions).

The changed TS/CJS sources passed focused ESLint checks. Active app TypeScript (`src`, `App.tsx`, `index.ts`) passed. The unscoped project typecheck encounters a pre-existing extracted update under `assets/gnosi-bookmarks-update-root/`, whose standalone source files have unresolved relative imports. That archive copy is unrelated to this patch; it was excluded only from the temporary verification config and is not deleted or reconfigured by this update. The original project does not define a lint script; focused ESLint was run using temporary tooling without changing package dependencies.

All 20 generated diagrams were decoded, checked for readable layout and inspected in a contact sheet. UI tests mock native views. An Android/iPhone read-through, source-link opening and image zoom in airplane mode remain device QA, not completed checks. Source pages were consulted via institutional sites and search; dynamic databases and some archive endpoints may need interactive access. No claim is made that every linked site is always available.

## On-device check

1. Open Ιστορία → Παγκόσμια ιστορία; confirm the introduction comes first and there are 22 steps.
2. Read the introduction and answer all four questions. Confirm that the following lesson unlocks, then leave midway and check resume after restarting.
3. Confirm previously completed Pompeii and unfinished Silk Roads attempts are still available with their earlier answers/results.
4. Open a new diagram, zoom, rotate and close. Repeat in airplane mode after the update is bundled.
5. Check content notes, sources and large text; complete a lesson with mistakes and verify practice/results.

## Lesson sequence and sources

| Step | Lesson | Status |
| --- | --- | --- |
| 1 | Εισαγωγή στην παγκόσμια ιστορία | New |
| 2 | Πριν από την ιστορία: σύμπαν και Γη | New |
| 3 | Η ζωή αλλάζει τον πλανήτη | New |
| 4 | Άνθρωποι σε έναν ήδη ζωντανό κόσμο | New |
| 5 | Όταν αρχίσαμε να παράγουμε τροφή | New |
| 6 | Πόλεις, κράτη και τα πρώτα αρχεία | New |
| 7 | Χαλκός, πλοία και εύθραυστα δίκτυα | New |
| 8 | Αυτοκρατορίες: η κατάκτηση δεν αρκεί | New |
| 9 | Η ζωή στους δρόμους της Πομπηίας | Existing — preserved |
| 10 | Ιδέες και θρησκείες που ταξιδεύουν | New |
| 11 | Οι Δρόμοι του Μεταξιού μετέφεραν και ιδέες | Existing — preserved |
| 12 | Μετά τη Ρώμη, πολλοί συνδεδεμένοι κόσμοι | New |
| 13 | Αφρική, Αμερικές και Ειρηνικός: πολλαπλά κέντρα | New |
| 14 | Μογγόλοι και πανώλη: η άλλη όψη της σύνδεσης | New |
| 15 | Ωκεανοί που συνδέουν και κατακτήσεις που χωρίζουν | New |
| 16 | Ατλαντική δουλεία: άνθρωποι πίσω από τα κατάστιχα | New |
| 17 | Ιδέες, επαναστάσεις και τα όρια των δικαιωμάτων | New |
| 18 | Βιομηχανία: όταν άλλαξε η κλίμακα της ενέργειας | New |
| 19 | Αυτοκρατορική επέκταση και αντίσταση | New |
| 20 | Παγκόσμιοι πόλεμοι: αφορμές, επιλογές και μαζική βία | New |
| 21 | Ψυχρός Πόλεμος και αποαποικιοποίηση | New |
| 22 | Ο κόσμος στην τσέπη σου: μια τελική σύνθεση | New |

### Εισαγωγή στην παγκόσμια ιστορία

- [Introduction to Human Evolution](https://humanorigins.si.edu/education/introduction-human-evolution) — Smithsonian
- [The Origins of Writing](https://www.metmuseum.org/essays/the-origins-of-writing) — The Metropolitan Museum of Art
- [Δομική έμπνευση, όχι πηγή τεκμηρίωσης: history of the entire world, i guess](https://www.youtube.com/watch?v=xuCn8ux2gbs) — bill wurtz

### Πριν από την ιστορία: σύμπαν και Γη

- [The Big Bang](https://science.nasa.gov/universe/the-big-bang/) — NASA Science
- [Facts About Earth](https://science.nasa.gov/earth/facts/) — NASA Science

### Η ζωή αλλάζει τον πλανήτη

- [The origin of life on Earth](https://www.nhm.ac.uk/discover/origin-of-life-on-earth.html) — Natural History Museum
- [Facts About Earth](https://science.nasa.gov/earth/facts/) — NASA Science
- [What killed the dinosaurs?](https://www.nhm.ac.uk/discover/dinosaur-extinction.html) — Natural History Museum
- [The Great Oxygenation Event as a consequence of ecological dynamics modulated by planetary change](https://www.nature.com/articles/s41467-021-23286-7) — Nature Communications — primary research

### Άνθρωποι σε έναν ήδη ζωντανό κόσμο

- [Human Evolution](https://naturalhistory.si.edu/education/teaching-resources/anthropology-and-social-studies/human-evolution) — Smithsonian
- [Introduction to Human Evolution](https://humanorigins.si.edu/education/introduction-human-evolution) — Smithsonian
- [Homo sapiens](https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens) — Smithsonian Human Origins Program

### Όταν αρχίσαμε να παράγουμε τροφή

- [Humans Change the World](https://humanorigins.si.edu/human-characteristics/humans-change-world) — Smithsonian
- [Human Evolution](https://naturalhistory.si.edu/education/teaching-resources/anthropology-and-social-studies/human-evolution) — Smithsonian

### Πόλεις, κράτη και τα πρώτα αρχεία

- [The Origins of Writing](https://www.metmuseum.org/essays/the-origins-of-writing) — The Metropolitan Museum of Art
- [Humans Change the World](https://humanorigins.si.edu/human-characteristics/humans-change-world) — Smithsonian

### Χαλκός, πλοία και εύθραυστα δίκτυα

- [Uluburun](https://mass.cultureelerfgoed.nl/uluburun) — Cultural Heritage Agency of the Netherlands
- [Shang and Zhou Dynasties: The Bronze Age of China](https://www.metmuseum.org/essays/shang-and-zhou-dynasties-the-bronze-age-of-china) — The Metropolitan Museum of Art
- [Severe multi-year drought coincident with Hittite collapse around 1198–1196 BC](https://www.nature.com/articles/s41586-022-05693-y) — Nature — primary research

### Αυτοκρατορίες: η κατάκτηση δεν αρκεί

- [The Achaemenid Persian Empire (550–330 B.C.)](https://www.metmuseum.org/essays/the-achaemenid-persian-empire-550-330-b-c) — The Metropolitan Museum of Art
- [Han dynasty (206 BCE–220 CE)](https://asia.si.edu/education/educator-resources/teaching-china-with-the-smithsonian/explore-by-dynasty/han-dynasty/) — Smithsonian National Museum of Asian Art
- [Trade Routes between Europe and Asia during Antiquity](https://www.metmuseum.org/essays/trade-routes-between-europe-and-asia-during-antiquity) — The Metropolitan Museum of Art
- [Art of the Hellenistic Age and the Hellenistic Tradition](https://www.metmuseum.org/essays/art-of-the-hellenistic-age-and-the-hellenistic-tradition) — The Metropolitan Museum of Art

### Η ζωή στους δρόμους της Πομπηίας

- [Along the streets of Pompeii](https://pompeiisites.org/en/pompeii-map/analysis/along-the-streets-of-pompeii/) — Pompeii Archaeological Park
- [The daily Pompeii](https://pompeiisites.org/en/the-daily-pompeii/) — Pompeii Archaeological Park
- [Pompeii after the eruption](https://pompeiisites.org/en/pompeii-map/analysis/pompeii-after-the-eruption/) — Pompeii Archaeological Park

### Ιδέες και θρησκείες που ταξιδεύουν

- [World Religions Prior to 1450](https://www.oerproject.com/OER-Materials/OER-Media/HTML-Articles/Origins/Unit4/World-Religions-Before-c-1450/1140L) — OER Project
- [Buddhism and Buddhist Art](https://www.metmuseum.org/essays/buddhism-and-buddhist-art) — The Metropolitan Museum of Art
- [The Birth of Islam](https://www.metmuseum.org/essays/the-birth-of-islam) — The Metropolitan Museum of Art

### Οι Δρόμοι του Μεταξιού μετέφεραν και ιδέες

- [About the Silk Roads](https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704) — UNESCO
- [Silk Roads: Chang’an–Tianshan Corridor](https://whc.unesco.org/en/list/1442/) — UNESCO World Heritage Centre

### Μετά τη Ρώμη, πολλοί συνδεδεμένοι κόσμοι

- [About the Silk Roads](https://www.unesco.org/en/silk-roads/about-silk-roads) — UNESCO
- [The Birth of Islam](https://www.metmuseum.org/essays/the-birth-of-islam) — The Metropolitan Museum of Art
- [Trade Routes between Europe and Asia during Antiquity](https://www.metmuseum.org/essays/trade-routes-between-europe-and-asia-during-antiquity) — The Metropolitan Museum of Art
- [Byzantium (ca. 330–1453)](https://www.metmuseum.org/essays/byzantium-ca-330-1453) — The Metropolitan Museum of Art
- [The Art of the Abbasid Period (750–1258)](https://www.metmuseum.org/essays/the-art-of-the-abbasid-period-750-1258) — The Metropolitan Museum of Art

### Αφρική, Αμερικές και Ειρηνικός: πολλαπλά κέντρα

- [The Empire of Mali](https://discovery.ucl.ac.uk/id/eprint/10070150/) — UCL / Oxford Research Encyclopedia
- [Great Zimbabwe](https://www.metmuseum.org/essays/great-zimbabwe) — The Metropolitan Museum of Art
- [Pre-Contact America](https://www.loc.gov/exhibits/exploring-the-early-americas/precontact-america.html) — Library of Congress
- [Rapa Nui National Park](https://whc.unesco.org/en/list/715) — UNESCO World Heritage Centre

### Μογγόλοι και πανώλη: η άλλη όψη της σύνδεσης

- [The Legacy of Genghis Khan](https://www.metmuseum.org/essays/the-legacy-of-genghis-khan) — The Metropolitan Museum of Art
- [The Great Pestilence in London](https://www.londonmuseum.org.uk/collections/london-stories/great-pestilence-london/) — London Museum
- [Plague in Medieval Cambridge](https://www.arch.cam.ac.uk/news/plague-medieval-cambridge) — University of Cambridge

### Ωκεανοί που συνδέουν και κατακτήσεις που χωρίζουν

- [1492: An Ongoing Voyage](https://www.loc.gov/exhibits/1492/) — Library of Congress
- [About the Silk Roads](https://www.unesco.org/en/silk-roads/about-silk-roads) — UNESCO
- [Pre-Contact America](https://www.loc.gov/exhibits/exploring-the-early-americas/precontact-america.html) — Library of Congress

### Ατλαντική δουλεία: άνθρωποι πίσω από τα κατάστιχα

- [Trans-Atlantic Slave Trade — Estimates](https://www.slavevoyages.org/assessment/estimates) — SlaveVoyages
- [The Transatlantic Slave Trade Database](https://www.neh.gov/project/transatlantic-slave-trade-database) — National Endowment for the Humanities
- [National History Park – Citadel, Sans Souci, Ramiers](https://whc.unesco.org/en/list/180) — UNESCO World Heritage Centre

### Ιδέες, επαναστάσεις και τα όρια των δικαιωμάτων

- [The Declaration of the Rights of Man and of the Citizen](https://www.elysee.fr/en/french-presidency/the-declaration-of-the-rights-of-man-and-of-the-citizen) — Élysée / Archives nationales
- [National History Park – Citadel, Sans Souci, Ramiers](https://whc.unesco.org/en/list/180) — UNESCO World Heritage Centre
- [Haitian Revolution — Declaration of Independence](https://sites.duke.edu/haitilab/english/haitian-revolution/) — Duke University Haiti Lab
- [The History of Printing in Asia — Part 1](https://blogs.loc.gov/international-collections/2021/06/the-history-of-printing-in-asia-according-to-library-of-congress-asian-collections-part-1/) — Library of Congress

### Βιομηχανία: όταν άλλαξε η κλίμακα της ενέργειας

- [Newcomen Atmospheric Engine](https://collection.sciencemuseumgroup.org.uk/objects/co50900/newcomen-atmospheric-engine-atmospheric-steam-engine) — Science Museum Group
- [Industrial Revolution Defining Moments, 1750–1914](https://digital-classroom.nma.gov.au/learning-modules/industrial-revolution-defining-moments-1750-1914/11-introduction) — National Museum of Australia
- [Causes of Climate Change](https://science.nasa.gov/climate-change/causes/) — NASA Science

### Αυτοκρατορική επέκταση και αντίσταση

- [Empires: power, resistance, legacies — Resistance](https://www.open.edu/openlearn/mod/oucontent/view.php?id=142149&section=1) — The Open University
- [Decolonization](https://www.un.org/en/global-issues/decolonization) — United Nations

### Παγκόσμιοι πόλεμοι: αφορμές, επιλογές και μαζική βία

- [War Begins in Europe](https://www.warmuseum.ca/firstworldwar/history/going-to-war/origins-and-early-phases/war-begins-in-europe/) — Canadian War Museum
- [Second World War](https://www.nam.ac.uk/explore/second-world-war) — National Army Museum
- [Introduction to the Holocaust](https://encyclopedia.ushmm.org/content/en/article/introduction-to-the-holocaust) — United States Holocaust Memorial Museum
- [History of the United Nations](https://www.un.org/about-us/history-of-the-un) — United Nations

### Ψυχρός Πόλεμος και αποαποικιοποίηση

- [Cold War on File](https://www.nationalarchives.gov.uk/education/teaching-resources/cold-war-wartime-alliance-and-iron-curtain/) — The National Archives
- [Decolonization](https://www.un.org/en/global-issues/decolonization) — United Nations
- [History of the United Nations](https://www.un.org/about-us/history-of-the-un) — United Nations
- [Independence and Partition, 1947](https://www.nam.ac.uk/explore/independence-and-partition-1947) — National Army Museum
- [The Cold War — Primary Source Timeline](https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/post-war-united-states-1945-1968/cold-war/) — Library of Congress

### Ο κόσμος στην τσέπη σου: μια τελική σύνθεση

- [The birth of the Web](https://home.cern/science/computing/the-birth-of-the-web) — CERN
- [Causes of Climate Change](https://science.nasa.gov/climate-change/causes/) — NASA Science
- [Trade Routes between Europe and Asia during Antiquity](https://www.metmuseum.org/essays/trade-routes-between-europe-and-asia-during-antiquity) — The Metropolitan Museum of Art

