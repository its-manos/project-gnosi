import { contentVersion } from "./engine";
import type { BuiltinQuizQuestion, FillBlankContent, MatchingContent, MultipleSelectContent, OrderingContent, SpotMistakeContent } from "./types";

/** Development-only fixtures. Never selected by production daily/lesson banks. */
const source = { title: "Encyclopaedia Britannica — Ancient Greece", url: "https://www.britannica.com/place/ancient-Greece" };
function meta(id: string, prompt: string, content: unknown) {
  return {
    id: `preview:${id}`, version: contentVersion(prompt, content),
    categoryId: "history", subcategoryId: "ancient-greece", conceptIds: [`preview:${id}`],
    difficulty: "medium" as const, difficultyOrigin: "editorial" as const,
    prompt, sources: [source],
  };
}
const selectContent: MultipleSelectContent = {
  answers: [
    "Η Εκκλησία του Δήμου",
    "Η εκλογή κληρονομικού βασιλιά",
    "Η Βουλή των Πεντακοσίων",
    "Η συμμετοχή όλων των κατοίκων χωρίς εξαιρέσεις",
  ],
  correctIndices: [0, 2],
};
const selectPrompt = "Ποιοι από τους παρακάτω θεσμούς υπήρχαν στη δημοκρατική Αθήνα;";
const orderContent: OrderingContent = {
  items: [
    { id: "classical", label: "Κλασική εποχή" },
    { id: "mycenaean", label: "Μυκηναϊκή εποχή" },
    { id: "geometric", label: "Γεωμετρική εποχή" },
  ],
  correctOrder: ["mycenaean", "geometric", "classical"],
};
const orderPrompt = "Βάλε τις περιόδους της αρχαίας ελληνικής ιστορίας από την παλαιότερη στη νεότερη.";
const matchContent: MatchingContent = {
  pairs: [
    { leftId: "assembly", leftLabel: "Εκκλησία του Δήμου", rightId: "citizens", rightLabel: "Συνέλευση πολιτών" },
    { leftId: "council", leftLabel: "Βουλή των Πεντακοσίων", rightId: "agenda", rightLabel: "Προετοιμασία θεμάτων για τη συνέλευση" },
    { leftId: "courts", leftLabel: "Λαϊκά δικαστήρια", rightId: "trials", rightLabel: "Εκδίκαση υποθέσεων" },
  ],
};
const matchPrompt = "Αντιστοίχισε τους αθηναϊκούς θεσμούς με τη βασική λειτουργία τους.";

const mistakeContent: SpotMistakeContent = {
  options: [
    { id: "membership", text: "Αποτελούνταν από 500 πολίτες, 50 από καθεμιά από τις δέκα φυλές." },
    { id: "selection", text: "Τα μέλη της επιλέγονταν με κλήρωση και υπηρετούσαν για ένα έτος." },
    { id: "responsibility", text: "Προετοίμαζε θέματα προς συζήτηση στην Εκκλησία του Δήμου." },
    { id: "term", text: "Τα μέλη της εκλέγονταν ισόβια, ώστε η σύνθεσή της να παραμένει σταθερή." },
  ],
  incorrectOptionId: "term",
  correction: "Η θητεία των μελών ήταν ετήσια, όχι ισόβια. Η επιλογή γινόταν κυρίως με κλήρωση.",
};
const mistakePrompt = "Η Βουλή των Πεντακοσίων";

const blankContent: FillBlankContent = {
  before: "Στη δημοκρατική Αθήνα, η συνέλευση των πολιτών ονομαζόταν",
  after: ".",
  acceptedAnswers: ["Εκκλησία του Δήμου", "Εκκλησία Δήμου"],
  displayAnswer: "Εκκλησία του Δήμου",
  accentSensitive: false,
};
const blankPrompt = "Θυμάσαι το όνομα της συνέλευσης των Αθηναίων πολιτών;";

export const previewQuestions: BuiltinQuizQuestion[] = [
  { ...meta("institutions", selectPrompt, selectContent), type: "multiple-select", content: selectContent,
    explanation: "Η Εκκλησία του Δήμου και η Βουλή των Πεντακοσίων ήταν σημαντικοί θεσμοί, αλλά δεν είχαν δικαίωμα συμμετοχής όλοι οι κάτοικοι." },
  { ...meta("chronology", orderPrompt, orderContent), type: "ordering", content: orderContent,
    explanation: "Η μυκηναϊκή περίοδος προηγείται της γεωμετρικής και της κλασικής εποχής." },
  { ...meta("civic-roles", matchPrompt, matchContent), type: "matching", content: matchContent,
    explanation: "Οι θεσμοί είχαν διαφορετικές ευθύνες και η συμμετοχή στην πολιτική ζωή δεν ήταν ανοιχτή σε κάθε κάτοικο." },
  { ...meta("identify-error", mistakePrompt, mistakeContent), type: "spot-the-mistake", content: mistakeContent,
    explanation: "Η βουλευτική θητεία διαρκούσε ένα έτος, ενώ η κλήρωση ήταν σημαντικό στοιχείο της συμμετοχής των πολιτών." },
  { ...meta("assembly-name", blankPrompt, blankContent), type: "fill-in-the-blank", content: blankContent,
    explanation: "Η Εκκλησία του Δήμου ήταν η συνέλευση των πολιτών με πολιτικά δικαιώματα. Δεν συμμετείχαν όλοι οι κάτοικοι." },
];
