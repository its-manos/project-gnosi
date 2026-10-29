import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Lesson } from "../data/lessons";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import { colors } from "../theme";
import { getInlineQuestionCount } from "../utils/lessonProgress";

type Props = { lesson: Lesson; score: number; onHome: () => void; onReadAgain: () => void };

export default function ResultsScreen({ lesson, score, onHome, onReadAgain }: Props) {
  const totalQuestions = getInlineQuestionCount(lesson);
  const perfectScore = totalQuestions > 0 && score === totalQuestions;
  const percentage = totalQuestions > 0
    ? Math.round((score / totalQuestions) * 100)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" />
      <View style={styles.container}>
        <Text style={styles.emoji}>{perfectScore ? "🏆" : "✨"}</Text>
        <Text style={styles.eyebrow}>ΜΑΘΗΜΑ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
        <Text style={styles.title}>
          {perfectScore ? "Εξαιρετικά!" : score >= 2 ? "Πολύ καλή προσπάθεια!" : "Κάθε μέρα μαθαίνεις κάτι νέο."}
        </Text>
        <Text style={styles.body}>Ολοκλήρωσες το μάθημα «{lesson.title}».</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.muted}>Η βαθμολογία σου</Text>
          <Text style={styles.score}>{score} / {totalQuestions}</Text>
          <Text style={styles.meta}>{percentage}% σωστές απαντήσεις</Text>
        </View>
        <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} />
        <ActionButton label="Ξαναδιάβασε το άρθρο" onPress={onReadAgain} secondary />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  container: { alignItems: "center", paddingTop: 50 },
  emoji: { fontSize: 64, marginBottom: 24 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 29, lineHeight: 36, fontWeight: "900", textAlign: "center", marginBottom: 14 },
  body: { color: "#A7ACC1", fontSize: 14, lineHeight: 23, textAlign: "center" },
  scoreCard: { width: "100%", alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 22, padding: 26, marginTop: 28, marginBottom: 18 },
  muted: { color: "#979CB3", fontSize: 12 },
  score: { color: colors.accentLight, fontSize: 52, fontWeight: "900", marginVertical: 6 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
