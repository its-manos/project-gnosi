import { StyleSheet, Text, View } from "react-native";
import { useLearningSnapshot } from "../state/LearningSession";
import { useAthensDate } from "../hooks/useAthensDate";
import { weeklyPlan } from "../utils/weeklyReview";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

export default function WeeklyReviewCard({ onOpen, hideWhenEmpty = false }: { onOpen: () => void; hideWhenEmpty?: boolean }) {
  const snapshot = useLearningSnapshot(), today = useAthensDate();
  if (!snapshot.ready) return null;
  const plan = weeklyPlan(snapshot.activity, snapshot.weeklyReviews, today);
  const done = plan.filter(item => snapshot.weeklyReviews[item.id]).length;
  if (hideWhenEmpty && !plan.length) return null;
  return <View style={styles.card}>
    <Text style={styles.title}>Η δεύτερη ευκαιρία σου</Text>
    <Text style={styles.body}>{plan.length ? `${done} / ${plan.length} απαντήθηκαν` : "Νέες ερωτήσεις από λάθη σου κάθε Δευτέρα."}</Text>
    <ActionButton secondary label={plan.length && done === plan.length ? "Δες το αποτέλεσμα" : done > 0 ? "Συνέχισε" : plan.length ? "Ξεκίνα" : "Πώς λειτουργεί;"} onPress={onOpen} />
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 18, gap: 10, marginVertical: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, backgroundColor: colors.surface },
  title: { color: colors.accentLight, fontSize: 18, lineHeight: 26, fontWeight: "800" },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 22 },
});
