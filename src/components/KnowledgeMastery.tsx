import { asBuiltinQuestion, describeMistakeAnswer } from "../knowledge/mistakes";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMistakesModel } from "../hooks/useMistakesModel";
import ActionButton from "./ActionButton";
import { colors } from "../theme";
export default function KnowledgeMastery({ onOpen, compact = false }: { onOpen: () => void; compact?: boolean; mapOnly?: boolean; preview?: boolean; detail?: boolean; singleColumn?: boolean; threeColumn?: boolean }) {
  const { model, ready } = useMistakesModel();
  const [show, setShow] = useState(false);
  const [showRevised, setShowRevised] = useState(false);
  const [limit, setLimit] = useState(20);
  const listed = showRevised ? model.rows.filter(row => row.revised && row.available) : model.pending;
  if (compact && !model.pending.length) return null;
  return <View style={styles.card} testID="knowledge-mastery">
    <Text style={styles.heading}>{ready ? `${model.pending.length} για επανάληψη` : "Φόρτωση…"}</Text>
    <Text style={styles.body}>{model.total} συνολικά λάθη · {model.revised} διορθωμένα</Text>
    <Text style={styles.body}>Κάθε ερώτηση μετρά μία φορά ανά έκδοση. Μία σωστή απάντηση αρκεί, σε επανάληψη ή σε οποιοδήποτε κουίζ. Αν την ξαναχάσεις, επιστρέφει εδώ.</Text>
    {model.pending.length ? <ActionButton label="Επανάληψη λαθών →" onPress={onOpen} /> : <Text style={styles.body}>{model.total ? "Έχεις διορθώσει όλα τα διαθέσιμα λάθη σου." : "Τα λάθη από μαθήματα και κουίζ θα εμφανιστούν εδώ."}</Text>}
    {model.unavailable ? <Text style={styles.body}>{model.unavailable} από παλιότερες εκδόσεις διατηρούνται στο ιστορικό και δεν μπαίνουν στην επανάληψη.</Text> : null}
    {model.subjects.map(subject => <View key={subject.id} style={styles.subject}>
      <Text style={styles.title}>{subject.emoji} {subject.title}</Text>
      <Text style={styles.body}>{subject.revised} / {subject.total} διορθωμένα</Text>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={subject.title} accessibilityValue={{ min: 0, max: subject.total, now: subject.revised }}>
        <View style={[styles.fill, { width: `${subject.revised / subject.total * 100}%` }]} />
      </View>
    </View>)}
    {model.total ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: show }} style={styles.button} onPress={() => setShow(v => !v)}>
      <Text style={styles.link}>{show ? "Κλείσιμο λίστας ↑" : "Δες τα λάθη σου ↓"}</Text>
    </Pressable> : null}
    {show ? <View style={styles.filters}>
      {([false, true] as const).map(revised => <Pressable key={String(revised)} style={styles.button} accessibilityRole="button" accessibilityState={{ selected: showRevised === revised }} onPress={() => { setShowRevised(revised); setLimit(20); }}>
        <Text style={[styles.link, showRevised !== revised && styles.muted]}>{revised ? `Διορθωμένα (${model.revised})` : `Εκκρεμή (${model.pending.length})`}</Text>
      </Pressable>)}
    </View> : null}
    {show ? listed.slice(0, limit).map(row => <View key={`${row.questionId}:${row.version}`} style={styles.subject}>
      <Text style={styles.title}>{row.item!.question.prompt}</Text><Text style={styles.body}>{row.item!.title}</Text>
      <Text style={styles.body}>Η επιλογή σου: {describeMistakeAnswer(asBuiltinQuestion(row.item!.question), row.wrong!.value)}</Text>
    </View>) : null}
    {show && listed.length > limit ? <Pressable style={styles.button} accessibilityRole="button" onPress={() => setLimit(n => n + 20)}><Text style={styles.link}>Περισσότερα ({listed.length - limit}) ↓</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, muted: { color: colors.textMuted },
  card: { gap: 14 }, heading: { color: colors.text, fontSize: 20, fontWeight: "800" },
  title: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 22 },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  subject: { padding: 14, gap: 6, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  track: { height: 6, borderRadius: 6, backgroundColor: colors.border, overflow: "hidden" }, fill: { height: "100%", backgroundColor: colors.accent },
  button: { minHeight: 44, justifyContent: "center" }, link: { color: colors.accentLight, fontSize: 14, fontWeight: "800" },
});
