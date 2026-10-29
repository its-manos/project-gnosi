/**
 * Standalone general-knowledge question bank for future daily challenges.
 * The current lesson flow uses each lesson's own `questions` array from lessons.ts.
 */
export type GeneralKnowledgeQuestion = {
  id: string;
  categoryId: string;
  subcategoryId: string;
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
};

export const questions: GeneralKnowledgeQuestion[] = [
  {
    id: "planet-largest",
    categoryId: "science",
    subcategoryId: "space",
    question: "Ποιος είναι ο μεγαλύτερος πλανήτης του Ηλιακού Συστήματος;",
    answers: ["Γη", "Κρόνος", "Δίας", "Ποσειδώνας"],
    correctIndex: 2,
    explanation: "Ο Δίας είναι ο μεγαλύτερος πλανήτης του Ηλιακού Συστήματος.",
  },
  {
    id: "greek-revolution-year",
    categoryId: "history",
    subcategoryId: "world-history",
    question: "Ποια χρονιά ξεκίνησε η Ελληνική Επανάσταση;",
    answers: ["1776", "1821", "1843", "1912"],
    correctIndex: 1,
    explanation: "Η Ελληνική Επανάσταση ξεκίνησε το 1821.",
  },
  {
    id: "gold-symbol",
    categoryId: "science",
    subcategoryId: "physics",
    question: "Ποιο είναι το χημικό σύμβολο του χρυσού;",
    answers: ["Ag", "Gd", "Go", "Au"],
    correctIndex: 3,
    explanation: "Το Au προέρχεται από τη λατινική λέξη aurum.",
  },
  {
    id: "australia-capital",
    categoryId: "geography",
    subcategoryId: "countries",
    question: "Ποια είναι η πρωτεύουσα της Αυστραλίας;",
    answers: ["Σίδνεϊ", "Μελβούρνη", "Καμπέρα", "Περθ"],
    correctIndex: 2,
    explanation: "Πρωτεύουσα της Αυστραλίας είναι η Καμπέρα.",
  },
  {
    id: "hexagon-sides",
    categoryId: "science",
    subcategoryId: "physics",
    question: "Πόσες πλευρές έχει ένα εξάγωνο;",
    answers: ["Πέντε", "Έξι", "Επτά", "Οκτώ"],
    correctIndex: 1,
    explanation: "Το εξάγωνο έχει έξι πλευρές.",
  },
];
