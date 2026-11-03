import type { QuestionMetadata } from "../quiz/types";
import { worldHistoryLessons } from "./worldHistoryLessons";
import { greekWorldLessons } from "./greekWorldLessons";
import { greekEvidenceLessons } from "./greekEvidenceLessons";
import { greekChronologyLessons } from "./greekChronologyLessons";
import { greekGeographyLessons } from "./greekGeographyLessons";
import { aegeanBronzeAgeLessons } from "./aegeanBronzeAgeLessons";
import { minoanCreteLessons } from "./minoanCreteLessons";
import { mycenaeanPalacesLessons } from "./mycenaeanPalacesLessons";
import { palaceCollapseLessons } from "./palaceCollapseLessons";
import { geometricGreeceLessons } from "./geometricGreeceLessons";
import { riseOfPolisLessons } from "./riseOfPolisLessons";
import { greekSettlementsLessons } from "./greekSettlementsLessons";
import { spartaSocietyLessons } from "./spartaSocietyLessons";
import { athensLawCourtsLessons } from "./athensLawCourtsLessons";
import { greekWarHoplitesLessons } from "./greekWarHoplitesLessons";
import { greekSanctuariesGamesLessons } from "./greekSanctuariesGamesLessons";
import { persianWarsGreekWorldLessons } from "./persianWarsGreekWorldLessons";
import { athenianEmpireLessons } from "./athenianEmpireLessons";
import { peloponnesianWarLessons } from "./peloponnesianWarLessons";
import { greekCrisesFourthCenturyLessons } from "./greekCrisesFourthCenturyLessons";
import { macedonPhilipLessons } from "./macedonPhilipLessons";
import { alexanderConquestsLessons } from "./alexanderConquestsLessons";
import { greekStageTragedyLessons } from "./greekStageTragedyLessons";
import { greekPhilosophyInContextLessons } from "./greekPhilosophyInContextLessons";
import { greekScienceKnowledgeLessons } from "./greekScienceKnowledgeLessons";
import { greekImagesSculptureLessons } from "./greekImagesSculptureLessons";
import { hellenisticKingdomsCitiesLessons } from "./hellenisticKingdomsCitiesLessons";
import { astronomyLessons, astronomyRevisions } from "./astronomyLessons";
import { architectureLessons } from "./architectureLessons";
import { geologyLessons } from "./geologyLessons";
import { perceptionLessons } from "./perceptionLessons";
import { perceptionAttentionLessons } from "./perceptionAttentionLessons";
import { catalogueExpansion } from "./catalogueExpansion";
import { additionalLessons } from "./additionalLessons";

export type Category = {
  id: string;
  title: string;
  emoji: string;
  description: string;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
};

export type LessonQuestion = QuestionMetadata & {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
  /** Optional structured presentation. Legacy numeric answers are retained for
   * scoring/reviews; rich submissions are stored separately by question version. */
  presentation?:
    | { type: "spot-the-mistake"; correction: string }
    | { type: "fill-in-the-blank"; before: string; after: string }
    | { type: "multiple-select"; correctIndices: number[] }
    | { type: "ordering"; items: { id: string; label: string }[]; correctOrder: string[] }
    | { type: "matching"; pairs: { leftId: string; leftLabel: string; rightId: string; rightLabel: string }[] };
};

export type LessonParagraph = string | { id: string; text: string };

export type LessonSection = {
  title: string;
  paragraphs: LessonParagraph[];
};

export type LessonCheckpoint = { questionId: string; afterParagraphId: string };

export type LessonSource = {
  title: string;
  publisher: string;
  url: string;
};

export type Lesson = {
  coverKind?: "editorial";
  imageResizeMode?: "cover" | "contain";
  /** Opt-in for revised lessons: unversioned legacy attempts cannot be trusted. */
  requireCurrentAttemptQuiz?: boolean;
  /** Explicit, stable anchor-based checkpoint placement. Omit for legacy pairs. */
  checkpoints?: LessonCheckpoint[];
  /** Reader-only display rule; authored checkpoints, IDs and quiz keys stay unchanged. */
  questionPlacement?: "section-end";
  contentNote?: string;
  editorialReviewedAt?: string;
  /** Prior quiz versions with identical objectives, question order and answer keys. */
  compatibleQuizKeys?: string[];
  id: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  summary: string;
  readingMinutes: number;
  intro: string;
  imageUrl: string;
  imageCaption: string;
  imageCredit: string;
  imageCreditUrl: string;
  sections: LessonSection[];
  sources: LessonSource[];
  questions: LessonQuestion[];
};

export const categories: Category[] = [
  {
    id: "history",
    title: "Ιστορία",
    emoji: "🏛️",
    description: "Πολιτισμοί, γεγονότα και άνθρωποι",
  },
  {
    id: "science",
    title: "Επιστήμη & Διάστημα",
    emoji: "🚀",
    description: "Το σύμπαν και πώς λειτουργεί ο κόσμος",
  },
  {
    id: "nature",
    title: "Φύση & Ζώα",
    emoji: "🌿",
    description: "Η ζωή στον πλανήτη μας",
  },
  {
    id: "technology",
    title: "Τεχνολογία",
    emoji: "⚡",
    description: "Εφευρέσεις και νέες ιδέες",
  },
  {
    id: "culture",
    title: "Τέχνες & Πολιτισμός",
    emoji: "🎨",
    description: "Τέχνη, αρχιτεκτονική, μουσική και κινηματογράφος",
  },
  {
    id: "geography",
    title: "Γεωγραφία & Κοινωνία",
    emoji: "🌍",
    description: "Χώρες, κοινωνίες και παράξενα μέρη",
  },
  {
    id: "difficult-history",
    title: "Ταμπού της Ιστορίας",
    emoji: "🕯️",
    description: "Δύσκολες ιστορίες, τεκμήρια και ανθρώπινες εμπειρίες — χωρίς εντυπωσιοθηρία.",
  },
];

export const subcategories: Subcategory[] = [
  {
    id: "ancient-greece",
    categoryId: "history",
    title: "Αρχαία Ελλάδα",
    description: "Η καθημερινή ζωή, οι πόλεις και οι ιδέες των αρχαίων Ελλήνων.",
  },
  {
    id: "world-history",
    categoryId: "history",
    title: "Παγκόσμια ιστορία",
    description: "Από το πρώιμο σύμπαν στον συνδεδεμένο κόσμο: μια διαδρομή με ιδέες, κοινωνίες και μεγάλες αλλαγές.",
  },
  {
    id: "mythology",
    categoryId: "history",
    title: "Μυθολογία",
    description: "Θεοί, ήρωες και ιστορίες από διαφορετικούς πολιτισμούς.",
  },
  {
    id: "space",
    categoryId: "science",
    title: "Αστρονομία & Διάστημα",
    description: "Από τον νυχτερινό ουρανό σε πλανήτες, άστρα και την ιστορία του σύμπαντος.",
  },
  {
    id: "human-body",
    categoryId: "science",
    title: "Ανθρώπινο σώμα",
    description: "Οι μηχανισμοί που μας κρατούν ζωντανούς.",
  },
  {
    id: "physics",
    categoryId: "science",
    title: "Φυσική",
    description: "Οι νόμοι που εξηγούν τον κόσμο γύρω μας.",
  },
  {
    id: "wildlife",
    categoryId: "nature",
    title: "Άγρια ζωή",
    description: "Ζώα, συμπεριφορές και εντυπωσιακές προσαρμογές.",
  },
  {
    id: "oceans",
    categoryId: "nature",
    title: "Θαλάσσια ζωή",
    description: "Οι ωκεανοί και οι οργανισμοί που κρύβουν.",
  },
  {
    id: "ecosystems",
    categoryId: "nature",
    title: "Οικοσυστήματα",
    description: "Πώς συνδέονται όλα τα είδη στη φύση.",
  },
  {
    id: "artificial-intelligence",
    categoryId: "technology",
    title: "Τεχνητή νοημοσύνη",
    description: "Πώς λειτουργούν τα συστήματα AI και πού χρησιμοποιούνται.",
  },
  {
    id: "internet",
    categoryId: "technology",
    title: "Διαδίκτυο",
    description: "Η τεχνολογία πίσω από τον ψηφιακό κόσμο.",
  },
  {
    id: "inventions",
    categoryId: "technology",
    title: "Εφευρέσεις",
    description: "Ιδέες που άλλαξαν την καθημερινή ζωή.",
  },
  {
    id: "visual-arts",
    categoryId: "culture",
    title: "Εικαστικές τέχνες",
    description: "Καλλιτέχνες, έργα και καλλιτεχνικά ρεύματα.",
  },
  {
    id: "music",
    categoryId: "culture",
    title: "Μουσική",
    description: "Ήχοι, είδη και ιστορίες πίσω από τη μουσική.",
  },
  {
    id: "cinema",
    categoryId: "culture",
    title: "Κινηματογράφος",
    description: "Ταινίες, δημιουργοί και η εξέλιξη του σινεμά.",
  },
  {
    id: "countries",
    categoryId: "geography",
    title: "Χώρες του κόσμου",
    description: "Άνθρωποι, τοπία και πολιτισμοί.",
  },
  {
    id: "unusual-places",
    categoryId: "geography",
    title: "Παράξενα μέρη",
    description: "Ασυνήθιστες τοποθεσίες και φυσικά φαινόμενα.",
  },
  {
    id: "societies",
    categoryId: "geography",
    title: "Κοινωνίες",
    description: "Πώς οργανώνονται και εξελίσσονται οι ανθρώπινες κοινωνίες.",
  },
  { id: "architecture", categoryId: "culture", title: "Αρχιτεκτονική", description: "Από την πρώτη παρατήρηση στη σύνθεση: χώρος, φως, κατασκευή και πόλη." },
  { id: "brain-perception", categoryId: "science", title: "Εγκέφαλος και Ψευδαισθήσεις", description: "Πώς ο εγκέφαλος μετατρέπει το φως σε εμπειρία: όραση, χρώμα, βάθος και μοτίβα." },
  { id: "geology-hidden-earth", categoryId: "science", title: "Γεωλογία και η κρυμμένη Γη", description: "Πετρώματα, γεωλογικός χρόνος και απολιθώματα: μάθε να διαβάζεις την ιστορία του πλανήτη." },
  { id: "genocide-memory", categoryId: "difficult-history", title: "Γενοκτονίες & μνήμη", description: "Διώξεις, ιστορικά τεκμήρια και η ευθύνη της μνήμης." },
  { id: "colonialism-slavery", categoryId: "difficult-history", title: "Αποικιοκρατία & δουλεία", description: "Καταναγκασμός, οικονομικά συστήματα και κριτική ανάγνωση των πηγών." },
  { id: "power-exclusion", categoryId: "difficult-history", title: "Εξουσία & αποκλεισμός", description: "Λογοκρισία, ψευδοεπιστήμη και ανθρώπινα δικαιώματα." },
];

const originalLessons: Lesson[] = [
  {
    "id": "ancient-athens",
    "categoryId": "history",
    "subcategoryId": "ancient-greece",
    "title": "Η Αθήνα πίσω από τον Παρθενώνα",
    "summary": "Ένα σπίτι, μια αυλή και μερικά μικρά ευρήματα αποκαλύπτουν την Αθήνα των ανθρώπων — και τα όρια όσων ξέρουμε γι’ αυτούς.",
    "readingMinutes": 6,
    "intro": "Ο Παρθενώνας αφηγείται την ιστορία μιας ισχυρής πόλης. Μια αυλή με φθαρμένες πλάκες, ένας αγωγός νερού και οι τοίχοι ενός σπιτιού αφηγούνται κάτι διαφορετικό: πώς κατοικούσαν, εργάζονταν και συνυπήρχαν άνθρωποι που δεν άφησαν διάσημα ονόματα. Αρκεί να προσέξουμε και τη χρονολογία κάθε ίχνους.",
    "imageUrl": "https://commons.wikimedia.org/wiki/Special:FilePath/Athens%20Acropolis%20Museum%20Excavation.jpg?width=1200",
    "imageCaption": "Κατάλοιπα της αρχαίας γειτονιάς κάτω από το Μουσείο της Ακρόπολης. Οι ορατοί τοίχοι δεν ανήκουν όλοι στην ίδια εποχή.",
    "imageCredit": "Yair-haklai / Wikimedia Commons · CC BY-SA 4.0 · Φωτογραφία 2024",
    "imageCreditUrl": "https://commons.wikimedia.org/wiki/File:Athens_Acropolis_Museum_Excavation.jpg",
    "requireCurrentAttemptQuiz": true,
    "sections": [
      {
        "title": "Το σπίτι που δεν έμεινε ίδιο",
        "paragraphs": [
          {
            "id": "theta-built",
            "text": "Στα τέλη του 5ου αιώνα π.Χ., στη γειτονιά νότια της Ακρόπολης, χτίστηκε μια κατοικία που οι αρχαιολόγοι σήμερα ονομάζουν «Οικία Θ». Δεν ξέρουμε το όνομα της οικογένειας που την κατοίκησε. Ξέρουμε, όμως, κάτι ασυνήθιστο για την ιστορία της: ο χώρος χρησιμοποιήθηκε και ξαναχτίστηκε επί πολλούς αιώνες, έως την ύστερη αρχαιότητα."
          },
          {
            "id": "theta-rooms",
            "text": "Οι αρχαιότερες φάσεις της κατοικίας περιλάμβαναν μια μικρή εσωτερική αυλή και δωμάτια γύρω της. Ιδιαίτερο ενδιαφέρον έχει ο ανδρώνας, ο χώρος όπου ο οικοδεσπότης μπορούσε να υποδέχεται συνδαιτυμόνες για συμπόσιο. Το δάπεδο και η διαμόρφωση γύρω από τους τοίχους, όπου τοποθετούνταν ανάκλιντρα, φανερώνουν σχεδιασμό για μια συγκεκριμένη κοινωνική δραστηριότητα. Δεν αποδεικνύουν ότι κάθε αθηναϊκό σπίτι είχε αντίστοιχο δωμάτιο."
          },
          {
            "id": "theta-workshop",
            "text": "Στο πρώτο μισό του 3ου αιώνα π.Χ. η ίδια αυλή απέκτησε λεκάνες σε διαφορετικά ύψη, σωλήνα καθαρού νερού και αποχέτευση. Η ανασκαφική ομάδα θεωρεί πιθανό ότι ο χώρος χρησιμοποιήθηκε για πλύσιμο ή επεξεργασία υφασμάτων. Είναι τεκμηριωμένη η εγκατάσταση· η ακριβής δραστηριότητα παραμένει ερμηνεία. Οι μετατροπές του χώρου δείχνουν ότι η ίδια αυλή εξυπηρετούσε διαφορετικές ανάγκες σε διαφορετικές εποχές."
          }
        ]
      },
      {
        "title": "Το νερό, η φωτιά και η εργασία",
        "paragraphs": [
          {
            "id": "water-labor",
            "text": "Όσο εντυπωσιακός κι αν ήταν ένας ναός, καμία γειτονιά δεν μπορούσε να ζήσει χωρίς νερό. Πηγάδια, δεξαμενές, εστίες, σκεύη και αποχετεύσεις είναι οι ταπεινές εγκαταστάσεις που κάνουν ορατές επαναλαμβανόμενες ανάγκες. Η αρχαιολογία τις μελετά όχι ως διακοσμητικές λεπτομέρειες, αλλά ως μέρος των εργασιών που κρατούσαν ένα νοικοκυριό σε λειτουργία."
          },
          {
            "id": "not-every-home",
            "text": "Οι δυνατότητες των κατοίκων δεν ήταν ίδιες. Κάποιοι διέθεταν περισσότερους χώρους, καλύτερη πρόσβαση σε υλικά αγαθά ή την εργασία άλλων ανθρώπων. Το μέγεθος ενός σπιτιού, ωστόσο, δεν αρκεί από μόνο του για να ταυτίσουμε τους κατοίκους με μια συγκεκριμένη νομική κατηγορία ή να μαντέψουμε τι ακριβώς έκαναν κάθε μέρα."
          },
          {
            "id": "careful-traces",
            "text": "Ακόμη και ένα αγγείο χρειάζεται συμφραζόμενα: βρέθηκε σε χώρο μαγειρέματος, μέσα σε απορρίμματα ή ως προσφορά σε τάφο; Ήταν σε χρήση όταν χτίστηκε ο τοίχος δίπλα του ή κατέληξε εκεί αιώνες αργότερα; Χωρίς αυτά τα ερωτήματα, ένα εύρημα μπορεί να γίνει αφορμή για μια ωραία αλλά ατεκμηρίωτη ιστορία."
          }
        ]
      },
      {
        "title": "Λίγο πιο πέρα, στην Αγορά",
        "paragraphs": [
          {
            "id": "agora-beyond-market",
            "text": "Στην Αγορά της κλασικής Αθήνας, εμπόριο, δημόσια διοίκηση και κοινωνική ζωή συναντιούνταν. Δεν ήταν απλώς ένα παζάρι, ούτε μόνο χώρος πολιτικής συζήτησης. Εκεί υπήρχαν κτίρια δημόσιων λειτουργιών, ιερά και καταστήματα· γύρω από την ανοιχτή πλατεία υπήρχαν και κατοικίες."
          },
          {
            "id": "agora-evidence",
            "text": "Οι ανασκαφές της Αμερικανικής Σχολής Κλασικών Σπουδών έχουν αποκαλύψει σταθμά και μέτρα, δημόσιες επιγραφές, αντικείμενα συνδεδεμένα με τη λειτουργία δικαστηρίων, αλλά και οικιακή κεραμική. Καθένα φανερώνει διαφορετική πλευρά της πόλης: κανόνες στις συναλλαγές, θεσμούς, γεύματα και καθημερινές δουλειές. Η εικόνα προκύπτει από τον συνδυασμό τους, όχι από ένα μοναδικό «μαγικό» αντικείμενο."
          },
          {
            "id": "agora-neighbors",
            "text": "Στα όρια της Αγοράς σώζονται κατάλοιπα του κτιρίου που ονομάζεται συμβατικά «σπίτι του Σίμωνα του υποδηματοποιού». Η ονομασία μάς βοηθά να εντοπίζουμε τον χώρο, δεν πρέπει όμως να μετατρέπεται σε βέβαιη βιογραφία του ενοίκου. Η ύπαρξη κατοικιών και χώρων δουλειάς δίπλα σε δημόσια κτίρια είναι το ασφαλέστερο μάθημα που δίνει αυτό το τοπίο."
          }
        ]
      },
      {
        "title": "Οι ζωές που δεν ακούγονται εξίσου",
        "paragraphs": [
          {
            "id": "status-distinction",
            "text": "Ο πληθυσμός της Αθήνας δεν αποτελούνταν μόνο από άνδρες πολίτες. Γυναίκες, παιδιά, μέτοικοι —ελεύθεροι κάτοικοι χωρίς τα δικαιώματα του Αθηναίου πολίτη— και υποδουλωμένοι άνθρωποι κινούνταν στους ίδιους δρόμους και συμμετείχαν στην παραγωγή με άνισους όρους. Η νομική τους θέση επηρέαζε τα δικαιώματα και τις υποχρεώσεις τους, χωρίς να καθορίζει με απλό τρόπο το επάγγελμα ή τον πλούτο καθενός."
          },
          {
            "id": "women-roles",
            "text": "Οι γραπτές πηγές συχνά στρέφουν την προσοχή μας προς τη δημόσια ζωή των ανδρών. Η υφαντική, η διαχείριση της κατοικίας, η φροντίδα των παιδιών και η μεταφορά νερού ήταν σημαντικές δραστηριότητες, όμως οι εμπειρίες όσων τις έκαναν δεν έχουν διασωθεί με την ίδια πληρότητα. Το να πούμε ότι «οι γυναίκες έμεναν πάντα μέσα» θα ήταν τόσο απλουστευτικό όσο το να θεωρήσουμε πως κάθε γυναίκα ζούσε με τον ίδιο τρόπο."
          },
          {
            "id": "enslaved-labor",
            "text": "Η εργασία υποδουλωμένων ανθρώπων υπήρχε σε νοικοκυριά και επαγγελματικούς χώρους. Ένας τεχνίτης που εργάζεται σε εργαστήριο δεν αναγνωρίζεται αυτομάτως ως πολίτης, μέτοικος ή δούλος μόνο από τα εργαλεία του. Οι ιστορικοί συνδυάζουν υλικά ευρήματα, επιγραφές και κείμενα — πηγές που συχνά γράφτηκαν από ανθρώπους με περισσότερη εξουσία από εκείνους για τους οποίους μιλούν."
          },
          {
            "id": "questions-not-answers",
            "text": "Ένα αγγείο ή ένα εργαλείο δεν μας λέει από μόνο του το όνομα, το φύλο ή την κοινωνική θέση του κατόχου του. Χρειάζεται να ξεχωρίζουμε τα ευρήματα από όσα συμπεραίνουμε γι’ αυτά. Η αρχαιολογία μάς επιτρέπει να διατυπώνουμε καλύτερες ερωτήσεις, όχι να διαβάζουμε τις σκέψεις των νεκρών."
          }
        ]
      },
      {
        "title": "Ποια Αθήνα βλέπουμε;",
        "paragraphs": [
          {
            "id": "layers-time",
            "text": "Η γειτονιά κάτω από το Μουσείο της Ακρόπολης δεν είναι ένα παγωμένο στιγμιότυπο του 5ου αιώνα π.Χ. Τα ερείπιά της εκτείνονται σε πολλούς αιώνες και συχνά τα καλύτερα σωζόμενα κτίσματα είναι μεταγενέστερα, από τα ρωμαϊκά και τα ύστερα αρχαία χρόνια. Αν ενώσουμε πρόχειρα κάθε αυλή, λουτρό και ψηφιδωτό, θα κατασκευάσουμε μια «κλασική Αθήνα» που δεν υπήρξε ποτέ ακριβώς έτσι."
          },
          {
            "id": "last-insight",
            "text": "Από τα ευρήματα της Οικίας Θ δεν θα μάθουμε τα ονόματα όσων γέμιζαν την αυλή ή χρησιμοποιούσαν τον ανδρώνα. Μπορούμε όμως να παρακολουθήσουμε πώς άλλαζε το σπίτι και μαζί του η γειτονιά, από τους κλασικούς έως τους ύστερους αρχαίους χρόνους. Αυτή η μακρά, καθημερινή ιστορία δεν χωρά στην εικόνα του Παρθενώνα."
          }
        ]
      }
    ],
    "checkpoints": [
      {
        "questionId": "athens-theta-phases",
        "afterParagraphId": "theta-workshop"
      },
      {
        "questionId": "athens-agora-evidence",
        "afterParagraphId": "agora-neighbors"
      },
      {
        "questionId": "athens-social-evidence",
        "afterParagraphId": "questions-not-answers"
      }
    ],
    "sources": [
      {
        "title": "House Θ",
        "publisher": "Acropolis Museum",
        "url": "https://www.theacropolismuseum.gr/en/buildings/house-th"
      },
      {
        "title": "The archaeological excavation and its museum",
        "publisher": "Acropolis Museum",
        "url": "https://www.theacropolismuseum.gr/en/exhibit-halls/archaeological-excavation"
      },
      {
        "title": "About the Excavations — Athenian Agora",
        "publisher": "American School of Classical Studies at Athens",
        "url": "https://www.ascsa.edu.gr/excavations/athenian-agora/about-the-excavations"
      },
      {
        "title": "Women in Classical Greece",
        "publisher": "Colette Hemingway, The Metropolitan Museum of Art (2004)",
        "url": "https://www.metmuseum.org/essays/women-in-classical-greece"
      },
      {
        "title": "What Do We Really Know about Athenian Society?",
        "publisher": "Annales / Cambridge Core (2018)",
        "url": "https://www.cambridge.org/core/journals/annales-histoire-sciences-sociales-english-edition/article/what-do-we-really-know-about-athenian-society/DF36DF0B855586709F75B8B401E14FC0"
      },
      {
        "title": "Metics",
        "publisher": "Rebecca Futo Kennedy, Oxford Classical Dictionary (updated 2025)",
        "url": "https://academic.oup.com/edited-volume/61673/chapter-abstract/549655953"
      }
    ],
    "questions": [
      {
        "id": "athens-theta-phases",
        "version": "3",
        "conceptIds": [
          "historical-layers",
          "archaeological-interpretation"
        ],
        "difficulty": "medium",
        "question": "Συμπλήρωσε το συμπέρασμα για τις μετατροπές της Οικίας Θ.",
        "answers": [
          "διαφορετικές χρήσεις του χώρου σε διαφορετικές εποχές",
          "την ακριβή ιδιότητα των αρχικών ενοίκων",
          "ότι το εργαστήριο υπήρχε από την ίδρυση του σπιτιού",
          "μόνο τη διακόσμηση της αρχικής κατοικίας"
        ],
        "correctIndex": 0,
        "explanation": "Ο ανδρώνας και οι μεταγενέστερες λεκάνες ανήκουν σε διαφορετικές φάσεις. Οι εγκαταστάσεις είναι ευρήματα, ενώ η ειδική χρήση τους ως χώρου επεξεργασίας υφασμάτων παραμένει ερμηνεία.",
        "presentation": {
          "type": "fill-in-the-blank",
          "before": "Οι μετατροπές της αυλής μαρτυρούν ",
          "after": "."
        }
      },
      {
        "id": "athens-agora-evidence",
        "version": "4",
        "conceptIds": [
          "agora-functions",
          "material-evidence"
        ],
        "difficulty": "medium",
        "question": "Μια έκθεση για την αθηναϊκή Αγορά θέλει να τεκμηριώσει διαφορετικές χρήσεις του χώρου. Ποια ευρήματα στηρίζουν αυτή την εικόνα; Επίλεξε όλες τις σωστές απαντήσεις.",
        "answers": [
          "Σταθμά και μέτρα από την περιοχή, ως ενδείξεις πρακτικών συναλλαγών.",
          "Δημόσιες επιγραφές, ως στοιχεία για αποφάσεις και κανόνες της πόλης.",
          "Οικιακή κεραμική από κατοικίες δίπλα στην πλατεία, ως ένδειξη καθημερινής ζωής στη γειτονιά.",
          "Δημόσιες επιγραφές, ως άμεση καταγραφή του ημερήσιου όγκου εμπορίου στην Αγορά."
        ],
        "correctIndex": 0,
        "explanation": "Τα σταθμά συνδέονται με συναλλαγές, οι δημόσιες επιγραφές με θεσμούς και οι κατοικίες γύρω από την πλατεία με την καθημερινότητα. Οι επιγραφές δεν αποτελούν από μόνες τους στατιστικό αρχείο του ημερήσιου όγκου εμπορίου. Χρειάζεται να διακρίνουμε το είδος της πληροφορίας που δίνει κάθε τεκμήριο.",
        "presentation": {
          "type": "multiple-select",
          "correctIndices": [
            0,
            1,
            2
          ]
        }
      },
      {
        "id": "athens-social-evidence",
        "version": "3",
        "conceptIds": [
          "social-status",
          "limits-of-evidence"
        ],
        "difficulty": "hard",
        "question": "Εργασία και κοινωνική θέση στην αρχαία Αθήνα",
        "answers": [
          "Οι μέτοικοι μπορούσαν να εργάζονται σε αθηναϊκά εργαστήρια χωρίς να είναι Αθηναίοι πολίτες.",
          "Ένα εργαστήριο μπορούσε να απασχολεί ανθρώπους με διαφορετική νομική θέση.",
          "Τα εργαλεία ενός τεχνίτη αρκούν για να αποδείξουν ότι ήταν Αθηναίος πολίτης.",
          "Οι γραπτές πηγές δεν φωτίζουν εξίσου τις εμπειρίες κάθε κοινωνικής ομάδας."
        ],
        "correctIndex": 2,
        "explanation": "Τα εργαλεία μαρτυρούν εργασιακή δραστηριότητα, όχι νομική ιδιότητα. Για να γνωρίσουμε ποιος εργαζόταν σε έναν χώρο χρειάζονται πρόσθετα, ανεξάρτητα τεκμήρια.",
        "presentation": {
          "type": "spot-the-mistake",
          "correction": "Ο εξοπλισμός ενός εργαστηρίου δεν αποδεικνύει αν ο τεχνίτης ήταν πολίτης, μέτοικος ή υποδουλωμένος."
        }
      }
    ],
    "editorialReviewedAt": "2026-11-02"
  },
  ...additionalLessons,
  ...catalogueExpansion,
  ...architectureLessons,
];

// Keep old catalogue order and all quiz objects stable; place the path in lessonPath.ts.
export const lessons: Lesson[] = [
  ...originalLessons.map(lesson => ({ ...lesson, ...astronomyRevisions[lesson.id] })),
  ...greekWorldLessons,
  ...greekEvidenceLessons,
  ...greekChronologyLessons,
  ...greekGeographyLessons,
  ...aegeanBronzeAgeLessons,
  ...minoanCreteLessons,
  ...mycenaeanPalacesLessons,
  ...palaceCollapseLessons,
  ...geometricGreeceLessons,
  ...riseOfPolisLessons,
  ...greekSettlementsLessons,
  ...spartaSocietyLessons,
  ...athensLawCourtsLessons,
  ...greekWarHoplitesLessons,
  ...greekSanctuariesGamesLessons,
  ...persianWarsGreekWorldLessons,
  ...athenianEmpireLessons,
  ...peloponnesianWarLessons,
  ...greekCrisesFourthCenturyLessons,
  ...macedonPhilipLessons,
  ...alexanderConquestsLessons,
  ...greekStageTragedyLessons,
  ...greekPhilosophyInContextLessons,
  ...greekScienceKnowledgeLessons,
  ...greekImagesSculptureLessons,
  ...hellenisticKingdomsCitiesLessons,
  ...astronomyLessons,
  ...worldHistoryLessons,
  ...perceptionLessons,
  ...perceptionAttentionLessons,
  ...geologyLessons,
].map(lesson => lesson.subcategoryId === "ancient-greece"
  ? { ...lesson, questionPlacement: "section-end" as const }
  : lesson);
