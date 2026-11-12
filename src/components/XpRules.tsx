import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = {
  learningXP: number;
  challengeXP: number;
  recallXP: number;
  explorationXP: number;
  gameXP?: number;
};

// Shared explanation for the legacy XP card and the new Profile disclosure.
// Preserve historical totals while explaining current rewards.
export default function XpRules({ learningXP, challengeXP, recallXP, explorationXP, gameXP = 0 }: Props) {
  return <View style={styles.rules}>
    <Text style={styles.body}>Μάθηση: {learningXP} XP · Καθημερινό quiz: {challengeXP} XP</Text>
    <Text style={styles.body}>Ανάκληση: {recallXP} XP · Εξερεύνηση: {explorationXP} XP</Text>
    <Text style={styles.body}>Παιχνίδια: {gameXP} XP</Text>
    <Text style={styles.body}>60 XP για την πρώτη ολοκλήρωση μαθήματος. Σωστή απάντηση: 10 / 15 / 20 XP για εύκολες / μεσαίες / δύσκολες ερωτήσεις. 25 XP για κάθε νέα κατηγορία.</Text>
    <Text style={styles.body}>20 XP για την καθημερινή πρόκληση, 5 XP ανά σωστή απάντηση και επιπλέον 10 XP για 7/7. Οι ερωτήσεις δίνουν XP ξανά σε νέα ημέρα. Οι πόντοι του quiz παραμένουν ξεχωριστοί.</Text>
    <Text style={styles.body}>Στα μαθήματα, οι συνεχόμενες σωστές απαντήσεις δίνουν +2 XP ανά βήμα, έως +6 XP ανά νέα ερώτηση. Το λάθος μηδενίζει το σερί.</Text>
    <Text style={styles.body}>Κρεμάλα: 10 XP ανά διαφορετική λέξη που βρίσκεις, έως 30 XP την ημέρα. Γρήγορο Κουίζ: 2 XP ανά σωστή πρώτη απάντηση σε διαφορετική ερώτηση, έως 20 XP την ημέρα. Μπορείς να συνεχίσεις να παίζεις μετά το όριο. Η ημέρα αλλάζει τα μεσάνυχτα ώρα Ελλάδας.</Text>
    <Text style={styles.body}>Η εβδομαδιαία ανάκληση δίνει μία ανταμοιβή ανά ερώτηση και 10 XP για ολοκλήρωση. Η προγραμματισμένη επανάληψη και η δεύτερη ευκαιρία μοιράζονται έως 10 XP ολοκλήρωσης ανά ημέρα. Η ελεύθερη εξάσκηση δεν δίνει XP.</Text>
    <Text style={styles.body}>Τα κερδισμένα XP διατηρούνται. Οι επαναλήψεις μαθημάτων δεν δίνουν νέο XP.</Text>
  </View>;
}

const styles = StyleSheet.create({
  rules: { gap: 8 },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
});
