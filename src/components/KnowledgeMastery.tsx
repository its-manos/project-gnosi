import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useKnowledgeModel } from "../hooks/useKnowledgeModel";
import { useLearningSnapshot } from "../state/LearningSession";
import { MASTERY_LABELS } from "../knowledge/model";
import { categories as learningCategories } from "../data/lessons";
import ActionButton from "./ActionButton";
import { MotionPressable } from "./HomeMotion";
import { ProgressBarFill } from "./ProgressMotion";
import { colors } from "../theme";

export default function KnowledgeMastery({ onOpen, compact = false, mapOnly = false, preview = false, detail = false, singleColumn = false, threeColumn = false }: { onOpen: () => void; compact?: boolean; mapOnly?: boolean; preview?: boolean; detail?: boolean; singleColumn?: boolean; threeColumn?: boolean }) {
  const { model, ready, today } = useKnowledgeModel(), learning = useLearningSnapshot();
  const [expanded, setExpanded] = useState(false);
  const [allSubjects, setAllSubjects] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [allDetailSubjects, setAllDetailSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const active = learning.knowledgeSession && !learning.knowledgeSession.completed && learning.knowledgeSession.date === today;
  const previewCollapsed = preview && mapOnly && !allSubjects;
  // Prioritize visible progress and keep catalogue order when categories tie.
  // The default view stays short even for an account with no mastered concepts.
  const rankedSubjects = detail
    ? model.categories.map((category, index) => ({ category, index }))
        .sort((a, b) => b.category.mastered - a.category.mastered
          || b.category.percent - a.category.percent || a.index - b.index)
        .map(item => item.category)
    : [];
  const focusedSubjects = allDetailSubjects ? rankedSubjects : rankedSubjects.slice(0, 4);
  const selectedSubject = focusedSubjects.find(category => category.id === selectedSubjectId);
  const remainingConcepts = selectedSubject
    ? Math.max(0, selectedSubject.total - selectedSubject.mastered) : 0;
  if (compact && (!ready || (!model.due.length && !active))) return null;
  return <View style={[styles.card, preview && mapOnly && styles.previewCard, detail && styles.detailCard]} testID="knowledge-mastery">
    <Text style={[styles.label, detail && styles.detailLabel]}>{detail ? "ΟΙ ΘΕΜΑΤΙΚΕΣ ΣΟΥ" : "Ο ΧΑΡΤΗΣ ΤΗΣ ΓΝΩΣΗΣ ΣΟΥ"}</Text>
    {mapOnly && !ready ? <Text style={styles.body}>Φόρτωση γνώσεων…</Text> : null}
    {!mapOnly ? <>
    <Text style={styles.heading}>{ready ? `${model.due.length} ερωτήσεις για επανάληψη` : "Φόρτωση γνώσεων…"}</Text>
    <Text style={styles.body}>Μικρές επαναλήψεις, γνώση που μένει. Έως 5 ερωτήσεις κάθε φορά.</Text>
    {ready ? <ActionButton label={active ? "Συνέχισε την επανάληψη" : model.due.length ? "Ώρα για επανάληψη" : "Επανάληψη και εξάσκηση"} onPress={onOpen} /> : null}
    </> : null}
    {!compact && ready ? <>
      {!detail && (!mapOnly || showHelp) ? <><Text style={styles.body}>Νέο → Μαθαίνεται → Οικείο → Κατακτημένο. Η κατάκτηση χρειάζεται τρεις σωστές δοκιμές σε διαφορετικές περιπτώσεις και ημέρες. Η ίδια ερώτηση δεν μετρά ξανά. Μετά την κατάκτηση δεν χρειάζεται τακτική επανάληψη.</Text></> : null}
      {detail ? (
        <View style={[styles.detailGrid, singleColumn && styles.detailGridSingle]} testID="knowledge-tile-grid">
          {focusedSubjects.map(category => {
            const emoji = learningCategories.find(item => item.id === category.id)?.emoji ?? "✦";
            const selected = selectedSubjectId === category.id;
            const complete = category.total > 0 && category.mastered === category.total;
            const progressing = category.percent > 0;
            return <MotionPressable key={category.id} testID={`knowledge-subject-${category.id}`}
              pressScale={0.985} onPress={() => setSelectedSubjectId(id => id === category.id ? null : category.id)}
              style={[styles.detailTile, singleColumn && styles.detailTileSingle,
                threeColumn && !singleColumn && styles.detailTileWide,
                progressing && styles.detailTileProgressing,
                complete && styles.detailTileComplete,
                selected && styles.detailTileSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected, expanded: selected }}
              accessibilityLabel={`${category.title}, ${category.mastered} από ${category.total} κατακτημένες έννοιες, πρόοδος επαναλήψεων ${category.percent}%`}
              accessibilityHint="Άνοιγμα σύντομης ανάλυσης της θεματικής">
              <View style={styles.tileTop}>
                <Text style={styles.tileEmoji}>{emoji}</Text>
                {complete
                  ? <Text style={styles.tileCompleted}>✓</Text>
                  : progressing ? <Text style={styles.tilePercent}>{category.percent}%</Text> : null}
              </View>
              <Text style={styles.tileTitle} numberOfLines={2}>{category.title}</Text>
              <Text style={[styles.tileCount, complete && styles.tileCountComplete]}>
                {category.mastered} / {category.total}
              </Text>
              <View style={styles.tileTrack} pointerEvents="none">
                <ProgressBarFill tone="knowledge" percent={category.percent} />
              </View>
            </MotionPressable>;
          })}
        </View>
      ) : (
        (mapOnly && !allSubjects ? model.categories.slice().sort((a, b) => b.percent - a.percent).slice(0, 3) : model.categories).map(category => <View key={category.id} style={[styles.row, previewCollapsed && styles.previewRow]}>
        <Text style={[styles.title, previewCollapsed && styles.previewTitle]}>{category.title} · {category.total ? `${category.percent}%` : "Χωρίς δοκιμές ακόμη"}</Text>
        <View style={[styles.track, previewCollapsed && styles.previewTrack]} accessible accessibilityRole="progressbar" accessibilityLabel={`Γνώσεις: ${category.title}`} accessibilityValue={{ min: 0, max: 100, now: category.percent }}><View style={[styles.fill, { width: `${category.percent}%` }]} /></View>
        {!previewCollapsed ? <Text style={styles.body}>{category.mastered} / {category.total} έννοιες κατακτημένες</Text> : null}
      </View>)
      )}
      {detail && selectedSubject ? (
        <View testID="knowledge-selected-subject" style={styles.subjectInsight}
          accessibilityLiveRegion="polite">
          <View style={styles.subjectInsightHeading}>
            <Text style={styles.subjectInsightTitle} numberOfLines={2}>{selectedSubject.title}</Text>
            <Text style={styles.subjectInsightValue}>{selectedSubject.mastered} / {selectedSubject.total}</Text>
          </View>
          <Text style={styles.subjectInsightCaption}>
            {selectedSubject.total === 0
              ? "Δεν υπάρχουν ακόμη καταγεγραμμένες έννοιες εδώ."
              : remainingConcepts === 0
                ? "Όλες οι έννοιες αυτής της θεματικής κατακτημένες."
                : selectedSubject.mastered === 0
                  ? "Επόμενος στόχος: η πρώτη κατακτημένη έννοια."
                  : `Απομένουν ${remainingConcepts} έννοιες για πλήρη κατάκτηση.`}
          </Text>
          <Text style={styles.subjectInsightNote}>
            Πρόοδος επαναλήψεων: {selectedSubject.percent}%
          </Text>
        </View>
      ) : null}
      {detail && rankedSubjects.length > 4 ? (
        <Pressable testID="knowledge-all-subjects" accessibilityRole="button"
          accessibilityState={{ expanded: allDetailSubjects }}
          style={({ pressed }) => [styles.showAll, pressed && styles.showAllPressed]}
          onPress={() => setAllDetailSubjects(value => !value)}>
          <Text style={styles.showAllText}>{allDetailSubjects ? "Λιγότερες θεματικές" : `Όλες οι θεματικές (${rankedSubjects.length})`}</Text>
          <Text style={styles.showAllArrow}>{allDetailSubjects ? "⌃" : "⌄"}</Text>
        </Pressable>
      ) : null}
      {mapOnly && !detail ? <Pressable style={styles.button} accessibilityRole="button" accessibilityState={{ expanded: allSubjects }} onPress={() => setAllSubjects(v => !v)}><Text style={styles.link}>{allSubjects ? (preview ? "Πίσω στη σύνοψη −" : "Λιγότερες θεματικές −") : (preview ? "Αναλυτική εικόνα +" : "Όλες οι θεματικές +")}</Text></Pressable> : null}
      {!detail && !previewCollapsed && (!mapOnly || showHelp) ? <Text style={styles.body}>Οι μπάρες αφορούν τις έννοιες για τις οποίες υπάρχουν διαφορετικές δοκιμές, όχι ολόκληρο το γνωστικό πεδίο. Δεν μετρούν άρθρα που διάβασες. Χωρίς αρκετά στοιχεία, η ολοκλήρωση διατηρείται και η κατάκτηση περιμένει.</Text> : !previewCollapsed && !detail ? <Text style={styles.body}>Γνώση από επαναλήψεις, όχι ποσοστό άρθρων που διάβασες.</Text> : null}
      {mapOnly && !previewCollapsed ? <Pressable style={[styles.button, detail && styles.detailDisclosure]} accessibilityRole="button" accessibilityState={{ expanded: showHelp }} onPress={() => setShowHelp(v => !v)}><Text style={styles.link}>{showHelp ? "Κλείσιμο επεξήγησης −" : "Πώς μετριέται η γνώση; +"}</Text></Pressable> : null}
      {!previewCollapsed ? <Pressable style={[styles.button, detail && styles.detailDisclosure]} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)}><Text style={styles.link}>{expanded ? "Κλείσιμο ενοτήτων −" : "Οι μαθησιακές ενότητές σου +"}</Text></Pressable> : null}
      {detail && showHelp ? <Text style={styles.detailHelp}>Η κατάκτηση απαιτεί τρεις σωστές δοκιμές σε διαφορετικές περιπτώσεις και ημέρες. Το διάβασμα μετρά στην Ανάγνωση, όχι στις Γνώσεις.</Text> : null}
      {expanded && !previewCollapsed ? model.topics.filter(t => t.state !== "new").map(topic => <View key={topic.id} style={styles.row}><Text style={styles.title}>{topic.title}</Text><Text style={styles.body}>{topic.status ?? MASTERY_LABELS[topic.state]}{topic.total ? ` · ${topic.mastered}/${topic.total} έννοιες` : ""}</Text></View>) : null}
      {expanded && !previewCollapsed && !model.practice.length ? <Text style={styles.body}>Οι πρώτες ενότητες θα εμφανιστούν μόλις ολοκληρώσεις ένα μάθημα ή quiz.</Text> : null}
    </> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 20, gap: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  previewCard: { padding: 14, gap: 8, borderRadius: 18 },
  detailCard: { backgroundColor: "transparent", borderWidth: 0, padding: 0, gap: 11 },
  detailLabel: { color: "#BDB1FB" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  detailGridSingle: { flexDirection: "column" },
  detailTile: {
    width: "48%", minWidth: 0, minHeight: 123,
    padding: 11, borderRadius: 15,
    backgroundColor: "#24273F", borderWidth: 1, borderColor: "#3E3C61",
    gap: 3,
  },
  detailTileProgressing: { borderColor: "#5F568C", backgroundColor: "#282840" },
  detailTileComplete: { borderColor: "#7D79A7", backgroundColor: "#302D49" },
  detailTileSelected: { borderColor: "#C2B5FF", backgroundColor: "#302C4B" },
  detailTileSingle: { width: "100%", minHeight: 112 },
  detailTileWide: { width: "31%" },
  tileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tileEmoji: { fontSize: 19, lineHeight: 26 },
  tilePercent: { color: "#B3A5FB", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  tileCompleted: { color: "#D8D0FF", fontSize: 19, lineHeight: 25, fontWeight: "900" },
  tileTitle: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: "800", minHeight: 19 },
  tileCount: { color: colors.textMuted, fontSize: 13, lineHeight: 19, fontWeight: "700", fontVariant: ["tabular-nums"] },
  tileCountComplete: { color: "#D1C6FF" },
  tileTrack: { height: 5, marginTop: 5, borderRadius: 5, backgroundColor: "#383B58", overflow: "hidden" },
  subjectInsight: {
    backgroundColor: "#27273F", borderWidth: 1, borderColor: "#514976",
    borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, gap: 5,
  },
  subjectInsightHeading: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  subjectInsightTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "800" },
  subjectInsightValue: { color: "#C4B8FF", fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  subjectInsightCaption: { color: colors.textBody, fontSize: 12, lineHeight: 18 },
  subjectInsightNote: { color: "#ADA3DD", fontSize: 11, lineHeight: 16 },
  showAll: {
    minHeight: 46, borderRadius: 13, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#22233A", borderWidth: 1, borderColor: "#414060",
  },
  showAllPressed: { backgroundColor: "#2F2C4A" },
  showAllText: { color: "#BEB3FF", fontSize: 13, fontWeight: "800" },
  showAllArrow: { color: "#BEB3FF", fontSize: 20 },
  detailDisclosure: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#44435D",
    marginTop: 3, paddingHorizontal: 2,
  },
  detailHelp: { color: colors.textBody, fontSize: 12, lineHeight: 19 },

  previewRow: { gap: 5, paddingVertical: 2 },
  previewTitle: { fontSize: 12, lineHeight: 18 },
  previewTrack: { height: 6 },
  label: { color: colors.accentLight, fontSize: 11, lineHeight: 18, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: "800" },
  title: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "700" },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 22 },
  row: { gap: 6, paddingVertical: 6 }, track: { height: 8, borderRadius: 8, backgroundColor: colors.border, overflow: "hidden" }, fill: { height: "100%", backgroundColor: colors.accent },
  button: { minHeight: 44, justifyContent: "center" }, link: { color: colors.accentLight, fontSize: 14, fontWeight: "700" },
});
