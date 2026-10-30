import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import { colors } from "../theme";

type Props = {
  lesson: Lesson;
  indices: number[];
  index: number;
  selected: number | null;
  onChoose: (answer: number) => void;
  onNext: () => void;
  onRetry: () => void;
  onBack: () => void;
};
export default function ReviewMistakesScreen({ lesson, indices, index, selected, onChoose, onNext, onRetry, onBack }: Props) {
  const question = lesson.questions[indices[index]];
  const finished = indices.length > 0 && index >= indices.length;
  const correct = question && selected === question.correctIndex;
  return <ScrollView contentContainerStyle={styles.content}>
    <AppHeader onBack={onBack} backLabel="ΑΠΟΤΕΛΕΣΜΑ" />
    <Text style={styles.eyebrow}>ΕΞΑΣΚΗΣΗ ΣΤΑ ΛΑΘΗ</Text>
    <Text style={styles.title}>{finished ? "Τα διόρθωσες όλα!" : lesson.title}</Text>
    <Text style={styles.body}>Εδώ δουλεύεις μόνο τις ερωτήσεις που έχασες στην τελευταία πλήρη προσπάθεια. Η αρχική βαθμολογία και οι μετρητές δραστηριότητας παραμένουν όπως ήταν.</Text>
    {finished ? <View style={styles.card}>
      <Text style={styles.cardTitle}>{indices.length} / {indices.length} ερωτήσεις διορθώθηκαν</Text>
      <Text style={styles.body}>Μπορείς να επιστρέψεις στο αποτέλεσμα ή να κάνεις αργότερα μια πλήρη επανάληψη για ένα νέο σκορ.</Text>
      <ActionButton label="Πίσω στο αποτέλεσμα" onPress={onBack} />
    </View> : question ? <>
      <Text style={styles.counter}>{index + 1} από {indices.length} προς εξάσκηση · Ερώτηση μαθήματος {indices[index] + 1}</Text>
      <View style={styles.card}><Text style={styles.question}>{question.question}</Text></View>
      <View style={styles.answers}>{question.answers.map((answer, answerIndex) => <AnswerOption key={answerIndex} label={answer} index={answerIndex}
        selected={selected === answerIndex} correct={answerIndex === question.correctIndex} locked={selected !== null} onPress={() => onChoose(answerIndex)} />)}</View>
      {selected !== null ? <View style={styles.card} accessibilityLiveRegion="polite">
        <Text style={styles.cardTitle}>{correct ? "Το βρήκες!" : "Ας το δούμε ακόμη μία φορά"}</Text>
        <Text style={styles.body}>{question.explanation}</Text>
        {!correct ? <Text style={styles.body}>Ξαναδιάβασε την εξήγηση και απάντησε σωστά πριν προχωρήσεις.</Text> : null}
        <ActionButton label={correct ? (index === indices.length - 1 ? "Ολοκλήρωση εξάσκησης" : "Επόμενη ερώτηση") : "Δοκίμασε ξανά"} onPress={correct ? onNext : onRetry} />
      </View> : null}
    </> : <ActionButton label="Πίσω στο αποτέλεσμα" onPress={onBack} />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44, gap: 16 },
  eyebrow: { color: colors.accentLight, fontSize: 11, lineHeight: 18, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 23 },
  counter: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  card: { padding: 20, gap: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface },
  question: { color: colors.text, fontSize: 21, lineHeight: 30, fontWeight: "700" },
  cardTitle: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: "700" },
  answers: { gap: 10 },
});
