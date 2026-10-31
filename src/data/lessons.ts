import type { QuestionMetadata } from "../quiz/types";
import { worldHistoryLessons } from "./worldHistoryLessons";
import { astronomyLessons, astronomyRevisions } from "./astronomyLessons";
import { architectureLessons } from "./architectureLessons";
import { perceptionLessons } from "./perceptionLessons";
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
  { id: "genocide-memory", categoryId: "difficult-history", title: "Γενοκτονίες & μνήμη", description: "Διώξεις, ιστορικά τεκμήρια και η ευθύνη της μνήμης." },
  { id: "colonialism-slavery", categoryId: "difficult-history", title: "Αποικιοκρατία & δουλεία", description: "Καταναγκασμός, οικονομικά συστήματα και κριτική ανάγνωση των πηγών." },
  { id: "power-exclusion", categoryId: "difficult-history", title: "Εξουσία & αποκλεισμός", description: "Λογοκρισία, ψευδοεπιστήμη και ανθρώπινα δικαιώματα." },
];

const originalLessons: Lesson[] = [
        {
          "id": "ancient-athens",
          "categoryId": "history",
          "subcategoryId": "ancient-greece",
          "title": "Μια μέρα στην αρχαία Αθήνα",
          "summary": "Κάτω από τον Παρθενώνα υπήρχαν σπίτια, εργαστήρια, πηγάδια και άνθρωποι με πολύ διαφορετικές καθημερινές ζωές.",
          "readingMinutes": 3,
          "intro": "Η Αθήνα δεν ξυπνούσε κάθε πρωί κοιτάζοντας τον Παρθενώνα. Κάποιος έπρεπε να φέρει νερό, να ανάψει τη φωτιά, να ανοίξει το εργαστήριο. Αν χαμηλώσουμε το βλέμμα από τα μνημεία στο ύψος του δρόμου, εμφανίζεται μια άλλη πόλη: εκείνη των ανθρώπων που τη συντηρούσαν.",
          "imageUrl": "https://images.unsplash.com/photo-1684957048838-c7297a798563?auto=format&fit=crop&w=1200&q=80",
          "imageCaption": "Η Ακρόπολη δεσπόζει πάνω από την Αθήνα, συνδέοντας το σημερινό τοπίο με την αρχαία πόλη.",
          "imageCredit": "Ermir Hoxhaj / Unsplash",
          "imageCreditUrl": "https://unsplash.com/fr/photos/une-vue-du-parthenon-au-sommet-dune-colline-e4wkUDrsTCw",
          "sections": [
            {
              "title": "Μια πόλη πίσω από τα μνημεία",
              "paragraphs": [
                "Τα μεγάλα δημόσια κτίρια δείχνουν πώς ήθελε μια πόλη να παρουσιάζει τον εαυτό της. Ένα πηγάδι, ένας αποχετευτικός αγωγός ή ένας χώρος εργασίας απαντούν σε πιο πρακτικές ερωτήσεις: από πού ερχόταν το νερό; Πού κατέληγαν τα απόβλητα; Πώς έβγαινε το μεροκάματο;",
                "Οι άνθρωποι που μοιράζονταν τους δρόμους δεν μοιράζονταν τα ίδια δικαιώματα ή τις ίδιες ευκαιρίες. Πολίτες, μέτοικοι και υποδουλωμένοι άνθρωποι συμμετείχαν στην οικονομική ζωή με πολύ διαφορετικούς όρους. Η εικόνα του ελεύθερου πολίτη που συζητά στην Αγορά δεν περιγράφει ολόκληρο τον πληθυσμό."
              ]
            },
            {
              "title": "Το σπίτι ως κέντρο εργασίας",
              "paragraphs": [
                "Μια αυλή μπορούσε να δίνει φως και αέρα στα δωμάτια γύρω της και να φιλοξενεί δουλειές του σπιτιού. Αγγεία αποθήκευσης, μια εστία και ένα πηγάδι δεν είναι απλώς διακόσμηση μιας ανασκαφής. Είναι ίχνη από ανάγκες που επαναλαμβάνονταν κάθε μέρα.",
                "Τα σπίτια δεν ήταν όλα ίδια. Κάποια ήταν μικρά και πρακτικά, ενώ πλουσιότερα νοικοκυριά είχαν εσωτερικές αυλές και περισσότερους χώρους. Η κατοικία έδειχνε και τις δυνατότητες μιας οικογένειας."
              ]
            },
            {
              "title": "Τα παιδιά δεν είχαν μία κοινή εμπειρία",
              "paragraphs": [
                "Η ερώτηση «πήγαιναν τα παιδιά σχολείο;» δεν έχει μία απάντηση για όλους. Σε οικογένειες με πόρους, αγόρια μπορούσαν να μάθουν γράμματα, μουσική και γυμναστική κοντά σε δασκάλους. Άλλα παιδιά μάθαιναν μια δουλειά βοηθώντας στο σπίτι ή στο εργαστήριο. Το φύλο, η κοινωνική θέση και η οικονομική δυνατότητα επηρέαζαν τη διαδρομή τους.",
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
                "Κάτω από το Μουσείο της Ακρόπολης σώζεται μια ολόκληρη γειτονιά με δρόμους, σπίτια, πηγάδια, εργαστήρια και λουτρά. Τα κατάλοιπα ανήκουν σε διαφορετικές εποχές. Δεν βλέπουμε ένα καρέ της κλασικής Αθήνας, αλλά διαδοχικές πόλεις που χτίστηκαν η μία πάνω στην άλλη.",
                "Ένα δωμάτιο μπορεί να άλλαξε χρήση· ένας δρόμος να επισκευάστηκε πολλές φορές. Γι’ αυτό οι αρχαιολόγοι εξετάζουν πού βρέθηκε κάθε αντικείμενο και σε ποιο στρώμα. Το πιο χρήσιμο ερώτημα δεν είναι πάντα «ποιο διάσημο πρόσωπο πέρασε από εδώ;», αλλά «τι χρειάστηκε να κάνουν εδώ χιλιάδες άγνωστοι άνθρωποι;»."
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
              "question": "Μια ξενάγηση δείχνει μόνο τον Παρθενώνα. Τι χάνει από την εικόνα της Αθήνας;",
              "answers": [
                "Τη σειρά με την οποία χτίστηκαν τα δημόσια μνημεία.",
                "Τον τρόπο με τον οποίο οι ναοί παρουσίαζαν την πόλη.",
                "Τους χώρους όπου οι κάτοικοι ζούσαν και εργάζονταν.",
                "Τις τεχνικές κατασκευής των μεγάλων μαρμάρινων κτιρίων."
              ],
              "correctIndex": 2,
              "explanation": "Τα μνημεία είναι ένα μέρος της πόλης. Σπίτια, δρόμοι και εργαστήρια αποκαλύπτουν άλλες πλευρές της καθημερινότητας· δεν δίνουν όμως πλήρη βιογραφία κάθε κατοίκου."
            },
            {
              "question": "Σε μια αυλή βρίσκονται εστία, αγγεία και πηγάδι. Ποια ερμηνεία στηρίζεται καλύτερα σε αυτά;",
              "answers": [
                "Το νοικοκυριό είχε την ίδια οικονομική θέση με τα γειτονικά.",
                "Η αυλή εξυπηρετούσε κυρίως δημόσιες συνελεύσεις.",
                "Εκεί καλύπτονταν ανάγκες μαγειρέματος, αποθήκευσης και νερού.",
                "Το σπίτι ανήκε σε τεχνίτη που κατασκεύαζε αγγεία."
              ],
              "correctIndex": 2,
              "explanation": "Ο συνδυασμός των ευρημάτων δείχνει οικιακές λειτουργίες. Ούτε το επάγγελμα του ιδιοκτήτη ούτε η οικονομική ισότητα προκύπτουν από αυτά τα στοιχεία."
            },
            {
              "question": "Δύο παιδιά της ίδιας ηλικίας ζουν στην Αθήνα: το ένα πηγαίνει σε δάσκαλο, το άλλο βοηθά στη δουλειά. Τι εξηγεί καλύτερα τη διαφορά;",
              "answers": [
                "Η εργασία αποτελούσε το τελικό στάδιο ενός κοινού σχολείου.",
                "Η ηλικία αρκούσε για να καθορίσει τη διαδρομή κάθε παιδιού.",
                "Όλα τα παιδιά ακολουθούσαν κοινό πρόγραμμα με διαφορετικές βάρδιες.",
                "Η οικογένεια και η κοινωνική θέση επηρέαζαν τις ευκαιρίες τους."
              ],
              "correctIndex": 3,
              "explanation": "Δεν υπήρχε ενιαίο σχολικό πρόγραμμα για όλους. Η ίδια ηλικία δεν σήμαινε ίδιες συνθήκες ζωής ή πρόσβαση στην εκπαίδευση."
            },
            {
              "question": "Κάποιος χαρακτηρίζει την Αγορά «απλώς ένα παζάρι». Ποια παρατήρηση διορθώνει την εικόνα;",
              "answers": [
                "Το εμπόριο συνυπήρχε με συναντήσεις και δημόσιες υποθέσεις.",
                "Οι δημόσιες υποθέσεις γίνονταν κυρίως μέσα στις κατοικίες.",
                "Τα αφιερώματα αρκούν για να ανασυνθέσουμε κάθε τελετή.",
                "Η παρουσία εμπορίου απέκλειε τις δημόσιες δραστηριότητες."
              ],
              "correctIndex": 0,
              "explanation": "Η Αγορά είχε πολλές λειτουργίες. Όπως και τα αντικείμενα λατρείας, οι χώροι χρειάζονται ιστορικό πλαίσιο για να ερμηνευτούν σωστά."
            }
          ],
          "compatibleQuizKeys": [
            "q_e3d86507"
          ],
          "editorialReviewedAt": "2026-10-30"
        },
  ...additionalLessons,
  ...catalogueExpansion,
  ...architectureLessons,
];

// Keep old catalogue order and all quiz objects stable; place the path in lessonPath.ts.
export const lessons: Lesson[] = [
  ...originalLessons.map(lesson => ({ ...lesson, ...astronomyRevisions[lesson.id] })),
  ...astronomyLessons,
  ...worldHistoryLessons,
  ...perceptionLessons,
];
