import { StyleSheet, Text, View } from "react-native";
import { useLearningSnapshot } from "../state/LearningSession";
import { useAthensDate } from "../hooks/useAthensDate";
import { weeklyPlan } from "../utils/weeklyReview";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

export default function WeeklyReviewCard({ onOpen }: { onOpen: () => void }) {
  const snapshot = useLearningSnapshot(), today = useAthensDate();
  if (!snapshot.ready) return null;
  const plan = weeklyPlan(snapshot.activity, snapshot.weeklyReviews, today);
  const done = plan.filter(item => snapshot.weeklyReviews[item.id]).length;
  return <View style={styles.card}>
    <Text style={styles.title}>Η δεύτερη ευκαιρία της εβδομάδας</Text>
    <Text style={styles.body}>{plan.length ? `${done} / ${plan.length} απαντήθηκαν · Διόρθωσε παλιά λάθη και αύξησε την κατάκτηση γνώσης σου.` : "Τα λάθη αυτής της εβδομάδας θα είναι διαθέσιμα από την επόμενη Δευτέρα. Αν δεν έχεις εκκρεμή λάθη, δεν χρειάζεται quiz!"}</Text>
    <ActionButton secondary label={plan.length && done === plan.length ? "Δες το εβδομαδιαίο αποτέλεσμα" : plan.length ? "Πάμε για τη δεύτερη ευκαιρία" : "Πώς λειτουργεί;"} onPress={onOpen} />
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 18, gap: 10, marginVertical: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, backgroundColor: colors.surface },
  title: { color: colors.accentLight, fontSize: 18, lineHeight: 26, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 22 },
});
