import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import {
  CHALLENGE_DIFFICULTIES,
  DAILY_CHALLENGE_TOPICS,
  type ChallengeDifficulty,
  type DailyChallengePreferences,
} from "../data/dailyChallengeTopics";
import { colors } from "../theme";

type Props = {
  initialPreferences: DailyChallengePreferences;
  isLoading: boolean;
  onSave: (preferences: DailyChallengePreferences) => Promise<boolean>;
  onCancel: () => void;
};

export default function DailyChallengePreferencesScreen({
  initialPreferences,
  isLoading,
  onSave,
  onCancel,
}: Props) {
  const [topicIds, setTopicIds] = useState<string[]>(initialPreferences.topicIds);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>(initialPreferences.difficulty);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);


  function toggleTopic(topicId: string) {
    setSaveError(false);
    setTopicIds((current) => {
      if (current.includes(topicId)) {
        return current.length > 3 ? current.filter((id) => id !== topicId) : current;
      }
      return current.length < 5 ? [...current, topicId] : current;
    });
  }

  async function handleSave() {
    if (topicIds.length < 3 || topicIds.length > 5 || isSaving || isLoading) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const saved = await onSave({ topicIds, difficulty });
      if (!saved) setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onCancel} backLabel="ΠΙΣΩ" />

      <Text style={styles.eyebrow}>Η ΔΙΚΗ ΣΟΥ ΠΡΟΚΛΗΣΗ</Text>
      <Text style={styles.title}>Παίξε με τους δικούς σου όρους.</Text>
      <Text style={styles.body}>
        Διάλεξε 3 έως 5 αγαπημένα θέματα και τη δυσκολία που προτιμάς. Οι επιλογές αποθηκεύονται στη συσκευή και συγχρονίζονται όταν είσαι συνδεδεμένος σε λογαριασμό.
      </Text>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentLight} size="large" />
          <Text style={styles.helper}>Φόρτωση προτιμήσεων…</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Τα θέματα που σε ενδιαφέρουν</Text>
            <Text style={styles.counter}>{topicIds.length} / 5</Text>
          </View>
          <Text style={styles.helper}>Επίλεξε τουλάχιστον 3 θέματα.</Text>

          <View style={styles.topicGrid}>
            {DAILY_CHALLENGE_TOPICS.map((topic) => {
              const selected = topicIds.includes(topic.id);
              const disabled = !selected && topicIds.length >= 5;
              return (
                <Pressable
                  key={topic.id}
                  style={[styles.topicCard, selected && styles.topicCardSelected, disabled && styles.topicCardDisabled]}
                  onPress={() => toggleTopic(topic.id)}
                  disabled={disabled || isSaving}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: disabled || isSaving }}
                  accessibilityLabel={`${topic.title}. ${topic.description}`}
                >
                  <View style={styles.topicTopRow}>
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                    <View style={[styles.checkmark, selected && styles.checkmarkSelected]}>
                      {selected ? <Text style={styles.checkmarkText}>✓</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Επίπεδο δυσκολίας</Text>
          <View style={styles.difficultyList}>
            {CHALLENGE_DIFFICULTIES.map((item) => {
              const selected = difficulty === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.difficultyOption, selected && styles.difficultyOptionSelected]}
                  onPress={() => { setDifficulty(item.id); setSaveError(false); }}
                  disabled={isSaving}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: isSaving }}
                >
                  <View style={styles.difficultyCopy}>
                    <Text style={styles.difficultyTitle}>{item.title}</Text>
                    <Text style={styles.topicDescription}>{item.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.helper}>
            Θα προτιμώνται οι ερωτήσεις που ταιριάζουν και στα θέματα και στη δυσκολία σου. Αν δεν υπάρχουν αρκετές, η πρόκληση συμπληρώνεται με επιπλέον ερωτήσεις ώστε να έχει πάντα 7.
          </Text>
          {saveError ? (
            <Text style={styles.errorText}>Δεν αποθηκεύτηκαν οι αλλαγές. Έλεγξε τον διαθέσιμο χώρο στη συσκευή και δοκίμασε ξανά.</Text>
          ) : null}

          <ActionButton
            label={isSaving ? "Αποθήκευση…" : "Αποθήκευση προτιμήσεων"}
            onPress={() => { void handleSave(); }}
            disabled={isSaving || topicIds.length < 3 || topicIds.length > 5}
          />
          <ActionButton label="Ακύρωση" onPress={onCancel} secondary disabled={isSaving} />
          <Text style={styles.footerNote}>
            Η αλλαγή προτιμήσεων δεν αλλάζει μια πρόκληση που έχει ήδη ξεκινήσει ή ολοκληρωθεί. Θα εφαρμοστεί στην επόμενη νέα πρόκληση.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, lineHeight: 16, marginBottom: 10 },
  title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: "900", marginBottom: 12 },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 12, marginBottom: 8 },
  counter: { color: colors.accentLight, fontSize: 12, fontWeight: "900" },
  helper: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 23 },
  topicCard: { width: "48%", minHeight: 137, flexGrow: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 12 },
  topicCardSelected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  topicCardDisabled: { opacity: 0.45 },
  topicTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  topicEmoji: { fontSize: 23 },
  checkmark: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  checkmarkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmarkText: { color: colors.background, fontSize: 12, fontWeight: "900" },
  topicTitle: { color: colors.text, fontSize: 13, fontWeight: "900", marginBottom: 5 },
  topicDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  difficultyList: { gap: 9, marginBottom: 16 },
  difficultyOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 15, padding: 15, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 15 },
  difficultyOptionSelected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  difficultyCopy: { flex: 1, gap: 4 },
  difficultyTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  radioOuter: { width: 21, height: 21, borderWidth: 1.5, borderColor: colors.textMuted, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: colors.accentLight },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accentLight },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 12 },
  footerNote: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 16 },
  loading: { paddingVertical: 80, alignItems: "center", gap: 14 },
});
