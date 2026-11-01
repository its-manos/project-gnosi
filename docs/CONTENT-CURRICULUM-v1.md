# ΓΝΩΣΗ — Content Curriculum v1.0
Status: curriculum plan with Integrated Ancient Greece lessons 1–2 · 2026-11-01 · not device-validated

## 1. Editorial philosophy

**University-level curiosity, everyday accessibility.** Gnosi offers Greek-language, evidence-led, curiosity-first learning journeys for non-specialist adults. The goal is not a catalogue of disconnected trivia and not a shortened university textbook. Each lesson should answer a compelling question, explain *why* the answer matters, give the learner a concrete mental model, and test understanding rather than recall alone.

**No arbitrary lesson cap.** Learning-path length is determined by meaningful learning objectives, conceptual prerequisites, source availability, and distinct material. A compact path might have 4–7 lessons; another might have 15–30 or more. These are illustrative shapes, never quotas or caps. Chapters break long paths into approachable milestones, and paths can grow over time. Avoid padding a path with repetitive material.

**Approach:** use university introductory course syllabi to identify concepts and prerequisite order; rewrite the structure into curiosity-driven micro-lessons (normally ~3–5 minutes); establish reliable primary or institutional sources; create original Greek explanations with familiar Greek examples where useful; include credited images/diagrams and meaningful reasoning checks. Do not reproduce lecture text or assume course-media rights.

**Content distinctions:**
- Category: broad world shown on the map.
- Subcategory / learning path: coherent sequence with a clear promise.
- Chapter: editorial group of related lessons and an optional mastery checkpoint.
- Lesson: one specific question, one focused set of concepts, integrated checks.
- Collection: optional cross-category theme linking existing lessons without duplicating content.

## 2. Verified repository baseline

Audited on `main` (2026-10-31) using `src/data/lessons.ts`, `additionalLessons.ts`, `catalogueExpansion.ts`, `architectureLessons.ts`, `astronomyLessons.ts`, and `worldHistoryLessons.ts`. These six sources assemble 81 lesson definitions across 22 subcategories and seven categories. Counts exclude stand-alone daily challenge questions. Do not interpret lesson count as a quality score.

| Existing category | Existing subcategory (current id) | Lessons |
| --- | --- | ---: |
| Ιστορία | Αρχαία Ελλάδα (`ancient-greece`) | 4 |
| Ιστορία | Παγκόσμια ιστορία (`world-history`) | 22 |
| Ιστορία | Μυθολογία (`mythology`) | 1 |
| Επιστήμη & Διάστημα | Αστρονομία & Διάστημα (`space`) | 11 |
| Επιστήμη & Διάστημα | Ανθρώπινο σώμα (`human-body`) | 2 |
| Επιστήμη & Διάστημα | Φυσική (`physics`) | 2 |
| Φύση & Ζώα | Άγρια ζωή (`wildlife`) | 2 |
| Φύση & Ζώα | Θαλάσσια ζωή (`oceans`) | 3 |
| Φύση & Ζώα | Οικοσυστήματα (`ecosystems`) | 2 |
| Τεχνολογία | Τεχνητή νοημοσύνη (`artificial-intelligence`) | 2 |
| Τεχνολογία | Διαδίκτυο (`internet`) | 3 |
| Τεχνολογία | Εφευρέσεις (`inventions`) | 2 |
| Τέχνες & Πολιτισμός | Εικαστικές τέχνες (`visual-arts`) | 2 |
| Τέχνες & Πολιτισμός | Μουσική (`music`) | 2 |
| Τέχνες & Πολιτισμός | Κινηματογράφος (`cinema`) | 2 |
| Τέχνες & Πολιτισμός | Αρχιτεκτονική (`architecture`) | 8 |
| Γεωγραφία & Κοινωνία | Χώρες του κόσμου (`countries`) | 2 |
| Γεωγραφία & Κοινωνία | Παράξενα μέρη (`unusual-places`) | 2 |
| Γεωγραφία & Κοινωνία | Κοινωνίες (`societies`) | 2 |
| Ταμπού της Ιστορίας | Γενοκτονίες & μνήμη (`genocide-memory`) | 1 |
| Ταμπού της Ιστορίας | Αποικιοκρατία & δουλεία (`colonialism-slavery`) | 2 |
| Ταμπού της Ιστορίας | Εξουσία & αποκλεισμός (`power-exclusion`) | 2 |
| **Total** | **22 existing subcategories** | **81** |

**What to preserve:** long-form paths in world history (22), astronomy (11) and architecture (8); stable lesson ids, quiz compatibility keys, source and image-credit fields, and current progress state. Do not move or rewrite a live lesson simply to fit a new catalogue; first use explicit cross-links and audit compatibility.

## 3. Editorial roadmap: 18 proposed NEW paths

Counts below are *initial scoping estimates*, not lesson limits. Priority P0 = pilot, P1 = next strong candidates, P2 = later exploration. The proposed subcategories are not yet implemented.

| Category | Proposed subcategory · suggested id | Scope idea | Tentative shape | Priority |
| --- | --- | --- | --- | --- |
| Ιστορία | Η καθημερινή ζωή στο παρελθόν · `daily-life-history` | Work, food, hygiene, households, social differences across eras | 12–20 | P2 |
| Ιστορία | Επιδημίες που άλλαξαν τον κόσμο · `epidemics-history` | How epidemics spread and changed society, state, labor, medicine | 12–18 | P2 |
| Ιστορία | Αρχαιολογία: διαβάζοντας το παρελθόν · `archaeology-methods` | Excavation, dating, writing, evidence, uncertainty and looting | 16–24 | P1 |
| Επιστήμη & Διάστημα | Εγκέφαλος και ψευδαισθήσεις · `brain-perception` | Vision, attention, memory, perceptual inference | 18 planned now | P0 |
| Επιστήμη & Διάστημα | Γεωλογία και η κρυμμένη Γη · `geology-hidden-earth` | Rocks, geologic time, plate tectonics, hazards and Greek landscapes | 24 planned now | P0 |
| Επιστήμη & Διάστημα | Η επιστήμη των τροφίμων · `food-science` | Flavor, fermentation, cooking chemistry, food safety | 14–22 | P2 |
| Φύση & Ζώα | Η νοημοσύνη των ζώων · `animal-cognition` | Problem-solving, learning, communication, cognition tests | 14–20 | P1 |
| Φύση & Ζώα | Παράξενοι μηχανισμοί της εξέλιξης · `evolution-adaptations` | Selection, convergence, sexual selection, trade-offs and evidence | 16–24 | P2 |
| Φύση & Ζώα | Ο αόρατος ζωντανός κόσμος · `microbial-world` | Microbes, fungi, symbiosis, soils and the microbiome | 14–22 | P2 |
| Τεχνολογία | Ψηφιακή εγκληματολογία · `digital-forensics` | Metadata, timestamps, evidence handling and digital traces | 12–18 | P1 |
| Τεχνολογία | Η αόρατη τεχνολογία γύρω μας · `hidden-infrastructure` | GPS, payments, power grids, water networks and logistics | 16–24 | P2 |
| Τεχνολογία | Υλικά που άλλαξαν τον κόσμο · `materials-science` | Concrete, glass, semiconductors, polymers and failure | 14–20 | P2 |
| Τέχνες & Πολιτισμός | Γλωσσολογία: τα μυστικά της γλώσσας · `linguistics` | Sounds, grammar, meaning, dialects, language change | 18–26 | P1 |
| Τέχνες & Πολιτισμός | Σύμβολα και η γλώσσα των εικόνων · `visual-symbols` | How imagery, composition and convention create meaning | 12–18 | P2 |
| Τέχνες & Πολιτισμός | Η φωτογραφία αλλάζει την πραγματικότητα · `photography-language` | Optics, composition, editing, documentation, manipulation | 12–18 | P2 |
| Γεωγραφία & Κοινωνία | Πώς λειτουργούν οι πόλεις · `urban-systems` | Transport, water, housing, waste, zoning and urban trade-offs | 16–24 | P1 |
| Γεωγραφία & Κοινωνία | Ψυχολογία των αποφάσεων · `decision-psychology` | Probability, heuristics, framing, risk, group choice | 18–26 | P1 |
| Γεωγραφία & Κοινωνία | Ανθρωπολογία της καθημερινότητας · `everyday-anthropology` | Rituals, kinship, exchange, culture and field methods | 16–24 | P2 |

**Special handling for Ταμπού της Ιστορίας:** deepen existing subcategories rather than adding sensational or overlapping new ones. Carefully planned, sourced paths could develop into 12+ lessons each, but only where evidence and sensitive presentation justify the scope.

## 4. Existing paths to deepen rather than duplicate

| Existing path | Proposed extension direction | Why |
| --- | --- | --- |
| `human-body` | Sleep, chronobiology, senses, nervous system, microbiome basics | Already contains a sleep-and-memory lesson |
| `wildlife` | Ecology and field observations; connect to animal cognition path | Already contains an octopus cognition lesson |
| `music` | Acoustic science, rhythm, harmony, emotion and cultural listening | Already contains jazz and blues material; physics also includes sound |
| `cinema` | Editing, sound design, cinematography, documentary ethics | Already includes montage and Foley |
| `internet` | Routing, protocols, encryption, DNS, internet infrastructure | Already covers caching and public keys |
| `physics` | Optics, energy, acoustics, motion and everyday phenomena | Existing sound and sky-color lessons |
| `mythology` | Comparative myth, evidence, ritual, narrative without claiming literal historicity | Currently 1 lesson |
| `genocide-memory` / `colonialism-slavery` / `power-exclusion` | Source criticism, survivor perspectives, institutions, historical complexity | Require particular care and editorial review |

**Duplication boundaries:** perception is not the same as decision psychology; archaeology focuses on *methods of knowing*, not re-narrating Greek history; geology focuses on Earth systems, not another list of unusual places; urban systems teach infrastructure and trade-offs, not country facts. Existing live lessons may be recommended from new paths without changing their ids or previous progress.

## 5. Pilot A — Εγκέφαλος και ψευδαισθήσεις

Proposed id: `brain-perception`. Parent: `science`. Intended outcome: learners distinguish sensory input from interpretation, explain limits of attention/memory, and assess claims about perception cautiously.

**Chapter I — Πώς φτιάχνεται αυτό που βλέπουμε (5)**
1. Γιατί τα μάτια δεν είναι κάμερες;
2. Τι συμβαίνει στο τυφλό σημείο;
3. Γιατί αλλάζει ένα χρώμα ανάλογα με το φόντο;
4. Πώς καταλαβαίνουμε το βάθος από δύο εικόνες;
5. Πότε βλέπουμε πρώτα το σύνολο και μετά τις λεπτομέρειες;

**Chapter II — Όσα η προσοχή αφήνει έξω (4)**
6. Γιατί δεν προσέχουμε κάτι που βρίσκεται μπροστά μας;
7. Πώς οι προσδοκίες αλλάζουν όσα αντιλαμβανόμαστε;
8. Μπορούμε πραγματικά να κάνουμε δύο πράγματα ταυτόχρονα;
9. Πώς συμπληρώνει ο εγκέφαλος τα κενά;

**Chapter III — Η μνήμη δεν είναι βίντεο (5)**
10. Πώς δημιουργείται μια ανάμνηση;
11. Γιατί ξεχνάμε ένα όνομα που γνωρίζουμε;
12. Μπορεί μια ανάμνηση να είναι ειλικρινής αλλά λανθασμένη;
13. Γιατί αλλάζει η ιστορία όταν την ξαναθυμόμαστε;
14. Πόσο προσεκτικά πρέπει να αξιολογούμε μια μαρτυρία;

**Chapter IV — Η αντίληψη στην καθημερινή ζωή (4)**
15. Γιατί η βεβαιότητα δεν εγγυάται την ακρίβεια;
16. Πώς σχεδιάζεται μια πινακίδα που διαβάζεται με μια ματιά;
17. Πώς μπορούν οι εικόνες να δημιουργήσουν παραπλανητικές εντυπώσεις;
18. Τι σημαίνει τελικά «βλέπω»; — synthesis activity.

**Suggested interactions:** blind-spot demonstration with safe on-screen instructions; same-color/different-context visual; attention prediction; sequential recall exercise; compare two signage layouts. Do not imply optical illusions prove that reality is fake, and distinguish experimental results from contested extrapolations.

**Course inspiration:** MIT 9.00SC Introduction to Psychology, Yale PSYC 110. Both cover perception, cognition, memory and research methods; they do not supply lesson text to copy.

## 6. Pilot B — Γεωλογία και η κρυμμένη Γη

Proposed id: `geology-hidden-earth`. Parent: `science`. Intended outcome: learners explain what geological evidence tells us, interpret basic maps and changes over time, and distinguish earthquake forecasting from risk assessment.

**Chapter I — Μαθαίνουμε να διαβάζουμε τη Γη (5)**
1. Εισαγωγή: τι μπορεί να μας πει μια πέτρα;
2. Τι είναι πραγματικά ένα πέτρωμα;
3. Γιατί τα πετρώματα αλλάζουν μορφή;
4. Πώς μετράμε χρόνο εκατομμυρίων ετών;
5. Πώς γίνονται τα απολιθώματα γεωλογικά στοιχεία;

**Chapter II — Ένας πλανήτης που κινείται (7)**
6. Τι είναι οι τεκτονικές πλάκες;
7. Γιατί γεννιούνται και χάνονται ωκεανοί;
8. Πώς υψώνονται βουνά;
9. Τι είναι ένα ρήγμα και πώς κινείται;
10. Τι προκαλεί πραγματικά έναν σεισμό;
11. Γιατί η Ελλάδα έχει τόσο πολλούς σεισμούς;
12. Γιατί δεν σχετίζονται όλοι οι σεισμοί με ηφαίστεια;

**Chapter III — Το τοπίο δεν μένει ποτέ ίδιο (6)**
13. Πώς ένα ποτάμι μετακινεί ολόκληρα τοπία;
14. Πώς το νερό ανοίγει σπήλαια μέσα στον βράχο;
15. Γιατί οι ακτές υποχωρούν ή μεγαλώνουν;
16. Τι αφήνουν πίσω τους οι παγετώνες;
17. Πώς σχηματίστηκε το σημερινό Αιγαίο;
18. Πώς βρίσκουν οι γεωλόγοι ίχνη παλαιότερων κλιμάτων;

**Chapter IV — Γεωλογικοί ντετέκτιβ (6)**
19. Πώς διαβάζουμε έναν γεωλογικό χάρτη;
20. Πού βρίσκεται το νερό κάτω από το έδαφος;
21. Γιατί εμφανίζονται ξαφνικά καταβόθρες;
22. Πώς χαρτογραφούμε φυσικούς κινδύνους;
23. Γιατί δεν μπορούμε να προβλέψουμε με ακρίβεια τον επόμενο σεισμό;
24. Διάβασε ένα ελληνικό τοπίο από τα στοιχεία του — synthesis activity.

**Suggested interactions:** rock-identification visual with explicitly stated ambiguity; order geological strata; drag layers of a fault diagram; interpret a simplified Greece tectonic map; distinguish hazard from risk in two scenarios. Avoid promising earthquake prediction, individual safety advice or unsourced claims about local hazards.

**Course inspiration:** MIT 12.001 Introduction to Geology, especially geologic time, mineral/rock identification, tectonics, earthquakes, rivers, glaciers and field interpretation.

## 7. Candidate chapter arcs for the other 16 proposed paths

Each line is a **chapter concept** rather than a fixed list of lessons. Detailed lesson outlines are the next editorial expansion.

| Path | Suggested sequence |
| --- | --- |
| Καθημερινή ζωή στο παρελθόν | Σπίτι και οικογένεια → εργασία και εμπόριο → φαγητό και υγιεινή → ανισότητες και αλλαγές |
| Επιδημίες που άλλαξαν τον κόσμο | Πώς μεταδίδεται μια ασθένεια → ιστορικές επιδημίες → κοινωνικές αντιδράσεις → δημόσια υγεία και πηγές |
| Αρχαιολογία | Τι είναι τεκμήριο → ανασκαφή και στρώματα → χρονολόγηση → γραφές και αντικείμενα → διλήμματα και ερμηνείες |
| Επιστήμη τροφίμων | Γεύση και όσφρηση → θερμότητα και μεταβολές → ζύμωση → συντήρηση και ασφάλεια |
| Νοημοσύνη ζώων | Πώς ελέγχουμε τη νοημοσύνη → μάθηση και εργαλεία → επικοινωνία → διαφορετικά μυαλά → όρια των ισχυρισμών |
| Εξέλιξη | Επιλογή → γενετική ποικιλότητα → συγκλίνουσα εξέλιξη → συμβιβασμοί → παραδείγματα |
| Αόρατος κόσμος | Βακτήρια και αρχαία ζωή → μύκητες και συμβίωση → μικροοικοσυστήματα → άνθρωπος και μικρόβια |
| Ψηφιακή εγκληματολογία | Ψηφιακά ίχνη → μεταδεδομένα → χρονικές γραμμές → αυθεντικότητα στοιχείων → δεοντολογία |
| Αόρατη τεχνολογία | Τι κρύβεται πίσω από καθημερινή πράξη → δίκτυα → ενέργεια → πληρωμές και μεταφορές → βλάβες και ανθεκτικότητα |
| Επιστήμη υλικών | Ατομική δομή → ιδιότητες → καθημερινά υλικά → μικροηλεκτρονική → γιατί αποτυγχάνει μια κατασκευή |
| Γλωσσολογία | Ήχοι → λέξεις → προτάσεις → νόημα → γλωσσική αλλαγή → διάλεκτοι → γραφή και μάθηση γλώσσας |
| Σύμβολα εικόνων | Οπτικές συμβάσεις → σύμβολα στον χρόνο → τέχνη και εξουσία → ερμηνεία με ιστορικά στοιχεία |
| Γλώσσα φωτογραφίας | Φως και φακός → σύνθεση → επιλεγμένο κάδρο → επεξεργασία → φωτογραφία ως μαρτυρία |
| Αστικά συστήματα | Γιατί υπάρχουν πόλεις → νερό και απόβλητα → μετακινήσεις → κατοικία και πυκνότητα → κλίμα και σχεδιασμός |
| Ψυχολογία αποφάσεων | Πιθανότητες και αβεβαιότητα → γνωστικές ευρετικές → ρίσκο και πλαίσιο → κοινωνικές αποφάσεις → κριτική εφαρμογή |
| Ανθρωπολογία | Παρατήρηση και τεκμηρίωση → συγγένεια και δίκτυα → τελετουργίες → ανταλλαγές → σύγχρονες κοινωνίες |

## 8. How to build and publish without overwhelming the app

1. **Editorial inventory:** current lesson id, title, subcategory, concepts, evidence/sources, image rights, questions, duplicate-risk flag, path fit.
2. **Define the promise:** what the learner can explain at the end of the path, and 3–6 chapter outcomes.
3. **Course-inspired source map:** one introductory syllabus for prerequisite logic, plus institutional or peer-reviewed sources for *every substantive claim*. Cross-check contested claims.
4. **Write question-first titles:** aim for surprising, answerable and specific. Avoid empty clickbait and sensationalism.
5. **Draft one chapter at a time:** typically 3–7 lessons per release batch, but no quota. Longer paths need visible milestones, not a harder lockout.
6. **Integrate four high-quality reasoning checks when the current UI expects four, spaced through reading.** Use explanations that teach; avoid trivially removable distractors or repetitive recall. Keep all quiz/progress keys stable for existing users.
7. **Include visuals and rights:** ideally a high-relevance cover and diagrams when they make the idea clearer; explicit attribution and accurate captions; verify image license before bundling.
8. **Verify in the actual mobile build:** Greek typography, Android/iOS image display, scrolling, offline behavior, question audio/XP, saved progress and resume, completion states.
9. **Measure engagement ethically:** lesson start/completion, first-question drop-off, chapter continuation, question error patterns, revisits. Don't use raw popularity alone as a proxy for educational value.

### Editorial definition of done for each lesson
- One precise curiosity question; clear audience and prerequisite.
- Explanation remains accessible to a non-specialist, with difficult terms introduced only when needed.
- Learner can state at least one new principle, not only a fact.
- Strong source coverage and correct distinction between observation, inference, hypothesis and uncertainty.
- At least one concrete example; relevant picture/diagram with reliable source and credit when useful.
- Good question/explanation pairings; no ambiguity or hidden knowledge requirement.
- No duplicate of an existing lesson, unless explicitly a deeper sequel.
- Reviewed for Greek language quality, sensitive-topic ethics and any changing scientific consensus.

## 9. Suggested future content metadata (planning model, not a migration)

Keep existing `Category`, `Subcategory`, and `Lesson` types unchanged for now. A later optional curriculum planning layer may include:
- `pathId`, `categoryId`, `title`, `status` (proposed/drafting/review/ready/published)
- `promise`, `prerequisitePathIds`, `sourceSyllabi`, `overlapNotes`
- `chapters[]`: `chapterId`, `title`, `learningOutcomes[]`, `lessonIds[]`, `checkpoint`
- `editorialOwner`, `reviewedAt`, `sourceReviewAt`, `imageLicenseAudit`
- Optional `recommendedNextPaths[]` for non-linear discovery

Separate unpublished editorial metadata from the shipped catalogue. Never expose empty paths to users just to populate the map. Never rename existing published ids without a tested progress migration.

## 10. Next deliverables, in order

**A. Audit and tag the 81 current lessons:** match lessons to learning outcomes, find repeated material, flag unsourced/weakly sourced ideas, and identify potential reuse or cross-links (no automatic moves).

**B. Write Pilot A, chapter I:** five complete Greek lessons with sources, images/licensing, structured questions and evidence-based explanations. Validate the editorial standard on devices.

**C. Write Pilot B, chapter I:** five complete Greek lessons, with an emphasis on diagrams and accessible Greek geographic examples.

**D. Expand remaining chapters:** continue in 3–7 lesson production batches per subject, using chapter-level analytics to select the next most promising path.

**E. Only then implement optional chapter-level progress UI:** retain stable lesson ids and support long paths, resuming and checkpoint mastery. Publishing content does not depend on this UI change.

## 11. Curriculum reference links

- MIT 9.00SC Introduction to Psychology: https://ocw.mit.edu/courses/9-00sc-introduction-to-psychology-fall-2011/pages/syllabus/syllabus/
- Yale PSYC 110 Introduction to Psychology: https://oyc.yale.edu/introduction-psychology/psyc-110
- MIT 12.001 Introduction to Geology: https://ocw.mit.edu/courses/12-001-introduction-to-geology-fall-2013/pages/syllabus/
- MIT 24.900 Introduction to Linguistics (current catalogue): https://catalog.mit.edu/schools/humanities-arts-social-sciences/linguistics-philosophy/
- MIT 4.111 Introduction to Architecture & Environmental Design: https://ocw.mit.edu/courses/4-111-introduction-to-architecture-environmental-design-spring-2014/
- MIT 14.160 Behavioral Economics (advanced inspiration only): https://student.mit.edu/catalog/m14a.html

Reference curricula guide sequencing only; all new Gnosi articles require independent fact verification, original prose, and separately verified media rights.


## 12. Finalized v1 learning path — Ιστορία / Αρχαία Ελλάδα (2026-11-01)

**Editorial decision:** 30 lessons in five chapters. These are planned curriculum entries, not 30 published lessons. The four pre-existing article IDs remain unchanged; only `ancient-athens` has received the research-first rewrite in this session. The pilot begins from an accessible archaeological case study, then establishes chronological and geographic foundations before proceeding into Bronze Age, poleis, conflicts and cultural developments. This opening order is thematic, not an assertion that Classical Athens predates Mycenaean Greece.

**Outcome:** By completion, readers can distinguish successive eras, understand the diversity of Greek-speaking communities, interpret evidence critically, explain institutions and social differences, and recognize how trade, warfare, intellectual activity and Hellenistic change reshaped the Mediterranean. Review sequencing when individual lessons are researched; no arbitrary lesson cap.

### Chapter I. Η πόλη πίσω από τα μνημεία

1. `ancient-athens` — «Η Αθήνα πίσω από τον Παρθενώνα» (existing live ID)
2. `greek-world-not-a-country` — «Ένας ελληνικός κόσμος, όχι ένα κράτος» (research-first Integrated; QA pending)
3. `greek-history-through-evidence` — «Το παρελθόν δεν μιλά με μία φωνή» (Integrated; QA pending)
4. `greek-chronology` — «Από τα ανάκτορα στις πόλεις: οι εποχές της αρχαίας Ελλάδας»
5. `greek-geography-seas` — «Βουνά, όρμοι και άνεμοι: οι δρόμοι του αρχαίου Αιγαίου»

### Chapter II. Πριν από την κλασική Ελλάδα

6. `aegean-bronze-age` — «Το Αιγαίο πριν από τις πόλεις-κράτη»
7. `minoan-crete` — «Η Κρήτη των ανακτόρων»
8. `mycenaean-palaces` — «Ποιος διοικούσε τα μυκηναϊκά ανάκτορα;»
9. `linear-b-decipherment` — «Γραμμική Β: τα μοτίβα που αποκάλυψαν ελληνικά» (existing ID; research-first Integrated, QA pending)
10. `palace-collapse` — «Μετά την κατάρρευση των ανακτόρων»
11. `geometric-greece` — «Αγγεία, τάφοι και νέες κοινότητες»

### Chapter III. Ο κόσμος των πόλεων

12. `rise-of-polis` — «Η γέννηση της πόλης-κράτους»
13. `greek-settlements-networks` — «Από τη Μασσαλία ως τη Μαύρη Θάλασσα»
14. `sparta-society` — «Η Σπάρτη πέρα από τον μύθο του πολεμιστή»
15. `athens-who-voted` — «Ποιοι χωρούσαν στην αθηναϊκή δημοκρατία;» (existing live ID)
16. `athens-law-courts` — «Νόμοι, δικαστήρια και κλήρωση στην Αθήνα»
17. `greek-war-hoplites` — «Ο οπλίτης και η πόλη»
18. `greek-sanctuaries-games` — «Ολυμπία και Δελφοί: κοινά ιερά, διαφορετικές πόλεις»

### Chapter IV. Πόλεμος, εξουσία και μεταβολές

19. `persian-wars-greek-world` — «Οι Περσικοί πόλεμοι μέσα από δύο κόσμους»
20. `athenian-empire` — «Πώς μια συμμαχία έγινε αθηναϊκή ηγεμονία»
21. `peloponnesian-war` — «Ο πόλεμος που άλλαξε τον ελληνικό κόσμο»
22. `greek-crises-fourth-century` — «Μετά την αθηναϊκή ήττα: μια ασταθής ισορροπία»
23. `macedon-philip` — «Η άνοδος της Μακεδονίας»
24. `alexander-conquests-context` — «Ο Αλέξανδρος, οι εκστρατείες και οι πηγές»

### Chapter V. Ιδέες, τέχνη και κληρονομιές

25. `greek-stage-tragedy` — «Το θέατρο ως δημόσια εμπειρία»
26. `greek-philosophy-in-context` — «Φιλοσοφία στους δρόμους και στις σχολές»
27. `greek-science-knowledge` — «Οι αρχαίοι ερευνητές και τα όρια της γνώσης»
28. `greek-images-sculpture` — «Αγάλματα με χρώματα και ιστορίες»
29. `hellenistic-kingdoms-cities` — «Μετά τον Αλέξανδρο: ένας κόσμος πολλών βασιλείων»
30. `antikythera-gears` — «Ένας ουρανός μέσα σε γρανάζια» (existing live ID)

### Educational boundaries and overlap map

- `ancient-athens`: household archaeology, distinct building phases, everyday work and evidence limits. Do **not** retell detailed democratic institutions, the Linear B decipherment or the Antikythera mechanism here.
- `greek-world-not-a-country`: definitions, dispersed communities, regional diversity; reserve geography specifics for `greek-geography-seas` and polis institutions for `rise-of-polis`.
- `greek-history-through-evidence`: historians' sources and their biases; archaeological techniques in depth belong to proposed `archaeology-methods`.
- `linear-b-decipherment`: revised existing article; Bennett’s sign classification, Kober’s inflectional grids, Ventris’s 1952 predictions, Chadwick’s philology, new PY Ta 641 test and translation limits. Palace administration stays in `mycenaean-palaces`; destruction in `palace-collapse`; alphabetic developments in `geometric-greece`; generic excavation methods in `archaeology-methods`.
- `athens-who-voted`: retain the existing article as the primary home for franchise limits; `athens-law-courts` goes deeper into procedure, not franchise recap.
- `antikythera-gears`: preserve existing article as the technical case study; `greek-science-knowledge` treats broader traditions without re-explaining gears.
- `world-history`: provides global and comparative framing. Avoid reusing whole narratives about world empires, Mediterranean networks or major developments already covered there.
- `mythology`: myth is studied as tradition, interpretation and ritual; never replace historical evidence with mythology. `difficult-history`: slavery, coercion and exclusion must be accurately acknowledged, but the detailed specialist treatment belongs in its own paths.

**Integrated in this branch (2026-11-01):** Lesson 2 `greek-world-not-a-country` — «Ένας ελληνικός κόσμος, όχι ένα κράτος», using a comparative map and a contextual Herodotus passage (not a second household case study). [Research and media/QA record](greek-world-not-a-country-research.md). The 30-lesson planned count is unchanged; only five Ancient Greece lessons currently exist in app code. **Next to research, NOT started:** lesson 3 `greek-history-through-evidence` — «Ποιος μας αφηγείται την αρχαία ιστορία;». Do not claim lesson 1 or 2 as Validated before local/device checks.

**Course-level inspiration to consult:** Yale [Introduction to Ancient Greek History](https://oyc.yale.edu/classics/clcv-205); Met Museum [Greek Art chronological essays](https://www.metmuseum.org/toah/hd/grlg/hd_grlg.htm); Cambridge Mycenaean Epigraphy Group. These inform sequence but are not substitutes for claim-specific sources.

### Editorial session note — 2026-11-01 / Ancient Greece lesson 2
- The **planned** curriculum remains **30** lessons in five chapters; **five** Ancient Greece lessons are now in the app (four originals plus lesson 2).
- Lesson 2 `greek-world-not-a-country` is **Integrated** under final title «Ένας ελληνικός κόσμος, όχι ένα κράτος». See [research/media audit](greek-world-not-a-country-research.md). Article is about diversity of belonging, language, religious connections and the modern nation-state anachronism, not about House Θ or the mechanics of settlement founding.
- Lesson 1 is still Integrated, not Validated. Lesson 2 is Integrated, not Validated. Device/npm/editorial acceptance remains to be recorded.
- **Next in line (do not draft now):** lesson 3 `greek-history-through-evidence` — «Ποιος μας αφηγείται την αρχαία ιστορία;».

### Editorial session note — 2026-11-01 / Ancient Greece lesson 3
- Lesson 3 `greek-history-through-evidence` — «Το παρελθόν δεν μιλά με μία φωνή» — Integrated. [Research/media/QA](greek-history-through-evidence-research.md).
- Ancient Greece remains a 30-lesson, five-chapter plan: six lessons currently implemented, three research-first Integrated (1–3), three prior unapproved drafts; 24 remain not started. None Validated/Approved.
- Focus: evidence as selective survival; inscriptions, ostraka, authors, later narratives, missing voices and honest uncertainty. Specialist excavation techniques remain for `archaeology-methods`.
- Updated automated/device evidence is still required for lessons 1–3.
- **Next only, not started:** #4 `greek-chronology` — «Από τα ανάκτορα στις πόλεις: ένας χάρτης του χρόνου».


### Editorial session note — 2026-11-01 / Ancient Greece lesson 4
- **Integrated**, not Validated or Approved: `greek-chronology`, «Από τα ανάκτορα στις πόλεις: οι εποχές της αρχαίας Ελλάδας». [Research, source/rights audit, compatibility and QA](greek-chronology-research.md).
- Historical sequence: overlapping Cretan and mainland palatial cultures → post-palatial changes around 1200 BCE → diverse Early Iron Age communities, Geometric period and emerging alphabetic writing → Archaic, Classical and Hellenistic conventional boundaries. Labels are interpretive tools; chronological placement does not explain causality.
- **Educational boundaries:** #4 is a chronology map, not a replacement for #6 `aegean-bronze-age`, #7 `minoan-crete`, #8 `mycenaean-palaces`, #9 `linear-b-decipherment`, #10 `palace-collapse`, #11 `geometric-greece`, #12 `rise-of-polis`, or #29 `hellenistic-kingdoms-cities`. Detailed archaeological dating belongs to `archaeology-methods`. Geography and maritime pathways belong to #5 `greek-geography-seas`.
- **Curriculum remains 30 planned / 5 chapters.** Now **7 implemented**, 4 research-first Integrated (1–4), 3 older unapproved Drafted, 23 not started. 0 Validated, 0 Approved.
- Local npm/Node tests and Android/iOS device QA **not executed in this session**; prior #3 reader-pilot fix awaits rerun. Check before any status promotion.
- **Next only, not started:** #5 `greek-geography-seas` — «Η θάλασσα που ένωνε και χώριζε τις κοινότητες».


### Editorial session note — 2026-11-01 / Ancient Greece lesson 5
- **Integrated**, not Validated/Approved: `greek-geography-seas` — «Βουνά, όρμοι και άνεμοι: οι δρόμοι του αρχαίου Αιγαίου». [Research, source and image rights, compatibility and QA](greek-geography-seas-research.md).
- Land and sea form combined networks; island approaches depend on currents, winds, landing sites, terrain, technology and changing political circumstances. 18 stable paragraphs / four anchored reasoning questions; cover a modern Amorgos coastal photograph and inline Aegean topographic map.
- Overlap boundary: geographical orientation only, not Bronze Age administrations (#6–11), polis formation (#12), Mediterranean settlement systems (#13), or repeated chronology (#4).
- **30 planned / 5 chapters; 8 implemented: 5 Integrated, 3 older unapproved Drafted, 22 Not started; 0 Validated, 0 Approved.** Existing lesson IDs and progress policy preserved.
- Connector/source static checks only; npm, Node and native device tests **not executed**, current TypeScript and prior reader-pilot rerun unconfirmed. No changes to XP/audio/Supabase logic.
- **Next only, not started:** #6 `aegean-bronze-age`, «Το Αιγαίο πριν από τις πόλεις-κράτη» (Chapter II).

### Editorial session note — 2026-11-01 / Ancient Greece lesson 6
- **Integrated, not Validated/Approved**: `aegean-bronze-age`, «Σπίτια, εργαστήρια και δίκτυα: το Αιγαίο της Εποχής του Χαλκού». [Research, sources, image rights and QA](aegean-bronze-age-research.md).
- Social/material Bronze Age framework: 19 anchored paragraphs, four reasoning questions after 5/10/15/18, Poliochni cover and two attributed inline images. Chronology (#4), sailing conditions (#5), Uluburun world-history example and future palace-specific lessons are not repeated.
- Ancient Greece remains **30 planned / five chapters, 9 implemented (6 Integrated, 3 Drafted), 21 Not started, 0 Validated/Approved**. Existing IDs, scoring, audio, replay and Supabase untouched. Node/TypeScript/native QA not executed in this session.
- **Next only:** #7 `minoan-crete` «Η Κρήτη των ανακτόρων» (Chapter II); not developed yet.

### Editorial session note — 2026-11-01 / Ancient Greece lesson 7
- **Integrated, not Validated or Approved:** `minoan-crete` — «Πέρα από την Κνωσό: οι κόσμοι της μινωικής Κρήτης». See [claim-to-source ledger, images and pending QA](minoan-crete-research.md). Title replaces «Η Κρήτη των ανακτόρων» without changing the stable ID or the five-chapter, 30-lesson structure.
- Added Cretan archaeological depth: Malia's central court, storage/administration and Mu Quarter, Gournia's homes/workshops, Zakros's geographic connections, cult contexts and Knossos's modern reconstructions. **Do not infer one proven island-wide kingdom or a single Minoan ancient identity.**
- Overlap: #6 `aegean-bronze-age` remains the comparative household/material-exchange overview; #8 `mycenaean-palaces` will examine mainland administration, #9 `linear-b-decipherment` the decipherment, #10 `palace-collapse` the end of palatial systems, #11 `geometric-greece` later communities. #7 does not repeat #4 chronological map, #5 navigation or separate archaeological-methods curriculum.
- **30 planned / 5 chapters, 10 implemented (7 Integrated, 3 earlier Drafted), 20 Not started, zero Validated or Approved.** Code is integrated with existing reader and lesson paths; Node/TypeScript/native QA not executed in this session. No empty navigation entries added.
- **Next only, not researched here:** #8 `mycenaean-palaces` — «Ποιος διοικούσε τα μυκηναϊκά ανάκτορα;».

### Editorial session note — 2026-11-01 / Ancient Greece lesson 8
- **Integrated, not Validated or Approved:** `mycenaean-palaces` — «Όσα μετρούσε το ανάκτορο: εξουσία και εργασία στη μυκηναϊκή Πύλο». [Research, sources, rights, checkpoints and QA](mycenaean-palaces-research.md). The title emphasizes how selective records reveal labour and authority rather than suggesting a single palace ruler for all mainland Greece.
- **25 stable paragraphs, 5 version-1 anchored reasoning questions after paragraphs 4/10/15/20/24; licensed cover (Pylos megaron) and two contextual inline photos (PY Ub 1318 tablet, Tiryns entrance).** Reading estimate 13 minutes including questions.
- **Boundary:** Pylian administration, material contexts, Mycenaean regional variation. #7 remains the Minoan-Crete case study; #9 covers decipherment history and linguistic method; #10 is the palace destruction/aftermath topic; broader Bronze Age resources, chronological periods, and archaeology methods are not retold.
- **Plan unchanged:** 30 planned / five chapters; **11 in app: 8 Integrated, 3 older Drafted, 19 Not started; 0 Validated / 0 Approved.** Source and rights pages reviewed; automated npm/Node and Android/iOS runtime tests not executed here. No XP, audio, Supabase or database migration.
- **Next only, not researched:** #9 `linear-b-decipherment` — «Η γραφή που έκρυβε ελληνικά» (existing Drafted ID; review legacy quiz/version before rewriting).

### Editorial session note — Ancient Greece lesson 9 · 2026-11-01
- **Integrated**, not Validated/Approved: `linear-b-decipherment`, «Γραμμική Β: τα μοτίβα που αποκάλυψαν ελληνικά». [Sources, media, QA and progress compatibility](linear-b-decipherment-research.md).
- 21 stable paragraphs / five sections, five version-1 anchored reasoning checkpoints, one credited KN Fp 13 cover and one attributed Pylos inline image. Historical lesson ID and completion/XP activity retained; legacy quiz key is deliberately not aliased to new questions.
- Repaired Ancient Greece explicit path order (#9 immediately after #8). **30 planned / five chapters, 11 implemented, 9 Integrated, 2 older Drafted, 19 Not started, 0 Validated and 0 Approved.** Connector structural preflight only, npm/Node and native device checks not run.
- Next ONLY: #10 `palace-collapse` «Μετά την κατάρρευση των ανακτόρων» (Chapter II); not developed here.


### Editorial session note — 2026-11-01 / Ancient Greece lesson 10
- Lesson #10 `palace-collapse` — «Το τέλος των μυκηναϊκών ανακτόρων δεν ήταν μία στιγμή» — **Integrated, NOT Validated/Approved**. Claim-to-source ledger, debated chronology, archaeological regions, image rights and unexecuted checks: [palace-collapse-research.md](palace-collapse-research.md).
- Ancient Greece v1 remains **30 lessons / five chapters**. In code: **12 lessons**, including **10 research-first Integrated**, **2 older Drafted**, 18 outline-only Not started. No empty entries inserted in app navigation.
- Differentiated teaching scope: this article compares the end of palatial systems across Pylos, Mycenae, Tiryns, Thebes; distinguishes LH IIIB/IIIC and archive loss from population disappearance; weighs warfare, seismic hypotheses, local climate data, network stress and interpretive limits of Egyptian «Sea Peoples» material. The lecture on palace accounting stays in #8; decipherment stays in #9; Geometric/early Iron Age burial, sanctuaries, pottery and alphabetic forms are reserved for #11.
- New ID `palace-collapse`, 27 anchored paragraphs / 5 version-1 questions. No prior lesson/quiz version or reward policy modified. Two appropriately credited CC BY-SA 4.0 Commons site photographs; native image/scroll tests remain outstanding.
- The dedicated Node test was committed but **not run**. TypeScript, full validators, progress/XP/audio and Android/iOS checks are unexecuted here; retain **Integrated**. The full end-to-end QA list appears in the research file.
- **Next planned:** #11 `geometric-greece` — «Αγγεία, τάφοι και νέες κοινότητες». The 30-lesson count and structure are unchanged.

