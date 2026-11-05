import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ActionButton from "./ActionButton";
import { colors } from "../theme";
export type LearningDevControls = { canResetLessonProgress: boolean; lessonProgressLoaded: boolean; onResetLessonProgressForDevelopment: () => Promise<void>; allLessonsUnlockedForTesting: boolean; onToggleAllLessonsForTesting: () => void; onOpenQuestionPreview: () => void; onOpenDailyIntroPreview: () => void };
export default function LearningDevTools({ canResetLessonProgress, lessonProgressLoaded, onResetLessonProgressForDevelopment, allLessonsUnlockedForTesting, onToggleAllLessonsForTesting, onOpenQuestionPreview, onOpenDailyIntroPreview }: LearningDevControls) {
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
          <Text style={styles.devLabel}>ΠΡΟΕΠΙΣΚΟΠΗΣΗ ΗΜΕΡΗΣΙΑΣ ΠΡΟΚΛΗΣΗΣ</Text>
          <Text style={styles.devDescription}>Δες την αρχική οθόνη της ημερήσιας πρόκλησης χωρίς να μηδενιστούν οι απαντήσεις, τα XP ή το σερί σου.</Text>
          <ActionButton label="Προβολή αρχικής καθημερινού quiz →" onPress={onOpenDailyIntroPreview} secondary />
          <View style={styles.rule} />
          <Text style={styles.devLabel}>ΕΡΓΑΣΤΗΡΙΟ ΕΡΩΤΗΣΕΩΝ</Text>
          <Text style={styles.devDescription}>Δοκίμασε τα είδη ερωτήσεων χωρίς να αλλάξει η καθημερινή πρόκληση ή η αποθηκευμένη πρόοδός σου.</Text>
          <ActionButton label="Δοκιμή ειδών ερωτήσεων →" onPress={onOpenQuestionPreview} secondary />
          <View style={styles.rule} />
          <Text style={styles.devLabel}>ΕΡΓΑΛΕΙΑ ΜΑΘΗΜΑΤΩΝ</Text>
          <Text style={styles.devDescription}>Για δοκιμές: μπορείς να ανοίξεις οποιοδήποτε δημοσιευμένο μάθημα χωρίς να ολοκληρώσεις τα προηγούμενα. Δεν αλλάζει ολοκληρώσεις, XP ή συγχρονισμό και απενεργοποιείται όταν επανεκκινήσεις την εφαρμογή.</Text>
          <ActionButton
            label={allLessonsUnlockedForTesting ? "Επαναφορά κλειδωμένων μαθημάτων (DEV)" : "Ξεκλείδωμα όλων των μαθημάτων (DEV)"}
            onPress={onToggleAllLessonsForTesting}
            secondary
            disabled={!lessonProgressLoaded}
          />
          <Text style={styles.devDescription}>Ο καθαρισμός προόδου παρακάτω διατίθεται μόνο ως επισκέπτης και είναι ανεξάρτητος από το ξεκλείδωμα.</Text>
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
const styles = StyleSheet.create({ rule: {height:1,backgroundColor:colors.border,marginVertical:8}, devTools: { marginTop: 12, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, gap: 10 }, devLabel: { color: colors.accentLight, fontSize: 11, fontWeight: "800" }, devDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 21 } });
