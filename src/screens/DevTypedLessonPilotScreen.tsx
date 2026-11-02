import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import { categories, lessons, subcategories, type Lesson } from "../data/lessons";
import type { QuizAnswer } from "../quiz/types";
import { adaptInteractiveLessonQuestion } from "../quiz/adapters";
import { colors } from "../theme";
import ReaderLessonScreen from "./ReaderLessonScreen";

type Props = { onBack: () => void };

/** Dev-only end-to-end article pilot. Never calls LearningStore or writes
 * completed lesson IDs, XP, daily results or Supabase learning documents.
 * No real article in the published catalogue is modified.
 */
export default function DevTypedLessonPilotScreen({ onBack }: Props) {
  const pilot = useMemo(() => {
    const base = lessons.find(item => item.id === "ancient-athens");
    if (!base || base.questions.length < 3) return null;
    const questions = base.questions.map(question => ({ ...question }));
    questions[0] = {
      ...questions[0],
      question: "Ποια από τα παρακάτω συνδέονται με την αθηναϊκή δημοκρατία;",
      answers: ["Η Εκκλησία του Δήμου", "Η πολιτική συμμετοχή όλων ανεξαιρέτως των κατοίκων",
        "Η Βουλή των Πεντακοσίων", "Τα πολιτικά δικαιώματα όλων των γυναικών"],
      correctIndex: 0,
      explanation: "Η Εκκλησία του Δήμου και η Βουλή των Πεντακοσίων ήταν κεντρικοί θεσμοί. Οι πολιτικές ιδιότητες όμως δεν ανήκαν σε όλους τους κατοίκους.",
      presentation: { type: "multiple-select", correctIndices: [0, 2] },
    };
    questions[1] = {
      ...questions[1],
      question: "Ποια είναι η σωστή χρονολογική σειρά των τριών περιόδων;",
      answers: ["Μυκηναϊκή → Γεωμετρική → Κλασική", "Γεωμετρική → Κλασική → Μυκηναϊκή",
        "Κλασική → Μυκηναϊκή → Γεωμετρική", "Μυκηναϊκή → Κλασική → Γεωμετρική"],
      correctIndex: 0,
      explanation: "Η Μυκηναϊκή εποχή προηγείται της Γεωμετρικής, ενώ η Κλασική εποχή ανήκει σε μεταγενέστερους αιώνες.",
      presentation: { type: "ordering", items: [
        { id: "classical", label: "Κλασική" }, { id: "mycenaean", label: "Μυκηναϊκή" },
        { id: "geometric", label: "Γεωμετρική" },
      ], correctOrder: ["mycenaean", "geometric", "classical"] },
    };
    questions[2] = {
      ...questions[2],
      question: "Ποιος θεσμός αντιστοιχεί σε κάθε ρόλο στην αρχαία Αθήνα;",
      answers: ["Εκκλησία του Δήμου → συνέλευση πολιτών", "Βουλή → δικαστήριο ενόρκων",
        "Ηλιαία → συμβούλιο πεντακοσίων", "Άρειος Πάγος → λαϊκή συνέλευση"],
      correctIndex: 0,
      explanation: "Η Εκκλησία του Δήμου ήταν η συνέλευση των πολιτών, η Βουλή προετοίμαζε υποθέσεις και η Ηλιαία λειτουργούσε ως λαϊκό δικαστήριο.",
      presentation: { type: "matching", pairs: [
        { leftId: "assembly", leftLabel: "Εκκλησία του Δήμου", rightId: "citizens", rightLabel: "Συνέλευση πολιτών" },
        { leftId: "council", leftLabel: "Βουλή", rightId: "prepares", rightLabel: "Προετοιμασία υποθέσεων" },
        { leftId: "heliaia", leftLabel: "Ηλιαία", rightId: "court", rightLabel: "Λαϊκό δικαστήριο" },
      ] },
    };
    return { ...base, questions } as Lesson;
  }, []);
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<number, number>>({});
  const [typedCheckpointAnswers, setTypedCheckpointAnswers] = useState<Record<number, QuizAnswer>>({});
  const answersRef = useRef<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  if (!pilot) return <View style={styles.result}>
    <Text style={styles.title}>Δεν βρέθηκε το δοκιμαστικό άρθρο.</Text>
    <ActionButton label="Επιστροφή" onPress={onBack} />
  </View>;
  const category = categories.find(item => item.id === pilot.categoryId)!;
  const subcategory = subcategories.find(item => item.id === pilot.subcategoryId)!;
  if (finished) return <ScrollView contentContainerStyle={styles.result}>
    <Text style={styles.eyebrow}>ΕΡΓΑΣΤΗΡΙΟ GNOSI · ΔΟΚΙΜΑΣΤΙΚΟ ΑΡΘΡΟ</Text>
    <Text style={styles.title}>Ολοκληρώθηκαν οι τρεις νέοι τύποι!</Text>
    <Text style={styles.body}>Έλεγξες Πολλαπλή Επιλογή, Σωστή Σειρά και Αντιστοίχιση μέσα στον πραγματικό αναγνώστη. Οι απαντήσεις δεν αποθηκεύτηκαν και δεν απονεμήθηκαν XP.</Text>
    <ActionButton label="Επιστροφή στο εργαστήριο" onPress={onBack} />
  </ScrollView>;

  return <ReaderLessonScreen
    category={category}
    subcategory={subcategory}
    lesson={pilot}
    isSaved={false}
    bookmarksLoaded={false}
    onToggleSaved={() => {}}
    enableReporting={false}
    checkpointAnswers={checkpointAnswers}
    typedCheckpointAnswers={typedCheckpointAnswers}
    onAnswerCheckpoint={(index, numeric, _correctIndex, value) => {
      if (answersRef.current[index] !== undefined || value === undefined) return;
      const typed = adaptInteractiveLessonQuestion(pilot, index);
      if (!typed) return;
      answersRef.current = { ...answersRef.current, [index]: numeric };
      setCheckpointAnswers(answersRef.current);
      setTypedCheckpointAnswers(previous => ({ ...previous,
        [index]: { questionVersion: typed.version, value },
      }));
    }}
    onFinishLesson={() => {
      if (Object.keys(answersRef.current).length === 3) setFinished(true);
    }}
    onBack={onBack}
  />;
}

const styles = StyleSheet.create({
  result: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 18 },
  eyebrow: { color: colors.accentLight, fontWeight: "900", fontSize: 11, textAlign: "center" },
  title: { color: colors.text, fontSize: 25, lineHeight: 34, fontWeight: "900", textAlign: "center" },
  body: { color: colors.textBody, fontSize: 15, lineHeight: 24, textAlign: "center" },
});
