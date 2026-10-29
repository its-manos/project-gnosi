/**
 * Reviewed starter bank for the daily general-knowledge challenge.
 * Each question has four choices, one correct answer, a short explanation,
 * and a source URL for editorial verification.
 */
export type GeneralKnowledgeQuestion = {
  id: string;
  categoryId: string;
  subcategoryId: string;
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
    question: "Ποια είναι η πρωτεύουσα της Αυστραλίας;",
    answers: ["Σίδνεϊ", "Μελβούρνη", "Καμπέρα", "Περθ"],
    correctIndex: 2,
    explanation: "Πρωτεύουσα της Αυστραλίας είναι η Καμπέρα, όχι το Σίδνεϊ ή η Μελβούρνη.",
    sourceTitle: "Encyclopaedia Britannica — Canberra",
    sourceUrl: "https://www.britannica.com/place/Canberra-Australian-Capital-Territory",
  },
  {
    id: "hexagon-sides",
    categoryId: "science",
    subcategoryId: "physics",
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
    question: "Ποιο αέριο αποτελεί το μεγαλύτερο ποσοστό της ατμόσφαιρας της Γης;",
    answers: ["Οξυγόνο", "Άζωτο", "Διοξείδιο του άνθρακα", "Υδρογόνο"],
    correctIndex: 1,
    explanation: "Το άζωτο αποτελεί περίπου το 78% της ξηρής ατμόσφαιρας της Γης.",
    sourceTitle: "NOAA — The Atmosphere",
    sourceUrl: "https://www.noaa.gov/jetstream/atmosphere",
  },
  {
    id: "pacific-largest",
    categoryId: "nature",
    subcategoryId: "oceans",
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
    question: "Ποιος είναι ο φυσικός δορυφόρος της Γης;",
    answers: ["Τιτάνας", "Σελήνη", "Ευρώπη", "Φόβος"],
    correctIndex: 1,
    explanation: "Η Σελήνη είναι ο φυσικός δορυφόρος της Γης και περιφέρεται γύρω από τον πλανήτη μας.",
    sourceTitle: "NASA — Moon",
    sourceUrl: "https://science.nasa.gov/moon/",
  },
];
