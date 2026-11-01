import { supplementaryArticleMedia } from "./supplementaryMedia";
import { worldHistoryArticleMedia } from "./worldHistoryMedia";
import { astronomyArticleMedia } from "./astronomyMedia";
import { architectureArticleMedia } from "./architectureMedia";

/**
 * Additional inline illustrations for ΓΝΩΣΗ lessons.
 * Images are served from Wikimedia Commons; each figure displays a credit
 * that links to the corresponding Commons file page and licence information.
 */
export type InlineArticleImage = {
  afterParagraphCount?: number;
  /** Stable optional anchor; preferable for editorially revised articles. */
  afterParagraphId?: string;
  url: string;
  caption: string;
  credit: string;
  creditUrl: string;
  resizeMode?: "cover" | "contain";
};

function commonsFileUrl(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`;
}

function commonsPageUrl(filename: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/ /g, "_"))}`;
}

export const inlineArticleMedia: Record<string, InlineArticleImage[]> = {
  ...architectureArticleMedia,
  ...astronomyArticleMedia,
  ...worldHistoryArticleMedia,
  ...supplementaryArticleMedia,
  "perception-eyes-not-cameras": [{
    afterParagraphId: "retina-fovea",
    url: commonsFileUrl("Human photoreceptor distribution.svg"),
    resizeMode: "contain",
    caption: "Σχηματική κατανομή κωνίων (συνεχής γραμμή) και ραβδίων (διακεκομμένη) ως προς την απόσταση από το κέντρο του βλέμματος. Τα κενά στο γράφημα αντιστοιχούν στο φυσιολογικό τυφλό σημείο, το θέμα του επόμενου μαθήματος. Άγγιξε για μεγέθυνση.",
    credit: "Cmglee / Wikimedia Commons · CC BY-SA 3.0",
    creditUrl: commonsPageUrl("Human photoreceptor distribution.svg"),
  }],
  "greek-settlements-networks": [
    {
      afterParagraphId: "settle-09",
      url: commonsFileUrl("Ortygia - Syracuse.jpg"),
      resizeMode: "contain",
      caption: "Η σημερινή Ορτυγία στις Συρακούσες. Η φωτογραφία δείχνει το φυσικό πλαίσιο της θέσης, όχι τα γεγονότα της αρχαϊκής εγκατάστασης. Άγγιξε για μεγέθυνση.",
      credit: "Andrea Schaffer / Wikimedia Commons · CC BY 2.0 · φωτογραφία 2017",
      creditUrl: commonsPageUrl("Ortygia - Syracuse.jpg"),
    },
    {
      afterParagraphId: "settle-18",
      url: commonsFileUrl("Березань розкопки 2.jpg"),
      resizeMode: "contain",
      caption: "Ανασκαφικός χώρος στο νησί Μπερεζάν, Ουκρανία (2018). Ο χώρος μαρτυρεί αρχαιολογική έρευνα· οι χρονολογήσεις χρειάζονται στρωματογραφικά και κινητά ευρήματα. Άγγιξε για μεγέθυνση.",
      credit: "PhotoDocumentalist / Wikimedia Commons · CC BY 4.0 · φωτογραφία 2018",
      creditUrl: commonsPageUrl("Березань розкопки 2.jpg"),
    },
  ],
  "rise-of-polis": [{ afterParagraphId: "polis-11", url: commonsFileUrl("Zagora, Andros, 224941x.jpg"), resizeMode: "contain", caption: "Το απόκρημνο ακρωτήριο της Ζαγοράς στην Άνδρο. Η γεωμετρική εγκατάσταση βρισκόταν στο πλάτωμα· η φωτογραφία δεν αποκαλύπτει τους αρχαίους θεσμούς. Άγγιξε για μεγέθυνση.", credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2022", creditUrl: commonsPageUrl("Zagora, Andros, 224941x.jpg") }],
  "geometric-greece": [{ afterParagraphId: "g3", url: commonsFileUrl("Protogeometric amphora BM A1124.jpg"), resizeMode: "contain", caption: "Πρωτογεωμετρικός αμφορέας με ομόκεντρους κύκλους, περ. 975–950 π.Χ. Άγγιξε για μεγέθυνση.", credit: "Marie-Lan Nguyen / Wikimedia Commons · CC BY 2.5", creditUrl: commonsPageUrl("Protogeometric amphora BM A1124.jpg") }, { afterParagraphId: "g12", url: commonsFileUrl("Coupe de Nestor - musée Archéologique de Pithecusae - inscription.jpg"), resizeMode: "contain", caption: "Αποσπασματική επιγραφή στο κύπελλο του Νέστορα, Πιθηκούσσα, περ. 730–720 π.Χ. Άγγιξε για μεγέθυνση.", credit: "Shonagon / Wikimedia Commons · CC0 1.0", creditUrl: commonsPageUrl("Coupe de Nestor - musée Archéologique de Pithecusae - inscription.jpg") }],
  "palace-collapse": [
    {
      afterParagraphId: "mycenae-after",
      url: commonsFileUrl("Megaron at the acropolis of Mycenae, 201518.jpg"),
      resizeMode: "contain",
      caption: "Τα σημερινά κατάλοιπα του μεγάρου στις Μυκήνες. Πρόκειται για κτίσμα της ανακτορικής περιόδου, όχι για φωτογραφία του στρώματος καταστροφής ή της μεταγενέστερης κατοίκησης. Άγγιξε για μεγέθυνση.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2020",
      creditUrl: commonsPageUrl("Megaron at the acropolis of Mycenae, 201518.jpg"),
    },
  ],
  "linear-b-decipherment": [
    {
      afterParagraphId: "pylos-test-1953",
      url: commonsFileUrl("Linear B tablet, Pylos, 13th century BC, NAMA, 191139.jpg"),
      resizeMode: "contain",
      caption: "Μουσειακή προθήκη με πινακίδες από την Πύλο, ανάμεσά τους η PY Ta 641. Η συλλαβική ανάγνωση ti-ri-po-de κοντά στο εικονόγραμμα τρίποδου υπήρξε ανεξάρτητη δοκιμή. Άγγιξε για μεγέθυνση.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2019",
      creditUrl: commonsPageUrl("Linear B tablet, Pylos, 13th century BC, NAMA, 191139.jpg"),
    },
  ],
  "mycenaean-palaces": [
    {
      afterParagraphId: "hides-tablet",
      url: commonsFileUrl("NAMA Linear B tablet of Pylos.jpg"),
      resizeMode: "contain",
      caption: "Η αυθεντική πινακίδα PY Ub 1318 από την Πύλο, στο Εθνικό Αρχαιολογικό Μουσείο. Καταγράφει διανομή δερμάτων σε τεχνίτες· η φωτογραφία δεν αποτελεί μεταγραφή του κειμένου. Άγγιξε για μεγέθυνση.",
      credit: "Sharon Mollerus / Wikimedia Commons · CC BY 2.0 · φωτογραφία 2009",
      creditUrl: commonsPageUrl("NAMA Linear B tablet of Pylos.jpg"),
    },
    {
      afterParagraphId: "tiryns-gate",
      url: commonsFileUrl("Palace of Tiryns, entrance.jpg"),
      resizeMode: "contain",
      caption: "Η είσοδος στην οχυρωμένη ακρόπολη της Τίρυνθας. Η μνημειακή πρόσβαση δηλώνει κατασκευή και προβολή ισχύος, όχι τον ακριβή χάρτη των εξαρτημένων κοινοτήτων.",
      credit: "Karelksir / Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2015",
      creditUrl: commonsPageUrl("Palace of Tiryns, entrance.jpg"),
    },
  ],
  "minoan-crete": [
    {
      afterParagraphId: "mu-district",
      url: commonsFileUrl("The Palace in Malia Crete.jpg"),
      resizeMode: "contain",
      caption: "Η συνοικία Μ των Μαλίων, ένας ανασκαμμένος χώρος συνδεδεμένος με εργαστήρια και μεγάλα κτίρια έξω από το κυρίως ανάκτορο.",
      credit: "Moroder / Wikimedia Commons · CC BY-SA 3.0 · φωτογραφία 2015",
      creditUrl: commonsPageUrl("The Palace in Malia Crete.jpg"),
    },
    {
      afterParagraphId: "gournia-streets",
      url: commonsFileUrl("Gournia, Minoan Bronze Age Village.JPG"),
      resizeMode: "contain",
      caption: "Ανασκαμμένα κατάλοιπα στα Γουρνιά. Οι τοίχοι και τα περάσματα αποκαλύπτουν τον οικιστικό ιστό, όχι μία πλήρη αναπαράσταση των αρχαίων σπιτιών.",
      credit: "Wikimedia Commons · CC BY-SA 4.0 · φωτογραφία 2013",
      creditUrl: commonsPageUrl("Gournia, Minoan Bronze Age Village.JPG"),
    },
  ],
  "aegean-bronze-age": [
    {
      afterParagraphId: "spindle-evidence",
      url: commonsFileUrl("Bronze Age Stone Spindle Whorls from Tiryns Acropolis (28356795022).jpg"),
      resizeMode: "contain",
      caption: "Λίθινα σφονδύλια της Εποχής του Χαλκού από την Τίρυνθα: τεκμήρια για το γνέσιμο, όχι για την ταυτότητα των ανθρώπων που εργάζονταν. Άγγιξε για μεγέθυνση.",
      credit: "Gary Todd / Wikimedia Commons · CC0 1.0 · φωτογραφία 2016",
      creditUrl: commonsPageUrl("Bronze Age Stone Spindle Whorls from Tiryns Acropolis (28356795022).jpg"),
    },
    {
      afterParagraphId: "lerna-seals",
      url: commonsFileUrl("Lerna SE fortification wall detail.jpg"),
      resizeMode: "contain",
      caption: "Τμήμα πρωτοελλαδικής οχύρωσης στη Λέρνα. Τα ορατά καλύμματα είναι σύγχρονα· στη φωτογραφία δεν απεικονίζονται τα πήλινα σφραγίσματα.",
      credit: "Mark Landon / Wikimedia Commons · CC BY-SA 4.0 · λήψη 1990",
      creditUrl: commonsPageUrl("Lerna SE fortification wall detail.jpg"),
    },
  ],
  "greek-geography-seas": [
    {
      afterParagraphId: "archipelago-mental-map",
      url: commonsFileUrl("Map of the Aegean Sea.svg"),
      resizeMode: "contain",
      caption: "Σύγχρονος τοπογραφικός χάρτης του Αιγαίου: ορεινή στεριά, ακτές και νησιά. Δεν αποτυπώνει τεκμηριωμένα αρχαία δρομολόγια. Άγγιξε για μεγέθυνση.",
      credit: "Goran tek-en / Wikimedia Commons · CC BY-SA 4.0 · χάρτης 2019",
      creditUrl: commonsPageUrl("Map of the Aegean Sea.svg"),
    },
  ],
  "greek-chronology": [
    {
      afterParagraphId: "mycenaean-overlap",
      url: commonsFileUrl("Stirrup jar, Mycenae, AM of Mycenae, 201608.jpg"),
      resizeMode: "contain",
      caption: "Μυκηναϊκό αγγείο με χαρακτηριστικές λαβές (stirrup jar) από τις Μυκήνες, περ. 1250–1180 π.Χ., στο Αρχαιολογικό Μουσείο Μυκηνών. Η παραγωγή του ανήκει σε εποχή πριν από τη διαμόρφωση των κλασικών πόλεων.",
      credit: "Zde / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2020",
      creditUrl: commonsPageUrl("Stirrup jar, Mycenae, AM of Mycenae, 201608.jpg"),
    },
  ],
  "greek-history-through-evidence": [
    {
      afterParagraphId: "ostrakon-limits",
      url: commonsFileUrl("Ostracon with the name of Themistocles.jpg"),
      resizeMode: "contain",
      caption: "Όστρακο με το όνομα του Θεμιστοκλή, στο Μουσείο της Αρχαίας Αγοράς. Η γραφή δεν αποκαλύπτει από μόνη της κίνητρα ή τελικό αποτέλεσμα.",
      credit: "Marsyas / Wikimedia Commons · CC BY 4.0 · Φωτογραφία 2005",
      creditUrl: commonsPageUrl("Ostracon with the name of Themistocles.jpg"),
    },
    {
      afterParagraphId: "plangon-stele",
      url: commonsFileUrl("Funerary stele of Plangon (inscription ΡΛΑNΓΩΝ).jpg"),
      resizeMode: "contain",
      caption: "Ταφική στήλη της Πλαγγόνας, περ. 310 π.Χ., με πουλί και κούκλα. Το μνημείο δεν διασώζει τα προσωπικά της λόγια.",
      credit: "Yair-haklai / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2024",
      creditUrl: commonsPageUrl("Funerary stele of Plangon (inscription ΡΛΑNΓΩΝ).jpg"),
    },
  ],
  "greek-world-not-a-country": [
    {
      afterParagraphId: "map-shores",
      url: commonsFileUrl("Greek Colonization Archaic Period.png"),
      resizeMode: "contain",
      caption: "Σύγχρονος σχηματικός χάρτης ελληνικών εγκαταστάσεων της αρχαϊκής εποχής. Τα σημεία δεν παριστάνουν ενιαίο κράτος ούτε αποτυπώνουν κάθε κοινότητα· άγγιξε για μεγέθυνση.",
      credit: "Regaliorum / Wikimedia Commons · CC0 1.0 · αρχική χαρτογραφική απόδοση",
      creditUrl: commonsPageUrl("Greek Colonization Archaic Period.png"),
    },
    {
      afterParagraphId: "sanctuaries",
      url: commonsFileUrl("Stadium at Olympia.jpg"),
      resizeMode: "cover",
      caption: "Το στάδιο της Ολυμπίας σήμερα. Ο κοινός τόπος αγώνων και λατρείας δεν ήταν πρωτεύουσα ενός ενιαίου ελληνικού κράτους.",
      credit: "Anna Tziaki / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2016",
      creditUrl: commonsPageUrl("Stadium at Olympia.jpg"),
    },
  ],
  "ancient-athens": [
    {
      afterParagraphId: "theta-workshop",
      url: commonsFileUrl("Excavations under the Acropolis Museum 6.jpg"),
      resizeMode: "contain",
      caption: "Ανασκαμμένα κατάλοιπα κάτω από το Μουσείο της Ακρόπολης. Η φωτογραφία δείχνει το ανασκαφικό σύνολο, όχι αποκλειστικά την Οικία Θ.",
      credit: "Marcus Cyron / Wikimedia Commons · CC BY-SA 3.0",
      creditUrl: commonsPageUrl("Excavations under the Acropolis Museum 6.jpg"),
    },
    {
      afterParagraphId: "agora-evidence",
      url: commonsFileUrl("Ancient agora of Athens.jpg"),
      resizeMode: "cover",
      caption: "Η Αρχαία Αγορά σήμερα: ο χώρος όπου συνυπήρχαν συναλλαγές, δημόσιες λειτουργίες και καθημερινή δραστηριότητα.",
      credit: "SiaKou96 / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Ancient agora of Athens.jpg"),
    },
  ],
  "pompeii-everyday-life": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Thermopolium Pompei.jpg"),
      caption: "Πάγκος θερμοπωλείου στην Πομπηία, όπου σερβίρονταν ποτά και απλό φαγητό.",
      credit: "Photo2023 / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Thermopolium Pompei.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Street of Pompeii.JPG"),
      caption: "Οι δρόμοι και τα κατώφλια των καταστημάτων βοηθούν τους αρχαιολόγους να ανασυνθέσουν την κίνηση στην πόλη.",
      credit: "Glmike523 / Wikimedia Commons · CC BY-SA",
      creditUrl: commonsPageUrl("Street of Pompeii.JPG"),
    },
  ],
  "why-mars-is-red": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Gravel-covered martian surface.jpg"),
      caption: "Η επιφάνεια του Άρη περιέχει σκόνη, άμμο και πετρώματα με διαφορετικές αποχρώσεις.",
      credit: "NASA/JPL-Caltech/MSSS / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Gravel-covered martian surface.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Curiosity on Mars.jpg"),
      caption: "Το Curiosity εξερευνά τον Άρη και βοηθά τους επιστήμονες να μελετήσουν τη γεωλογία του.",
      credit: "NASA / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Curiosity on Mars.jpg"),
    },
  ],
  "sleep-and-memory": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Sleep studies.jpg"),
      caption: "Μια μελέτη ύπνου καταγράφει φυσιολογικά σήματα που βοηθούν τους ειδικούς να ξεχωρίσουν τα στάδια του ύπνου.",
      credit: "National Heart, Lung, and Blood Institute / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Sleep studies.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Sleep EEG Stage 1.jpg"),
      caption: "Το ηλεκτροεγκεφαλογράφημα καταγράφει την ηλεκτρική δραστηριότητα του εγκεφάλου κατά τον ύπνο.",
      credit: "MrSandman / Wikimedia Commons · Public domain",
      creditUrl: commonsPageUrl("Sleep EEG Stage 1.jpg"),
    },
  ],
  "octopus-intelligence": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Octopus vulgaris close up.jpg"),
      caption: "Το χταπόδι μπορεί να αλλάξει χρώμα και υφή, συνδυάζοντας καμουφλάζ με εξερεύνηση του περιβάλλοντος.",
      credit: "Victor Micallef / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Octopus vulgaris close up.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Octopus vulgaris - Common octopus (7874091466).jpg"),
      caption: "Τα ευλύγιστα χέρια του χταποδιού έχουν μεγάλο ρόλο στην αφή και στον χειρισμό αντικειμένων.",
      credit: "Jean-Marc Kuffer / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Octopus vulgaris - Common octopus (7874091466).jpg"),
    },
  ],
  "life-at-hydrothermal-vents": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Fauna on hydrothermal vents.jpg"),
      caption: "Γαρίδες, μικροί αστακοί και μύδια ζουν σε κοινότητες γύρω από υδροθερμικές πηγές.",
      credit: "NOAA Photo Library / Wikimedia Commons · Public domain (US)",
      creditUrl: commonsPageUrl("Fauna on hydrothermal vents.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("A mussel's life around deep-sea hydrothermal vents.jpg"),
      caption: "Ορισμένα μύδια επιβιώνουν χάρη σε συμβιωτικά μικρόβια που αξιοποιούν χημική ενέργεια.",
      credit: "Sébastien Duperron, Sylvie M. Gaudron & Sven R. Laming / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("A mussel's life around deep-sea hydrothermal vents.jpg"),
    },
  ],
  "how-language-models-generate-text": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("NeuralNetwork.png"),
      caption: "Ένα σχηματικό νευρωνικό δίκτυο. Τα πραγματικά γλωσσικά μοντέλα έχουν πολύ μεγαλύτερη και πιο σύνθετη αρχιτεκτονική.",
      credit: "Loxaxs / Wikimedia Commons · CC0",
      creditUrl: commonsPageUrl("NeuralNetwork.png"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Neural network with dark background.png"),
      caption: "Οι υπολογιστικοί κόμβοι και οι συνδέσεις τους αναπαριστούν αφαιρετικά τον τρόπο με τον οποίο ένα νευρωνικό δίκτυο συνδυάζει πληροφορίες.",
      credit: "DancingPhilosopher / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Neural network with dark background.png"),
    },
  ],
  "what-happens-when-you-open-a-website": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Internet access diagram.svg"),
      resizeMode: "contain",
      caption: "Ένα απλοποιημένο διάγραμμα της διαδρομής από μια οικιακή συσκευή προς μια υπηρεσία στο διαδίκτυο.",
      credit: "Ferran / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Internet access diagram.svg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Structure of the Internet.svg"),
      resizeMode: "contain",
      caption: "Το διαδίκτυο αποτελείται από πολλά αλληλοσυνδεδεμένα δίκτυα, παρόχους και σημεία ανταλλαγής δεδομένων.",
      credit: "BWenk / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Structure of the Internet.svg"),
    },
  ],
  "impressionism-and-light": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Monet - Impression, Sunrise.jpg"),
      caption: "Το έργο «Impression, Sunrise» έδωσε το όνομά του στον Ιμπρεσιονισμό.",
      credit: "Claude Monet / Wikimedia Commons · Public domain artwork",
      creditUrl: commonsPageUrl("Monet - Impression, Sunrise.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Claude Monet - Matin sur la Seine, le beau temps (1897).jpg"),
      caption: "Ο Monet επέστρεφε συχνά στα ίδια τοπία για να παρατηρήσει πώς άλλαζε η ατμόσφαιρα και το φως.",
      credit: "Claude Monet / Wikimedia Commons · Public domain artwork",
      creditUrl: commonsPageUrl("Claude Monet - Matin sur la Seine, le beau temps (1897).jpg"),
    },
  ],
  "iceland-two-plates": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("Thingvellir National Park rift valley.jpg"),
      caption: "Στο Þingvellir, το ρήγμα κάνει ορατά τμήματα του ορίου ανάμεσα στην ευρασιατική και τη βορειοαμερικανική πλάκα.",
      credit: "Pi3.124 / Wikimedia Commons · CC BY-SA 3.0",
      creditUrl: commonsPageUrl("Thingvellir National Park rift valley.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Observation deck view Thingvellir Iceland 2026-02-06 06-08-21.jpg"),
      caption: "Η κοιλάδα του ρήγματος και η λίμνη Þingvallavatn φαίνονται από ψηλότερο σημείο του εθνικού πάρκου.",
      credit: "G. Edward Johnson / Wikimedia Commons · CC BY 4.0",
      creditUrl: commonsPageUrl("Observation deck view Thingvellir Iceland 2026-02-06 06-08-21.jpg"),
    },
  ],
};
