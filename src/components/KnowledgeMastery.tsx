import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { asBuiltinQuestion, describeMistakeAnswer } from "../knowledge/mistakes";
import { useMistakesModel } from "../hooks/useMistakesModel";
import { colors } from "../theme";
import ActionButton from "./ActionButton";
import { MotionView } from "./HomeMotion";
import { LearningSectionHeading, SubjectInsightPanel, SubjectShowAll } from "./LearningDetailSections";
import SubjectProgressTile from "./SubjectProgressTile";

type Props = {
  onOpen: () => void;
  compact?: boolean;
  mapOnly?: boolean;
  preview?: boolean;
  detail?: boolean;
  singleColumn?: boolean;
  threeColumn?: boolean;
  subjectLimit?: number;
};

const VISIBLE_SUBJECTS = 4;
const HISTORY_PAGE = 12;

/** The knowledge/reading detail pages share category geometry and progressive disclosure.
 * Saved mistake state and its one-correction rule are not altered by this UI.
 */
export default function KnowledgeMastery({
  onOpen, compact = false, detail = false, singleColumn = false, threeColumn = false,
  subjectLimit = VISIBLE_SUBJECTS,
}: Props) {
  const { model, ready } = useMistakesModel();
  const [allSubjects, setAllSubjects] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showRevised, setShowRevised] = useState(false);
  const [limit, setLimit] = useState(HISTORY_PAGE);

  const subjects = model.subjects.slice().sort((a, b) =>
    b.total - a.total || b.revised - a.revised);
  const visible = detail && !allSubjects ? subjects.slice(0, subjectLimit) : subjects;
  const selected = visible.find(subject => subject.id === selectedId);
  const listed = showRevised
    ? model.rows.filter(row => row.revised && row.available)
    : model.pending;

  if (compact && !model.pending.length) return null;
  return <View style={[styles.section, !detail && styles.inline]} testID="knowledge-mastery">
    <LearningSectionHeading title="ΟΙ ΘΕΜΑΤΙΚΕΣ ΣΟΥ" tone="knowledge" />
    {subjects.length ? <>
      <View style={[styles.grid, singleColumn && styles.singleGrid]}>
        {visible.map(subject => {
          const percent = Math.round(subject.revised / Math.max(1, subject.total) * 100);
          return <SubjectProgressTile
            key={subject.id} testID={"knowledge-subject-" + subject.id}
            tone="knowledge" title={subject.title} emoji={subject.emoji}
            completed={subject.revised} total={subject.total} percent={percent}
            selected={selectedId === subject.id}
            singleColumn={singleColumn} threeColumn={threeColumn} dense={detail}
            onPress={() => setSelectedId(current => current === subject.id ? null : subject.id)}
            accessibilityLabel={subject.title + ", " + subject.revised + " από " + subject.total + " διορθωμένα λάθη"} />;
        })}
      </View>
      {selected ? <MotionView entranceDelay={0}>
        <SubjectInsightPanel testID="knowledge-selected-subject" tone="knowledge"
          title={selected.title} current={selected.revised} total={selected.total}
          caption={selected.revised === selected.total
            ? "Έχεις διορθώσει όλα τα λάθη σου σε αυτή τη θεματική."
            : selected.revised === 0
              ? "Τα λάθη σου εδώ περιμένουν την πρώτη επανάληψη."
              : "Απομένουν " + (selected.total - selected.revised) + " λάθη για διόρθωση."} />
      </MotionView> : null}
      {detail && subjects.length > subjectLimit ? <SubjectShowAll
        testID="knowledge-all-subjects" tone="knowledge" expanded={allSubjects}
        count={subjects.length} onPress={() => {
          setAllSubjects(value => !value);
          setSelectedId(null);
        }} /> : null}
    </> : <Text style={styles.empty}>{ready
      ? "Τα λάθη από μαθήματα και κουίζ θα εμφανιστούν εδώ."
      : "Φόρτωση γνώσεων…"}</Text>}

    {ready && model.pending.length > 0 ? <MotionView entranceDelay={90} style={styles.review}>
      <View style={styles.reviewCopy}>
        <Text style={styles.reviewNumber}>{model.pending.length}</Text>
        <View style={styles.reviewLabels}>
          <Text style={styles.reviewTitle}>Για επανάληψη</Text>
          <Text style={styles.reviewHint}>Μία σωστή απάντηση αρκεί.</Text>
        </View>
      </View>
      <ActionButton label="Επανάληψη →" onPress={onOpen} style={styles.reviewButton} />
    </MotionView> : null}

    {ready && model.total > 0 ? <>
      <Pressable testID="knowledge-history-toggle" onPress={() => setShowHistory(value => !value)}
        accessibilityRole="button" accessibilityState={{ expanded: showHistory }}
        style={({ pressed }) => [styles.historyToggle, pressed && styles.pressed]}>
        <Text style={styles.historyTitle}>Ιστορικό λαθών ({model.total})</Text>
        <Text style={styles.chevron}>{showHistory ? "⌃" : "⌄"}</Text>
      </Pressable>
      {showHistory ? <MotionView entranceDelay={0} style={styles.history}>
        {model.unavailable > 0 ? <Text style={styles.note}>
          {model.unavailable} λάθη από παλιότερες εκδόσεις παραμένουν στο ιστορικό, αλλά δεν εμφανίζονται για επανάληψη.
        </Text> : null}
        <View style={styles.filters}>
          {([false, true] as const).map(revised => <Pressable key={String(revised)}
            accessibilityRole="button" accessibilityState={{ selected: revised === showRevised }}
            style={[styles.filter, revised === showRevised && styles.filterSelected]}
            onPress={() => { setShowRevised(revised); setLimit(HISTORY_PAGE); }}>
            <Text style={[styles.filterText, revised === showRevised && styles.filterTextSelected]}>
              {revised ? "Διορθωμένα (" + model.revised + ")" : "Εκκρεμή (" + model.pending.length + ")"}
            </Text>
          </Pressable>)}
        </View>
        {listed.length === 0 ? <Text style={styles.empty}>Δεν υπάρχουν λάθη σε αυτή την ομάδα.</Text> : null}
        {listed.slice(0, limit).map(row => <View
          key={row.questionId + ":" + row.version} style={styles.historyRow}>
          <Text style={styles.question}>{row.item!.question.prompt}</Text>
          <Text style={styles.context}>{row.item!.title}</Text>
          <Text style={styles.answer}>Η επιλογή σου: {describeMistakeAnswer(asBuiltinQuestion(row.item!.question), row.wrong!.value)}</Text>
        </View>)}
        {listed.length > limit ? <Pressable accessibilityRole="button" style={styles.more}
          onPress={() => setLimit(value => value + HISTORY_PAGE)}>
          <Text style={styles.moreText}>Περισσότερα ({listed.length - limit}) ↓</Text>
        </Pressable> : null}
      </MotionView> : null}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  inline: { marginTop: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  singleGrid: { flexDirection: "column" },
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 19, paddingVertical: 6 },
  review: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1, borderColor: "#49436B",
    backgroundColor: "#24263E", paddingHorizontal: 12, paddingVertical: 8,
  },
  reviewCopy: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  reviewNumber: { color: "#C2B6FF", fontSize: 23, lineHeight: 29, fontWeight: "900", fontVariant: ["tabular-nums"] },
  reviewLabels: { flex: 1, gap: 1 },
  reviewTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
  reviewHint: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  reviewButton: { marginTop: 0, minHeight: 44, paddingVertical: 10, paddingHorizontal: 12 },
  historyToggle: {
    minHeight: 46, borderRadius: 13, backgroundColor: "#22233A",
    borderWidth: 1, borderColor: "#414060", paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  historyTitle: { color: "#BEB3FF", fontSize: 13, fontWeight: "800" },
  chevron: { color: "#BEB3FF", fontSize: 20 },
  pressed: { backgroundColor: "#302D4C" },
  history: { gap: 9 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  filters: { flexDirection: "row", gap: 8 },
  filter: {
    flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#22263A",
    borderWidth: 1, borderColor: "#383B57",
  },
  filterSelected: { backgroundColor: "#342E50", borderColor: "#71689D" },
  filterText: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textAlign: "center" },
  filterTextSelected: { color: "#D8CFFF" },
  historyRow: { padding: 12, gap: 5, borderRadius: 13,
    backgroundColor: "#1D2235", borderColor: "#38384F", borderWidth: 1 },
  question: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: "800" },
  context: { color: "#C3B8F1", fontSize: 11, lineHeight: 16 },
  answer: { color: colors.textBody, fontSize: 12, lineHeight: 19 },
  more: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  moreText: { color: colors.accentLight, fontSize: 13, fontWeight: "800" },
});
