import { Pressable, StyleSheet, Text, View } from "react-native";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { useLearningSnapshot } from "../state/LearningSession";
import ActionButton from "./ActionButton";
import { colors } from "../theme";

export default function ReviewActions({ onReview, onExplore }: { onReview: () => void; onWeeklyReview?: () => void; onExplore: () => void }) {
  const { model, today, ready } = useKnowledgeModel(), learning = useLearningSnapshot();
  const active = learning.knowledgeSession && !learning.knowledgeSession.completed && learning.knowledgeSession.date === today;
  return <View style={styles.card} testID="progress-reviews">
    <Text style={styles.label}>ΤΟ ΕΠΟΜΕΝΟ ΜΙΚΡΟ ΒΗΜΑ</Text>
    <Text style={styles.title}>{!ready ? "Φόρτωση επανάληψης…" : active ? "Συνέχισε εκεί που έμεινες" : model.due.length ? `${model.due.length} ερωτήσεις σε περιμένουν` : "Έτοιμος για μια νέα ανακάλυψη;"}</Text>
    <Text style={styles.body}>{active ? "Οι απαντήσεις σου έχουν κρατηθεί." : model.due.length ? "Έως 5 νέες περιπτώσεις, μία για κάθε έννοια. Χωρίς επανάληψη μαθήματος." : model.practice.length ? "Δεν έχεις εκκρεμή νέα δοκιμή. Τα μαθήματά σου παραμένουν ολοκληρωμένα." : "Ολοκλήρωσε το πρώτο σου μάθημα για να ξεκινήσεις τον χάρτη γνώσεών σου."}</Text>
    {ready ? <ActionButton label={active ? "Συνέχεια επανάληψης" : model.due.length ? "Ξεκίνα την επανάληψη" : "Εξερεύνησε τα μαθήματα"} onPress={active || model.due.length ? onReview : onExplore} /> : null}
    {ready && !active && !model.due.length && model.practice.length ? <Pressable style={styles.linkButton} accessibilityRole="button" onPress={onReview}><Text style={styles.link}>Λίγη ελεύθερη εξάσκηση →</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({ card: { padding: 20, gap: 12, borderRadius: 22, backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.borderStrong }, label: { color: colors.accentLight, fontSize: 10, lineHeight: 18, fontWeight: "800" }, title: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: "800" }, body: { color: colors.textBody, fontSize: 14, lineHeight: 23 }, linkButton: { minHeight: 44, justifyContent: "center" }, link: { color: colors.accentLight, fontSize: 13, lineHeight: 22, fontWeight: "700" } });
