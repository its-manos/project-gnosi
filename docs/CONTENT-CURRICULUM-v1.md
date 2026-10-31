# ΓΝΩΣΗ — Content Curriculum v1.0
Status: editorial draft · 2026-10-31 · planning only

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
