import { worldHistoryArticleMedia } from "./worldHistoryMedia";
import { astronomyArticleMedia } from "./astronomyMedia";
import { architectureArticleMedia } from "./architectureMedia";

/**
 * Additional inline illustrations for ΓΝΩΣΗ lessons.
 * Images are served from Wikimedia Commons; each figure displays a credit
 * that links to the corresponding Commons file page and licence information.
 */
export type InlineArticleImage = {
  afterParagraphCount: number;
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
  "ancient-athens": [
    {
      afterParagraphCount: 3,
      url: commonsFileUrl("The Parthenon at the Acropolis of Athens.jpg"),
      caption: "Ο Παρθενώνας είναι το πιο αναγνωρίσιμο μνημείο της Ακρόπολης — όχι όμως ολόκληρη η ιστορία της αρχαίας πόλης.",
      credit: "Ceylnbirol / Wikimedia Commons · CC0",
      creditUrl: commonsPageUrl("The Parthenon at the Acropolis of Athens.jpg"),
    },
    {
      afterParagraphCount: 7,
      url: commonsFileUrl("Ancient Greek vases.jpg"),
      caption: "Τα κεραμικά αγγεία μάς δίνουν ενδείξεις για την τεχνική, το εμπόριο και την καθημερινή ζωή.",
      credit: "Accord14 / Wikimedia Commons · CC BY-SA 4.0",
      creditUrl: commonsPageUrl("Ancient Greek vases.jpg"),
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
