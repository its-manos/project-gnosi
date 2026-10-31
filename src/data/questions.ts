import type { QuestionMetadata } from "../quiz/types";
/**
 * Reviewed question bank for the daily general-knowledge challenge.
 * Each question has four choices, one correct answer, a short explanation,
 * and a source URL for editorial verification.
 */
export type GeneralKnowledgeQuestion = QuestionMetadata & {
  id: string;
  categoryId: string;
  subcategoryId: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
};

export const DAILY_CHALLENGE_SIZE = 7;

export const questions: GeneralKnowledgeQuestion[] = [
  {
    id: "planet-largest",
    categoryId: "science",
    subcategoryId: "space",
    difficulty: "easy",
    question: "Ποιος είναι ο μεγαλύτερος πλανήτης του Ηλιακού Συστήματος;",
    answers: ["Γη", "Κρόνος", "Δίας", "Ποσειδώνας"],
    correctIndex: 2,
    explanation: "Ο Δίας είναι ο μεγαλύτερος πλανήτης του Ηλιακού Συστήματος.",
    sourceTitle: "NASA — Jupiter",
    sourceUrl: "https://science.nasa.gov/jupiter/",
  },
  {
    id: "greek-revolution-year",
    categoryId: "history",
    subcategoryId: "world-history",
    difficulty: "easy",
    question: "Ποια χρονιά ξεκίνησε η Ελληνική Επανάσταση;",
    answers: ["1776", "1821", "1843", "1912"],
    correctIndex: 1,
    explanation: "Η Ελληνική Επανάσταση κατά της Οθωμανικής κυριαρχίας ξεκίνησε το 1821.",
    sourceTitle: "Encyclopaedia Britannica — Greek War of Independence",
    sourceUrl: "https://www.britannica.com/event/Greek-War-of-Independence",
  },
  {
    id: "gold-symbol",
    categoryId: "science",
    subcategoryId: "physics",
    difficulty: "easy",
    question: "Ποιο είναι το χημικό σύμβολο του χρυσού;",
    answers: ["Ag", "Gd", "Go", "Au"],
    correctIndex: 3,
    explanation: "Το Au προέρχεται από τη λατινική λέξη aurum, που σημαίνει χρυσός.",
    sourceTitle: "Royal Society of Chemistry — Gold",
    sourceUrl: "https://periodic-table.rsc.org/element/79/gold",
  },
  {
    id: "australia-capital",
    categoryId: "geography",
    subcategoryId: "countries",
    difficulty: "easy",
    question: "Ποια είναι η πρωτεύουσα της Αυστραλίας;",
    answers: ["Σίδνεϊ", "Μελβούρνη", "Καμπέρα", "Περθ"],
    correctIndex: 2,
    explanation: "Πρωτεύουσα της Αυστραλίας είναι η Καμπέρα, όχι το Σίδνεϊ ή η Μελβούρνη.",
    sourceTitle: "Encyclopaedia Britannica — Canberra",
    sourceUrl: "https://www.britannica.com/place/Canberra-Australian-Capital-Territory",
  },
  {
    id: "hexagon-sides",
    categoryId: "everyday",
    subcategoryId: "math",
    difficulty: "easy",
    question: "Πόσες πλευρές έχει ένα εξάγωνο;",
    answers: ["Πέντε", "Έξι", "Επτά", "Οκτώ"],
    correctIndex: 1,
    explanation: "Το εξάγωνο είναι πολύγωνο με έξι πλευρές και έξι κορυφές.",
    sourceTitle: "Math Is Fun — Polygons",
    sourceUrl: "https://www.mathsisfun.com/geometry/polygons.html",
  },
  {
    id: "atmosphere-nitrogen",
    categoryId: "science",
    subcategoryId: "space",
    difficulty: "easy",
    question: "Ποιο αέριο αποτελεί το μεγαλύτερο ποσοστό της ατμόσφαιρας της Γης;",
    answers: ["Οξυγόνο", "Άζωτο", "Διοξείδιο του άνθρακα", "Υδρογόνο"],
    correctIndex: 1,
    explanation: "Το άζωτο αποτελεί περίπου το 78% της ξηρής ατμόσφαιρας της Γης.",
    sourceTitle: "NOAA — The Atmosphere",
    sourceUrl: "https://www.noaa.gov/jetstream/atmosphere",
  },
  {
    id: "pacific-largest",
    categoryId: "geography",
    subcategoryId: "oceans",
    difficulty: "easy",
    question: "Ποιος είναι ο μεγαλύτερος ωκεανός της Γης;",
    answers: ["Ατλαντικός", "Ινδικός", "Αρκτικός", "Ειρηνικός"],
    correctIndex: 3,
    explanation: "Ο Ειρηνικός είναι ο μεγαλύτερος και βαθύτερος ωκεάνιος χώρος της Γης.",
    sourceTitle: "NOAA — What is the largest ocean basin?",
    sourceUrl: "https://oceanservice.noaa.gov/facts/biggestocean.html",
  },
  {
    id: "electric-current-unit",
    categoryId: "science",
    subcategoryId: "physics",
    difficulty: "medium",
    question: "Ποια μονάδα χρησιμοποιούμε στο SI για την ένταση του ηλεκτρικού ρεύματος;",
    answers: ["Volt", "Watt", "Ampere", "Ohm"],
    correctIndex: 2,
    explanation: "Η μονάδα SI της έντασης του ηλεκτρικού ρεύματος είναι το αμπέρ (A).",
    sourceTitle: "BIPM — SI base unit: ampere",
    sourceUrl: "https://www.bipm.org/en/si-base-units/ampere",
  },
  {
    id: "mona-lisa-artist",
    categoryId: "culture",
    subcategoryId: "visual-arts",
    difficulty: "medium",
    question: "Ποιος ζωγράφισε τη Μόνα Λίζα;",
    answers: ["Μιχαήλ Άγγελος", "Ρέμπραντ", "Λεονάρντο ντα Βίντσι", "Κλοντ Μονέ"],
    correctIndex: 2,
    explanation: "Η Μόνα Λίζα είναι έργο του Λεονάρντο ντα Βίντσι και εκτίθεται στο Μουσείο του Λούβρου.",
    sourceTitle: "Musée du Louvre — Mona Lisa",
    sourceUrl: "https://www.louvre.fr/en/explore/visitor-trails/the-louvre-s-masterpieces/a-superstar-and-a-wedding-crowd",
  },
  {
    id: "ancient-olympics-location",
    categoryId: "history",
    subcategoryId: "ancient-greece",
    difficulty: "easy",
    question: "Σε ποιο μέρος της αρχαίας Ελλάδας διεξάγονταν οι Ολυμπιακοί Αγώνες;",
    answers: ["Δελφοί", "Ολυμπία", "Σπάρτη", "Μαραθώνας"],
    correctIndex: 1,
    explanation: "Οι αρχαίοι αγώνες διοργανώνονταν στην Ολυμπία, στην Πελοπόννησο, προς τιμήν του Δία.",
    sourceTitle: "Olympics.com — Origin of the Olympic Games",
    sourceUrl: "https://www.olympics.com/ioc/faq/history-and-origin-of-the-games/what-is-the-origin-of-the-olympic-games",
  },
  {
    id: "photosynthesis",
    categoryId: "nature",
    subcategoryId: "ecosystems",
    difficulty: "medium",
    question: "Πώς ονομάζεται η διαδικασία με την οποία τα φυτά αξιοποιούν το φως για να παράγουν σάκχαρα;",
    answers: ["Εξάτμιση", "Ζύμωση", "Φωτοσύνθεση", "Συμπύκνωση"],
    correctIndex: 2,
    explanation: "Με τη φωτοσύνθεση, τα φυτά χρησιμοποιούν ενέργεια από το φως για να μετατρέψουν νερό και διοξείδιο του άνθρακα σε σάκχαρα.",
    sourceTitle: "Encyclopaedia Britannica — Photosynthesis",
    sourceUrl: "https://www.britannica.com/science/photosynthesis",
  },
  {
    id: "earth-natural-satellite",
    categoryId: "science",
    subcategoryId: "space",
    difficulty: "easy",
    question: "Ποιος είναι ο φυσικός δορυφόρος της Γης;",
    answers: ["Τιτάνας", "Σελήνη", "Ευρώπη", "Φόβος"],
    correctIndex: 1,
    explanation: "Η Σελήνη είναι ο φυσικός δορυφόρος της Γης και περιφέρεται γύρω από τον πλανήτη μας.",
    sourceTitle: "NASA — Moon",
    sourceUrl: "https://science.nasa.gov/moon/",
  },

  {
    id: "marathon-battle-year",
    categoryId: "history",
    subcategoryId: "ancient-greece",
    difficulty: "hard",
    question: "Σε ποια χρονιά έγινε η Μάχη του Μαραθώνα;",
    answers: ["490 π.Χ.", "480 π.Χ.", "431 π.Χ.", "338 π.Χ."],
    correctIndex: 0,
    explanation: "Η Μάχη του Μαραθώνα έγινε το 490 π.Χ., κατά την πρώτη περσική εισβολή στην Ελλάδα.",
    sourceTitle: "Encyclopaedia Britannica — Battle of Marathon",
    sourceUrl: "https://www.britannica.com/event/Battle-of-Marathon",
  },
  {
    id: "modern-olympics-first",
    categoryId: "history",
    subcategoryId: "world-history",
    difficulty: "medium",
    question: "Σε ποια πόλη αναβίωσαν οι σύγχρονοι Ολυμπιακοί Αγώνες το 1896;",
    answers: ["Παρίσι", "Αθήνα", "Ρώμη", "Λονδίνο"],
    correctIndex: 1,
    explanation: "Οι πρώτοι σύγχρονοι Ολυμπιακοί Αγώνες έγιναν στην Αθήνα το 1896.",
    sourceTitle: "Olympics.com — Athens 1896",
    sourceUrl: "https://olympics.com/en/olympic-games/athens-1896",
  },
  {
    id: "everest-highest-mountain",
    categoryId: "geography",
    subcategoryId: "landforms",
    difficulty: "easy",
    question: "Ποιο βουνό έχει το μεγαλύτερο υψόμετρο πάνω από τη στάθμη της θάλασσας;",
    answers: ["Κιλιμάντζαρο", "Έβερεστ", "Μον Μπλαν", "Ακονκάγκουα"],
    correctIndex: 1,
    explanation: "Το Έβερεστ είναι το ψηλότερο βουνό πάνω από τη στάθμη της θάλασσας.",
    sourceTitle: "Encyclopaedia Britannica — Mount Everest",
    sourceUrl: "https://www.britannica.com/place/Mount-Everest",
  },
  {
    id: "equator-hemispheres",
    categoryId: "geography",
    subcategoryId: "earth",
    difficulty: "medium",
    question: "Ποιες δύο ημισφαίριες χωρίζει ο Ισημερινός;",
    answers: ["Ανατολική και Δυτική", "Βόρεια και Νότια", "Ηπειρωτική και Θαλάσσια", "Αρκτική και Ανταρκτική"],
    correctIndex: 1,
    explanation: "Ο Ισημερινός είναι η γραμμή γεωγραφικού πλάτους 0° και χωρίζει τη Γη σε Βόρειο και Νότιο Ημισφαίριο.",
    sourceTitle: "National Geographic — Equator",
    sourceUrl: "https://education.nationalgeographic.org/resource/equator/",
  },
  {
    id: "octopus-hearts",
    categoryId: "nature",
    subcategoryId: "animals",
    difficulty: "hard",
    question: "Πόσες καρδιές έχει συνήθως ένα χταπόδι;",
    answers: ["Μία", "Δύο", "Τρεις", "Τέσσερις"],
    correctIndex: 2,
    explanation: "Τα χταπόδια έχουν τρεις καρδιές: δύο στέλνουν αίμα στα βράγχια και μία στο υπόλοιπο σώμα.",
    sourceTitle: "Smithsonian Ocean — Octopuses",
    sourceUrl: "https://ocean.si.edu/ocean-life/invertebrates/why-octopus-brain-so-extraordinary",
  },
  {
    id: "pollinators-bees",
    categoryId: "nature",
    subcategoryId: "ecosystems",
    difficulty: "easy",
    question: "Πώς βοηθούν οι μέλισσες πολλά ανθοφόρα φυτά;",
    answers: ["Με την επικονίαση", "Με την παραγωγή οξυγόνου", "Με τη διάβρωση του εδάφους", "Με την εξάτμιση του νερού"],
    correctIndex: 0,
    explanation: "Καθώς επισκέπτονται τα άνθη, οι μέλισσες μεταφέρουν γύρη και συμβάλλουν στην αναπαραγωγή πολλών φυτών.",
    sourceTitle: "USDA — Pollinators",
    sourceUrl: "https://www.usda.gov/peoples-garden/pollinators",
  },
  {
    id: "bats-mammals",
    categoryId: "nature",
    subcategoryId: "animals",
    difficulty: "medium",
    question: "Ποιο χαρακτηριστικό κατατάσσει τις νυχτερίδες στα θηλαστικά;",
    answers: ["Έχουν φτερά", "Τα θηλυκά παράγουν γάλα για τα μικρά τους", "Ζουν μόνο σε σπηλιές", "Είναι όλα φυτοφάγα"],
    correctIndex: 1,
    explanation: "Όπως όλα τα θηλαστικά, οι νυχτερίδες θηλάζουν τα μικρά τους. Είναι τα μόνα θηλαστικά που μπορούν να πετούν ενεργά.",
    sourceTitle: "Encyclopaedia Britannica — Bat",
    sourceUrl: "https://www.britannica.com/animal/bat-mammal",
  },
  {
    id: "odyssey-author",
    categoryId: "culture",
    subcategoryId: "literature",
    difficulty: "medium",
    question: "Σε ποιον ποιητή αποδίδεται παραδοσιακά η Οδύσσεια;",
    answers: ["Σοφοκλή", "Όμηρο", "Ηρόδοτο", "Ευριπίδη"],
    correctIndex: 1,
    explanation: "Η Οδύσσεια είναι αρχαίο ελληνικό επικό ποίημα που αποδίδεται παραδοσιακά στον Όμηρο.",
    sourceTitle: "Encyclopaedia Britannica — Odyssey",
    sourceUrl: "https://www.britannica.com/topic/Odyssey-epic-by-Homer",
  },
  {
    id: "impressionism-origin",
    categoryId: "culture",
    subcategoryId: "visual-arts",
    difficulty: "easy",
    question: "Σε ποια χώρα εμφανίστηκε το καλλιτεχνικό κίνημα του Ιμπρεσιονισμού;",
    answers: ["Ιταλία", "Γαλλία", "Ισπανία", "Ολλανδία"],
    correctIndex: 1,
    explanation: "Ο Ιμπρεσιονισμός αναπτύχθηκε στη Γαλλία, κυρίως στο δεύτερο μισό του 19ου αιώνα.",
    sourceTitle: "National Gallery, London — Impressionism",
    sourceUrl: "https://www.nationalgallery.org.uk/paintings/learn-about-art/guide-to-impressionism",
  },
  {
    id: "starry-night-artist",
    categoryId: "culture",
    subcategoryId: "visual-arts",
    difficulty: "easy",
    question: "Ποιος ζωγράφισε τον πίνακα «Έναστρη Νύχτα»;",
    answers: ["Πάμπλο Πικάσο", "Βίνσεντ βαν Γκογκ", "Κλοντ Μονέ", "Σαλβαδόρ Νταλί"],
    correctIndex: 1,
    explanation: "Ο Βίνσεντ βαν Γκογκ ζωγράφισε την «Έναστρη Νύχτα» το 1889.",
    sourceTitle: "MoMA — The Starry Night",
    sourceUrl: "https://www.moma.org/collection/works/79802",
  },
  {
    id: "roman-numeral-x",
    categoryId: "everyday",
    subcategoryId: "math",
    difficulty: "easy",
    question: "Τι αριθμό συμβολίζει το X στους ρωμαϊκούς αριθμούς;",
    answers: ["5", "10", "50", "100"],
    correctIndex: 1,
    explanation: "Στο ρωμαϊκό σύστημα αριθμών, το X αντιστοιχεί στο 10.",
    sourceTitle: "Encyclopaedia Britannica — Roman numeral",
    sourceUrl: "https://www.britannica.com/topic/Roman-numeral",
  },
  {
    id: "water-boiling-point",
    categoryId: "everyday",
    subcategoryId: "practical-science",
    difficulty: "medium",
    question: "Σε ποια θερμοκρασία βράζει περίπου το καθαρό νερό στο επίπεδο της θάλασσας;",
    answers: ["50°C", "75°C", "100°C", "125°C"],
    correctIndex: 2,
    explanation: "Σε κανονική ατμοσφαιρική πίεση, το καθαρό νερό βράζει περίπου στους 100°C. Σε μεγαλύτερο υψόμετρο το σημείο βρασμού είναι χαμηλότερο.",
    sourceTitle: "USGS — Water properties",
    sourceUrl: "https://www.usgs.gov/special-topics/water-science-school/science/water-properties",
  },
  {
    id: "hours-in-day",
    categoryId: "everyday",
    subcategoryId: "time",
    difficulty: "easy",
    question: "Πόσες ώρες έχει μια συνηθισμένη ημερολογιακή ημέρα;",
    answers: ["12", "18", "24", "36"],
    correctIndex: 2,
    explanation: "Μια συνηθισμένη ημέρα στο ημερολόγιο χωρίζεται σε 24 ώρες.",
    sourceTitle: "Encyclopaedia Britannica — Day",
    sourceUrl: "https://www.britannica.com/science/day-time-period",
  },
  {
    id: "web-inventor",
    categoryId: "technology",
    subcategoryId: "internet",
    difficulty: "medium",
    question: "Ποιος εφηύρε τον Παγκόσμιο Ιστό (World Wide Web);",
    answers: ["Μπιλ Γκέιτς", "Στιβ Τζομπς", "Τιμ Μπέρνερς-Λι", "Άλαν Τιούρινγκ"],
    correctIndex: 2,
    explanation: "Ο Τιμ Μπέρνερς-Λι πρότεινε τον Παγκόσμιο Ιστό στο CERN το 1989.",
    sourceTitle: "CERN — The birth of the Web",
    sourceUrl: "https://home.cern/science/computing/birth-web",
  },
  {
    id: "binary-digits",
    categoryId: "technology",
    subcategoryId: "computing",
    difficulty: "easy",
    question: "Ποια δύο ψηφία χρησιμοποιεί το δυαδικό σύστημα;",
    answers: ["0 και 1", "1 και 2", "0 και 9", "2 και 10"],
    correctIndex: 0,
    explanation: "Το δυαδικό σύστημα αναπαριστά τις τιμές με δύο ψηφία: 0 και 1.",
    sourceTitle: "Encyclopaedia Britannica — Binary code",
    sourceUrl: "https://www.britannica.com/technology/binary-code",
  },
  {
    id: "html-purpose",
    categoryId: "technology",
    subcategoryId: "web-development",
    difficulty: "medium",
    question: "Ποιος είναι ο βασικός ρόλος της HTML σε μια ιστοσελίδα;",
    answers: ["Να δομεί το περιεχόμενο", "Να τροφοδοτεί τον υπολογιστή", "Να κρυπτογραφεί το Wi-Fi", "Να ψύχει τον επεξεργαστή"],
    correctIndex: 0,
    explanation: "Η HTML περιγράφει τη δομή και το νόημα του περιεχομένου μιας ιστοσελίδας. Η εμφάνιση και η συμπεριφορά συνήθως συμπληρώνονται από CSS και JavaScript.",
    sourceTitle: "MDN — HTML: HyperText Markup Language",
    sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  },
  {
    id: "gps-acronym",
    categoryId: "technology",
    subcategoryId: "navigation",
    difficulty: "hard",
    question: "Τι σημαίνουν τα αρχικά GPS;",
    answers: ["Global Positioning System", "General Position Satellite", "Geographic Path Service", "Global Path Signal"],
    correctIndex: 0,
    explanation: "GPS σημαίνει Global Positioning System, ένα δορυφορικό σύστημα προσδιορισμού θέσης.",
    sourceTitle: "GPS.gov — The Global Positioning System",
    sourceUrl: "https://www.gps.gov/systems/gps/",
  },
  {
    id: "basketball-players",
    categoryId: "sports",
    subcategoryId: "team-sports",
    difficulty: "easy",
    question: "Πόσοι παίκτες από κάθε ομάδα βρίσκονται συνήθως στο γήπεδο σε έναν αγώνα καλαθοσφαίρισης;",
    answers: ["4", "5", "6", "7"],
    correctIndex: 1,
    explanation: "Στο συνηθισμένο παιχνίδι καλαθοσφαίρισης, κάθε ομάδα έχει πέντε παίκτες στο γήπεδο.",
    sourceTitle: "NBA — Rules and Regulations",
    sourceUrl: "https://official.nba.com/rulebook/",
  },
  {
    id: "marathon-distance",
    categoryId: "sports",
    subcategoryId: "running",
    difficulty: "medium",
    question: "Ποια είναι η επίσημη απόσταση του μαραθωνίου;",
    answers: ["21,0975 χλμ.", "40 χλμ.", "42,195 χλμ.", "50 χλμ."],
    correctIndex: 2,
    explanation: "Η επίσημη απόσταση του μαραθωνίου είναι 42,195 χιλιόμετρα.",
    sourceTitle: "World Athletics — Competition and Technical Rules",
    sourceUrl: "https://worldathletics.org/about-iaaf/documents/book-of-rules",
  },
  {
    id: "wimbledon-surface",
    categoryId: "sports",
    subcategoryId: "tennis",
    difficulty: "easy",
    question: "Σε ποια επιφάνεια παίζεται παραδοσιακά το τουρνουά τένις Wimbledon;",
    answers: ["Χώμα", "Σκληρό γήπεδο", "Γρασίδι", "Άμμος"],
    correctIndex: 2,
    explanation: "Το Wimbledon είναι γνωστό ως το κορυφαίο τουρνουά τένις σε γήπεδα με φυσικό γρασίδι.",
    sourceTitle: "Wimbledon — The Championships",
    sourceUrl: "https://www.wimbledon.com/",
  },
  {
    id: "football-match-duration",
    categoryId: "sports",
    subcategoryId: "football",
    difficulty: "hard",
    question: "Πόση είναι η κανονική διάρκεια ενός αγώνα ποδοσφαίρου ενηλίκων, χωρίς τις καθυστερήσεις;",
    answers: ["60 λεπτά", "80 λεπτά", "90 λεπτά", "100 λεπτά"],
    correctIndex: 2,
    explanation: "Σύμφωνα με τους Κανόνες του Παιχνιδιού, ο αγώνας έχει δύο ημίχρονα των 45 λεπτών, πριν από τον πρόσθετο χρόνο.",
    sourceTitle: "IFAB — Law 7: The Duration of the Match",
    sourceUrl: "https://www.theifab.com/laws/latest/the-duration-of-the-match/",
  },

  {
    id: "speed-of-light",
    categoryId: "science",
    subcategoryId: "physics",
    difficulty: "hard",
    question: "Ποια είναι περίπου η ταχύτητα του φωτός στο κενό;",
    answers: ["30.000 χλμ./δευτ.", "150.000 χλμ./δευτ.", "300.000 χλμ./δευτ.", "1.000.000 χλμ./δευτ."],
    correctIndex: 2,
    explanation: "Η ταχύτητα του φωτός στο κενό είναι περίπου 299.792 χιλιόμετρα ανά δευτερόλεπτο.",
    sourceTitle: "NASA — Speed of Light",
    sourceUrl: "https://imagine.gsfc.nasa.gov/science/toolbox/calculate.html",
  },
  {
    id: "bosporus-strait",
    categoryId: "geography",
    subcategoryId: "landforms",
    difficulty: "hard",
    question: "Ποιο στενό χωρίζει το ευρωπαϊκό από το ασιατικό τμήμα της Κωνσταντινούπολης;",
    answers: ["Δαρδανέλλια", "Βόσπορος", "Γιβραλτάρ", "Μεσσήνη"],
    correctIndex: 1,
    explanation: "Ο Βόσπορος περνά μέσα από την Κωνσταντινούπολη και χωρίζει την ευρωπαϊκή από την ασιατική πλευρά της πόλης.",
    sourceTitle: "Encyclopaedia Britannica — Bosporus",
    sourceUrl: "https://www.britannica.com/place/Bosporus",
  },
  {
    id: "don-quixote-author",
    categoryId: "culture",
    subcategoryId: "literature",
    difficulty: "hard",
    question: "Ποιος έγραψε το μυθιστόρημα «Δον Κιχώτης»;",
    answers: ["Φεντερίκο Γκαρθία Λόρκα", "Μιγκέλ ντε Θερβάντες", "Λόπε δε Βέγα", "Γκαμπριέλ Γκαρσία Μάρκες"],
    correctIndex: 1,
    explanation: "Ο Μιγκέλ ντε Θερβάντες έγραψε τον «Δον Κιχώτη», έργο που δημοσιεύτηκε σε δύο μέρη το 1605 και το 1615.",
    sourceTitle: "Encyclopaedia Britannica — Don Quixote",
    sourceUrl: "https://www.britannica.com/topic/Don-Quixote-novel",
  },
  {
    id: "https-protocol",
    categoryId: "technology",
    subcategoryId: "internet",
    difficulty: "hard",
    question: "Ποιο πρωτόκολλο χρησιμοποιείται συνήθως για την κρυπτογραφική ασφάλεια μιας σύνδεσης HTTPS;",
    answers: ["FTP", "TLS", "SMTP", "DHCP"],
    correctIndex: 1,
    explanation: "Το HTTPS χρησιμοποιεί HTTP μέσω TLS, το οποίο παρέχει κρυπτογράφηση και έλεγχο ταυτότητας της σύνδεσης.",
    sourceTitle: "MDN — HTTPS",
    sourceUrl: "https://developer.mozilla.org/en-US/docs/Glossary/HTTPS",
  },

  // 2026-10-31 expansion: original published questions above remain unchanged.
  {
    "id": "daily-rosetta-comparison",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "easy",
    "question": "Γιατί η Στήλη της Ροζέτας βοήθησε στην αποκρυπτογράφηση των ιερογλυφικών;",
    "answers": [
      "Παρέθετε έναν κατάλογο εικόνων με τη σημασία τους",
      "Περιείχε ένα αιγυπτιακό αλφάβητο με λατινική μετάφραση",
      "Έδινε οδηγίες για την προφορά κάθε συμβόλου",
      "Παρέθετε το ίδιο διάταγμα σε διαφορετικές γραφές"
    ],
    "correctIndex": 3,
    "explanation": "Το διάταγμα εμφανίζεται σε ιερογλυφική, δημοτική αιγυπτιακή και ελληνική γραφή. Το γνωστό ελληνικό κείμενο έδωσε στους μελετητές ένα σημείο σύγκρισης.",
    "sourceTitle": "British Museum — Room 4 Touch Tour Guide",
    "sourceUrl": "https://www.britishmuseum.org/sites/default/files/2023-11/Room-4-Touch-Tour-Guide.pdf"
  },
  {
    "id": "daily-athens-assembly",
    "categoryId": "history",
    "subcategoryId": "ancient-greece",
    "difficulty": "easy",
    "question": "Στην κλασική Αθήνα, πού συμμετείχαν άμεσα οι άνδρες πολίτες στη λήψη πολιτικών αποφάσεων;",
    "answers": [
      "Στο μαντείο των Δελφών",
      "Στο συνέδριο της Αμφικτιονίας",
      "Στη Γερουσία των Σπαρτιατών",
      "Στην Εκκλησία του Δήμου"
    ],
    "correctIndex": 3,
    "explanation": "Η Εκκλησία του Δήμου ήταν η συνέλευση των πολιτών. Η συμμετοχή ήταν άμεση, αλλά δεν περιλάμβανε όλους τους κατοίκους: γυναίκες, δούλοι και μέτοικοι αποκλείονταν.",
    "sourceTitle": "Harvard Center for Hellenic Studies — Athenian Law Lectures",
    "sourceUrl": "https://www-current.chs.harvard.edu/discussion-series-athenian-law-lectures-8/"
  },
  {
    "id": "daily-gutenberg-handwork",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "easy",
    "question": "Ένα βιβλίο του Γουτεμβέργιου έχει τυπωμένο κείμενο και αρχικά γράμματα ζωγραφισμένα στο χέρι. Τι δείχνει αυτό;",
    "answers": [
      "Ότι εκτύπωση και χειροποίητη διακόσμηση μπορούσαν να συνδυάζονται",
      "Ότι το βιβλίο δεν είχε τυπωθεί σε πιεστήριο",
      "Ότι κάθε σελίδα είχε γραφτεί ολόκληρη στο χέρι",
      "Ότι τα αρχικά προστέθηκαν υποχρεωτικά αιώνες αργότερα"
    ],
    "correctIndex": 0,
    "explanation": "Στη Βίβλο του Γουτεμβέργιου άφηναν χώρο για επικεφαλίδες και αρχικά που προσθέτονταν στο χέρι. Η νέα τεχνική δεν κατάργησε αμέσως τις παλιές πρακτικές.",
    "sourceTitle": "Harvard Library — The Gutenberg Bible",
    "sourceUrl": "https://library.harvard.edu/collections/gutenberg-bible"
  },
  {
    "id": "daily-rosetta-sounds",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "medium",
    "question": "Ποια ανακάλυψη ανέτρεψε την ιδέα ότι τα ιερογλυφικά ήταν μόνο εικόνες που συμβόλιζαν έννοιες;",
    "answers": [
      "Ότι κάθε σύμβολο αντιστοιχούσε σε ολόκληρη πρόταση",
      "Ότι γράφονταν αποκλειστικά από αριστερά προς τα δεξιά",
      "Ότι αποτελούσαν κρυπτογραφημένη μορφή των ελληνικών",
      "Ότι μπορούσαν να αποδίδουν και ήχους της γλώσσας"
    ],
    "correctIndex": 3,
    "explanation": "Τα ιερογλυφικά δεν λειτουργούσαν μόνο ως εικόνες εννοιών. Η αναγνώριση φωνητικών αξιών επέτρεψε να διαβαστούν αιγυπτιακές λέξεις και ονόματα.",
    "sourceTitle": "British Museum — Room 4 Touch Tour Guide",
    "sourceUrl": "https://www.britishmuseum.org/sites/default/files/2023-11/Room-4-Touch-Tour-Guide.pdf"
  },
  {
    "id": "daily-athens-lottery",
    "categoryId": "history",
    "subcategoryId": "ancient-greece",
    "difficulty": "medium",
    "question": "Ποιος τρόπος επιλογής συνδεόταν με πολλά δημόσια αξιώματα της αθηναϊκής δημοκρατίας;",
    "answers": [
      "Η κλήρωση μεταξύ επιλέξιμων πολιτών",
      "Ο διορισμός από τον βασιλιά",
      "Η ανάθεση στον μεγαλύτερο φορολογούμενο",
      "Η κληρονομική διαδοχή μέσα σε οικογένειες"
    ],
    "correctIndex": 0,
    "explanation": "Πολλά αξιώματα καλύπτονταν με κλήρωση, ώστε περισσότεροι πολίτες να έχουν δυνατότητα συμμετοχής. Δεν ίσχυε για όλα: οι στρατηγοί, για παράδειγμα, εκλέγονταν.",
    "sourceTitle": "Harvard Center for Hellenic Studies — Athenian Law Lectures",
    "sourceUrl": "https://www-current.chs.harvard.edu/discussion-series-athenian-law-lectures-8/"
  },
  {
    "id": "daily-gutenberg-latin",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "medium",
    "question": "Σε ποια γλώσσα τυπώθηκε το κείμενο της περίφημης Βίβλου του Γουτεμβέργιου;",
    "answers": [
      "Στα λατινικά",
      "Στα γερμανικά",
      "Στα εβραϊκά",
      "Στα αρχαία ελληνικά"
    ],
    "correctIndex": 0,
    "explanation": "Τυπώθηκε η λατινική Βουλγάτα. Το ότι το πιεστήριο βρισκόταν σε γερμανόφωνη πόλη δεν σημαίνει ότι το βιβλίο ήταν γραμμένο στα γερμανικά.",
    "sourceTitle": "Harvard Library — The Gutenberg Bible",
    "sourceUrl": "https://library.harvard.edu/collections/gutenberg-bible"
  },
  {
    "id": "daily-cartouche-inference",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "hard",
    "question": "Σε αιγυπτιακή επιγραφή ένα σύνολο ιερογλυφικών περικλείεται σε δέλτο, ένα οβάλ πλαίσιο. Τι περιμένει να βρει εκεί ο μελετητής;",
    "answers": [
      "Μια λίστα φόρων σε σιτηρά",
      "Τη χρονολογία μιας πλημμύρας του Νείλου",
      "Το όνομα ενός βασιλιά ή μιας βασίλισσας",
      "Το όνομα του τεχνίτη που χάραξε την πέτρα"
    ],
    "correctIndex": 2,
    "explanation": "Η δέλτος, γνωστή και ως cartouche, περιβάλλει βασιλικά ονόματα. Η αναγνώρισή τους έδωσε χρήσιμα σημεία αναφοράς στην προσπάθεια ανάγνωσης των επιγραφών.",
    "sourceTitle": "British Museum — Museum explorers: Ancient Egypt",
    "sourceUrl": "https://www.britishmuseum.org/sites/default/files/2024-06/Museum_explorers_Ancient_Egypt.pdf"
  },
  {
    "id": "daily-athens-council-distinction",
    "categoryId": "history",
    "subcategoryId": "ancient-greece",
    "difficulty": "hard",
    "question": "Ποια περιγραφή ξεχωρίζει σωστά τη Βουλή των Πεντακοσίων από την Εκκλησία του Δήμου;",
    "answers": [
      "Η Βουλή προετοίμαζε εργασίες της συνέλευσης, ενώ στην Εκκλησία συμμετείχε ευρύτερα το σώμα των πολιτών",
      "Η Βουλή ήταν δικαστήριο ξένων εμπόρων, ενώ η Εκκλησία όργανο είσπραξης φόρων",
      "Η Βουλή ήταν συνέλευση όλων των κατοίκων, ενώ η Εκκλησία επιτροπή ιερέων",
      "Η Βουλή αποτελούνταν από κληρονομικούς άρχοντες, ενώ η Εκκλησία από στρατηγούς"
    ],
    "correctIndex": 0,
    "explanation": "Η Βουλή των Πεντακοσίων είχε διαρκείς διοικητικές και προπαρασκευαστικές αρμοδιότητες. Δεν ταυτιζόταν με τη συνέλευση των πολιτών που συζητούσε και αποφάσιζε.",
    "sourceTitle": "Harvard Center for Hellenic Studies — Athenian Law Lectures",
    "sourceUrl": "https://www-current.chs.harvard.edu/discussion-series-athenian-law-lectures-8/"
  },
  {
    "id": "daily-gutenberg-qualified-first",
    "categoryId": "history",
    "subcategoryId": "world-history",
    "difficulty": "hard",
    "question": "Ποιος χαρακτηρισμός της Βίβλου του Γουτεμβέργιου είναι ιστορικά ακριβέστερος;",
    "answers": [
      "Πρώτο βιβλίο που κατασκευάστηκε από χαρτί",
      "Πρώτο μεγάλο έργο τυπωμένο στην Ευρώπη με κινητά μεταλλικά στοιχεία",
      "Πρώτο βιβλίο που γράφτηκε σε ευρωπαϊκή γλώσσα",
      "Πρώτο βιβλίο που τυπώθηκε οπουδήποτε στον κόσμο"
    ],
    "correctIndex": 1,
    "explanation": "Η διατύπωση χρειάζεται γεωγραφικό και τεχνικό προσδιορισμό: μεγάλο έργο, Ευρώπη, κινητά μεταλλικά στοιχεία. Δεν σημαίνει ότι η εκτύπωση εμφανίστηκε τότε για πρώτη φορά παγκοσμίως.",
    "sourceTitle": "Harvard Library — The Gutenberg Bible",
    "sourceUrl": "https://library.harvard.edu/collections/gutenberg-bible"
  },
  {
    "id": "daily-opposite-seasons",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "easy",
    "question": "Όταν στην Ελλάδα έχουμε καλοκαίρι, ποια εποχή έχει συνήθως η νότια Αυστραλία;",
    "answers": [
      "Καλοκαίρι",
      "Χειμώνα",
      "Άνοιξη",
      "Φθινόπωρο"
    ],
    "correctIndex": 1,
    "explanation": "Τα δύο ημισφαίρια έχουν αντίθετες εποχές, επειδή ο άξονας της Γης είναι κεκλιμένος. Όταν το βόρειο ημισφαίριο δέχεται πιο άμεσα τις ακτίνες του Ήλιου, το νότιο δέχεται πιο πλάγιες.",
    "sourceTitle": "NASA Space Place — What Causes the Seasons?",
    "sourceUrl": "https://spaceplace.nasa.gov/seasons/en/"
  },
  {
    "id": "daily-spectrum-purpose",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "easy",
    "question": "Τι κάνει ένας φασματογράφος στο φως που φτάνει από ένα άστρο;",
    "answers": [
      "Μετρά μόνο πόσο μεγάλο φαίνεται το άστρο",
      "Μετατρέπει το φως σε ηχητικό κύμα",
      "Αφαιρεί το χρώμα και κρατά μόνο τη συνολική φωτεινότητα",
      "Το αναλύει στα επιμέρους μήκη κύματος"
    ],
    "correctIndex": 3,
    "explanation": "Το φάσμα δείχνει πώς κατανέμεται το φως στα διάφορα μήκη κύματος. Έτσι μπορούμε να εξετάσουμε λεπτομέρειες που χάνονται όταν βλέπουμε όλο το φως μαζί.",
    "sourceTitle": "NASA — Spectroscopy 101: Types of Spectra and Spectroscopy",
    "sourceUrl": "https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-types-of-spectra-and-spectroscopy/"
  },
  {
    "id": "daily-floating-force",
    "categoryId": "science",
    "subcategoryId": "physics",
    "difficulty": "easy",
    "question": "Ποια δύναμη από το νερό στηρίζει προς τα πάνω ένα πλοίο που επιπλέει;",
    "answers": [
      "Η επιφανειακή τάση από μόνη της",
      "Η τριβή του αέρα",
      "Η μαγνητική έλξη",
      "Η άνωση"
    ],
    "correctIndex": 3,
    "explanation": "Το βυθισμένο τμήμα εκτοπίζει νερό και δέχεται άνωση. Όταν το πλοίο επιπλέει ακίνητο, η άνωση εξισορροπεί το βάρος του.",
    "sourceTitle": "OpenStax — College Physics 2e, 11.7 Archimedes’ Principle",
    "sourceUrl": "https://openstax.org/books/college-physics-2e/pages/11-7-archimedes-principle"
  },
  {
    "id": "daily-seasons-not-distance",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "medium",
    "question": "Ποια παρατήρηση δείχνει ότι η απόσταση Γης–Ήλιου δεν εξηγεί από μόνη της τις εποχές;",
    "answers": [
      "Η μέρα διαρκεί περίπου 24 ώρες",
      "Τα δύο ημισφαίρια έχουν ταυτόχρονα αντίθετες εποχές",
      "Ο Ήλιος ανατέλλει γενικά από τα ανατολικά",
      "Η Σελήνη αλλάζει φάσεις κάθε μήνα"
    ],
    "correctIndex": 1,
    "explanation": "Και τα δύο ημισφαίρια βρίσκονται σχεδόν στην ίδια απόσταση από τον Ήλιο. Οι αντίθετες εποχές εξηγούνται από την κλίση του άξονα και τη διαφορετική γωνία φωτισμού.",
    "sourceTitle": "NASA Space Place — What Causes the Seasons?",
    "sourceUrl": "https://spaceplace.nasa.gov/seasons/en/"
  },
  {
    "id": "daily-stellar-color-temperature",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "medium",
    "question": "Αν συγκρίνουμε ένα μπλε και ένα κόκκινο άστρο, χωρίς να επηρεάζει το χρώμα τους μεσοαστρική σκόνη, ποιο έχει συνήθως θερμότερη επιφάνεια;",
    "answers": [
      "Έχουν υποχρεωτικά την ίδια θερμοκρασία",
      "Το χρώμα δείχνει μόνο την απόσταση",
      "Το κόκκινο",
      "Το μπλε"
    ],
    "correctIndex": 3,
    "explanation": "Η μορφή του θερμικού φάσματος συνδέεται με τη θερμοκρασία. Τα θερμότερα άστρα εκπέμπουν αναλογικά περισσότερο φως προς το μπλε, ενώ τα ψυχρότερα προς το κόκκινο.",
    "sourceTitle": "NASA — Spectroscopy 101: Types of Spectra and Spectroscopy",
    "sourceUrl": "https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-types-of-spectra-and-spectroscopy/"
  },
  {
    "id": "daily-floating-displacement",
    "categoryId": "science",
    "subcategoryId": "physics",
    "difficulty": "medium",
    "question": "Ένα σκάφος επιπλέει ακίνητο. Προσθέτουμε φορτίο χωρίς να μπει νερό στο εσωτερικό και εξακολουθεί να επιπλέει. Τι αλλάζει;",
    "answers": [
      "Εκτοπίζει λιγότερο νερό",
      "Η άνωση παραμένει ίδια παρότι αυξήθηκε το βάρος",
      "Το νερό γύρω του γίνεται υποχρεωτικά πυκνότερο",
      "Εκτοπίζει περισσότερο νερό"
    ],
    "correctIndex": 3,
    "explanation": "Το μεγαλύτερο συνολικό βάρος χρειάζεται μεγαλύτερη άνωση. Το σκάφος βυθίζεται λίγο περισσότερο και εκτοπίζει επιπλέον νερό μέχρι να αποκατασταθεί η ισορροπία.",
    "sourceTitle": "OpenStax — College Physics 2e, 11.7 Archimedes’ Principle",
    "sourceUrl": "https://openstax.org/books/college-physics-2e/pages/11-7-archimedes-principle"
  },
  {
    "id": "daily-perihelion-january",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "hard",
    "question": "Η Γη περνά από το κοντινότερο σημείο της τροχιάς της στον Ήλιο περίπου τον Ιανουάριο. Πώς συμβιβάζεται αυτό με τον χειμώνα στην Ελλάδα;",
    "answers": [
      "Η κλίση του άξονα επηρεάζει τον εποχικό φωτισμό περισσότερο από τη μικρή μεταβολή της απόστασης",
      "Η καθημερινή περιστροφή της Γης αντιστρέφεται τον χειμώνα",
      "Η απόσταση από τον Ήλιο είναι η ίδια όλο το έτος και οι εποχές οφείλονται μόνο στα σύννεφα",
      "Το βόρειο ημισφαίριο απομακρύνεται από τον Ήλιο ενώ το νότιο πλησιάζει κατά εκατομμύρια χιλιόμετρα"
    ],
    "correctIndex": 0,
    "explanation": "Το περιήλιο συμβαίνει περίπου τον Ιανουάριο. Στο βόρειο ημισφαίριο όμως οι ακτίνες πέφτουν πιο πλάγια και οι μέρες είναι μικρότερες: η κλίση του άξονα καθορίζει τις εποχές.",
    "sourceTitle": "NASA Space Place — What Causes the Seasons?",
    "sourceUrl": "https://spaceplace.nasa.gov/seasons/en/"
  },
  {
    "id": "daily-absorption-signature",
    "categoryId": "science",
    "subcategoryId": "space",
    "difficulty": "hard",
    "question": "Στο φάσμα ενός άστρου εμφανίζονται σκοτεινές γραμμές στα ίδια μήκη κύματος όπου ένα στοιχείο απορροφά φως στο εργαστήριο. Τι υποστηρίζει αυτή η αντιστοιχία;",
    "answers": [
      "Ότι το στοιχείο υπάρχει μόνο στον πυρήνα του άστρου",
      "Ότι το άστρο έχει την ίδια μάζα με το εργαστηριακό δείγμα",
      "Ότι όλες οι σκοτεινές γραμμές είναι βλάβες του τηλεσκοπίου",
      "Την παρουσία του στοιχείου στο αέριο που διασχίζει το φως"
    ],
    "correctIndex": 3,
    "explanation": "Τα στοιχεία έχουν χαρακτηριστικά μοτίβα απορρόφησης. Η αντιστοιχία βοηθά να αναγνωρίσουμε υλικό στη διαδρομή του φωτός· δεν μετρά από μόνη της τη μάζα του άστρου.",
    "sourceTitle": "NASA — Spectroscopy 101: Types of Spectra and Spectroscopy",
    "sourceUrl": "https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-types-of-spectra-and-spectroscopy/"
  },
  {
    "id": "daily-submerged-equal-volumes",
    "categoryId": "science",
    "subcategoryId": "physics",
    "difficulty": "hard",
    "question": "Δύο συμπαγή σώματα ίδιου όγκου, ένα σιδερένιο και ένα αλουμινένιο, κρατιούνται πλήρως βυθισμένα στο ίδιο νερό, χωρίς να ακουμπούν στον πυθμένα. Ποιο δέχεται μεγαλύτερη άνωση;",
    "answers": [
      "Το σιδερένιο, επειδή είναι βαρύτερο",
      "Εξαρτάται μόνο από το σχήμα τους",
      "Δέχονται ίση άνωση",
      "Το αλουμινένιο, επειδή είναι ελαφρύτερο"
    ],
    "correctIndex": 2,
    "explanation": "Η άνωση ισούται με το βάρος του εκτοπιζόμενου νερού. Ίδιος βυθισμένος όγκος στο ίδιο υγρό σημαίνει ίση άνωση, παρότι τα βάρη των σωμάτων διαφέρουν.",
    "sourceTitle": "OpenStax — College Physics 2e, 11.7 Archimedes’ Principle",
    "sourceUrl": "https://openstax.org/books/college-physics-2e/pages/11-7-archimedes-principle"
  },
  {
    "id": "daily-groundwater-spaces",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "easy",
    "question": "Πού βρίσκεται το μεγαλύτερο μέρος του υπόγειου νερού;",
    "answers": [
      "Μόνο στο χώμα πάνω από το πρώτο στρώμα βράχου",
      "Σε πόρους και ρωγμές του εδάφους και των πετρωμάτων",
      "Σε μεγάλους ανοιχτούς υπόγειους ποταμούς",
      "Μόνο σε σπήλαια κάτω από λίμνες"
    ],
    "correctIndex": 1,
    "explanation": "Συνήθως το υπόγειο νερό μοιάζει περισσότερο με νερό μέσα σε σφουγγάρι παρά με κρυφό ποτάμι. Γεμίζει κενά ανάμεσα σε κόκκους και μέσα σε ρωγμές.",
    "sourceTitle": "USGS — Groundwater Flow and the Water Cycle",
    "sourceUrl": "https://www.usgs.gov/water-science-school/science/groundwater-flow-and-water-cycle"
  },
  {
    "id": "daily-diverging-plates",
    "categoryId": "geography",
    "subcategoryId": "landforms",
    "difficulty": "easy",
    "question": "Σε ένα αποκλίνον όριο τεκτονικών πλακών, πώς κινούνται οι πλάκες μεταξύ τους;",
    "answers": [
      "Απομακρύνονται",
      "Παραμένουν ακίνητες μεταξύ τους",
      "Ολισθαίνουν παράλληλα η μία δίπλα στην άλλη",
      "Συγκρούονται μετωπικά"
    ],
    "correctIndex": 0,
    "explanation": "Στα αποκλίνοντα όρια οι πλάκες απομακρύνονται. Σε πολλές τέτοιες περιοχές ανεβαίνει μάγμα και σχηματίζεται νέος φλοιός, όπως στις μεσοωκεάνιες ράχες.",
    "sourceTitle": "NOAA Ocean Exploration — What are the different types of plate tectonic boundaries?",
    "sourceUrl": "https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/"
  },
  {
    "id": "daily-contour-meaning",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "easy",
    "question": "Τι ενώνει μια ισοϋψής γραμμή σε τοπογραφικό χάρτη;",
    "answers": [
      "Πόλεις με τον ίδιο πληθυσμό",
      "Περιοχές με την ίδια βροχόπτωση",
      "Σημεία με την ίδια θερμοκρασία",
      "Σημεία με το ίδιο υψόμετρο"
    ],
    "correctIndex": 3,
    "explanation": "Η ισοϋψής ενώνει σημεία ίδιου υψομέτρου. Έτσι ένας επίπεδος χάρτης μπορεί να αποδώσει λόφους, κοιλάδες και πλαγιές.",
    "sourceTitle": "USGS — Topographic Mapping",
    "sourceUrl": "https://www.usgs.gov/educational-resources/topographic-mapping"
  },
  {
    "id": "daily-permeable-aquifer",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "medium",
    "question": "Ένα πέτρωμα έχει πολλά κενά, αλλά αυτά επικοινωνούν ελάχιστα μεταξύ τους. Γιατί μπορεί να δίνει λίγο νερό σε μια γεώτρηση;",
    "answers": [
      "Το μεγάλο πορώδες σημαίνει πάντα μικρό απόθεμα νερού",
      "Τα πολλά κενά σημαίνουν ότι το πέτρωμα είναι υποχρεωτικά αδιαπέραστο",
      "Το νερό δυσκολεύεται να κινηθεί από πόρο σε πόρο",
      "Η αποθηκευμένη ποσότητα νερού καθορίζεται μόνο από το βάθος"
    ],
    "correctIndex": 2,
    "explanation": "Δεν αρκεί να υπάρχουν κενά, δηλαδή πορώδες. Χρειάζεται και διαπερατότητα: το νερό πρέπει να μπορεί να κινηθεί μέσα από το υλικό προς τη γεώτρηση.",
    "sourceTitle": "USGS — Groundwater Flow and the Water Cycle",
    "sourceUrl": "https://www.usgs.gov/water-science-school/science/groundwater-flow-and-water-cycle"
  },
  {
    "id": "daily-transform-boundary",
    "categoryId": "geography",
    "subcategoryId": "landforms",
    "difficulty": "medium",
    "question": "Δύο τεκτονικές πλάκες ολισθαίνουν οριζόντια η μία δίπλα στην άλλη. Ποιος τύπος ορίου περιγράφεται;",
    "answers": [
      "Ζώνη καταβύθισης",
      "Όριο μετασχηματισμού",
      "Ζώνη ηπειρωτικής σύγκρουσης",
      "Αποκλίνον όριο"
    ],
    "correctIndex": 1,
    "explanation": "Στα όρια μετασχηματισμού κυριαρχεί η πλευρική ολίσθηση. Δεν πρόκειται ούτε για απομάκρυνση των πλακών ούτε για βύθιση της μίας κάτω από την άλλη.",
    "sourceTitle": "NOAA Ocean Exploration — What are the different types of plate tectonic boundaries?",
    "sourceUrl": "https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/"
  },
  {
    "id": "daily-contour-slope",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "medium",
    "question": "Στον ίδιο χάρτη, με σταθερό βήμα ισοϋψών, πού είναι συνήθως πιο απότομη η πλαγιά;",
    "answers": [
      "Εκεί όπου οι ισοϋψείς είναι πιο κοντά μεταξύ τους",
      "Εκεί όπου υπάρχουν λιγότερα τοπωνύμια",
      "Εκεί όπου οι ισοϋψείς έχουν πιο ανοιχτό χρώμα",
      "Εκεί όπου οι ισοϋψείς απέχουν περισσότερο"
    ],
    "correctIndex": 0,
    "explanation": "Η ίδια υψομετρική διαφορά σε μικρότερη οριζόντια απόσταση σημαίνει μεγαλύτερη κλίση. Η σύγκριση προϋποθέτει ίδιο βήμα ισοϋψών και ίδια κλίμακα.",
    "sourceTitle": "USGS — US Topo Cartographic Specifications: Map Symbol Guide",
    "sourceUrl": "https://www.usgs.gov/ngp-standards-and-specifications/us-topo-cartographic-specifications-map-symbol-guide"
  },
  {
    "id": "daily-groundwater-delayed-flow",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "hard",
    "question": "Ένα ποτάμι συνεχίζει να έχει νερό αρκετές μέρες μετά τη βροχή. Ποια εξήγηση είναι συμβατή με τον κύκλο του νερού;",
    "answers": [
      "Το νερό της βροχής παραμένει όλο στην επιφάνεια μέχρι την επόμενη βροχή",
      "Η εξάτμιση του ποταμού είναι η κύρια πηγή της συνεχιζόμενης ροής",
      "Υπόγειο νερό εκφορτίζεται σταδιακά στην κοίτη",
      "Όλο το νερό που διηθείται επιστρέφει αμέσως στην κοίτη"
    ],
    "correctIndex": 2,
    "explanation": "Το νερό που έχει διηθηθεί μπορεί να επιστρέψει αργότερα στην επιφάνεια και να τροφοδοτήσει ποτάμια. Η υπόγεια ροή συνδέει βροχοπτώσεις και επιφανειακά νερά με χρονική καθυστέρηση.",
    "sourceTitle": "USGS — Groundwater Flow and the Water Cycle",
    "sourceUrl": "https://www.usgs.gov/water-science-school/science/groundwater-flow-and-water-cycle"
  },
  {
    "id": "daily-subduction-vs-transform",
    "categoryId": "geography",
    "subcategoryId": "landforms",
    "difficulty": "hard",
    "question": "Σε μια περιοχή η ωκεάνια πλάκα βυθίζεται κάτω από άλλη πλάκα. Ποιο ζεύγος χαρακτηριστικών ταιριάζει περισσότερο;",
    "answers": [
      "Αποκλίνον όριο και καταβύθιση ηπειρωτικού φλοιού",
      "Αποκλίνον όριο και μεσοωκεάνια ράχη",
      "Συγκλίνον όριο και ωκεάνια τάφρος",
      "Όριο μετασχηματισμού και δημιουργία νέου φλοιού"
    ],
    "correctIndex": 2,
    "explanation": "Η καταβύθιση συμβαίνει σε συγκλίνον όριο και συνδέεται με βαθιές τάφρους. Στη μεσοωκεάνια ράχη, αντίθετα, οι πλάκες απομακρύνονται και δημιουργείται φλοιός.",
    "sourceTitle": "NOAA Ocean Exploration — What are the different types of plate tectonic boundaries?",
    "sourceUrl": "https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/"
  },
  {
    "id": "daily-map-scale-distance",
    "categoryId": "geography",
    "subcategoryId": "earth",
    "difficulty": "hard",
    "question": "Σε χάρτη κλίμακας 1:50.000, δύο σημεία απέχουν 4 εκατοστά. Ποια είναι η αντίστοιχη οριζόντια απόσταση στο έδαφος;",
    "answers": [
      "20 χιλιόμετρα",
      "2 χιλιόμετρα",
      "200 μέτρα",
      "12,5 χιλιόμετρα"
    ],
    "correctIndex": 1,
    "explanation": "Κάθε εκατοστό στον χάρτη αντιστοιχεί σε 50.000 εκατοστά, δηλαδή 500 μέτρα. Άρα 4 εκατοστά αντιστοιχούν σε 2 χιλιόμετρα· η διαδρομή σε ανώμαλο έδαφος μπορεί να είναι μεγαλύτερη.",
    "sourceTitle": "USGS — Catalog of Maps: Map scales",
    "sourceUrl": "https://pubs.usgs.gov/gip/70039188/plate-1.pdf"
  },
  {
    "id": "daily-dns-address",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "easy",
    "question": "Ποια είναι μια βασική δουλειά του DNS όταν ανοίγεις μια ιστοσελίδα;",
    "answers": [
      "Να επιλέγει ποια αρχεία θα μείνουν στην cache",
      "Να ελέγχει αν ο κωδικός σύνδεσης είναι σωστός",
      "Να συμπιέζει κάθε φωτογραφία της σελίδας",
      "Να αντιστοιχίζει το όνομα του ιστοτόπου σε διεύθυνση IP"
    ],
    "correctIndex": 3,
    "explanation": "Το DNS βοηθά τον υπολογιστή να βρει σε ποια διεύθυνση αντιστοιχεί ένα όνομα, όπως example.com. Δεν είναι το σύστημα που σχεδιάζει ή εμφανίζει την ιστοσελίδα.",
    "sourceTitle": "MDN — DNS",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Glossary/DNS"
  },
  {
    "id": "daily-browser-cache-purpose",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "easy",
    "question": "Γιατί ο browser κρατά συχνά τοπικό αντίγραφο μιας εικόνας που έχεις ήδη δει;",
    "answers": [
      "Για να διασφαλίσει ότι το αντίγραφο είναι πάντα το πιο πρόσφατο",
      "Για να την ξαναχρησιμοποιήσει χωρίς νέα πλήρη λήψη",
      "Για να αυξήσει την ανάλυση του πρωτοτύπου",
      "Για να αποκτήσει πρόσβαση στον ιστότοπο χωρίς έλεγχο σύνδεσης"
    ],
    "correctIndex": 1,
    "explanation": "Η προσωρινή μνήμη, ή cache, επιτρέπει την επαναχρησιμοποίηση αποθηκευμένων πόρων. Έτσι μειώνονται οι μεταφορές δεδομένων και συχνά η αναμονή.",
    "sourceTitle": "MDN — HTTP caching",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
  },
  {
    "id": "daily-lossless-meaning",
    "categoryId": "technology",
    "subcategoryId": "computing",
    "difficulty": "easy",
    "question": "Τι σημαίνει ότι μια συμπίεση είναι «χωρίς απώλειες»;",
    "answers": [
      "Ότι οι αλλαγές στα δεδομένα δεν φαίνονται με γυμνό μάτι",
      "Ότι ανακτώνται ακριβώς τα αρχικά δεδομένα",
      "Ότι το αρχείο μικραίνει πάντα στο μισό",
      "Ότι το αρχείο διατηρεί υποχρεωτικά την ίδια μορφή"
    ],
    "correctIndex": 1,
    "explanation": "Στη συμπίεση χωρίς απώλειες τα αρχικά δεδομένα μπορούν να αποκατασταθούν ακριβώς. Στη συμπίεση με απώλειες απορρίπτεται μέρος της πληροφορίας για μικρότερο μέγεθος.",
    "sourceTitle": "MDN — Compression in HTTP",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression"
  },
  {
    "id": "daily-domain-subdomain",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "medium",
    "question": "Στη διεύθυνση support.example.com, τι είναι το «support» σε σχέση με το example.com;",
    "answers": [
      "Η διαδρομή ενός φακέλου στον server",
      "Υποτομέας του example.com",
      "Η επέκταση του αρχείου που ανοίγει",
      "Το πρωτόκολλο κρυπτογράφησης"
    ],
    "correctIndex": 1,
    "explanation": "Ένας κάτοχος domain μπορεί να δημιουργεί υποτομείς, όπως support.example.com ή shop.example.com, για διαφορετικές υπηρεσίες. Αυτοί δεν είναι διαδρομές αρχείων.",
    "sourceTitle": "MDN — What is a domain name?",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name"
  },
  {
    "id": "daily-cache-revalidation",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "medium",
    "question": "Ο browser ρωτά τον server αν ένα αποθηκευμένο αρχείο έχει αλλάξει. Ο server απαντά «304 Not Modified». Τι γίνεται συνήθως;",
    "answers": [
      "Ο server στέλνει υποχρεωτικά ξανά ολόκληρο το αρχείο",
      "Η σύνδεση απορρίπτεται ως μη ασφαλής",
      "Ο browser χρησιμοποιεί το αντίγραφο που έχει ήδη",
      "Ο browser διαγράφει όλο το ιστορικό περιήγησης"
    ],
    "correctIndex": 2,
    "explanation": "Η απόκριση 304 δηλώνει ότι μπορεί να χρησιμοποιηθεί το αποθηκευμένο αντίγραφο έπειτα από έλεγχο. Δεν χρειάζεται να μεταφερθεί ξανά ολόκληρο το περιεχόμενο.",
    "sourceTitle": "MDN — HTTP caching",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
  },
  {
    "id": "daily-compression-code-choice",
    "categoryId": "technology",
    "subcategoryId": "computing",
    "difficulty": "medium",
    "question": "Θέλουμε να συμπιέσουμε τον πηγαίο κώδικα μιας εφαρμογής για μεταφορά. Ποια απαίτηση είναι κρίσιμη;",
    "answers": [
      "Να διατηρηθούν μόνο οι πιο συχνές λέξεις",
      "Να διατηρηθεί μόνο η οπτική εμφάνιση του κειμένου",
      "Να αποκατασταθεί ακριβώς κάθε χαρακτήρας",
      "Να αφαιρεθούν αυτόματα όλα τα σημεία στίξης"
    ],
    "correctIndex": 2,
    "explanation": "Ο κώδικας χρειάζεται συμπίεση χωρίς απώλειες: ακόμη και ένας αλλοιωμένος χαρακτήρας μπορεί να αλλάξει τη λειτουργία του. Η απωλεστική συμπίεση ταιριάζει σε άλλες χρήσεις, όπως φωτογραφίες.",
    "sourceTitle": "MDN — Compression in HTTP",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression"
  },
  {
    "id": "daily-dns-not-path",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "hard",
    "question": "Στο https://example.com/photos/cat.jpg, ποιο μέρος αντιστοιχίζει συνήθως το DNS σε διεύθυνση IP;",
    "answers": [
      "Ολόκληρο το https://example.com/photos/cat.jpg μαζί με τη διαδρομή",
      "Το example.com",
      "Μόνο το cat.jpg",
      "Το /photos/cat.jpg"
    ],
    "correctIndex": 1,
    "explanation": "Το DNS αναζητά το όνομα του υπολογιστή, εδώ example.com. Η διαδρομή /photos/cat.jpg ζητείται στη συνέχεια από τον server μέσω HTTP· δεν αποτελεί ξεχωριστή αναζήτηση DNS.",
    "sourceTitle": "MDN — What is a domain name?",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name"
  },
  {
    "id": "daily-cache-no-cache",
    "categoryId": "technology",
    "subcategoryId": "internet",
    "difficulty": "hard",
    "question": "Μια HTTP απόκριση έχει Cache-Control: no-cache. Τι σημαίνει αυτό;",
    "answers": [
      "Επιτρέπεται να χρησιμοποιείται για πάντα χωρίς έλεγχο",
      "Απαγορεύεται να αποθηκευτεί με οποιονδήποτε τρόπο",
      "Μπορεί να αποθηκευτεί, αλλά χρειάζεται έλεγχο πριν επαναχρησιμοποιηθεί",
      "Πρέπει να διαγραφούν τα cookies του χρήστη"
    ],
    "correctIndex": 2,
    "explanation": "Το no-cache απαιτεί επαλήθευση πριν από την επαναχρησιμοποίηση. Η οδηγία no-store είναι αυτή που λέει στην HTTP cache να μην αποθηκεύσει την απόκριση.",
    "sourceTitle": "MDN — HTTP caching",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
  },
  {
    "id": "daily-lossy-resave",
    "categoryId": "technology",
    "subcategoryId": "computing",
    "difficulty": "hard",
    "question": "Μια φωτογραφία αποθηκεύεται ξανά και ξανά με απωλεστική συμπίεση. Τι μπορεί να συμβεί, ακόμη κι αν δεν αλλάζει ο αριθμός των pixel;",
    "answers": [
      "Να συσσωρευτούν αλλοιώσεις και να χαθεί λεπτομέρεια",
      "Να ανακτηθούν λεπτομέρειες που χάθηκαν στην πρώτη αποθήκευση",
      "Να γίνει η συμπίεση υποχρεωτικά χωρίς απώλειες",
      "Να αυξηθεί αυτόματα η πραγματική ανάλυση της φωτογραφίας"
    ],
    "correctIndex": 0,
    "explanation": "Ίδιος αριθμός pixel δεν σημαίνει ίδια πληροφορία. Η νέα απωλεστική κωδικοποίηση μπορεί να απορρίψει επιπλέον λεπτομέρειες· δεν ανακτά όσα έχουν ήδη χαθεί.",
    "sourceTitle": "MDN — Compression in HTTP",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression"
  },
  {
    "id": "daily-perspective-depth",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "easy",
    "question": "Σε έναν πίνακα, δύο άνθρωποι ίδιου πραγματικού ύψους φαίνονται σε διαφορετικό μέγεθος. Ποιος παρουσιάζεται συνήθως πιο μακριά;",
    "answers": [
      "Αυτός που φορά πιο σκούρα ρούχα, ανεξάρτητα από το μέγεθος",
      "Αυτός που βρίσκεται πιο κοντά στο κάτω πλαίσιο, ανεξάρτητα από το μέγεθος",
      "Αυτός που έχει ζωγραφιστεί μικρότερος",
      "Αυτός που έχει ζωγραφιστεί μεγαλύτερος"
    ],
    "correctIndex": 2,
    "explanation": "Η μείωση του φαινομενικού μεγέθους είναι βασικό μέσο απόδοσης βάθους. Η σύγκριση έχει νόημα επειδή οι δύο άνθρωποι έχουν ίδιο πραγματικό ύψος.",
    "sourceTitle": "National Gallery — Perspective",
    "sourceUrl": "https://www.nationalgallery.org.uk/paintings/glossary/perspective"
  },
  {
    "id": "daily-flute-family",
    "categoryId": "culture",
    "subcategoryId": "music",
    "difficulty": "easy",
    "question": "Σε ποια οικογένεια της ορχήστρας ανήκει το σύγχρονο φλάουτο, παρότι συνήθως είναι μεταλλικό;",
    "answers": [
      "Στα χάλκινα πνευστά",
      "Στα κρουστά",
      "Στα έγχορδα",
      "Στα ξύλινα πνευστά"
    ],
    "correctIndex": 3,
    "explanation": "Το φλάουτο ανήκει στα ξύλινα πνευστά. Η ονομασία της οικογένειας δεν περιγράφει υποχρεωτικά το υλικό κάθε σύγχρονου οργάνου της.",
    "sourceTitle": "Philharmonia — Flute",
    "sourceUrl": "https://philharmonia.co.uk/resources/instruments/flute/"
  },
  {
    "id": "daily-egg-tempera-binder",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "easy",
    "question": "Στην αυγοτέμπερα, ποιος είναι ο ρόλος του κρόκου του αυγού;",
    "answers": [
      "Χαράζει το περίγραμμα πάνω στο ξύλο",
      "Δένει τους κόκκους της χρωστικής",
      "Αντικαθιστά τη χρωστική δίνοντας όλα τα χρώματα",
      "Λειτουργεί μόνο ως τελικό προστατευτικό βερνίκι"
    ],
    "correctIndex": 1,
    "explanation": "Η χρωστική δίνει το χρώμα, ενώ το συνδετικό μέσο συγκρατεί τα σωματίδιά της. Στην αυγοτέμπερα αυτό το μέσο είναι ο κρόκος του αυγού.",
    "sourceTitle": "National Gallery — Tempera",
    "sourceUrl": "https://www.nationalgallery.org.uk/paintings/glossary/tempera"
  },
  {
    "id": "daily-vanishing-point-function",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "medium",
    "question": "Σε σχέδιο με προοπτική ενός σημείου φυγής, οι παράλληλες πλευρές ενός δρόμου που απομακρύνεται από εμάς φαίνονται να συγκλίνουν. Προς τα πού;",
    "answers": [
      "Προς κάθε γωνία του κάδρου ταυτόχρονα",
      "Προς το πιο φωτεινό αντικείμενο, όπου κι αν βρίσκεται",
      "Προς το σημείο φυγής",
      "Προς το κοντινότερο σημείο του δρόμου"
    ],
    "correctIndex": 2,
    "explanation": "Το σημείο φυγής οργανώνει την προβολή γραμμών που απομακρύνονται προς την ίδια κατεύθυνση. Οι γραμμές συγκλίνουν στην εικόνα, παρότι ο πραγματικός δρόμος δεν στενεύει.",
    "sourceTitle": "National Gallery — Perspective",
    "sourceUrl": "https://www.nationalgallery.org.uk/paintings/glossary/perspective"
  },
  {
    "id": "daily-trombone-slide",
    "categoryId": "culture",
    "subcategoryId": "music",
    "difficulty": "medium",
    "question": "Ποιο όργανο χρησιμοποιεί χαρακτηριστικά έναν κινητό σωλήνα, τον ολκό, για να αλλάζει το τονικό ύψος και να γλιστρά ανάμεσα στις νότες;",
    "answers": [
      "Το τρομπόνι",
      "Η τρομπέτα με βαλβίδες",
      "Το κλαρινέτο",
      "Το όμποε"
    ],
    "correctIndex": 0,
    "explanation": "Ο ολκός αλλάζει το μήκος του σωλήνα του τρομπονιού. Επιτρέπει και το χαρακτηριστικό glissando, μια συνεχή μετάβαση ανάμεσα σε τονικά ύψη.",
    "sourceTitle": "Philharmonia — Trombone",
    "sourceUrl": "https://philharmonia.co.uk/resources/instruments/trombone/"
  },
  {
    "id": "daily-buon-fresco-surface",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "medium",
    "question": "Σε ποια επιφάνεια εφαρμόζεται το χρώμα στην τεχνική buon fresco;",
    "answers": [
      "Σε μεταλλική πλάκα χαραγμένη με οξύ",
      "Σε στεγνό καμβά καλυμμένο με λάδι",
      "Σε νωπό ασβεστοκονίαμα",
      "Σε χαρτί που έχει ήδη βερνικωθεί"
    ],
    "correctIndex": 2,
    "explanation": "Στο buon fresco ο ζωγράφος δουλεύει πάνω στο νωπό τελικό επίχρισμα. Η τεχνική διαφέρει από το a secco, όπου η ζωγραφική γίνεται σε στεγνή επιφάνεια.",
    "sourceTitle": "National Gallery — Fresco",
    "sourceUrl": "https://www.nationalgallery.org.uk/paintings/glossary/fresco"
  },
  {
    "id": "daily-perspective-horizon",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "hard",
    "question": "Σε ένα σχέδιο γραμμικής προοπτικής ανεβάζουμε τη γραμμή του ορίζοντα. Τι αλλάζουμε κυρίως στην υπονοούμενη θέση του θεατή;",
    "answers": [
      "Την κλίμακα εκτύπωσης του χαρτιού",
      "Το ύψος των ματιών του",
      "Την κλίση του εδάφους, χωρίς αλλαγή του σημείου θέασης",
      "Την απόσταση του θεατή από τον πίνακα, χωρίς αλλαγή ύψους"
    ],
    "correctIndex": 1,
    "explanation": "Η γραμμή του ορίζοντα συνδέεται με το ύψος των ματιών του θεατή. Αλλάζοντάς την, αλλάζουμε το σημείο θέασης της σκηνής και όχι μόνο τη θέση μιας γραμμής στο χαρτί.",
    "sourceTitle": "University of Leeds — Space and perspective",
    "sourceUrl": "https://ahc.leeds.ac.uk/analysing-paintings/doc/unit-a3-space-perspective"
  },
  {
    "id": "daily-piccolo-transposition",
    "categoryId": "culture",
    "subcategoryId": "music",
    "difficulty": "hard",
    "question": "Ένα πίκολο παίζει μια γραμμένη νότα. Σε ποια σχέση βρίσκεται συνήθως ο ήχος που ακούμε με αυτή τη νότα;",
    "answers": [
      "Στο ίδιο ακριβώς τονικό ύψος",
      "Μία καθαρή πέμπτη χαμηλότερα",
      "Μία οκτάβα χαμηλότερα",
      "Μία οκτάβα ψηλότερα"
    ],
    "correctIndex": 3,
    "explanation": "Το πίκολο ακούγεται μία οκτάβα ψηλότερα από τη γραμμένη νότα. Το κοινό φλάουτο σε ντο, αντίθετα, ακούγεται στο τονικό ύψος που διαβάζει ο μουσικός.",
    "sourceTitle": "Philharmonia — Flute",
    "sourceUrl": "https://philharmonia.co.uk/resources/instruments/flute/"
  },
  {
    "id": "daily-fresco-giornata",
    "categoryId": "culture",
    "subcategoryId": "visual-arts",
    "difficulty": "hard",
    "question": "Γιατί ένας ζωγράφος buon fresco απλώνει συνήθως μόνο όσο τελικό κονίαμα προλαβαίνει να ζωγραφίσει την ίδια μέρα;",
    "answers": [
      "Επειδή το σχέδιο μεταφέρεται μόνο αφού στεγνώσει εντελώς ο τοίχος",
      "Επειδή το τελικό κονίαμα χρησιμοποιείται μόνο για τη μεταφορά του προσχεδίου",
      "Επειδή πρέπει να δουλέψει όσο το επίχρισμα παραμένει νωπό",
      "Επειδή κάθε νέο τμήμα χρειάζεται πρώτα μια στεγνή στρώση βερνικιού"
    ],
    "correctIndex": 2,
    "explanation": "Η ημερήσια επιφάνεια εργασίας λέγεται giornata. Το όριο προκύπτει από την τεχνική: η ζωγραφική πρέπει να γίνει όσο το τελικό επίχρισμα είναι ακόμη νωπό.",
    "sourceTitle": "National Gallery — Fresco",
    "sourceUrl": "https://www.nationalgallery.org.uk/paintings/glossary/fresco"
  },
  {
    "id": "daily-mushroom-visible-body",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "easy",
    "question": "Το μανιτάρι που βλέπουμε πάνω από το έδαφος είναι συνήθως τι μέρος ενός μύκητα;",
    "answers": [
      "Ολόκληρος ο οργανισμός, χωρίς υπόγειο τμήμα",
      "Ένας σπόρος που περιβάλλεται από προστατευτικό περίβλημα",
      "Η ρίζα ενός ανθοφόρου φυτού",
      "Το καρποφόρο σώμα ενός μεγαλύτερου δικτύου"
    ],
    "correctIndex": 3,
    "explanation": "Το ορατό μανιτάρι είναι συνήθως καρποφόρο σώμα. Μεγάλο μέρος του μύκητα υπάρχει ως δίκτυο λεπτών νημάτων, το μυκήλιο, μέσα στο έδαφος ή στο ξύλο.",
    "sourceTitle": "Oregon State University Extension — Understanding soil health and biota",
    "sourceUrl": "https://extension.oregonstate.edu/catalog/em-9409-understanding-soil-health-biota-farms-gardens"
  },
  {
    "id": "daily-pollination-transfer",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "easy",
    "question": "Ποια μεταφορά περιγράφει την επικονίαση στα ανθοφόρα φυτά;",
    "answers": [
      "Σακχάρων από τα φύλλα στον βλαστό",
      "Σπόρων από τον καρπό στο έδαφος",
      "Νερού από τη ρίζα στα φύλλα",
      "Γύρης από τον ανθήρα στο στίγμα ενός άνθους"
    ],
    "correctIndex": 3,
    "explanation": "Η επικονίαση είναι μεταφορά γύρης στο στίγμα. Μπορεί να επιτρέψει τη γονιμοποίηση, αλλά δεν είναι το ίδιο γεγονός με τη γονιμοποίηση ή τη διασπορά των σπόρων.",
    "sourceTitle": "USGS — Pollinator Science Strategy, 2025–35",
    "sourceUrl": "https://pubs.usgs.gov/publication/cir1556/full"
  },
  {
    "id": "daily-coral-animal",
    "categoryId": "nature",
    "subcategoryId": "animals",
    "difficulty": "easy",
    "question": "Οι μικροί πολύποδες που σχηματίζουν ένα κοράλλι είναι τι είδους οργανισμοί;",
    "answers": [
      "Ανθοφόρα φυτά",
      "Μύκητες",
      "Ζώα",
      "Βακτήρια"
    ],
    "correctIndex": 2,
    "explanation": "Τα κοράλλια είναι ζώα. Πολλά ζουν σε αποικίες και αρκετά κοράλλια ρηχών υφάλων συνεργάζονται με μικροσκοπικά φύκη που βρίσκονται στους ιστούς τους.",
    "sourceTitle": "NOAA — Are corals animals or plants?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/coral.html"
  },
  {
    "id": "daily-mycorrhizal-exchange",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "medium",
    "question": "Σε μια μυκορριζική συμβίωση, τι δίνει συνήθως το φυτό στον μύκητα σε αντάλλαγμα για νερό και ανόργανα θρεπτικά στοιχεία;",
    "answers": [
      "Οργανικές ενώσεις που παράγει με τη φωτοσύνθεση",
      "Νερό σε αντάλλαγμα για σάκχαρα που παράγει ο μύκητας",
      "Τα περισσότερα μεταλλικά στοιχεία που χρειάζεται ο μύκητας",
      "Ανόργανο φώσφορο που ο μύκητας δεν μπορεί να αντλήσει μόνος του"
    ],
    "correctIndex": 0,
    "explanation": "Το φυτό τροφοδοτεί τον μύκητα με οργανικό άνθρακα. Οι υφές του μύκητα αυξάνουν την περιοχή από την οποία μπορούν να αντληθούν νερό και θρεπτικά στοιχεία.",
    "sourceTitle": "Oregon State University Extension — Understanding soil health and biota",
    "sourceUrl": "https://extension.oregonstate.edu/catalog/em-9409-understanding-soil-health-biota-farms-gardens"
  },
  {
    "id": "daily-wind-pollination",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "medium",
    "question": "Ένα φυτό παράγει σπόρους παρότι τα άνθη του δεν δέχονται επισκέψεις από ζώα. Ποια εξήγηση είναι δυνατή;",
    "answers": [
      "Η γονιμοποίηση γίνεται αφού έχουν ήδη ωριμάσει οι σπόροι",
      "Η γύρη του μεταφέρεται με τον άνεμο",
      "Η φωτοσύνθεση αντικαθιστά πάντα την επικονίαση",
      "Οι ρίζες μεταφέρουν τη γύρη από το έδαφος στα άνθη"
    ],
    "correctIndex": 1,
    "explanation": "Δεν εξαρτώνται όλα τα φυτά από ζωικούς επικονιαστές. Σε αρκετά είδη η γύρη μεταφέρεται με τον άνεμο, ενώ άλλα μπορούν να αυτοεπικονιάζονται.",
    "sourceTitle": "Washington State University — Pollinators: Pollination",
    "sourceUrl": "https://hortsense.cahnrs.wsu.edu/fact-sheet/about-pollinators-pollination/"
  },
  {
    "id": "daily-coral-algae-benefit",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "medium",
    "question": "Τι προσφέρουν κυρίως τα συμβιωτικά φύκη στα κοράλλια πολλών ρηχών υφάλων;",
    "answers": [
      "Προϊόντα της φωτοσύνθεσης που συμβάλλουν στη θρέψη τους",
      "Ολόκληρο τον ασβεστολιθικό σκελετό, χωρίς συμμετοχή του κοραλλιού",
      "Την κύρια ποσότητα ζωοπλαγκτού που κυνηγούν τα κοράλλια",
      "Μόνο χρώμα, χωρίς συμβολή στη θρέψη τους"
    ],
    "correctIndex": 0,
    "explanation": "Τα φύκη χρησιμοποιούν το ηλιακό φως και δίνουν στο κοράλλι σημαντικό μέρος της ενέργειας που χρειάζεται. Το κοράλλι τους προσφέρει χώρο διαβίωσης και πρόσβαση σε χρήσιμες ουσίες.",
    "sourceTitle": "Smithsonian Ocean — Zooxanthellae and Coral Bleaching",
    "sourceUrl": "https://ocean.si.edu/ocean-life/invertebrates/zooxanthellae-and-coral-bleaching"
  },
  {
    "id": "daily-fungi-not-all-same",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "hard",
    "question": "Ένας μύκητας διασπά νεκρό ξύλο, ενώ άλλος ανταλλάσσει θρεπτικά στοιχεία με ζωντανές ρίζες. Ποια διάκριση είναι σωστή;",
    "answers": [
      "Και οι δύο παράγουν υποχρεωτικά την τροφή τους με φωτοσύνθεση",
      "Και οι δύο είναι υποχρεωτικά παθογόνοι για το δέντρο",
      "Ο πρώτος είναι φυτό, ενώ ο δεύτερος είναι μύκητας",
      "Ο πρώτος δρα ως αποικοδομητής, ο δεύτερος ως συμβιωτικός οργανισμός"
    ],
    "correctIndex": 3,
    "explanation": "Οι μύκητες δεν έχουν όλοι τον ίδιο οικολογικό ρόλο. Κάποιοι αποικοδομούν νεκρή οργανική ύλη, άλλοι συμβιώνουν με ρίζες και άλλοι προκαλούν ασθένειες.",
    "sourceTitle": "Oregon State University Extension — Understanding soil health and biota",
    "sourceUrl": "https://extension.oregonstate.edu/catalog/em-9409-understanding-soil-health-biota-farms-gardens"
  },
  {
    "id": "daily-pollination-not-fertilization",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "hard",
    "question": "Βλέπουμε γύρη πάνω στο στίγμα ενός άνθους. Ποιο συμπέρασμα δικαιολογείται άμεσα, χωρίς άλλες παρατηρήσεις;",
    "answers": [
      "Έγινε μεταφορά γύρης, αλλά δεν έχει αποδειχθεί επιτυχής γονιμοποίηση",
      "Έχει ήδη ολοκληρωθεί η διασπορά των σπόρων",
      "Η γύρη προήλθε οπωσδήποτε από διαφορετικό φυτό",
      "Έχουν ήδη σχηματιστεί ώριμοι σπόροι"
    ],
    "correctIndex": 0,
    "explanation": "Η επικονίαση προηγείται της γονιμοποίησης. Η απλή παρουσία γύρης δεν αποδεικνύει ότι αυτή ήταν συμβατή, ότι έγινε γονιμοποίηση ή ότι αναπτύχθηκε σπόρος.",
    "sourceTitle": "USGS — Pollinator Science Strategy, 2025–35",
    "sourceUrl": "https://pubs.usgs.gov/publication/cir1556/full"
  },
  {
    "id": "daily-bleached-coral-survival",
    "categoryId": "nature",
    "subcategoryId": "ecosystems",
    "difficulty": "hard",
    "question": "Ένα κοράλλι έχει λευκάνει μετά από θερμική καταπόνηση. Ποια ερμηνεία είναι ακριβέστερη;",
    "answers": [
      "Έχει απλώς αλλάξει χρώμα, χωρίς συνέπειες για τη θρέψη του",
      "Έχει χάσει πολλά συμβιωτικά φύκη και μπορεί ακόμη να ανακάμψει",
      "Είναι οπωσδήποτε ήδη νεκρό",
      "Έχει αποκτήσει επιπλέον φύκη που το προστατεύουν"
    ],
    "correctIndex": 1,
    "explanation": "Η λεύκανση συνδέεται με την απώλεια συμβιωτικών φυκών και σημαντικής πηγής τροφής. Δεν σημαίνει αυτόματα θάνατο, αλλά αυξάνει τον κίνδυνο αν η καταπόνηση συνεχιστεί.",
    "sourceTitle": "NOAA — What is coral bleaching?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/coral_bleach.html"
  },
  {
    "id": "daily-throw-in-whole-ball",
    "categoryId": "sports",
    "subcategoryId": "football",
    "difficulty": "easy",
    "question": "Στο ποδόσφαιρο, πότε θεωρείται ότι η μπάλα έχει βγει από την πλάγια γραμμή;",
    "answers": [
      "Μόλις οποιοδήποτε τμήμα της αγγίξει τη γραμμή",
      "Μόνο αν έχει ακουμπήσει στο έδαφος έξω από τη γραμμή",
      "Όταν ολόκληρη η μπάλα περάσει τη γραμμή",
      "Μόλις το κέντρο της μπάλας περάσει τη γραμμή"
    ],
    "correctIndex": 2,
    "explanation": "Πρέπει να περάσει ολόκληρη η μπάλα την πλάγια γραμμή, είτε στο έδαφος είτε στον αέρα. Μια μπάλα που προεξέχει εν μέρει μπορεί να παραμένει εντός.",
    "sourceTitle": "IFAB — Law 15: The Throw-in (2026/27)",
    "sourceUrl": "https://www.theifab.com/laws/latest/the-throw-in/"
  },
  {
    "id": "daily-volleyball-three-hits",
    "categoryId": "sports",
    "subcategoryId": "team-sports",
    "difficulty": "easy",
    "question": "Στο βόλεϊ σάλας, πόσες επαφές έχει στη διάθεσή της μια ομάδα για να επιστρέψει την μπάλα, χωρίς να μετρά η επαφή στο μπλοκ;",
    "answers": [
      "Έως τρεις",
      "Έως τέσσερις",
      "Μία για κάθε παίκτη της εξάδας",
      "Έως δύο"
    ],
    "correctIndex": 0,
    "explanation": "Η ομάδα έχει έως τρεις επαφές για την επιστροφή. Στο βόλεϊ σάλας η επαφή στο μπλοκ δεν προσμετράται σε αυτές· στο μπιτς βόλεϊ ισχύει διαφορετικός κανόνας.",
    "sourceTitle": "FIVB — Official Volleyball Rules 2025–2028",
    "sourceUrl": "https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf"
  },
  {
    "id": "daily-tennis-line-in",
    "categoryId": "sports",
    "subcategoryId": "tennis",
    "difficulty": "easy",
    "question": "Στο τένις, μια μπάλα σε κανονική ανταλλαγή ακουμπά την εξωτερική γραμμή που ορίζει το σωστό γήπεδο. Είναι μέσα ή έξω;",
    "answers": [
      "Μέσα",
      "Έξω",
      "Ο πόντος επαναλαμβάνεται αυτόματα",
      "Μέσα μόνο αν ακουμπήσει το κέντρο της γραμμής"
    ],
    "correctIndex": 0,
    "explanation": "Η γραμμή ανήκει στο γήπεδο που ορίζει. Δεν χρειάζεται ολόκληρη η μπάλα να προσγειωθεί στο εσωτερικό της γραμμής για να θεωρηθεί μέσα.",
    "sourceTitle": "ITF — Rules of Tennis, 2026 edition",
    "sourceUrl": "https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf"
  },
  {
    "id": "daily-offside-position-alone",
    "categoryId": "sports",
    "subcategoryId": "football",
    "difficulty": "medium",
    "question": "Ένας επιθετικός βρίσκεται σε θέση οφσάιντ τη στιγμή της πάσας, αλλά δεν αγγίζει την μπάλα ούτε επηρεάζει αντίπαλο ή τη φάση. Τι ισχύει;",
    "answers": [
      "Ο παίκτης πρέπει υποχρεωτικά να δεχτεί κίτρινη κάρτα",
      "Η θέση από μόνη της δεν αποτελεί παράβαση",
      "Η φάση επαναλαμβάνεται από το σημείο της πάσας",
      "Καταλογίζεται πάντα οφσάιντ μόλις γίνει η πάσα"
    ],
    "correctIndex": 1,
    "explanation": "Η θέση οφσάιντ δεν αρκεί. Χρειάζεται ενεργή συμμετοχή, όπως παίξιμο της μπάλας, επηρεασμός αντιπάλου ή απόκτηση πλεονεκτήματος με τον τρόπο που ορίζει ο κανόνας.",
    "sourceTitle": "IFAB — Law 11: Offside (2026/27)",
    "sourceUrl": "https://www.theifab.com/laws/latest/offside/"
  },
  {
    "id": "daily-volleyball-deuce",
    "categoryId": "sports",
    "subcategoryId": "team-sports",
    "difficulty": "medium",
    "question": "Σε ένα από τα πρώτα τέσσερα σετ βόλεϊ σάλας, το σκορ είναι 24–24. Ποιο από τα παρακάτω σκορ ολοκληρώνει το σετ;",
    "answers": [
      "26–24",
      "25–24",
      "26–25",
      "27–26"
    ],
    "correctIndex": 0,
    "explanation": "Τα πρώτα τέσσερα σετ παίζονται στους 25 πόντους με διαφορά τουλάχιστον δύο. Στο 24–24 το παιχνίδι συνεχίζεται μέχρι να υπάρξει αυτή η διαφορά.",
    "sourceTitle": "FIVB — Official Volleyball Rules 2025–2028",
    "sourceUrl": "https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf"
  },
  {
    "id": "daily-tennis-double-fault",
    "categoryId": "sports",
    "subcategoryId": "tennis",
    "difficulty": "medium",
    "question": "Στο τένις, ο παίκτης που σερβίρει κάνει λάθος και στο πρώτο και στο δεύτερο σερβίς του ίδιου πόντου, χωρίς να έχει δοθεί let. Τι συμβαίνει;",
    "answers": [
      "Χάνει ολόκληρο το game ανεξάρτητα από το σκορ",
      "Επαναλαμβάνει πάλι το πρώτο σερβίς",
      "Χάνει τον πόντο",
      "Αλλάζει πλευρά και συνεχίζει με τρίτο σερβίς"
    ],
    "correctIndex": 2,
    "explanation": "Με δύο άκυρα σερβίς στον ίδιο πόντο έχουμε double fault και ο πόντος πηγαίνει στον αντίπαλο. Το let είναι διαφορετική περίπτωση και μπορεί να οδηγήσει σε επανάληψη του σερβίς.",
    "sourceTitle": "ITF — Rules of Tennis, 2026 edition",
    "sourceUrl": "https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf"
  },
  {
    "id": "daily-offside-direct-throwin",
    "categoryId": "sports",
    "subcategoryId": "football",
    "difficulty": "hard",
    "question": "Ένας επιθετικός δέχεται την μπάλα απευθείας από πλάγια επαναφορά συμπαίκτη του, πιο κοντά στην αντίπαλη εστία από την μπάλα και τον προτελευταίο αντίπαλο. Καταλογίζεται οφσάιντ για αυτή την υποδοχή;",
    "answers": [
      "Όχι, δεν υπάρχει οφσάιντ από απευθείας πλάγια επαναφορά",
      "Όχι, αλλά μόνο αν η επαναφορά γίνει από το αντίπαλο μισό",
      "Ναι, επειδή βρίσκεται μπροστά από τον προτελευταίο αντίπαλο",
      "Ναι, αλλά μόνο αν η υποδοχή γίνει μέσα στην περιοχή"
    ],
    "correctIndex": 0,
    "explanation": "Δεν υπάρχει παράβαση οφσάιντ όταν η μπάλα λαμβάνεται απευθείας από πλάγια επαναφορά. Η ίδια εξαίρεση ισχύει για απευθείας υποδοχή από κόρνερ ή από τέρματος λάκτισμα.",
    "sourceTitle": "IFAB — Law 11: Offside (2026/27)",
    "sourceUrl": "https://www.theifab.com/laws/latest/offside/"
  },
  {
    "id": "daily-volleyball-after-block",
    "categoryId": "sports",
    "subcategoryId": "team-sports",
    "difficulty": "hard",
    "question": "Στο βόλεϊ σάλας, ένας παίκτης αγγίζει την μπάλα σε ολοκληρωμένο μπλοκ. Μπορεί ο ίδιος να κάνει αμέσως την επόμενη επαφή;",
    "answers": [
      "Ναι, και αυτή μετρά ως η πρώτη από τις τρεις επαφές της ομάδας",
      "Ναι, αλλά τότε απομένει μόνο μία ομαδική επαφή",
      "Όχι, εκτός αν η μπάλα έχει περάσει πρώτα στην αντίπαλη πλευρά",
      "Όχι, επειδή απαγορεύεται κάθε διαδοχική επαφή του ίδιου παίκτη"
    ],
    "correctIndex": 0,
    "explanation": "Η επαφή στο μπλοκ δεν μετρά ως ομαδικό χτύπημα. Ο ίδιος παίκτης μπορεί να κάνει την πρώτη επαφή μετά το μπλοκ και η ομάδα έχει συνολικά άλλες τρεις επαφές στη διάθεσή της.",
    "sourceTitle": "FIVB — Official Volleyball Rules 2025–2028",
    "sourceUrl": "https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf"
  },
  {
    "id": "daily-tennis-tiebreak-service",
    "categoryId": "sports",
    "subcategoryId": "tennis",
    "difficulty": "hard",
    "question": "Σε ένα συνηθισμένο tie-break τένις, ο παίκτης Α σερβίρει τον πρώτο πόντο. Ποιος σερβίρει τους επόμενους δύο;",
    "answers": [
      "Ο Β τον δεύτερο και ο Α τον τρίτο",
      "Ο παίκτης Α και τους δύο",
      "Ο παίκτης Β και τους δύο",
      "Ο Α τον δεύτερο και ο Β τον τρίτο"
    ],
    "correctIndex": 2,
    "explanation": "Στο συνηθισμένο tie-break ο πρώτος σερβίρει έναν πόντο. Έπειτα οι παίκτες σερβίρουν εναλλάξ από δύο πόντους, οπότε ο αντίπαλος αναλαμβάνει τον δεύτερο και τον τρίτο.",
    "sourceTitle": "ITF — Rules of Tennis, 2026 edition",
    "sourceUrl": "https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf"
  },
  {
    "id": "daily-median-waiting",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "easy",
    "question": "Πέντε χρόνοι αναμονής, σε αύξουσα σειρά, είναι 2, 3, 4, 6 και 20 λεπτά. Ποια είναι η διάμεσος;",
    "answers": [
      "10 λεπτά",
      "4 λεπτά",
      "7 λεπτά",
      "6 λεπτά"
    ],
    "correctIndex": 1,
    "explanation": "Η διάμεσος είναι η μεσαία τιμή όταν ταξινομήσουμε τα δεδομένα. Εδώ είναι το 4. Ο αριθμητικός μέσος είναι 7, επειδή επηρεάζεται από τη μεγάλη αναμονή των 20 λεπτών.",
    "sourceTitle": "OpenStax — Measures of the Center of the Data",
    "sourceUrl": "https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data"
  },
  {
    "id": "daily-coin-next-flip",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "easy",
    "question": "Ένα δίκαιο νόμισμα έφερε πέντε φορές στη σειρά κορώνα. Αν οι ρίψεις είναι ανεξάρτητες, ποια είναι η πιθανότητα να φέρει κορώνα στην επόμενη;",
    "answers": [
      "0%",
      "50%",
      "Περίπου 3%",
      "Πάνω από 90%"
    ],
    "correctIndex": 1,
    "explanation": "Οι προηγούμενες ρίψεις δεν αλλάζουν την επόμενη σε ένα δίκαιο νόμισμα με ανεξάρτητες ρίψεις. Η πιθανότητα παραμένει μία στις δύο· δεν υπάρχει υποχρέωση να «ισορροπήσει» η σειρά.",
    "sourceTitle": "OpenStax — Independent and Mutually Exclusive Events",
    "sourceUrl": "https://openstax.org/books/introductory-statistics/pages/3-2-independent-and-mutually-exclusive-events"
  },
  {
    "id": "daily-heat-direction",
    "categoryId": "everyday",
    "subcategoryId": "practical-science",
    "difficulty": "easy",
    "question": "Ένα ζεστό φλιτζάνι ακουμπά σε πιο κρύο τραπέζι. Προς τα πού μεταφέρεται αυθόρμητα καθαρή θερμότητα στην επαφή τους;",
    "answers": [
      "Μόνο προς τα πάνω, ανεξάρτητα από τις θερμοκρασίες",
      "Εξίσου και προς τις δύο κατευθύνσεις, χωρίς καθαρή μεταφορά",
      "Από το τραπέζι προς το φλιτζάνι",
      "Από το φλιτζάνι προς το τραπέζι"
    ],
    "correctIndex": 3,
    "explanation": "Η καθαρή μεταφορά θερμότητας γίνεται από το θερμότερο προς το ψυχρότερο σώμα. Η κατεύθυνση καθορίζεται από τη διαφορά θερμοκρασίας και όχι από το ποιο σώμα βρίσκεται ψηλότερα.",
    "sourceTitle": "OpenStax — University Physics Volume 2, Mechanisms of Heat Transfer",
    "sourceUrl": "https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer"
  },
  {
    "id": "daily-mean-outlier",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "medium",
    "question": "Σε μια παρέα τεσσάρων ατόμων προστίθεται ένα πέμπτο άτομο με εξαιρετικά μεγάλο εισόδημα. Ποιος δείκτης επηρεάζεται συνήθως περισσότερο από αυτή την ακραία τιμή;",
    "answers": [
      "Και οι δύο παραμένουν υποχρεωτικά ίδιοι",
      "Η διάμεσος",
      "Ο αριθμητικός μέσος",
      "Η διάμεσος αλλάζει πάντα περισσότερο από τον μέσο"
    ],
    "correctIndex": 2,
    "explanation": "Ο μέσος χρησιμοποιεί το άθροισμα όλων των τιμών και έλκεται από μια ακραία τιμή. Η διάμεσος εξαρτάται από τη θέση στη σειρά, οπότε είναι συνήθως πιο ανθεκτική.",
    "sourceTitle": "OpenStax — Measures of the Center of the Data",
    "sourceUrl": "https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data"
  },
  {
    "id": "daily-draw-without-replacement",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "medium",
    "question": "Σε ένα σακουλάκι υπάρχουν 3 κόκκινοι και 2 μπλε βόλοι. Βγάζεις έναν κόκκινο και δεν τον επιστρέφεις. Ποια είναι η πιθανότητα ο επόμενος να είναι μπλε, αν επιλέγεις τυχαία;",
    "answers": [
      "2/5",
      "1/2",
      "1/3",
      "3/5"
    ],
    "correctIndex": 1,
    "explanation": "Απομένουν τέσσερις βόλοι, δύο από τους οποίους είναι μπλε. Άρα η πιθανότητα είναι 2/4, δηλαδή 1/2. Χωρίς επανατοποθέτηση, η πρώτη επιλογή αλλάζει τις επόμενες πιθανότητες.",
    "sourceTitle": "OpenStax — Independent and Mutually Exclusive Events",
    "sourceUrl": "https://openstax.org/books/introductory-statistics/pages/3-2-independent-and-mutually-exclusive-events"
  },
  {
    "id": "daily-metal-feels-colder",
    "categoryId": "everyday",
    "subcategoryId": "practical-science",
    "difficulty": "medium",
    "question": "Ένα μεταλλικό και ένα ξύλινο αντικείμενο έχουν μείνει στο ίδιο δροσερό δωμάτιο και έχουν ίδια θερμοκρασία. Γιατί το μέταλλο συνήθως φαίνεται πιο κρύο στο χέρι;",
    "answers": [
      "Μεταφέρει θερμότητα από το χέρι πιο γρήγορα",
      "Έχει μεγαλύτερη μάζα, άρα είναι πάντα ψυχρότερο",
      "Αντανακλά καλύτερα το φως, άρα μετράμε χαμηλότερη θερμοκρασία αφής",
      "Έχει αναγκαστικά χαμηλότερη θερμοκρασία από το ξύλο"
    ],
    "correctIndex": 0,
    "explanation": "Η αίσθηση εξαρτάται και από τον ρυθμό μεταφοράς ενέργειας. Το μέταλλο είναι συνήθως καλύτερος αγωγός από το ξύλο και αφαιρεί γρηγορότερα θερμότητα από το πιο ζεστό χέρι.",
    "sourceTitle": "OpenStax — University Physics Volume 2, Mechanisms of Heat Transfer",
    "sourceUrl": "https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer"
  },
  {
    "id": "daily-voluntary-survey-bias",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "hard",
    "question": "Μια εφαρμογή ρωτά μόνο όσους χρήστες πατούν προαιρετικά «Πες τη γνώμη σου» και παίρνει 10.000 απαντήσεις. Τι περιορίζει την εξαγωγή συμπεράσματος για όλους τους χρήστες;",
    "answers": [
      "Κάθε προαιρετική έρευνα δίνει αναγκαστικά λάθος απάντηση",
      "Η αντιπροσωπευτικότητα εξαρτάται μόνο από το αν οι απαντήσεις είναι ανώνυμες",
      "Η αυτοεπιλογή μπορεί να κάνει το δείγμα μη αντιπροσωπευτικό",
      "Οι πολλές απαντήσεις καταργούν κάθε πιθανή μεροληψία"
    ],
    "correctIndex": 2,
    "explanation": "Το μεγάλο πλήθος δεν διορθώνει αυτόματα τη μεροληψία επιλογής. Όσοι απαντούν μόνοι τους μπορεί να έχουν διαφορετικές εμπειρίες ή πιο έντονες απόψεις από όσους δεν απαντούν.",
    "sourceTitle": "OpenStax — Data, Sampling, and Variation in Data and Sampling",
    "sourceUrl": "https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling"
  },
  {
    "id": "daily-at-least-one-six",
    "categoryId": "everyday",
    "subcategoryId": "math",
    "difficulty": "hard",
    "question": "Ρίχνεις ένα δίκαιο εξάπλευρο ζάρι δύο ανεξάρτητες φορές. Ποια είναι η πιθανότητα να εμφανιστεί τουλάχιστον ένα εξάρι;",
    "answers": [
      "5/6",
      "1/36",
      "1/3",
      "11/36"
    ],
    "correctIndex": 3,
    "explanation": "Είναι ευκολότερο να μετρήσουμε το αντίθετο: κανένα εξάρι έχει πιθανότητα 5/6 × 5/6 = 25/36. Άρα τουλάχιστον ένα εξάρι έχει πιθανότητα 1 − 25/36 = 11/36.",
    "sourceTitle": "OpenStax — Independent and Mutually Exclusive Events",
    "sourceUrl": "https://openstax.org/books/introductory-statistics/pages/3-2-independent-and-mutually-exclusive-events"
  },
  {
    "id": "daily-insulation-thickness",
    "categoryId": "everyday",
    "subcategoryId": "practical-science",
    "difficulty": "hard",
    "question": "Διπλασιάζουμε το πάχος μιας ομοιόμορφης μονωτικής πλάκας. Αν υλικό, επιφάνεια και διαφορά θερμοκρασίας μείνουν ίδια, τι γίνεται με τη σταθερή ροή θερμότητας με αγωγή;",
    "answers": [
      "Διπλασιάζεται",
      "Μηδενίζεται ακριβώς",
      "Παραμένει ίδια",
      "Μειώνεται στο μισό"
    ],
    "correctIndex": 3,
    "explanation": "Στη σταθερή αγωγή μέσα από επίπεδη πλάκα, η ροή θερμότητας είναι αντιστρόφως ανάλογη του πάχους. Διπλάσιο πάχος σημαίνει μισή ροή, με τις υπόλοιπες συνθήκες ίδιες.",
    "sourceTitle": "OpenStax — University Physics Volume 2, Mechanisms of Heat Transfer",
    "sourceUrl": "https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer"
  },
];
