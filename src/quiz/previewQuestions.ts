import { contentVersion } from "./engine";
import type { BuiltinQuizQuestion, MatchingContent, MultipleSelectContent, OrderingContent } from "./types";

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

export const previewQuestions: BuiltinQuizQuestion[] = [
  { ...meta("institutions", selectPrompt, selectContent), type: "multiple-select", content: selectContent,
    explanation: "Η Εκκλησία του Δήμου και η Βουλή των Πεντακοσίων ήταν σημαντικοί θεσμοί, αλλά δεν είχαν δικαίωμα συμμετοχής όλοι οι κάτοικοι." },
  { ...meta("chronology", orderPrompt, orderContent), type: "ordering", content: orderContent,
    explanation: "Η μυκηναϊκή περίοδος προηγείται της γεωμετρικής και της κλασικής εποχής." },
  { ...meta("civic-roles", matchPrompt, matchContent), type: "matching", content: matchContent,
    explanation: "Οι θεσμοί είχαν διαφορετικές ευθύνες και η συμμετοχή στην πολιτική ζωή δεν ήταν ανοιχτή σε κάθε κάτοικο." },
];
