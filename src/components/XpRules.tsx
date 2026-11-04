import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = {
  learningXP: number;
  challengeXP: number;
  recallXP: number;
  explorationXP: number;
};

// Shared explanation for the legacy XP card and the new Profile disclosure.
// Keep reward figures aligned with the existing v2 rules and compatibility copy.
export default function XpRules({ learningXP, challengeXP, recallXP, explorationXP }: Props) {
  return <View style={styles.rules}>
    <Text style={styles.body}>Μάθηση: {learningXP} XP · Καθημερινό quiz: {challengeXP} XP</Text>
    <Text style={styles.body}>Ανάκληση: {recallXP} XP · Εξερεύνηση: {explorationXP} XP</Text>
    <Text style={styles.body}>30 XP για την πρώτη ολοκλήρωση μαθήματος. Σωστή απάντηση: 10 / 15 / 20 XP για εύκολες / μεσαίες / δύσκολες ερωτήσεις. 25 XP για κάθε νέα κατηγορία.</Text>
    <Text style={styles.body}>20 XP για την καθημερινή πρόκληση, 2 XP ανά νέα λανθασμένη απάντηση και επιπλέον 20 XP για 7/7. Οι πόντοι του quiz παραμένουν ξεχωριστοί.</Text>
    <Text style={styles.body}>Στις συνεχόμενες σωστές απαντήσεις: +2 XP ανά βήμα του σερί, έως +10 XP ανά νέα ερώτηση. Το λάθος μηδενίζει το σερί. Η εβδομαδιαία επανάληψη δίνει μία ανταμοιβή ανά ερώτηση και 10 XP για ολοκλήρωση.</Text>
    <Text style={styles.body}>Τα κερδισμένα XP διατηρούνται. Οι επαναλήψεις μαθημάτων και οι ήδη απαντημένες καθημερινές ερωτήσεις δεν δίνουν νέο XP. Η ελεύθερη εξάσκηση δεν δίνει XP. Η προγραμματισμένη επανάληψη δίνει έως 10 XP ολοκλήρωσης ανά ημέρα, μαζί με τη δεύτερη ευκαιρία.</Text>
  </View>;
}

const styles = StyleSheet.create({
  rules: { gap: 8 },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
});
