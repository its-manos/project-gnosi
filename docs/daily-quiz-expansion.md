# Daily quiz bank expansion — 31 October 2026

72 original Greek questions added; 109 questions in total. Existing 37 question objects and their order remain unchanged.

## Coverage

| Interest | New easy | New medium | New hard | Total after update |
| --- | ---: | ---: | ---: | ---: |
| Ιστορία | 3 | 3 | 3 | 13 |
| Επιστήμη | 3 | 3 | 3 | 15 |
| Γεωγραφία | 3 | 3 | 3 | 14 |
| Τεχνολογία | 3 | 3 | 3 | 14 |
| Πολιτισμός | 3 | 3 | 3 | 14 |
| Φύση | 3 | 3 | 3 | 13 |
| Αθλητισμός | 3 | 3 | 3 | 13 |
| Καθημερινές γνώσεις | 3 | 3 | 3 | 13 |

All 182 valid interest subsets (3, 4 or 5 of the 8 interests) have at least nine exact-level candidates for each difficulty, before counting the original bank. The unchanged selector can therefore fill seven questions without falling back to other interests or levels.

## Editorial approach

- Easy: a familiar concept, observation, or one-step inference. Medium: apply a concept or distinguish common confusions. Hard: combine conditions, interpret evidence, or reason through an exception. These are editorial difficulty estimates, to refine with beta feedback.
- Short, original Greek explanations describe the mechanism or reasoning rather than merely repeating the correct answer. Hypothetical scenarios and numerical examples are original; source links substantiate their underlying facts or rules.
- Four distinct options, one intended answer, no “all/none of the above.” The 72 additions have 18 correct answers in each position, in a shuffled order.
- Recurring subjects test different facets: for example, identifying a contour, comparing slopes and calculating scale. No new question repeats an existing prompt.
- Sports scope is explicit: indoor volleyball, conventional tennis tie-break and IFAB association football rules. Verified against the FIVB 2025–2028 and tennis/football 2026 editions.

## Compatibility and behaviour

- Existing question IDs, answer positions, explanations, sources, difficulty labels and ordering are preserved byte-for-byte at the object level. No storage format, scoring, preferences, native dependency or database change.
- A saved in-progress or completed daily challenge remains pinned to its stored question IDs. Adding content changes selection for a newly generated attempt, including on the same date if no attempt was saved.
- Existing histories and mistake practice retain their answer meaning. Guided lesson files are not included in this patch.
- This expands the selection pool; it does not add a cross-day repeat-avoidance algorithm. Questions may still recur on different dates.
- The default topic choices and difficulty settings are unchanged.

## Verification

- TypeScript check for the full app passed.
- Bank checks: schema, unique IDs/prompts/options, answer indices, source fields, balanced additions and equality with the 37-question baseline.
- Real selector exercised for 182 subsets × 3 levels × 30 dates = 16,380 selections; each has seven unique questions at the selected level and within the selected interests, with deterministic results.
- Restoration of pre-update in-progress and completed attempts, mixed correct/incorrect scores, and historical records.
- Existing daily challenge, history, sync, weekly review, progress stats, lesson mistake and learning backup regressions passed.
- Existing narrow-topic test now handles both sufficient and insufficient exact-match pools; an explicit scarce-match fixture preserves fallback coverage.

- Android Metro/Hermes export passed with the architecture and astronomy paths present. No native files are changed. Native phone appearance was not tested here.

## Source audit

Checked on 31 October 2026 using institutional source pages, indexed source extracts and official rulebooks. Direct page access occasionally failed; successful institutional alternatives are linked below. Sources provide factual verification, not copied assessment wording. Read technical references in their stated context.

### British Museum — Room 4 Touch Tour Guide

[British Museum — Room 4 Touch Tour Guide](https://www.britishmuseum.org/sites/default/files/2023-11/Room-4-Touch-Tour-Guide.pdf)

Questions: `daily-rosetta-comparison`, `daily-rosetta-sounds`.

### Harvard Center for Hellenic Studies — Athenian Law Lectures

[Harvard Center for Hellenic Studies — Athenian Law Lectures](https://www-current.chs.harvard.edu/discussion-series-athenian-law-lectures-8/)

Questions: `daily-athens-assembly`, `daily-athens-lottery`, `daily-athens-council-distinction`.

### Harvard Library — The Gutenberg Bible

[Harvard Library — The Gutenberg Bible](https://library.harvard.edu/collections/gutenberg-bible)

Questions: `daily-gutenberg-handwork`, `daily-gutenberg-latin`, `daily-gutenberg-qualified-first`.

### British Museum — Museum explorers: Ancient Egypt

[British Museum — Museum explorers: Ancient Egypt](https://www.britishmuseum.org/sites/default/files/2024-06/Museum_explorers_Ancient_Egypt.pdf)

Questions: `daily-cartouche-inference`.

### NASA Space Place — What Causes the Seasons?

[NASA Space Place — What Causes the Seasons?](https://spaceplace.nasa.gov/seasons/en/)

Questions: `daily-opposite-seasons`, `daily-seasons-not-distance`, `daily-perihelion-january`.

### NASA — Spectroscopy 101: Types of Spectra and Spectroscopy

[NASA — Spectroscopy 101: Types of Spectra and Spectroscopy](https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-types-of-spectra-and-spectroscopy/)

Questions: `daily-spectrum-purpose`, `daily-stellar-color-temperature`, `daily-absorption-signature`.

### OpenStax — College Physics 2e, 11.7 Archimedes’ Principle

[OpenStax — College Physics 2e, 11.7 Archimedes’ Principle](https://openstax.org/books/college-physics-2e/pages/11-7-archimedes-principle)

Questions: `daily-floating-force`, `daily-floating-displacement`, `daily-submerged-equal-volumes`.

### USGS — Groundwater Flow and the Water Cycle

[USGS — Groundwater Flow and the Water Cycle](https://www.usgs.gov/water-science-school/science/groundwater-flow-and-water-cycle)

Questions: `daily-groundwater-spaces`, `daily-permeable-aquifer`, `daily-groundwater-delayed-flow`.

### NOAA Ocean Exploration — What are the different types of plate tectonic boundaries?

[NOAA Ocean Exploration — What are the different types of plate tectonic boundaries?](https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/)

Questions: `daily-diverging-plates`, `daily-transform-boundary`, `daily-subduction-vs-transform`.

### USGS — Topographic Mapping

[USGS — Topographic Mapping](https://www.usgs.gov/educational-resources/topographic-mapping)

Questions: `daily-contour-meaning`.

### USGS — US Topo Cartographic Specifications: Map Symbol Guide

[USGS — US Topo Cartographic Specifications: Map Symbol Guide](https://www.usgs.gov/ngp-standards-and-specifications/us-topo-cartographic-specifications-map-symbol-guide)

Questions: `daily-contour-slope`.

### USGS — Catalog of Maps: Map scales

[USGS — Catalog of Maps: Map scales](https://pubs.usgs.gov/gip/70039188/plate-1.pdf)

Questions: `daily-map-scale-distance`.

### MDN — DNS

[MDN — DNS](https://developer.mozilla.org/en-US/docs/Glossary/DNS)

Questions: `daily-dns-address`.

### MDN — HTTP caching

[MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)

Questions: `daily-browser-cache-purpose`, `daily-cache-revalidation`, `daily-cache-no-cache`.

### MDN — Compression in HTTP

[MDN — Compression in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)

Questions: `daily-lossless-meaning`, `daily-compression-code-choice`, `daily-lossy-resave`.

### MDN — What is a domain name?

[MDN — What is a domain name?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name)

Questions: `daily-domain-subdomain`, `daily-dns-not-path`.

### National Gallery — Perspective

[National Gallery — Perspective](https://www.nationalgallery.org.uk/paintings/glossary/perspective)

Questions: `daily-perspective-depth`, `daily-vanishing-point-function`.

### Philharmonia — Flute

[Philharmonia — Flute](https://philharmonia.co.uk/resources/instruments/flute/)

Questions: `daily-flute-family`, `daily-piccolo-transposition`.

### National Gallery — Tempera

[National Gallery — Tempera](https://www.nationalgallery.org.uk/paintings/glossary/tempera)

Questions: `daily-egg-tempera-binder`.

### Philharmonia — Trombone

[Philharmonia — Trombone](https://philharmonia.co.uk/resources/instruments/trombone/)

Questions: `daily-trombone-slide`.

### National Gallery — Fresco

[National Gallery — Fresco](https://www.nationalgallery.org.uk/paintings/glossary/fresco)

Questions: `daily-buon-fresco-surface`, `daily-fresco-giornata`.

### University of Leeds — Space and perspective

[University of Leeds — Space and perspective](https://ahc.leeds.ac.uk/analysing-paintings/doc/unit-a3-space-perspective)

Questions: `daily-perspective-horizon`.

### Oregon State University Extension — Understanding soil health and biota

[Oregon State University Extension — Understanding soil health and biota](https://extension.oregonstate.edu/catalog/em-9409-understanding-soil-health-biota-farms-gardens)

Questions: `daily-mushroom-visible-body`, `daily-mycorrhizal-exchange`, `daily-fungi-not-all-same`.

### USGS — Pollinator Science Strategy, 2025–35

[USGS — Pollinator Science Strategy, 2025–35](https://pubs.usgs.gov/publication/cir1556/full)

Questions: `daily-pollination-transfer`, `daily-pollination-not-fertilization`.

### NOAA — Are corals animals or plants?

[NOAA — Are corals animals or plants?](https://oceanservice.noaa.gov/facts/coral.html)

Questions: `daily-coral-animal`.

### Washington State University — Pollinators: Pollination

[Washington State University — Pollinators: Pollination](https://hortsense.cahnrs.wsu.edu/fact-sheet/about-pollinators-pollination/)

Questions: `daily-wind-pollination`.

### Smithsonian Ocean — Zooxanthellae and Coral Bleaching

[Smithsonian Ocean — Zooxanthellae and Coral Bleaching](https://ocean.si.edu/ocean-life/invertebrates/zooxanthellae-and-coral-bleaching)

Questions: `daily-coral-algae-benefit`.

### NOAA — What is coral bleaching?

[NOAA — What is coral bleaching?](https://oceanservice.noaa.gov/facts/coral_bleach.html)

Questions: `daily-bleached-coral-survival`.

### IFAB — Law 15: The Throw-in (2026/27)

[IFAB — Law 15: The Throw-in (2026/27)](https://www.theifab.com/laws/latest/the-throw-in/)

Questions: `daily-throw-in-whole-ball`.

### FIVB — Official Volleyball Rules 2025–2028

[FIVB — Official Volleyball Rules 2025–2028](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf)

Questions: `daily-volleyball-three-hits`, `daily-volleyball-deuce`, `daily-volleyball-after-block`.

### ITF — Rules of Tennis, 2026 edition

[ITF — Rules of Tennis, 2026 edition](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf)

Questions: `daily-tennis-line-in`, `daily-tennis-double-fault`, `daily-tennis-tiebreak-service`.

### IFAB — Law 11: Offside (2026/27)

[IFAB — Law 11: Offside (2026/27)](https://www.theifab.com/laws/latest/offside/)

Questions: `daily-offside-position-alone`, `daily-offside-direct-throwin`.

### OpenStax — Measures of the Center of the Data

[OpenStax — Measures of the Center of the Data](https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data)

Questions: `daily-median-waiting`, `daily-mean-outlier`.

### OpenStax — Independent and Mutually Exclusive Events

[OpenStax — Independent and Mutually Exclusive Events](https://openstax.org/books/introductory-statistics/pages/3-2-independent-and-mutually-exclusive-events)

Questions: `daily-coin-next-flip`, `daily-draw-without-replacement`, `daily-at-least-one-six`.

### OpenStax — University Physics Volume 2, Mechanisms of Heat Transfer

[OpenStax — University Physics Volume 2, Mechanisms of Heat Transfer](https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer)

Questions: `daily-heat-direction`, `daily-metal-feels-colder`, `daily-insulation-thickness`.

### OpenStax — Data, Sampling, and Variation in Data and Sampling

[OpenStax — Data, Sampling, and Variation in Data and Sampling](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling)

Questions: `daily-voluntary-survey-bias`.

## New question inventory

| ID | Interest | Level | Question |
| --- | --- | --- | --- |
| `daily-rosetta-comparison` | Ιστορία | easy | Γιατί η Στήλη της Ροζέτας βοήθησε στην αποκρυπτογράφηση των ιερογλυφικών; |
| `daily-athens-assembly` | Ιστορία | easy | Στην κλασική Αθήνα, πού συμμετείχαν άμεσα οι άνδρες πολίτες στη λήψη πολιτικών αποφάσεων; |
| `daily-gutenberg-handwork` | Ιστορία | easy | Ένα βιβλίο του Γουτεμβέργιου έχει τυπωμένο κείμενο και αρχικά γράμματα ζωγραφισμένα στο χέρι. Τι δείχνει αυτό; |
| `daily-rosetta-sounds` | Ιστορία | medium | Ποια ανακάλυψη ανέτρεψε την ιδέα ότι τα ιερογλυφικά ήταν μόνο εικόνες που συμβόλιζαν έννοιες; |
| `daily-athens-lottery` | Ιστορία | medium | Ποιος τρόπος επιλογής συνδεόταν με πολλά δημόσια αξιώματα της αθηναϊκής δημοκρατίας; |
| `daily-gutenberg-latin` | Ιστορία | medium | Σε ποια γλώσσα τυπώθηκε το κείμενο της περίφημης Βίβλου του Γουτεμβέργιου; |
| `daily-cartouche-inference` | Ιστορία | hard | Σε αιγυπτιακή επιγραφή ένα σύνολο ιερογλυφικών περικλείεται σε δέλτο, ένα οβάλ πλαίσιο. Τι περιμένει να βρει εκεί ο μελετητής; |
| `daily-athens-council-distinction` | Ιστορία | hard | Ποια περιγραφή ξεχωρίζει σωστά τη Βουλή των Πεντακοσίων από την Εκκλησία του Δήμου; |
| `daily-gutenberg-qualified-first` | Ιστορία | hard | Ποιος χαρακτηρισμός της Βίβλου του Γουτεμβέργιου είναι ιστορικά ακριβέστερος; |
| `daily-opposite-seasons` | Επιστήμη | easy | Όταν στην Ελλάδα έχουμε καλοκαίρι, ποια εποχή έχει συνήθως η νότια Αυστραλία; |
| `daily-spectrum-purpose` | Επιστήμη | easy | Τι κάνει ένας φασματογράφος στο φως που φτάνει από ένα άστρο; |
| `daily-floating-force` | Επιστήμη | easy | Ποια δύναμη από το νερό στηρίζει προς τα πάνω ένα πλοίο που επιπλέει; |
| `daily-seasons-not-distance` | Επιστήμη | medium | Ποια παρατήρηση δείχνει ότι η απόσταση Γης–Ήλιου δεν εξηγεί από μόνη της τις εποχές; |
| `daily-stellar-color-temperature` | Επιστήμη | medium | Αν συγκρίνουμε ένα μπλε και ένα κόκκινο άστρο, χωρίς να επηρεάζει το χρώμα τους μεσοαστρική σκόνη, ποιο έχει συνήθως θερμότερη επιφάνεια; |
| `daily-floating-displacement` | Επιστήμη | medium | Ένα σκάφος επιπλέει ακίνητο. Προσθέτουμε φορτίο χωρίς να μπει νερό στο εσωτερικό και εξακολουθεί να επιπλέει. Τι αλλάζει; |
| `daily-perihelion-january` | Επιστήμη | hard | Η Γη περνά από το κοντινότερο σημείο της τροχιάς της στον Ήλιο περίπου τον Ιανουάριο. Πώς συμβιβάζεται αυτό με τον χειμώνα στην Ελλάδα; |
| `daily-absorption-signature` | Επιστήμη | hard | Στο φάσμα ενός άστρου εμφανίζονται σκοτεινές γραμμές στα ίδια μήκη κύματος όπου ένα στοιχείο απορροφά φως στο εργαστήριο. Τι υποστηρίζει αυτή η αντιστοιχία; |
| `daily-submerged-equal-volumes` | Επιστήμη | hard | Δύο συμπαγή σώματα ίδιου όγκου, ένα σιδερένιο και ένα αλουμινένιο, κρατιούνται πλήρως βυθισμένα στο ίδιο νερό, χωρίς να ακουμπούν στον πυθμένα. Ποιο δέχεται μεγαλύτερη άνωση; |
| `daily-groundwater-spaces` | Γεωγραφία | easy | Πού βρίσκεται το μεγαλύτερο μέρος του υπόγειου νερού; |
| `daily-diverging-plates` | Γεωγραφία | easy | Σε ένα αποκλίνον όριο τεκτονικών πλακών, πώς κινούνται οι πλάκες μεταξύ τους; |
| `daily-contour-meaning` | Γεωγραφία | easy | Τι ενώνει μια ισοϋψής γραμμή σε τοπογραφικό χάρτη; |
| `daily-permeable-aquifer` | Γεωγραφία | medium | Ένα πέτρωμα έχει πολλά κενά, αλλά αυτά επικοινωνούν ελάχιστα μεταξύ τους. Γιατί μπορεί να δίνει λίγο νερό σε μια γεώτρηση; |
| `daily-transform-boundary` | Γεωγραφία | medium | Δύο τεκτονικές πλάκες ολισθαίνουν οριζόντια η μία δίπλα στην άλλη. Ποιος τύπος ορίου περιγράφεται; |
| `daily-contour-slope` | Γεωγραφία | medium | Στον ίδιο χάρτη, με σταθερό βήμα ισοϋψών, πού είναι συνήθως πιο απότομη η πλαγιά; |
| `daily-groundwater-delayed-flow` | Γεωγραφία | hard | Ένα ποτάμι συνεχίζει να έχει νερό αρκετές μέρες μετά τη βροχή. Ποια εξήγηση είναι συμβατή με τον κύκλο του νερού; |
| `daily-subduction-vs-transform` | Γεωγραφία | hard | Σε μια περιοχή η ωκεάνια πλάκα βυθίζεται κάτω από άλλη πλάκα. Ποιο ζεύγος χαρακτηριστικών ταιριάζει περισσότερο; |
| `daily-map-scale-distance` | Γεωγραφία | hard | Σε χάρτη κλίμακας 1:50.000, δύο σημεία απέχουν 4 εκατοστά. Ποια είναι η αντίστοιχη οριζόντια απόσταση στο έδαφος; |
| `daily-dns-address` | Τεχνολογία | easy | Ποια είναι μια βασική δουλειά του DNS όταν ανοίγεις μια ιστοσελίδα; |
| `daily-browser-cache-purpose` | Τεχνολογία | easy | Γιατί ο browser κρατά συχνά τοπικό αντίγραφο μιας εικόνας που έχεις ήδη δει; |
| `daily-lossless-meaning` | Τεχνολογία | easy | Τι σημαίνει ότι μια συμπίεση είναι «χωρίς απώλειες»; |
| `daily-domain-subdomain` | Τεχνολογία | medium | Στη διεύθυνση support.example.com, τι είναι το «support» σε σχέση με το example.com; |
| `daily-cache-revalidation` | Τεχνολογία | medium | Ο browser ρωτά τον server αν ένα αποθηκευμένο αρχείο έχει αλλάξει. Ο server απαντά «304 Not Modified». Τι γίνεται συνήθως; |
| `daily-compression-code-choice` | Τεχνολογία | medium | Θέλουμε να συμπιέσουμε τον πηγαίο κώδικα μιας εφαρμογής για μεταφορά. Ποια απαίτηση είναι κρίσιμη; |
| `daily-dns-not-path` | Τεχνολογία | hard | Στο https://example.com/photos/cat.jpg, ποιο μέρος αντιστοιχίζει συνήθως το DNS σε διεύθυνση IP; |
| `daily-cache-no-cache` | Τεχνολογία | hard | Μια HTTP απόκριση έχει Cache-Control: no-cache. Τι σημαίνει αυτό; |
| `daily-lossy-resave` | Τεχνολογία | hard | Μια φωτογραφία αποθηκεύεται ξανά και ξανά με απωλεστική συμπίεση. Τι μπορεί να συμβεί, ακόμη κι αν δεν αλλάζει ο αριθμός των pixel; |
| `daily-perspective-depth` | Πολιτισμός | easy | Σε έναν πίνακα, δύο άνθρωποι ίδιου πραγματικού ύψους φαίνονται σε διαφορετικό μέγεθος. Ποιος παρουσιάζεται συνήθως πιο μακριά; |
| `daily-flute-family` | Πολιτισμός | easy | Σε ποια οικογένεια της ορχήστρας ανήκει το σύγχρονο φλάουτο, παρότι συνήθως είναι μεταλλικό; |
| `daily-egg-tempera-binder` | Πολιτισμός | easy | Στην αυγοτέμπερα, ποιος είναι ο ρόλος του κρόκου του αυγού; |
| `daily-vanishing-point-function` | Πολιτισμός | medium | Σε σχέδιο με προοπτική ενός σημείου φυγής, οι παράλληλες πλευρές ενός δρόμου που απομακρύνεται από εμάς φαίνονται να συγκλίνουν. Προς τα πού; |
| `daily-trombone-slide` | Πολιτισμός | medium | Ποιο όργανο χρησιμοποιεί χαρακτηριστικά έναν κινητό σωλήνα, τον ολκό, για να αλλάζει το τονικό ύψος και να γλιστρά ανάμεσα στις νότες; |
| `daily-buon-fresco-surface` | Πολιτισμός | medium | Σε ποια επιφάνεια εφαρμόζεται το χρώμα στην τεχνική buon fresco; |
| `daily-perspective-horizon` | Πολιτισμός | hard | Σε ένα σχέδιο γραμμικής προοπτικής ανεβάζουμε τη γραμμή του ορίζοντα. Τι αλλάζουμε κυρίως στην υπονοούμενη θέση του θεατή; |
| `daily-piccolo-transposition` | Πολιτισμός | hard | Ένα πίκολο παίζει μια γραμμένη νότα. Σε ποια σχέση βρίσκεται συνήθως ο ήχος που ακούμε με αυτή τη νότα; |
| `daily-fresco-giornata` | Πολιτισμός | hard | Γιατί ένας ζωγράφος buon fresco απλώνει συνήθως μόνο όσο τελικό κονίαμα προλαβαίνει να ζωγραφίσει την ίδια μέρα; |
| `daily-mushroom-visible-body` | Φύση | easy | Το μανιτάρι που βλέπουμε πάνω από το έδαφος είναι συνήθως τι μέρος ενός μύκητα; |
| `daily-pollination-transfer` | Φύση | easy | Ποια μεταφορά περιγράφει την επικονίαση στα ανθοφόρα φυτά; |
| `daily-coral-animal` | Φύση | easy | Οι μικροί πολύποδες που σχηματίζουν ένα κοράλλι είναι τι είδους οργανισμοί; |
| `daily-mycorrhizal-exchange` | Φύση | medium | Σε μια μυκορριζική συμβίωση, τι δίνει συνήθως το φυτό στον μύκητα σε αντάλλαγμα για νερό και ανόργανα θρεπτικά στοιχεία; |
| `daily-wind-pollination` | Φύση | medium | Ένα φυτό παράγει σπόρους παρότι τα άνθη του δεν δέχονται επισκέψεις από ζώα. Ποια εξήγηση είναι δυνατή; |
| `daily-coral-algae-benefit` | Φύση | medium | Τι προσφέρουν κυρίως τα συμβιωτικά φύκη στα κοράλλια πολλών ρηχών υφάλων; |
| `daily-fungi-not-all-same` | Φύση | hard | Ένας μύκητας διασπά νεκρό ξύλο, ενώ άλλος ανταλλάσσει θρεπτικά στοιχεία με ζωντανές ρίζες. Ποια διάκριση είναι σωστή; |
| `daily-pollination-not-fertilization` | Φύση | hard | Βλέπουμε γύρη πάνω στο στίγμα ενός άνθους. Ποιο συμπέρασμα δικαιολογείται άμεσα, χωρίς άλλες παρατηρήσεις; |
| `daily-bleached-coral-survival` | Φύση | hard | Ένα κοράλλι έχει λευκάνει μετά από θερμική καταπόνηση. Ποια ερμηνεία είναι ακριβέστερη; |
| `daily-throw-in-whole-ball` | Αθλητισμός | easy | Στο ποδόσφαιρο, πότε θεωρείται ότι η μπάλα έχει βγει από την πλάγια γραμμή; |
| `daily-volleyball-three-hits` | Αθλητισμός | easy | Στο βόλεϊ σάλας, πόσες επαφές έχει στη διάθεσή της μια ομάδα για να επιστρέψει την μπάλα, χωρίς να μετρά η επαφή στο μπλοκ; |
| `daily-tennis-line-in` | Αθλητισμός | easy | Στο τένις, μια μπάλα σε κανονική ανταλλαγή ακουμπά την εξωτερική γραμμή που ορίζει το σωστό γήπεδο. Είναι μέσα ή έξω; |
| `daily-offside-position-alone` | Αθλητισμός | medium | Ένας επιθετικός βρίσκεται σε θέση οφσάιντ τη στιγμή της πάσας, αλλά δεν αγγίζει την μπάλα ούτε επηρεάζει αντίπαλο ή τη φάση. Τι ισχύει; |
| `daily-volleyball-deuce` | Αθλητισμός | medium | Σε ένα από τα πρώτα τέσσερα σετ βόλεϊ σάλας, το σκορ είναι 24–24. Ποιο από τα παρακάτω σκορ ολοκληρώνει το σετ; |
| `daily-tennis-double-fault` | Αθλητισμός | medium | Στο τένις, ο παίκτης που σερβίρει κάνει λάθος και στο πρώτο και στο δεύτερο σερβίς του ίδιου πόντου, χωρίς να έχει δοθεί let. Τι συμβαίνει; |
| `daily-offside-direct-throwin` | Αθλητισμός | hard | Ένας επιθετικός δέχεται την μπάλα απευθείας από πλάγια επαναφορά συμπαίκτη του, πιο κοντά στην αντίπαλη εστία από την μπάλα και τον προτελευταίο αντίπαλο. Καταλογίζεται οφσάιντ για αυτή την υποδοχή; |
| `daily-volleyball-after-block` | Αθλητισμός | hard | Στο βόλεϊ σάλας, ένας παίκτης αγγίζει την μπάλα σε ολοκληρωμένο μπλοκ. Μπορεί ο ίδιος να κάνει αμέσως την επόμενη επαφή; |
| `daily-tennis-tiebreak-service` | Αθλητισμός | hard | Σε ένα συνηθισμένο tie-break τένις, ο παίκτης Α σερβίρει τον πρώτο πόντο. Ποιος σερβίρει τους επόμενους δύο; |
| `daily-median-waiting` | Καθημερινές γνώσεις | easy | Πέντε χρόνοι αναμονής, σε αύξουσα σειρά, είναι 2, 3, 4, 6 και 20 λεπτά. Ποια είναι η διάμεσος; |
| `daily-coin-next-flip` | Καθημερινές γνώσεις | easy | Ένα δίκαιο νόμισμα έφερε πέντε φορές στη σειρά κορώνα. Αν οι ρίψεις είναι ανεξάρτητες, ποια είναι η πιθανότητα να φέρει κορώνα στην επόμενη; |
| `daily-heat-direction` | Καθημερινές γνώσεις | easy | Ένα ζεστό φλιτζάνι ακουμπά σε πιο κρύο τραπέζι. Προς τα πού μεταφέρεται αυθόρμητα καθαρή θερμότητα στην επαφή τους; |
| `daily-mean-outlier` | Καθημερινές γνώσεις | medium | Σε μια παρέα τεσσάρων ατόμων προστίθεται ένα πέμπτο άτομο με εξαιρετικά μεγάλο εισόδημα. Ποιος δείκτης επηρεάζεται συνήθως περισσότερο από αυτή την ακραία τιμή; |
| `daily-draw-without-replacement` | Καθημερινές γνώσεις | medium | Σε ένα σακουλάκι υπάρχουν 3 κόκκινοι και 2 μπλε βόλοι. Βγάζεις έναν κόκκινο και δεν τον επιστρέφεις. Ποια είναι η πιθανότητα ο επόμενος να είναι μπλε, αν επιλέγεις τυχαία; |
| `daily-metal-feels-colder` | Καθημερινές γνώσεις | medium | Ένα μεταλλικό και ένα ξύλινο αντικείμενο έχουν μείνει στο ίδιο δροσερό δωμάτιο και έχουν ίδια θερμοκρασία. Γιατί το μέταλλο συνήθως φαίνεται πιο κρύο στο χέρι; |
| `daily-voluntary-survey-bias` | Καθημερινές γνώσεις | hard | Μια εφαρμογή ρωτά μόνο όσους χρήστες πατούν προαιρετικά «Πες τη γνώμη σου» και παίρνει 10.000 απαντήσεις. Τι περιορίζει την εξαγωγή συμπεράσματος για όλους τους χρήστες; |
| `daily-at-least-one-six` | Καθημερινές γνώσεις | hard | Ρίχνεις ένα δίκαιο εξάπλευρο ζάρι δύο ανεξάρτητες φορές. Ποια είναι η πιθανότητα να εμφανιστεί τουλάχιστον ένα εξάρι; |
| `daily-insulation-thickness` | Καθημερινές γνώσεις | hard | Διπλασιάζουμε το πάχος μιας ομοιόμορφης μονωτικής πλάκας. Αν υλικό, επιφάνεια και διαφορά θερμοκρασίας μείνουν ίδια, τι γίνεται με τη σταθερή ροή θερμότητας με αγωγή; |
