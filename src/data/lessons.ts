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

export type LessonQuestion = {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
};

export type LessonSection = {
  title: string;
  paragraphs: string[];
};

export type LessonSource = {
  title: string;
  publisher: string;
  url: string;
};

export type Lesson = {
  coverKind?: "editorial";
  contentNote?: string;
  editorialReviewedAt?: string;
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
    description: "Τέχνη, μουσική και κινηματογράφος",
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
    description: "Πολιτισμοί και γεγονότα που διαμόρφωσαν τον κόσμο.",
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
    description: "Πλανήτες, άστρα και τα μυστήρια του σύμπαντος.",
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
  { id: "genocide-memory", categoryId: "difficult-history", title: "Γενοκτονίες & μνήμη", description: "Διώξεις, ιστορικά τεκμήρια και η ευθύνη της μνήμης." },
  { id: "colonialism-slavery", categoryId: "difficult-history", title: "Αποικιοκρατία & δουλεία", description: "Καταναγκασμός, οικονομικά συστήματα και κριτική ανάγνωση των πηγών." },
  { id: "power-exclusion", categoryId: "difficult-history", title: "Εξουσία & αποκλεισμός", description: "Λογοκρισία, ψευδοεπιστήμη και ανθρώπινα δικαιώματα." },
];

export const lessons: Lesson[] = [
        {
    "id": "ancient-athens",
    "categoryId": "history",
    "subcategoryId": "ancient-greece",
    "title": "Μια μέρα στην αρχαία Αθήνα",
    "summary": "Κάτω από τον Παρθενώνα υπήρχαν σπίτια, εργαστήρια, πηγάδια και άνθρωποι με πολύ διαφορετικές καθημερινές ζωές.",
    "readingMinutes": 3,
    "intro": "Αν μπορούσες να κατέβεις από την Ακρόπολη και να στρίψεις σε έναν στενό δρόμο της αρχαίας Αθήνας, δεν θα έβρισκες μόνο ρήτορες και ναούς. Θα έβρισκες μια γειτονιά που ξυπνούσε, δούλευε, μαγείρευε και κουβαλούσε νερό.",
    "imageUrl": "https://images.unsplash.com/photo-1684957048838-c7297a798563?auto=format&fit=crop&w=1200&q=80",
    "imageCaption": "Η Ακρόπολη δεσπόζει πάνω από την Αθήνα, συνδέοντας το σημερινό τοπίο με την αρχαία πόλη.",
    "imageCredit": "Ermir Hoxhaj / Unsplash",
    "imageCreditUrl": "https://unsplash.com/fr/photos/une-vue-du-parthenon-au-sommet-dune-colline-e4wkUDrsTCw",
    "sections": [
      {
        "title": "Μια πόλη πίσω από τα μνημεία",
        "paragraphs": [
          "Ο Παρθενώνας είναι εντυπωσιακός, αλλά η Αθήνα δεν ήταν μόνο η Ακρόπολη. Οι περισσότεροι κάτοικοι ζούσαν γύρω από μικρότερα σπίτια, δρόμους, εργαστήρια και αγορές.",
          "Κάτω από το σημερινό Μουσείο της Ακρόπολης σώζεται μια ολόκληρη αρχαία γειτονιά: δρόμοι, αυλές, πηγάδια και κατοικίες από διαφορετικές περιόδους. Κάθε στρώμα προσθέτει ένα κεφάλαιο στην ιστορία της πόλης."
        ]
      },
      {
        "title": "Το σπίτι ως κέντρο εργασίας",
        "paragraphs": [
          "Σε ένα σπίτι έπρεπε να μεταφερθεί νερό, να ετοιμαστεί φαγητό, να αποθηκευτούν εργαλεία και να φροντιστούν τα παιδιά. Εστίες, αγγεία και πηγάδια βοηθούν τους αρχαιολόγους να καταλάβουν πώς λειτουργούσε ένα νοικοκυριό.",
          "Τα σπίτια δεν ήταν όλα ίδια. Κάποια ήταν μικρά και πρακτικά, ενώ πλουσιότερα νοικοκυριά είχαν εσωτερικές αυλές και περισσότερους χώρους. Η κατοικία έδειχνε και τις δυνατότητες μιας οικογένειας."
        ]
      },
      {
        "title": "Τα παιδιά δεν είχαν μία κοινή εμπειρία",
        "paragraphs": [
          "Η καθημερινότητα των παιδιών εξαρτιόταν από την οικογένεια και την κοινωνική τους θέση. Κάποια μάθαιναν δουλειές του σπιτιού, άλλα πήγαιναν σε δασκάλους και άλλα βοηθούσαν στην εργασία.",
          "Δεν υπήρχε ένα ενιαίο σχολικό πρόγραμμα για όλα τα παιδιά. Κείμενα και αντικείμενα μάς δίνουν διαφορετικές ενδείξεις, αλλά δεν αποκαλύπτουν κάθε ώρα μιας παιδικής ζωής."
        ]
      },
      {
        "title": "Αγορά, εμπόριο και λατρεία",
        "paragraphs": [
          "Η Αγορά ήταν χώρος εμπορίου, δημόσιας ζωής και συναντήσεων. Οι άνθρωποι έκαναν συναλλαγές, άκουγαν νέα και ασχολούνταν με υποθέσεις της πόλης.",
          "Η λατρεία των θεών ήταν δεμένη με πολλές πλευρές της ζωής. Αφιερώματα, αγγεία και ιερά μάς δίνουν στοιχεία, όμως χρειάζεται να τα εξετάζουμε μαζί με τον τόπο και την περίοδο όπου βρέθηκαν."
        ]
      },
      {
        "title": "Πώς διαβάζουμε τα μικρά ίχνη",
        "paragraphs": [
          "Ένα πηγάδι μόνο του δεν αφηγείται μια ολόκληρη ιστορία. Αν όμως γνωρίζουμε τη θέση του, τα κοντινά σπίτια και τα αντικείμενα που βρέθηκαν μέσα, μπορούμε να καταλάβουμε καλύτερα πώς προμηθεύονταν νερό οι κάτοικοι.",
          "Οι συνηθισμένες ζωές αφήνουν μικρά και διάσπαρτα ίχνη. Όταν τα ενώνουμε προσεκτικά, πλησιάζουμε ανθρώπους που δεν έμειναν γνωστοί με το όνομά τους, αλλά έφτιαξαν την πόλη που θυμόμαστε."
        ]
      }
    ],
    "sources": [
      {
        "title": "The archaeological excavation and its museum",
        "publisher": "Acropolis Museum",
        "url": "https://www.theacropolismuseum.gr/en/exhibit-halls/archaeological-excavation"
      },
      {
        "title": "A Morning in Ancient Athens",
        "publisher": "Acropolis Museum — Digital Museum",
        "url": "https://www.emfc.gr/en/digital-museum"
      }
    ],
    "questions": [
      {
        "question": "Αρχαιολόγοι βρίσκουν πηγάδι, εστία και αποθηκευτικά αγγεία σε μια αυλή. Ποιο συμπέρασμα στηρίζεται καλύτερα στα στοιχεία;",
        "answers": [
          "Το σπίτι χρησιμοποιούνταν μόνο για τελετές",
          "Το νοικοκυριό κάλυπτε καθημερινές ανάγκες όπως νερό, μαγείρεμα και αποθήκευση",
          "Όλοι οι κάτοικοι της γειτονιάς είχαν την ίδια κοινωνική θέση",
          "Κάθε μέλος της οικογένειας έκανε ακριβώς την ίδια εργασία"
        ],
        "correctIndex": 1,
        "explanation": "Τα ευρήματα δείχνουν πώς λειτουργούσε το νοικοκυριό, αλλά δεν αποκαλύπτουν με ακρίβεια την καθημερινότητα κάθε ανθρώπου."
      },
      {
        "question": "Πώς μπορούν τα ευρήματα από ένα σπίτι να βοηθήσουν τους αρχαιολόγους;",
        "answers": [
          "Αποκαλύπτουν με ακρίβεια κάθε πράξη των κατοίκων",
          "Αποδεικνύουν ότι όλα τα σπίτια ήταν ίδια",
          "Δίνουν ενδείξεις για εργασίες και ανάγκες του νοικοκυριού",
          "Δείχνουν μόνο ποιοι θεοί λατρεύονταν"
        ],
        "correctIndex": 2,
        "explanation": "Εστίες, αγγεία, αποθηκευτικοί χώροι και πηγάδια προσφέρουν ενδείξεις για το πώς λειτουργούσε ένα νοικοκυριό."
      },
      {
        "question": "Τι δείχνει το εκπαιδευτικό υλικό για την παιδική ηλικία στην κλασική Αθήνα;",
        "answers": [
          "Όλα τα παιδιά πήγαιναν στο ίδιο σχολείο",
          "Τα παιδιά δεν συμμετείχαν ποτέ στην εργασία",
          "Η εκπαίδευση ήταν υποχρεωτική και ίδια για όλους",
          "Τα παιδιά μπορούσαν να έχουν διαφορετικές καθημερινές υποχρεώσεις και εμπειρίες"
        ],
        "correctIndex": 3,
        "explanation": "Το υλικό παρουσιάζει παιδιά που μάθαιναν οικιακές εργασίες, πήγαιναν για μάθημα ή βοηθούσαν στην εργασία."
      },
      {
        "question": "Γιατί οι αρχαιολόγοι εξετάζουν ένα αντικείμενο μαζί με τον χώρο όπου βρέθηκε;",
        "answers": [
          "Το πλαίσιο βοηθά να ερμηνευτεί η χρήση και η σημασία του",
          "Η θέση ενός αντικειμένου δεν έχει καμία σημασία",
          "Ένα μεμονωμένο αντικείμενο αρκεί πάντα για βέβαιο συμπέρασμα",
          "Για να αποφύγουν τη σύγκριση με άλλα ευρήματα"
        ],
        "correctIndex": 0,
        "explanation": "Η θέση, τα γειτονικά ευρήματα και άλλες πηγές δίνουν το πλαίσιο που χρειάζεται για μια τεκμηριωμένη ερμηνεία."
      }
    ]
  },
  ...additionalLessons,
  ...catalogueExpansion,
];
