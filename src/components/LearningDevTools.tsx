import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ActionButton from "./ActionButton";
import { colors } from "../theme";
export type LearningDevControls = { canResetLessonProgress: boolean; lessonProgressLoaded: boolean; onResetLessonProgressForDevelopment: () => Promise<void> };
export default function LearningDevTools({ canResetLessonProgress, lessonProgressLoaded, onResetLessonProgressForDevelopment }: LearningDevControls) {
  const [isResetting, setIsResetting] = useState(false);
  function confirmResetLessonProgress() {
    if (!__DEV__ || !lessonProgressLoaded || isResetting) return;

    Alert.alert(
      "Καθαρισμός προόδου μαθημάτων",
      "Θα διαγραφούν οι ολοκληρώσεις, οι ημιτελείς προσπάθειες και η καταγεγραμμένη δραστηριότητα μαθημάτων του επισκέπτη. Τα αποθηκευμένα άρθρα και η πρόοδος της καθημερινής πρόκλησης δεν θα αλλάξουν.",
      [
        { text: "Άκυρο", style: "cancel" },
        {
          text: "Διαγραφή προόδου",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              await onResetLessonProgressForDevelopment();
            } catch {
              Alert.alert("Δεν έγινε η διαγραφή", "Δεν ήταν δυνατή η διαγραφή της προόδου μαθημάτων. Δες τα μηνύματα στο terminal.");
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  }

  return <>
      {__DEV__ ? (
        <View style={styles.devTools}>
          <Text style={styles.devLabel}>ΕΡΓΑΛΕΙΑ ΑΝΑΠΤΥΞΗΣ</Text>
          <Text style={styles.devDescription}>Διαθέσιμο μόνο ως επισκέπτης. Καθαρίζει ολοκληρώσεις, ημιτελείς προσπάθειες και δραστηριότητα μαθημάτων του επισκέπτη, χωρίς να διαγράφει δεδομένα λογαριασμού.</Text>
          <ActionButton
            label={isResetting ? "Γίνεται καθαρισμός…" : "Καθαρισμός προόδου μαθημάτων (DEV)"}
            onPress={confirmResetLessonProgress}
            secondary
            disabled={!canResetLessonProgress || !lessonProgressLoaded || isResetting}
          />
        </View>
      ) : null}
</>;
}
const styles = StyleSheet.create({ devTools: { marginTop: 24, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, gap: 10 }, devLabel: { color: colors.accentLight, fontSize: 11, fontWeight: "800" }, devDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 21 } });
